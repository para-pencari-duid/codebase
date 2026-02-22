import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SerialClient from "@/components/serial-numbers/serial-client";

export default async function SerialNumbersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <SerialClient />;
}
