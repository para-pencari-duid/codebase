import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const campaignSchema = z.object({
    name: z.string().min(1),
    type: z.enum(["WHATSAPP", "EMAIL", "SMS"]),
    targetSegment: z.string().optional(),
    message: z.string().min(1),
    imageUrl: z.string().optional(),
    scheduledAt: z.string().optional(),
    recipientIds: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const campaigns = await db.marketingCampaign.findMany({
            where: { tenantId: session.user.tenantId! },
            include: { _count: { select: { recipients: true } } },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(campaigns);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = campaignSchema.parse(body);
        const tenantId = session.user.tenantId!;

        // Resolve recipients from customers based on segment or explicit ids
        let recipients: Array<{ customerId: string; name: string; contact: string }> = [];
        if (data.recipientIds?.length) {
            const customers = await db.customer.findMany({ where: { id: { in: data.recipientIds }, tenantId } });
            recipients = customers.map(c => ({ customerId: c.id, name: c.name, contact: c.phone ?? c.email ?? "" }));
        } else if (data.targetSegment) {
            const customers = await db.customer.findMany({ where: { tenantId, segment: data.targetSegment } });
            recipients = customers.map(c => ({ customerId: c.id, name: c.name, contact: c.phone ?? c.email ?? "" }));
        }

        const campaign = await db.marketingCampaign.create({
            data: {
                tenantId,
                name: data.name,
                type: data.type,
                targetSegment: data.targetSegment,
                message: data.message,
                imageUrl: data.imageUrl,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
                totalRecipients: recipients.length,
                createdBy: session.user.id!,
                recipients: { create: recipients.map(r => ({ ...r, status: "PENDING" })) },
            },
            include: { _count: { select: { recipients: true } } },
        });
        return NextResponse.json(campaign);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
