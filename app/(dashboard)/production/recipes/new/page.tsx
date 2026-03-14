
import prisma from "@/lib/db";
import { RecipeForm } from "@/components/production/recipe-form";

export default async function NewRecipePage() {
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

    const normalizedMaterials = materials.map((material) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        stock: material.variants.reduce((sum, variant) => sum + variant.stock, 0),
    }));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <RecipeForm
                initialData={null}
                products={products}
                materials={normalizedMaterials}
            />
        </div>
    );
}
