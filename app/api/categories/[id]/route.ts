import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1, "Nama kategori wajib diisi"),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
});

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
        const validatedData = categorySchema.parse(body);

        const category = await db.itemCategory.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
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

        const { id } = await params;

        // Check if category has items
        const itemCount = await db.item.count({
            where: { categoryId: id },
        });

        if (itemCount > 0) {
            return new NextResponse("Kategori tidak bisa dihapus karena masih digunakan produk", { status: 400 });
        }

        await db.itemCategory.delete({
            where: { id },
        });

        return NextResponse.json("Category deleted");
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
