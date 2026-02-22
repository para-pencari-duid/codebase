"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const PLATFORMS = ["Tokopedia", "Shopee", "Lazada", "Bukalapak"];

interface MarketplaceIntegration {
  id: string;
  platform: string;
  shopName?: string;
  isConnected: boolean;
  lastSyncAt?: string;
}

export default function MarketplaceClient() {
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ apiKey: "", apiSecret: "", accessToken: "", shopName: "" });

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/marketplace");
      const data = await res.json();
      setIntegrations(data.integrations ?? data);
    } catch {
      toast.error("Gagal memuat integrasi marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIntegrations(); }, []);

  const getIntegration = (platform: string) =>
    integrations.find(i => i.platform === platform);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectPlatform) return;
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: connectPlatform, ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${connectPlatform} berhasil dihubungkan`);
      setConnectPlatform(null);
      setForm({ apiKey: "", apiSecret: "", accessToken: "", shopName: "" });
      fetchIntegrations();
    } catch {
      toast.error("Gagal menghubungkan marketplace");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (id: string, platform: string) => {
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${platform} sedang disinkronisasi`);
      fetchIntegrations();
    } catch {
      toast.error("Gagal sinkronisasi");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Integrasi Marketplace</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => {
          const integration = getIntegration(platform);
          return (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{platform}</CardTitle>
                  <Badge className={integration?.isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {integration?.isConnected ? "Terhubung" : "Belum Terhubung"}
                  </Badge>
                </div>
                {integration?.shopName && (
                  <CardDescription>Toko: {integration.shopName}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {integration?.lastSyncAt && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Sinkronisasi terakhir: {new Date(integration.lastSyncAt).toLocaleString("id-ID")}
                  </p>
                )}
                <div className="flex gap-2">
                  <Dialog open={connectPlatform === platform} onOpenChange={v => setConnectPlatform(v ? platform : null)}>
                    <DialogTrigger asChild>
                      <Button variant={integration?.isConnected ? "outline" : "default"} size="sm">
                        {integration?.isConnected ? "Perbarui" : "Hubungkan"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Hubungkan {platform}</DialogTitle></DialogHeader>
                      <form onSubmit={handleConnect} className="space-y-3">
                        <div><Label>Nama Toko</Label><Input value={form.shopName} onChange={e => setForm(p => ({ ...p, shopName: e.target.value }))} /></div>
                        <div><Label>API Key</Label><Input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} required /></div>
                        <div><Label>API Secret</Label><Input type="password" value={form.apiSecret} onChange={e => setForm(p => ({ ...p, apiSecret: e.target.value }))} required /></div>
                        <div><Label>Access Token</Label><Input value={form.accessToken} onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))} /></div>
                        <Button type="submit" disabled={saving} className="w-full">{saving ? "Menghubungkan..." : "Hubungkan"}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {integration?.isConnected && (
                    <Button size="sm" variant="outline" onClick={() => handleSync(integration.id, platform)}>
                      Sinkronisasi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
