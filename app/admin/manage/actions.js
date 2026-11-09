"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "../../../lib/admin-auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import { getResourceConfig } from "../../../lib/week7-resources";

function parse(resource, formData) {
  const config = getResourceConfig(resource);
  if (!config) throw new Error("Unknown resource");
  const values = {};
  for (const field of config.fields) {
    const raw = formData.get(field.name);
    if (field.type === "checkbox") values[field.name] = raw === "on";
    else values[field.name] = raw?.toString().trim() || null;
    if (field.required && !values[field.name]) throw new Error(`${field.label} is required`);
    if (field.maxLength && values[field.name]?.length > field.maxLength) throw new Error(`${field.label} is too long`);
  }
  return { config, values };
}

export async function saveResource(formData) {
  await requireSuperadmin();
  const resource = formData.get("resource")?.toString();
  const id = formData.get("id")?.toString();
  try {
    const { config, values } = parse(resource, formData);
    const db = createAdminClient();
    const query = id ? db.from(config.table).update(values).eq("id", id) : db.from(config.table).insert(values);
    const { error } = await query;
    if (error) throw error;
  } catch (error) {
    redirect(`/admin/manage/${resource}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/admin/manage/${resource}`);
  redirect(`/admin/manage/${resource}?saved=1`);
}

export async function deleteResource(formData) {
  await requireSuperadmin();
  const resource = formData.get("resource")?.toString();
  const id = formData.get("id")?.toString();
  const config = getResourceConfig(resource);
  if (!config || !id) redirect("/admin");
  const { error } = await createAdminClient().from(config.table).delete().eq("id", id);
  if (error) redirect(`/admin/manage/${resource}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/manage/${resource}`);
  redirect(`/admin/manage/${resource}?deleted=1`);
}
