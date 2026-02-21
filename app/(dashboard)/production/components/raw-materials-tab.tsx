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
import { toast } from "sonner";
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
      toast.error("Gagal memuat bahan baku");
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

      toast.success(editing ? "Bahan baku berhasil diupdate" : "Bahan baku berhasil ditambahkan");
      setShowDialog(false);
      setEditing(null);
      setFormData({ name: "", sku: "", unit: "kg", stock: "0", minStock: "1", cost: "0", supplier: "" });
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
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
    if (!confirm("Hapus bahan baku ini?")) return;

    try {
      const res = await fetch(`/api/raw-materials/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success("Bahan baku berhasil dihapus");
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus bahan baku");
    }
  };

  const lowStockMaterials = materials.filter(m => m.stock <= m.minStock);

  return (
    <>
      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Bahan Baku Hampir Habis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              {lowStockMaterials.length} bahan baku memerlukan restok
            </p>
          </CardContent>
        </Card>
      )}

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Bahan Baku</CardTitle>
            <Button onClick={() => { setEditing(null); setShowDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Bahan Baku
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada bahan baku</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Min Stok</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.sku || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{material.stock} {material.unit}</span>
                        {material.stock <= material.minStock && (
                          <Badge variant="destructive" className="text-xs">Low</Badge>
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
        </CardContent>
      </Card>

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
