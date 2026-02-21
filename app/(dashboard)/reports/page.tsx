import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
    const session = await auth();
    if (!session) redirect("/login");
    if (session.user.role === "KASIR") redirect("/dashboard");

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <ReportsClient />
        </div>
    );
}
