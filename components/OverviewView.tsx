import React, { useEffect, useState } from "react";
import { AppView, User } from "../types";
import { dbService } from "../services/dbService";
import { getUsageStats, hasApiKey } from "../services/geminiService";
import {
  getSubscriptionInfo,
  onSubscriptionChange,
  SubscriptionInfo,
} from "../services/promoService";
import PromoCodeModal from "./PromoCodeModal";

interface OverviewViewProps {
  user: User | null;
  setView: (view: AppView) => void;
  onOpenApiKeyModal: () => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  setView,
  onOpenApiKeyModal,
}) => {
  const [chatCount, setChatCount] = useState(0);
  const [stats, setStats] = useState(getUsageStats());
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(getSubscriptionInfo());

  useEffect(() => {
    const unsub = onSubscriptionChange(setSubInfo);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    dbService
      .getChatsByUserId(user.id)
      .then((chats) => setChatCount(chats.length));
    setStats(getUsageStats());
  }, [user]);

  const actions = [
    {
      view: AppView.HEYGEN_AVATAR,
      icon: "🎬",
      title: "AI Video Studio",
      text: "AI avatarlar va ssenariydan professional video yaratish",
      badge: "PRO 🎬",
    },
    {
      view: AppView.SUPER_MODE,
      icon: "⚡",
      title: "Super Mode (VIP)",
      text: "G'oyadan to to'liq tayyor loyihagacha avtonom generator",
      badge: "VIP ⚡",
    },
    {
      view: AppView.PLAYGROUND,
      icon: "💻",
      title: "Playground Studio",
      text: "HTML, CSS va JS jonli sandbox va AI yordamchi",
      badge: "LIVE",
    },
    {
      view: AppView.TRANSLATOR,
      icon: "🌐",
      title: "Ko'p tilli Tarjimon",
      text: "Matnni tarjima qilish va ElevenLabs da tinglash",
      badge: "AUDIO",
    },
    {
      view: AppView.VIRTUAL_FRIEND,
      icon: "👤",
      title: "Virtual Do'st",
      text: "Kamera va real-vaqt ovozli interaktiv do'st",
    },
    {
      view: AppView.CHAT,
      icon: "💬",
      title: "SuperAI Chat",
      text: "Savol bering, tahlil qiling yoki kod yozing",
    },
    {
      view: AppView.CODING_AGENT,
      icon: "👨‍💻",
      title: "AI Coding Agent",
      text: "Ko'p faylli to'liq dasturiy loyihalarni avtomatik tuzish",
      badge: "NEW",
    },
    {
      view: AppView.DEEP_RESEARCH,
      icon: "🔎",
      title: "Deep Research",
      text: "Internetdan chuqur ma'lumotlar tahlili va analitik hisobot",
      badge: "AI SEARCH",
    },
    {
      view: AppView.IMAGE_GEN,
      icon: "🎨",
      title: "Image Studio",
      text: "Matndan yuqori sifatli rasmlar generatsiyasi",
    },
    {
      view: AppView.DOCS,
      icon: "📄",
      title: "Hujjat AI (RAG)",
      text: "PDF va hujjatlarni tahlil qilish va savol-javob",
    },
  ];

  return (
    <section className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">
              SuperAI workspace
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-black text-white">
              Xush kelibsiz, {user?.name || "foydalanuvchi"}
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Bugungi ishlaringizni tezroq boshlang. Eng ko'p ishlatiladigan
              vositalar bir joyda.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPromoOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 border border-amber-400/40 text-amber-300 text-xs font-black hover:brightness-125 transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
            >
              <span>🎁 Promokod</span>
              {subInfo.isPremium ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/40">
                  ${subInfo.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/40">
                  Shuhratjon
                </span>
              )}
            </button>

            {!hasApiKey() && (
              <button
                onClick={onOpenApiKeyModal}
                className="w-fit px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-black hover:bg-amber-500/25 transition"
              >
                🔑 API key sozlash
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass rounded-2xl p-4 border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
              Bugungi so'rovlar
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {stats.requests}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
              Chatlar
            </p>
            <p className="mt-2 text-2xl font-black text-white">{chatCount}</p>
          </div>
          <div className="glass rounded-2xl p-4 border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
              Kiritilgan belgilar
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {stats.charsIn.toLocaleString()}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
              API holati
            </p>
            <p
              className={`mt-2 text-sm font-black ${hasApiKey() ? "text-emerald-300" : "text-amber-300"}`}
            >
              {hasApiKey() ? "● Tayyor" : "● Sozlanmagan"}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-white">Tezkor ishlar</h3>
            <span className="text-xs text-slate-500">
              Bir bosishda boshlang
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {actions.map((action) => (
              <button
                key={action.view}
                onClick={() => setView(action.view)}
                className="text-left glass rounded-2xl p-5 border-white/10 hover:border-purple-400/40 hover:bg-slate-800/80 transition group relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">
                    {action.icon}
                  </span>
                  {action.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {action.badge}
                    </span>
                  )}
                </div>
                <span className="block mt-3 text-sm font-black text-white group-hover:text-purple-200">
                  {action.title}
                </span>
                <span className="block mt-1 text-xs leading-relaxed text-slate-400">
                  {action.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            SuperAI ma'lumotlarni hozircha ushbu brauzerda saqlaydi.
          </p>
          <button
            onClick={() => setView(AppView.CHAT)}
            className="w-fit text-xs font-black text-blue-300 hover:text-blue-200 transition"
          >
            Chatni ochish →
          </button>
        </div>
        <PromoCodeModal
          isOpen={isPromoOpen}
          onClose={() => setIsPromoOpen(false)}
        />
      </div>
    </section>
  );
};

export default OverviewView;
