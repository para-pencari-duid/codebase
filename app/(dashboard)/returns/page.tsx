"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { PackageX, Check, X, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReturnItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  condition: string;
  returnToStock: boolean;
}

interface Return {
  id: string;
  returnNo: string;
  transactionNo: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  subtotal: number;
  refundAmount: number;
  refundMethod: string;
  createdAt: Date;
  approvedAt: Date | null;
  items: ReturnItem[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    returnId: string;
    action: "approve" | "reject" | "complete";
  }>({ open: false, returnId: "", action: "approve" });

  useEffect(() => {
    fetchReturns();
  }, [filter]);

  const fetchReturns = async () => {
    try {
      const status = filter === "all" ? "" : filter;
      const response = await fetch(`/api/returns?status=${status}&limit=50`);
      const data = await response.json();
      
      if (response.ok) {
        setReturns(data.returns || []);
      } else {
        toast.error("Failed to load returns");
      }
    } catch (error) {
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      const response = await fetch(`/api/returns/${actionDialog.returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionDialog.action }),
      });

      if (response.ok) {
        toast.success(
          actionDialog.action === "approve"
            ? "Return approved"
            : actionDialog.action === "reject"
            ? "Return rejected"
            : "Return completed and stock updated"
        );
        fetchReturns();
      } else {
        const error = await response.json();
        toast.error(error.error || "Action failed");
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setActionDialog({ open: false, returnId: "", action: "approve" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: "secondary", label: "Pending" },
      APPROVED: { variant: "default", label: "Approved", className: "bg-blue-500" },
      REJECTED: { variant: "destructive", label: "Rejected" },
      COMPLETED: { variant: "default", label: "Completed", className: "bg-green-500" },
    };

    const config = variants[status] || variants.PENDING;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Returns & Refunds</h1>
          <p className="text-muted-foreground">
            Manage product returns and refund processing
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Returns</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading returns...</div>
        ) : returns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No returns found
          </div>
        ) : (
          returns.map((returnRecord) => (
            <Card key={returnRecord.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PackageX className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{returnRecord.returnNo}</h3>
                      {getStatusBadge(returnRecord.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Original Transaction: {returnRecord.transactionNo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created: {format(new Date(returnRecord.createdAt), "PPp")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Refund Amount</p>
                    <p className="text-2xl font-bold">
                      Rp {returnRecord.refundAmount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {returnRecord.refundMethod}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm text-muted-foreground">
                    {returnRecord.reason}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Items:</p>
                  <div className="space-y-1">
                    {returnRecord.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm bg-muted p-2 rounded"
                      >
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {item.condition}
                          </Badge>
                          <span className="font-semibold">
                            Rp {item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {returnRecord.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        setActionDialog({
                          open: true,
                          returnId: returnRecord.id,
                          action: "approve",
                        })
                      }
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setActionDialog({
                          open: true,
                          returnId: returnRecord.id,
                          action: "reject",
                        })
                      }
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {returnRecord.status === "APPROVED" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() =>
                      setActionDialog({
                        open: true,
                        returnId: returnRecord.id,
                        action: "complete",
                      })
                    }
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Complete Return
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({ ...actionDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === "approve"
                ? "Approve Return?"
                : actionDialog.action === "reject"
                ? "Reject Return?"
                : "Complete Return?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.action === "approve"
                ? "This will approve the return request and allow it to be processed."
                : actionDialog.action === "reject"
                ? "This will reject the return request. This action cannot be undone."
                : "This will complete the return, update stock levels, and mark it as processed. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
