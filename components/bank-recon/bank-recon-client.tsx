"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  balance: number;
}

interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  isReconciled: boolean;
}

export default function BankReconClient() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatements, setLoadingStatements] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch("/api/bank-accounts");
      const data = await res.json();
      setBankAccounts(data.bankAccounts ?? data);
    } catch {
      toast.error("Gagal memuat rekening bank");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async (accountId: string) => {
    setLoadingStatements(true);
    try {
      const res = await fetch(`/api/bank-statements?bankAccountId=${accountId}`);
      const data = await res.json();
      setStatements(data.statements ?? data);
    } catch {
      toast.error("Gagal memuat mutasi rekening");
    } finally {
      setLoadingStatements(false);
    }
  };

  useEffect(() => { fetchBankAccounts(); }, []);

  const selectAccount = (acc: BankAccount) => {
    setSelectedAccount(acc);
    fetchStatements(acc.id);
  };

  const markReconciled = async (statementId: string) => {
    try {
      const res = await fetch(`/api/bank-statements/${statementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReconciled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Mutasi ditandai terrekonsiliasi");
      setStatements(prev => prev.map(s => s.id === statementId ? { ...s, isReconciled: true } : s));
    } catch {
      toast.error("Gagal merekonsiliasi");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Rekening Bank</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bankAccounts.map(acc => (
              <button key={acc.id}
                className={`p-4 rounded-lg border text-left transition-colors ${selectedAccount?.id === acc.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                onClick={() => selectAccount(acc)}>
                <div className="font-semibold">{acc.bankName}</div>
                <div className="text-sm text-muted-foreground">{acc.accountNumber}</div>
                <div className="text-sm">{acc.accountHolder}</div>
                <div className="font-medium mt-1">Rp {(acc.balance ?? 0).toLocaleString("id-ID")}</div>
              </button>
            ))}
            {bankAccounts.length === 0 && <p className="text-muted-foreground col-span-3">Belum ada rekening bank</p>}
          </div>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Mutasi — {selectedAccount.bankName} ({selectedAccount.accountNumber})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStatements ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.date).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{s.description}</TableCell>
                      <TableCell>
                        <Badge className={s.type === "CREDIT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell>Rp {s.amount.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge className={s.isReconciled ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {s.isReconciled ? "Terrekonsiliasi" : "Belum"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!s.isReconciled && (
                          <Button size="sm" variant="outline" onClick={() => markReconciled(s.id)}>
                            Rekonsiliasi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {statements.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada mutasi</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
