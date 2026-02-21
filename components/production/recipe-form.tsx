"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Product, RawMaterial } from "@prisma/client";
import { toast } from "sonner";
import { Trash, Plus } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
    productId: z.string().min(1, "Produk wajib dipilih"),
    yield: z.coerce.number().min(0.01, "Hasil produksi harus lebih dari 0"),
    yieldUnit: z.string().min(1, "Satuan hasil wajib diisi"),
    prepTime: z.coerce.number().min(0).optional(),
    cookTime: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    ingredients: z.array(z.object({
        materialId: z.string().min(1, "Bahan baku wajib dipilih"),
        quantity: z.coerce.number().min(0.001, "Jumlah harus lebih dari 0"),
        unit: z.string().min(1, "Satuan wajib diisi"),
        notes: z.string().optional(),
    })).min(1, "Minimal satu bahan baku diperlukan"),
});

interface RecipeFormProps {
    initialData: any | null;
    products: Product[];
    materials: RawMaterial[];
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
    initialData,
    products,
    materials
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit Resep" : "Buat Resep Baru";
    const description = initialData ? "Edit resep yang sudah ada" : "Tambahkan resep baru untuk produk";
    const toastMessage = initialData ? "Resep berhasil diperbarui." : "Resep berhasil dibuat.";
    const action = initialData ? "Simpan Perubahan" : "Buat Resep";

    const defaultValues = initialData ? {
        ...initialData,
        yield: parseFloat(String(initialData.yield)),
        prepTime: initialData.prepTime || 0,
        cookTime: initialData.cookTime || 0,
        ingredients: initialData.ingredients.map((ing: any) => ({
            ...ing,
            quantity: parseFloat(String(ing.quantity)),
        })),
    } : {
        productId: "",
        yield: 1,
        yieldUnit: "pcs",
        prepTime: 0,
        cookTime: 0,
        notes: "",
        ingredients: [{ materialId: "", quantity: 0, unit: "kg", notes: "" }],
    };

    type RecipeFormValues = z.infer<typeof formSchema>;

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ingredients",
    });

    const onSubmit: import("react-hook-form").SubmitHandler<RecipeFormValues> = async (data) => {
        try {
            setLoading(true);

            if (initialData) {
                await fetch(`/api/recipes/${initialData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            } else {
                const res = await fetch(`/api/recipes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Gagal membuat resep");
                }
            }
            router.refresh();
            router.push(`/production`);
            toast.success(toastMessage);
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
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <Separator className="my-4" />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Produk</FormLabel>
                                    <Select
                                        disabled={loading || !!initialData}
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
                                            {products.map((product) => (
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="yield"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hasil Produksi</FormLabel>
                                        <FormControl>
                                            <Input type="number" disabled={loading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="yieldUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Satuan</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="prepTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Waktu Persiapan (menit)</FormLabel>
                                    <FormControl>
                                        <Input type="number" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cookTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Waktu Masak (menit)</FormLabel>
                                    <FormControl>
                                        <Input type="number" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Catatan</FormLabel>
                                <FormControl>
                                    <Textarea
                                        disabled={loading}
                                        placeholder="Catatan tambahan untuk resep ini"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Bahan Baku</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ materialId: "", quantity: 0, unit: "kg", notes: "" })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Bahan
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-4">
                                            <FormField
                                                control={form.control}
                                                name={`ingredients.${index}.materialId`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Bahan Baku</FormLabel>
                                                        <Select
                                                            disabled={loading}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                const material = materials.find(m => m.id === value);
                                                                if (material) {
                                                                    form.setValue(`ingredients.${index}.unit`, material.unit);
                                                                }
                                                            }}
                                                            value={field.value}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih bahan" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {materials.map((material) => (
                                                                    <SelectItem key={material.id} value={material.id}>
                                                                        {material.name} (Stok: {Number(material.stock)} {material.unit})
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
                                                name={`ingredients.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Jumlah</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" disabled={loading} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`ingredients.${index}.unit`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Satuan</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={loading} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField
                                                control={form.control}
                                                name={`ingredients.${index}.notes`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Catatan</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={loading} placeholder="Keterangan" {...field} />
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
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
