"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
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
    FileText,
    Wrench,
    ListPlus,
    UtensilsCrossed,
    ChefHat,
    CalendarCheck,
    Tag,
    Layers,
    Hash,
    BookOpen,
    Landmark,
    BadgePercent,
    UserCheck,
    Wallet,
    Megaphone,
    Star,
    TrendingUp,
    Webhook,
    ShoppingBag,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "next-auth/react";

// ─── Menu katalog lengkap ──────────────────────────────────────────────────
// requiredModule: null  → selalu tampil
// requiredModule: string → hanya tampil jika ada di activeModules tenant

const MENU_CATALOG = [
    // ── Selalu tampil ──────────────────────────────────────────
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiredModule: null },
    { name: "Kasir (POS)", href: "/pos", icon: ShoppingCart, requiredModule: null },
    { name: "Shift Kasir", href: "/shifts", icon: Clock, requiredModule: null },
    { name: "Produk", href: "/products", icon: Package, requiredModule: null },
    { name: "Modifier", href: "/modifiers", icon: ListPlus, requiredModule: null },
    { name: "Inventory", href: "/inventory", icon: Warehouse, requiredModule: null },
    { name: "Laporan", href: "/reports", icon: BarChart3, requiredModule: null },

    // ── Modul POS (aktif otomatis, untuk stock opname & diskon) ─
    { name: "Stock Opname", href: "/inventory/stock-opname", icon: ClipboardList, requiredModule: "POS" },
    { name: "Diskon", href: "/discounts", icon: Percent, requiredModule: "POS" },
    { name: "Retur", href: "/returns", icon: Undo2, requiredModule: "POS" },
    { name: "Transaksi", href: "/transactions", icon: Receipt, requiredModule: "POS" },

    // ── Modul JOB_TICKET (Servis / Laundry / Custom Order) ─────
    { name: "Manajemen Servis", href: "/pre-orders", icon: CalendarClock, requiredModule: "JOB_TICKET" },

    // ── Modul BOM (Resep & Produksi F&B) ───────────────────────
    { name: "Resep Produksi", href: "/production", icon: Factory, requiredModule: "BOM" },

    // ── Modul B2B (Faktur & Piutang Wholesale) ──────────────────
    { name: "Faktur & Piutang", href: "/transactions?type=B2B_INVOICE", icon: FileText, requiredModule: "B2B" },
    { name: "Supplier", href: "/suppliers", icon: Truck, requiredModule: "B2B" },

    // ── Modul MULTI_STORE ───────────────────────────────────────
    { name: "Multi-Store", href: "/stores", icon: Store, requiredModule: "MULTI_STORE" },

    // ── Modul TABLE (Manajemen Meja, KDS, QR Self-Order) ────────
    { name: "Manajemen Meja", href: "/tables", icon: UtensilsCrossed, requiredModule: "TABLE" },
    { name: "Dapur (KDS)", href: "/kitchen", icon: ChefHat, requiredModule: "TABLE" },

    // ── Modul BOOKING (Booking & Penugasan Staff) ───────────────
    { name: "Booking / Jadwal", href: "/bookings", icon: CalendarCheck, requiredModule: "BOOKING" },

    // ── Modul TIER_PRICING (Harga Bertingkat per Pelanggan) ─────
    { name: "Tier Harga", href: "/price-lists", icon: Tag, requiredModule: "TIER_PRICING" },

    // ── Modul CONSIGNMENT ────────────────────────────────────────
    { name: "Konsinyasi", href: "/consignments", icon: Layers, requiredModule: "CONSIGNMENT" },

    // ── Modul SERIAL (Serial Number Tracking) ────────────────────
    { name: "Serial Number", href: "/serial-numbers", icon: Hash, requiredModule: "SERIAL" },

    // ── Modul ACCOUNTING (Double-Entry Bookkeeping) ──────────────
    { name: "Akuntansi", href: "/accounting", icon: BookOpen, requiredModule: "ACCOUNTING" },
    { name: "Rekonsiliasi Bank", href: "/bank-recon", icon: Landmark, requiredModule: "ACCOUNTING" },
    { name: "Tarif Pajak", href: "/tax-rates", icon: BadgePercent, requiredModule: "ACCOUNTING" },

    // ── Modul PAYROLL (Karyawan & Penggajian) ────────────────────
    { name: "Karyawan", href: "/employees", icon: UserCheck, requiredModule: "PAYROLL" },
    { name: "Penggajian", href: "/payroll", icon: Wallet, requiredModule: "PAYROLL" },

    // ── Modul MARKETING (Kampanye & Feedback) ────────────────────
    { name: "Marketing", href: "/marketing", icon: Megaphone, requiredModule: "MARKETING" },
    { name: "Feedback / NPS", href: "/feedback", icon: Star, requiredModule: "MARKETING" },

    // ── Modul ANALYTICS ──────────────────────────────────────────
    { name: "Analitik Lanjutan", href: "/analytics", icon: TrendingUp, requiredModule: "ANALYTICS" },

    // ── Modul WEBHOOK ─────────────────────────────────────────────
    { name: "Webhook / API", href: "/webhooks", icon: Webhook, requiredModule: "WEBHOOK" },

    // ── Modul MARKETPLACE ─────────────────────────────────────────
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBag, requiredModule: "MARKETPLACE" },

    // ── Selalu tampil ───────────────────────────────────────────
    { name: "Pelanggan", href: "/customers", icon: Users, requiredModule: null },
    { name: "Pengeluaran", href: "/expenses", icon: TrendingDown, requiredModule: null },
    { name: "Notifikasi", href: "/notifications", icon: Bell, requiredModule: null },
    { name: "Pengguna", href: "/users", icon: UserCog, requiredModule: null },
    { name: "Billing & Langganan", href: "/billing", icon: CreditCard, requiredModule: null },
    { name: "Pengaturan", href: "/settings", icon: Settings, requiredModule: null },
] as const;

/** Filter menu berdasarkan activeModules tenant.
 *  Jika activeModules kosong / tidak diberikan → tampilkan semua (mode development). */
function getVisibleMenus(activeModules: string[]) {
    if (!activeModules || activeModules.length === 0) return MENU_CATALOG;
    return MENU_CATALOG.filter(
        (m) => m.requiredModule === null || activeModules.includes(m.requiredModule)
    );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

interface SidebarProps {
    /** Array activeModules dari Tenant (misal: ["POS","BOM","JOB_TICKET"]).
     *  Kosongkan untuk tampilkan semua menu (development / single-tenant lama). */
    activeModules?: string[];
    /** Nama bisnis yang ditampilkan di header sidebar */
    businessName?: string;
}

function NavLinks({
    activeModules = [],
    onNavClick,
}: {
    activeModules: string[];
    onNavClick?: () => void;
}) {
    const pathname = usePathname();
    const menus = getVisibleMenus(activeModules);

    return (
        <>
            {menus.map((item) => {
                const Icon = item.icon;
                const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href.split("?")[0]}/`);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavClick}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isActive
                            ? "bg-slate-100 text-primary font-semibold dark:bg-slate-800"
                            : "text-muted-foreground"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                );
            })}
        </>
    );
}

export function Sidebar({ activeModules = [], businessName = "POS System" }: SidebarProps) {
    return (
        <div className="hidden border-r bg-slate-100/40 lg:block dark:bg-slate-800/40">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                        <span className="text-xl font-bold text-primary">{businessName}</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        <NavLinks activeModules={activeModules} />
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Button
                        variant="outline"
                        className="w-full gap-2 justify-start"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar({ activeModules = [], businessName = "Menu" }: SidebarProps) {
    const [open, setOpen] = useState(false);

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
                        <span className="text-xl font-bold">{businessName}</span>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            <NavLinks
                                activeModules={activeModules}
                                onNavClick={() => setOpen(false)}
                            />
                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <Button
                            variant="outline"
                            className="w-full gap-2 justify-start"
                            onClick={() => signOut()}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

