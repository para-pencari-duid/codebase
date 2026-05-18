"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
import { alertSuccess, alertError } from "@/lib/swal";

const formSchema = z.object({
    email: z.string().email({ message: "Email tidak valid." }),
    password: z.string().min(1, { message: "Password harus diisi." }),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                alertError("Periksa kembali email dan password Anda.", "Login Gagal");
            } else {
                const session = await getSession();
                await alertSuccess("Selamat datang kembali!", "Login Berhasil");
                router.push(session?.user?.role === "KASIR" ? "/pos" : "/dashboard");
                router.refresh();
            }
        } catch {
            alertError("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    Masuk ke akun Anda
                </h2>
                <p className="text-sm text-gray-500">
                    Gunakan email dan password yang terdaftar
                </p>
            </div>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Email
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="email@usaha.com"
                                        type="email"
                                        autoComplete="email"
                                        className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                                        disabled={isLoading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Password
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="h-10 pr-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword
                                                ? <EyeOff className="h-4 w-4" />
                                                : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full h-10 font-semibold mt-2"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>
                            : "Masuk"}
                    </Button>
                </form>
            </Form>

            {/* Register disabled - link removed */}
        </div>
    );
}
