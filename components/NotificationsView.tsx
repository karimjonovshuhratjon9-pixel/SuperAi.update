import React, { useState, useEffect } from "react";
import { Notification } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface NotificationsViewProps {
  userId: string;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  userId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const items = await dbService.getNotificationsByUserId(userId);
    setNotifications(items);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const handleMarkRead = async (id: string) => {
    await dbService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await dbService.markAllNotificationsRead(userId);
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteNotification(id);
    loadNotifications();
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "task":
        return "blue";
      case "research":
        return "purple";
      case "video":
        return "red";
      case "agent":
        return "green";
      case "automation":
        return "yellow";
      case "subscription":
        return "blue";
      case "security":
        return "red";
      default:
        return "slate";
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Notifications"
          title="🔔 Bildirishnomalar"
          description="Barcha muhim xabarlar bir joyda"
          actions={
            unreadCount > 0 ? (
              <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
                ✓ Hammasini o'qilgan deb belgilash
              </Button>
            ) : undefined
          }
        />

        {unreadCount > 0 && (
          <Badge color="blue">{unreadCount} ta o'qilmagan</Badge>
        )}

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Bildirishnomalar yo'q"
            description="AI vazifalar, tadqiqotlar, videolar va boshqa muhim hodisalar haqida sizni xabardor qiladi."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`hover:border-blue-500/30 transition ${!notif.isRead ? "border-blue-500/30 bg-blue-600/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Badge color={typeColor(notif.type) as any}>
                    {notif.type}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {notif.message}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-[10px] font-bold text-blue-400 hover:text-blue-300"
                        >
                          ✓ O'qildi
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300"
                      >
                        🗑 O'chirish
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
