import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import BackupClient from "@/components/settings/backup-client";
import { WhatsAppClient } from "@/components/settings/whatsapp-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Only OWNER and MANAGER can access settings
    if (session.user.role === "KASIR") {
        redirect("/dashboard");
    }

    let settings = await db.settings.findFirst();

    if (!settings) {
        settings = await db.settings.create({
            data: {
                businessName: "Toko Roti Bahagia",
                taxRate: 11,
            },
        });
    }

    const formattedSettings = {
        id: settings.id,
        businessName: settings.businessName,
        businessAddress: settings.businessAddress || "",
        businessPhone: settings.businessPhone || "",
        businessEmail: settings.businessEmail || "",
        logo: settings.logo || "",
        taxRate: Number(settings.taxRate),
        taxIncluded: settings.taxIncluded,
        currency: settings.currency,
        receiptHeader: settings.receiptHeader || "",
        receiptFooter: settings.receiptFooter || "",
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Heading
                title="Pengaturan"
                description="Kelola pengaturan toko dan backup data"
            />
            <Separator />
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">Umum</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <SettingsForm initialData={formattedSettings} />
                </TabsContent>
                <TabsContent value="whatsapp">
                    <WhatsAppClient />
                </TabsContent>
                <TabsContent value="backup">
                    <BackupClient />
                </TabsContent>
            </Tabs>
        </div>
    );
}
