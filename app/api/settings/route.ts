import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
    businessName: z.string().min(1),
    businessAddress: z.string().optional().nullable(),
    businessPhone: z.string().optional().nullable(),
    businessEmail: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    taxRate: z.coerce.number().min(0).max(100),
    taxIncluded: z.boolean().default(false),
    currency: z.string().default("IDR"),
    receiptHeader: z.string().optional().nullable(),
    receiptFooter: z.string().optional().nullable(),
    // QRIS
    qrisString: z.string().optional().nullable(),
    // Loyalty
    loyaltyEnabled: z.boolean().optional(),
    loyaltyPointsPerRupiah: z.coerce.number().int().min(1).optional(),
    loyaltyPointValue: z.coerce.number().int().min(1).optional(),
    // Tier 3-6 feature flags
    tierPricingEnabled: z.boolean().optional(),
    consignmentEnabled: z.boolean().optional(),
    serialTrackEnabled: z.boolean().optional(),
    accountingEnabled: z.boolean().optional(),
    bankReconEnabled: z.boolean().optional(),
    payrollEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
    feedbackEnabled: z.boolean().optional(),
    onlineOrderEnabled: z.boolean().optional(),
    webhooksEnabled: z.boolean().optional(),
});

const whatsappSettingsSchema = z.object({
    ownerPhone: z.string().optional().nullable(),
    notifyOnTransaction: z.boolean().optional(),
    notifyOnLowStock: z.boolean().optional(),
    notifyOnBackup: z.boolean().optional(),
    notifyDailyReport: z.boolean().optional(),
});

export const runtime = "nodejs";

export async function GET() {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const tenantId = session.user.tenantId!;

        let settings = await db.settings.findFirst({ where: { tenantId } });

        if (!settings) {
            settings = await db.settings.create({
                data: {
                    tenantId,
                    businessName: "Usaha Saya",
                    taxRate: 11,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.log("[SETTINGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const validatedData = settingsSchema.parse(body);

        const tenantId = session.user.tenantId!;

        let settings = await db.settings.findFirst({ where: { tenantId } });

        if (settings) {
            settings = await db.settings.update({
                where: { tenantId },
                data: validatedData,
            });
        } else {
            settings = await db.settings.create({
                data: { ...validatedData, tenantId },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.log("[SETTINGS_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const validatedData = whatsappSettingsSchema.parse(body);

        const tenantId = session.user.tenantId!;

        let settings = await db.settings.findFirst({ where: { tenantId } });

        if (!settings) {
            return new NextResponse("Settings not found", { status: 404 });
        }

        settings = await db.settings.update({
            where: { tenantId },
            data: validatedData,
        });

        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        console.log("[SETTINGS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
