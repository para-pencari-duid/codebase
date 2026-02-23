import db from "@/lib/db";
import { CategoryForm } from "@/components/products/category-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CategoryPage({
    params
}: {
    params: Promise<{ categoryId: string }>
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { categoryId } = await params;
    const category = categoryId === "new"
        ? null
        : await db.itemCategory.findFirst({
            where: { id: categoryId }
        });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm initialData={category} />
            </div>
        </div>
    );
}
