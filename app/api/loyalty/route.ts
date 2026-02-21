import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const pointAdjustmentSchema = z.object({
    customerId: z.string().min(1),
    points: z.coerce.number().int(),
    type: z.enum(["EARN", "REDEEM", "ADJUSTMENT"]),
    description: z.string().optional(),
    reference: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return new NextResponse("Customer ID required", { status: 400 });
        }

        const [loyaltyPoint, history] = await Promise.all([
            db.loyaltyPoint.findUnique({
                where: { customerId },
            }),
            db.pointHistory.findMany({
                where: { customerId },
                orderBy: { createdAt: "desc" },
                take: 50,
            }),
        ]);

        return NextResponse.json({
            points: loyaltyPoint?.points || 0,
            totalEarned: loyaltyPoint?.totalEarned || 0,
            totalSpent: loyaltyPoint?.totalSpent || 0,
            history,
        });
    } catch (error) {
        console.error("[LOYALTY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validatedData = pointAdjustmentSchema.parse(body);

        // Get or create loyalty point record
        let loyaltyPoint = await db.loyaltyPoint.findUnique({
            where: { customerId: validatedData.customerId },
        });

        if (!loyaltyPoint) {
            loyaltyPoint = await db.loyaltyPoint.create({
                data: {
                    customerId: validatedData.customerId,
                    points: 0,
                },
            });
        }

        // Calculate new points
        let newPoints = loyaltyPoint.points;
        let totalEarned = loyaltyPoint.totalEarned;
        let totalSpent = loyaltyPoint.totalSpent;

        if (validatedData.type === "EARN" || (validatedData.type === "ADJUSTMENT" && validatedData.points > 0)) {
            newPoints += validatedData.points;
            totalEarned += validatedData.points;
        } else if (validatedData.type === "REDEEM" || (validatedData.type === "ADJUSTMENT" && validatedData.points < 0)) {
            if (loyaltyPoint.points < Math.abs(validatedData.points)) {
                return new NextResponse("Poin tidak mencukupi", { status: 400 });
            }
            newPoints -= Math.abs(validatedData.points);
            totalSpent += Math.abs(validatedData.points);
        }

        // Update loyalty points
        await db.loyaltyPoint.update({
            where: { customerId: validatedData.customerId },
            data: {
                points: newPoints,
                totalEarned,
                totalSpent,
            },
        });

        // Create history record
        await db.pointHistory.create({
            data: {
                customerId: validatedData.customerId,
                points: validatedData.points,
                type: validatedData.type,
                description: validatedData.description,
                reference: validatedData.reference,
            },
        });

        return NextResponse.json({
            success: true,
            points: newPoints,
        });
    } catch (error) {
        console.error("[LOYALTY_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
