"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "../../lib/admin-auth";
import { createAdminClient } from "../../lib/supabase/admin";
import { MODEL, runPromptStep } from "../../lib/generate-chain";

const back = (params = "") => redirect(`/tool${params ? `?${params}` : ""}`);

export async function createChain(formData) {
  await requireSuperadmin();
  const db = createAdminClient();
  const { data, error } = await db.from("prompt_chains").insert({ name: String(formData.get("name") || "").trim(), description: String(formData.get("description") || "").trim(), is_active: true }).select("id").single();
  if (error) back(`error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tool"); back(`chain=${data.id}&saved=chain`);
}

export async function updateChain(formData) {
  await requireSuperadmin();
  const db = createAdminClient(); const id = String(formData.get("id"));
  const { error } = await db.from("prompt_chains").update({ name: String(formData.get("name") || "").trim(), description: String(formData.get("description") || "").trim(), is_active: formData.get("is_active") === "on" }).eq("id", id);
  if (error) back(`chain=${id}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tool"); back(`chain=${id}&saved=chain`);
}

export async function deleteChain(formData) {
  await requireSuperadmin(); const db = createAdminClient();
  const { error } = await db.from("prompt_chains").delete().eq("id", String(formData.get("id")));
  if (error) back(`error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tool"); back("deleted=chain");
}

export async function saveStep(formData) {
  await requireSuperadmin(); const db = createAdminClient();
  const id = String(formData.get("id") || ""); const chain = String(formData.get("prompt_chain_id"));
  const values = { prompt_chain_id: chain, name: String(formData.get("name") || "").trim(), instruction: String(formData.get("instruction") || "").trim() };
  let error;
  if (id) ({ error } = await db.from("prompt_chain_steps").update(values).eq("id", id));
  else {
    const { data } = await db.from("prompt_chain_steps").select("step_order").eq("prompt_chain_id", chain).order("step_order", { ascending: false }).limit(1).maybeSingle();
    ({ error } = await db.from("prompt_chain_steps").insert({ ...values, step_order: (data?.step_order || 0) + 1 }));
  }
  if (error) back(`chain=${chain}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tool"); back(`chain=${chain}&saved=step`);
}

export async function deleteStep(formData) {
  await requireSuperadmin(); const db = createAdminClient(); const chain = String(formData.get("prompt_chain_id"));
  const { error } = await db.from("prompt_chain_steps").delete().eq("id", String(formData.get("id")));
  if (error) back(`chain=${chain}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/tool"); back(`chain=${chain}&deleted=step`);
}

export async function moveStep(formData) {
  await requireSuperadmin(); const db = createAdminClient(); const chain = String(formData.get("prompt_chain_id")); const id = String(formData.get("id")); const direction = String(formData.get("direction"));
  const { data: steps, error } = await db.from("prompt_chain_steps").select("id,step_order").eq("prompt_chain_id", chain).order("step_order");
  if (error) back(`chain=${chain}&error=${encodeURIComponent(error.message)}`);
  const index = steps.findIndex((step) => step.id === id); const target = direction === "up" ? index - 1 : index + 1;
  if (index >= 0 && target >= 0 && target < steps.length) {
    [steps[index], steps[target]] = [steps[target], steps[index]];
    for (let i = 0; i < steps.length; i++) await db.from("prompt_chain_steps").update({ step_order: 1000 + i }).eq("id", steps[i].id);
    for (let i = 0; i < steps.length; i++) await db.from("prompt_chain_steps").update({ step_order: i + 1 }).eq("id", steps[i].id);
  }
  revalidatePath("/tool"); back(`chain=${chain}&saved=order`);
}

export async function generateWithChain(formData) {
  const { user } = await requireSuperadmin(); const db = createAdminClient(); const chain = String(formData.get("prompt_chain_id")); const input = String(formData.get("input") || "").trim();
  const { data: steps, error } = await db.from("prompt_chain_steps").select("*").eq("prompt_chain_id", chain).order("step_order");
  if (error || !steps?.length) back(`chain=${chain}&error=${encodeURIComponent(error?.message || "Add at least one step first.")}`);
  const { data: request, error: requestError } = await db.from("generation_requests").insert({ user_id: user.id, prompt_chain_id: chain, status: "running", input_text: input }).select("id").single();
  if (requestError) back(`chain=${chain}&error=${encodeURIComponent(requestError.message)}`);
  try {
    let output = input;
    for (const step of steps) output = await runPromptStep(step.instruction, output);
    await db.from("llm_responses").insert({ generation_request_id: request.id, status: "succeeded", response_text: output });
    await db.from("generation_requests").update({ status: "succeeded", completed_at: new Date().toISOString() }).eq("id", request.id);
  } catch (error) {
    await db.from("llm_responses").insert({ generation_request_id: request.id, status: "failed", response_text: error.message });
    await db.from("generation_requests").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", request.id);
    back(`chain=${chain}&error=${encodeURIComponent(error.message)}&model=${MODEL}`);
  }
  revalidatePath("/tool/generations");
  redirect(`/tool/generations?chain=${chain}&generated=1`);
}
