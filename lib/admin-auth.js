import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id,first_name,last_name,avatar_url,is_superadmin").eq("id", user.id).maybeSingle();
  if (!profile?.is_superadmin) redirect("/login?error=This%20account%20does%20not%20have%20admin%20access");
  return { user, profile };
}
