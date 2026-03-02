import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { TransactionClient } from "@/components/transactions/transaction-client";

export default async function TransactionsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const transactions = await db.transaction.findMany({
        where: {},
        include: {
            customer: true,
            user: { select: { id: true, name: true } },
            items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    const formattedTransactions = transactions.map((t) => ({
        id: t.id,
        transactionNo: t.transactionNo,
        customerName: t.customer?.name || "Walk-in",
        cashierName: t.user?.name || "-",
        itemCount: t.items.length,
        subtotal: Number(t.subtotal),
        tax: Number(t.tax),
        discount: Number(t.discount),
        total: Number(t.total),
        paymentMethod: t.paymentMethod || "CASH",
        paymentAmount: Number(t.paymentAmount),
        changeAmount: Number(t.changeAmount),
        status: t.status,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
        items: t.items.map((item) => ({
            productName: item.itemName,
            quantity: item.quantity,
            price: Number(item.price),
            discount: Number(item.discount),
            subtotal: Number(item.subtotal),
        })),
    }));

    return (
        <div>
            <TransactionClient data={formattedTransactions} />
        </div>
    );
}
