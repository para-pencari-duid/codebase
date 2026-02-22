
import prisma from "@/lib/db";
import { ProductionOrderForm } from "@/components/production/production-order-form";

export default async function NewProductionOrderPage() {
    const rawProducts = await prisma.item.findMany({
        where: { type: "GOODS", isActive: true },
        include: { variants: true, bom: true },
        orderBy: { name: "asc" },
    });

    const products = rawProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        recipe: p.bom ? { id: p.bom.id } : null,
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductionOrderForm products={products} />
        </div>
    );
}
