"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface PriceList {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  itemCount?: number;
}

export default function PriceListClient() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isDefault: false });
  const [saving, setSaving] = useState(false);

  const fetchPriceLists = async () => {
    try {
      const res = await fetch("/api/price-lists");
      const data = await res.json();
      setPriceLists(data.priceLists ?? data);
    } catch {
      toast.error("Gagal memuat daftar harga");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPriceLists(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Daftar harga berhasil dibuat");
      setOpen(false);
      setForm({ name: "", description: "", isDefault: false });
      fetchPriceLists();
    } catch {
      toast.error("Gagal membuat daftar harga");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daftar Harga</CardTitle>
          <CardDescription>Kelola daftar harga untuk berbagai segmen pelanggan</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Buat Daftar Harga</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Daftar Harga Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={form.isDefault}
                  onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                <Label htmlFor="isDefault">Jadikan default</Label>
              </div>
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
              <TableHead>Deskripsi</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Jumlah Item</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceLists.map(pl => (
              <TableRow key={pl.id}>
                <TableCell className="font-medium">{pl.name}</TableCell>
                <TableCell>{pl.description ?? "-"}</TableCell>
                <TableCell>
                  {pl.isDefault && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                </TableCell>
                <TableCell>{pl.itemCount ?? 0}</TableCell>
              </TableRow>
            ))}
            {priceLists.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Belum ada daftar harga</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
