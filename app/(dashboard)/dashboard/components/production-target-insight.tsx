"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Factory, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/dashboard-utils";

interface ProductionTargetSummary {
  monthLabel: string;
  targetQuantity: number;
  plannedQuantity: number;
  producedQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
  totalOrders: number;
  completedOrders: number;
}

export function ProductionTargetInsight() {
  const [summary, setSummary] = useState<ProductionTargetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch("/api/production/targets");
        if (!response.ok) return;
        setSummary((await response.json()) as ProductionTargetSummary);
      } finally {
        setLoading(false);
      }
    };

    void fetchSummary();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const hasTarget = summary.targetQuantity > 0;
  const progress = Math.round(summary.progressPercentage);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <CardTitle>Target Produksi</CardTitle>
            </div>
            <CardDescription>{summary.monthLabel}</CardDescription>
          </div>
          <Link href="/production">
            <Button variant="outline" size="sm">
              Atur
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="mt-1 text-xl font-bold">
              {formatNumber(summary.targetQuantity)}
            </p>
          </div>
          <div className="rounded-lg border bg-green-50/60 p-3">
            <p className="text-xs text-muted-foreground">Selesai</p>
            <p className="mt-1 text-xl font-bold text-green-700">
              {formatNumber(summary.producedQuantity)}
            </p>
          </div>
          <div className="rounded-lg border bg-blue-50/60 p-3">
            <p className="text-xs text-muted-foreground">Rencana</p>
            <p className="mt-1 text-xl font-bold text-blue-700">
              {formatNumber(summary.plannedQuantity)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {hasTarget ? `${progress}% tercapai` : "Target belum diatur"}
            </span>
            <span className="text-muted-foreground">
              {formatNumber(summary.remainingQuantity)} pcs tersisa
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${summary.progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3 text-sm text-muted-foreground">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <span>
            {summary.completedOrders}/{summary.totalOrders} order produksi sudah selesai bulan ini.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
