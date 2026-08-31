import React, { useState, useEffect } from "react";
import { SharedItem } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface SharingViewProps {
  userId: string;
}

export const SharingView: React.FC<SharingViewProps> = ({ userId }) => {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    const items = await dbService.getSharedItemsByUserId(userId);
    setItems(items);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [userId]);

  const handleTogglePublic = async (item: SharedItem) => {
    const updated = { ...item, isPublic: !item.isPublic };
    await dbService.saveSharedItem(updated);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteSharedItem(id);
    loadItems();
  };

  const handleCopyLink = (item: SharedItem) => {
    const url = `${window.location.origin}?share=${item.shareToken}`;
    navigator.clipboard.writeText(url);
    alert("Havola nusxalandi!");
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Sharing"
          title="🔗 Ulashish"
          description="Chatlar, fayllar, loyihalar va agentlarni ulashing"
        />

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔗"
            title="Ulashilgan narsalar yo'q"
            description="Chat, fayl, loyiha yoki agentni ulashing — havola orqali boshqalar ko'rishi mumkin."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge color="purple">{item.type}</Badge>
                      <Badge color={item.isPublic ? "green" : "slate"}>
                        {item.isPublic ? "Ommaviy" : "Shaxsiy"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyLink(item)}
                    >
                      🔗 Havola
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTogglePublic(item)}
                    >
                      {item.isPublic ? "Shaxsiy qilish" : "Ommaviy qilish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑
                    </Button>
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
