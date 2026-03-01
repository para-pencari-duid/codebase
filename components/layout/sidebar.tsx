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
  Bell,
  TrendingDown,
  Factory,
  CalendarClock,
  Cake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "next-auth/react";

// ─── Grouped menu ─────────────────────────────────────────────────────────────

const MENU_GROUPS = [
  {
    label: "Operasional",
    items: [
      { name: "Dashboard",        href: "/dashboard",    icon: LayoutDashboard },
      { name: "Kasir (POS)",      href: "/pos",          icon: ShoppingCart },
      { name: "Transaksi",        href: "/transactions", icon: Receipt },
      { name: "Pre-Order",        href: "/pre-orders",   icon: CalendarClock },
    ],
  },
  {
    label: "Produk & Stok",
    items: [
      { name: "Produk",           href: "/products",     icon: Package },
      { name: "Inventory",        href: "/inventory",    icon: Warehouse },
      { name: "Resep & Produksi", href: "/production",   icon: Factory },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { name: "Laporan",          href: "/reports",      icon: BarChart3 },
      { name: "Pengeluaran",      href: "/expenses",     icon: TrendingDown },
    ],
  },
  {
    label: "CRM",
    items: [
      { name: "Pelanggan",        href: "/customers",    icon: Users },
      { name: "Notifikasi",       href: "/notifications",icon: Bell },
    ],
  },
  {
    label: "Sistem",
    items: [
      { name: "Pengguna",         href: "/users",        icon: UserCog },
      { name: "Pengaturan",       href: "/settings",     icon: Settings },
    ],
  },
] as const;


// ─── Sidebar props ────────────────────────────────────────────────────────────

interface SidebarProps {
  businessName?: string;
}

// ─── Nav links ────────────────────────────────────────────────────────────────

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-5">
      {MENU_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest select-none"
             style={{ color: "color-mix(in oklch, var(--sidebar-foreground) 40%, transparent)" }}>
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href.split("?")[0]}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "font-semibold"
                      : ""
                  }`}
                  style={
                    isActive
                      ? {
                          background: "var(--sidebar-accent)",
                          color: "var(--sidebar-primary)",
                        }
                      : {
                          color: "color-mix(in oklch, var(--sidebar-foreground) 70%, transparent)",
                        }
                  }
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full"
                      style={{ background: "var(--sidebar-primary)" }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function Sidebar({ businessName = "POS System" }: SidebarProps) {
  return (
    <aside
      className="hidden lg:flex flex-col sticky top-0 h-screen w-[280px] shrink-0"
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div
        className="flex h-[60px] items-center gap-3 px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--sidebar-primary)" }}
        >
          <Cake className="h-4 w-4 text-white" />
        </div>
        <span
          className="text-base font-bold leading-tight truncate"
          style={{ color: "var(--sidebar-accent-foreground)" }}
        >
          {businessName}
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <NavLinks />
      </div>

      {/* Logout */}
      <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[--sidebar-accent]"
          style={{ color: "color-mix(in oklch, var(--sidebar-foreground) 60%, transparent)" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────

export function MobileSidebar({ businessName = "Menu" }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] p-0"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className="flex h-[60px] items-center gap-3 px-5 shrink-0"
            style={{ borderBottom: "1px solid var(--sidebar-border)" }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--sidebar-primary)" }}
            >
              <Cake className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-base font-bold truncate"
              style={{ color: "var(--sidebar-accent-foreground)" }}
            >
              {businessName}
            </span>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <NavLinks onNavClick={() => setOpen(false)} />
          </div>

          {/* Logout */}
          <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: "color-mix(in oklch, var(--sidebar-foreground) 60%, transparent)" }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
