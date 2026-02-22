import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketingClient from "@/components/marketing/marketing-client";

export default async function MarketingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <MarketingClient />;
}
