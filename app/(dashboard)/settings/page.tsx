import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";
import BackupClient from "@/components/settings/backup-client";
import { WhatsAppClient } from "@/components/settings/whatsapp-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Only OWNER and MANAGER can access settings
    if (session.user.role === "KASIR") {
        redirect("/dashboard");
    }

    let settings = await db.settings.findFirst({ where: {} });

    if (!settings) {
        settings = await db.settings.create({
            data: {
                businessName: "Usaha Saya",
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
        qrisString: settings.qrisString || "",
        loyaltyEnabled: settings.loyaltyEnabled,
        loyaltyPointsPerRupiah: settings.loyaltyPointsPerRupiah,
        loyaltyPointValue: settings.loyaltyPointValue,
        tierPricingEnabled: settings.tierPricingEnabled,
        consignmentEnabled: settings.consignmentEnabled,
        serialTrackEnabled: settings.serialTrackEnabled,
        accountingEnabled: settings.accountingEnabled,
        bankReconEnabled: settings.bankReconEnabled,
        payrollEnabled: settings.payrollEnabled,
        marketingEnabled: settings.marketingEnabled,
        feedbackEnabled: settings.feedbackEnabled,
        onlineOrderEnabled: settings.onlineOrderEnabled,
        webhooksEnabled: settings.webhooksEnabled,
    };

    return (
        <div className="p-5 lg:p-7 space-y-5">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengaturan</h1>
                <p className="text-sm text-gray-500 mt-0.5">Kelola pengaturan toko dan backup data</p>
            </div>
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
