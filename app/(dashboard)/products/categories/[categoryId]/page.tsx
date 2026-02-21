import db from "@/lib/db";
import { CategoryForm } from "@/components/products/category-form";

export default async function CategoryPage({
    params
}: {
    params: Promise<{ categoryId: string }>
}) {
    const { categoryId } = await params;
    const category = await db.category.findUnique({
        where: {
            id: categoryId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm initialData={category} />
            </div>
        </div>
    );
}
