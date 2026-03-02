import { Cake } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* ── Left branding panel (hidden on mobile) ── */}
            <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden"
                 style={{ background: "oklch(0.18 0.02 240)" }}>
                {/* Decorative circles */}
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
                     style={{ background: "oklch(0.75 0.12 60)" }} />
                <div className="absolute bottom-10 -right-16 w-64 h-64 rounded-full opacity-10"
                     style={{ background: "oklch(0.75 0.12 60)" }} />
                <div className="absolute top-1/2 -right-8 w-40 h-40 rounded-full opacity-[0.06]"
                     style={{ background: "oklch(0.75 0.12 60)" }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                         style={{ background: "oklch(0.72 0.15 60)" }}>
                        <Cake className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Bakery System</span>
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-4">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight">
                        Kelola toko roti Anda<br />
                        <span style={{ color: "oklch(0.82 0.12 60)" }}>lebih mudah & efisien.</span>
                    </h1>
                    <p className="text-base leading-relaxed"
                       style={{ color: "oklch(0.75 0 0)" }}>
                        Dari produksi, stok, kasir, hingga laporan keuangan — semuanya dalam satu platform.
                    </p>

                    {/* Feature list */}
                    <ul className="mt-6 space-y-2 text-sm" style={{ color: "oklch(0.7 0 0)" }}>
                        {[
                            "Point of Sale & Pre-Order",
                            "Manajemen Produksi & Resep",
                            "Laporan Keuangan Real-time",
                            "CRM & Notifikasi WhatsApp",
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full shrink-0"
                                      style={{ background: "oklch(0.72 0.15 60)" }} />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer quote */}
                <p className="relative z-10 text-xs" style={{ color: "oklch(0.5 0 0)" }}>
                    © 2026 Bakery System · All rights reserved
                </p>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 bg-white">
                {/* Mobile logo */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                         style={{ background: "oklch(0.18 0.02 240)" }}>
                        <Cake className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-gray-900">Bakery System</span>
                </div>

                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
