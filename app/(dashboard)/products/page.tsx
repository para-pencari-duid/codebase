import { format } from "date-fns";
import db from "@/lib/db";
import { ProductClient } from "./components/client";
import { ProductColumn } from "./components/columns";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const products = await db.item.findMany({
        where: { type: "GOODS" },
        include: {
            category: true,
            variants: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const currencyFormatter = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    });

    const formattedProducts: ProductColumn[] = products.map((item) => {
        const price = Number(item.variants[0]?.price ?? item.basePrice ?? 0);
        const cost = Number(item.variants[0]?.cost ?? item.baseCost ?? 0);
        const grossMargin = price - cost;
        const marginRate = price > 0 ? (grossMargin / price) * 100 : 0;

        return {
            id: item.id,
            name: item.name,
            sku: item.sku,
            category: item.category?.name ?? "-",
            price: currencyFormatter.format(price),
            cost: currencyFormatter.format(cost),
            grossMargin: currencyFormatter.format(grossMargin),
            marginRate,
            stock: Number(item.variants[0]?.stock ?? 0),
            isActive: item.isActive,
            createdAt: format(item.createdAt, "MMMM do, yyyy"),
        };
    });

    return (
        <div className="p-3 sm:p-5 lg:p-7">
            <ProductClient data={formattedProducts} />
        </div>
    );
}
