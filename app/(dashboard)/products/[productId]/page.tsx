import db from "@/lib/db";
import { ProductForm, Product } from "@/components/products/product-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProductPage({
    params
}: {
    params: Promise<{ productId: string }>
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { productId } = await params;

    // Load all active categories for the product form
    const categories = await db.itemCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    let product: Product | null = null;

    if (productId !== "new") {
        const raw = await db.item.findFirst({
            where: {
                id: productId,
            },
            select: {
                id: true,
                name: true,
                sku: true,
                categoryId: true,
                orderType: true,
                unit: true,
                description: true,
                images: true,
                isActive: true,
                basePrice: true,
                baseCost: true,
                variants: true,
            },
        });
        if (raw) {
            // build a typed product object, converting decimals and
            // selecting only the fields the form expects
            const priceNum = Number(raw.variants?.[0]?.price ?? raw.basePrice ?? 0);
            const costNum = Number(raw.variants?.[0]?.cost ?? raw.baseCost ?? 0);
            const stockNum = Number(raw.variants?.[0]?.stock ?? 0);
            const minStockNum = Number(raw.variants?.[0]?.minStock ?? 0);

            product = {
                id: raw.id,
                name: raw.name,
                sku: raw.sku,
                categoryId: raw.categoryId ?? null,
                orderType: raw.orderType as "READY" | "PRE_ORDER" | null,
                price: priceNum,
                cost: costNum,
                stock: stockNum,
                minStock: minStockNum,
                unit: raw.unit,
                description: raw.description ?? null,
                images: raw.images ?? [],
                isActive: raw.isActive,
            };
        }
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductForm
                    categories={categories}
                    initialData={product}
                />
            </div>
        </div>
    );
}
