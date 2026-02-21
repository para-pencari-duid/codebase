"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { QrCode, Smartphone, Wifi, WifiOff, AlertCircle, CheckCircle2, Settings2, RotateCcw } from "lucide-react";
import QRCode from "qrcode";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WhatsAppStatus {
  connected: boolean;
  enabled: boolean;
  tenantId?: string;
  lastConnected?: string;
  notifications?: {
    onTransaction: boolean;
    onLowStock: boolean;
    onBackup: boolean;
    dailyReport: boolean;
  };
}

interface SettingsData {
  ownerPhone?: string;
  notifyOnTransaction: boolean;
  notifyOnLowStock: boolean;
  notifyOnBackup: boolean;
  notifyDailyReport: boolean;
}

export function WhatsAppClient() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    ownerPhone: "",
    notifyOnTransaction: false,
    notifyOnLowStock: true,
    notifyOnBackup: true,
    notifyDailyReport: false,
  });
  const [saving, setSaving] = useState(false);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);

      if (data.notifications) {
        setSettings((prev) => ({
          ...prev,
          notifyOnTransaction: data.notifications.onTransaction,
          notifyOnLowStock: data.notifications.onLowStock,
          notifyOnBackup: data.notifications.onBackup,
          notifyDailyReport: data.notifications.dailyReport,
        }));
      }
    } catch (error) {
      console.error("Error fetching WA status:", error);
    }
  }, []);

  // Fetch settings (owner phone)
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      if (data.ownerPhone) {
        setSettings((prev) => ({ ...prev, ownerPhone: data.ownerPhone }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchSettings();
  }, [fetchStatus, fetchSettings]);

  // Initialize WhatsApp connection
  const handleConnect = async () => {
    try {
      setLoading(true);
      setQrCode(null);

      const res = await fetch("/api/whatsapp/init", { method: "POST" });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to initialize WhatsApp`);
      }

      const data = await res.json();

      if (data.connected) {
        toast.success("WhatsApp sudah terhubung!");
        await fetchStatus();
        return;
      }

      if (data.qrCode) {
        // Store tenant ID for this session
        setCurrentTenantId(data.tenantId);
        
        // Generate QR code image
        const qrDataUrl = await QRCode.toDataURL(data.qrCode, {
          width: 300,
          margin: 2,
        });
        setQrCode(qrDataUrl);
        toast.info("Scan QR code dengan WhatsApp Anda");

        // Wait 5 seconds before starting to poll
        // This gives WA time to complete pairing, reconnect, and authenticate
        setTimeout(async () => {
          setPolling(true);
          toast.info("Menunggu autentikasi WhatsApp...", { duration: 3000 });

          // Poll for connection status
          let pollCount = 0;
          const maxPolls = 20; // 20 polls x 3 seconds = 60 seconds max
          
          const pollInterval = setInterval(async () => {
            pollCount++;
            console.log(`[WA Client] Poll #${pollCount}, checking tenant: ${data.tenantId}`);
            
            const statusRes = await fetch(`/api/whatsapp/status?tenantId=${data.tenantId}`);
            const statusData = await statusRes.json();

            console.log("[WA Client] Status response:", statusData);

            if (statusData.connected && statusData.tenantId === data.tenantId) {
              clearInterval(pollInterval);
              setQrCode(null);
              setCurrentTenantId(null);
              setPolling(false);
              toast.success("WhatsApp terhubung! ✅");
              await fetchStatus();
            } else if (pollCount >= maxPolls) {
              // Timeout after max polls
              clearInterval(pollInterval);
              setQrCode(null);
              setCurrentTenantId(null);
              setPolling(false);
              toast.error("Timeout: QR code expired. Silakan coba lagi.");
            }
          }, 3000);
        }, 5000);
      }
    } catch (error) {
      console.error("Connect error:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(errMsg.includes("Session rusak") 
        ? errMsg 
        : "Gagal menghubungkan WhatsApp. Coba Reset WhatsApp jika masalah berlanjut.");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect WhatsApp (keep tenant ID)
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");

      toast.success("WhatsApp disconnected. Tenant ID tersimpan untuk reconnect.");
      await fetchStatus();
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Gagal disconnect WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  // Full reset WhatsApp (clear tenant ID)
  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");

      const data = await res.json();
      toast.success(data.message || "WhatsApp di-reset. Scan QR baru diperlukan.");
      
      // Clear local state
      setSettings({
        ownerPhone: "",
        notifyOnTransaction: false,
        notifyOnLowStock: false,
        notifyOnBackup: false,
        notifyDailyReport: false,
      });
      
      await fetchStatus();
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Gagal reset WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerPhone: settings.ownerPhone,
          notifyOnTransaction: settings.notifyOnTransaction,
          notifyOnLowStock: settings.notifyOnLowStock,
          notifyOnBackup: settings.notifyOnBackup,
          notifyDailyReport: settings.notifyDailyReport,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Pengaturan WhatsApp berhasil disimpan");
      await fetchStatus();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>WhatsApp Connection</CardTitle>
                <CardDescription>Hubungkan WhatsApp untuk notifikasi otomatis</CardDescription>
              </div>
            </div>
            {status?.connected ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" /> Terhubung
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" /> Tidak Terhubung
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.connected && !qrCode && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">WhatsApp Belum Terhubung</p>
                <p className="text-sm text-muted-foreground">
                  Hubungkan WhatsApp untuk mengirim notifikasi otomatis ke pelanggan
                </p>
              </div>
              <Button onClick={handleConnect} disabled={loading || !!qrCode} size="lg">
                {loading ? "Menghubungkan..." : "Hubungkan WhatsApp"}
              </Button>
            </div>
          )}

          {qrCode && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-white rounded-lg shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code" className="w-72 h-72" />
              </div>
              <div className="text-center space-y-2">
                {polling ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <p className="font-medium">Menunggu autentikasi...</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp sedang melakukan sinkronisasi.<br />
                      Mohon tunggu beberapa detik...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Scan QR Code dengan WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      1. Buka WhatsApp di HP Anda<br />
                      2. Tap Menu (⋮) → Perangkat Tertaut<br />
                      3. Tap "Tautkan Perangkat"<br />
                      4. Scan QR code di atas
                    </p>
                  </>
                )}
                <p className="text-xs text-orange-600">QR code berlaku 60 detik</p>
                {currentTenantId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Tenant: {currentTenantId}
                  </p>
                )}
              </div>
            </div>
          )}

          {status?.connected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">WhatsApp Terhubung</p>
                  {status.lastConnected && (
                    <p className="text-xs text-green-700">
                      Terakhir terhubung: {new Date(status.lastConnected).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Normal Disconnect - Keep tenant ID */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={loading}>
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Notifikasi WhatsApp akan berhenti sementara.<br/>
                          <strong>Session tersimpan</strong> - Anda bisa reconnect tanpa scan QR baru.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnect}>
                          Ya, Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Full Reset - Clear tenant ID */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={loading}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Total WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <div>Ini akan:</div>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Putuskan koneksi WhatsApp</li>
                            <li>Hapus tenant ID dan session</li>
                            <li>Reset semua pengaturan notifikasi</li>
                            <li>Memerlukan <strong>scan QR baru</strong> saat connect lagi</li>
                          </ul>
                          <div className="text-xs text-orange-600 mt-2">
                            💡 Gunakan ini untuk fresh start, ganti HP, atau fix error session.
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                          Ya, Reset Total
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}

          {!status?.connected && (
            <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">WhatsApp Service Status</p>
                <p className="text-xs mt-1">
                  Pastikan WA Gateway service berjalan di: <br />
                  <code className="bg-yellow-100 px-1 rounded">wa-services.tegararsyadani.my.id</code>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Settings2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Atur jenis notifikasi yang dikirim via WhatsApp</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Owner Phone */}
          <div className="space-y-2">
            <Label htmlFor="ownerPhone">Nomor WhatsApp Owner/Manager</Label>
            <Input
              id="ownerPhone"
              type="tel"
              placeholder="08123456789"
              value={settings.ownerPhone || ""}
              onChange={(e) => setSettings({ ...settings, ownerPhone: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Nomor ini akan menerima notifikasi penting (stok menipis, backup, laporan)
            </p>
          </div>

          <Separator />

          {/* Notification Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Transaksi</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim struk otomatis ke customer setelah transaksi
                </p>
              </div>
              <Switch
                checked={settings.notifyOnTransaction}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifyOnTransaction: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alert Stok Menipis</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim peringatan saat ada produk stok menipis
                </p>
              </div>
              <Switch
                checked={settings.notifyOnLowStock}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifyOnLowStock: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Konfirmasi saat backup database berhasil
                </p>
              </div>
              <Switch
                checked={settings.notifyOnBackup}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifyOnBackup: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Laporan Harian</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim ringkasan penjualan harian otomatis
                </p>
              </div>
              <Switch
                checked={settings.notifyDailyReport}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifyDailyReport: checked })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
