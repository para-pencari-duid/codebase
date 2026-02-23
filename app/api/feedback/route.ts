import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const feedbackSchema = z.object({
    customerId: z.string().optional(),
    transactionId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    channel: z.string().default("POS"),
    staffName: z.string().optional(),
    storeId: z.string().optional(),
    isPublic: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const feedbacks = await db.customerFeedback.findMany({
            where: {
                ...(searchParams.get("rating") ? { rating: parseInt(searchParams.get("rating")!) } : {}),
                ...(searchParams.get("customerId") ? { customerId: searchParams.get("customerId")! } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        // NPS score calculation
        const total = feedbacks.length;
        const promoters = feedbacks.filter(f => f.rating >= 4).length;
        const detractors = feedbacks.filter(f => f.rating <= 2).length;
        const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
        return NextResponse.json({ feedbacks, nps, total });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = feedbackSchema.parse(body);
        const feedback = await db.customerFeedback.create({
            data: { ...data,
 },
        });
        return NextResponse.json(feedback);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
