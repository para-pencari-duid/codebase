"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatChartDate } from "@/lib/dashboard-utils";
import type { DateRangeOption, RevenueDataPoint } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

const rangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "year", label: "Tahun Ini" },
];

export function RevenueChart() {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("week");

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange]);

  const fetchData = async (range: DateRangeOption) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/revenue?range=${range}`);
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">
            {formatChartDate(label, selectedRange)}
          </p>
          <p className="text-sm text-green-600">
            Pendapatan: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-blue-600">
            Transaksi: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grafik Pendapatan</CardTitle>
            <CardDescription>Trend pendapatan berdasarkan waktu</CardDescription>
          </div>
          <div className="flex gap-2">
            {rangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedRange === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(option.value)}
                className={cn(
                  "text-xs",
                  selectedRange === option.value && "shadow-sm"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatChartDate(value, selectedRange)}
                className="text-xs"
              />
              <YAxis tickFormatter={formatYAxis} className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="Pendapatan"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
