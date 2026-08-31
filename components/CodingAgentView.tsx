import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import CodeBlock from "./CodeBlock";

interface CodingAgentProps {
  onOpenApiKeyModal: () => void;
}

interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export const CodingAgentView: React.FC<CodingAgentProps> = ({
  onOpenApiKeyModal,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "terminal" | "tests">("editor");
  const [files, setFiles] = useState<WorkspaceFile[]>([
    {
      name: "main.js",
      path: "src/main.js",
      content: `// SuperAI Coding Agent Workspace\nfunction calculateMetrics(data) {\n  const sum = data.reduce((a, b) => a + b, 0);\n  const avg = sum / (data.length || 1);\n  return { sum, avg };\n}\n\nconsole.log("Natija:", calculateMetrics([10, 25, 45, 80]));`,
      language: "javascript",
    },
    {
      name: "package.json",
      path: "package.json",
      content: `{\n  "name": "ai-generated-app",\n  "version": "1.0.0",\n  "main": "src/main.js"\n}`,
      language: "json",
    },
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState<string>("Agent tayyor. Vazifani yozing.");

  const currentFile = files[activeFileIndex] || files[0];

  const handleGenerateProject = async () => {
    if (!prompt.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setIsGenerating(true);
    setTerminalOutput("Agent loyiha arxitekturasini tuzmoqda va kod yozmoqda...");

    try {
      const aiPrompt = `Sen Senior Full-Stack Dasturchisan.
Vazifa: "${prompt}"

Ushbu vazifani to'liq hal qiluvchi professional loyiha fayllarini quyidagi maxsus formatda yoz:

<<<FILE path="src/index.js" language="javascript">>>
// kod...
<<<END_FILE>>>

<<<FILE path="README.md" language="markdown">>>
# Loyiha nomi...
<<<END_FILE>>>

Faqat shu formatda fayllarni qaytar.`;

      const response = await askGemini({
        parts: [{ text: aiPrompt }],
        temperature: 0.3,
        maxOutputTokens: 8192,
      });

      const fileRegex = /<<<FILE\s+path="([^"]+)"\s+language="([^"]+)">>>([\s\S]*?)<<<END_FILE>>>/g;
      const parsedFiles: WorkspaceFile[] = [];
      let match;

      while ((match = fileRegex.exec(response)) !== null) {
        const filePath = match[1];
        const lang = match[2];
        const content = match[3].trim();
        const fileName = filePath.split("/").pop() || filePath;
        parsedFiles.push({
          name: fileName,
          path: filePath,
          content,
          language: lang,
        });
      }

      if (parsedFiles.length > 0) {
        setFiles(parsedFiles);
        setActiveFileIndex(0);
        setTerminalOutput(`✓ Muvaffaqiyatli! ${parsedFiles.length} ta fayldan iborat loyiha yaratildi.`);
      } else {
        // Fallback to single file update
        setFiles((prev) => [
          {
            name: "solution.js",
            path: "src/solution.js",
            content: response,
            language: "javascript",
          },
          ...prev,
        ]);
        setTerminalOutput("✓ Kod yaratildi va muharrirga joylashtirildi.");
      }
    } catch (err: any) {
      setTerminalOutput(`⚠️ Xatolik: ${err?.message || "Loyiha yaratilmadi"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = () => {
    if (currentFile.language !== "javascript" && currentFile.language !== "js") {
      setTerminalOutput(`Faqat JavaScript fayllarini to'g'ridan-to'g'ri sandboxda ishga tushirish mumkin (${currentFile.name}).`);
      setActiveTab("terminal");
      return;
    }

    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.join(" ")),
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", currentFile.content);
      fn(customConsole);
      setTerminalOutput(`>>> Running ${currentFile.path} in Sandbox:\n` + (logs.length ? logs.join("\n") : "(Hech qanday console.log chiqmadi)"));
    } catch (e: any) {
      setTerminalOutput(`>>> Runtime Error:\n${e.message}`);
    }
    setActiveTab("terminal");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 bg-slate-900/60 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-400">
            &lt;/&gt;
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Coding Agent</h2>
            <p className="text-[11px] text-slate-400">Avtonom dasturlash va loyiha generatsiyasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <span>▶ Kodni Sinash</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left File Tree & Prompt Panel */}
        <div className="w-72 border-r border-white/10 bg-slate-900/40 p-3 flex flex-col gap-3 flex-shrink-0">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Vazifa / Talab:</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Masalan: Telegram bot uchun Webhook router va foydalanuvchi tekshiruvini yoz..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleGenerateProject}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {isGenerating ? "Agent Kod Yozmoqda..." : "🚀 Loyihani Yaratish"}
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden border-t border-white/10 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Loyiha Fayllari ({files.length})
            </span>
            <div className="flex-1 overflow-y-auto space-y-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition ${
                    activeFileIndex === idx
                      ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="truncate">📄 {file.path}</span>
                  <span className="text-[10px] font-mono uppercase opacity-60">{file.language}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Code Editor & Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Header Tabs */}
          <div className="h-10 border-b border-white/10 bg-slate-950/60 px-4 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">{currentFile.path}</span>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === "editor" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
                }`}
              >
                Muharrir
              </button>
              <button
                onClick={() => setActiveTab("terminal")}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === "terminal" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
                }`}
              >
                Terminal / Loglar
              </button>
            </div>
          </div>

          {/* Editor & Terminal Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === "editor" ? (
              <div className="h-full flex flex-col p-2 bg-[#0d1326]">
                <textarea
                  value={currentFile.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setFiles((prev) =>
                      prev.map((f, i) => (i === activeFileIndex ? { ...f, content: newContent } : f))
                    );
                  }}
                  className="w-full h-full bg-transparent font-mono text-xs text-slate-200 focus:outline-none p-3 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="h-full bg-black/90 p-4 font-mono text-xs text-emerald-400 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
