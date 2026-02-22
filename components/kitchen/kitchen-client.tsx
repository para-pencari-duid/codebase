"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChefHat, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type KitchenItemStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
type KitchenStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

interface KitchenItem {
    id: string;
    itemName: string;
    quantity: number;
    notes: string | null;
    status: KitchenItemStatus;
}

interface KitchenTicket {
    id: string;
    ticketNo: string;
    tableNumber: number | null;
    source: string;
    status: KitchenStatus;
    priority: number;
    notes: string | null;
    createdAt: string;
    startedAt: string | null;
    readyAt: string | null;
    items: KitchenItem[];
}

const COLUMN_STATUS: KitchenStatus[] = ["PENDING", "PREPARING", "READY"];

const COLUMN_STYLES: Record<KitchenStatus, string> = {
    PENDING: "border-orange-200 bg-orange-50",
    PREPARING: "border-blue-200 bg-blue-50",
    READY: "border-green-200 bg-green-50",
    SERVED: "border-gray-200 bg-gray-50",
    CANCELLED: "border-red-200 bg-red-50",
};

const COLUMN_LABELS: Record<KitchenStatus, string> = {
    PENDING: "⏳ Antrian",
    PREPARING: "🔥 Diproses",
    READY: "✅ Siap Saji",
    SERVED: "Disajikan",
    CANCELLED: "Dibatalkan",
};

const NEXT_STATUS: Partial<Record<KitchenStatus, KitchenStatus>> = {
    PENDING: "PREPARING",
    PREPARING: "READY",
    READY: "SERVED",
};

const NEXT_LABEL: Partial<Record<KitchenStatus, string>> = {
    PENDING: "Mulai Masak",
    PREPARING: "Tandai Siap",
    READY: "Sudah Disajikan",
};

function urgencyClass(createdAt: string): string {
    const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (mins >= 10) return "border-l-4 border-l-red-500";
    if (mins >= 5) return "border-l-4 border-l-yellow-400";
    return "border-l-4 border-l-green-400";
}

export function KitchenClient() {
    const [tickets, setTickets] = useState<KitchenTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [live, setLive] = useState(true);

    const fetchTickets = useCallback(async () => {
        try {
            const res = await fetch("/api/kitchen");
            if (!res.ok) return;
            const json = await res.json();
            setTickets(json.data ?? json);
        } catch {
            // silently fail
        }
    }, []);

    // Initial load + auto-poll every 5s
    useEffect(() => {
        fetchTickets();
        if (!live) return;
        const interval = setInterval(fetchTickets, 5000);
        return () => clearInterval(interval);
    }, [fetchTickets, live]);

    async function advance(ticket: KitchenTicket) {
        const next = NEXT_STATUS[ticket.status];
        if (!next) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/kitchen/${ticket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            if (!res.ok) throw new Error(await res.text());
            await fetchTickets();
        } catch (e: any) {
            toast.error(e.message || "Gagal update status");
        } finally {
            setLoading(false);
        }
    }

    async function advanceItem(ticketId: string, itemId: string, currentStatus: KitchenItemStatus) {
        const next = NEXT_STATUS[currentStatus as KitchenStatus] as KitchenItemStatus;
        if (!next) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/kitchen/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, itemStatus: next }),
            });
            if (!res.ok) throw new Error(await res.text());
            await fetchTickets();
        } catch (e: any) {
            toast.error(e.message || "Gagal update item");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dapur (KDS)</h2>
                    <p className="text-muted-foreground">Kitchen Display System — auto-refresh setiap 5 detik</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLive((l) => !l)}
                        className={live ? "text-green-600" : "text-gray-400"}
                    >
                        {live ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
                        {live ? "Live" : "Paused"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchTickets}>
                        <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Urgency legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> &lt; 5 menit</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> 5–10 menit</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &gt; 10 menit</span>
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMN_STATUS.map((col) => {
                    const colTickets = tickets.filter((t) => t.status === col);
                    return (
                        <div key={col} className="space-y-3">
                            <div className={`rounded-lg p-3 border ${COLUMN_STYLES[col]}`}>
                                <h3 className="font-semibold text-center">
                                    {COLUMN_LABELS[col]}
                                    <Badge variant="secondary" className="ml-2">{colTickets.length}</Badge>
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {colTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className={`bg-white rounded-lg border shadow-sm p-4 space-y-3 ${urgencyClass(ticket.createdAt)}`}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold">{ticket.ticketNo}</p>
                                                {ticket.tableNumber && (
                                                    <p className="text-sm text-muted-foreground">Meja {ticket.tableNumber}</p>
                                                )}
                                                <Badge variant="outline" className="text-xs mt-1">{ticket.source}</Badge>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3 inline mr-1" />
                                                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: id })}
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <ul className="space-y-1">
                                            {ticket.items.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className={`flex items-center justify-between text-sm p-1 rounded cursor-pointer hover:bg-gray-50 ${item.status === "READY" || item.status === "SERVED" ? "line-through text-muted-foreground" : ""}`}
                                                    onClick={() => advanceItem(ticket.id, item.id, item.status)}
                                                    title="Klik untuk update status item"
                                                >
                                                    <span>
                                                        <span className="font-medium">{item.quantity}×</span> {item.itemName}
                                                        {item.notes && <span className="text-xs text-orange-600 ml-1">({item.notes})</span>}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">{item.status}</Badge>
                                                </li>
                                            ))}
                                        </ul>

                                        {ticket.notes && (
                                            <p className="text-xs text-orange-700 bg-orange-50 rounded p-2">📝 {ticket.notes}</p>
                                        )}

                                        {/* Action button */}
                                        {NEXT_STATUS[ticket.status] && (
                                            <Button
                                                className="w-full"
                                                size="sm"
                                                onClick={() => advance(ticket)}
                                                disabled={loading}
                                            >
                                                {NEXT_LABEL[ticket.status]}
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                {colTickets.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        Kosong
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
