import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const itemSchema = z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: z.enum(["CREDIT", "DEBIT"]),
    reference: z.string().optional(),
    balance: z.number().optional(),
});

const schema = z.object({
    bankAccountId: z.string(),
    statements: z.array(itemSchema).min(1),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const bankAccountId = searchParams.get("bankAccountId");
        const unreconciled = searchParams.get("unreconciled") === "true";
        const stmts = await db.bankStatement.findMany({
            where: {
                ...(bankAccountId ? { bankAccountId } : {}),
                ...(unreconciled ? { isReconciled: false } : {}),
            },
            orderBy: { date: "desc" },
            take: 200,
        });
        return NextResponse.json(stmts);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        await db.bankStatement.createMany({
            data: data.statements.map(s => ({
                bankAccountId: data.bankAccountId,
                date: new Date(s.date),
                description: s.description,
                amount: s.amount,
                type: s.type,
                reference: s.reference,
                balance: s.balance,
            })),
        });
        return NextResponse.json({ imported: data.statements.length });
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
