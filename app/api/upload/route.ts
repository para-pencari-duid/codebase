import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
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
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return new NextResponse("Ukuran file maksimal 5MB", { status: 400 });
        }

        // Create uploads directory if not exists
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}-${randomStr}.webp`;
        const filepath = path.join(uploadsDir, filename);

        // Convert to webp using sharp
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await sharp(buffer)
            .resize(800, 800, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: 80 })
            .toFile(filepath);

        // Return the public URL
        const url = `/uploads/${filename}`;

        return NextResponse.json({ url, filename });
    } catch (error) {
        console.error("[UPLOAD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
