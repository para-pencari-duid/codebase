import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import * as z from "zod";

const modifierGroupSchema = z.object({
    name: z.string().min(1, "Nama modifier group harus diisi"),
    required: z.boolean().default(false),
    multiple: z.boolean().default(true),
    maxSelect: z.number().nullable().optional(),
    sortOrder: z.number().default(0),
    isActive: z.boolean().default(true),
    options: z.array(z.object({
        name: z.string().min(1),
        price: z.coerce.number().default(0),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
    })).min(1, "Minimal 1 option"),
    itemIds: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const modifierGroups = await db.itemModifierGroup.findMany({
            where: {},
            include: {
                options: { orderBy: { sortOrder: "asc" } },
                items: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(modifierGroups);
    } catch (error) {
        console.error("[MODIFIERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = modifierGroupSchema.parse(body);

        const modifierGroup = await db.itemModifierGroup.create({
            data: {
                name: data.name,
                required: data.required,
                multiple: data.multiple,
                maxSelect: data.maxSelect ?? null,
                sortOrder: data.sortOrder,
                isActive: data.isActive,
                options: {
                    create: data.options.map((opt, idx) => ({
                        name: opt.name,
                        price: opt.price,
                        isActive: opt.isActive,
                        sortOrder: opt.sortOrder || idx,
                    })),
                },
                items: data.itemIds.length > 0
                    ? { connect: data.itemIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                options: { orderBy: { sortOrder: "asc" } },
                items: { select: { id: true, name: true, sku: true } },
            },
        });

        return NextResponse.json(modifierGroup);
    } catch (error) {
        console.error("[MODIFIERS_POST]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 422 });
        }
        return new NextResponse("Internal error", { status: 500 });
    }
}
