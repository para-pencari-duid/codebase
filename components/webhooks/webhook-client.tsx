"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ALL_EVENTS = ["order.created", "order.paid", "customer.created", "inventory.low"];

interface Webhook {
  id: string;
  url: string;
  description?: string;
  events: string[];
  isActive: boolean;
  logCount?: number;
}

export default function WebhookClient() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ url: "", description: "", events: [] as string[] });

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      setWebhooks(data.webhooks ?? data);
    } catch {
      toast.error("Gagal memuat webhook");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const toggleEvent = (event: string) => {
    setForm(p => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter(e => e !== event) : [...p.events, event],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Webhook berhasil dibuat");
      setOpen(false);
      setForm({ url: "", description: "", events: [] });
      fetchWebhooks();
    } catch {
      toast.error("Gagal membuat webhook");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status diperbarui");
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, isActive: !isActive } : w));
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Webhook dihapus");
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } catch {
      toast.error("Gagal menghapus webhook");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Webhook Endpoints</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Tambah Webhook</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Webhook</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>URL</Label><Input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required placeholder="https://..." /></div>
              <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div>
                <Label>Events</Label>
                <div className="mt-2 space-y-2">
                  {ALL_EVENTS.map(ev => (
                    <div key={ev} className="flex items-center gap-2">
                      <input type="checkbox" id={ev} checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                      <Label htmlFor={ev} className="font-mono text-sm">{ev}</Label>
                    </div>
                  ))}
                </div>
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
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Log</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map(w => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-sm max-w-48 truncate">{w.url}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {w.events.map(ev => <Badge key={ev} variant="outline" className="text-xs">{ev}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={w.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {w.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>{w.logCount ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(w.id, w.isActive)}>
                      {w.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300"
                      onClick={() => deleteWebhook(w.id)}>Hapus</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {webhooks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada webhook</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
