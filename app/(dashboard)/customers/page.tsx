import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { CustomerClient } from "@/components/customers/customer-client";

export default async function CustomersPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const customers = await db.customer.findMany({
        where: {},
        include: {
            _count: { select: { transactions: true } },
            transactions: {
                select: { total: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const formattedCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
        isActive: customer.isActive,
        totalTransactions: customer._count.transactions,
        totalSpent: customer.transactions.reduce((sum, t) => sum + Number(t.total), 0),
        createdAt: customer.createdAt.toISOString(),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4">
                <CustomerClient data={formattedCustomers} />
            </div>
        </div>
    );
}
