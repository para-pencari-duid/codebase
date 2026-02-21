"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useCart from "@/hooks/use-cart";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash, Minus, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CheckoutDialog, type CheckoutData } from "./checkout-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface POSClientProps {
    products: any[];
    categories: any[];
    cashierName: string;
    settings: {
        taxRate: number;
        taxIncluded: boolean;
    };
}

export const POSClient: React.FC<POSClientProps> = ({
    products,
    categories,
    cashierName,
    settings,
}) => {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const cart = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
        return matchesSearch && matchesCategory && product.isActive && product.stock > 0;
    });

    const onAddToCart = (product: any) => {
        const existingItem = cart.items.find((item) => item.id === product.id);
        if (existingItem && existingItem.quantity >= product.stock) {
            toast.error(`Stok ${product.name} tidak mencukupi`);
            return;
        }
        cart.addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            stock: product.stock,
            images: product.images,
            category: product.category ? {
                name: product.category.name,
                icon: product.category.icon
            } : undefined
        });
    };

    const subtotal = cart.items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
    const tax = settings.taxIncluded ? subtotal * (settings.taxRate / 100) : 0;
    const total = subtotal + tax;

    const handleCheckout = async (data: CheckoutData) => {
        if (cart.items.length === 0) return;

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: Number(item.price),
                        discount: 0
                    })),
                    paymentMethod: data.paymentMethod,
                    paymentAmount: data.paymentAmount,
                    discount: data.discount,
                    notes: data.notes,
                    customerId: data.customerId, // Pass customer ID for WA receipt
                })
            });

            if (!response.ok) {
                const error = await response.text();
                toast.error(`Transaksi Gagal: ${error}`);
                return;
            }

            const result = await response.json();

            setReceiptData({
                transactionNo: result.transactionNo,
                createdAt: result.createdAt,
                cashierName: cashierName,
                items: cart.items.map(item => ({
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    discount: 0,
                    subtotal: item.price * item.quantity,
                })),
                subtotal,
                tax,
                discount: data.discount,
                total: result.total ? Number(result.total) : total - data.discount,
                paymentMethod: data.paymentMethod,
                paymentAmount: data.paymentAmount,
                changeAmount: result.changeAmount ? Number(result.changeAmount) : Math.max(0, data.paymentAmount - (total - data.discount)),
            });

            toast.success("Transaksi Berhasil!");
            cart.removeAll();
            setIsCheckoutOpen(false);
            setIsReceiptOpen(true);
        } catch (error) {
            toast.error("Terjadi kesalahan.");
        }
    };

    return (
        <>
            <div className="flex h-[calc(100vh-80px)] overflow-hidden">
                {/* LEFT: Product Selection */}
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari produk (Nama / SKU)..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                            {filteredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between"
                                    onClick={() => onAddToCart(product)}
                                >
                                    <CardContent className="p-4 flex flex-col gap-2 h-full">
                                        <div className="aspect-square bg-slate-100 rounded-md flex items-center justify-center text-4xl mb-2">
                                            {product.category?.icon || "📦"}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-sm font-bold">
                                                    {formatCurrency(Number(product.price))}
                                                </span>
                                                <Badge variant={product.stock > (product.minStock || 10) ? "outline" : product.stock > 0 ? "secondary" : "destructive"} className="text-[10px] px-1">
                                                    {product.stock > 0 ? `Stok: ${product.stock}` : "Habis"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-10 text-muted-foreground">
                                    Tidak ada produk ditemukan.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT: Cart */}
                <div className="w-[350px] lg:w-[400px] border-l bg-slate-50/50 flex flex-col h-full">
                    <div className="p-4 border-b bg-white shadow-sm">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Keranjang ({cart.items.reduce((sum, i) => sum + i.quantity, 0)} item)
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                <ShoppingCart className="h-12 w-12 opacity-20" />
                                <p>Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 bg-white rounded-lg border shadow-sm">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(Number(item.price))}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => item.quantity > 1 ? cart.updateQuantity(item.id, item.quantity - 1) : cart.removeItem(item.id)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-6 w-6"
                                                disabled={item.quantity >= item.stock}
                                                onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {formatCurrency(Number(item.price) * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-white border-t mt-auto space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {settings.taxIncluded && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pajak ({settings.taxRate}%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => cart.removeAll()} disabled={cart.items.length === 0}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Batal
                                </Button>
                                <Button onClick={() => setIsCheckoutOpen(true)} disabled={cart.items.length === 0}>
                                    Bayar
                                </Button>
                            </div>
                            <Link href="/pre-orders">
                                <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Pre-Order
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <CheckoutDialog
                open={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                items={cart.items}
                subtotal={subtotal}
                tax={tax}
                discount={0}
                total={total}
                onConfirm={handleCheckout}
            />

            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                data={receiptData}
            />
        </>
    );
};
