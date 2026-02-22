import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import * as z from "zod";

const updateModifierGroupSchema = z.object({
    name: z.string().min(1).optional(),
    required: z.boolean().optional(),
    multiple: z.boolean().optional(),
    maxSelect: z.number().nullable().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
    options: z.array(z.object({
        id: z.string().optional(), // existing option
        name: z.string().min(1),
        price: z.coerce.number().default(0),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
    })).optional(),
    itemIds: z.array(z.string()).optional(),
});

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        const modifierGroup = await db.itemModifierGroup.findUnique({
            where: { id },
            include: {
                options: { orderBy: { sortOrder: "asc" } },
                items: { select: { id: true, name: true, sku: true } },
            },
        });

        if (!modifierGroup) return new NextResponse("Not found", { status: 404 });

        return NextResponse.json(modifierGroup);
    } catch (error) {
        console.error("[MODIFIER_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const data = updateModifierGroupSchema.parse(body);

        // Update group fields
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.required !== undefined) updateData.required = data.required;
        if (data.multiple !== undefined) updateData.multiple = data.multiple;
        if (data.maxSelect !== undefined) updateData.maxSelect = data.maxSelect;
        if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // Handle options: delete old, create new
        if (data.options) {
            // Delete all existing options and recreate
            await db.itemModifierOption.deleteMany({ where: { groupId: id } });
            updateData.options = {
                create: data.options.map((opt, idx) => ({
                    name: opt.name,
                    price: opt.price,
                    isActive: opt.isActive,
                    sortOrder: opt.sortOrder || idx,
                })),
            };
        }

        // Handle item associations
        if (data.itemIds !== undefined) {
            updateData.items = {
                set: data.itemIds.map((itemId) => ({ id: itemId })),
            };
        }

        const updated = await db.itemModifierGroup.update({
            where: { id },
            data: updateData,
            include: {
                options: { orderBy: { sortOrder: "asc" } },
                items: { select: { id: true, name: true, sku: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[MODIFIER_PUT]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 422 });
        }
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        await db.itemModifierGroup.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[MODIFIER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
