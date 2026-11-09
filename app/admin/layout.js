import AdminShell from "../../components/AdminShell";
import { requireSuperadmin } from "../../lib/admin-auth";

export default async function ProtectedAdminLayout({ children }) {
  const { profile } = await requireSuperadmin();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
