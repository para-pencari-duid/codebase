"use client";

import { Plus, List } from "lucide-react";
import dynamic from "next/dynamic";
const ShareModal = dynamic(() => import("@/components/shares/share-modal"), { ssr: false });
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ProductColumn, columns } from "./columns";

interface ProductClientProps {
    data: ProductColumn[];
}

export const ProductClient: React.FC<ProductClientProps> = ({ data }) => {
    const router = useRouter();

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Produk</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola produk toko Anda</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button className="w-full sm:w-auto" variant="outline" onClick={() => router.push("/products/categories") }>
                        <List className="mr-2 h-4 w-4" />
                        Kategori
                    </Button>
                    <div className="w-full sm:w-auto">
                        <ShareModal />
                    </div>
                    <Button className="w-full sm:w-auto" onClick={() => router.push("/products/new") }>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Produk
                    </Button>
                </div>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
                <DataTable searchKey="name" columns={columns} data={data} />
            </div>
        </div>
    );
};
