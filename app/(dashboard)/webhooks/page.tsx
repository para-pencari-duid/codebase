import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WebhookClient from "@/components/webhooks/webhook-client";

export default async function WebhooksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <WebhookClient />;
}
