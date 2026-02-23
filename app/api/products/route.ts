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

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, sku, categoryId, price, cost, stock, minStock, unit, description, images, isActive } = productSchema.parse(body);

        // Create Item with a default variant
        const item = await db.item.create({
            data: {
                name,
                sku,
                categoryId: categoryId || null,
                basePrice: price,
                baseCost: cost || 0,
                unit: unit || "pcs",
                description,
                images: images || [],
                isActive,
                type: "GOODS",
                variants: {
                    create: {
                        sku: `${sku}-DEFAULT`,
                        name: "Default",
                        price,
                        cost: cost || 0,
                        stock: stock || 0,
                        minStock: minStock || 0,
                        isActive,
                    },
                },
            },
            include: {
                variants: true,
                category: true,
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.log("[PRODUCTS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || undefined;

        const items = await db.item.findMany({
            where: {
                type: "GOODS",
                isActive: true,
                ...(categoryId && { categoryId }),
            },
            include: {
                category: true,
                variants: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.log("[PRODUCTS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
