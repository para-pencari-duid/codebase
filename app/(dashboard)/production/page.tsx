"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package2, Layers, Factory } from "lucide-react";
import { RawMaterialsTab } from "./components/raw-materials-tab";
import { RecipesTab } from "./components/recipes-tab";
import { ProductionOrdersTab } from "./components/production-orders-tab";

export default function ProductionPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produksi</h2>
          <p className="text-muted-foreground">
            Kelola bahan baku, resep, dan produksi
          </p>
        </div>
      </div>

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
