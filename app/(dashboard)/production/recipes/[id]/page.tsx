
import prisma from "@/lib/db";
import { RecipeForm } from "@/components/production/recipe-form";
import { notFound } from "next/navigation";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const recipe = await prisma.recipe.findUnique({
        where: { id },
        include: {
            ingredients: true,
        },
    });

    if (!recipe) {
        notFound();
    }

    const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    const materials = await prisma.rawMaterial.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <RecipeForm
                initialData={recipe}
                products={products}
                materials={materials}
            />
        </div>
    );
}
