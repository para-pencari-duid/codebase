import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { RoleRouteGuard } from "@/components/layout/role-route-guard";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── User Avatar ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  OWNER:    "Owner",
  MANAGER:  "Manajer",
  KASIR:  "Kasir",
};

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  OWNER:    { bg: "bg-rose-50",   text: "text-rose-600" },
  MANAGER:  { bg: "bg-amber-50",  text: "text-amber-600" },
  KASIR:  { bg: "bg-sky-50",    text: "text-sky-600" },
};

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const styles = ROLE_STYLES[role] ?? { bg: "bg-slate-50", text: "text-slate-600" };
  const label = ROLE_LABELS[role] ?? role;

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${styles.bg} ${styles.text}`}>
        {initials || "?"}
      </div>
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-sm font-semibold text-gray-800 leading-tight">{name}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${styles.text} leading-tight`}>{label}</span>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let businessName = "POS System";
  let businessLogo: string | null = null;
  try {
    const settings = await db.settings.findFirst();
    if (settings?.businessName) {
      businessName = settings.businessName;
    }
    if (settings?.logo) {
      businessLogo = settings.logo;
    }
  } catch {
    // fallback to default
  }

  const userName = session.user.name ?? "Pengguna";
  const userRole = session.user.role ?? "USER";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar businessName={businessName} businessLogo={businessLogo} role={userRole} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* ── Header ── */}
        <header className="flex h-15 shrink-0 items-center gap-3 px-4 lg:px-5"
          style={{ borderBottom: "1px solid var(--border)", background: "oklch(1 0 0)" }}>
          <MobileSidebar businessName={businessName} businessLogo={businessLogo} role={userRole} />

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">
              {getGreeting()},&nbsp;
              <span className="font-semibold text-gray-800">{userName}</span>
            </p>
          </div>

          {/* Date pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-gray-500 select-none"
               style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
            {getTodayLabel()}
          </div>

          {/* Avatar */}
          <UserAvatar name={userName} role={userRole} />
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          <RoleRouteGuard role={userRole}>{children}</RoleRouteGuard>
        </main>
      </div>
    </div>
  );
}
