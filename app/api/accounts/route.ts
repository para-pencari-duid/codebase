import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
    normalBalance: z.enum(["DEBIT", "CREDIT"]).optional(),
    parentId: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const accounts = await db.account.findMany({
            where: {
                tenantId: session.user.tenantId!,
                ...(type ? { type } as any : {}),
                isActive: true,
            },
            include: { children: { select: { id: true, code: true, name: true, type: true, currentBalance: true } } },
            orderBy: [{ type: "asc" }, { code: "asc" }],
        });
        return NextResponse.json(accounts);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const tenantId = session.user.tenantId!;
        // Auto normalBalance if not provided
        const normalBalance = data.normalBalance ?? (["ASSET", "EXPENSE"].includes(data.type) ? "DEBIT" : "CREDIT");
        const account = await db.account.create({
            data: { tenantId, ...data, normalBalance },
        });
        return NextResponse.json(account);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
