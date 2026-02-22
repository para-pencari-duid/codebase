"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Feedback {
  id: string;
  rating: number;
  comment?: string;
  channel: string;
  createdAt: string;
  customer?: { name: string };
  customerName?: string;
}

interface FeedbackData {
  feedbacks: Feedback[];
  nps?: number;
  averageRating?: number;
}

const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

export default function FeedbackClient() {
  const [data, setData] = useState<FeedbackData>({ feedbacks: [], nps: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ rating: "5", comment: "", channel: "DIRECT" });

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/feedback");
      const json = await res.json();
      setData({
        feedbacks: json.feedbacks ?? json,
        nps: json.nps ?? 0,
        averageRating: json.averageRating ?? 0,
      });
    } catch {
      toast.error("Gagal memuat feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Feedback berhasil ditambahkan");
      setForm({ rating: "5", comment: "", channel: "DIRECT" });
      fetchFeedback();
    } catch {
      toast.error("Gagal menambahkan feedback");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>NPS Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-center py-4">{data.nps ?? 0}</div>
            <p className="text-center text-muted-foreground">Net Promoter Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tambah Feedback</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Rating</Label>
                <Select value={form.rating} onValueChange={v => setForm(p => ({ ...p, rating: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{stars(n)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["DIRECT","WHATSAPP","GOOGLE","ONLINE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Komentar</Label><Textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} /></div>
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Menyimpan..." : "Kirim Feedback"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar Feedback</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Komentar</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.feedbacks.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.customer?.name ?? f.customerName ?? "Anonim"}</TableCell>
                  <TableCell className="text-yellow-500">{stars(f.rating)}</TableCell>
                  <TableCell>{f.comment ?? "-"}</TableCell>
                  <TableCell>{f.channel}</TableCell>
                  <TableCell>{new Date(f.createdAt).toLocaleDateString("id-ID")}</TableCell>
                </TableRow>
              ))}
              {data.feedbacks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada feedback</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
