import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { TableClient } from "@/components/tables/table-client";

export default async function TablesPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const tables = await db.table.findMany({
        where: {},
        include: {
            activeOrder: {
                include: { items: true },
            },
        },
        orderBy: [{ floor: "asc" }, { number: "asc" }],
    });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <TableClient tables={tables as any} />
            </div>
        </div>
    );
}
