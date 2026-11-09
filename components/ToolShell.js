import Link from "next/link";
import { signOut } from "../app/auth/actions";
import ThemePicker from "./ThemePicker";

export default function ToolShell({ profile, children }) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Administrator";
  return <div className="admin-shell"><aside className="sidebar"><Link className="admin-brand" href="/tool"><b>PC</b><span>PROMPT CHAIN<br/>STUDIO</span></Link><div className="status"><i/> SUPERADMIN TOOL</div><nav><small>BUILD</small><Link href="/tool">Prompt chains</Link><Link href="/tool/generations">Generated media</Link></nav><ThemePicker/><div className="admin-user"><div className="avatar">{name.charAt(0)}</div><span><b>{name}</b><small>SUPERADMIN</small></span></div><form action={signOut}><button className="signout">Sign out</button></form></aside><div className="admin-main">{children}</div></div>;
}
