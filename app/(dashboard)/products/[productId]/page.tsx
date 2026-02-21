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

    const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
    });

    let product = null;

    if (productId !== "new") {
        product = await db.product.findUnique({
            where: {
                id: productId
            }
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
