import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const products = await db.product.findMany({
        include: { category: true },
        orderBy: { name: "asc" },
    });

    const formattedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || "-",
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        price: Number(p.price),
        cost: p.cost ? Number(p.cost) : 0,
        isActive: p.isActive,
        stockValue: p.stock * (p.cost ? Number(p.cost) : Number(p.price)),
    }));

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
