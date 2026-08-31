import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import MarkdownRenderer from "./MarkdownRenderer";

interface MultiAgentsProps {
  onOpenApiKeyModal: () => void;
}

interface AgentItem {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "idle" | "working" | "done";
  output?: string;
}

const DEFAULT_SWARM: AgentItem[] = [
  {
    id: "supervisor",
    name: "Supervisor AI",
    role: "Vazifani tahlil qilish va topshiriqlarni taqsimlash",
    icon: "👑",
    status: "idle",
  },
  {
    id: "researcher",
    name: "Research Agent",
    role: "Ma'lumotlar va texnologiyalar tahlili",
    icon: "🔬",
    status: "idle",
  },
  {
    id: "designer",
    name: "Design & UX Agent",
    role: "Foydalanuvchi interfeysi va tuzilmasini loyihalash",
    icon: "🎨",
    status: "idle",
  },
  {
    id: "coder",
    name: "Coding Agent",
    role: "Dasturiy kod va arxitekturani qurish",
    icon: "💻",
    status: "idle",
  },
  {
    id: "security",
    name: "Security & QA Agent",
    role: "Xavfsizlik va barqarorlikni sinovdan o'tkazish",
    icon: "🔐",
    status: "idle",
  },
];

export const MultiAgentsView: React.FC<MultiAgentsProps> = ({
  onOpenApiKeyModal,
}) => {
  const [task, setTask] = useState("");
  const [agents, setAgents] = useState<AgentItem[]>(DEFAULT_SWARM);
  const [isRunning, setIsRunning] = useState(false);
  const [finalReport, setFinalReport] = useState<string>("");

  const handleRunSwarm = async () => {
    if (!task.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setIsRunning(true);
    setFinalReport("");

    // Step-by-step sequential execution across the swarm
    for (let i = 0; i < agents.length; i++) {
      setAgents((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: "working" } : a)),
      );

      try {
        const agent = agents[i];
        const prompt = `Sen "${agent.name}" (${agent.role}) vazifasisan.
Loyiha vazifasi: "${task}"

O'z sohang bo'yicha aniq, professional tahlil va topshiriq natijasini qisqa va faktik tarzda taqdim et.`;

        const res = await askGemini({
          parts: [{ text: prompt }],
          temperature: 0.4,
          maxOutputTokens: 2048,
        });

        setAgents((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, status: "done", output: res } : a,
          ),
        );
      } catch (e: any) {
        setAgents((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? { ...a, status: "done", output: `Xato: ${e.message}` }
              : a,
          ),
        );
      }
    }

    try {
      const summaryPrompt = `Multi-Agent jamoasi quyidagi vazifani yakunladi: "${task}".
Har bir agent natijasi asosida yakuniy integratsiyalashgan to'liq xulosani Markdown formatida tayyorla.`;
      const summary = await askGemini({ parts: [{ text: summaryPrompt }] });
      setFinalReport(summary);
    } catch {
      /* ignore */
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">
            🤖
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI Multi-Agent Swarm
            </h2>
            <p className="text-xs text-slate-400">
              Hamkorlikda ishlovchi ixtisoslashgan AI jamoasi
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Input & Swarm Workflow */}
        <div className="w-80 border-r border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Jamoaga Beriladigan Katta Vazifa:
            </label>
            <textarea
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Masalan: Yangi e-commerce ilovasi uchun arxitektura, dizayn va xavfsizlik auditini tayyorlang..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleRunSwarm}
              disabled={isRunning || !task.trim()}
              className="w-full mt-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {isRunning
                ? "Agentlar Ishlamoqda..."
                : "🚀 Swarmni Ishga Tushirish"}
            </button>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Jamoa A'zolari ({agents.length})
            </span>
            {agents.map((ag) => (
              <div
                key={ag.id}
                className={`p-2.5 rounded-xl border text-xs transition ${
                  ag.status === "working"
                    ? "bg-purple-950/60 border-purple-500 shadow-md shadow-purple-500/10"
                    : ag.status === "done"
                      ? "bg-slate-900/80 border-emerald-500/40"
                      : "bg-slate-950/40 border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{ag.icon}</span>
                    <span className="font-bold text-slate-200">{ag.name}</span>
                  </div>
                  <span className="text-[10px] font-mono">
                    {ag.status === "working"
                      ? "⚡ ISHLAMOQDA"
                      : ag.status === "done"
                        ? "✓ TAYYOR"
                        : "KUTILMOQDA"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{ag.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Output Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80">
          {finalReport ? (
            <div className="max-w-4xl mx-auto bg-slate-900/70 border border-white/10 rounded-2xl p-6 shadow-xl">
              <MarkdownRenderer content={finalReport} />
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {agents
                .filter((a) => a.output)
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span>{a.icon}</span>
                      <h4 className="font-bold text-xs text-purple-300">
                        {a.name} Xulosasi:
                      </h4>
                    </div>
                    <MarkdownRenderer content={a.output || ""} />
                  </div>
                ))}
              {!agents.some((a) => a.output) && (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
                  <span className="text-4xl mb-2">🤖</span>
                  <p className="text-xs">
                    Vazifani kiriting va agentlar navbati bilan o'z vazifasini
                    bajaradi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
