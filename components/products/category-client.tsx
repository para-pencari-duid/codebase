"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { CategoryColumn, columns } from "./category-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryClientProps {
    data: CategoryColumn[];
}

export const CategoryClient: React.FC<CategoryClientProps> = ({
    data
}) => {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Kategori</h2>
                <Button onClick={() => router.push("/products/categories/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Baru
                </Button>
            </div>
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Kategori Produk ({data.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable searchKey="name" columns={columns} data={data} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
