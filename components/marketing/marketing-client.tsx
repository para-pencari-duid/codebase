"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
  type: "WHATSAPP" | "EMAIL" | "SMS";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
  totalRecipients: number;
  sentCount: number;
  scheduledAt?: string;
}

const typeColor: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-800",
  EMAIL: "bg-blue-100 text-blue-800",
  SMS: "bg-yellow-100 text-yellow-800",
};
const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  SENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function MarketingClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "WHATSAPP", message: "", targetSegment: "", scheduledAt: "" });

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/marketing/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? data);
    } catch {
      toast.error("Gagal memuat kampanye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Kampanye berhasil dibuat");
      setOpen(false);
      setForm({ name: "", type: "WHATSAPP", message: "", targetSegment: "", scheduledAt: "" });
      fetchCampaigns();
    } catch {
      toast.error("Gagal membuat kampanye");
    } finally {
      setSaving(false);
    }
  };

  const sendNow = async (id: string) => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Kampanye dikirim");
      fetchCampaigns();
    } catch {
      toast.error("Gagal mengirim kampanye");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kampanye Marketing</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Buat Kampanye</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Kampanye Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div>
                <Label>Tipe</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Pesan</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} /></div>
              <div><Label>Target Segmen</Label><Input value={form.targetSegment} onChange={e => setForm(p => ({ ...p, targetSegment: e.target.value }))} /></div>
              <div><Label>Jadwal Kirim</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Buat"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Penerima</TableHead>
              <TableHead>Terkirim</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell><Badge className={typeColor[c.type]}>{c.type}</Badge></TableCell>
                <TableCell><Badge className={statusColor[c.status]}>{c.status}</Badge></TableCell>
                <TableCell>{c.totalRecipients}</TableCell>
                <TableCell>{c.sentCount}</TableCell>
                <TableCell>
                  {(c.status === "DRAFT" || c.status === "SCHEDULED") && (
                    <Button size="sm" onClick={() => sendNow(c.id)}>Kirim Sekarang</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {campaigns.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada kampanye</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
