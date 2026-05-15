"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
// Local types replacing removed Prisma model exports
type Product = { id: string; name: string; sku: string; };
type RawMaterial = { id: string; name: string; unit: string; stock?: number; };
type RecipeIngredient = {
    materialId: string;
    quantity: number | string;
    unit: string;
    notes?: string | null;
};
type RecipeInitialData = {
    id: string;
    productId: string;
    yield: number | string;
    yieldUnit: string;
    prepTime?: number | null;
    cookTime?: number | null;
    notes?: string | null;
    ingredients: RecipeIngredient[];
};
import { alertSuccess, alertError } from "@/lib/swal";
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
    initialData: RecipeInitialData | null;
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

    type RecipeFormValues = z.infer<typeof formSchema>;

    const defaultValues: RecipeFormValues = initialData ? {
        productId: initialData.productId,
        yield: parseFloat(String(initialData.yield)),
        yieldUnit: initialData.yieldUnit || "pcs",
        prepTime: initialData.prepTime || 0,
        cookTime: initialData.cookTime || 0,
        notes: initialData.notes ?? "",
        ingredients: initialData.ingredients.map((ing) => ({
            materialId: ing.materialId,
            quantity: parseFloat(String(ing.quantity)),
            unit: ing.unit,
            notes: ing.notes ?? "",
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

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(formSchema) as unknown as Resolver<RecipeFormValues>,
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
            alertSuccess(toastMessage);
        } catch (error: unknown) {
            alertError(error instanceof Error ? error.message : "Terjadi kesalahan.");
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
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold">Bahan Baku</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Isi bahan yang dipakai untuk satu resep.
                                    </p>
                                </div>
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
                                <div
                                    key={field.id}
                                    className="rounded-lg border bg-white p-4"
                                >
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
                                                            <Input disabled={loading} placeholder="Opsional" {...field} />
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
                                </div>
                            ))}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan Produksi</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={loading}
                                            placeholder="Instruksi singkat, contoh: campur bahan kering dulu, proofing 30 menit, panggang sampai matang."
                                            className="min-h-28"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Opsional. Dipakai kalau ada instruksi khusus untuk produksi.
                                    </FormDescription>
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
