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

    const formattedProducts: ProductColumn[] = products.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category?.name ?? "-",
        price: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(item.variants[0]?.price ?? item.basePrice ?? 0)),
        stock: Number(item.variants[0]?.stock ?? 0),
        isActive: item.isActive,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="p-5 lg:p-7">
            <ProductClient data={formattedProducts} />
        </div>
    );
}
