"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { columns, UserColumn } from "@/components/users/user-columns";

interface UserClientProps {
    data: UserColumn[];
    currentUserRole: string;
}

export function UserClient({ data, currentUserRole }: UserClientProps) {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Pengguna (${data.length})`}
                    description="Kelola akses pengguna sistem"
                />
                {currentUserRole === "OWNER" && (
                    <Button onClick={() => router.push("/users/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pengguna
                    </Button>
                )}
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="name" />
        </>
    );
}
