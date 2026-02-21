import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { UserForm } from "@/components/users/user-form";

export default async function UserPage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");
    if (session.user.role !== "OWNER") redirect("/dashboard");

    const { userId } = await params;

    let user = null;

    if (userId !== "new") {
        const found = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                isActive: true,
            },
        });
        if (found) {
            user = {
                id: found.id,
                name: found.name || "",
                email: found.email,
                role: found.role,
                phone: found.phone || "",
                isActive: found.isActive,
            };
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <UserForm initialData={user} />
        </div>
    );
}
