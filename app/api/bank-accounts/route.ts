import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    accountName: z.string().min(1),
    currentBalance: z.number().optional(),
    notes: z.string().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const accounts = await db.bankAccount.findMany({
            where: {
 isActive: true },
            include: { _count: { select: { statements: true } } },
            orderBy: { bankName: "asc" },
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
        const account = await db.bankAccount.create({
            data: {
 ...data },
        });
        return NextResponse.json(account);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
