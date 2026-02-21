import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { POSClient } from "@/components/pos/pos-client";

export default async function POSPage() {
    const session = await auth();
    if (!session || !session.user) redirect("/login");

    const products = await db.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { name: 'asc' }
    });

    const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
    });

    // Fetch business settings
    const settings = await db.settings.findFirst();

    const formattedProducts = products.map((item) => ({
        ...item,
        price: item.price.toNumber(),
        stock: item.stock,
        category: item.category,
        categoryId: item.categoryId,
        description: item.description,
        images: item.images,
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        cost: item.cost?.toNumber() || 0,
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
    } : {
        taxRate: 11,
        taxIncluded: false,
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
