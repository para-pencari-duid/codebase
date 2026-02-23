import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
    name: z.string().min(1),
    position: z.string().optional(),
    department: z.string().optional(),
    joinDate: z.string(),
    baseSalary: z.number().min(0),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankHolder: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    userId: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get("active") !== "false";
        const employees = await db.employee.findMany({
            where: {
 ...(activeOnly ? { isActive: true } : {}) },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(employees);
    } catch (e) { console.error(e); return new NextResponse("Error", { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        const body = await req.json();
        const data = schema.parse(body);
        const count = await db.employee.count({ where: {} });
        const employeeNo = `EMP-${(count + 1).toString().padStart(4, "0")}`;
        const emp = await db.employee.create({
            data: { employeeNo, ...data, joinDate: new Date(data.joinDate) },
        });
        return NextResponse.json(emp);
    } catch (e) {
        if (e instanceof z.ZodError) return new NextResponse("Invalid", { status: 422 });
        console.error(e); return new NextResponse("Error", { status: 500 });
    }
}
