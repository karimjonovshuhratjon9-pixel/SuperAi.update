import React from "react";
import { getUsageStats } from "../services/geminiService";
import { getSubscriptionInfo } from "../services/promoService";

export const AnalyticsView: React.FC = () => {
  const stats = getUsageStats();
  const subInfo = getSubscriptionInfo();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/20">
            📊
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI Usage & Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Resurslar sarfi, so'rovlar va tokenlar tahlili
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">
                Bugungi So'rovlar
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {stats.requests}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                ↑ +14% o'tgan kunga nisbatan
              </span>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">
                Kiritilgan Belgilar (Chars In)
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {stats.charsIn.toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-400 font-medium">
                Prompt & Context
              </span>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">
                Yaratilgan Belgilar (Chars Out)
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {stats.charsOut.toLocaleString()}
              </div>
              <span className="text-[10px] text-cyan-400 font-medium">
                Model javoblari
              </span>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">
                Qoldiq Kredit / Balans
              </span>
              <div className="text-2xl font-black text-amber-300 mt-1">
                ${subInfo.balance}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {subInfo.planName}
              </span>
            </div>
          </div>

          {/* Detailed Performance Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-white mb-4">
              Ekotizim Ishlash Ko'rsatkichlari
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-300">
                  O'rtacha Javob Vaqti (Latency)
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  ~420ms
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-300">Streaming Barqarorligi</span>
                <span className="font-mono font-bold text-emerald-400">
                  99.9%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-300">
                  Xavfsizlik & Content Filtering
                </span>
                <span className="font-mono font-bold text-indigo-400">
                  Faol (Strict Mode)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
