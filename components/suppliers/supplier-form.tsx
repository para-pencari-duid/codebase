"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  contactName: z.string(),
  notes: z.string(),
  isActive: z.boolean(),
});

type FormValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  contactName: string;
  notes: string;
  isActive: boolean;
};

interface SupplierFormProps {
  initialData?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    contactName: string | null;
    notes: string | null;
    isActive: boolean;
  } | null;
  onSuccess: () => void;
}

export default function SupplierForm({ initialData, onSuccess }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      contactName: initialData?.contactName || "",
      notes: initialData?.notes || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const url = initialData
        ? `/api/suppliers/${initialData.id}`
        : "/api/suppliers";
      const method = initialData ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan");
      }

      toast.success(initialData ? "Supplier berhasil diperbarui" : "Supplier berhasil ditambahkan");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Supplier *</FormLabel>
              <FormControl>
                <Input placeholder="PT. Supplier Utama" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kontak</FormLabel>
              <FormControl>
                <Input placeholder="Nama kontak person" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telepon</FormLabel>
                <FormControl>
                  <Input placeholder="08123456789" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="supplier@email.com" {...field} />
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
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Alamat lengkap supplier"
                  className="resize-none"
                  {...field}
                />
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
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Catatan tambahan..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aktif</FormLabel>
                  <FormDescription>
                    Supplier yang tidak aktif tidak akan muncul di pilihan
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
