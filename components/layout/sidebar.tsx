"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    History,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Warehouse,
    Receipt,
    UserCog,
    Percent,
    Truck,
    Bell,
    TrendingDown,
    Factory,
    Clock,
    Undo2,
    ClipboardList,
    Store,
    CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "next-auth/react";

const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Pre-Order", href: "/pre-orders", icon: CalendarClock },
    { name: "Shifts", href: "/shifts", icon: Clock },
    { name: "Produk", href: "/products", icon: Package },
    { name: "Inventory", href: "/inventory", icon: Warehouse },
    { name: "Stock Opname", href: "/inventory/stock-opname", icon: ClipboardList },
    { name: "Multi-Store", href: "/stores", icon: Store },
    { name: "Produksi", href: "/production", icon: Factory },
    { name: "Supplier", href: "/suppliers", icon: Truck },
    { name: "Pelanggan", href: "/customers", icon: Users },
    { name: "Transaksi", href: "/transactions", icon: Receipt },
    { name: "Retur", href: "/returns", icon: Undo2 },
    { name: "Pengeluaran", href: "/expenses", icon: TrendingDown },
    { name: "Diskon", href: "/discounts", icon: Percent },
    { name: "Laporan", href: "/reports", icon: BarChart3 },
    { name: "Notifikasi", href: "/notifications", icon: Bell },
    { name: "Pengguna", href: "/users", icon: UserCog },
    { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-slate-100/40 lg:block dark:bg-slate-800/40">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                        <span className="text-xl font-bold text-primary">Toko Roti Bahagia</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive ? "bg-slate-100 text-primary font-semibold dark:bg-slate-800" : "text-muted-foreground"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
                <div className="flex flex-col h-full">
                    <div className="flex h-[60px] items-center border-b px-6">
                        <span className="text-xl font-bold">Menu</span>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive ? "bg-slate-100 text-primary font-semibold dark:bg-slate-800" : "text-muted-foreground"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => signOut()}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
