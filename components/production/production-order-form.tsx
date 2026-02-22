"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
// Local types replacing removed Prisma model exports
type Recipe = { id: string };
type Product = { id: string; name: string; sku?: string; recipe?: Recipe | null; };
import { toast } from "sonner";
import { Trash, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    scheduledDate: z.date(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, "Produk wajib dipilih"),
        targetQuantity: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
    })).min(1, "Minimal satu produk diperlukan"),
});

type ProductionOrderFormValues = z.infer<typeof formSchema>;

interface ProductionOrderFormProps {
    products: (Product & { recipe: Recipe | null })[];
}

export const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({
    products
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Filter products that have recipes
    const availableProducts = products.filter(p => p.recipe !== null);

    const form = useForm<ProductionOrderFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            scheduledDate: new Date(),
            notes: "",
            items: [{ productId: "", targetQuantity: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const onSubmit: import("react-hook-form").SubmitHandler<ProductionOrderFormValues> = async (data) => {
        try {
            setLoading(true);

            // Add product names to items
            const itemsWithNames = data.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    ...item,
                    productName: product?.name || "",
                };
            });

            const payload = {
                ...data,
                items: itemsWithNames,
            };

            const res = await fetch(`/api/production`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Gagal membuat order produksi");
            }

            router.refresh();
            router.push(`/production`);
            toast.success("Order produksi berhasil dibuat");
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Buat Order Produksi</h2>
                    <p className="text-sm text-muted-foreground">
                        Jadwalkan produksi baru
                    </p>
                </div>
            </div>
            <Separator className="my-4" />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Produksi</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    disabled={loading}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: localeId })
                                                    ) : (
                                                        <span>Pilih tanggal</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={loading}
                                            placeholder="Catatan produksi"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Daftar Produk</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ productId: "", targetQuantity: 0 })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Produk
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-8">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.productId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Produk</FormLabel>
                                                        <Select
                                                            disabled={loading}
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih produk" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {availableProducts.map((product) => (
                                                                    <SelectItem key={product.id} value={product.id}>
                                                                        {product.name} ({product.sku})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.targetQuantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Jumlah Target</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" disabled={loading} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        Buat Order
                    </Button>
                </form>
            </Form>
        </>
    );
};
