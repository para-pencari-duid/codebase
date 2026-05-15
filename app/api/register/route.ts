import { NextRequest, NextResponse } from "next/server";

// Registrasi dinonaktifkan - endpoint ini tidak berfungsi
export async function POST(req: NextRequest) {
    return NextResponse.json(
        { error: "Fitur registrasi sedang dinonaktifkan. Hubungi administrator untuk akses." },
        { status: 403 }
    );
}
