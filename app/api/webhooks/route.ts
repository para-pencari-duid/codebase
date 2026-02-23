import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

export const runtime = "nodejs";

const webhookSchema = z.object({
    url: z.string().url(),
    description: z.string().optional(),
    events: z.array(z.string()).min(1),
    isActive: z.boolean().default(true),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const endpoints = await db.webhookEndpoint.findMany({
            where: {
 },
            include: { _count: { select: { logs: true } } },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(endpoints);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = webhookSchema.parse(body);
        const secret = crypto.randomBytes(32).toString("hex");
        const endpoint = await db.webhookEndpoint.create({
            data: { ...data,
 secret },
        });
        return NextResponse.json(endpoint);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
