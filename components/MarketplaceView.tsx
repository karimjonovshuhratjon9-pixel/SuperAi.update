import React, { useState, useEffect } from "react";
import { MarketplaceItem } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface MarketplaceViewProps {
  userId: string;
}

const DEFAULT_ITEMS: MarketplaceItem[] = [
  {
    id: "m1",
    type: "agent",
    name: "SEO Optimizer",
    description: "Kontentni SEO uchun optimallashtiradi",
    icon: "🚀",
    author: "SuperAI",
    category: "Marketing",
    rating: 4.8,
    reviews: 124,
    installs: 2300,
    isInstalled: false,
    createdAt: Date.now(),
  },
  {
    id: "m2",
    type: "plugin",
    name: "GitHub Sync",
    description: "Loyihalarni GitHub bilan sinxronlaydi",
    icon: "🐙",
    author: "SuperAI",
    category: "Developer",
    rating: 4.6,
    reviews: 89,
    installs: 1500,
    isInstalled: false,
    createdAt: Date.now(),
  },
  {
    id: "m3",
    type: "template",
    name: "Landing Page Pro",
    description: "Professional landing page shabloni",
    icon: "🎨",
    author: "SuperAI",
    category: "Design",
    rating: 4.9,
    reviews: 200,
    installs: 5000,
    isInstalled: false,
    createdAt: Date.now(),
  },
  {
    id: "m4",
    type: "workflow",
    name: "Daily News Digest",
    description: "Har kuni texnologiya yangiliklarini yig'adi",
    icon: "📰",
    author: "SuperAI",
    category: "Automation",
    rating: 4.5,
    reviews: 45,
    installs: 800,
    isInstalled: false,
    createdAt: Date.now(),
  },
  {
    id: "m5",
    type: "prompt",
    name: "Code Review Master",
    description: "Professional kod review prompti",
    icon: "💻",
    author: "SuperAI",
    category: "Developer",
    rating: 4.7,
    reviews: 67,
    installs: 1200,
    isInstalled: false,
    createdAt: Date.now(),
  },
  {
    id: "m6",
    type: "agent",
    name: "Content Writer",
    description: "Blog va maqolalar yozadi",
    icon: "✍️",
    author: "SuperAI",
    category: "Writing",
    rating: 4.4,
    reviews: 156,
    installs: 3100,
    isInstalled: false,
    createdAt: Date.now(),
  },
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = () => {
  const [items, setItems] = useState<MarketplaceItem[]>(DEFAULT_ITEMS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const saved = await dbService.getAllMarketplaceItems();
      if (saved.length > 0) {
        setItems([...DEFAULT_ITEMS, ...saved]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || item.type === category;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (item: MarketplaceItem) => {
    const updated = { ...item, isInstalled: !item.isInstalled };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await dbService.saveMarketplaceItem(updated);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Marketplace"
          title="🛍️ AI Marketplace"
          description="Agentlar, pluginlar, shablonlar va workflow'larni toping"
        />

        <div className="flex flex-col md:flex-row gap-3">
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Qidirish..."
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {["all", "agent", "plugin", "template", "workflow", "prompt"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    category === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "Hammasi" : cat}
                </button>
              ),
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="Natija topilmadi"
            description="Boshqa so'zlar bilan qidirib ko'ring."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{item.icon}</div>
                  <Badge color="purple">{item.type}</Badge>
                </div>
                <h4 className="mt-3 text-sm font-black text-white">
                  {item.name}
                </h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge color="yellow">⭐ {item.rating}</Badge>
                  <Badge color="slate">{item.reviews} reviews</Badge>
                  <Badge color="blue">{item.installs} installs</Badge>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  by {item.author}
                </p>
                <Button
                  size="sm"
                  className="w-full mt-3"
                  variant={item.isInstalled ? "secondary" : "primary"}
                  onClick={() => handleInstall(item)}
                >
                  {item.isInstalled ? "✓ O'rnatilgan" : "📥 O'rnatish"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
