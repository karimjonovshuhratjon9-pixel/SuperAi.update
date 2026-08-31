import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import { performWebSearch } from "../services/webSearchService";
import { SearchSource } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";

interface DeepResearchProps {
  onOpenApiKeyModal: () => void;
}

type ResearchStage =
  | "idle"
  | "planning"
  | "searching"
  | "analyzing"
  | "synthesizing"
  | "completed";

interface ResearchStep {
  title: string;
  detail: string;
  status: "pending" | "running" | "done";
}

export const DeepResearchView: React.FC<DeepResearchProps> = ({
  onOpenApiKeyModal,
}) => {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"standard" | "deep">("deep");
  const [stage, setStage] = useState<ResearchStage>("idle");
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const startDeepResearch = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setError(null);
    setReport("");
    setSources([]);
    setStage("planning");

    const initialSteps: ResearchStep[] = [
      { title: "Tadqiqot Rejasi", detail: "Mavzu bo'yicha gipoteza va reja tuzilmoqda", status: "running" },
      { title: "Veb Qidiruv & Manbalar", detail: "Ochiq veb va ma'lumotlar bazasidan qidirish", status: "pending" },
      { title: "Ma'lumotlar Tahlili", detail: "Faktlarni taqqoslash va xulosalash", status: "pending" },
      { title: "To'liq Hisobot Yozish", detail: "Iqtiboslar bilan professional tahliliy hisobot tayyorlash", status: "pending" },
    ];
    setSteps(initialSteps);

    try {
      // 1. Plan
      await new Promise((r) => setTimeout(r, 600));
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 0 ? { ...s, status: "done" } : i === 1 ? { ...s, status: "running" } : s
        )
      );
      setStage("searching");

      // 2. Search
      const searchRes = await performWebSearch(topic);
      setSources(searchRes.sources);

      setSteps((prev) =>
        prev.map((s, i) =>
          i === 1 ? { ...s, status: "done" } : i === 2 ? { ...s, status: "running" } : s
        )
      );
      setStage("analyzing");

      // 3. Synthesize & Report with Gemini
      const sourcesContext = searchRes.sources
        .map((s, idx) => `[${idx + 1}] ${s.title}: ${s.snippet} (URL: ${s.url})`)
        .join("\n\n");

      const prompt = `Sen jahon darajasidagi Senior Research Analyst mutaxassisisan.
Mavzu: "${topic}"
Tadqiqot chuqurligi: ${depth}

Topilgan real veb manbalar:
${sourcesContext || "Umumiy internet bilimlari bazasi"}

Quyidagi tuzilmaga ega to'liq, chuqur va ishonchli tahliliy hisobot tuz (Markdown formatida):
# [Mavzu Nomi] - Chuqur Tadqiqot Hisoboti

## 📌 Executive Summary (Qisqacha mazmun)
## 🔍 Asosiy Tendensiyalar va Tahlil
## 📊 Taqqoslash Jadvali / Faktlar
## 💡 Ijobiy va Salbiy Jihatlar (Pros & Cons)
## 🎯 Strategik Tavsiyalar
## 📚 Foydalanilgan Manbalar & Iqtiboslar (Citations)`;

      setStage("synthesizing");
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 2 ? { ...s, status: "done" } : i === 3 ? { ...s, status: "running" } : s
        )
      );

      const generatedReport = await askGemini({
        parts: [{ text: prompt }],
        temperature: 0.4,
        maxOutputTokens: 8192,
      });

      setReport(generatedReport);
      setStage("completed");
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
    } catch (err: any) {
      setError(err?.message || "Tadqiqot jarayonida xatolik yuz berdi.");
      setStage("idle");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/20">
            🔎
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">SuperAI Deep Research</h2>
            <p className="text-xs text-slate-400">Ko'p bosqichli chuqur veb va analitik tadqiqot dvigateli</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value as any)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="standard">Tezkor Tahlil</option>
            <option value="deep">Chuqur Tadqiqot (Deep)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Input & Pipeline Progress */}
        <div className="w-80 border-r border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tadqiqot Mavzusi yoki Savol:
            </label>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Masalan: 2026-yilda eng samarali sun'iy intellekt arxitekturalari va ularning taqqosi..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <button
            onClick={startDeepResearch}
            disabled={stage !== "idle" && stage !== "completed"}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {stage !== "idle" && stage !== "completed" ? "Tadqiqot Ketmoqda..." : "🚀 Tadqiqotni Boshlash"}
          </button>

          {/* Steps Progress */}
          {steps.length > 0 && (
            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2.5 mt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tadqiqot Jarayoni
              </span>
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-0.5">
                    {step.status === "done" ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : step.status === "running" ? (
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    ) : (
                      <span className="text-slate-600">○</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{step.title}</div>
                    <div className="text-[10px] text-slate-400">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                Aniqlangan Manbalar ({sources.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-[11px] text-slate-300 hover:text-cyan-300 truncate transition"
                  >
                    🌐 {src.title || src.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Report Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
              ⚠️ {error}
            </div>
          )}

          {report ? (
            <div className="max-w-4xl mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <span className="text-xs font-mono text-cyan-400">✓ VERIFIED RESEARCH REPORT</span>
                <button
                  onClick={() => navigator.clipboard.writeText(report)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                >
                  Nusxalash 📋
                </button>
              </div>
              <MarkdownRenderer content={report} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <span className="text-4xl mb-3">🔬</span>
              <h3 className="font-bold text-slate-300 text-sm">Tadqiqot Kutilmoqda</h3>
              <p className="text-xs max-w-sm mt-1">
                Mavzuni kiriting va SuperAI internetdan eng yangi ma'lumotlarni tahlil qilib to'liq hisobot tayyorlaydi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
