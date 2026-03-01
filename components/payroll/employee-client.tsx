"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  joinDate: string;
  isActive: boolean;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}

const defaultForm = {
  name: "",
  position: "",
  department: "",
  phone: "",
  baseSalary: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  joinDate: "",
};

export default function EmployeeClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees ?? data);
    } catch {
      toast.error("Gagal memuat data karyawan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, baseSalary: Number(form.baseSalary) }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast.success("Karyawan berhasil ditambahkan");
      setOpen(false);
      setForm(defaultForm);
      fetchEmployees();
    } catch {
      toast.error("Gagal menambahkan karyawan");
    } finally {
      setSaving(false);
    }
  };

  const markAttendance = async (
    employeeId: string,
    status: "PRESENT" | "ABSENT",
  ) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          status,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        `Absensi ${status === "PRESENT" ? "hadir" : "tidak hadir"} dicatat`,
      );
    } catch {
      toast.error("Gagal mencatat absensi");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Karyawan</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Karyawan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Karyawan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {(
                [
                  "name",
                  "position",
                  "department",
                  "phone",
                  "bankName",
                  "bankAccount",
                  "bankHolder",
                ] as const
              ).map((field) => (
                <div key={field}>
                  <Label className="capitalize">{field}</Label>
                  <Input
                    value={form[field]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div>
                <Label>Gaji Pokok</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  aria-label="Gaji pokok"
                  value={formatNumberInputValue(form.baseSalary)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      baseSalary: String(parseDigitsToNumber(e.target.value)),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Tanggal Bergabung</Label>
                <Input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, joinDate: e.target.value }))
                  }
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Karyawan</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Gaji Pokok</TableHead>
              <TableHead>Tgl Bergabung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Absensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>{emp.employeeNo}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.position}</TableCell>
                <TableCell>{emp.department}</TableCell>
                <TableCell>
                  Rp {emp.baseSalary.toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  {emp.joinDate
                    ? new Date(emp.joinDate).toLocaleDateString("id-ID")
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      emp.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {emp.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300"
                      onClick={() => markAttendance(emp.id, "PRESENT")}
                    >
                      Hadir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300"
                      onClick={() => markAttendance(emp.id, "ABSENT")}
                    >
                      Absen
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Belum ada karyawan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
