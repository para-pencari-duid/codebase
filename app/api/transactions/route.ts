import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNotificationIfEnabled, createTransactionMessage } from "@/lib/whatsapp";

// Schema for Transaction Creation
const transactionSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        discount: z.number().default(0),
    })),
    paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS", "DEBIT_CARD", "CREDIT_CARD", "EWALLET"]),
    paymentAmount: z.number().min(0),
    notes: z.string().optional(),
    customerId: z.string().optional().nullable(),
    discount: z.number().default(0),
});

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const paymentMethod = searchParams.get("paymentMethod") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {};

        if (search) {
            where.OR = [
                { transactionNo: { contains: search, mode: "insensitive" } },
                { customer: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate + "T23:59:59.999Z"),
            };
        } else if (startDate) {
            where.createdAt = { gte: new Date(startDate) };
        } else if (endDate) {
            where.createdAt = { lte: new Date(endDate + "T23:59:59.999Z") };
        }

        const [transactions, total] = await Promise.all([
            db.transaction.findMany({
                where,
                include: {
                    customer: true,
                    user: { select: { id: true, name: true, email: true } },
                    items: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.transaction.count({ where }),
        ]);

        return NextResponse.json({
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.log("[TRANSACTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validatedData = transactionSchema.parse(body);

        // Get current shift (optional - transactions can work without shift)
        const currentShift = await db.shift.findFirst({
            where: {
                userId: session.user.id,
                status: "OPEN",
            },
        });

        // Calculate totals
        const subtotal = validatedData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const taxRate = 0.11; // 11% PPN - should fetch from settings
        const tax = subtotal * taxRate;
        const total = subtotal + tax - validatedData.discount;

        // Generate Transaction Number (TRX-YYMMDD-XXXX)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const prefix = `TRX-${year}${month}${day}-`;

        const lastTransaction = await db.transaction.findFirst({
            where: { transactionNo: { startsWith: prefix } },
            orderBy: { transactionNo: 'desc' },
        });

        const lastNumber = lastTransaction
            ? parseInt(lastTransaction.transactionNo.split('-').pop() || "0")
            : 0;
        const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
        const transactionNo = `${prefix}${nextNumber}`;


        // Fetch products to get names and valid prices
        const productIds = validatedData.items.map(item => item.productId);
        const dbProducts = await db.product.findMany({
            where: { id: { in: productIds } }
        });

        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        // Start Database Transaction
        const transaction = await db.$transaction(async (prisma) => {
            // Validate stock and prepare items
            const transactionItems = validatedData.items.map(item => {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                return {
                    productId: item.productId,
                    productName: product.name,
                    quantity: item.quantity,
                    price: item.price, // Use client price or force product.price? For POS usually client price is authority if discounts applied there? Or validate?
                    // For MVP let's trust client price but maybe log discrepancy?
                    // Actually safer to use: product.price if no manual discount/override feature
                    // But let's stick to client's price for flexibility in MVP
                    discount: item.discount,
                    subtotal: (item.price * item.quantity) - item.discount,
                };
            });

            // 1. Create Transaction Record
            const newTransaction = await prisma.transaction.create({
                data: {
                    transactionNo,
                    userId: session.user?.id as string,
                    customerId: validatedData.customerId || null,
                    shiftId: currentShift?.id || null,
                    subtotal,
                    tax,
                    discount: validatedData.discount,
                    total,
                    paymentMethod: validatedData.paymentMethod,
                    paymentAmount: validatedData.paymentAmount,
                    changeAmount: validatedData.paymentAmount - total,
                    notes: validatedData.notes,
                    items: {
                        create: transactionItems
                    }
                },
                include: {
                    items: true,
                    customer: true,
                    user: { select: { id: true, name: true } },
                }
            });

            // 2. Update Stock and Create Stock Movement
            for (const item of validatedData.items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });

                await prisma.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "OUT",
                        quantity: item.quantity,
                        reference: newTransaction.transactionNo,
                        reason: "Sales Transaction", // Use constants
                        userId: session.user?.id as string,
                    }
                });
            }

            return newTransaction;
        });

        // Send WhatsApp receipt notification (async, don't wait)
        if (transaction.customer?.phone) {
            const settings = await db.settings.findFirst();
            if (settings) {
                const message = createTransactionMessage({
                    transactionNo: transaction.transactionNo,
                    customerName: transaction.customer.name,
                    items: transaction.items.map((item) => ({
                        name: item.productName,
                        quantity: item.quantity,
                        price: Number(item.subtotal),
                    })),
                    subtotal: Number(transaction.subtotal),
                    tax: Number(transaction.tax),
                    discount: Number(transaction.discount),
                    total: Number(transaction.total),
                    payment: transaction.paymentMethod,
                    businessName: settings.businessName,
                    businessAddress: settings.businessAddress || undefined,
                    businessPhone: settings.businessPhone || undefined,
                });

                // Send async (fire and forget)
                sendNotificationIfEnabled(transaction.customer.phone, message, "transaction").catch(
                    (err) => console.error("[WA] Failed to send transaction receipt:", err)
                );
            }
        }

        return NextResponse.json(transaction);

    } catch (error) {
        console.log("[TRANSACTIONS_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid Data", { status: 422 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
