"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save, Store, Receipt, Calculator, CreditCard } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleImageUpload } from "@/components/ui/single-image-upload";

const settingsSchema = z.object({
    businessName: z.string().min(1, "Nama bisnis wajib diisi"),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    businessEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
    logo: z.string().optional(),
    taxRate: z.number().min(0, "Min 0").max(100, "Max 100"),
    taxIncluded: z.boolean(),
    currency: z.string(),
    receiptHeader: z.string().optional(),
    receiptFooter: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
    initialData: {
        id: string;
        businessName: string;
        businessAddress: string;
        businessPhone: string;
        businessEmail: string;
        logo: string;
        taxRate: number;
        taxIncluded: boolean;
        currency: string;
        receiptHeader: string;
        receiptFooter: string;
    };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            businessName: initialData.businessName,
            businessAddress: initialData.businessAddress,
            businessPhone: initialData.businessPhone,
            businessEmail: initialData.businessEmail,
            logo: initialData.logo,
            taxRate: initialData.taxRate,
            taxIncluded: initialData.taxIncluded,
            currency: initialData.currency,
            receiptHeader: initialData.receiptHeader,
            receiptFooter: initialData.receiptFooter,
        },
    });

    const onSubmit = async (data: SettingsValues) => {
        try {
            setLoading(true);
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Gagal menyimpan pengaturan");

            toast.success("Pengaturan berhasil disimpan");
            router.refresh();
        } catch {
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title="Pengaturan"
                    description="Kelola pengaturan toko dan sistem"
                />
                <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Semua
                </Button>
            </div>
            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Business Profile */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Profil Bisnis
                            </CardTitle>
                            <CardDescription>
                                Informasi dasar toko yang akan ditampilkan di struk dan laporan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Bisnis *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Toko Roti Bahagia" {...field} disabled={loading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="businessPhone"
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
                                name="businessEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="info@tokoroti.com" {...field} disabled={loading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="logo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Logo Toko</FormLabel>
                                        <FormControl>
                                            <SingleImageUpload
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="businessAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alamat</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Jl. Roti No. 1, Kota Bahagia"
                                                    {...field}
                                                    disabled={loading}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Receipt Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Pengaturan Struk
                            </CardTitle>
                            <CardDescription>
                                Kustomisasi header dan footer struk penjualan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="receiptHeader"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Header Struk</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Teks yang ditampilkan di atas struk (misal: Selamat berbelanja!)"
                                                {...field}
                                                disabled={loading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Teks tambahan yang ditampilkan di bagian atas struk setelah nama toko
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="receiptFooter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Footer Struk</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Terima kasih telah berbelanja! Semoga hari Anda menyenangkan."
                                                {...field}
                                                disabled={loading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Teks yang ditampilkan di bagian bawah struk
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Tax Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Pengaturan Pajak
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi pajak penjualan (PPN)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="taxRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tarif Pajak (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="11"
                                                {...field}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Persentase pajak (PPN). Isi 0 jika tidak dikenakan pajak.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="taxIncluded"
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
                                            <FormLabel>Harga Sudah Termasuk Pajak</FormLabel>
                                            <FormDescription>
                                                Jika dicentang, harga produk sudah termasuk pajak (PPN inklusif)
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Currency Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Pengaturan Mata Uang
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi mata uang yang digunakan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem className="w-full md:w-1/3">
                                        <FormLabel>Mata Uang</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={loading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih mata uang" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="IDR">IDR - Rupiah Indonesia</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="MYR">MYR - Ringgit Malaysia</SelectItem>
                                                <SelectItem value="SGD">SGD - Dollar Singapura</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} size="lg">
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Pengaturan
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
