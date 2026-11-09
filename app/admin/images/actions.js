"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "../../../lib/admin-auth";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function saveImage(formData) {
  const { user } = await requireSuperadmin();
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const altText = formData.get("alt_text")?.toString().trim();
  const file = formData.get("image");
  if (!name) redirect("/admin/images?error=Image%20name%20is%20required");
  const db = createAdminClient();
  const values = { name, alt_text: altText || null, updated_at: new Date().toISOString() };
  if (file?.size) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) redirect("/admin/images?error=Use%20a%20JPG%2C%20PNG%2C%20or%20WebP%20under%205MB");
    const path = `admin/${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
    const { error: uploadError } = await db.storage.from("campus-moments").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
    if (uploadError) redirect(`/admin/images?error=${encodeURIComponent(uploadError.message)}`);
    Object.assign(values, { storage_path: path, public_url: db.storage.from("campus-moments").getPublicUrl(path).data.publicUrl, created_by: user.id });
  }
  if (!id && !values.public_url) redirect("/admin/images?error=Choose%20an%20image%20to%20upload");
  const { error } = id ? await db.from("images").update(values).eq("id", id) : await db.from("images").insert(values);
  if (error) redirect(`/admin/images?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/images"); redirect("/admin/images?saved=1");
}

export async function deleteImage(formData) {
  await requireSuperadmin(); const id = formData.get("id")?.toString(); const db = createAdminClient();
  const { data } = await db.from("images").select("storage_path").eq("id", id).maybeSingle();
  if (data?.storage_path) await db.storage.from("campus-moments").remove([data.storage_path]);
  const { error } = await db.from("images").delete().eq("id", id);
  if (error) redirect(`/admin/images?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/images"); redirect("/admin/images?deleted=1");
}
