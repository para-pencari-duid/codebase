import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminClient from "@/components/admin/admin-client";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
  // @ts-ignore
  if (!adminEmail || session.user.email !== adminEmail) redirect("/dashboard");
  return <AdminClient />;
}
