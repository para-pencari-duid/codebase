"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, UserColumn } from "@/components/users/user-columns";

interface UserClientProps {
    data: UserColumn[];
    currentUserRole: string;
}

export function UserClient({ data, currentUserRole }: UserClientProps) {
    const router = useRouter();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengguna</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola akses pengguna sistem ({data.length} pengguna)</p>
                </div>
                {currentUserRole === "OWNER" && (
                    <Button onClick={() => router.push("/users/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pengguna
                    </Button>
                )}
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
                <DataTable columns={columns} data={data} searchKey="name" />
            </div>
        </div>
    );
}
