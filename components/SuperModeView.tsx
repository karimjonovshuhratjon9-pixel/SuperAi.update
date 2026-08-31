import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import MarkdownRenderer from "./MarkdownRenderer";

interface SuperModeProps {
  onOpenApiKeyModal: () => void;
}

interface SuperStage {
  title: string;
  icon: string;
  status: "pending" | "running" | "completed";
  output?: string;
}

const DEFAULT_STAGES: SuperStage[] = [
  {
    title: "1. Strategik Rejalashtirish (Planning)",
    icon: "🧠",
    status: "pending",
  },
  { title: "2. Chuqur Bozor & Texnik Tadqiqot", icon: "🔎", status: "pending" },
  { title: "3. Arxitektura & UI/UX Loyihalash", icon: "🎨", status: "pending" },
  { title: "4. Dasturiy Kod & Implementatsiya", icon: "💻", status: "pending" },
  { title: "5. Xavfsizlik & QA Audit", icon: "🔐", status: "pending" },
  {
    title: "6. Ishga Tushirish & Optimizatsiya",
    icon: "🚀",
    status: "pending",
  },
];

export const SuperModeView: React.FC<SuperModeProps> = ({
  onOpenApiKeyModal,
}) => {
  const [goal, setGoal] = useState("");
  const [stages, setStages] = useState<SuperStage[]>(DEFAULT_STAGES);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const handleStartSuperMode = async () => {
    if (!goal.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setIsRunning(true);
    setStages(DEFAULT_STAGES);

    for (let i = 0; i < DEFAULT_STAGES.length; i++) {
      setCurrentStepIdx(i);
      setStages((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
      );

      try {
        const stage = DEFAULT_STAGES[i];
        const prompt = `Sen SuperAI Super Mode Master Arxitekturasisan.
Foydalanuvchi maqsadi: "${goal}"
Hozirgi bosqich: "${stage.title}"

Ushbu bosqich bo'yicha eng yuqori sifatli, professional va amaliy natijani to'liq ishlab chiq (Markdown formatida).`;

        const res = await askGemini({
          parts: [{ text: prompt }],
          temperature: 0.4,
          maxOutputTokens: 3000,
        });

        setStages((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "completed", output: res } : s,
          ),
        );
      } catch (err: any) {
        setStages((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "completed", output: `Xato: ${err.message}` }
              : s,
          ),
        );
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      {/* Top Banner */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">
                Super Mode Autonomous Pipeline
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md">
                VIP AUTONOMOUS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rejadan to to'liq yakuniy loyihagacha avtomatik generatsiya
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Input & Steps */}
        <div className="w-80 border-r border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Loyiha Maqsadi:
            </label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Masalan: Professional AI ta'lim platformasi uchun to'liq ekotizim yarat..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleStartSuperMode}
              disabled={isRunning || !goal.trim()}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isRunning
                ? "Super Mode Ishlamoqda..."
                : "⚡ Super Mode Boshlash"}
            </button>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Avtonom Bosqichlar
            </span>
            {stages.map((st, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs transition ${
                  st.status === "running"
                    ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                    : st.status === "completed"
                      ? "bg-slate-900/80 border-emerald-500/40 text-slate-200"
                      : "bg-slate-950/40 border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{st.icon}</span>
                    <span className="font-semibold text-slate-200">
                      {st.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono">
                    {st.status === "running"
                      ? "⚡"
                      : st.status === "completed"
                        ? "✓"
                        : "○"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Output Stage Results */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80">
          <div className="max-w-4xl mx-auto space-y-4">
            {stages
              .filter((s) => s.output)
              .map((s, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
                    <span>{s.icon}</span>
                    <h3 className="font-bold text-sm text-amber-300">
                      {s.title}
                    </h3>
                  </div>
                  <MarkdownRenderer content={s.output || ""} />
                </div>
              ))}
            {!stages.some((s) => s.output) && (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                <span className="text-4xl mb-2">⚡</span>
                <p className="text-xs">
                  Maqsadni kiriting va Super Mode barcha 6 bosqichni avtomatik
                  yakunlaydi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
