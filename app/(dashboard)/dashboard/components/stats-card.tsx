"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  format?: "currency" | "number";
  iconColor?: string;
  subtitle?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
  iconColor = "text-primary",
  subtitle,
}: StatsCardProps) {
  const formattedValue = format === "currency" ? formatCurrency(value) : formatNumber(value);
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <p
            className={cn(
              "text-xs mt-1",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {isPositive ? "+" : ""}{change.toFixed(1)}% dari kemarin
          </p>
        )}
      </CardContent>
    </Card>
  );
}
