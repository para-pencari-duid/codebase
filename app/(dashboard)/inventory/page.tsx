import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    const tenantId = session.user.tenantId;

    const products = await db.item.findMany({
        where: { type: "GOODS", tenantId },
        include: { category: true, variants: true },
        orderBy: { name: "asc" },
    });

    const formattedProducts = products.map((p) => {
        const variant = p.variants[0];
        const stock = Number(variant?.stock ?? 0);
        const minStock = Number(variant?.minStock ?? 0);
        const price = Number(variant?.price ?? p.basePrice ?? 0);
        const cost = Number(variant?.cost ?? p.baseCost ?? 0);
        return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category?.name || "-",
            stock,
            minStock,
            unit: p.unit,
            price,
            cost,
            isActive: p.isActive,
            stockValue: stock * (cost || price),
        };
    });

    const lowStockCount = formattedProducts.filter((p) => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockCount = formattedProducts.filter((p) => p.stock === 0).length;
    const totalStockValue = formattedProducts.reduce((sum, p) => sum + p.stockValue, 0);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4">
                <InventoryClient
                    data={formattedProducts}
                    lowStockCount={lowStockCount}
                    outOfStockCount={outOfStockCount}
                    totalStockValue={totalStockValue}
                />
            </div>
        </div>
    );
}
