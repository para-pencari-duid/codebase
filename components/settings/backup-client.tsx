"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, Check, Database } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";

interface RestoreOptions {
  categories: boolean;
  products: boolean;
  customers: boolean;
  suppliers: boolean;
  settings: boolean;
}

export default function BackupClient() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<any>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    categories: true,
    products: true,
    customers: true,
    suppliers: true,
    settings: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      const response = await fetch("/api/backup");

      if (!response.ok) {
        throw new Error("Gagal membuat backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup berhasil diunduh");
    } catch (error) {
      toast.error("Gagal membuat backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.data) {
        toast.error("Format file backup tidak valid");
        return;
      }

      setPendingRestore(data);
      setConfirmDialogOpen(true);
    } catch (error) {
      toast.error("Gagal membaca file backup");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRestore = async () => {
    if (!pendingRestore) return;

    try {
      setRestoring(true);
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: pendingRestore,
          options: restoreOptions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      toast.success("Data berhasil di-restore");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal restore data");
    } finally {
      setRestoring(false);
      setConfirmDialogOpen(false);
      setPendingRestore(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Data
          </CardTitle>
          <CardDescription>
            Unduh semua data aplikasi dalam format JSON untuk backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadBackup} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Membuat Backup..." : "Unduh Backup"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore Data
          </CardTitle>
          <CardDescription>
            Pulihkan data dari file backup yang sudah dibuat sebelumnya
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Perhatian</p>
              <p>
                Restore akan menimpa data yang sudah ada dengan data dari file backup.
                Pastikan Anda sudah membuat backup sebelum melakukan restore.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Pilih data yang akan di-restore:</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(restoreOptions) as (keyof RestoreOptions)[]).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={restoreOptions[key]}
                    onCheckedChange={(checked) =>
                      setRestoreOptions((prev) => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key} className="capitalize">
                    {key === "categories" ? "Kategori" :
                     key === "products" ? "Produk" :
                     key === "customers" ? "Pelanggan" :
                     key === "suppliers" ? "Supplier" :
                     "Pengaturan"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
          >
            <Upload className="h-4 w-4 mr-2" />
            Pilih File Backup
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Restore</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRestore && (
                <>
                  File backup dibuat pada:{" "}
                  {new Date(pendingRestore.exportedAt).toLocaleString("id-ID")}
                  <br />
                  <br />
                  Data yang akan di-restore:
                  <ul className="list-disc list-inside mt-2">
                    {restoreOptions.categories && pendingRestore.data.categories && (
                      <li>{pendingRestore.data.categories.length} kategori</li>
                    )}
                    {restoreOptions.products && pendingRestore.data.products && (
                      <li>{pendingRestore.data.products.length} produk</li>
                    )}
                    {restoreOptions.customers && pendingRestore.data.customers && (
                      <li>{pendingRestore.data.customers.length} pelanggan</li>
                    )}
                    {restoreOptions.suppliers && pendingRestore.data.suppliers && (
                      <li>{pendingRestore.data.suppliers.length} supplier</li>
                    )}
                    {restoreOptions.settings && pendingRestore.data.settings && (
                      <li>Pengaturan toko</li>
                    )}
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
              {restoring ? "Memproses..." : "Restore Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
