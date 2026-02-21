import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const discountSchema = z.object({
    name: z.string().min(1, "Nama diskon wajib diisi"),
    code: z.string().optional().nullable(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce.number().min(0),
    minPurchase: z.coerce.number().min(0).optional().nullable(),
    maxDiscount: z.coerce.number().min(0).optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    usageLimit: z.coerce.number().int().min(0).optional().nullable(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const discount = await db.discount.findUnique({
            where: { id },
        });

        if (!discount) {
            return new NextResponse("Discount not found", { status: 404 });
        }

        return NextResponse.json(discount);
    } catch (error) {
        console.error("[DISCOUNT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
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

        if (session.user.role === "KASIR") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = discountSchema.parse(body);

        // Check if code already exists (excluding current discount)
        if (validatedData.code) {
            const existing = await db.discount.findFirst({
                where: {
                    code: validatedData.code,
                    NOT: { id },
                },
            });
            if (existing) {
                return new NextResponse("Kode diskon sudah digunakan", { status: 400 });
            }
        }

        const discount = await db.discount.update({
            where: { id },
            data: {
                name: validatedData.name,
                code: validatedData.code || null,
                type: validatedData.type,
                value: validatedData.value,
                minPurchase: validatedData.minPurchase || null,
                maxDiscount: validatedData.maxDiscount || null,
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                isActive: validatedData.isActive,
                usageLimit: validatedData.usageLimit || null,
            },
        });

        return NextResponse.json(discount);
    } catch (error) {
        console.error("[DISCOUNT_PUT]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
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

        if (session.user.role === "KASIR") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;
        await db.discount.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DISCOUNT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
