"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface SingleImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export function SingleImageUpload({
    value,
    onChange,
    disabled,
}: SingleImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);

            try {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const error = await res.text();
                    toast.error(error || "Gagal upload gambar");
                    return;
                }

                const data = await res.json();
                onChange(data.url);
                toast.success("Gambar berhasil diupload");
            } catch (error) {
                toast.error("Terjadi kesalahan saat upload");
            } finally {
                setUploading(false);
                e.target.value = "";
            }
        },
        [onChange]
    );

    const handleRemove = useCallback(() => {
        onChange("");
    }, [onChange]);

    return (
        <div className="space-y-4">
            {value ? (
                <div className="relative group rounded-lg overflow-hidden border inline-block">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        width={150}
                        height={150}
                        className="object-cover w-[150px] h-[150px]"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                        disabled={disabled || uploading}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleUpload}
                        disabled={disabled || uploading}
                        className="max-w-xs"
                    />
                    {uploading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Mengupload...</span>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Format: JPEG, PNG, GIF, WebP (Max 5MB). Gambar akan dikonversi ke WebP.
            </p>
        </div>
    );
}
