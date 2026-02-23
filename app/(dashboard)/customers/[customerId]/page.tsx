import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function CustomerPage({
    params,
}: {
    params: Promise<{ customerId: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { customerId } = await params;
    const customer = customerId === "new"
        ? null
        : await db.customer.findFirst({
            where: { id: customerId },
        });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4">
                <CustomerForm initialData={customer} />
            </div>
        </div>
    );
}
