
import prisma from "@/lib/db";
import { RecipeForm } from "@/components/production/recipe-form";

export default async function NewRecipePage() {
    const products = await prisma.item.findMany({
        where: { type: "GOODS", isActive: true },
        orderBy: { name: "asc" },
    });

    const materials = await prisma.item.findMany({
        where: { type: "RAW_MATERIAL", isActive: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <RecipeForm
                initialData={null}
                products={products}
                materials={materials}
            />
        </div>
    );
}
