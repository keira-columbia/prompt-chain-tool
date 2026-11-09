"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "../../../lib/admin-auth";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function updateMix(formData) {
  await requireSuperadmin();
  const fields = ["relevance_weight", "humor_weight", "novelty_weight"];
  const values = Object.fromEntries(fields.map(name => [name, Number(formData.get(name))]));
  if (Object.values(values).some(value => !Number.isFinite(value) || value < 0 || value > 100)) redirect("/admin/prompts?error=Weights%20must%20be%20between%200%20and%20100");
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  if (total !== 100) redirect("/admin/prompts?error=Weights%20must%20add%20up%20to%20100");
  const mixId = Number(formData.get("mix_id")) || 1;
  const { error } = await createAdminClient().from("prompt_chain_mix").update({ ...values, updated_at: new Date().toISOString() }).eq("id", mixId);
  if (error) redirect(`/admin/prompts?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/prompts");
  redirect("/admin/prompts?saved=1");
}
