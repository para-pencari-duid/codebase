"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { alertSuccess, alertError } from "@/lib/swal";
import {
  Save,
  Store,
  Receipt,
  Calculator,
  CreditCard,
  QrCode,
  Gift,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  formatNumberInputValue,
  parseDigitsToNumber,
} from "@/lib/number-input";

const settingsSchema = z.object({
  businessName: z.string().min(1, "Nama bisnis wajib diisi"),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z
    .string()
    .email("Email tidak valid")
    .optional()
    .or(z.literal("")),
  logo: z.string().optional(),
  taxRate: z.number().min(0, "Min 0").max(100, "Max 100"),
  taxIncluded: z.boolean(),
  currency: z.string(),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  // QRIS
  qrisString: z.string().optional(),
  // Loyalty
  loyaltyEnabled: z.boolean().optional(),
  loyaltyPointsPerRupiah: z.number().int().min(1).optional(),
  loyaltyPointValue: z.number().int().min(1).optional(),
  // Tier 3 — Retail/Wholesale
  tierPricingEnabled: z.boolean().optional(),
  consignmentEnabled: z.boolean().optional(),
  serialTrackEnabled: z.boolean().optional(),
  // Tier 4 — Finance
  accountingEnabled: z.boolean().optional(),
  bankReconEnabled: z.boolean().optional(),
  payrollEnabled: z.boolean().optional(),
  // Tier 5 — Analytics/CRM
  marketingEnabled: z.boolean().optional(),
  feedbackEnabled: z.boolean().optional(),
  // Tier 6 — Platform
  onlineOrderEnabled: z.boolean().optional(),
  webhooksEnabled: z.boolean().optional(),
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
    qrisString?: string;
    loyaltyEnabled?: boolean;
    loyaltyPointsPerRupiah?: number;
    loyaltyPointValue?: number;
    tierPricingEnabled?: boolean;
    consignmentEnabled?: boolean;
    serialTrackEnabled?: boolean;
    accountingEnabled?: boolean;
    bankReconEnabled?: boolean;
    payrollEnabled?: boolean;
    marketingEnabled?: boolean;
    feedbackEnabled?: boolean;
    onlineOrderEnabled?: boolean;
    webhooksEnabled?: boolean;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ── QRIS image decode state ──────────────────────
  const [qrisDecodeStatus, setQrisDecodeStatus] = useState<
    "idle" | "decoding" | "success" | "error"
  >("idle");
  const [qrisFileName, setQrisFileName] = useState("");
  const [showManualQris, setShowManualQris] = useState(false);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);
  const qrisCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleQrisImageUpload = useCallback(async (file: File) => {
    setQrisDecodeStatus("decoding");
    setQrisFileName(file.name);
    try {
      const jsQR = (await import("jsqr")).default;
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = qrisCanvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          form.setValue("qrisString", code.data, { shouldDirty: true });
          setQrisDecodeStatus("success");
        } else {
          setQrisDecodeStatus("error");
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setQrisDecodeStatus("error");
      };
      img.src = objectUrl;
    } catch {
      setQrisDecodeStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      qrisString: initialData.qrisString || "",
      loyaltyEnabled: initialData.loyaltyEnabled ?? false,
      loyaltyPointsPerRupiah: initialData.loyaltyPointsPerRupiah ?? 1000,
      loyaltyPointValue: initialData.loyaltyPointValue ?? 1,
      tierPricingEnabled: initialData.tierPricingEnabled ?? false,
      consignmentEnabled: initialData.consignmentEnabled ?? false,
      serialTrackEnabled: initialData.serialTrackEnabled ?? false,
      accountingEnabled: initialData.accountingEnabled ?? false,
      bankReconEnabled: initialData.bankReconEnabled ?? false,
      payrollEnabled: initialData.payrollEnabled ?? false,
      marketingEnabled: initialData.marketingEnabled ?? false,
      feedbackEnabled: initialData.feedbackEnabled ?? false,
      onlineOrderEnabled: initialData.onlineOrderEnabled ?? false,
      webhooksEnabled: initialData.webhooksEnabled ?? false,
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

      alertSuccess("Pengaturan berhasil disimpan");
      router.refresh();
    } catch {
      alertError("Terjadi kesalahan saat menyimpan");
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
                      <Input
                        placeholder="Nama Usaha Anda"
                        {...field}
                        disabled={loading}
                      />
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
                      <Input
                        placeholder="08xx-xxxx-xxxx"
                        {...field}
                        disabled={loading}
                      />
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
                      <Input
                        placeholder="info@usaha.com"
                        {...field}
                        disabled={loading}
                      />
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
                          placeholder="Jl. Contoh No. 1, Kota"
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
                      Teks tambahan yang ditampilkan di bagian atas struk
                      setelah nama toko
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
                        Jika dicentang, harga produk sudah termasuk pajak (PPN
                        inklusif)
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
                        <SelectItem value="IDR">
                          IDR - Rupiah Indonesia
                        </SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="MYR">
                          MYR - Ringgit Malaysia
                        </SelectItem>
                        <SelectItem value="SGD">
                          SGD - Dollar Singapura
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* QRIS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QRIS Statis
                {form.watch("qrisString") && (
                  <Badge variant="default" className="text-xs">
                    Aktif
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Upload foto / screenshot QRIS statis Anda — sistem akan baca
                string QR otomatis dan inject nominal saat checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hidden canvas for QR decoding */}
              <canvas ref={qrisCanvasRef} className="hidden" />

              {/* Upload zone */}
              <div
                className="relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                onClick={() => qrisFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/"))
                    handleQrisImageUpload(file);
                }}
              >
                <input
                  ref={qrisFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleQrisImageUpload(file);
                    e.target.value = "";
                  }}
                />

                {qrisDecodeStatus === "idle" && (
                  <>
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {form.watch("qrisString")
                          ? "Upload ulang foto QRIS"
                          : "Upload foto QRIS statis Anda"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Klik atau drag & drop gambar QRIS (.jpg / .png)
                      </p>
                    </div>
                  </>
                )}

                {qrisDecodeStatus === "decoding" && (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Membaca QR code dari gambar...
                    </p>
                  </>
                )}

                {qrisDecodeStatus === "success" && (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-green-700">
                        QR code berhasil dibaca!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {qrisFileName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Klik untuk upload ulang
                    </p>
                  </>
                )}

                {qrisDecodeStatus === "error" && (
                  <>
                    <XCircle className="h-10 w-10 text-destructive" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-destructive">
                        Gagal membaca QR code
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pastikan gambar jelas dan memuat seluruh QR code
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Klik untuk coba lagi
                    </p>
                  </>
                )}
              </div>

              {/* Status if QRIS already saved */}
              {form.watch("qrisString") && qrisDecodeStatus === "idle" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  QRIS aktif — nominal akan di-inject otomatis saat pembayaran
                  QRIS di POS.
                </div>
              )}

              {/* Manual input fallback */}
              <Collapsible
                open={showManualQris}
                onOpenChange={setShowManualQris}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${showManualQris ? "rotate-180" : ""}`}
                    />
                    Input string manual (jika upload tidak berhasil)
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <FormField
                    control={form.control}
                    name="qrisString"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="00020101021226..."
                            {...field}
                            disabled={loading}
                            rows={3}
                            className="font-mono text-xs"
                            onChange={(e) => {
                              field.onChange(e);
                              if (e.target.value)
                                setQrisDecodeStatus("success");
                              else setQrisDecodeStatus("idle");
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Copy isi teks dari QR code QRIS statis (bukan
                          gambarnya). Bisa dari aplikasi bank dengan fitur
                          "salin konten QR".
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Loyalty Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Program Loyalty / Poin
                {form.watch("loyaltyEnabled") && (
                  <Badge variant="default" className="text-xs">
                    Aktif
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Berikan poin reward kepada pelanggan setiap transaksi, bisa
                ditukar saat checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="loyaltyEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Aktifkan Program Loyalty
                      </FormLabel>
                      <FormDescription>
                        Pelanggan mendapat poin setiap transaksi dan bisa redeem
                        saat bayar
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch("loyaltyEnabled") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="loyaltyPointsPerRupiah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rp per 1 Poin</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            aria-label="Rupiah per 1 poin"
                            {...field}
                            value={formatNumberInputValue(field.value)}
                            onChange={(e) =>
                              field.onChange(
                                parseDigitsToNumber(e.target.value),
                              )
                            }
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          Setiap berbelanja Rp
                          {(
                            form.watch("loyaltyPointsPerRupiah") || 1000
                          ).toLocaleString("id-ID")}{" "}
                          pelanggan dapat 1 poin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="loyaltyPointValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai 1 Poin (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            aria-label="Nilai 1 poin"
                            {...field}
                            value={formatNumberInputValue(field.value)}
                            onChange={(e) =>
                              field.onChange(
                                parseDigitsToNumber(e.target.value),
                              )
                            }
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>
                          1 poin setara Rp
                          {(
                            form.watch("loyaltyPointValue") || 1
                          ).toLocaleString("id-ID")}{" "}
                          saat redeem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {form.watch("loyaltyEnabled") && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  Contoh: Belanja Rp
                  {(
                    form.watch("loyaltyPointsPerRupiah") || 1000
                  ).toLocaleString("id-ID")}{" "}
                  → 1 poin. 1000 poin → Rp
                  {(
                    (form.watch("loyaltyPointValue") || 1) * 1000
                  ).toLocaleString("id-ID")}{" "}
                  diskon.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier 3-6 Feature Toggles */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Fitur Lanjutan (Tier 3-6)</CardTitle>
              <CardDescription>
                Aktifkan modul tambahan sesuai kebutuhan bisnis Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  [
                    "tierPricingEnabled",
                    "Harga Bertingkat (Tier Pricing)",
                    "Harga khusus per segmen / tier pelanggan",
                  ],
                  [
                    "consignmentEnabled",
                    "Konsinyasi",
                    "Manajemen barang titipan dari supplier",
                  ],
                  [
                    "serialTrackEnabled",
                    "Serial Number Tracking",
                    "Lacak produk berdasarkan nomor seri / IMEI",
                  ],
                  [
                    "accountingEnabled",
                    "Akuntansi (Double-Entry)",
                    "Jurnal, chart of accounts, dan tarif pajak",
                  ],
                  [
                    "bankReconEnabled",
                    "Rekonsiliasi Bank",
                    "Cocokkan mutasi bank dengan transaksi POS",
                  ],
                  [
                    "payrollEnabled",
                    "Penggajian Karyawan",
                    "Absensi, slip gaji, dan rekap payroll",
                  ],
                  [
                    "marketingEnabled",
                    "Marketing & Kampanye",
                    "Kirim pesan WhatsApp/Email massal ke pelanggan",
                  ],
                  [
                    "feedbackEnabled",
                    "Feedback & NPS",
                    "Kumpulkan rating dan skor kepuasan pelanggan",
                  ],
                  [
                    "onlineOrderEnabled",
                    "Order Online / Marketplace",
                    "Integrasi dengan platform marketplace",
                  ],
                  [
                    "webhooksEnabled",
                    "Webhook & API",
                    "Kirim event real-time ke sistem eksternal",
                  ],
                ] as const
              ).map(([name, label, desc]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          {label}
                        </FormLabel>
                        <FormDescription className="text-xs">
                          {desc}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card> */}

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
