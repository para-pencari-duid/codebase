import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConsignmentClient from "@/components/consignments/consignment-client";

export default async function ConsignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <ConsignmentClient />;
}
