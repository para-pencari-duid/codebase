import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import * as z from "zod";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    categoryId: z.string().optional().nullable(),
    price: z.coerce.number().min(0),
    cost: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().min(0),
    minStock: z.coerce.number().min(0).optional(),
    unit: z.string().default("pcs"),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
});

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const item = await db.item.findUnique({
            where: { id },
            include: {
                category: true,
                variants: true,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.log("[PRODUCT_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, sku, categoryId, price, cost, stock, minStock, unit, description, images, isActive } = productSchema.parse(body);

        if (!id) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        // Update the Item
        await db.item.update({
            where: { id },
            data: {
                name,
                sku,
                categoryId: categoryId || null,
                basePrice: price,
                baseCost: cost || 0,
                unit,
                description,
                images: images || [],
                isActive,
            },
        });

        // Update the default variant
        const defaultVariant = await db.itemVariant.findFirst({
            where: { itemId: id },
        });
        if (defaultVariant) {
            await db.itemVariant.update({
                where: { id: defaultVariant.id },
                data: {
                    price,
                    cost: cost || 0,
                    stock: stock || 0,
                    minStock: minStock || 0,
                    isActive,
                },
            });
        }

        const updatedItem = await db.item.findUnique({
            where: { id },
            include: { variants: true, category: true },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.log("[PRODUCT_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return new NextResponse("Product ID is required", { status: 400 });
        }

        const item = await db.item.delete({
            where: { id },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.log("[PRODUCT_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
