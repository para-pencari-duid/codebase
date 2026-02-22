import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ModifierManager } from "@/components/modifiers/modifier-manager";

export default async function ModifiersPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/login");

    const tenantId = session.user.tenantId!;

    const modifierGroups = await db.itemModifierGroup.findMany({
        where: { tenantId },
        include: {
            options: { orderBy: { sortOrder: "asc" } },
            items: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { sortOrder: "asc" },
    });

    // Fetch all items (GOODS) for the multi-select
    const items = await db.item.findMany({
        where: { tenantId, type: "GOODS", isActive: true },
        select: { id: true, name: true, sku: true },
        orderBy: { name: "asc" },
    });

    // Serialize Decimal to number
    const formattedGroups = modifierGroups.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        options: g.options.map((o) => ({
            ...o,
            price: Number(o.price),
        })),
    }));

    return (
        <div className="flex-1 space-y-4 p-6">
            <ModifierManager
                initialGroups={formattedGroups}
                availableItems={items}
            />
        </div>
    );
}
