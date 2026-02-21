import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import * as z from "zod";

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    categoryId: z.string().min(1),
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

        const product = await db.product.findUnique({
            where: {
                id,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(product);
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

        const product = await db.product.update({
            where: {
                id,
            },
            data: {
                name,
                sku,
                categoryId,
                price,
                cost: cost || 0,
                stock,
                minStock: minStock || 0,
                unit,
                description,
                images: images || [],
                isActive,
            },
        });

        return NextResponse.json(product);
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

        const product = await db.product.delete({
            where: {
                id,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        // If delete fails (e.g. foreign key constraint), try setting active to false?
        // But for now, standard delete.
        console.log("[PRODUCT_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
