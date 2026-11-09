import Link from "next/link";
import { signOut } from "../app/auth/actions";

export default function AdminShell({ profile, children }) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Administrator";
  return <div className="admin-shell"><aside className="sidebar"><Link className="admin-brand" href="/admin"><b>CS</b><span>CONTROL<br/>ROOM</span></Link><div className="status"><i/> SYSTEM LIVE</div><nav>
    <small>OBSERVE</small><Link href="/admin">Overview</Link><Link href="/admin/generations">Requests + responses</Link><Link href="/admin/prompts">Prompt chains</Link>
    <small>CONTENT</small><Link href="/admin/media">AI media</Link><Link href="/admin/images">Images</Link><Link href="/admin/manage/examples">Generation examples</Link><Link href="/admin/manage/terms">Terms</Link>
    <small>SYSTEM</small><Link href="/admin/manage/providers">LLM providers</Link><Link href="/admin/manage/models">LLM models</Link><Link href="/admin/users">Profiles + access</Link><Link href="/admin/ratings">Ratings</Link>
  </nav><div className="admin-user"><div className="avatar">{name.charAt(0)}</div><span><b>{name}</b><small>SUPERADMIN</small></span></div><form action={signOut}><button className="signout">Sign out</button></form></aside><div className="admin-main">{children}</div></div>;
}
