"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

interface JournalEntry {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  totalDebit: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  currentBalance: number;
}

interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export default function AccountingClient() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openJournal, setOpenJournal] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [journalForm, setJournalForm] = useState({ date: "", description: "" });
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: "", debit: 0, credit: 0 },
    { accountId: "", debit: 0, credit: 0 },
  ]);
  const [accountForm, setAccountForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
  });

  const fetchAll = async () => {
    try {
      const [j, a] = await Promise.all([
        fetch("/api/journal-entries").then((r) => r.json()),
        fetch("/api/accounts").then((r) => r.json()),
      ]);
      setJournals(j.journalEntries ?? j);
      setAccounts(a.accounts ?? a);
    } catch {
      toast.error("Gagal memuat data akuntansi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addLine = () =>
    setLines((l) => [...l, { accountId: "", debit: 0, credit: 0 }]);
  const removeLine = (i: number) =>
    setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof JournalLine, value: string) =>
    setLines((l) =>
      l.map((line, idx) =>
        idx === i
          ? { ...line, [field]: field === "accountId" ? value : Number(value) }
          : line,
      ),
    );

  const submitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...journalForm, lines }),
      });
      if (!res.ok) throw new Error();
      toast.success("Jurnal berhasil dibuat");
      setOpenJournal(false);
      fetchAll();
    } catch {
      toast.error("Gagal membuat jurnal");
    } finally {
      setSaving(false);
    }
  };

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      if (!res.ok) throw new Error();
      toast.success("Akun berhasil ditambahkan");
      setOpenAccount(false);
      setAccountForm({ code: "", name: "", type: "ASSET" });
      fetchAll();
    } catch {
      toast.error("Gagal menambah akun");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akuntansi</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="jurnal">
          <TabsList>
            <TabsTrigger value="jurnal">Jurnal</TabsTrigger>
            <TabsTrigger value="akun">Akun</TabsTrigger>
          </TabsList>

          <TabsContent value="jurnal" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openJournal} onOpenChange={setOpenJournal}>
                <DialogTrigger asChild>
                  <Button>Buat Jurnal</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Buat Jurnal Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={submitJournal} className="space-y-3">
                    <div>
                      <Label>Tanggal</Label>
                      <Input
                        type="date"
                        value={journalForm.date}
                        onChange={(e) =>
                          setJournalForm((p) => ({
                            ...p,
                            date: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Deskripsi</Label>
                      <Textarea
                        value={journalForm.description}
                        onChange={(e) =>
                          setJournalForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Baris Jurnal</Label>
                      {lines.map((line, i) => (
                        <div key={i} className="flex gap-2 mt-2">
                          <Select
                            value={line.accountId}
                            onValueChange={(v) => updateLine(i, "accountId", v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Akun" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.code} - {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="w-28"
                            type="text"
                            inputMode="numeric"
                            aria-label={`Debit baris ${i + 1}`}
                            placeholder="Debit"
                            value={formatNumberInputValue(line.debit)}
                            onChange={(e) =>
                              updateLine(
                                i,
                                "debit",
                                String(parseDigitsToNumber(e.target.value)),
                              )
                            }
                          />
                          <Input
                            className="w-28"
                            type="text"
                            inputMode="numeric"
                            aria-label={`Kredit baris ${i + 1}`}
                            placeholder="Kredit"
                            value={formatNumberInputValue(line.credit)}
                            onChange={(e) =>
                              updateLine(
                                i,
                                "credit",
                                String(parseDigitsToNumber(e.target.value)),
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(i)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={addLine}
                      >
                        + Tambah Baris
                      </Button>
                    </div>
                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? "Menyimpan..." : "Buat Jurnal"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Jurnal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Total Debit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>{j.entryNo}</TableCell>
                    <TableCell>
                      {new Date(j.date).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{j.description}</TableCell>
                    <TableCell>
                      Rp {j.totalDebit.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
                {journals.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Belum ada jurnal
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="akun" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openAccount} onOpenChange={setOpenAccount}>
                <DialogTrigger asChild>
                  <Button>Tambah Akun</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Akun</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={submitAccount} className="space-y-3">
                    <div>
                      <Label>Kode</Label>
                      <Input
                        value={accountForm.code}
                        onChange={(e) =>
                          setAccountForm((p) => ({
                            ...p,
                            code: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Nama</Label>
                      <Input
                        value={accountForm.name}
                        onChange={(e) =>
                          setAccountForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Tipe</Label>
                      <Select
                        value={accountForm.type}
                        onValueChange={(v) =>
                          setAccountForm((p) => ({ ...p, type: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "ASSET",
                            "LIABILITY",
                            "EQUITY",
                            "REVENUE",
                            "EXPENSE",
                          ].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={saving} className="w-full">
                      {saving ? "Menyimpan..." : "Tambah"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>
                      Rp {(a.currentBalance ?? 0).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
                {accounts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Belum ada akun
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
