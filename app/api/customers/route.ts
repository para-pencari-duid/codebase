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

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const phone = searchParams.get("phone"); // Exact phone lookup

        const where: any = {};
        
        // Exact phone lookup (for POS customer check)
        if (phone) {
            where.phone = phone;
        } 
        // General search
        else if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const customers = await db.customer.findMany({
            where,
            include: {
                _count: { select: { transactions: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.log("[CUSTOMERS_GET]", error);
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
        const validatedData = customerSchema.parse(body);

        const customer = await db.customer.create({
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
        console.log("[CUSTOMERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
