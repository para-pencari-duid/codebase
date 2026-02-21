"use client";

import { Plus, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ProductColumn, columns } from "./product-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductClientProps {
    data: ProductColumn[];
}

export const ProductClient: React.FC<ProductClientProps> = ({
    data
}) => {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Produk</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/products/categories")}>
                        <List className="mr-2 h-4 w-4" />
                        Kategori
                    </Button>
                    <Button onClick={() => router.push("/products/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Produk
                    </Button>
                </div>
            </div>
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Produk ({data.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable searchKey="name" columns={columns} data={data} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
