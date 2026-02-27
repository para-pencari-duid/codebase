import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const tableSchema = z.object({
    number: z.union([z.string().min(1), z.number().int().min(1)]).transform(String),
    name: z.string().optional(),
    capacity: z.number().int().min(1).default(4),
    floor: z.string().optional(),
    isActive: z.boolean().default(true),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const tables = await db.table.findMany({
            where: {
 },
            include: {
                activeOrder: {
                    include: {
                        items: true,
                    },
                },
            },
            orderBy: [{ floor: "asc" }, { number: "asc" }],
        });

        return NextResponse.json(tables);
    } catch (error) {
        console.error("[TABLES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const data = tableSchema.parse(body);

        const table = await db.table.create({
            data: { ...data },
        });

        return NextResponse.json(table);
    } catch (error) {
        if (error instanceof z.ZodError) return new NextResponse("Invalid Data", { status: 422 });
        console.error("[TABLES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
