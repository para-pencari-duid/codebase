"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect ke login karena registrasi sudah dinonaktifkan
        router.replace("/login");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <p className="text-gray-600">Mengalihkan ke halaman login...</p>
            </div>
        </div>
    );
}
