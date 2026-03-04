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
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";

export type ProductColumn = {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: string;
    stock: number;
    isActive: boolean;
    createdAt: string;
};

export const columns: ColumnDef<ProductColumn>[] = [
    {
        accessorKey: "sku",
        header: "SKU",
    },
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
        accessorKey: "category",
        header: "Kategori",
    },
    {
        accessorKey: "price",
        header: "Harga",
    },
    {
        accessorKey: "stock",
        header: "Stok",
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
        id: "actions",
        cell: ({ row }) => {
            const router = useRouter();
            const product = row.original;

            const onDelete = async () => {
                const ok = await confirmDestroy({ title: "Hapus produk?", description: `"${product.name}" akan dihapus permanen.` });
                if (!ok) return;
                try {
                    await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
                    alertSuccess("Produk berhasil dihapus.");
                    router.refresh();
                } catch (e) {
                    alertError("Gagal menghapus produk.");
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
                            onClick={() => router.push(`/products/${product.id}`)}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/shares', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ scope: 'single', singleProductId: product.id }),
                                    });
                                    if (!res.ok) throw new Error('Failed');
                                    const data = await res.json();
                                    const url = data.url;
                                    if (navigator.clipboard && url) await navigator.clipboard.writeText(url);
                                    alertSuccess('Link share telah disalin ke clipboard');
                                } catch (e) {
                                    alertError('Gagal membuat link share');
                                }
                            }}
                        >
                            Bagikan
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
