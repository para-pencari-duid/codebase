import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketplaceClient from "@/components/marketplace/marketplace-client";

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <MarketplaceClient />;
}
