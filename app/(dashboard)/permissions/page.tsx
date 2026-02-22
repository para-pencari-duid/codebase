import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PermissionsClient from "@/components/permissions/permissions-client";

export default async function PermissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <PermissionsClient />;
}
