import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { UserClient } from "@/components/users/user-client";

export default async function UsersPage() {
    const session = await auth();
    if (!session) redirect("/login");
    if (session.user.role === "KASIR") redirect("/dashboard");

    const users = await db.user.findMany({
        where: {},
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: {
                select: { transactions: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const formattedUsers = users.map((user) => ({
        id: user.id,
        name: user.name || "-",
        email: user.email,
        role: user.role,
        phone: user.phone || "-",
        isActive: user.isActive,
        createdAt: user.createdAt,
        transactionCount: user._count.transactions,
    }));

    return (
        <div className="p-5 lg:p-7">
            <UserClient data={formattedUsers} currentUserRole={session.user.role || "KASIR"} />
        </div>
    );
}
