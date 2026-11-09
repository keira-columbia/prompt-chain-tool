"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "../../../lib/admin-auth";
import { generateAdminMedia } from "../../../lib/gemini";
import { createAdminClient } from "../../../lib/supabase/admin";

const zones = ["Library","Dorms","Dining","Classroom","Subway","City","Other"];

export async function createMedia(formData) {
  const { user } = await requireSuperadmin();
  const admin = createAdminClient();
  const title = formData.get("title")?.toString().trim();
  const zone = formData.get("zone")?.toString();
  const context = formData.get("context")?.toString().trim() || null;
  const photo = formData.get("photo");
  if (!title || title.length > 70 || !zones.includes(zone) || !photo?.size) redirect("/admin/media/new?error=Complete%20all%20required%20fields");
  if (!['image/jpeg','image/png','image/webp'].includes(photo.type) || photo.size > 5*1024*1024) redirect("/admin/media/new?error=Use%20a%20JPG%2C%20PNG%2C%20or%20WebP%20under%205MB");
  const buffer = Buffer.from(await photo.arrayBuffer());
  const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
  const imagePath = `${user.id}/admin-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from("campus-moments").upload(imagePath, buffer, { contentType: photo.type });
  if (uploadError) redirect(`/admin/media/new?error=${encodeURIComponent(uploadError.message)}`);
  try {
    const generated = await generateAdminMedia(buffer, photo.type, context);
    const imageUrl = admin.storage.from("campus-moments").getPublicUrl(imagePath).data.publicUrl;
    const { data: moment, error } = await admin.from("moments").insert({ user_id:user.id,title,zone,context,image_path:imagePath,image_url:imageUrl,image_description:generated.description,description_prompt:generated.descriptionPrompt,description_model:generated.model }).select("id").single();
    if (error) throw error;
    const { error: captionError } = await admin.from("captions").insert(generated.captions.map(caption_text=>({ moment_id:moment.id,creator_id:user.id,caption_text,generation_prompt:generated.captionPrompt,generation_model:generated.model })));
    if (captionError) throw captionError;
    revalidatePath("/admin"); revalidatePath("/admin/media");
    redirect(`/admin/media/${moment.id}?created=1`);
  } catch (error) {
    await admin.storage.from("campus-moments").remove([imagePath]);
    redirect(`/admin/media/new?error=${encodeURIComponent(error.message)}`);
  }
}

export async function updateMedia(formData) {
  await requireSuperadmin();
  const admin=createAdminClient();
  const id=formData.get("id")?.toString(); const title=formData.get("title")?.toString().trim(); const zone=formData.get("zone")?.toString(); const context=formData.get("context")?.toString().trim()||null;
  if(!id||!title||title.length>70||!zones.includes(zone)) redirect(`/admin/media/${id}?error=Check%20the%20title%20and%20zone`);
  const {error}=await admin.from("moments").update({title,zone,context}).eq("id",id);
  if(error) redirect(`/admin/media/${id}?error=${encodeURIComponent(error.message)}`);
  const captions=[0,1,2,3].map(index=>({id:formData.get(`captionId${index}`)?.toString(),caption_text:formData.get(`caption${index}`)?.toString().trim()})).filter(item=>item.id&&item.caption_text);
  for(const caption of captions) await admin.from("captions").update({caption_text:caption.caption_text}).eq("id",caption.id).eq("moment_id",id);
  revalidatePath("/admin"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${id}`);
  redirect(`/admin/media/${id}?saved=1`);
}

export async function deleteMedia(formData) {
  await requireSuperadmin();
  const admin=createAdminClient(); const id=formData.get("id")?.toString();
  const {data}=await admin.from("moments").select("image_path").eq("id",id).maybeSingle();
  if(data?.image_path) await admin.storage.from("campus-moments").remove([data.image_path]);
  const {error}=await admin.from("moments").delete().eq("id",id);
  if(error) redirect(`/admin/media/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin"); revalidatePath("/admin/media"); redirect("/admin/media?deleted=1");
}
