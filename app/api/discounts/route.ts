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

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const activeOnly = searchParams.get("activeOnly") === "true";

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
            ];
        }
        if (activeOnly) {
            where.isActive = true;
            where.OR = [
                { endDate: null },
                { endDate: { gte: new Date() } },
            ];
        }

        const discounts = await db.discount.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(discounts);
    } catch (error) {
        console.error("[DISCOUNTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (session.user.role === "KASIR") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const validatedData = discountSchema.parse(body);

        const tenantId = session.user.tenantId!;

        // Check if code already exists
        if (validatedData.code) {
            const existing = await db.discount.findFirst({
                where: { tenantId, code: validatedData.code },
            });
            if (existing) {
                return new NextResponse("Kode diskon sudah digunakan", { status: 400 });
            }
        }

        const discount = await db.discount.create({
            data: {
                tenantId,
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
        console.error("[DISCOUNTS_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
