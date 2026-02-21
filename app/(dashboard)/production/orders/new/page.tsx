
import prisma from "@/lib/db";
import { ProductionOrderForm } from "@/components/production/production-order-form";

export default async function NewProductionOrderPage() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { recipe: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductionOrderForm products={products} />
        </div>
    );
}
