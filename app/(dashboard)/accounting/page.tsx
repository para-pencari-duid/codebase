import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountingClient from "@/components/accounting/accounting-client";

export default async function AccountingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <AccountingClient />;
}
