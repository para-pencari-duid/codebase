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
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
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
        toast.error(data.error || "Gagal memuat notifikasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
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
        toast.success(data.message);
        fetchNotifications();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Gagal memeriksa stok");
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
      toast.error("Gagal menandai notifikasi");
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
        toast.success("Semua notifikasi ditandai sudah dibaca");
      }
    } catch (error) {
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notifikasi dihapus");
      }
    } catch (error) {
      toast.error("Gagal menghapus notifikasi");
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
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heading
            title="Notifikasi"
            description="Kelola notifikasi dan peringatan stok"
          />
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

      <Separator />

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
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Tidak ada notifikasi</h3>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "unread"
                    ? "Semua notifikasi sudah dibaca"
                    : "Belum ada notifikasi yang perlu ditampilkan"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];

                return (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notification.isRead ? "border-primary/50 bg-primary/5" : ""
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full bg-muted ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1">
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
