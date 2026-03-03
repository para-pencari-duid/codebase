import db from "@/lib/db";
import { ProductForm } from "@/components/products/product-form";
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

    let product = null;

    if (productId !== "new") {
        const raw = await db.item.findFirst({
            where: {
                id: productId,
            },
            include: { variants: true },
        });
        if (raw) {
            // convert Decimal values to numbers so they can be passed to client
            product = {
                ...raw,
                basePrice: Number(raw.basePrice),
                baseCost: Number(raw.baseCost),
                variants: raw.variants.map((v) => ({
                    ...v,
                    price: Number(v.price),
                    cost: Number(v.cost),
                })),
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
