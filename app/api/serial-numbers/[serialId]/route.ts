import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { SerialNumberStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ serialId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { serialId } = await params;
        const serial = await db.serialNumber.findFirst({
            where: { id: serialId, tenantId: session.user.tenantId! },
            include: { variant: { include: { item: { select: { name: true } } } } },
        });
        if (!serial) return new NextResponse("Not Found", { status: 404 });
        return NextResponse.json(serial);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ serialId: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { serialId } = await params;
        const body = await req.json();
        const tenantId = session.user.tenantId!;

        let status: SerialNumberStatus | undefined;
        const updateData: {
            status?: SerialNumberStatus;
            soldAt?: Date;
            returnedAt?: Date;
            transactionId?: string;
            customerId?: string;
            notes?: string;
        } = {};

        if (body.action === "sell") {
            status = SerialNumberStatus.SOLD;
            updateData.soldAt = new Date();
            if (body.transactionId) updateData.transactionId = body.transactionId;
            if (body.customerId) updateData.customerId = body.customerId;
        } else if (body.action === "return") {
            status = SerialNumberStatus.RETURNED;
            updateData.returnedAt = new Date();
        } else if (body.action === "defective") {
            status = SerialNumberStatus.DEFECTIVE;
        } else if (body.status) {
            status = body.status as SerialNumberStatus;
        }

        if (status) updateData.status = status;
        if (body.notes) updateData.notes = body.notes;

        const updated = await db.serialNumber.updateMany({ where: { id: serialId, tenantId }, data: updateData });
        return NextResponse.json(updated);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}
