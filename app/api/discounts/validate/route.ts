import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { code, subtotal } = await req.json();

        if (!code) {
            return new NextResponse("Kode diskon wajib diisi", { status: 400 });
        }

        const discount = await db.discount.findFirst({
            where: { code },
        });

        if (!discount) {
            return NextResponse.json({ valid: false, message: "Kode diskon tidak ditemukan" });
        }

        if (!discount.isActive) {
            return NextResponse.json({ valid: false, message: "Diskon tidak aktif" });
        }

        // Check date validity
        const now = new Date();
        if (discount.startDate && now < discount.startDate) {
            return NextResponse.json({ valid: false, message: "Diskon belum berlaku" });
        }
        if (discount.endDate && now > discount.endDate) {
            return NextResponse.json({ valid: false, message: "Diskon sudah berakhir" });
        }

        // Check usage limit
        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
            return NextResponse.json({ valid: false, message: "Kuota diskon sudah habis" });
        }

        // Check minimum purchase
        if (discount.minPurchase && subtotal < Number(discount.minPurchase)) {
            return NextResponse.json({
                valid: false,
                message: `Minimum pembelian Rp ${Number(discount.minPurchase).toLocaleString("id-ID")}`,
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === "PERCENTAGE") {
            discountAmount = (subtotal * Number(discount.value)) / 100;
            if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
                discountAmount = Number(discount.maxDiscount);
            }
        } else {
            discountAmount = Number(discount.value);
        }

        return NextResponse.json({
            valid: true,
            discount: {
                id: discount.id,
                name: discount.name,
                type: discount.type,
                value: Number(discount.value),
                discountAmount,
            },
        });
    } catch (error) {
        console.error("[DISCOUNT_VALIDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
