import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "@/lib/db";

const BUSINESS_MODULES: Record<string, string[]> = {
    FNB:       ["POS", "TABLE", "BOM"],
    BAKERY:    ["POS", "BOM"],
    LAUNDRY:   ["POS", "JOB_TICKET"],
    RETAIL:    ["POS"],
    SALON:     ["POS", "BOOKING"],
    WHOLESALE: ["POS", "B2B", "TIER_PRICING"],
    FRANCHISE: ["POS", "MULTI_STORE"],
    OTHER:     ["POS"],
};

const registerSchema = z.object({
    businessType: z.string().min(1),
    businessName: z.string().min(3, "Nama usaha minimal 3 karakter"),
    businessSlug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda -"),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    ownerName: z.string().min(2, "Nama minimal 2 karakter"),
    ownerEmail: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validasi gagal", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { businessType, businessName, businessSlug, businessAddress, businessPhone, ownerName, ownerEmail, password } = parsed.data;

        const activeModules = BUSINESS_MODULES[businessType] ?? ["POS"];

        // Cek slug sudah dipakai
        const existingTenant = await db.tenant.findUnique({ where: { slug: businessSlug } });
        if (existingTenant) {
            return NextResponse.json({ error: "Slug usaha sudah digunakan, coba yang lain." }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat tenant, settings, dan owner user dalam satu transaksi
        const result = await db.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: businessName,
                    slug: businessSlug,
                    address: businessAddress || null,
                    phone: businessPhone || null,
                    email: ownerEmail,
                    isActive: true,
                    activeModules,
                },
            });

            await tx.settings.create({
                data: {
                    tenantId: tenant.id,
                    businessName,
                    businessAddress: businessAddress || "",
                    businessPhone: businessPhone || "",
                    businessEmail: ownerEmail,
                    taxRate: 11,
                    taxIncluded: false,
                    currency: "IDR",
                    receiptHeader: `${businessName}\nTerima kasih telah berbelanja!`,
                    receiptFooter: "Simpan struk ini sebagai bukti transaksi.",
                },
            });

            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: ownerName,
                    email: ownerEmail,
                    password: hashedPassword,
                    role: "OWNER",
                    isActive: true,
                },
            });

            await tx.store.create({
                data: {
                    tenantId: tenant.id,
                    code: "MAIN",
                    name: `${businessName} - Toko Utama`,
                    isActive: true,
                    isMainStore: true,
                },
            });

            return { tenant, user };
        });

        return NextResponse.json({
            message: "Usaha berhasil didaftarkan!",
            tenantId: result.tenant.id,
            slug: result.tenant.slug,
        });
    } catch (error: any) {
        console.error("[REGISTER]", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}
