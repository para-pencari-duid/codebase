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

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const categories = await db.itemCategory.findMany({
            where: {},
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validatedData = categorySchema.parse(body);

        const category = await db.itemCategory.create({
            data: { ...validatedData },
        });

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
