
import prisma from "@/lib/db";
import { RecipeForm } from "@/components/production/recipe-form";
import { notFound } from "next/navigation";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const recipe = await prisma.billOfMaterial.findUnique({
        where: { id },
        include: {
            components: true,
        },
    });

    if (!recipe) {
        notFound();
    }

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
                initialData={recipe}
                products={products}
                materials={materials}
            />
        </div>
    );
}
