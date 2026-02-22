export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";

/**
 * GET /api/expenses?from=2024-01-01&to=2024-12-31&category=SALARY
 * List all expenses with optional filtering
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category") as ExpenseCategory | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    if (category) {
      where.category = category;
    }

    // Get expenses
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      category,
      amount,
      date,
      description,
      paymentMethod,
      reference,
      notes,
      attachments,
    } = body;

    // Validation
    if (!category || !amount || !description || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Object.values(ExpenseCategory).includes(category)) {
      return NextResponse.json(
        { error: "Invalid expense category" },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Create expense
    const tenantId = session.user.tenantId!;
    const expense = await prisma.expense.create({
      data: {
        tenantId,
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description,
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
        attachments: attachments || [],
        userId: session.user.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
