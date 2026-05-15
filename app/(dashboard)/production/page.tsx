"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package2, Layers, Factory } from "lucide-react";
import { RawMaterialsTab } from "./components/raw-materials-tab";
import { RecipesTab } from "./components/recipes-tab";
import { ProductionOrdersTab } from "./components/production-orders-tab";
import { ProductionTargetCard } from "./components/production-target-card";

export default function ProductionPage() {
  return (
    <div className="p-5 lg:p-7 space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Produksi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola bahan baku, resep, dan produksi</p>
      </div>

      <ProductionTargetCard />

      {/* Tabs */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials" className="gap-2">
            <Package2 className="h-4 w-4" />
            Bahan Baku
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <Layers className="h-4 w-4" />
            Resep
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Factory className="h-4 w-4" />
            Produksi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <RawMaterialsTab />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <RecipesTab />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <ProductionOrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
