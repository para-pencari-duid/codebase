import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const lineSchema = z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
});

const schema = z.object({
    date: z.string(),
    description: z.string().min(1),
    reference: z.string().optional(),
    sourceType: z.string().optional(),
    sourceId: z.string().optional(),
    lines: z.array(lineSchema).min(2),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = parseInt(searchParams.get("page") || "1");
        const entries = await db.journalEntry.findMany({
            where: {
                ...(startDate && endDate ? { date: { gte: new Date(startDate), lte: new Date(endDate + "T23:59:59Z") } } : {}),
            },
            include: { lines: { include: { account: { select: { code: true, name: true } } } } },
            orderBy: { date: "desc" },
            skip: (page - 1) * 50,
            take: 50,
        });
        return NextResponse.json(entries);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        // Validate balanced entry
        const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: "Jurnal tidak seimbang (debit ≠ kredit)" }, { status: 400 });
        }
        const count = await db.journalEntry.count({ where: {} });
        const entryNo = `JE-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;
        const entry = await db.journalEntry.create({
            data: {
                entryNo,
                date: new Date(data.date),
                description: data.description,
                reference: data.reference,
                sourceType: data.sourceType,
                sourceId: data.sourceId,
                createdBy: session.user.id!,
                lines: { create: data.lines.map((l, i) => ({ ...l, sortOrder: i })) },
            },
            include: { lines: { include: { account: true } } },
        });
        return NextResponse.json(entry);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
