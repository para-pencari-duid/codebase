import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { POSClient } from "@/components/pos/pos-client";
import { getPOSPageData } from "@/lib/pos/get-pos-page-data";

export default async function POSPage() {
  const session = await auth();
  if (!session || !session.user) redirect("/login");
  const posPageData = await getPOSPageData();

  return (
    <div className="flex-1 overflow-hidden">
      <POSClient
        products={posPageData.products}
        categories={posPageData.categories}
        cashierName={session.user.name || "Kasir"}
        settings={posPageData.settings}
      />
    </div>
  );
}
