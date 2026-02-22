"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface PayrollEntry {
  id: string;
  employeeName?: string;
  employee?: { name: string };
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
}

interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "PROCESSED" | "PAID";
  entries?: PayrollEntry[];
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
};

export default function PayrollClient() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selected, setSelected] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);

  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setPeriods(data.periods ?? data);
    } catch {
      toast.error("Gagal memuat data penggajian");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch {
      toast.error("Gagal memuat detail periode");
    }
  };

  useEffect(() => { fetchPeriods(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Periode penggajian dibuat");
      setOpen(false);
      setForm({ name: "", startDate: "", endDate: "" });
      fetchPeriods();
    } catch {
      toast.error("Gagal membuat periode");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id: string, action: "process" | "pay") => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "process" ? "Penggajian diproses" : "Semua dibayar");
      fetchPeriods();
      if (selected?.id === id) fetchPeriodDetail(id);
    } catch {
      toast.error("Gagal melakukan aksi");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Periode Penggajian</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Buat Periode</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Buat Periode Penggajian</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Nama Periode</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Tanggal Mulai</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div><Label>Tanggal Akhir</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
                <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Buat"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Akhir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => fetchPeriodDetail(p.id)}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{new Date(p.startDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>{new Date(p.endDate).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell><Badge className={statusColor[p.status]}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {p.status === "DRAFT" && (
                        <Button size="sm" onClick={() => handleAction(p.id, "process")}>Proses</Button>
                      )}
                      {p.status === "PROCESSED" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(p.id, "pay")}>Bayar Semua</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {periods.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada periode</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Detail: {selected.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Tunjangan</TableHead>
                  <TableHead>Potongan</TableHead>
                  <TableHead>Gaji Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selected.entries ?? []).map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.employee?.name ?? entry.employeeName}</TableCell>
                    <TableCell>Rp {entry.baseSalary.toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {entry.allowances.toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {entry.deductions.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="font-semibold">Rp {entry.netSalary.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
                {(!selected.entries || selected.entries.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada entri</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
