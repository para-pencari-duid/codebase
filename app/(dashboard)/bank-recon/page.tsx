import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BankReconClient from "@/components/bank-recon/bank-recon-client";

export default async function BankReconPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <BankReconClient />;
}
