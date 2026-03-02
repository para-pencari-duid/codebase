"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";
import { formatCurrency } from "@/lib/dashboard-utils";

interface RawMaterial {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
  supplier: string | null;
  isActive: boolean;
}

export function RawMaterialsTab() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unit: "kg",
    stock: "0",
    minStock: "1",
    cost: "0",
    supplier: "",
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/raw-materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      alertError("Gagal memuat bahan baku");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editing ? `/api/raw-materials/${editing.id}` : "/api/raw-materials";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      alertSuccess(editing ? "Bahan baku berhasil diupdate" : "Bahan baku berhasil ditambahkan");
      setShowDialog(false);
      setEditing(null);
      setFormData({ name: "", sku: "", unit: "kg", stock: "0", minStock: "1", cost: "0", supplier: "" });
      fetchMaterials();
    } catch (error: any) {
      alertError(error.message || "Terjadi kesalahan");
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setEditing(material);
    setFormData({
      name: material.name,
      sku: material.sku || "",
      unit: material.unit,
      stock: material.stock.toString(),
      minStock: material.minStock.toString(),
      cost: material.cost.toString(),
      supplier: material.supplier || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDestroy({ title: "Hapus bahan baku?", description: "Bahan baku akan dihapus permanen." });
    if (!ok) return;

    try {
      const res = await fetch(`/api/raw-materials/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      alertSuccess("Bahan baku berhasil dihapus");
      fetchMaterials();
    } catch (error: any) {
      alertError(error.message || "Gagal menghapus bahan baku");
    }
  };

  const lowStockMaterials = materials.filter(m => m.stock <= m.minStock);

  return (
    <>
      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "oklch(0.97 0.06 60)", border: "1px solid oklch(0.85 0.06 60)" }}>
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "oklch(0.50 0.14 55)" }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: "oklch(0.40 0.14 55)" }}>Bahan Baku Hampir Habis</p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.10 55)" }}>{lowStockMaterials.length} bahan baku memerlukan restok</p>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold text-gray-700">Daftar Bahan Baku</p>
          <Button size="sm" onClick={() => { setEditing(null); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah
          </Button>
        </div>
          {loading ? (
            <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
          ) : materials.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada bahan baku</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ background: "oklch(0.97 0.002 80)" }}>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id} className="hover:bg-gray-50/60 transition-colors">
                    <TableCell className="font-medium text-gray-900">{material.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{material.sku || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{material.stock} {material.unit}</span>
                        {material.stock <= material.minStock && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "oklch(0.94 0.08 20)", color: "oklch(0.45 0.16 20)" }}>Low</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{material.minStock} {material.unit}</TableCell>
                    <TableCell>{formatCurrency(material.cost)}/{material.unit}</TableCell>
                    <TableCell>{material.supplier || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(material)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(material.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</DialogTitle>
            <DialogDescription>Isi form untuk menambah/edit bahan baku</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Satuan *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.001"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stok</Label>
                <Input
                  id="minStock"
                  type="number"
                  step="0.001"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cost">Harga per Satuan</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">{editing ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
