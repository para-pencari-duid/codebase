import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-slate-100/40 px-6 dark:bg-slate-800/40">
                    <MobileSidebar />
                    <div className="w-full flex items-center justify-end gap-3">
                        <Badge variant="outline" className="text-xs">
                            {session.user.role || "USER"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Halo, <span className="font-semibold text-foreground">{session.user.name}</span>
                        </span>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
