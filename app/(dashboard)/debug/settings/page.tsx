"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DebugSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const checkSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/debug/settings");
      const data = await res.json();
      setData(data);
      
      if (data.total > 1) {
        toast.warning(`Found ${data.total} settings records - duplicate detected!`);
      } else {
        toast.success("Settings OK - only 1 record");
      }
    } catch (error) {
      toast.error("Failed to check settings");
    } finally {
      setLoading(false);
    }
  };

  const mergeSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/debug/merge-settings", { method: "POST" });
      const result = await res.json();
      
      if (result.success) {
        toast.success(result.message);
        await checkSettings(); // Refresh
      } else {
        toast.error(result.error || "Failed to merge");
      }
    } catch (error) {
      toast.error("Failed to merge settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Debug: Settings Table
          </CardTitle>
          <CardDescription>
            Check and fix duplicate settings records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkSettings} disabled={loading}>
              Check Settings
            </Button>
            {data && data.total > 1 && (
              <Button 
                onClick={mergeSettings} 
                disabled={loading}
                variant="destructive"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Merge Duplicates (Keep Newest)
              </Button>
            )}
          </div>

          {data && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-2">
                Total Records: {data.total}
                {data.total > 1 && <span className="text-red-500 ml-2">⚠️ Duplicate!</span>}
              </p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(data.records, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Does</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Check Settings:</strong> Shows all settings records in database</p>
          <p><strong>Merge Duplicates:</strong> Keeps the newest record, deletes old ones</p>
          <p className="text-orange-600">
            💡 After merge, WhatsApp connection should work properly
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
