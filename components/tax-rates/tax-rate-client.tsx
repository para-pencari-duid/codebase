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

interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: number;
  isDefault: boolean;
  isInclusive: boolean;
  isActive: boolean;
}

const emptyForm = { name: "", code: "", rate: "", isDefault: false, isInclusive: false, isActive: true };

export default function TaxRateClient() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTaxRates = async () => {
    try {
      const res = await fetch("/api/tax-rates");
      const data = await res.json();
      setTaxRates(data.taxRates ?? data);
    } catch {
      toast.error("Gagal memuat pajak");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaxRates(); }, []);

  const openEdit = (tr: TaxRate) => {
    setEditing(tr);
    setForm({ name: tr.name, code: tr.code, rate: String(tr.rate), isDefault: tr.isDefault, isInclusive: tr.isInclusive, isActive: tr.isActive });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, rate: Number(form.rate) };
      const res = editing
        ? await fetch(`/api/tax-rates`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) })
        : await fetch("/api/tax-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Pajak diperbarui" : "Pajak ditambahkan");
      setOpen(false);
      fetchTaxRates();
    } catch {
      toast.error("Gagal menyimpan pajak");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tarif Pajak</CardTitle>
        <Button onClick={openCreate}>Tambah Pajak</Button>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Pajak" : "Tambah Pajak"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><Label>Kode</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required /></div>
              <div><Label>Tarif (%)</Label><Input type="number" step="0.01" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} required /></div>
              <div className="flex flex-col gap-2">
                {([["isDefault", "Default"], ["isInclusive", "Inklusif"], ["isActive", "Aktif"]] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input type="checkbox" id={key} checked={form[key] as boolean}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Simpan"}</Button>
            </form>
          </DialogContent>
        </Dialog>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Tarif</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Inklusif</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxRates.map(tr => (
              <TableRow key={tr.id}>
                <TableCell>{tr.name}</TableCell>
                <TableCell>{tr.code}</TableCell>
                <TableCell>{tr.rate}%</TableCell>
                <TableCell>{tr.isDefault && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}</TableCell>
                <TableCell>{tr.isInclusive ? "Ya" : "Tidak"}</TableCell>
                <TableCell>
                  <Badge className={tr.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {tr.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => openEdit(tr)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {taxRates.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada tarif pajak</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
