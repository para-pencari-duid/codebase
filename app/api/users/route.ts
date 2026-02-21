import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userCreateSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["OWNER", "MANAGER", "KASIR"]),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role === "KASIR") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role) {
            where.role = role;
        }

        const users = await db.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: { transactions: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.log("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role !== "OWNER") {
            return new NextResponse("Forbidden - Only OWNER can create users", { status: 403 });
        }

        const body = await req.json();
        const data = userCreateSchema.parse(body);

        const existing = await db.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            return new NextResponse("Email sudah terdaftar", { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await db.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                phone: data.phone,
                isActive: data.isActive,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 });
        }
        console.log("[USERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
