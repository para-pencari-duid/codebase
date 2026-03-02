"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ItemCategory } from "@prisma/client";

type Category = ItemCategory;
import { alertSuccess, alertError, confirmDestroy } from "@/lib/swal";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    name: z.string().min(1, "Nama kategori wajib diisi"),
    description: z.string().optional(),
});

interface CategoryFormProps {
    initialData: Category | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
    initialData
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit Kategori" : "Buat Kategori";
    const description = initialData ? "Edit kategori yang sudah ada" : "Tambah kategori baru";
    const toastMessage = initialData ? "Kategori berhasil diperbarui." : "Kategori berhasil dibuat.";
    const action = initialData ? "Simpan Perubahan" : "Buat";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData
            ? { name: initialData.name, description: initialData.description ?? "" }
            : { name: "", description: "" },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            if (initialData) {
                await fetch(`/api/categories/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
            } else {
                await fetch(`/api/categories`, {
                    method: "POST",
                    body: JSON.stringify(data),
                });
            }
            router.refresh();
            router.push(`/products/categories`);
            alertSuccess(toastMessage);
        } catch (error) {
            alertError("Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        const ok = await confirmDestroy({ title: "Hapus kategori?", text: "Kategori akan dihapus permanen." });
        if (!ok) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/categories/${initialData?.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error(await res.text())
            }

            router.refresh();
            router.push(`/products/categories`);
            alertSuccess("Kategori berhasil dihapus.");
        } catch (error: any) {
            alertError(error.message || "Gagal menghapus kategori.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        onClick={onDelete}
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Hapus
                    </Button>
                )}
            </div>
            <Separator className="my-4" />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Kategori</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Contoh: Makanan, Minuman, Jasa" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={loading}
                                            placeholder="Deskripsi singkat kategori"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
