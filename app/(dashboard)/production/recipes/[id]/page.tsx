
import prisma from "@/lib/db";
import { RecipeForm } from "@/components/production/recipe-form";
import { notFound } from "next/navigation";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const recipe = await prisma.billOfMaterial.findUnique({
        where: { id },
        include: {
            components: {
                select: {
                    id: true,
                    componentItemId: true,
                    quantity: true,
                    unit: true,
                    notes: true,
                },
            },
        },
    });

    if (!recipe) {
        notFound();
    }

    const products = await prisma.item.findMany({
        where: { type: "GOODS", isActive: true },
        select: {
            id: true,
            name: true,
            sku: true,
        },
        orderBy: { name: "asc" },
    });

    const materials = await prisma.item.findMany({
        where: { type: "RAW_MATERIAL", isActive: true },
        select: {
            id: true,
            name: true,
            unit: true,
            variants: {
                select: {
                    stock: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });

    const normalizedRecipe = {
        id: recipe.id,
        productId: recipe.itemId,
        notes: recipe.notes ?? "",
        yield: Number(recipe.yield),
        yieldUnit: recipe.yieldUnit,
        prepTime: recipe.prepTime ?? 0,
        cookTime: recipe.cookTime ?? 0,
        isActive: recipe.isActive,
        ingredients: recipe.components.map((component) => ({
            id: component.id,
            materialId: component.componentItemId,
            quantity: Number(component.quantity),
            unit: component.unit,
            notes: component.notes ?? "",
        })),
    };

    const normalizedMaterials = materials.map((material) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        stock: material.variants.reduce((sum, variant) => sum + variant.stock, 0),
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <RecipeForm
                initialData={normalizedRecipe}
                products={products}
                materials={normalizedMaterials}
            />
        </div>
    );
}
