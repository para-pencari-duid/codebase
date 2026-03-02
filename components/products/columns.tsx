"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { alertSuccess, alertError, alertInfo, confirmDestroy } from "@/lib/swal";
import axios from "axios";

export type CategoryColumn = {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
};

export const columns: ColumnDef<CategoryColumn>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nama
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "description",
        header: "Deskripsi",
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <div className={row.original.isActive ? "text-green-600" : "text-red-600"}>
                {row.original.isActive ? "Aktif" : "Non-Aktif"}
            </div>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Dibuat",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const router = useRouter();
            const category = row.original;

            const onDelete = async () => {
                try {
                    await axios.delete(`/api/categories/${category.id}`);
                    toast.success("Kategori dihapus");
                    router.refresh();
                } catch (error) {
                    toast.error("Gagal menghapus kategori");
                }
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem
                            //   onClick={() => router.push(`/dashboard/categories/${category.id}`)}
                            onClick={() => alertInfo("Edit feature coming soon")}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
