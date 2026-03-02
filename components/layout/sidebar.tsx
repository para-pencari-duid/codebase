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
import { confirmDestroy } from "@/lib/swal";

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

// ─── Logout handler ───────────────────────────────────────────────────────────

async function handleLogout() {
  const confirmed = await confirmDestroy({
    title: "Yakin ingin logout?",
    description: "Anda akan keluar dari sesi ini.",
    confirmLabel: "Ya, Logout",
  });
  if (confirmed) signOut();
}

// ─── Nav links ────────────────────────────────────────────────────────────────

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4">
      {MENU_GROUPS.map((group) => (
        <div key={group.label}>
          {/* Group label */}
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
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
                  className="relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150"
                  style={
                    isActive
                      ? {
                          background: "var(--sidebar-accent)",
                          color: "var(--sidebar-accent-foreground)",
                        }
                      : {
                          color: "oklch(0.48 0 0)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "oklch(0.96 0.002 80)";
                      (e.currentTarget as HTMLElement).style.color = "oklch(0.2 0 0)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "";
                      (e.currentTarget as HTMLElement).style.color = "oklch(0.48 0 0)";
                    }
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4.5 w-0.75 rounded-r-full"
                      style={{ background: "var(--sidebar-primary)" }}
                    />
                  )}
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={isActive ? { color: "var(--sidebar-primary)" } : {}}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Logo block ───────────────────────────────────────────────────────────────

function LogoBlock({ businessName }: { businessName: string }) {
  return (
    <div
      className="flex h-15 items-center gap-3 px-4 shrink-0"
      style={{ borderBottom: "1px solid var(--sidebar-border)" }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
        style={{ background: "var(--sidebar-primary)" }}
      >
        <Cake className="h-4 w-4 text-white" />
      </div>
      <span
        className="text-sm font-bold leading-tight truncate"
        style={{ color: "oklch(0.15 0 0)" }}
      >
        {businessName}
      </span>
    </div>
  );
}

// ─── Logout button ────────────────────────────────────────────────────────────

function LogoutButton() {
  return (
    <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
      <button
        onClick={handleLogout}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150"
        style={{ color: "oklch(0.52 0 0)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "oklch(0.97 0.01 20)";
          (e.currentTarget as HTMLElement).style.color = "oklch(0.577 0.245 27.325)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "";
          (e.currentTarget as HTMLElement).style.color = "oklch(0.52 0 0)";
        }}
      >
        <LogOut className="h-4 w-4 shrink-0 transition-colors" />
        Logout
      </button>
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function Sidebar({ businessName = "POS System" }: SidebarProps) {
  return (
    <aside
      className="hidden lg:flex flex-col sticky top-0 h-screen w-[256px] shrink-0"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      <LogoBlock businessName={businessName} />

      <div className="flex-1 overflow-y-auto py-3 px-2">
        <NavLinks />
      </div>

      <LogoutButton />
    </aside>
  );
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────

export function MobileSidebar({ businessName = "Menu" }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[256px] p-0"
        style={{
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex flex-col h-full">
          <LogoBlock businessName={businessName} />

          <div className="flex-1 overflow-y-auto py-3 px-2">
            <NavLinks onNavClick={() => setOpen(false)} />
          </div>

          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
