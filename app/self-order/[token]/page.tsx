"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Send, UtensilsCrossed } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface Variant {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    variants: Variant[];
}

interface Category {
    id: string;
    name: string;
    items: Product[];
}

interface TableInfo {
    id: string;
    number: number;
    name: string | null;
    status: string;
    activeOrder: { id: string; orderNo: string } | null;
}

interface CartItem {
    variantId: string;
    itemName: string;
    variantName: string;
    quantity: number;
    price: number;
}

export default function SelfOrderPage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [table, setTable] = useState<TableInfo | null>(null);
    const [tenantName, setTenantName] = useState("");
    const [menu, setMenu] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [ordered, setOrdered] = useState(false);
    const [orderNo, setOrderNo] = useState("");
    const [guestName, setGuestName] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/self-order/${token}`);
                if (!res.ok) { setError("Meja tidak ditemukan atau tidak aktif."); setLoading(false); return; }
                const data = await res.json();
                setTable(data.table);
                setTenantName(data.tenant?.name ?? "");
                setMenu(data.menu);
            } catch {
                setError("Gagal memuat menu.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [token]);

    function addToCart(product: Product, variant: Variant) {
        setCart((prev) => {
            const existing = prev.find((c) => c.variantId === variant.id);
            if (existing) return prev.map((c) => c.variantId === variant.id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, {
                variantId: variant.id,
                itemName: product.name,
                variantName: variant.name,
                quantity: 1,
                price: variant.price,
            }];
        });
    }

    function removeFromCart(variantId: string) {
        setCart((prev) => {
            const existing = prev.find((c) => c.variantId === variantId);
            if (!existing) return prev;
            if (existing.quantity === 1) return prev.filter((c) => c.variantId !== variantId);
            return prev.map((c) => c.variantId === variantId ? { ...c, quantity: c.quantity - 1 } : c);
        });
    }

    function cartQty(variantId: string) {
        return cart.find((c) => c.variantId === variantId)?.quantity ?? 0;
    }

    const totalItems = cart.reduce((acc, c) => acc + c.quantity, 0);
    const totalPrice = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);

    async function handleOrder() {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/self-order/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guestName: guestName || undefined,
                    guestCount: 1,
                    items: cart,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setOrderNo(data.orderNo);
            setOrdered(true);
            setCart([]);
            toast.success("Pesanan dikirim ke dapur!");
        } catch (e: any) {
            toast.error(e.message || "Gagal mengirim pesanan");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-2">
                <UtensilsCrossed className="h-12 w-12 mx-auto animate-pulse text-orange-400" />
                <p className="text-muted-foreground">Memuat menu...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-2">
                <p className="text-red-500 font-semibold">{error}</p>
            </div>
        </div>
    );

    if (ordered) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-sm">
                <div className="text-6xl">✅</div>
                <h2 className="text-2xl font-bold">Pesanan Diterima!</h2>
                <p className="text-muted-foreground">Nomor order: <span className="font-bold text-black">{orderNo}</span></p>
                <p className="text-sm text-muted-foreground">Pesanan Anda sedang diproses dapur. Harap tunggu.</p>
                <Button onClick={() => setOrdered(false)} variant="outline">Pesan Lagi</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-orange-500 text-white p-4 sticky top-0 z-10 shadow">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">{tenantName}</h1>
                        {table && (
                            <p className="text-sm opacity-90">
                                Meja {table.number}{table.name ? ` • ${table.name}` : ""}
                            </p>
                        )}
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="secondary" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {totalItems > 0 && (
                                    <Badge className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                                        {totalItems}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Keranjang ({totalItems} item)</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
                                {cart.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">Keranjang kosong</p>
                                )}
                                {cart.map((item) => (
                                    <div key={item.variantId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.itemName}</p>
                                            {item.variantName !== item.itemName && (
                                                <p className="text-xs text-muted-foreground">{item.variantName}</p>
                                            )}
                                            <p className="text-sm font-bold text-orange-600">
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => removeFromCart(item.variantId)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="font-bold w-5 text-center">{item.quantity}</span>
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => addToCart({ id: "", name: item.itemName, description: null, images: [], variants: [{ id: item.variantId, name: item.variantName, price: item.price, stock: 99 }] }, { id: item.variantId, name: item.variantName, price: item.price, stock: 99 })}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {cart.length > 0 && (
                                <div className="mt-4 border-t pt-4 space-y-3">
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span className="text-orange-600">
                                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalPrice)}
                                        </span>
                                    </div>
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleOrder} disabled={submitting}>
                                        <Send className="h-4 w-4 mr-2" />
                                        {submitting ? "Mengirim..." : "Kirim ke Dapur"}
                                    </Button>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Menu */}
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {menu.map((category) => (
                    category.items.length > 0 && (
                        <div key={category.id}>
                            <h2 className="font-bold text-lg mb-3 border-b pb-2">{category.name}</h2>
                            <div className="space-y-3">
                                {category.items.map((product) => (
                                    <div key={product.id} className="bg-white rounded-xl border overflow-hidden">
                                        <div className="flex gap-3 p-3">
                                            {product.images[0] ? (
                                                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-orange-50 flex items-center justify-center">
                                                    <UtensilsCrossed className="h-8 w-8 text-orange-200" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                                                )}
                                                <div className="mt-2 space-y-1">
                                                    {product.variants.map((variant) => (
                                                        <div key={variant.id} className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">{variant.name}</p>
                                                                <p className="text-sm font-bold text-orange-600">
                                                                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(variant.price)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {cartQty(variant.id) > 0 ? (
                                                                    <>
                                                                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => removeFromCart(variant.id)}>
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <span className="font-bold w-5 text-center text-sm">{cartQty(variant.id)}</span>
                                                                    </>
                                                                ) : null}
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 bg-orange-500 hover:bg-orange-600"
                                                                    disabled={variant.stock === 0}
                                                                    onClick={() => addToCart(product, variant)}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Floating cart bar */}
            {totalItems > 0 && (
                <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-20">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 shadow-lg py-6 text-base">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                {totalItems} item · {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalPrice)}
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Keranjang ({totalItems} item)</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-3">
                                {cart.map((item) => (
                                    <div key={item.variantId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.itemName}</p>
                                            <p className="text-sm font-bold text-orange-600">
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => removeFromCart(item.variantId)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="font-bold w-5 text-center">{item.quantity}</span>
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => addToCart({ id: "", name: item.itemName, description: null, images: [], variants: [{ id: item.variantId, name: item.variantName, price: item.price, stock: 99 }] }, { id: item.variantId, name: item.variantName, price: item.price, stock: 99 })}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 border-t pt-4 space-y-3">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-600">
                                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalPrice)}
                                    </span>
                                </div>
                                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleOrder} disabled={submitting}>
                                    <Send className="h-4 w-4 mr-2" />
                                    {submitting ? "Mengirim..." : "Kirim ke Dapur"}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            )}
        </div>
    );
}
