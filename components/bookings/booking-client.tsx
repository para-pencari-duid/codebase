"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarCheck, Plus, RefreshCw, Clock } from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface Booking {
    id: string;
    bookingNo: string;
    customerName: string;
    customerPhone: string | null;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string | null;
    duration: number | null;
    status: BookingStatus;
    notes: string | null;
    totalAmount: number | null;
    staff: { id: string; name: string } | null;
    customer: { id: string; name: string; phone: string | null } | null;
}

interface Staff {
    id: string;
    name: string;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    IN_PROGRESS: "Berjalan",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
    NO_SHOW: "Tidak Hadir",
};

const emptyForm = {
    customerName: "",
    customerPhone: "",
    serviceName: "",
    staffId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    duration: "60",
    notes: "",
    totalAmount: "",
};

export function BookingClient({ initialBookings, staff }: { initialBookings: Booking[]; staff: Staff[] }) {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [showDialog, setShowDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    const refresh = () => router.refresh();

    async function fetchBookings() {
        try {
            const res = await fetch("/api/bookings?limit=100");
            if (!res.ok) return;
            const json = await res.json();
            setBookings(json.data ?? json);
        } catch {/* ignore */}
    }

    async function handleCreate() {
        if (!form.customerName || !form.serviceName || !form.date || !form.startTime) {
            toast.error("Isi nama, layanan, tanggal, dan waktu terlebih dahulu");
            return;
        }
        setLoading(true);
        try {
            const startDateTime = new Date(`${form.date}T${form.startTime}:00`);
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: form.customerName,
                    customerPhone: form.customerPhone || undefined,
                    serviceName: form.serviceName,
                    staffId: form.staffId || undefined,
                    date: form.date,
                    startTime: startDateTime.toISOString(),
                    duration: form.duration ? parseInt(form.duration) : undefined,
                    notes: form.notes || undefined,
                    totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Booking berhasil dibuat");
            setShowDialog(false);
            setForm(emptyForm);
            await fetchBookings();
        } catch (e: any) {
            toast.error(e.message || "Gagal membuat booking");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateStatus(bookingId: string, status: BookingStatus) {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Status booking diperbarui");
            setShowStatusDialog(false);
            await fetchBookings();
        } catch (e: any) {
            toast.error(e.message || "Gagal update status");
        } finally {
            setLoading(false);
        }
    }

    const filtered = filterStatus === "ALL"
        ? bookings
        : bookings.filter((b) => b.status === filterStatus);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Booking / Jadwal</h2>
                    <p className="text-muted-foreground">Kelola booking dan penugasan staff</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={async () => { await fetchBookings(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={() => setShowDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Buat Booking
                    </Button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {["ALL", ...Object.keys(STATUS_LABELS)].map((s) => (
                    <Button
                        key={s}
                        size="sm"
                        variant={filterStatus === s ? "default" : "outline"}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === "ALL" ? "Semua" : STATUS_LABELS[s as BookingStatus]}
                    </Button>
                ))}
            </div>

            {/* Booking list */}
            <div className="space-y-3">
                {filtered.map((booking) => (
                    <div
                        key={booking.id}
                        className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => { setSelectedBooking(booking); setShowStatusDialog(true); }}
                    >
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="font-bold">{booking.customerName}</p>
                                <Badge variant="outline" className={`text-xs ${STATUS_STYLES[booking.status]}`}>
                                    {STATUS_LABELS[booking.status]}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
                            {booking.staff && (
                                <p className="text-xs text-blue-700">👤 {booking.staff.name}</p>
                            )}
                            {booking.notes && (
                                <p className="text-xs text-orange-700">📝 {booking.notes}</p>
                            )}
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-medium flex items-center justify-end gap-1">
                                <CalendarCheck className="h-4 w-4" />
                                {format(new Date(booking.date), "dd MMM yyyy", { locale: id })}
                            </p>
                            <p className="text-muted-foreground flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(booking.startTime), "HH:mm")}
                                {booking.duration && ` (${booking.duration} mnt)`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{booking.bookingNo}</p>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Tidak ada booking ditemukan.</p>
                    </div>
                )}
            </div>

            {/* Create Booking Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Buat Booking Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="space-y-2">
                            <Label>Nama Pelanggan *</Label>
                            <Input
                                placeholder="Nama lengkap"
                                value={form.customerName}
                                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>No. Telepon</Label>
                            <Input
                                placeholder="08xx-xxxx-xxxx"
                                value={form.customerPhone}
                                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Layanan *</Label>
                            <Input
                                placeholder="Potong rambut, Facial, Workshop Roti, dll"
                                value={form.serviceName}
                                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Staff / Teknisi</Label>
                            <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih staff (opsional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal *</Label>
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Mulai *</Label>
                                <Input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Durasi (menit)</Label>
                                <Input
                                    type="number"
                                    placeholder="60"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Biaya (Rp)</Label>
                                <Input
                                    type="number"
                                    placeholder="150000"
                                    value={form.totalAmount}
                                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan</Label>
                            <Input
                                placeholder="Catatan tambahan"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
                        <Button onClick={handleCreate} disabled={loading}>Buat Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Status — {selectedBooking?.bookingNo}</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">{selectedBooking.customerName} · {selectedBooking.serviceName}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.entries(STATUS_LABELS) as [BookingStatus, string][]).map(([s, label]) => (
                                    <Button
                                        key={s}
                                        variant={selectedBooking.status === s ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleUpdateStatus(selectedBooking.id, s)}
                                        disabled={loading}
                                        className={selectedBooking.status === s ? "" : STATUS_STYLES[s]}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
