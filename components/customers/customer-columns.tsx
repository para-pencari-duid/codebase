"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";
import { formatCurrency } from "@/lib/utils";

export type CustomerColumn = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    totalTransactions: number;
    totalSpent: number;
    createdAt: string;
};

const CellAction = ({ data }: { data: CustomerColumn }) => {
    const router = useRouter();

    const onDelete = async () => {
        const ok = await confirmDestroy({ title: "Hapus pelanggan?", description: "Data pelanggan ini akan dihapus permanen." });
        if (!ok) return;
        try {
            await fetch(`/api/customers/${data.id}`, { method: "DELETE" });
            alertSuccess("Pelanggan berhasil dihapus.");
            router.refresh();
        } catch {
            alertError("Gagal menghapus pelanggan.");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/customers/${data.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" />
                    Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const customerColumns: ColumnDef<CustomerColumn>[] = [
    {
        accessorKey: "name",
        header: "Nama",
    },
    {
        accessorKey: "phone",
        header: "No. HP",
        cell: ({ row }) => row.original.phone || "-",
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
    },
    {
        accessorKey: "totalTransactions",
        header: "Transaksi",
        cell: ({ row }) => `${row.original.totalTransactions} trx`,
    },
    {
        accessorKey: "totalSpent",
        header: "Total Belanja",
        cell: ({ row }) => formatCurrency(row.original.totalSpent),
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "secondary"}>
                {row.original.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
