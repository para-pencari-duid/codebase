import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional().or(z.literal("")),
    role: z.enum(["OWNER", "MANAGER", "KASIR"]).optional(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;

        const user = await db.user.findUnique({
            where: { id },
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
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.log("[USER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const data = userUpdateSchema.parse(body);

        // Check if email is already taken by another user
        if (data.email) {
            const existing = await db.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id },
                },
            });
            if (existing) {
                return new NextResponse("Email sudah digunakan user lain", { status: 409 });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // Only hash and update password if provided & non-empty
        if (data.password && data.password.length > 0) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        const user = await db.user.update({
            where: { id },
            data: updateData,
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
        console.log("[USER_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;

        // Prevent self-deletion
        if (id === session.user.id) {
            return new NextResponse("Tidak bisa menghapus akun sendiri", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id },
            include: { _count: { select: { transactions: true } } },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // If user has transactions, deactivate instead of delete
        if (user._count.transactions > 0) {
            await db.user.update({
                where: { id },
                data: { isActive: false },
            });
            return NextResponse.json({ message: "User dinonaktifkan (memiliki riwayat transaksi)" });
        }

        await db.user.delete({ where: { id } });
        return NextResponse.json({ message: "User berhasil dihapus" });
    } catch (error) {
        console.log("[USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
