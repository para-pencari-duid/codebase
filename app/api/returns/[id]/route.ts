import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/returns/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      { error: "Failed to fetch return" },
      { status: 500 }
    );
  }
}

// PUT /api/returns/[id] - Approve/Reject/Complete return
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = await req.json();
    const { action } = data;

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Approve return
      const updated = await prisma.return.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    } else if (action === "reject") {
      // Reject return
      const updated = await prisma.return.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    } else if (action === "complete") {
      // Complete return - return items to stock
      if (returnRecord.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Return must be approved first" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Return items to stock
        for (const item of returnRecord.items) {
          if (item.returnToStock) {
            await tx.itemVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { increment: item.quantity },
              },
            });

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: "IN",
                quantity: item.quantity,
                reference: returnRecord.returnNo,
                reason: `Return from ${returnRecord.transactionNo}`,
                notes: `Condition: ${item.condition}`,
                userId: session.user.id,
              },
            });
          }
        }

        // Update return status
        await tx.return.update({
          where: { id },
          data: {
            status: "COMPLETED",
          },
        });
      });

      const updated = await prisma.return.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json(
      { error: "Failed to update return" },
      { status: 500 }
    );
  }
}
