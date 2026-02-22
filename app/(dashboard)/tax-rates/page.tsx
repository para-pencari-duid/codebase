import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TaxRateClient from "@/components/tax-rates/tax-rate-client";

export default async function TaxRatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <TaxRateClient />;
}
