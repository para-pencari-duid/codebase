import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { DiscountClient } from "@/components/discounts/discount-client";

export default async function DiscountsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    const tenantId = session.user.tenantId;

    if (session.user.role === "KASIR") {
        redirect("/pos");
    }

    const discounts = await db.discount.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="flex flex-col gap-4 p-4 md:p-8">
            <DiscountClient
                data={discounts.map((d) => ({
                    ...d,
                    value: Number(d.value),
                    minPurchase: d.minPurchase ? Number(d.minPurchase) : null,
                    maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
                }))}
            />
        </div>
    );
}
