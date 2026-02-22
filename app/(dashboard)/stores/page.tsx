"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Store, Plus, MapPin, User, Package, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Store {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  manager?: string;
  isMainStore: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    manager: "",
    isMainStore: false,
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stores");
      const data = await res.json();
      setStores(data.stores || []);
    } catch (error) {
      toast.error("Gagal memuat data toko");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error("Kode dan nama toko harus diisi");
      return;
    }

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create store");
      }

      toast.success("Toko berhasil ditambahkan");
      setDialogOpen(false);
      setFormData({
        code: "",
        name: "",
        address: "",
        phone: "",
        manager: "",
        isMainStore: false,
      });
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan toko");
    }
  };

  const activeStoresCount = stores.filter((s) => s.isActive).length;
  const mainStore = stores.find((s) => s.isMainStore);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Multi-Store Management</h2>
          <p className="text-muted-foreground">
            Kelola cabang dan transfer stok antar toko
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/stores/transfers")}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer Antar Toko
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Toko
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeStoresCount} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toko Utama</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mainStore ? mainStore.name : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {mainStore ? mainStore.code : "Belum ada toko utama"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cabang</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s) => !s.isMainStore).length}
            </div>
            <p className="text-xs text-muted-foreground">Toko cabang</p>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Toko</CardTitle>
          <CardDescription>Semua lokasi toko dan cabang</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Toko</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Belum ada toko terdaftar
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {store.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {store.address || "-"}
                    </TableCell>
                    <TableCell>
                      {store.manager ? (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {store.manager}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {store.isActive ? (
                        <Badge className="bg-green-500">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {store.isMainStore ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                          Toko Utama
                        </Badge>
                      ) : (
                        <Badge variant="outline">Cabang</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Toko Baru</DialogTitle>
            <DialogDescription>
              Daftarkan toko atau cabang baru ke sistem
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Kode Toko *</Label>
                <Input
                  id="code"
                  placeholder="CB001"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Nama Toko *</Label>
                <Input
                  id="name"
                  placeholder="Cabang Sudirman"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  placeholder="Jl. Sudirman No. 123"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  placeholder="Nama Manager"
                  value={formData.manager}
                  onChange={(e) =>
                    setFormData({ ...formData, manager: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isMainStore"
                  type="checkbox"
                  checked={formData.isMainStore}
                  onChange={(e) =>
                    setFormData({ ...formData, isMainStore: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="isMainStore" className="cursor-pointer">
                  Toko Utama (hanya boleh 1)
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
