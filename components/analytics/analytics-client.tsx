"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

interface AnalyticsData {
  totalRevenue: number;
  transactionCount: number;
  avgOrder: number;
  npsScore: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  customerSegments: { segment: string; count: number }[];
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Gagal memuat analitik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [range]);

  if (loading) return <div>Loading...</div>;
  if (!data) return null;

  const stats = [
    { label: "Total Pendapatan", value: `Rp ${data.totalRevenue.toLocaleString("id-ID")}` },
    { label: "Jumlah Transaksi", value: data.transactionCount.toLocaleString("id-ID") },
    { label: "Rata-rata Order", value: `Rp ${data.avgOrder.toLocaleString("id-ID")}` },
    { label: "NPS Score", value: String(data.npsScore) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {[7, 30, 90].map(r => (
          <Button key={r} variant={range === r ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>
            {r} Hari
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Top 10 Item</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.topItems ?? []).slice(0, 10).map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>Rp {item.revenue.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
                {(!data.topItems || data.topItems.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Segmen Pelanggan</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.customerSegments ?? []).map((seg, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="font-medium">{seg.segment}</span>
                  <span className="text-muted-foreground">{seg.count} pelanggan</span>
                </div>
              ))}
              {(!data.customerSegments || data.customerSegments.length === 0) && (
                <p className="text-muted-foreground text-center">Belum ada data segmen</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
