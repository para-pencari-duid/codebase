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
import { toast } from "sonner";
import { ClipboardList, Plus, Play, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StockOpname {
  id: string;
  opnameNo: string;
  scheduledDate: string;
  completedDate?: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  totalItems: number;
  totalVariance: number;
  items: StockOpnameItem[];
}

interface StockOpnameItem {
  id: string;
  productId: string;
  productName: string;
  systemStock: number;
  countedStock: number;
  variance: number;
}

export default function StockOpnamePage() {
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [countDialogOpen, setCountDialogOpen] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [countedStocks, setCountedStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchOpnames();
  }, []);

  const fetchOpnames = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-opname");
      const data = await res.json();
      setOpnames(data.opnames || []);
    } catch (error) {
      toast.error("Gagal memuat data stock opname");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpname = async () => {
    if (!scheduledDate) {
      toast.error("Tanggal harus diisi");
      return;
    }

    try {
      const res = await fetch("/api/stock-opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to create opname");

      toast.success("Stock opname berhasil dibuat");
      setCreateDialogOpen(false);
      setScheduledDate("");
      fetchOpnames();
    } catch (error) {
      toast.error("Gagal membuat stock opname");
    }
  };

  const handleStartOpname = async (opname: StockOpname) => {
    try {
      const res = await fetch(`/api/stock-opname/${opname.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
        }),
      });

      if (!res.ok) throw new Error("Failed to start opname");

      const updated = await res.json();
      setSelectedOpname(updated.opname);
      const initialCounts: Record<string, number> = {};
      updated.opname.items.forEach((item: StockOpnameItem) => {
        initialCounts[item.id] = item.systemStock;
      });
      setCountedStocks(initialCounts);
      setCountDialogOpen(true);
      fetchOpnames();
    } catch (error) {
      toast.error("Gagal memulai stock opname");
    }
  };

  const handleSaveCount = async () => {
    if (!selectedOpname) return;

    try {
      const items = selectedOpname.items.map((item) => ({
        id: item.id,
        countedStock: countedStocks[item.id] || 0,
      }));

      const res = await fetch(`/api/stock-opname/${selectedOpname.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          items,
        }),
      });

      if (!res.ok) throw new Error("Failed to save count");

      toast.success("Data hitungan disimpan");
      fetchOpnames();
    } catch (error) {
      toast.error("Gagal menyimpan data hitungan");
    }
  };

  const handleCompleteOpname = async () => {
    if (!selectedOpname) return;

    try {
      const items = selectedOpname.items.map((item) => ({
        id: item.id,
        countedStock: countedStocks[item.id] || 0,
      }));

      const res = await fetch(`/api/stock-opname/${selectedOpname.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          items,
        }),
      });

      if (!res.ok) throw new Error("Failed to complete opname");

      toast.success("Stock opname selesai! Stok telah disesuaikan.");
      setCountDialogOpen(false);
      setSelectedOpname(null);
      fetchOpnames();
    } catch (error) {
      toast.error("Gagal menyelesaikan stock opname");
    }
  };

  const handleResumeCount = (opname: StockOpname) => {
    setSelectedOpname(opname);
    const initialCounts: Record<string, number> = {};
    opname.items.forEach((item) => {
      initialCounts[item.id] = item.countedStock;
    });
    setCountedStocks(initialCounts);
    setCountDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline">Terjadwal</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500">Sedang Berjalan</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500">Selesai</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalVariance = selectedOpname
    ? Object.entries(countedStocks).reduce((sum, [itemId, counted]) => {
        const item = selectedOpname.items.find((i) => i.id === itemId);
        if (!item) return sum;
        return sum + (counted - item.systemStock);
      }, 0)
    : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Opname</h2>
          <p className="text-muted-foreground">
            Audit dan penyesuaian stok inventori
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Stock Opname
        </Button>
      </div>

      {/* Opname List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Stock Opname</CardTitle>
          <CardDescription>
            Daftar semua kegiatan stock opname
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Opname</TableHead>
                <TableHead>Tanggal Jadwal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Item</TableHead>
                <TableHead>Total Variance</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : opnames.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Belum ada stock opname
                  </TableCell>
                </TableRow>
              ) : (
                opnames.map((opname) => (
                  <TableRow key={opname.id}>
                    <TableCell className="font-medium">{opname.opnameNo}</TableCell>
                    <TableCell>
                      {new Date(opname.scheduledDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{getStatusBadge(opname.status)}</TableCell>
                    <TableCell>{opname.totalItems}</TableCell>
                    <TableCell>
                      {opname.totalVariance > 0 ? (
                        <span className="text-green-600 font-semibold">
                          +{opname.totalVariance}
                        </span>
                      ) : opname.totalVariance < 0 ? (
                        <span className="text-red-600 font-semibold">
                          {opname.totalVariance}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {opname.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartOpname(opname)}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Mulai
                        </Button>
                      )}
                      {opname.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResumeCount(opname)}
                        >
                          <ClipboardList className="mr-2 h-3 w-3" />
                          Lanjutkan
                        </Button>
                      )}
                      {opname.status === "COMPLETED" && (
                        <span className="text-xs text-muted-foreground">
                          {opname.completedDate &&
                            new Date(opname.completedDate).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Stock Opname Baru</DialogTitle>
            <DialogDescription>
              Buat jadwal stock opname untuk audit inventori
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduledDate">Tanggal Jadwal</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Semua produk aktif akan dimasukkan ke dalam stock opname
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateOpname}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Count Dialog */}
      <Dialog open={countDialogOpen} onOpenChange={setCountDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hitung Stock - {selectedOpname?.opnameNo}</DialogTitle>
            <DialogDescription>
              Input hasil hitungan fisik untuk setiap produk
            </DialogDescription>
          </DialogHeader>

          {selectedOpname && (
            <>
              {/* Summary Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Item</p>
                      <p className="text-2xl font-bold">{selectedOpname.totalItems}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Variance</p>
                      <p
                        className={`text-2xl font-bold ${
                          totalVariance > 0
                            ? "text-green-600"
                            : totalVariance < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {totalVariance > 0 ? "+" : ""}
                        {totalVariance}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-2xl font-bold">
                        {getStatusBadge(selectedOpname.status)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Stok Sistem</TableHead>
                      <TableHead className="text-right">Stok Hitungan</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOpname.items.map((item) => {
                      const counted = countedStocks[item.id] || 0;
                      const variance = counted - item.systemStock;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.systemStock}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              value={counted}
                              onChange={(e) =>
                                setCountedStocks({
                                  ...countedStocks,
                                  [item.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${
                                variance > 0
                                  ? "text-green-600"
                                  : variance < 0
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {variance > 0 ? "+" : ""}
                              {variance}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Klik <strong>Simpan</strong> untuk menyimpan progress, atau{" "}
                  <strong>Selesai</strong> untuk menyelesaikan dan menyesuaikan
                  stok sistem.
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCountDialogOpen(false);
                setSelectedOpname(null);
              }}
            >
              Tutup
            </Button>
            <Button variant="secondary" onClick={handleSaveCount}>
              <Save className="mr-2 h-4 w-4" />
              Simpan Progress
            </Button>
            <Button onClick={handleCompleteOpname}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Selesai & Sesuaikan Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
