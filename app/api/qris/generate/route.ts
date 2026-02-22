import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";

// ─── Port of QrisService.php ─────────────────────────────────────────────────

/**
 * CRC16-CCITT (0xFFFF initial, 0x1021 poly, no reflection)
 * Exact clone of $this->calculateCRC16CCITT() in PHP service.
 */
function calculateCRC16(str: string): string {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Inject nominal amount into a static QRIS string.
 * Ported from QrisService::injectAmount() PHP.
 */
function injectAmount(qrisString: string, amount: number): string {
    let qrisData = qrisString.trim();

    // Strip CRC: last 8 chars if they contain "6304", otherwise last 4
    if (qrisData.slice(-8, -4) === "6304") {
        qrisData = qrisData.slice(0, -8);
    } else {
        qrisData = qrisData.slice(0, -4);
        if (qrisData.slice(-4) === "6304") {
            qrisData = qrisData.slice(0, -4);
        }
    }

    // Build Tag 54 (Transaction Amount)
    const amountStr = Math.floor(amount).toString();
    const lenStr = amountStr.length.toString().padStart(2, "0");
    const tag54 = `54${lenStr}${amountStr}`;

    // Insert Tag 54 before Tag 58 (Country Code "5802ID")
    const pos58 = qrisData.indexOf("5802ID");
    let newData: string;
    if (pos58 !== -1) {
        newData = qrisData.slice(0, pos58) + tag54 + qrisData.slice(pos58);
    } else {
        newData = qrisData + tag54;
    }

    // Recalculate CRC
    const withCrcTag = newData + "6304";
    const crc = calculateCRC16(withCrcTag);
    return withCrcTag + crc;
}

// ─── Request schema ───────────────────────────────────────────────────────────

const schema = z.object({
    amount: z.number().positive("Amount harus > 0"),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { amount } = schema.parse(body);

        const tenantId = session.user.tenantId!;
        const settings = await db.settings.findFirst({ where: { tenantId } });

        if (!settings?.qrisString?.trim()) {
            return NextResponse.json(
                { error: "QRIS belum diatur. Upload QRIS statis di Pengaturan → Pembayaran." },
                { status: 400 }
            );
        }

        // Inject amount into static QRIS
        const dynamicQris = injectAmount(settings.qrisString.trim(), amount);

        // Generate QR code as base64 PNG data URL
        const qrDataUrl = await QRCode.toDataURL(dynamicQris, {
            errorCorrectionLevel: "M",
            width: 300,
            margin: 2,
        });

        return NextResponse.json({
            qrisString: dynamicQris,
            qrCode: qrDataUrl,   // base64 PNG
            amount,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid data", { status: 422 });
        }
        console.error("[QRIS_GENERATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
