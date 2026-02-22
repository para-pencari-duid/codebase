"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Consignment {
  id: string;
  consignNo: string;
  consignerName: string;
  consignerPhone: string;
  startDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
  commission?: number;
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ConsignmentClient() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ consignerName: "", consignerPhone: "", startDate: "", notes: "", commission: "" });
  const [saving, setSaving] = useState(false);

  const fetchConsignments = async () => {
    try {
      const res = await fetch("/api/consignments");
      const data = await res.json();
      setConsignments(data.consignments ?? data);
    } catch {
      toast.error("Gagal memuat konsinyasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsignments(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/consignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, commission: form.commission ? Number(form.commission) : undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success("Konsinyasi berhasil dibuat");
      setOpen(false);
      setForm({ consignerName: "", consignerPhone: "", startDate: "", notes: "", commission: "" });
      fetchConsignments();
    } catch {
      toast.error("Gagal membuat konsinyasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Konsinyasi</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Konsinyasi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Konsinyasi Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Nama Konsignor</Label><Input value={form.consignerName} onChange={e => setForm(p => ({ ...p, consignerName: e.target.value }))} required /></div>
              <div><Label>No. Telepon</Label><Input value={form.consignerPhone} onChange={e => setForm(p => ({ ...p, consignerPhone: e.target.value }))} /></div>
              <div><Label>Tanggal Mulai</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required /></div>
              <div><Label>Komisi (%)</Label><Input type="number" step="0.01" value={form.commission} onChange={e => setForm(p => ({ ...p, commission: e.target.value }))} /></div>
              <div><Label>Catatan</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Buat"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Konsinyasi</TableHead>
              <TableHead>Nama Konsignor</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Tanggal Mulai</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consignments.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.consignNo}</TableCell>
                <TableCell>{c.consignerName}</TableCell>
                <TableCell>{c.consignerPhone}</TableCell>
                <TableCell>{new Date(c.startDate).toLocaleDateString("id-ID")}</TableCell>
                <TableCell><Badge className={statusColor[c.status]}>{c.status}</Badge></TableCell>
              </TableRow>
            ))}
            {consignments.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada konsinyasi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
