import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
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

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN:    { bg: "bg-rose-100",   text: "text-rose-700" },
  MANAGER:  { bg: "bg-amber-100",  text: "text-amber-700" },
  CASHIER:  { bg: "bg-sky-100",    text: "text-sky-700" },
};

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const colors = ROLE_COLORS[role] ?? { bg: "bg-slate-100", text: "text-slate-700" };

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
        {initials || "?"}
      </div>
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className={`text-[10px] font-medium ${colors.text}`}>{role}</span>
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
  try {
    const settings = await db.settings.findFirst();
    if (settings?.businessName) {
      businessName = settings.businessName;
    }
  } catch {
    // fallback to default
  }

  const userName = session.user.name ?? "Pengguna";
  const userRole = session.user.role ?? "USER";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar businessName={businessName} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b bg-background px-4 lg:px-6">
          <MobileSidebar businessName={businessName} />

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {getGreeting()},{" "}
              <span className="text-primary font-semibold">{userName}</span>
            </p>
          </div>

          {/* Date pill — hidden on small screens */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs text-muted-foreground select-none">
            <span>{getTodayLabel()}</span>
          </div>

          {/* Avatar */}
          <UserAvatar name={userName} role={userRole} />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

