import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import MarkdownRenderer from "./MarkdownRenderer";

interface DebuggerProps {
  onOpenApiKeyModal: () => void;
}

export const DebuggerView: React.FC<DebuggerProps> = ({
  onOpenApiKeyModal,
}) => {
  const [errorInput, setErrorInput] = useState("");
  const [codeContext, setCodeContext] = useState("");
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<string>("");

  const handleDebug = async () => {
    if (!errorInput.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setIsDebugging(true);
    setDebugResult("");

    try {
      const prompt = `Sen professional Senior AI Debugger va Software Architectsan.

Xatolik (Error log / Traceback):
\`\`\`
${errorInput}
\`\`\`

Tegishli kod (agar berilgan bo'lsa):
\`\`\`
${codeContext || "Kod konteksti kiritilmagan"}
\`\`\`

Quyidagi tuzilmada aniq va tushunarli tahliliy yechim ber:
## 🐛 1. Xatolikning Asosiy Sababi (Root Cause)
## 🔍 2. Nima Uchun Bu Yuz Berdi?
## 🛠 3. Tayyor Tuzatilgan Kod (Fixed Code Patch)
## 💡 4. Kelgusida Oldini Olish Bo'yicha Maslahatlar`;

      const res = await askGemini({
        parts: [{ text: prompt }],
        temperature: 0.2,
      });

      setDebugResult(res);
    } catch (err: any) {
      setDebugResult(
        `⚠️ Debugging xatosi: ${err?.message || "Tahlil qilib bo'lmadi"}`,
      );
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-lg shadow-lg shadow-rose-500/20">
            🐛
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI AI Debugger
            </h2>
            <p className="text-xs text-slate-400">
              Xatoliklarni ildizidan aniqlash va tuzatish
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Panel */}
        <div className="w-1/2 border-r border-white/10 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-900/40">
          <div>
            <label className="text-xs font-bold text-rose-300 block mb-1">
              Xatolik Matni (Error / Traceback):
            </label>
            <textarea
              rows={6}
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder="Masalan: TypeError: Cannot read properties of undefined (reading 'map') yoki ModuleNotFoundError..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 font-mono text-xs text-rose-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Xatoga aloqador kod (ixtiyoriy):
            </label>
            <textarea
              rows={8}
              value={codeContext}
              onChange={(e) => setCodeContext(e.target.value)}
              placeholder="Funksiya yoki fayl kodini bu yerga joylang..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleDebug}
            disabled={isDebugging || !errorInput.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
          >
            {isDebugging
              ? "Xatolik Tahlil Qilinmoqda..."
              : "🔍 Xatolikni Tahlil Qilish & Tuzatish"}
          </button>
        </div>

        {/* Result Panel */}
        <div className="w-1/2 p-6 overflow-y-auto bg-slate-950/80">
          {debugResult ? (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
              <MarkdownRenderer content={debugResult} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <span className="text-4xl mb-3">🛠</span>
              <h3 className="font-bold text-slate-300 text-sm">
                Debugger Kutilmoqda
              </h3>
              <p className="text-xs max-w-sm mt-1">
                Dasturingizdagi xatolikni kiriting, SuperAI uni soniyalarda
                tahlil qilib to'g'ri patch taqdim etadi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
