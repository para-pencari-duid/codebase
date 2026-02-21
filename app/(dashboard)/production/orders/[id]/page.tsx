
import prisma from "@/lib/db";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/dashboard-utils";
import { notFound } from "next/navigation";

export default async function ProductionOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await prisma.productionOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            materials: {
                include: {
                    material: true,
                },
            },
        },
    });

    if (!order) {
        notFound();
    }

    const STATUS_COLORS: Record<string, string> = {
        PLANNED: "bg-blue-500",
        IN_PROGRESS: "bg-yellow-500",
        COMPLETED: "bg-green-500",
        CANCELLED: "bg-red-500",
    };

    const STATUS_LABELS: Record<string, string> = {
        PLANNED: "Direncanakan",
        IN_PROGRESS: "Sedang Berlangsung",
        COMPLETED: "Selesai",
        CANCELLED: "Dibatalkan",
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{order.orderNo}</h2>
                    <p className="text-sm text-muted-foreground">
                        Detail order produksi
                    </p>
                </div>
                <Badge className={STATUS_COLORS[order.status]}>
                    {STATUS_LABELS[order.status]}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Umum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Jadwal Produksi</span>
                            <span>{format(new Date(order.scheduledDate), "dd MMMM yyyy", { locale: localeId })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimasi Biaya</span>
                            <span>{formatCurrency(Number(order.totalCost))}</span>
                        </div>
                        {order.notes && (
                            <div className="pt-2">
                                <span className="text-muted-foreground block mb-1">Catatan:</span>
                                <p className="text-sm border p-2 rounded-md bg-muted/50">{order.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Produk ({order.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{item.targetQuantity} pcs</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bahan Baku yang Dibutuhkan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {order.materials.map((mat) => (
                            <div key={mat.id} className="grid grid-cols-12 gap-4 py-2 hover:bg-muted/50 rounded-sm px-2">
                                <div className="col-span-5 font-medium">{mat.materialName}</div>
                                <div className="col-span-3 text-right">{Number(mat.quantity)} {mat.unit}</div>
                                <div className="col-span-4 text-right">{formatCurrency(Number(mat.cost))}</div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                        <span>Total Biaya Bahan</span>
                        <span>{formatCurrency(Number(order.totalCost))}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
