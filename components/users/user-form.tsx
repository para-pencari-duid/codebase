"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";
import { Trash, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const userSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter").or(z.literal("")),
    role: z.enum(["OWNER", "MANAGER", "KASIR"]),
    phone: z.string().optional(),
    isActive: z.boolean(),
});

type UserValues = z.infer<typeof userSchema>;

interface UserFormProps {
    initialData: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone: string;
        isActive: boolean;
    } | null;
}

export function UserForm({ initialData }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const isEditing = !!initialData;
    const title = isEditing ? "Edit Pengguna" : "Tambah Pengguna";
    const description = isEditing
        ? "Edit data pengguna"
        : "Tambah pengguna baru ke sistem";

    const form = useForm<UserValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: initialData?.name || "",
            email: initialData?.email || "",
            password: "",
            role: (initialData?.role as "OWNER" | "MANAGER" | "KASIR") || "KASIR",
            phone: initialData?.phone || "",
            isActive: initialData?.isActive ?? true,
        },
    });

    const onSubmit = async (data: UserValues) => {
        try {
            setLoading(true);

            // For edit, remove password if empty
            const payload = { ...data };
            if (isEditing && !payload.password) {
                delete (payload as Record<string, unknown>).password;
            }

            const url = isEditing ? `/api/users/${initialData.id}` : "/api/users";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            alertSuccess(isEditing ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan");
            router.push("/users");
            router.refresh();
        } catch (error) {
            alertError(error instanceof Error ? error.message : "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        if (!initialData) return;
        const ok = await confirmDestroy({ title: "Hapus pengguna?", description: "Data pengguna akan dihapus permanen." });
        if (!ok) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/users/${initialData.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            alertSuccess("Pengguna berhasil dihapus");
            router.push("/users");
            router.refresh();
        } catch (error) {
            alertError(error instanceof Error ? error.message : "Gagal menghapus");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/users")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                </div>
                {isEditing && (
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={onDelete}
                        disabled={loading}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama lengkap" {...field} disabled={loading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="user@toko.com" {...field} disabled={loading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Password {isEditing ? "(kosongkan jika tidak diubah)" : "*"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••" {...field} disabled={loading} />
                                    </FormControl>
                                    <FormDescription>Minimal 6 karakter</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={loading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="OWNER">Owner</SelectItem>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                            <SelectItem value="KASIR">Kasir</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Owner: akses penuh | Manager: operasional & laporan | Kasir: POS dan order harian
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telepon</FormLabel>
                                    <FormControl>
                                        <Input placeholder="08xx-xxxx-xxxx" {...field} disabled={loading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Aktif</FormLabel>
                                        <FormDescription>
                                            User yang tidak aktif tidak bisa login
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {isEditing ? "Simpan Perubahan" : "Tambah Pengguna"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
