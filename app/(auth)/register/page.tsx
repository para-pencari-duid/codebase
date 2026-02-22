"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
    Coffee, Cake, WashingMachine, Store, Scissors, Truck, Building2, HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
    {
        value: "FNB",
        label: "Kafe / Restoran",
        description: "Meja, dapur (KDS), resep",
        icon: Coffee,
    },
    {
        value: "BAKERY",
        label: "Bakery / Toko Kue",
        description: "Produksi & resep bahan",
        icon: Cake,
    },
    {
        value: "LAUNDRY",
        label: "Laundry / Servis",
        description: "Tiket order & status pengerjaan",
        icon: WashingMachine,
    },
    {
        value: "RETAIL",
        label: "Ritel / Minimarket",
        description: "POS standar, stok, diskon",
        icon: Store,
    },
    {
        value: "SALON",
        label: "Salon / Spa / Klinik",
        description: "Booking & penugasan staff",
        icon: Scissors,
    },
    {
        value: "WHOLESALE",
        label: "Grosir / Distributor",
        description: "Faktur B2B & tier harga",
        icon: Truck,
    },
    {
        value: "FRANCHISE",
        label: "Franchise / Multi-Cabang",
        description: "Kelola banyak toko sekaligus",
        icon: Building2,
    },
    {
        value: "OTHER",
        label: "Lainnya",
        description: "Mulai dari POS dasar",
        icon: HelpCircle,
    },
] as const;

type BusinessTypeValue = (typeof BUSINESS_TYPES)[number]["value"];

const formSchema = z.object({
    businessType: z.string().min(1, "Pilih tipe usaha Anda"),
    businessName: z.string().min(3, "Nama usaha minimal 3 karakter"),
    businessSlug: z
        .string()
        .min(3, "Minimal 3 karakter")
        .regex(/^[a-z0-9-]+$/, "Hanya boleh huruf kecil, angka, dan tanda -"),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    ownerName: z.string().min(2, "Nama minimal 2 karakter"),
    ownerEmail: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
});

function toSlug(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
}

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessType: "",
            businessName: "",
            businessSlug: "",
            businessAddress: "",
            businessPhone: "",
            ownerName: "",
            ownerEmail: "",
            password: "",
            confirmPassword: "",
        },
    });

    function handleBusinessNameChange(value: string) {
        form.setValue("businessName", value);
        const currentSlug = form.getValues("businessSlug");
        const autoSlug = toSlug(form.getValues("businessName") || "");
        if (!currentSlug || currentSlug === toSlug(form.getValues("businessName").slice(0, -1))) {
            form.setValue("businessSlug", toSlug(value));
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessType: values.businessType,
                    businessName: values.businessName,
                    businessSlug: values.businessSlug,
                    businessAddress: values.businessAddress,
                    businessPhone: values.businessPhone,
                    ownerName: values.ownerName,
                    ownerEmail: values.ownerEmail,
                    password: values.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    form.setError("businessSlug", { message: data.error });
                } else {
                    toast.error(data.error || "Pendaftaran gagal.");
                }
                return;
            }

            toast.success("Usaha berhasil didaftarkan! Silakan login.");
            router.push("/login");
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Daftarkan Usaha Anda</CardTitle>
                <CardDescription>
                    Buat akun baru untuk mengelola usaha Anda dengan sistem ERP
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* ── Tipe Usaha ── */}
                        <FormField
                            control={form.control}
                            name="businessType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Bidang Usaha Anda
                                    </FormLabel>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        {BUSINESS_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            const selected = field.value === type.value;
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    disabled={isLoading}
                                                    onClick={() => field.onChange(type.value)}
                                                    className={cn(
                                                        "flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary",
                                                        selected
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                            : "border-border bg-background"
                                                    )}
                                                >
                                                    <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                                                    <div>
                                                        <p className={cn("text-sm font-medium leading-tight", selected ? "text-primary" : "")}>{type.label}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{type.description}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />

                        {/* ── Info Usaha ── */}
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Informasi Usaha
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Usaha</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nama Usaha Anda"
                                            {...field}
                                            disabled={isLoading}
                                            onChange={(e) => handleBusinessNameChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="businessSlug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID Usaha (Slug)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="nama-usaha-anda"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Hanya huruf kecil, angka, dan tanda (-). Tidak bisa diubah setelah daftar.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="businessPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>No. Telepon Usaha</FormLabel>
                                        <FormControl>
                                            <Input placeholder="021-xxxxxxxx" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="businessAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alamat Usaha</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jl. ..." {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* ── Info Owner ── */}
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Akun Pemilik
                            </p>
                        </div>

                        <FormField
                            control={form.control}
                            name="ownerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Budi Santoso" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ownerEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="budi@usaha.com" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Konfirmasi Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Login di sini
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
