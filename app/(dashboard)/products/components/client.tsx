"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ProductColumn, columns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";

interface ProductClientProps {
    data: ProductColumn[];
}

export const ProductClient: React.FC<ProductClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Produk (${data.length})`}
                    description="Kelola produk toko Anda"
                />
                <Button onClick={() => router.push(`/products/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Baru
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
        </>
    );
};
