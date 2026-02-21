"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
    name: z.string().min(1, "Nama wajib diisi"),
    phone: z.string().optional(),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    address: z.string().optional(),
    birthDate: z.string().optional(),
    notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
    initialData: any | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit Pelanggan" : "Tambah Pelanggan";
    const description = initialData ? "Edit data pelanggan" : "Tambah pelanggan baru";
    const toastMessage = initialData ? "Pelanggan berhasil diperbarui." : "Pelanggan berhasil ditambahkan.";
    const action = initialData ? "Simpan Perubahan" : "Tambah";

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData ? {
            name: initialData.name,
            phone: initialData.phone || "",
            email: initialData.email || "",
            address: initialData.address || "",
            birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split("T")[0] : "",
            notes: initialData.notes || "",
        } : {
            name: "",
            phone: "",
            email: "",
            address: "",
            birthDate: "",
            notes: "",
        },
    });

    const onSubmit = async (data: CustomerFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await fetch(`/api/customers/${initialData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch("/api/customers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            }
            router.refresh();
            router.push("/customers");
            toast.success(toastMessage);
        } catch {
            toast.error("Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        if (!confirm("Yakin ingin menghapus pelanggan ini?")) return;
        try {
            setLoading(true);
            await fetch(`/api/customers/${initialData?.id}`, { method: "DELETE" });
            router.refresh();
            router.push("/customers");
            toast.success("Pelanggan berhasil dihapus.");
        } catch {
            toast.error("Gagal menghapus pelanggan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {initialData && (
                    <Button disabled={loading} variant="destructive" size="sm" onClick={onDelete}>
                        <Trash className="h-4 w-4 mr-2" />
                        Hapus
                    </Button>
                )}
            </div>
            <Separator className="my-4" />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Nama pelanggan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. HP / WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="08xxxxxxxxxx" {...field} />
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
                                    <FormLabel>Email (opsional)</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tanggal Lahir (opsional)</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alamat (opsional)</FormLabel>
                                <FormControl>
                                    <Textarea disabled={loading} placeholder="Alamat lengkap" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Catatan (opsional)</FormLabel>
                                <FormControl>
                                    <Textarea disabled={loading} placeholder="Catatan tentang pelanggan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button disabled={loading} type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
