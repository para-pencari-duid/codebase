import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const campaign = await db.marketingCampaign.findFirst({
            where: { id, tenantId: session.user.tenantId! },
            include: { recipients: true },
        });
        if (!campaign) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(campaign);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const body = await req.json();
        const campaign = await db.marketingCampaign.updateMany({
            where: { id, tenantId: session.user.tenantId! },
            data: {
                name: body.name, message: body.message, imageUrl: body.imageUrl,
                scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
            },
        });
        return NextResponse.json(campaign);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;
        const { action } = await req.json();
        const tenantId = session.user.tenantId!;

        if (action === "send") {
            const campaign = await db.marketingCampaign.findFirst({ where: { id, tenantId } });
            if (!campaign) return new NextResponse("Not Found", { status: 404 });
            // Mark as SENDING, set sentAt
            const updated = await db.marketingCampaign.update({
                where: { id },
                data: { status: "SENDING", sentAt: new Date() },
            });
            // In production this would trigger actual message sending via WhatsApp/Email
            // For now mark all pending recipients as SENT
            await db.campaignRecipient.updateMany({
                where: { campaignId: id, status: "PENDING" },
                data: { status: "SENT", sentAt: new Date() },
            });
            const sentCount = await db.campaignRecipient.count({ where: { campaignId: id, status: "SENT" } });
            const finalUpdated = await db.marketingCampaign.update({
                where: { id },
                data: { status: "SENT", sentCount },
            });
            return NextResponse.json(finalUpdated);
        }

        if (action === "cancel") {
            const updated = await db.marketingCampaign.updateMany({ where: { id, tenantId }, data: { status: "CANCELLED" } });
            return NextResponse.json(updated);
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
