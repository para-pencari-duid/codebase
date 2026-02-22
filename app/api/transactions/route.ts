import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNotificationIfEnabled, createTransactionMessage } from "@/lib/whatsapp";
import { PaymentMethod } from "@prisma/client";

// Schema for Transaction Creation
const paymentLineSchema = z.object({
    method: z.enum(["CASH", "TRANSFER", "QRIS", "DEBIT_CARD", "CREDIT_CARD", "EWALLET", "POINTS"]),
    amount: z.number().min(0),
    reference: z.string().optional().nullable(),
});

const transactionSchema = z.object({
    items: z.array(z.object({
        variantId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        discount: z.number().default(0),
        modifiers: z.array(z.object({
            groupName: z.string(),
            optionName: z.string(),
            price: z.number().min(0),
        })).default([]),
    })),
    // New: payments array (split bill)
    payments: z.array(paymentLineSchema).optional(),
    // Legacy: single payment (backward compat)
    paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS", "DEBIT_CARD", "CREDIT_CARD", "EWALLET"]).optional(),
    paymentAmount: z.number().min(0).optional(),
    notes: z.string().optional(),
    customerId: z.string().optional().nullable(),
    discount: z.number().default(0),
    pointsRedeemed: z.number().min(0).default(0),
    discountId: z.string().optional().nullable(),
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

        // Resolve payment lines (support both new `payments[]` and legacy single payment)
        const tenantId = session.user.tenantId!;
        const resolvedPayments: Array<{ method: string; amount: number; reference?: string | null }> = (() => {
            if (validatedData.payments && validatedData.payments.length > 0) {
                return validatedData.payments;
            }
            // Legacy fallback
            const method = validatedData.paymentMethod || "CASH";
            const amount = validatedData.paymentAmount ?? 0;
            return [{ method, amount }];
        })();

        const primaryPaymentMethod = (resolvedPayments[0]?.method || "CASH") as PaymentMethod;
        const totalPaid = resolvedPayments.reduce((sum, p) => sum + p.amount, 0);

        // Fetch tenant settings (tax rate + loyalty)
        const tenantSettings = await db.settings.findFirst({ where: { tenantId } });

        // Calculate totals
        const subtotal = validatedData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const taxRateValue = tenantSettings?.taxRate ? Number(tenantSettings.taxRate) : 11;
        const taxIncluded = tenantSettings?.taxIncluded ?? false;
        const tax = taxIncluded ? subtotal * (taxRateValue / 100) : 0;
        const pointsRedemptionAmount = validatedData.pointsRedeemed > 0
            ? validatedData.pointsRedeemed * (tenantSettings?.loyaltyPointValue ?? 1)
            : 0;
        const total = subtotal + tax - validatedData.discount - pointsRedemptionAmount;

        // Generate Transaction Number (TRX-YYMMDD-XXXX)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const prefix = `TRX-${year}${month}${day}-`;

        const lastTransaction = await db.transaction.findFirst({
            where: { transactionNo: { startsWith: prefix }, tenantId },
            orderBy: { transactionNo: 'desc' },
        });

        const lastNumber = lastTransaction
            ? parseInt(lastTransaction.transactionNo.split('-').pop() || "0")
            : 0;
        const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
        const transactionNo = `${prefix}${nextNumber}`;


        // Fetch variants to get names and validate stock
        const variantIds = validatedData.items.map(item => item.variantId);
        const dbVariants = await db.itemVariant.findMany({
            where: { id: { in: variantIds } },
            include: { item: true },
        });

        // If some IDs didn't match (e.g. old cart with itemId instead of variantId),
        // fall back to finding the default variant for each item ID
        const foundIds = new Set(dbVariants.map(v => v.id));
        const missingIds = variantIds.filter(id => !foundIds.has(id));
        if (missingIds.length > 0) {
            const fallbackVariants = await db.itemVariant.findMany({
                where: { itemId: { in: missingIds } },
                include: { item: true },
                orderBy: { createdAt: "asc" },
            });
            // Keep only first variant per item (default)
            const seenItems = new Set<string>();
            for (const v of fallbackVariants) {
                if (!seenItems.has(v.itemId)) {
                    seenItems.add(v.itemId);
                    dbVariants.push(v);
                }
            }
        }

        // Build lookup: variantId OR itemId → variant
        const variantMap = new Map<string, typeof dbVariants[0]>();
        for (const v of dbVariants) {
            variantMap.set(v.id, v);
            variantMap.set(v.itemId, v); // fallback by item ID
        }

        // Start Database Transaction
        const transaction = await db.$transaction(async (prisma) => {
            // Validate stock and prepare items
            const transactionItems = validatedData.items.map(item => {
                const variant = variantMap.get(item.variantId);
                if (!variant) {
                    throw new Error(`Variant not found: ${item.variantId}`);
                }
                if (variant.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${variant.item.name}`);
                }

                return {
                    variantId: variant.id,  // always use DB variant ID, not what client sent
                    itemName: variant.item.name,
                    variantName: variant.name,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount,
                    subtotal: (item.price * item.quantity) - item.discount,
                };
            });

            // 1. Create Transaction Record
            const newTransaction = await prisma.transaction.create({
                data: {
                    tenantId,
                    transactionNo,
                    userId: session.user?.id as string,
                    customerId: validatedData.customerId || null,
                    shiftId: currentShift?.id || null,
                    subtotal,
                    tax,
                    discount: validatedData.discount,
                    total,
                    paymentMethod: primaryPaymentMethod,
                    paymentAmount: totalPaid,
                    changeAmount: totalPaid - total,
                    notes: validatedData.notes,
                    pointsRedeemed: validatedData.pointsRedeemed,
                    items: {
                        create: transactionItems
                    },
                    payments: {
                        create: resolvedPayments.map(p => ({
                            method: p.method as any,
                            amount: p.amount,
                            reference: p.reference ?? null,
                        })),
                    },
                },
                include: {
                    items: { include: { modifiers: true } },
                    customer: true,
                    user: { select: { id: true, name: true } },
                    payments: true,
                }
            });

            // 1b. Create TransactionItemModifiers
            for (const validatedItem of validatedData.items) {
                if (!validatedItem.modifiers || validatedItem.modifiers.length === 0) continue;

                // Find the matching transaction item
                const variant = variantMap.get(validatedItem.variantId);
                if (!variant) continue;
                const txItem = newTransaction.items.find(ti => ti.variantId === variant.id);
                if (!txItem) continue;

                await Promise.all(validatedItem.modifiers.map(mod =>
                    prisma.transactionItemModifier.create({
                        data: {
                            transactionItemId: txItem.id,
                            modifierGroupName: mod.groupName,
                            modifierOptionName: mod.optionName,
                            price: mod.price,
                        },
                    })
                ));
            }

            // 2. Update Stock and Create Stock Movement
            for (const item of validatedData.items) {
                const variant = variantMap.get(item.variantId)!;
                const resolvedVariantId = variant.id;
                await prisma.itemVariant.update({
                    where: { id: resolvedVariantId },
                    data: { stock: { decrement: item.quantity } }
                });

                await prisma.stockMovement.create({
                    data: {
                        tenantId,
                        variantId: resolvedVariantId,
                        type: "OUT",
                        quantity: item.quantity,
                        reference: newTransaction.transactionNo,
                        reason: "Sales Transaction",
                        userId: session.user?.id as string,
                    }
                });
            }

            return newTransaction;
        });

        // ── Loyalty Points: Redeem & Earn ──────────────────
        let earnedPoints = 0;
        if (validatedData.customerId && tenantSettings?.loyaltyEnabled) {
            const loyaltyPerRupiah = tenantSettings.loyaltyPointsPerRupiah ?? 1000;

            // Redeem: deduct redeemed points
            if (validatedData.pointsRedeemed > 0) {
                await db.loyaltyPoint.upsert({
                    where: { customerId: validatedData.customerId },
                    create: {
                        tenantId,
                        customerId: validatedData.customerId,
                        points: 0,
                        totalEarned: 0,
                        totalSpent: validatedData.pointsRedeemed,
                    },
                    update: {
                        points: { decrement: validatedData.pointsRedeemed },
                        totalSpent: { increment: validatedData.pointsRedeemed },
                    },
                });
                await db.pointHistory.create({
                    data: {
                        tenantId,
                        customerId: validatedData.customerId,
                        points: -validatedData.pointsRedeemed,
                        type: "REDEEM",
                        reference: transaction.transactionNo,
                        description: `Penukaran poin - ${transaction.transactionNo}`,
                    },
                });
            }

            // Earn: calculate and add points for this transaction
            earnedPoints = Math.floor(Number(transaction.total) / loyaltyPerRupiah);
            if (earnedPoints > 0) {
                await db.loyaltyPoint.upsert({
                    where: { customerId: validatedData.customerId },
                    create: {
                        tenantId,
                        customerId: validatedData.customerId,
                        points: earnedPoints,
                        totalEarned: earnedPoints,
                        totalSpent: 0,
                    },
                    update: {
                        points: { increment: earnedPoints },
                        totalEarned: { increment: earnedPoints },
                    },
                });
                await db.pointHistory.create({
                    data: {
                        tenantId,
                        customerId: validatedData.customerId,
                        points: earnedPoints,
                        type: "EARN",
                        reference: transaction.transactionNo,
                        description: `Pembelian - ${transaction.transactionNo}`,
                    },
                });
                // Update pointsEarned on transaction
                await db.transaction.update({
                    where: { id: transaction.id },
                    data: { pointsEarned: earnedPoints },
                });
            }
        }

        // Send WhatsApp receipt notification (async, don't wait)
        if (transaction.customer?.phone) {
            const settings = tenantSettings;
            if (settings) {
                const message = createTransactionMessage({
                    transactionNo: transaction.transactionNo,
                    customerName: transaction.customer.name,
                    items: transaction.items.map((item) => ({
                        name: item.itemName,
                        quantity: item.quantity,
                        price: Number(item.subtotal),
                    })),
                    subtotal: Number(transaction.subtotal),
                    tax: Number(transaction.tax),
                    discount: Number(transaction.discount),
                    total: Number(transaction.total),
                    payment: transaction.paymentMethod || "CASH",
                    businessName: settings.businessName,
                    businessAddress: settings.businessAddress || undefined,
                    businessPhone: settings.businessPhone || undefined,
                });

                // Send async (fire and forget)
                sendNotificationIfEnabled(transaction.customer.phone, message, "transaction", tenantId).catch(
                    (err) => console.error("[WA] Failed to send transaction receipt:", err)
                );
            }
        }

        return NextResponse.json({ ...transaction, pointsEarned: earnedPoints });

    } catch (error) {
        console.log("[TRANSACTIONS_POST]", error);
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid Data", { status: 422 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
