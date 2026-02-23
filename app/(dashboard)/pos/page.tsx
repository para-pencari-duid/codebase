import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { POSClient } from "@/components/pos/pos-client";

export default async function POSPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/login");

    const products = await db.item.findMany({
        where: { isActive: true, type: "GOODS" },
        include: {
            category: true,
            variants: true,
            modifierGroups: {
                where: { isActive: true },
                include: {
                    options: {
                        where: { isActive: true },
                        orderBy: { sortOrder: "asc" },
                    },
                },
                orderBy: { sortOrder: "asc" },
            },
        },
        orderBy: { name: 'asc' }
    });

    const categories = await db.itemCategory.findMany({
        where: {},
        orderBy: { name: 'asc' }
    });

    // Fetch business settings
    const settings = await db.settings.findFirst({ where: {} });

    const formattedProducts = products.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        images: item.images,
        isActive: item.isActive,
        unit: item.unit,
        categoryId: item.categoryId,
        category: item.category ? {
            id: item.category.id,
            name: item.category.name,
            icon: item.category.icon,
            color: item.category.color,
        } : null,
        price: Number(item.variants[0]?.price ?? item.basePrice ?? 0),
        cost: Number(item.variants[0]?.cost ?? item.baseCost ?? 0),
        stock: Number(item.variants[0]?.stock ?? 0),
        variantId: item.variants[0]?.id ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        modifierGroups: item.modifierGroups.map((g) => ({
            id: g.id,
            name: g.name,
            required: g.required,
            multiple: g.multiple,
            maxSelect: g.maxSelect,
            options: g.options.map((o) => ({
                id: o.id,
                name: o.name,
                price: Number(o.price),
            })),
        })),
    }));

    // Transform categories if needed, but they seem simple strings/dates mostly
    const formattedCategories = categories.map((cat) => ({
        ...cat,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
    }));

    const businessSettings = settings ? {
        taxRate: settings.taxRate.toNumber(),
        taxIncluded: settings.taxIncluded,
        businessName: settings.businessName,
        businessAddress: settings.businessAddress ?? null,
        businessPhone: settings.businessPhone ?? null,
        receiptHeader: settings.receiptHeader ?? null,
        receiptFooter: settings.receiptFooter ?? null,
    } : {
        taxRate: 11,
        taxIncluded: false,
        businessName: "Toko",
        businessAddress: null,
        businessPhone: null,
        receiptHeader: null,
        receiptFooter: null,
    };

    return (
        <div className="flex-1 space-y-4">
            <POSClient
                products={formattedProducts}
                categories={formattedCategories}
                cashierName={session.user.name || "Kasir"}
                settings={businessSettings}
            />
        </div>
    );
}
