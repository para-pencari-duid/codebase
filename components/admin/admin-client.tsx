"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Building2, CreditCard, TrendingUp,
  Search, Power, PowerOff, RefreshCw, Crown,
} from "lucide-react";

interface PlatformStats {
  tenantCount: number;
  userCount: number;
  activeSubCount: number;
  monthRevenue: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  isActive: boolean;
  activeModules: string[];
  createdAt: string;
  _count: { users: number; items: number; transactions: number };
  subscription?: {
    status: string;
    interval: string;
    endDate?: string;
    plan?: { name: string; slug: string };
  } | null;
}

const PLAN_BADGE: Record<string, string> = {
  basic: "bg-slate-100 text-slate-700 border-slate-200",
  pro: "bg-blue-100 text-blue-700 border-blue-200",
  enterprise: "bg-purple-100 text-purple-700 border-purple-200",
};

const SUB_STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIAL: "bg-blue-100 text-blue-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  PAST_DUE: "bg-orange-100 text-orange-700",
};

export default function AdminClient() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        fetch("/api/admin/stats").then(r => r.json()),
        fetch("/api/admin/tenants").then(r => r.json()),
      ]);
      setStats(s);
      setTenants(Array.isArray(t) ? t : (t.tenants ?? []));
    } catch {
      toast.error("Gagal memuat data. Pastikan Anda login sebagai admin platform.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleActive = async (tenantId: string, current: boolean) => {
    setToggling(tenantId);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, isActive: !current }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Tenant ${current ? "dinonaktifkan" : "diaktifkan"}`);
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, isActive: !current } : t));
    } catch {
      toast.error("Gagal mengubah status tenant");
    } finally {
      setToggling(null);
    }
  };

  const filtered = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan =
      filterPlan === "all" ||
      (filterPlan === "none" && !t.subscription?.plan) ||
      t.subscription?.plan?.slug === filterPlan;
    return matchSearch && matchPlan;
  });

  const statCards = stats ? [
    { label: "Total Tenant", value: stats.tenantCount, icon: Building2,   color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Total Pengguna", value: stats.userCount,  icon: Users,       color: "text-green-600",  bg: "bg-green-50" },
    { label: "Langganan Aktif", value: stats.activeSubCount, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Revenue Bulan Ini", value: `Rp ${Number(stats.monthRevenue ?? 0).toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Platform Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor dan kelola semua tenant di platform ini</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle>Semua Tenant ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, slug..."
                  className="pl-8 w-48 sm:w-64 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                value={filterPlan}
                onChange={e => setFilterPlan(e.target.value)}
                className="text-sm border rounded-md px-2 h-9 bg-background"
              >
                <option value="all">Semua Plan</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
                <option value="none">Tanpa Plan</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Memuat data tenant...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Langganan</TableHead>
                    <TableHead className="text-center">User</TableHead>
                    <TableHead className="text-center">Produk</TableHead>
                    <TableHead className="text-center">Transaksi</TableHead>
                    <TableHead>Daftar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(tenant => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.subscription?.plan ? (
                          <Badge
                            variant="outline"
                            className={PLAN_BADGE[tenant.subscription.plan.slug] ?? "bg-gray-100 text-gray-700"}
                          >
                            {tenant.subscription.plan.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.subscription ? (
                          <div>
                            <Badge className={SUB_STATUS_BADGE[tenant.subscription.status] ?? "bg-gray-100 text-gray-700"}>
                              {tenant.subscription.status}
                            </Badge>
                            {tenant.subscription.endDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                s/d {new Date(tenant.subscription.endDate).toLocaleDateString("id-ID")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum langganan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">{tenant._count.users}</TableCell>
                      <TableCell className="text-center text-sm">{tenant._count.items}</TableCell>
                      <TableCell className="text-center text-sm">{tenant._count.transactions.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(tenant.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <Badge className={tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {tenant.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={toggling === tenant.id}
                          onClick={() => toggleActive(tenant.id, tenant.isActive)}
                          className={tenant.isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                          title={tenant.isActive ? "Nonaktifkan tenant" : "Aktifkan tenant"}
                        >
                          {toggling === tenant.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : tenant.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        Tidak ada tenant yang cocok dengan filter
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules Summary */}
      <Card>
        <CardHeader><CardTitle>Distribusi Modul Aktif</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const moduleCounts: Record<string, number> = {};
              tenants.forEach(t => t.activeModules?.forEach(m => {
                moduleCounts[m] = (moduleCounts[m] ?? 0) + 1;
              }));
              return Object.entries(moduleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mod, count]) => (
                  <div key={mod} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm">
                    <span className="font-medium">{mod}</span>
                    <Badge className="bg-white text-gray-600 border text-xs px-1.5 py-0">{count}</Badge>
                  </div>
                ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
