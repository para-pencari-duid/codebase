"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { alertError } from "@/lib/swal";
import Link from "next/link";

interface Recipe {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  yield: number;
  yieldUnit: string;
  ingredients: {
    id: string;
    material: {
      name: string;
      unit: string;
    };
    quantity: number;
    unit: string;
  }[];
}

interface RecipeApi {
  id: string;
  item?: {
    id: string;
    name?: string | null;
    sku?: string | null;
  } | null;
  yield?: number | null;
  yieldUnit?: string | null;
  components?: {
    id: string;
    componentItem?: {
      name?: string | null;
      unit?: string | null;
    } | null;
    quantity?: number | null;
    unit?: string | null;
  }[];
}

export function RecipesTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = (await res.json()) as RecipeApi[];
        const mappedRecipes: Recipe[] = (Array.isArray(data) ? data : []).map((recipe) => ({
          id: recipe.id,
          product: {
            id: recipe.item?.id || "",
            name: recipe.item?.name || "Produk tidak ditemukan",
            sku: recipe.item?.sku || "-",
          },
          yield: Number(recipe.yield || 0),
          yieldUnit: recipe.yieldUnit || "pcs",
          ingredients: (recipe.components || []).map((component) => ({
            id: component.id,
            material: {
              name: component.componentItem?.name || "Bahan tidak ditemukan",
              unit: component.componentItem?.unit || component.unit || "pcs",
            },
            quantity: Number(component.quantity || 0),
            unit: component.unit || component.componentItem?.unit || "pcs",
          })),
        }));

        setRecipes(mappedRecipes);
      }
    } catch (error) {
      alertError("Gagal memuat resep");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-sm font-semibold text-gray-700">Daftar Resep</p>
        <Link href="/production/recipes/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Resep
          </Button>
        </Link>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
        ) : recipes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Belum ada resep. Tambahkan resep untuk memulai produksi.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                style={{ border: "1px solid var(--border)", boxShadow: "0 1px 2px oklch(0 0 0 / 5%)" }}
              >
                <p className="font-semibold text-sm text-gray-900">{recipe.product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">SKU: {recipe.product.sku}</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Hasil: {recipe.yield} {recipe.yieldUnit}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Bahan ({recipe.ingredients.length}):</p>
                    <div className="space-y-1">
                      {recipe.ingredients.slice(0, 3).map((ing) => (
                        <div key={ing.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ing.material.name}</span>
                          <span className="font-medium text-gray-700">{ing.quantity} {ing.unit}</span>
                        </div>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <p className="text-xs text-gray-400">+{recipe.ingredients.length - 3} bahan lainnya</p>
                      )}
                    </div>
                  </div>
                  <Link href={`/production/recipes/${recipe.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
