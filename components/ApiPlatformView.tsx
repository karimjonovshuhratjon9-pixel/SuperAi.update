import React, { useState, useEffect } from "react";
import { APIKey } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface ApiPlatformViewProps {
  userId: string;
}

export const ApiPlatformView: React.FC<ApiPlatformViewProps> = ({ userId }) => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState("");

  const loadKeys = async () => {
    const items = await dbService.getAPIKeysByUserId(userId);
    setKeys(items);
  };

  useEffect(() => {
    loadKeys();
  }, [userId]);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    const keyPrefix = "sa_" + Math.random().toString(36).slice(2, 10);
    const keySecret =
      keyPrefix +
      "_" +
      Math.random().toString(36).slice(2, 20) +
      Math.random().toString(36).slice(2, 20);
    const apiKey: APIKey = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      name: keyName.trim(),
      keyPrefix,
      keyHash: btoa(keySecret),
      permissions: ["chat", "search"],
      usage: 0,
      createdAt: Date.now(),
      isRevoked: false,
    };
    await dbService.saveAPIKey(apiKey);
    setNewKey(keySecret);
    setKeyName("");
    loadKeys();
  };

  const handleRevoke = async (id: string) => {
    if (window.confirm("Bu API kalitini bekor qilishni tasdiqlaysizmi?")) {
      await dbService.deleteAPIKey(id);
      loadKeys();
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="API Platform"
          title="🔑 API Platformasi"
          description="SuperAI API'ga ulanish uchun kalitlar yarating"
        />

        <Card>
          <h3 className="text-sm font-black text-white mb-3">
            ➕ Yangi API kalit
          </h3>
          <div className="flex gap-2">
            <Input
              value={keyName}
              onChange={setKeyName}
              placeholder="Kalit nomi (masalan: Production)"
            />
            <Button onClick={handleCreate} disabled={!keyName.trim()}>
              Yaratish
            </Button>
          </div>
          {newKey && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30">
              <p className="text-xs font-bold text-emerald-300 mb-2">
                ✅ Yangi API kalitingiz (faqat bir marta ko'rsatiladi):
              </p>
              <code className="text-sm text-white break-all">{newKey}</code>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(newKey)}
              >
                📋 Nusxalash
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-black text-white">
            API kalitlari ({keys.length})
          </h3>
          {keys.length === 0 ? (
            <EmptyState
              icon="🔑"
              title="API kalitlari yo'q"
              description="Yuqoridagi forma orqali birinchi API kalitingizni yarating."
            />
          ) : (
            keys.map((key) => (
              <Card
                key={key.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-white">
                        {key.name}
                      </p>
                      <Badge color={key.isRevoked ? "red" : "green"}>
                        {key.isRevoked ? "Bekor qilingan" : "Faol"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {key.keyPrefix}...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      So'rovlar: {key.usage} • Yaratilgan:{" "}
                      {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition"
                  >
                    🗑
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
