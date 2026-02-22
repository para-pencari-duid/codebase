import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayrollClient from "@/components/payroll/payroll-client";

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <PayrollClient />;
}
