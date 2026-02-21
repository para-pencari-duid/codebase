"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { customerColumns, type CustomerColumn } from "./customer-columns";

interface CustomerClientProps {
    data: CustomerColumn[];
}

export const CustomerClient: React.FC<CustomerClientProps> = ({ data }) => {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pelanggan</h2>
                    <p className="text-sm text-muted-foreground">
                        Kelola data pelanggan ({data.length} pelanggan)
                    </p>
                </div>
                <Button onClick={() => router.push("/customers/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pelanggan
                </Button>
            </div>
            <Separator />
            <DataTable columns={customerColumns} data={data} searchKey="name" />
        </>
    );
};
