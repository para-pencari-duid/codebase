"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { customerColumns, type CustomerColumn } from "./customer-columns";

interface CustomerClientProps {
    data: CustomerColumn[];
}

export const CustomerClient: React.FC<CustomerClientProps> = ({ data }) => {
    const router = useRouter();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pelanggan</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Kelola data pelanggan ({data.length} pelanggan)
                    </p>
                </div>
                <Button onClick={() => router.push("/customers/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pelanggan
                </Button>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
                <DataTable columns={customerColumns} data={data} searchKey="name" />
            </div>
        </div>
    );
};
