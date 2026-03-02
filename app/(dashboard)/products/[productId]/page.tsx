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

    // Ensure the two required categories always exist
    await Promise.all([
        db.itemCategory.upsert({
            where: { name: 'Produk Siap' },
            update: {},
            create: { name: 'Produk Siap' },
        }),
        db.itemCategory.upsert({
            where: { name: 'Pre-Order' },
            update: {},
            create: { name: 'Pre-Order' },
        }),
    ]);

    // Only expose the two simplified categories
    const categories = await db.itemCategory.findMany({
        where: { name: { in: ['Produk Siap', 'Pre-Order'] } },
        orderBy: { name: 'asc' },
    });

    let product = null;

    if (productId !== "new") {
        product = await db.item.findFirst({
            where: {
                id: productId,
            },
            include: { variants: true },
        });
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
