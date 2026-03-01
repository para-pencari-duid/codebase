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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "next-auth/react";

// ─── Menu katalog lengkap ──────────────────────────────────────────────────

const MENU_CATALOG = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kasir (POS)", href: "/pos", icon: ShoppingCart },
//   { name: "Shift Kasir", href: "/shifts", icon: Clock },
  { name: "Produk", href: "/products", icon: Package },
//   { name: "Modifier", href: "/modifiers", icon: ListPlus },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
//   {
//     name: "Stock Opname",
//     href: "/inventory/stock-opname",
//     icon: ClipboardList,
//   },
  { name: "Laporan", href: "/reports", icon: BarChart3 },
  { name: "Diskon", href: "/discounts", icon: Percent },
//   { name: "Retur", href: "/returns", icon: Undo2 },
  { name: "Transaksi", href: "/transactions", icon: Receipt },
  { name: "Pre-Order / Servis", href: "/pre-orders", icon: CalendarClock },
  { name: "Resep & Produksi", href: "/production", icon: Factory },
//   {
//     name: "Faktur & Piutang",
//     href: "/transactions?type=B2B_INVOICE",
//     icon: FileText,
//   },
//   { name: "Supplier", href: "/suppliers", icon: Truck },
//   { name: "Multi-Store", href: "/stores", icon: Store },
//   { name: "Manajemen Meja", href: "/tables", icon: UtensilsCrossed },
//   { name: "Dapur (KDS)", href: "/kitchen", icon: ChefHat },
//   { name: "Booking / Jadwal", href: "/bookings", icon: CalendarCheck },
//   { name: "Tier Harga", href: "/price-lists", icon: Tag },
//   { name: "Konsinyasi", href: "/consignments", icon: Layers },
//   { name: "Serial Number", href: "/serial-numbers", icon: Hash },
//   { name: "Akuntansi", href: "/accounting", icon: BookOpen },
//   { name: "Rekonsiliasi Bank", href: "/bank-recon", icon: Landmark },
//   { name: "Tarif Pajak", href: "/tax-rates", icon: BadgePercent },
//   { name: "Karyawan", href: "/employees", icon: UserCheck },
//   { name: "Penggajian", href: "/payroll", icon: Wallet },
//   { name: "Marketing", href: "/marketing", icon: Megaphone },
//   { name: "Feedback / NPS", href: "/feedback", icon: Star },
//   { name: "Analitik Lanjutan", href: "/analytics", icon: TrendingUp },
//   { name: "Webhook / API", href: "/webhooks", icon: Webhook },
//   { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Pelanggan", href: "/customers", icon: Users },
  { name: "Pengeluaran", href: "/expenses", icon: TrendingDown },
  { name: "Notifikasi", href: "/notifications", icon: Bell },
  { name: "Pengguna", href: "/users", icon: UserCog },
  { name: "Pengaturan", href: "/settings", icon: Settings },
] as const;

// ─── Sidebar Component ────────────────────────────────────────────────────────

interface SidebarProps {
  /** Nama bisnis yang ditampilkan di header sidebar */
  businessName?: string;
}

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {MENU_CATALOG.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href.split("?")[0]}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              isActive
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

export function Sidebar({ businessName = "POS System" }: SidebarProps) {
  return (
    <div className="hidden border-r bg-slate-100/40 lg:block dark:bg-slate-800/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link
            className="flex items-center gap-2 font-semibold"
            href="/dashboard"
          >
            <span className="text-xl font-bold text-primary">
              {businessName}
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <NavLinks />
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

export function MobileSidebar({ businessName = "Menu" }: SidebarProps) {
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
              <NavLinks onNavClick={() => setOpen(false)} />
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
