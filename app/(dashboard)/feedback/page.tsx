import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FeedbackClient from "@/components/feedback/feedback-client";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <FeedbackClient />;
}
