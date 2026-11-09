import ToolShell from "../../components/ToolShell";
import { requireSuperadmin } from "../../lib/admin-auth";

export default async function ToolLayout({ children }) {
  const { profile } = await requireSuperadmin();
  return <ToolShell profile={profile}>{children}</ToolShell>;
}
