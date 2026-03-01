"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
// Local types replacing removed Prisma model exports
type Category = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId?: string | null;
  price?: any;
  cost?: any;
  stock?: any;
  minStock?: any;
  unit?: string;
  description?: string | null;
  images?: string[];
  isActive?: boolean;
};
import { toast } from "sonner";
import { Trash } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

const formSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().min(1, "SKU wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).optional(),
  unit: z.string().default("pcs"),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

interface ProductFormProps {
  initialData: Product | null;
  categories: Category[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit Produk" : "Buat Produk";
  const description = initialData
    ? "Edit produk yang sudah ada"
    : "Tambah produk baru";
  const toastMessage = initialData
    ? "Produk berhasil diperbarui."
    : "Produk berhasil dibuat.";
  const action = initialData ? "Simpan Perubahan" : "Buat";

  const defaultValues = initialData
    ? {
        ...initialData,
        price: parseFloat(String(initialData.price)),
        cost: initialData.cost ? parseFloat(String(initialData.cost)) : 0,
        description: initialData.description || "",
        images: initialData.images || [],
        minStock: initialData.minStock || 0,
      }
    : {
        name: "",
        sku: "",
        categoryId: "",
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        unit: "pcs",
        description: "",
        images: [],
        isActive: true,
      };

  type ProductFormValues = z.infer<typeof formSchema>;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaultValues as Partial<ProductFormValues>,
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        images: data.images || [],
      };

      if (initialData) {
        await fetch(`/api/products/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/products`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.refresh();
      router.push(`/products`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await fetch(`/api/products/${initialData?.id}`, {
        method: "DELETE",
      });
      router.refresh();
      router.push(`/products`);
      toast.success("Produk berhasil dihapus.");
    } catch (error) {
      toast.error("Gagal menghapus produk.");
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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Nama produk"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Kode Produk)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="SKU unik"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satuan (Unit)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="pcs, kg, box"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Jual</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      aria-label="Harga jual"
                      disabled={loading}
                      placeholder="0"
                      {...field}
                      value={formatNumberInputValue(field.value)}
                      onChange={(event) =>
                        field.onChange(parseDigitsToNumber(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Modal (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      aria-label="Harga modal"
                      disabled={loading}
                      placeholder="0"
                      {...field}
                      value={formatNumberInputValue(field.value)}
                      onChange={(event) =>
                        field.onChange(parseDigitsToNumber(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stok Awal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Stok (Alert)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      placeholder="5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gambar Produk</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || []}
                    onChange={field.onChange}
                    disabled={loading}
                    maxImages={5}
                  />
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
                    placeholder="Deskripsi produk"
                    {...field}
                  />
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
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aktif</FormLabel>
                  <FormDescription>
                    Produk ini akan muncul di POS
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
