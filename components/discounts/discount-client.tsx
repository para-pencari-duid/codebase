"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { DiscountForm } from "./discount-form";

interface Discount {
    id: string;
    name: string;
    code: string | null;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    usageLimit: number | null;
    usageCount: number;
    createdAt: Date;
}

interface DiscountClientProps {
    data: Discount[];
}

export function DiscountClient({ data }: DiscountClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    const filteredData = data.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus diskon ini?")) return;

        try {
            const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Diskon berhasil dihapus");
                router.refresh();
            } else {
                toast.error("Gagal menghapus diskon");
            }
        } catch {
            toast.error("Terjadi kesalahan");
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatus = (discount: Discount) => {
        if (!discount.isActive) return { label: "Nonaktif", variant: "secondary" as const };
        const now = new Date();
        if (discount.startDate && new Date(discount.startDate) > now) {
            return { label: "Belum Berlaku", variant: "outline" as const };
        }
        if (discount.endDate && new Date(discount.endDate) < now) {
            return { label: "Berakhir", variant: "destructive" as const };
        }
        return { label: "Aktif", variant: "default" as const };
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Diskon & Promo (${data.length})`}
                    description="Kelola diskon dan kode promo"
                />
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingDiscount(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Diskon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingDiscount ? "Edit Diskon" : "Tambah Diskon Baru"}
                            </DialogTitle>
                        </DialogHeader>
                        <DiscountForm
                            initialData={editingDiscount}
                            onSuccess={() => {
                                setIsOpen(false);
                                setEditingDiscount(null);
                                router.refresh();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau kode diskon..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Kode</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead>Min. Pembelian</TableHead>
                            <TableHead>Periode</TableHead>
                            <TableHead>Penggunaan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    {search ? "Tidak ada diskon yang sesuai" : "Belum ada diskon"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((discount) => {
                                const status = getStatus(discount);
                                return (
                                    <TableRow key={discount.id}>
                                        <TableCell className="font-medium">{discount.name}</TableCell>
                                        <TableCell>
                                            {discount.code ? (
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                                                    {discount.code}
                                                </code>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {discount.type === "PERCENTAGE" ? "Persentase" : "Nominal"}
                                        </TableCell>
                                        <TableCell>
                                            {discount.type === "PERCENTAGE"
                                                ? `${discount.value}%`
                                                : formatCurrency(discount.value)}
                                        </TableCell>
                                        <TableCell>
                                            {discount.minPurchase
                                                ? formatCurrency(discount.minPurchase)
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                                        </TableCell>
                                        <TableCell>
                                            {discount.usageCount}
                                            {discount.usageLimit ? ` / ${discount.usageLimit}` : ""}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingDiscount(discount);
                                                            setIsOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(discount.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
