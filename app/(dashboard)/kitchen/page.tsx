import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KitchenClient } from "@/components/kitchen/kitchen-client";

export default async function KitchenPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <KitchenClient />
            </div>
        </div>
    );
}
