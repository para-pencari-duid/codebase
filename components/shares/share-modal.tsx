"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { alertSuccess, alertError } from "@/lib/swal";
import { Share2 } from "lucide-react";

type Product = { id: string; name: string };

export const ShareModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "selected" | "single">("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [singleId, setSingleId] = useState<string | null>(null);

  // clear selections when scope changes
  useEffect(() => {
    setSelectedIds([]);
    setSingleId(null);
  }, [scope]);
  const [expiresDays, setExpiresDays] = useState<number | "">(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const data = await res.json();
        setProducts(data.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (e) {
      }
    })();
  }, [open]);

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      const body: any = { scope };
      if (scope === 'selected') body.productIds = selectedIds;
      if (scope === 'single') body.singleProductId = singleId;
      if (Number(expiresDays) > 0) body.expiresIn = Number(expiresDays) * 24 * 60 * 60;

      const res = await fetch('/api/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Gagal');
      const { url } = await res.json();
      if (navigator.clipboard && url) await navigator.clipboard.writeText(url);
      alertSuccess('Link share disalin ke clipboard');
      setOpen(false);
    } catch (e) {
      alertError('Gagal membuat link share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Share2 className="mr-2 h-4 w-4" />
          Bagikan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Link Share</DialogTitle>
          <DialogDescription>Pilih scope yang akan dibagikan dan atur masa berlaku (hari).</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Scope</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2"><input type="radio" name="scope" checked={scope==='all'} onChange={() => setScope('all')} /> Semua</label>
              <label className="flex items-center gap-2"><input type="radio" name="scope" checked={scope==='selected'} onChange={() => setScope('selected')} /> Terpilih</label>
              <label className="flex items-center gap-2"><input type="radio" name="scope" checked={scope==='single'} onChange={() => setScope('single')} /> Tunggal</label>
            </div>
          </div>

          {scope === 'selected' && (
            <div>
              <label className="block text-sm font-medium mb-1">Pilih produk</label>
              <div className="max-h-48 overflow-auto border rounded p-2">
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-2 mb-1">
                    <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {scope === 'single' && (
            <div>
              <label className="block text-sm font-medium mb-1">Pilih produk</label>
              <select className="w-full border rounded p-2" value={singleId ?? ""} onChange={(e) => setSingleId(e.target.value || null)}>
                <option value="">-- pilih produk --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Masa berlaku (hari, kosong = permanen)</label>
            <Input type="number" value={expiresDays as any} onChange={(e) => setExpiresDays(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">Batal</Button>
          </DialogClose>
          <Button
            onClick={onSubmit}
            disabled={loading ||
              (scope === 'selected' && selectedIds.length === 0) ||
              (scope === 'single' && !singleId)}
          >
            {loading ? 'Membuat...' : 'Buat Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
