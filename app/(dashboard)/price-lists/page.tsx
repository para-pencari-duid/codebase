import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PriceListClient from "@/components/price-lists/price-list-client";

export default async function PriceListsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <PriceListClient />;
}
