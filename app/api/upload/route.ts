import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return new NextResponse("File tidak ditemukan", { status: 400 });
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return new NextResponse("Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.", { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return new NextResponse("Ukuran file maksimal 5MB", { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const inputBuffer = Buffer.from(bytes);

        // Convert to WebP (skip animated GIF)
        let uploadBuffer: Buffer;
        if (file.type === "image/gif") {
            // Keep GIF as-is (may be animated)
            uploadBuffer = inputBuffer;
        } else {
            uploadBuffer = await sharp(inputBuffer)
                .webp({ quality: 82 })
                .toBuffer();
        }

        // Generate unique filename — always .webp (except GIF)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.type === "image/gif" ? "gif" : "webp";
        const filename = `${timestamp}-${randomStr}.${ext}`;
        const contentType = file.type === "image/gif" ? "image/gif" : "image/webp";

        // Upload to Supabase Storage
        const { error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(filename, uploadBuffer, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error("[Upload] Supabase storage error:", error.message);
            return new NextResponse(`Upload gagal: ${error.message}`, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filename);

        return NextResponse.json({ url: urlData.publicUrl, filename });

    } catch (error) {
        console.error("[Upload] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
