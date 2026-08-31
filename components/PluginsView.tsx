import React, { useState, useEffect } from "react";
import { Plugin } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface PluginsViewProps {
  userId: string;
}

const DEFAULT_PLUGINS: Plugin[] = [
  {
    id: "p1",
    name: "Web Search",
    description: "Internetdan real vaqt ma'lumotlarini qidiradi",
    icon: "🔍",
    version: "1.0.0",
    author: "SuperAI",
    permissions: ["search"],
    tools: ["web_search"],
    isInstalled: true,
    rating: 4.8,
    installs: 5000,
    createdAt: Date.now(),
  },
  {
    id: "p2",
    name: "Telegram Bot",
    description: "Telegram orqali xabar yuboradi",
    icon: "📨",
    version: "1.0.0",
    author: "SuperAI",
    permissions: ["send_message"],
    tools: ["send_telegram"],
    isInstalled: false,
    rating: 4.5,
    installs: 1200,
    createdAt: Date.now(),
  },
  {
    id: "p3",
    name: "Weather",
    description: "Ob-havo ma'lumotlarini oladi",
    icon: "🌤️",
    version: "1.0.0",
    author: "SuperAI",
    permissions: ["weather"],
    tools: ["get_weather"],
    isInstalled: false,
    rating: 4.6,
    installs: 800,
    createdAt: Date.now(),
  },
  {
    id: "p4",
    name: "Code Runner",
    description: "JavaScript kodini xavfsiz bajaradi",
    icon: "⚡",
    version: "1.0.0",
    author: "SuperAI",
    permissions: ["execute"],
    tools: ["execute_code"],
    isInstalled: false,
    rating: 4.7,
    installs: 2000,
    createdAt: Date.now(),
  },
  {
    id: "p5",
    name: "Email",
    description: "Email xatlarini tayyorlaydi",
    icon: "✉️",
    version: "1.0.0",
    author: "SuperAI",
    permissions: ["email"],
    tools: ["send_email"],
    isInstalled: false,
    rating: 4.4,
    installs: 600,
    createdAt: Date.now(),
  },
];

export const PluginsView: React.FC<PluginsViewProps> = () => {
  const [plugins, setPlugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const saved = await dbService.getAllPlugins();
      if (saved.length > 0) {
        setPlugins([...DEFAULT_PLUGINS, ...saved]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (plugin: Plugin) => {
    const updated = { ...plugin, isInstalled: !plugin.isInstalled };
    setPlugins((prev) => prev.map((p) => (p.id === plugin.id ? updated : p)));
    await dbService.savePlugin(updated);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Plugins"
          title="🧩 Pluginlar"
          description="SuperAI'ni kengaytiruvchi pluginlarni boshqaring"
        />

        {loading ? (
          <LoadingSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin) => (
              <Card
                key={plugin.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{plugin.icon}</div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {plugin.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        v{plugin.version} • by {plugin.author}
                      </p>
                    </div>
                  </div>
                  <Badge color={plugin.isInstalled ? "green" : "slate"}>
                    {plugin.isInstalled ? "O'rnatilgan" : "O'rnatilmagan"}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {plugin.description}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {plugin.permissions.map((perm) => (
                    <Badge key={perm} color="blue">
                      {perm}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color="yellow">⭐ {plugin.rating}</Badge>
                    <Badge color="slate">{plugin.installs} installs</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant={plugin.isInstalled ? "secondary" : "primary"}
                    onClick={() => handleToggle(plugin)}
                  >
                    {plugin.isInstalled ? "O'chirish" : "O'rnatish"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
