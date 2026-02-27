"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Settings2, Users, UtensilsCrossed, RefreshCw } from "lucide-react";

type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";

interface TableData {
    id: string;
    number: string;
    name: string | null;
    capacity: number;
    floor: string | null;
    status: TableStatus;
    qrToken: string;
    isActive: boolean;
    activeOrder: {
        id: string;
        orderNo: string;
        guestCount: number;
        items: { id: string; itemName: string; quantity: number; price: number }[];
    } | null;
}

const STATUS_STYLES: Record<TableStatus, string> = {
    AVAILABLE: "bg-green-100 border-green-400 text-green-800",
    OCCUPIED: "bg-red-100 border-red-400 text-red-800",
    RESERVED: "bg-yellow-100 border-yellow-400 text-yellow-800",
    CLEANING: "bg-gray-100 border-gray-400 text-gray-600",
};

const STATUS_LABEL: Record<TableStatus, string> = {
    AVAILABLE: "Tersedia",
    OCCUPIED: "Terisi",
    RESERVED: "Reservasi",
    CLEANING: "Dibersihkan",
};

export function TableClient({ tables: initialTables }: { tables: TableData[] }) {
    const router = useRouter();
    const [tables, setTables] = useState<TableData[]>(initialTables);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    const [showAddItemDialog, setShowAddItemDialog] = useState(false);
    const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state — new table
    const [newTable, setNewTable] = useState({ number: "", name: "", capacity: "4", floor: "" });

    // Form state — open order
    const [guestName, setGuestName] = useState("");
    const [guestCount, setGuestCount] = useState("1");

    const refresh = () => router.refresh();

    async function handleCreateTable() {
        if (!newTable.number) return;
        setLoading(true);
        try {
            const res = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    number: newTable.number,
                    name: newTable.name || undefined,
                    capacity: parseInt(newTable.capacity),
                    floor: newTable.floor || undefined,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Meja berhasil ditambahkan");
            setShowAddDialog(false);
            setNewTable({ number: "", name: "", capacity: "4", floor: "" });
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal menambahkan meja");
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenOrder(table: TableData) {
        setLoading(true);
        try {
            const res = await fetch("/api/table-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableId: table.id,
                    guestName: guestName || undefined,
                    guestCount: parseInt(guestCount) || 1,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success(`Order dibuka untuk Meja ${table.number}`);
            setShowOrderDialog(false);
            setGuestName("");
            setGuestCount("1");
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal membuka order");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestBill(order: { id: string }) {
        setLoading(true);
        try {
            const res = await fetch(`/api/table-orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "BILL_REQUESTED" }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Struk diminta");
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal meminta struk");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateTableStatus(tableId: string, status: TableStatus) {
        setLoading(true);
        try {
            const res = await fetch(`/api/tables/${tableId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Status meja diperbarui");
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Gagal update status");
        } finally {
            setLoading(false);
        }
    }

    const floors = Array.from(new Set(tables.map((t) => t.floor || "Lantai 1")));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Manajemen Meja</h2>
                    <p className="text-muted-foreground">Kelola meja dan pesanan restoran</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refresh}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Tambah Meja
                    </Button>
                </div>
            </div>

            {/* Status legend */}
            <div className="flex gap-3 flex-wrap">
                {(Object.entries(STATUS_LABEL) as [TableStatus, string][]).map(([s, label]) => (
                    <Badge key={s} variant="outline" className={`${STATUS_STYLES[s]} border text-xs`}>
                        {label}
                    </Badge>
                ))}
            </div>

            {/* Tables grid per floor */}
            {floors.map((floor) => (
                <div key={floor} className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">{floor}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {tables
                            .filter((t) => (t.floor || "Lantai 1") === floor)
                            .map((table) => (
                                <div
                                    key={table.id}
                                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${STATUS_STYLES[table.status]}`}
                                    onClick={() => {
                                        setSelectedTable(table);
                                        if (table.status === "AVAILABLE" || table.status === "RESERVED") {
                                            setShowOrderDialog(true);
                                        }
                                    }}
                                >
                                    <div className="text-center">
                                        <UtensilsCrossed className="h-6 w-6 mx-auto mb-1 opacity-70" />
                                        <p className="font-bold text-lg">Meja {table.number}</p>
                                        {table.name && <p className="text-xs opacity-75">{table.name}</p>}
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Users className="h-3 w-3" />
                                            <span className="text-xs">{table.capacity}</span>
                                        </div>
                                        <Badge variant="outline" className={`mt-2 text-xs border ${STATUS_STYLES[table.status]}`}>
                                            {STATUS_LABEL[table.status]}
                                        </Badge>
                                    </div>

                                    {table.activeOrder && (
                                        <div className="mt-2 text-xs space-y-1 border-t pt-2">
                                            <p className="font-medium truncate">{table.activeOrder.orderNo}</p>
                                            <p>{table.activeOrder.items.length} item(s)</p>
                                            <div className="flex gap-1 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                                {table.activeOrder && table.status === "OCCUPIED" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-6 px-2"
                                                        onClick={() => handleRequestBill(table.activeOrder!)}
                                                        disabled={loading}
                                                    >
                                                        Minta Struk
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {table.status === "CLEANING" && (
                                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                className="w-full text-xs h-7"
                                                variant="outline"
                                                onClick={() => handleUpdateTableStatus(table.id, "AVAILABLE")}
                                                disabled={loading}
                                            >
                                                Tandai Selesai
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            ))}

            {tables.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Belum ada meja. Klik &quot;Tambah Meja&quot; untuk memulai.</p>
                </div>
            )}

            {/* Add Table Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Meja Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nomor Meja *</Label>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    value={newTable.number}
                                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kapasitas *</Label>
                                <Input
                                    type="number"
                                    placeholder="4"
                                    value={newTable.capacity}
                                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Meja (opsional)</Label>
                            <Input
                                placeholder="VIP 1, Balkon, dll"
                                value={newTable.name}
                                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Lantai / Area</Label>
                            <Input
                                placeholder="Lantai 1"
                                value={newTable.floor}
                                onChange={(e) => setNewTable({ ...newTable, floor: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
                        <Button onClick={handleCreateTable} disabled={loading || !newTable.number}>
                            Tambah
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Open Order Dialog */}
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Buka Order — Meja {selectedTable?.number}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Tamu (opsional)</Label>
                            <Input
                                placeholder="Pak Budi, Reservasi ABC, dll"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jumlah Tamu</Label>
                            <Input
                                type="number"
                                min={1}
                                value={guestCount}
                                onChange={(e) => setGuestCount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Batal</Button>
                        <Button
                            onClick={() => selectedTable && handleOpenOrder(selectedTable)}
                            disabled={loading}
                        >
                            Buka Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
