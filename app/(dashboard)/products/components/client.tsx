"use client";

import { Plus, List } from "lucide-react";
import dynamic from "next/dynamic";
const ShareModal = dynamic(() => import("@/components/shares/share-modal"), { ssr: false });
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ProductColumn, columns } from "./columns";
import { alertSuccess, alertError } from "@/lib/swal";

interface ProductClientProps {
    data: ProductColumn[];
}

export const ProductClient: React.FC<ProductClientProps> = ({ data }) => {
    const router = useRouter();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Produk</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola produk toko Anda</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/products/categories") }>
                        <List className="mr-2 h-4 w-4" />
                        Kategori
                    </Button>
                                        <div>
                                            <ShareModal />
                                        </div>
                    <Button onClick={() => router.push("/products/new") }>
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
