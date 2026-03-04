import db from "@/lib/db";
import { verifyShare } from "@/lib/share";
import { notFound } from "next/navigation";
import React from "react";

type Props = { params: { token: string } };

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = verifyShare(token);
  if (!payload) return { title: "Link tidak valid" };
  if (payload.meta?.title) {
    return {
      title: payload.meta.title,
      description: payload.meta.description,
      openGraph: {
        title: payload.meta.title,
        description: payload.meta.description,
        images: payload.meta.image ? [{ url: payload.meta.image }] : [],
      },
    };
  }
  // if no explicit meta, attempt to describe using first product
  const products = [];
  if (payload.scope === "single" && payload.singleProductId) {
    const p = await db.item.findFirst({ where: { id: payload.singleProductId }, include: { variants: true } });
    if (p) products.push(p as any);
  } else if (payload.scope === "selected" && Array.isArray(payload.productIds) && payload.productIds.length) {
    const ps = await db.item.findMany({ where: { id: { in: payload.productIds } }, include: { variants: true } });
    products.push(...ps as any);
  } else {
    const ps = await db.item.findMany({ where: { type: "GOODS", isActive: true }, include: { variants: true }, orderBy: { createdAt: "desc" }, take: 1 });
    if (ps.length) products.push(ps[0] as any);
  }
  if (products.length) {
    const p = products[0];
    const img = Array.isArray(p.images) && p.images.length ? p.images[0] : undefined;
    const title = `Produk: ${p.name}`;
    const description = p.description || `Lihat detail produk ${p.name}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: img ? [{ url: img }] : [],
      },
    };
  }
  return { title: "Shared products" };
}

export default async function Page({ params }: Props) {
  const { token } = await params;
  const payload = verifyShare(token);
  if (!payload) return notFound();

  let products: any[] = [];
  if (payload.scope === "single" && payload.singleProductId) {
    const p = await db.item.findFirst({ where: { id: payload.singleProductId }, include: { variants: true, category: true } });
    if (p) products = [p];
  } else if (payload.scope === "selected" && Array.isArray(payload.productIds) && payload.productIds.length) {
    products = await db.item.findMany({ where: { id: { in: payload.productIds } }, include: { variants: true, category: true } });
  } else {
    products = await db.item.findMany({ where: { type: "GOODS", isActive: true }, include: { variants: true, category: true }, orderBy: { createdAt: "desc" } });
  }

  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Produk yang dibagikan</h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-500">Tidak ada produk untuk ditampilkan.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => {
            const price = Number(p.variants?.[0]?.price ?? p.basePrice ?? 0);
            const img = Array.isArray(p.images) && p.images.length ? p.images[0] : null;
            return (
              <article
                key={p.id}
                className="flex flex-col border rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-150"
              >
                <div className="w-full h-48 bg-gray-100 relative">
                  {img ? (
                    <img
                      src={img}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Tidak ada gambar
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold mb-1">{p.name}</h2>
                  <div className="text-sm text-gray-600 mb-1">SKU: {p.sku}</div>
                  {p.category?.name && (
                    <div className="text-sm text-gray-600 mb-1">Kategori: {p.category.name}</div>
                  )}
                  {p.orderType && (
                    <div className="text-sm text-gray-600 mb-1">Tipe Pemesanan: {p.orderType}</div>
                  )}
                  {p.description && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">{p.description}</p>
                  )}
                  <div className="mt-auto font-medium text-lg">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(price)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
