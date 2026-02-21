export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-md space-y-8 p-8">
                {children}
            </div>
        </div>
    );
}
