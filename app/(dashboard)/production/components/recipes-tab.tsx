"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
        const data = await res.json();
        setRecipes(data);
      }
    } catch (error) {
      toast.error("Gagal memuat resep");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daftar Resep</CardTitle>
          <Link href="/production/recipes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Resep
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada resep. Tambahkan resep untuk memulai produksi.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{recipe.product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">SKU: {recipe.product.sku}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Hasil: {recipe.yield} {recipe.yieldUnit}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Bahan ({recipe.ingredients.length}):</p>
                      <div className="space-y-1">
                        {recipe.ingredients.slice(0, 3).map((ing) => (
                          <div key={ing.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{ing.material.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ing.quantity} {ing.unit}
                            </Badge>
                          </div>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{recipe.ingredients.length - 3} bahan lainnya
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/production/recipes/${recipe.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        Lihat Detail
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
