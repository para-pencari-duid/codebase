"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";
import { formatDate } from "@/lib/utils";

export type UserColumn = {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    isActive: boolean;
    createdAt: Date;
    transactionCount: number;
};

const roleColors: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-800",
    MANAGER: "bg-blue-100 text-blue-800",
    KASIR: "bg-green-100 text-green-800",
};

function CellActions({ row }: { row: UserColumn }) {
    const router = useRouter();

    const onDelete = async () => {
        const ok = await confirmDestroy({ title: "Hapus pengguna?", description: "Pengguna akan dihapus atau dinonaktifkan." });
        if (!ok) return;
        try {
            const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }
            alertSuccess("Pengguna berhasil dihapus/dinonaktifkan");
            router.refresh();
        } catch (error) {
            alertError(error instanceof Error ? error.message : "Gagal menghapus pengguna");
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
                <DropdownMenuItem onClick={() => router.push(`/users/${row.id}`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" /> Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns: ColumnDef<UserColumn>[] = [
    {
        accessorKey: "name",
        header: "Nama",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            return (
                <Badge className={roleColors[role] || ""} variant="outline">
                    {role}
                </Badge>
            );
        },
    },
    {
        accessorKey: "phone",
        header: "Telepon",
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
        accessorKey: "transactionCount",
        header: "Transaksi",
    },
    {
        accessorKey: "createdAt",
        header: "Terdaftar",
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions row={row.original} />,
    },
];
