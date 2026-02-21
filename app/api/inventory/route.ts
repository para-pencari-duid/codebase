import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const adjustmentSchema = z.object({
    productId: z.string().min(1),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.number().int(),
    reason: z.string().min(1, "Alasan wajib diisi"),
    notes: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        const type = searchParams.get("type");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};
        if (productId) where.productId = productId;
        if (type) where.type = type;

        const [movements, total] = await Promise.all([
            db.stockMovement.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                    user: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.stockMovement.count({ where }),
        ]);

        return NextResponse.json({ data: movements, total });
    } catch (error) {
        console.log("[INVENTORY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const validatedData = adjustmentSchema.parse(body);

        const product = await db.product.findUnique({
            where: { id: validatedData.productId },
        });

        if (!product) {
            return new NextResponse("Produk tidak ditemukan", { status: 404 });
        }

        let stockChange = validatedData.quantity;
        if (validatedData.type === "OUT") {
            stockChange = -Math.abs(validatedData.quantity);
        } else if (validatedData.type === "ADJUSTMENT") {
            // For adjustment, quantity is the new stock value
            stockChange = validatedData.quantity - product.stock;
        }

        if (product.stock + stockChange < 0) {
            return new NextResponse("Stok tidak mencukupi", { status: 400 });
        }

        const result = await db.$transaction(async (prisma) => {
            const movement = await prisma.stockMovement.create({
                data: {
                    productId: validatedData.productId,
                    type: validatedData.type,
                    quantity: Math.abs(stockChange),
                    reason: validatedData.reason,
                    notes: validatedData.notes,
                    userId: session.user!.id,
                },
            });

            await prisma.product.update({
                where: { id: validatedData.productId },
                data: { stock: { increment: stockChange } },
            });

            return movement;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.log("[INVENTORY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
