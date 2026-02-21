import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const customerSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const customer = await db.customer.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        items: true,
                    },
                },
            },
        });

        if (!customer) {
            return new NextResponse("Customer not found", { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = customerSchema.parse(body);

        const customer = await db.customer.update({
            where: { id },
            data: {
                ...validatedData,
                email: validatedData.email || null,
                birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 422 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const transactionCount = await db.transaction.count({
            where: { customerId: id },
        });

        if (transactionCount > 0) {
            // Soft delete - deactivate instead
            await db.customer.update({
                where: { id },
                data: { isActive: false },
            });
        } else {
            await db.customer.delete({
                where: { id },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
