import { BarChart3, Boxes, ExternalLink, ReceiptText, Store } from "lucide-react";

const features = [
    "POS kasir dan pembayaran",
    "Manajemen stok dan inventori",
    "Produksi, resep, dan pre-order",
    "Laporan usaha real-time",
];

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
                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                         style={{ background: "oklch(0.72 0.15 60)" }}>
                        <Store className="h-5 w-5 text-white" />
                    </div>
                    <div className="leading-tight">
                        <span className="block text-lg font-bold tracking-tight">Lokkah POS</span>
                        <span className="text-xs font-medium" style={{ color: "oklch(0.72 0 0)" }}>
                            Project by lokkah.id
                        </span>
                    </div>
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-5">
                    <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                         style={{ borderColor: "oklch(0.34 0.03 240)", color: "oklch(0.82 0.12 60)" }}>
                        Dikhususkan untuk UMKM dan retail
                    </div>
                    <h1 className="text-4xl font-bold leading-tight tracking-tight">
                        Kelola operasional usaha<br />
                        <span style={{ color: "oklch(0.82 0.12 60)" }}>dalam satu dashboard.</span>
                    </h1>
                    <p className="text-base leading-relaxed"
                       style={{ color: "oklch(0.75 0 0)" }}>
                        Project ini menggunakan sistem dari Lokkah untuk membantu toko mengelola POS,
                        inventori, produksi, pelanggan, supplier, dan laporan laba rugi.
                    </p>

                    {/* Feature list */}
                    <ul className="mt-6 grid gap-3 text-sm" style={{ color: "oklch(0.7 0 0)" }}>
                        {features.map((f, index) => {
                            const Icon = [ReceiptText, Boxes, Store, BarChart3][index];
                            return (
                            <li key={f} className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                                      style={{ background: "oklch(0.24 0.025 240)", color: "oklch(0.82 0.12 60)" }}>
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                {f}
                            </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Footer quote */}
                <div className="relative z-10 flex items-center justify-between gap-4 text-xs" style={{ color: "oklch(0.58 0 0)" }}>
                    <span>© 2026 Lokkah. All rights reserved.</span>
                    <a
                        href="https://lokkah.id/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-white"
                    >
                        lokkah.id
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 bg-white">
                {/* Mobile logo */}
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                         style={{ background: "oklch(0.18 0.02 240)" }}>
                        <Store className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div className="leading-tight">
                        <span className="block text-base font-bold tracking-tight text-gray-900">Lokkah POS</span>
                        <a
                            href="https://lokkah.id/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-gray-500"
                        >
                            Project by lokkah.id
                        </a>
                    </div>
                </div>

                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
