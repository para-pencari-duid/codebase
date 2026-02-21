"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { CategoryColumn, columns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";

interface CategoryClientProps {
    data: CategoryColumn[];
}

export const CategoryClient: React.FC<CategoryClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Kategori (${data.length})`}
                    description="Kelola kategori produk untuk toko Anda"
                />
                <Button onClick={() => router.push(`/dashboard/categories/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Baru
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
        </>
    );
};
