import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "@/lib/db";

const registerSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["OWNER", "MANAGER", "KASIR"]).optional().default("KASIR"),
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

        const { name, email, password, role } = parsed.data;

        // Cek email sudah dipakai
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                isActive: true,
            },
        });

        return NextResponse.json({
            message: "Pengguna berhasil didaftarkan!",
            userId: user.id,
        });
    } catch (error: any) {
        console.error("[REGISTER]", error);
        return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
    }
}
