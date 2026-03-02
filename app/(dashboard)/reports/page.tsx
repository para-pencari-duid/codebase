import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
    const session = await auth();
    if (!session) redirect("/login");
    if (session.user.role === "KASIR") redirect("/dashboard");

    return (
        <div className="p-5 lg:p-7">
            <ReportsClient />
        </div>
    );
}
