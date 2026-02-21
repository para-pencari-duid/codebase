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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Package, Plus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string;
}

interface ProductBatch {
  id: string;
  batchNo: string;
  quantity: number;
  remainingQty: number;
  manufactureDate: Date;
  expiryDate: Date;
  cost: number;
  supplier: string | null;
  discountRate: number;
  daysUntilExpiry: number;
  autoDiscount: number;
  product: Product;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    batchNo: "",
    quantity: "",
    manufactureDate: new Date(),
    expiryDate: new Date(),
    cost: "",
    supplier: "",
    notes: "",
  });

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, [filter]);

  const fetchBatches = async () => {
    try {
      const status = filter === "all" ? "" : filter;
      const response = await fetch(`/api/batches?status=${status}&limit=100`);
      const data = await response.json();
      
      if (response.ok) {
        setBatches(data.batches || []);
      } else {
        toast.error("Failed to load batches");
      }
    } catch (error) {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=1000");
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Batch created successfully");
        setIsDialogOpen(false);
        fetchBatches();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create batch");
      }
    } catch (error) {
      toast.error("Failed to create batch");
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      batchNo: "",
      quantity: "",
      manufactureDate: new Date(),
      expiryDate: new Date(),
      cost: "",
      supplier: "",
      notes: "",
    });
  };

  const getUrgencyBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired {Math.abs(daysUntilExpiry)} days</Badge>;
    } else if (daysUntilExpiry <= 2) {
      return <Badge className="bg-orange-500">Expires in {daysUntilExpiry} days</Badge>;
    } else if (daysUntilExpiry <= 5) {
      return <Badge className="bg-yellow-500">Expires in {daysUntilExpiry} days</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="secondary">Expires in {daysUntilExpiry} days</Badge>;
    }
    return <Badge variant="outline">{daysUntilExpiry} days left</Badge>;
  };

  const criticalBatches = batches.filter(b => b.daysUntilExpiry <= 7);
  const expiredBatches = batches.filter(b => b.daysUntilExpiry < 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
          <p className="text-muted-foreground">
            Track product batches with expiry dates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Batch Number *</Label>
                  <Input
                    value={formData.batchNo}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNo: e.target.value })
                    }
                    placeholder="e.g., BATCH-2024-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost per Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Manufacture Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.manufactureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.manufactureDate ? (
                          format(formData.manufactureDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.manufactureDate}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, manufactureDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiryDate ? (
                          format(formData.expiryDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, expiryDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="Supplier name"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Batch</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Cards */}
      {(criticalBatches.length > 0 || expiredBatches.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {expiredBatches.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-900">
                  Expired Batches
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {expiredBatches.length}
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Requires immediate action
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Near Expiry (7 days)
              </CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {criticalBatches.length}
              </div>
              <p className="text-xs text-orange-700 mt-1">
                Consider discounts to clear stock
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Batches
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
        >
          Active
        </Button>
        <Button
          variant={filter === "near-expiry" ? "default" : "outline"}
          onClick={() => setFilter("near-expiry")}
        >
          Near Expiry
        </Button>
        <Button
          variant={filter === "expired" ? "default" : "outline"}
          onClick={() => setFilter("expired")}
        >
          Expired
        </Button>
      </div>

      {/* Batches List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No batches found
          </div>
        ) : (
          batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{batch.product.name}</h3>
                      <Badge variant="outline">{batch.batchNo}</Badge>
                      {getUrgencyBadge(batch.daysUntilExpiry)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {batch.product.sku} • Remaining: {batch.remainingQty}/
                      {batch.quantity} {batch.product.unit}
                    </div>
                    <div className="text-sm">
                      Expiry: {format(new Date(batch.expiryDate), "PPP")}
                      {batch.supplier && ` • Supplier: ${batch.supplier}`}
                    </div>
                  </div>

                  <div className="text-right">
                    {batch.autoDiscount > 0 && (
                      <div className="mb-2">
                        <Badge className="bg-green-500">
                          {batch.autoDiscount}% Auto Discount
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Original: Rp {batch.product.price.toLocaleString()}
                    </div>
                    {batch.autoDiscount > 0 && (
                      <div className="text-lg font-bold text-green-600">
                        Rp{" "}
                        {(
                          Number(batch.product.price) *
                          (1 - batch.autoDiscount / 100)
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
