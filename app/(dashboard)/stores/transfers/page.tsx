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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Store {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface Transfer {
  id: string;
  transferNo: string;
  fromStoreId: string;
  toStoreId: string;
  status: "PENDING" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED";
  createdAt: string;
  fromStore: Store;
  toStore: Store;
  items: TransferItem[];
}

interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
}

export default function StoreTransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    fromStoreId: "",
    toStoreId: "",
    notes: "",
  });

  const [transferItems, setTransferItems] = useState<
    { productId: string; quantity: number }[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transfersRes, storesRes, productsRes] = await Promise.all([
        fetch("/api/stores/transfers"),
        fetch("/api/stores"),
        fetch("/api/products"),
      ]);

      const transfersData = await transfersRes.json();
      const storesData = await storesRes.json();
      const productsData = await productsRes.json();

      setTransfers(transfersData.transfers || []);
      setStores(storesData.stores || []);
      setProducts(productsData.products || []);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity harus lebih dari 0");
      return;
    }

    const exists = transferItems.find((item) => item.productId === selectedProduct);
    if (exists) {
      toast.error("Produk sudah ditambahkan");
      return;
    }

    setTransferItems([...transferItems, { productId: selectedProduct, quantity }]);
    setSelectedProduct("");
    setQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setTransferItems(transferItems.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromStoreId || !formData.toStoreId) {
      toast.error("Pilih toko asal dan tujuan");
      return;
    }

    if (formData.fromStoreId === formData.toStoreId) {
      toast.error("Toko asal dan tujuan tidak boleh sama");
      return;
    }

    if (transferItems.length === 0) {
      toast.error("Tambahkan minimal 1 produk");
      return;
    }

    try {
      const res = await fetch("/api/stores/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: transferItems,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create transfer");
      }

      toast.success("Transfer berhasil dibuat");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat transfer");
    }
  };

  const resetForm = () => {
    setFormData({
      fromStoreId: "",
      toStoreId: "",
      notes: "",
    });
    setTransferItems([]);
    setSelectedProduct("");
    setQuantity(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Menunggu Persetujuan</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-yellow-500">Dalam Perjalanan</Badge>;
      case "RECEIVED":
        return <Badge className="bg-green-500">Diterima</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transfer Antar Toko</h2>
          <p className="text-muted-foreground">
            Kelola perpindahan stok antar cabang
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Transfer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transfers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transfers.filter((t) => t.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dalam Perjalanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transfers.filter((t) => t.status === "IN_TRANSIT").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transfers.filter((t) => t.status === "RECEIVED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transfer</CardTitle>
          <CardDescription>Semua transfer stok antar toko</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Transfer</TableHead>
                <TableHead>Dari Toko</TableHead>
                <TableHead>Ke Toko</TableHead>
                <TableHead>Total Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Belum ada transfer
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.transferNo}
                    </TableCell>
                    <TableCell>{transfer.fromStore?.name || "-"}</TableCell>
                    <TableCell>{transfer.toStore?.name || "-"}</TableCell>
                    <TableCell>{transfer.items?.length || 0} item</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>
                      {new Date(transfer.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Transfer Baru</DialogTitle>
            <DialogDescription>
              Transfer stok dari satu toko ke toko lainnya
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Store Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromStore">Dari Toko *</Label>
                  <Select
                    value={formData.fromStoreId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fromStoreId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih toko asal" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toStore">Ke Toko *</Label>
                  <Select
                    value={formData.toStoreId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, toStoreId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih toko tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Product */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Tambah Produk</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((p) => p.stock > 0)
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Stok: {product.stock})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                    <Button type="button" onClick={handleAddItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {transferItems.length > 0 && (
                <div className="border rounded-md p-3">
                  <Label className="text-sm font-semibold">
                    Produk yang akan ditransfer ({transferItems.length} item)
                  </Label>
                  <div className="space-y-2 mt-2">
                    {transferItems.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm">
                            {product?.name} - Qty: {item.quantity}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.productId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit">Buat Transfer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
