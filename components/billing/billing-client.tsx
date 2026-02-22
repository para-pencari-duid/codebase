"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Zap, Building2, Rocket, AlertCircle, Calendar } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  maxUsers: number;
  maxStores: number;
  maxItems: number;
}

interface Subscription {
  id: string;
  status: string;
  interval: string;
  endDate?: string;
  trialEndsAt?: string;
  nextBillingDate?: string;
  plan?: Plan;
  invoices?: Invoice[];
}

interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  status: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  basic: Zap,
  pro: Rocket,
  enterprise: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  basic: "border-slate-300",
  pro: "border-primary border-2 shadow-md",
  enterprise: "border-purple-400",
};

const PLAN_BADGE: Record<string, string> = {
  basic: "bg-slate-100 text-slate-700",
  pro: "bg-primary/10 text-primary",
  enterprise: "bg-purple-100 text-purple-700",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIAL: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  PAST_DUE: "bg-orange-100 text-orange-800",
  UNPAID: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: "Bulanan",
  ANNUAL: "Tahunan",
};

export default function BillingClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [interval, setInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  const fetchAll = async () => {
    try {
      const [planRes, subRes] = await Promise.all([
        fetch("/api/billing/plans"),
        fetch("/api/billing/subscription"),
      ]);
      const planData = await planRes.json();
      const subData = await subRes.json();
      setPlans(Array.isArray(planData) ? planData : (planData.plans ?? []));
      setSubscription(Array.isArray(subData) ? null : subData);
    } catch {
      toast.error("Gagal memuat data billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const choosePlan = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });
      if (!res.ok) throw new Error();
      toast.success("Paket berhasil dipilih! Silakan selesaikan pembayaran.");
      fetchAll();
    } catch {
      toast.error("Gagal memilih paket");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">Memuat data billing...</div>
  );

  const invoices = subscription?.invoices ?? [];
  const activePlanSlug = subscription?.plan?.slug;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing & Langganan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola paket langganan dan riwayat pembayaran Anda</p>
      </div>

      {/* ── Status Langganan Saat Ini ─────────────────────────────── */}
      {subscription?.plan ? (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Langganan Aktif
              </CardTitle>
              <Badge className={STATUS_BADGE[subscription.status] ?? "bg-gray-100 text-gray-700"}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Paket</p>
                <p className="font-semibold">{subscription.plan.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Siklus</p>
                <p className="font-semibold">{INTERVAL_LABEL[subscription.interval] ?? subscription.interval}</p>
              </div>
              {subscription.nextBillingDate && (
                <div>
                  <p className="text-muted-foreground">Tagihan Berikutnya</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(subscription.nextBillingDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {subscription.endDate && (
                <div>
                  <p className="text-muted-foreground">Berlaku Hingga</p>
                  <p className="font-semibold">
                    {new Date(subscription.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-800">
              Anda belum berlangganan. Pilih paket di bawah untuk mulai menggunakan fitur penuh.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Toggle Bulanan / Tahunan ──────────────────────────────── */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold">Pilih Paket</h2>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => setInterval("MONTHLY")}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${interval === "MONTHLY" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setInterval("ANNUAL")}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium flex items-center gap-2 ${interval === "ANNUAL" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
          >
            Tahunan
            <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0">Hemat 2 bulan</Badge>
          </button>
        </div>
      </div>

      {/* ── Kartu Paket ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const Icon = PLAN_ICONS[plan.slug] ?? Zap;
          const isActive = activePlanSlug === plan.slug;
          const price = interval === "MONTHLY" ? plan.priceMonthly : plan.priceAnnual;
          return (
            <Card key={plan.id} className={`relative flex flex-col ${PLAN_COLORS[plan.slug] ?? ""}`}>
              {plan.slug === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white text-xs px-3">Paling Populer</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2 rounded-lg ${PLAN_BADGE[plan.slug] ?? "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isActive && (
                    <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Aktif</Badge>
                  )}
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="mb-4">
                  <span className="text-3xl font-extrabold">
                    Rp {price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    /{interval === "MONTHLY" ? "bulan" : "tahun"}
                  </span>
                  {interval === "ANNUAL" && (
                    <p className="text-xs text-green-600 mt-0.5">
                      ≈ Rp {Math.round(price / 12).toLocaleString("id-ID")}/bulan
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-4 flex gap-4">
                  <span>👤 {plan.maxUsers >= 999 ? "∞" : plan.maxUsers} pengguna</span>
                  <span>🏪 {plan.maxStores >= 999 ? "∞" : plan.maxStores} toko</span>
                  <span>📦 {plan.maxItems >= 99999 ? "∞" : plan.maxItems.toLocaleString()} produk</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isActive ? "outline" : plan.slug === "pro" ? "default" : "outline"}
                  disabled={isActive || subscribing === plan.id}
                  onClick={() => choosePlan(plan.id)}
                >
                  {isActive ? "✓ Paket Aktif" : subscribing === plan.id ? "Memproses..." : `Pilih ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Riwayat Invoice ──────────────────────────────────────── */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Dibayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                    <TableCell>Rp {Number(inv.amount).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[inv.status] ?? "bg-gray-100 text-gray-600"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                    <TableCell>
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("id-ID") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
