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

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, sku, categoryId, price, cost, stock, minStock, unit, description, images, isActive } = productSchema.parse(body);

        if (!name || !sku || !categoryId || price === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const product = await db.product.create({
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
        console.log("[PRODUCTS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || undefined;
        const isFeatured = searchParams.get("isFeatured");

        const products = await db.product.findMany({
            where: {
                categoryId,
                isActive: true,
            },
            include: {
                category: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.log("[PRODUCTS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
