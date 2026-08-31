import React, { useState } from "react";
import { User } from "../types";
import {
  getUserMemory,
  setUserMemory,
  clearUserMemory,
} from "../services/memoryService";
import {
  getTelegramConfig,
  setTelegramConfig,
} from "../services/agentToolsService";
import { getTavilyApiKey, setTavilyApiKey } from "../services/webSearchService";

interface SettingsProps {
  user: User | null;
  onOpenApiKeyModal: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  user,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "integrations" | "memory" | "security"
  >("general");
  const [memoryText, setMemoryText] = useState(getUserMemory());

  // Integrations
  const tgConfig = getTelegramConfig();
  const [tgBotToken, setTgBotToken] = useState(tgConfig.botToken);
  const [tgChatId, setTgChatId] = useState(tgConfig.chatId);
  const [tavilyKey, setTavilyKey] = useState(getTavilyApiKey());
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const handleSaveMemory = () => {
    setUserMemory(memoryText);
    setSavedNote("Doimiy xotira muvaffaqiyatli saqlandi! ✓");
    setTimeout(() => setSavedNote(null), 3000);
  };

  const handleClearMemory = () => {
    if (confirm("Barcha saqlangan AI xotirasini tozalashni xohlaysizmi?")) {
      clearUserMemory();
      setMemoryText("");
      setSavedNote("Xotira tozalandi! ✓");
      setTimeout(() => setSavedNote(null), 3000);
    }
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramConfig(tgBotToken, tgChatId);
    setTavilyApiKey(tavilyKey);
    setSavedNote("Integratsiya sozlamalari saqlandi! ✓");
    setTimeout(() => setSavedNote(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-600 flex items-center justify-center text-lg shadow-lg">
            ⚙️
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI Sozlamalar & Integratsiyalar
            </h2>
            <p className="text-xs text-slate-400">
              Tizim parametrlari, API kalitlar va tashqi servislar
            </p>
          </div>
        </div>

        {savedNote && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
            {savedNote}
          </span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Tabs */}
        <div className="w-64 border-r border-white/10 bg-slate-900/40 p-4 space-y-1">
          {[
            { id: "general", label: "👤 Foydalanuvchi & Profil" },
            { id: "integrations", label: "🔌 Integratsiyalar & Botlar" },
            { id: "memory", label: "🧠 Doimiy Xotira (Memory)" },
            { id: "security", label: "🔐 Xavfsizlik & API Kalitlar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80">
          <div className="max-w-2xl mx-auto space-y-6">
            {activeTab === "general" && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-white">
                  Foydalanuvchi Ma'lumotlari
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Ism:</label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || "SuperAI Foydalanuvchisi"}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Email:</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || "user@superai.uz"}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <form
                onSubmit={handleSaveIntegrations}
                className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 space-y-4"
              >
                <h3 className="font-bold text-sm text-white">
                  Tashqi Xizmatlar & Botlar
                </h3>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    value={tgBotToken}
                    onChange={(e) => setTgBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWxyz"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Telegram Chat ID:
                  </label>
                  <input
                    type="text"
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    placeholder="Masalan: 12345678 yoki @kanalingiz"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Tavily AI Search API Key (ixtiyoriy):
                  </label>
                  <input
                    type="password"
                    value={tavilyKey}
                    onChange={(e) => setTavilyKey(e.target.value)}
                    placeholder="tvly-..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                >
                  Saqlash ✓
                </button>
              </form>
            )}

            {activeTab === "memory" && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-white">
                  AI Doimiy Xotirasi (Memory)
                </h3>
                <p className="text-xs text-slate-400">
                  SuperAI siz haqingizda doimiy eslab qoladigan faktlar va
                  loyiha qoidalari.
                </p>
                <textarea
                  rows={6}
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  placeholder="Masalan: Men TypeScript va Python dasturchiman. Kodlarni har doim toza va testlar bilan yoz..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMemory}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Xotirani Saqlash
                  </button>
                  <button
                    onClick={handleClearMemory}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                  >
                    Tozalash 🗑
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-white">
                  API Kalitlari & Xavfsizlik
                </h3>
                <p className="text-xs text-slate-400">
                  Gemini, ElevenLabs va HeyGen API kalitlarini xavfsiz
                  boshqaring.
                </p>
                <button
                  onClick={onOpenApiKeyModal}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20"
                >
                  🔑 API Kalitlar Modalini Ochish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
