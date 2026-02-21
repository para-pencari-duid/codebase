"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Trash, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    disabled?: boolean;
    maxImages?: number;
}

export function ImageUpload({
    value = [],
    onChange,
    disabled,
    maxImages = 5,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            if (value.length + files.length > maxImages) {
                toast.error(`Maksimal ${maxImages} gambar`);
                return;
            }

            setUploading(true);
            const uploadedUrls: string[] = [];

            try {
                for (const file of Array.from(files)) {
                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) {
                        const error = await res.text();
                        toast.error(error || "Gagal upload gambar");
                        continue;
                    }

                    const data = await res.json();
                    uploadedUrls.push(data.url);
                }

                if (uploadedUrls.length > 0) {
                    onChange([...value, ...uploadedUrls]);
                    toast.success(`${uploadedUrls.length} gambar berhasil diupload`);
                }
            } catch (error) {
                toast.error("Terjadi kesalahan saat upload");
            } finally {
                setUploading(false);
                // Reset input
                e.target.value = "";
            }
        },
        [value, onChange, maxImages]
    );

    const handleRemove = useCallback(
        (url: string) => {
            onChange(value.filter((v) => v !== url));
        },
        [value, onChange]
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {value.map((url) => (
                    <div
                        key={url}
                        className="relative group rounded-lg overflow-hidden border"
                    >
                        <Image
                            src={url}
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
                            onClick={() => handleRemove(url)}
                            disabled={disabled || uploading}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {value.length < maxImages && (
                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
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
                Format: JPEG, PNG, GIF, WebP (Max 5MB per file). Gambar akan dikonversi ke WebP.
            </p>
        </div>
    );
}
