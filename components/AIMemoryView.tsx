import React, { useState, useEffect } from "react";
import { MemoryItem } from "../types";
import {
  getMemories,
  saveMemoryItem,
  deleteMemoryItem,
  clearAllMemories,
  isMemoryEnabled,
  setMemoryEnabled,
} from "../services/memoryService";

interface AIMemoryViewProps {
  userId: string;
}

const MEMORY_TYPES: {
  value: MemoryItem["type"];
  label: string;
  icon: string;
}[] = [
  { value: "preference", label: "Afzalliklar", icon: "⭐" },
  { value: "fact", label: "Faktlar", icon: "📌" },
  { value: "project", label: "Loyihalar", icon: "📁" },
  { value: "long_term", label: "Uzoq muddatli", icon: "🧠" },
  { value: "conversation", label: "Suhbat", icon: "💬" },
];

export const AIMemoryView: React.FC<AIMemoryViewProps> = ({ userId }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [newType, setNewType] = useState<MemoryItem["type"]>("fact");
  const [enabled, setEnabled] = useState(isMemoryEnabled());
  const [filter, setFilter] = useState<MemoryItem["type"] | "all">("all");
  const [loading, setLoading] = useState(true);

  const loadMemories = async () => {
    setLoading(true);
    const items = await getMemories(userId);
    setMemories(items);
    setLoading(false);
  };

  useEffect(() => {
    loadMemories();
  }, [userId]);

  const handleAdd = async () => {
    if (!newMemory.trim()) return;
    await saveMemoryItem(userId, newMemory, newType, 1, "manual");
    setNewMemory("");
    loadMemories();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu xotirani o'chirishni tasdiqlaysizmi?")) {
      await deleteMemoryItem(id);
      loadMemories();
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "Barcha xotiralarni o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi!",
      )
    ) {
      await clearAllMemories(userId);
      loadMemories();
    }
  };

  const filtered =
    filter === "all" ? memories : memories.filter((m) => m.type === filter);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">
              AI Memory
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              🧠 Xotira Markazi
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              SuperAI siz haqingizda muhim ma'lumotlarni eslab qoladi va keyingi
              suhbatlarda ishlatadi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked);
                  setMemoryEnabled(e.target.checked);
                }}
                className="w-4 h-4 accent-blue-500"
              />
              Xotira yoqilgan
            </label>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-600/40 transition"
            >
              🗑 Hammasini tozalash
            </button>
          </div>
        </header>

        {/* Add new memory */}
        <div className="glass rounded-2xl p-5 border-white/10">
          <h3 className="text-sm font-black text-white mb-3">
            Yangi xotira qo'shish
          </h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Masalan: Men Python o'rganyapman"
              className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as MemoryItem["type"])}
              className="px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 outline-none"
            >
              {MEMORY_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900">
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-500 transition"
            >
              + Saqlash
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Hammasi ({memories.length})
          </button>
          {MEMORY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              {t.icon} {t.label} (
              {memories.filter((m) => m.type === t.value).length})
            </button>
          ))}
        </div>

        {/* Memory list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 border-white/10 animate-pulse"
              >
                <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center border-white/10">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-lg font-black text-white">
              Xotiralar hali yo'q
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Suhbatlashing yoki yuqoridan yangi xotira qo'shing. SuperAI muhim
              ma'lumotlarni avtomatik eslab qoladi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((memory) => (
              <div
                key={memory.id}
                className="glass rounded-2xl p-5 border-white/10 hover:border-blue-500/30 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                        {
                          MEMORY_TYPES.find((t) => t.value === memory.type)
                            ?.icon
                        }{" "}
                        {MEMORY_TYPES.find((t) => t.value === memory.type)
                          ?.label || memory.type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(memory.updatedAt).toLocaleDateString()}
                      </span>
                      {memory.source && (
                        <span className="text-[10px] text-slate-500">
                          • {memory.source}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 font-medium">
                      {memory.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition"
                    title="O'chirish"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
