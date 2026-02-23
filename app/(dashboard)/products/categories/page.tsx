import { CategoryClient } from "@/components/products/category-client";
import db from "@/lib/db";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const categories = await db.itemCategory.findMany({
        where: {},
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedCategories = categories.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        createdAt: item.createdAt.toISOString(),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 pt-6">
                <CategoryClient data={formattedCategories} />
            </div>
        </div>
    );
}
