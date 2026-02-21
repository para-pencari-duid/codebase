"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Smartphone,
  Building2,
} from "lucide-react";
import { format } from "date-fns";

interface Shift {
  id: string;
  shiftNo: string;
  openedAt: Date;
  closedAt: Date | null;
  status: "OPEN" | "CLOSED";
  openingBalance: number;
  closingBalance: number | null;
  actualCash: number | null;
  variance: number | null;
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  totalQris: number;
  totalCard: number;
  transactionCount: number;
  notes: string | null;
}

export default function ShiftsPage() {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  useEffect(() => {
    fetchCurrentShift();
    fetchShifts();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const response = await fetch("/api/shifts/current");
      const data = await response.json();
      
      if (response.ok) {
        setCurrentShift(data.shift);
      }
    } catch (error) {
      console.error("Failed to fetch current shift:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await fetch("/api/shifts?limit=10");
      const data = await response.json();
      
      if (response.ok) {
        setShifts(data.shifts || []);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  };

  const handleOpenShift = async () => {
    try {
      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingBalance: parseFloat(openingBalance) || 0,
        }),
      });

      if (response.ok) {
        toast.success("Shift opened successfully");
        setOpenShiftDialog(false);
        setOpeningBalance("");
        fetchCurrentShift();
        fetchShifts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to open shift");
      }
    } catch (error) {
      toast.error("Failed to open shift");
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;

    try {
      const response = await fetch(`/api/shifts/${currentShift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          actualCash: parseFloat(actualCash) || 0,
          notes: closeNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Shift closed successfully");
        
        // Show variance alert if any
        if (data.variance !== 0) {
          const varianceMsg = data.variance > 0 
            ? `Cash surplus: Rp ${Math.abs(data.variance).toLocaleString()}`
            : `Cash shortage: Rp ${Math.abs(data.variance).toLocaleString()}`;
          toast.info(varianceMsg);
        }
        
        setCloseShiftDialog(false);
        setActualCash("");
        setCloseNotes("");
        fetchCurrentShift();
        fetchShifts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to close shift");
      }
    } catch (error) {
      toast.error("Failed to close shift");
    }
  };

  const expectedClosingBalance = currentShift
    ? Number(currentShift.openingBalance) + currentShift.totalCash
    : 0;

  const calculatedVariance = actualCash
    ? parseFloat(actualCash) - expectedClosingBalance
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">
            Manage cash drawer opening and closing
          </p>
        </div>
        {!currentShift && (
          <Button onClick={() => setOpenShiftDialog(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Open Shift
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : currentShift ? (
        <>
          {/* Current Shift Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Current Shift: {currentShift.shiftNo}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Opened at {format(new Date(currentShift.openedAt), "PPpp")}
                  </p>
                </div>
                <Button onClick={() => setCloseShiftDialog(true)} variant="destructive">
                  Close Shift
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Opening Balance</p>
                  <p className="text-2xl font-bold">
                    Rp {Number(currentShift.openingBalance).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {currentShift.totalSales.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{currentShift.transactionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Cash</p>
                  <p className="text-2xl font-bold">
                    Rp {expectedClosingBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cash</p>
                    <p className="font-semibold">
                      Rp {currentShift.totalCash.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer</p>
                    <p className="font-semibold">
                      Rp {currentShift.totalTransfer.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">QRIS</p>
                    <p className="font-semibold">
                      Rp {currentShift.totalQris.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Card</p>
                    <p className="font-semibold">
                      Rp {currentShift.totalCard.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-8">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="font-semibold">No Active Shift</h3>
              <p className="text-sm text-muted-foreground">
                Please open a shift to start processing transactions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Shifts</h2>
        <div className="space-y-4">
          {shifts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No shift history
            </p>
          ) : (
            shifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {shift.shiftNo}
                        <Badge variant={shift.status === "OPEN" ? "default" : "secondary"}>
                          {shift.status}
                        </Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.openedAt), "PPpp")}
                        {shift.closedAt &&
                          ` - ${format(new Date(shift.closedAt), "PPpp")}`}
                      </p>
                    </div>
                    {shift.variance !== null && shift.variance !== 0 && (
                      <Badge
                        variant={shift.variance > 0 ? "default" : "destructive"}
                      >
                        {shift.variance > 0 ? "+" : ""}
                        Rp {shift.variance.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Sales</p>
                      <p className="font-semibold">
                        Rp {shift.totalSales.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transactions</p>
                      <p className="font-semibold">{shift.transactionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opening</p>
                      <p className="font-semibold">
                        Rp {Number(shift.openingBalance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Closing</p>
                      <p className="font-semibold">
                        {shift.closingBalance !== null
                          ? `Rp ${Number(shift.closingBalance).toLocaleString()}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Open Shift Dialog */}
      <Dialog open={openShiftDialog} onOpenChange={setOpenShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Opening Cash Balance *</Label>
              <Input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Count the cash in the drawer before starting
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenShiftDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleOpenShift}>Open Shift</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Opening Balance:</span>
                <span className="font-semibold">
                  Rp {Number(currentShift?.openingBalance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span className="font-semibold">
                  Rp {(currentShift?.totalCash || 0).toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Expected Cash:</span>
                <span className="font-bold">
                  Rp {expectedClosingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual Cash in Drawer *</Label>
              <Input
                type="number"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Count all cash in the drawer
              </p>
            </div>

            {actualCash && (
              <div
                className={`p-3 rounded-lg ${
                  calculatedVariance === 0
                    ? "bg-green-50 text-green-900"
                    : calculatedVariance > 0
                    ? "bg-blue-50 text-blue-900"
                    : "bg-red-50 text-red-900"
                }`}
              >
                <p className="font-semibold">
                  {calculatedVariance === 0
                    ? "✓ Cash matches perfectly"
                    : calculatedVariance > 0
                    ? `Surplus: Rp ${Math.abs(calculatedVariance).toLocaleString()}`
                    : `Shortage: Rp ${Math.abs(calculatedVariance).toLocaleString()}`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Any notes about this shift..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCloseShiftDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCloseShift} variant="destructive">
                Close Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
