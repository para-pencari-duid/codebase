"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Phone, Mail, MapPin, Edit, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import SupplierForm from "./supplier-form";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactName: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    purchases: number;
  };
}

export default function SupplierClient() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      
      const response = await fetch(`/api/suppliers?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSuppliers(data.data);
      } else {
        toast.error(data.error || "Gagal memuat data supplier");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchSuppliers();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Gagal menghapus supplier");
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    fetchSuppliers();
  };

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <Heading
          title="Manajemen Supplier"
          description="Kelola data supplier dan pemasok"
        />
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier 
                  ? "Ubah informasi supplier" 
                  : "Masukkan data supplier baru"}
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              initialData={editingSupplier}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Belum ada supplier</h3>
            <p className="text-muted-foreground text-sm">
              Tambahkan supplier pertama Anda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className={!supplier.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    {supplier.contactName && (
                      <CardDescription>{supplier.contactName}</CardDescription>
                    )}
                  </div>
                  <Badge variant={supplier.isActive ? "default" : "secondary"}>
                    {supplier.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                )}
                
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {supplier._count.purchases} pembelian
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSupplierToDelete(supplier);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              {supplierToDelete?._count.purchases && supplierToDelete._count.purchases > 0
                ? "Supplier ini memiliki riwayat pembelian dan hanya akan dinonaktifkan."
                : "Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
