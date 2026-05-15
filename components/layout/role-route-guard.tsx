"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const CASHIER_ALLOWED_PREFIXES = [
  "/pos",
  "/transactions",
  "/pre-orders",
  "/customers",
  "/print",
];

export function RoleRouteGuard({
  children,
  role,
}: {
  children: React.ReactNode;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role !== "KASIR") return;

    const isAllowed = CASHIER_ALLOWED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!isAllowed) {
      router.replace("/pos");
    }
  }, [pathname, role, router]);

  return <>{children}</>;
}
