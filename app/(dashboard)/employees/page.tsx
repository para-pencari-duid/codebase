import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmployeeClient from "@/components/payroll/employee-client";

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <EmployeeClient />;
}
