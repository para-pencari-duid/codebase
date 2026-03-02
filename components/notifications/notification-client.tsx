"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingCart,
  Info,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { alertSuccess, alertError } from "@/lib/swal";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "NEW_ORDER" | "SYSTEM";
  title: string;
  message: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

const notificationIcons = {
  LOW_STOCK: AlertTriangle,
  OUT_OF_STOCK: Package,
  NEW_ORDER: ShoppingCart,
  SYSTEM: Info,
};

const notificationColors = {
  LOW_STOCK: "text-yellow-600",
  OUT_OF_STOCK: "text-red-600",
  NEW_ORDER: "text-blue-600",
  SYSTEM: "text-gray-600",
};

export default function NotificationClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab === "unread") params.set("unreadOnly", "true");
      if (activeTab === "stock") params.set("type", "LOW_STOCK");

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      } else {
        alertError(data.error || "Gagal memuat notifikasi");
      }
    } catch (error) {
      alertError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Auto-check low stock on first load, then fetch notifications
  useEffect(() => {
    const autoCheck = async () => {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkLowStock" }),
        });
      } catch {
        // Silently fail auto-check
      }
      fetchNotifications();
    };
    autoCheck();
  }, []);

  // Re-fetch when tab changes
  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const handleCheckStock = async () => {
    try {
      setCheckingStock(true);
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkLowStock" }),
      });
      const data = await response.json();

      if (response.ok) {
        alertSuccess(data.message);
        fetchNotifications();
      } else {
        alertError(data.error);
      }
    } catch (error) {
      alertError("Gagal memeriksa stok");
    } finally {
      setCheckingStock(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
        alertError("Gagal menandai notifikasi");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        alertSuccess("Semua notifikasi ditandai sudah dibaca");
      }
    } catch (error) {
      alertError("Gagal menandai notifikasi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        alertSuccess("Notifikasi dihapus");
      }
    } catch (error) {
      alertError("Gagal menghapus notifikasi");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (data.productId) {
          router.push(`/products/${data.productId}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  };

  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifikasi</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola notifikasi dan peringatan stok</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} belum dibaca</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckStock}
            disabled={checkingStock}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checkingStock ? "animate-spin" : ""}`} />
            Cek Stok Rendah
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border p-4 animate-pulse bg-white">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border bg-white flex flex-col items-center justify-center py-12" style={{ boxShadow: "0 1px 3px oklch(0 0 0 / 5%)" }}>
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Tidak ada notifikasi</h3>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === "unread"
                  ? "Semua notifikasi sudah dibaca"
                  : "Belum ada notifikasi yang perlu ditampilkan"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={`rounded-xl border bg-white cursor-pointer transition-colors hover:bg-gray-50/60 ${!notification.isRead ? "border-amber-200" : ""}`}
                    style={!notification.isRead ? { background: "oklch(0.98 0.02 80)" } : {}}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full bg-gray-100 ${colorClass} shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "oklch(0.68 0.16 55)" }} />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
