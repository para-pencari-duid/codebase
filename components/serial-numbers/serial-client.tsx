"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

interface SerialNumber {
  id: string;
  serialNo: string;
  status: "IN_STOCK" | "SOLD" | "RETURNED" | "DEFECTIVE";
  soldAt?: string;
  variant?: { name: string };
  variantName?: string;
}

const statusColor: Record<string, string> = {
  IN_STOCK: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  RETURNED: "bg-yellow-100 text-yellow-800",
  DEFECTIVE: "bg-red-100 text-red-800",
};

export default function SerialClient() {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchSerials = async () => {
    setLoading(true);
    try {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/serial-numbers${query}`);
      const data = await res.json();
      setSerials(data.serialNumbers ?? data);
    } catch {
      toast.error("Gagal memuat serial number");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSerials(); }, [statusFilter]);

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serial Numbers</CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua</SelectItem>
            <SelectItem value="IN_STOCK">In Stock</SelectItem>
            <SelectItem value="SOLD">Terjual</SelectItem>
            <SelectItem value="RETURNED">Dikembalikan</SelectItem>
            <SelectItem value="DEFECTIVE">Cacat</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial No.</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terjual Pada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serials.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">{s.serialNo}</TableCell>
                <TableCell>{s.variant?.name ?? s.variantName ?? "-"}</TableCell>
                <TableCell><Badge className={statusColor[s.status]}>{s.status}</Badge></TableCell>
                <TableCell>{s.soldAt ? new Date(s.soldAt).toLocaleDateString("id-ID") : "-"}</TableCell>
              </TableRow>
            ))}
            {serials.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
