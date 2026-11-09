import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { signInWithGoogle } from "../auth/actions";

export default async function LoginPage({ searchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle();
    if (data?.is_superadmin) redirect("/tool");
  }
  const params = await searchParams;
  return <main className="login-page"><section className="login-panel"><div className="eyebrow">RESTRICTED SYSTEM</div><div className="login-mark">PC<span>STUDIO</span></div><h1>Build better prompt chains.</h1><p>Create, edit, reorder, and run multi-step AI workflows. Authorized superadmins only.</p>{params?.error&&<div className="alert">{params.error}</div>}<form action={signInWithGoogle}><button className="primary wide">Continue with Google <b>→</b></button></form><small>Access is checked against the protected superadmin field after login.</small></section><aside className="login-visual"><div className="radar"><i/><i/><i/><span>CHAIN<br/>READY</span></div><p>Prompt Chain Studio<br/>Generation Workspace</p></aside></main>;
}
