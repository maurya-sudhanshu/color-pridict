import AccessDenied from "@/components/AccessDenied";
import { getUserFromToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("token")?.value;
  const user = token ? await getUserFromToken(token) : null;

  if (!user || user.isBlocked || !["ADMIN", "SUPER_ADMIN", "SUB_ADMIN"].includes(user.role)) {
    return <AccessDenied />;
  }

  return children;
}
