import React, { useState, useMemo, useEffect, useRef } from "react";
import JSZip from "jszip";
import {
  cancelActiveStream,
  hasApiKey,
  streamChat,
} from "../services/geminiService";

interface Tab {
  id: "html" | "css" | "js";
  label: string;
  icon: string;
  placeholder: string;
}

interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

const TABS: Tab[] = [
  {
    id: "html",
    label: "HTML",
    icon: "🟧",
    placeholder: "<h1>Salom dunyo!</h1>",
  },
  {
    id: "css",
    label: "CSS",
    icon: "🟦",
    placeholder: "h1 { color: royalblue; }",
  },
  {
    id: "js",
    label: "JS",
    icon: "🟨",
    placeholder: 'console.log("Salom!");',
  },
];

const DEFAULT_HTML = `<div class="card">
  <h1>🚀 SuperAI Playground</h1>
  <p>Kodni o'zgartiring va natijani darhol ko'ring!</p>
  <button onclick="alert('Ishlayapti! 🎉')">Bosing</button>
</div>`;
const DEFAULT_CSS = `body { font-family: sans-serif; display: flex; justify-content: center; padding-top: 3rem; background: #f0ff; }
.card { text-align: center; background: #fff; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,100,.15); }
button { background: #2563eb; color: #fff; border: none; padding: .6rem 1.4rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
button:hover { background: #1d4ed8; }`;
const DEFAULT_JS = `console.log("Playground tayyor! ✨");`;

const INITIAL_FILES: Record<string, ProjectFile> = {
  "index.html": { name: "index.html", language: "html", content: DEFAULT_HTML },
  "style.css": { name: "style.css", language: "css", content: DEFAULT_CSS },
  "script.js": { name: "script.js", language: "js", content: DEFAULT_JS },
};

const FILE_START = /<<<FILE\s+path="([^"]+)"\s+language="([^"]+)">>>/g;
const FILE_END = "<<<END_FILE>>>";
const AGENT_MAX_OUTPUT_TOKENS = 8192;
const MAX_CONTINUATIONS = 4;
const PLAYGROUND_STATE_KEY = "superai_playground_state_v1";
const CODE_SUGGESTIONS: Record<Tab["id"], string[]> = {
  html: [
    "div",
    "section",
    "header",
    "main",
    "nav",
    "button",
    "input",
    "form",
    "h1",
    "h2",
    "p",
    "ul",
    "li",
    "img",
    "script",
    "style",
  ],
  css: [
    "display",
    "position",
    "color",
    "background",
    "margin",
    "padding",
    "width",
    "height",
    "font-size",
    "font-family",
    "border",
    "border-radius",
    "box-shadow",
    "grid-template-columns",
    "justify-content",
    "align-items",
    "transition",
  ],
  js: [
    "const",
    "let",
    "function",
    "return",
    "document",
    "querySelector",
    "addEventListener",
    "console.log",
    "setTimeout",
    "async",
    "await",
    "if",
    "else",
    "forEach",
  ],
};

const loadPlaygroundState = () => {
  try {
    const saved = sessionStorage.getItem(PLAYGROUND_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const formatCode = (source: string, language: Tab["id"]): string => {
  if (language === "html") return source.trim();

  const normalized = source
    .replace(/\r\n/g, "\n")
    .replace(/\s*([{}])\s*/g, "$1")
    .replace(/;\s*/g, ";\n")
    .replace(/}\s*/g, "}\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let indent = 0;
  return normalized
    .map((line) => {
      if (line.startsWith("}")) indent = Math.max(0, indent - 1);
      const formatted = `${"  ".repeat(indent)}${line}`;
      if (line.endsWith("{")) indent += 1;
      return formatted;
    })
    .join("\n");
};

const PlaygroundView: React.FC = () => {
  const savedState = useRef<any>(loadPlaygroundState());
  const [html, setHtml] = useState(
    () => savedState.current?.html || DEFAULT_HTML,
  );
  const [css, setCss] = useState(() => savedState.current?.css || DEFAULT_CSS);
  const [js, setJs] = useState(() => savedState.current?.js || DEFAULT_JS);
  const [activeTab, setActiveTab] = useState<Tab["id"]>(
    () => savedState.current?.activeTab || "html",
  );
  const [autoRun, setAutoRun] = useState(
    () => savedState.current?.autoRun ?? true,
  );
  const [runKey, setRunKey] = useState(0);
  const [projectFiles, setProjectFiles] = useState<Record<string, ProjectFile>>(
    () => savedState.current?.projectFiles || {},
  );
  const [activeProjectFile, setActiveProjectFile] = useState<string | null>(
    () => savedState.current?.activeProjectFile || null,
  );
  const [agentPrompt, setAgentPrompt] = useState(
    () => savedState.current?.agentPrompt || "",
  );
  const [agentMode, setAgentMode] = useState<"web" | "android">(
    () => savedState.current?.agentMode || "web",
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");
  const agentStreamRef = useRef("");
  const generatedEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        PLAYGROUND_STATE_KEY,
        JSON.stringify({
          html,
          css,
          js,
          activeTab,
          autoRun,
          projectFiles,
          activeProjectFile,
          agentPrompt,
          agentMode,
        }),
      );
    } catch {
      // Storage may be unavailable or full; the editor still works in memory.
    }
  }, [
    html,
    css,
    js,
    activeTab,
    autoRun,
    projectFiles,
    activeProjectFile,
    agentPrompt,
    agentMode,
  ]);

  const values: Record<Tab["id"], string> = { html, css, js };
  const setters: Record<Tab["id"], (v: string) => void> = {
    html: setHtml,
    css: setCss,
    js: setJs,
  };

  const currentProjectFile = activeProjectFile
    ? projectFiles[activeProjectFile]
    : null;

  useEffect(() => {
    if (agentLoading && generatedEditorRef.current) {
      generatedEditorRef.current.scrollTop =
        generatedEditorRef.current.scrollHeight;
    }
  }, [agentLoading, currentProjectFile?.content]);

  const updateFilesFromStream = (streamText: string) => {
    const nextFiles: Record<string, ProjectFile> = {};
    let match: RegExpExecArray | null;
    FILE_START.lastIndex = 0;
    while ((match = FILE_START.exec(streamText)) !== null) {
      const contentStart = match.index + match[0].length;
      const endIndex = streamText.indexOf(FILE_END, contentStart);
      const content = streamText.slice(
        contentStart,
        endIndex < 0 ? streamText.length : endIndex,
      );
      const safeName = match[1].replace(/\\/g, "/").replace(/^\/+/, "");
      if (safeName && !safeName.includes("../")) {
        nextFiles[safeName] = {
          name: safeName,
          language: match[2],
          content: content.replace(/^\r?\n/, ""),
        };
      }
      if (endIndex < 0) break;
      FILE_START.lastIndex = endIndex + FILE_END.length;
    }
    if (Object.keys(nextFiles).length > 0) {
      setProjectFiles(nextFiles);
      setActiveProjectFile((current) => current || Object.keys(nextFiles)[0]);
    }
    return Object.keys(nextFiles).length;
  };

  const generateProject = async () => {
    if (!agentPrompt.trim() || agentLoading) return;
    if (!hasApiKey()) {
      setAgentError("Avval Gemini API key kiriting.");
      return;
    }
    setAgentLoading(true);
    setAgentError("");
    setProjectFiles({});
    setActiveProjectFile(null);
    agentStreamRef.current = "";
    const platformInstruction =
      agentMode === "android"
        ? "Android mini app loyihasi yarating. Kotlin + Jetpack Compose ishlating. Gradle fayllari, AndroidManifest.xml, MainActivity.kt va README.md ni qo'shing."
        : "Brauzer loyihasi yarating. index.html, style.css va script.js bilan birga kerakli alohida fayllarni ham qo'shing.";
    const generationOptions = {
      mode: "fast" as const,
      systemInstruction:
        "Siz tezkor, aniq va professional coding agent siz. Faqat so'ralgan loyihani yarating.",
      maxOutputTokens: AGENT_MAX_OUTPUT_TOKENS,
      timeoutMs: 120000,
    };
    try {
      const initialPrompt = `Siz professional software architect va developer agentsiz. ${platformInstruction}
Foydalanuvchi talabi: ${agentPrompt}
      Fayllarni quyidagi marker formatida ketma-ket yozing. Har bir faylni boshlashingiz bilan uning kodini darhol stream qiling:
      <<<FILE path="index.html" language="html">>>
      to'liq fayl kodi
      <<<END_FILE>>>
      Har bir faylni to'liq va ishlaydigan qilib yozing. Fayl nomlari xavfsiz bo'lsin, ../ yoki absolute path ishlatmang. JSON ishlatmang, markdown code fence ishlatmang.`;
      let response = await streamChat(
        initialPrompt,
        undefined,
        [],
        (chunk) => {
          agentStreamRef.current += chunk;
          updateFilesFromStream(agentStreamRef.current);
        },
        generationOptions,
      );
      let continuationCount = 0;
      while (
        continuationCount < MAX_CONTINUATIONS &&
        /<<<FILE\s+path="[^"]+"\s+language="[^"]+">>>[\s\S]*?(?:(?!<<<END_FILE>>>)[\s\S])*$/.test(
          agentStreamRef.current,
        )
      ) {
        continuationCount += 1;
        const continuationPrompt = `Oldingi javobingiz output limitida to'xtadi. Kodni o'zgartirmang va takrorlamang. Quyidagi oxirgi qismdan davom eting; ochiq faylni tugating, keyin qolgan fayllarni to'liq yozing. Faqat marker formatidan foydalaning.
${agentStreamRef.current.slice(-24000)}`;
        const continuationHistory = [
          {
            id: `playground-continuation-${continuationCount}`,
            chatId: "playground",
            role: "assistant" as const,
            content: response.slice(-24000),
            timestamp: Date.now(),
            type: "text" as const,
          },
        ];
        response = await streamChat(
          continuationPrompt,
          undefined,
          continuationHistory,
          (chunk) => {
            agentStreamRef.current += chunk;
            updateFilesFromStream(agentStreamRef.current);
          },
          generationOptions,
        );
      }

      const fileCount = updateFilesFromStream(agentStreamRef.current);
      if (fileCount === 0) {
        throw new Error(
          "Agent fayl markerlarini qaytarmadi. Talabni aniqroq yozing yoki qayta urinib ko'ring.",
        );
      }
    } catch (error: any) {
      setAgentError(error?.message || "Agent loyiha yarata olmadi.");
    } finally {
      setAgentLoading(false);
    }
  };

  const exportProjectZip = async () => {
    const zip = new JSZip();
    const files =
      Object.keys(projectFiles).length > 0 ? projectFiles : INITIAL_FILES;
    Object.values(files).forEach((file) => zip.file(file.name, file.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      agentMode === "android"
        ? "superai-android-project.zip"
        : "superai-project.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Auto-run: kod o'zgarganda debounce bilan qayta ishga tushirish
  useEffect(() => {
    if (!autoRun) return;
    const t = setTimeout(() => setRunKey((k) => k + 1), 800);
    return () => clearTimeout(t);
  }, [html, css, js, autoRun]);

  const previewUrl = useMemo(() => {
    const generatedHtml = projectFiles["index.html"]?.content;
    const generatedCss = projectFiles["style.css"]?.content || css;
    const generatedJs = projectFiles["script.js"]?.content || js;
    const hasFullDocument = Boolean(
      generatedHtml && /<html[\s>]/i.test(generatedHtml),
    );
    const baseDocument = hasFullDocument
      ? generatedHtml
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${generatedCss}</style></head><body>
${generatedHtml || html}
<script>
  var out = null;
  var origLog = console.log;
  console.log = function(){
    if(!out){ out = document.createElement('pre');
      out.style.cssText='position:fixed;bottom:0;left:0;right:0;max-height:35%;overflow:auto;background:#0f172a;color:#7dd3fc;font-size:12px;padding:8px;margin:0;z-index:9999;border-top:2px solid #2563eb';
      document.body.appendChild(out); }
    out.textContent += [].slice.call(arguments).map(String).join(' ') + '\\n';
    origLog.apply(console, arguments);
  };
  window.onerror = function(m){ console.log('❌ XATO: ' + m); };
  try { ${generatedJs.replace(/<\/script/gi, "<\\/script")} } catch(e) { console.log('❌ XATO: ' + e.message); }
<\/script></body></html>`;
    const doc = hasFullDocument
      ? baseDocument
          ?.replace(/<\/head>/i, `<style>${generatedCss}</style></head>`)
          .replace(
            /<\/body>/i,
            `<script>${generatedJs.replace(/<\/script/gi, "<\\/script")}<\/script></body>`,
          )
      : baseDocument;
    return URL.createObjectURL(
      new Blob([doc], { type: "text/html;charset=utf-8" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, projectFiles]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const activeTabObj = TABS.find((t) => t.id === activeTab)!;
  const lineNumbers = values[activeTab]
    .split("\n")
    .map((_, index) => index + 1);

  const formatActiveCode = () => {
    setters[activeTab](formatCode(values[activeTab], activeTab));
  };

  const updateSuggestions = (value: string, cursor: number) => {
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/[\w-]+$/);
    const query = match?.[0].toLowerCase() || "";
    if (!query) {
      setSuggestions([]);
      return;
    }
    const nextSuggestions = CODE_SUGGESTIONS[activeTab]
      .filter((item) => item.toLowerCase().startsWith(query) && item !== query)
      .slice(0, 7);
    setSuggestions(nextSuggestions);
    setSelectedSuggestion(0);
  };

  const acceptSuggestion = (
    suggestion: string,
    target: HTMLTextAreaElement,
  ) => {
    const value = values[activeTab];
    const beforeCursor = value.slice(0, target.selectionStart);
    const match = beforeCursor.match(/[\w-]+$/);
    const start = match
      ? target.selectionStart - match[0].length
      : target.selectionStart;
    const suffix = activeTab === "html" ? "></" + suggestion + ">" : "";
    const nextValue = `${value.slice(0, start)}${suggestion}${suffix}${value.slice(target.selectionEnd)}`;
    setters[activeTab](nextValue);
    setSuggestions([]);
    requestAnimationFrame(() => {
      const nextCursor = start + suggestion.length;
      target.selectionStart = nextCursor;
      target.selectionEnd = nextCursor;
      target.focus();
    });
  };

  const handleEditorKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      suggestions.length > 0 &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      setSelectedSuggestion((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % suggestions.length
          : (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (
      suggestions.length > 0 &&
      (event.key === "Tab" || event.key === "Enter")
    ) {
      event.preventDefault();
      acceptSuggestion(suggestions[selectedSuggestion], event.currentTarget);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = `${values[activeTab].slice(0, start)}  ${values[activeTab].slice(end)}`;
      setters[activeTab](nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = start + 2;
        target.selectionEnd = start + 2;
      });
      return;
    }

    const pairs: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")",
      '"': '"',
      "'": "'",
      "`": "`",
    };
    if (pairs[event.key]) {
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      event.preventDefault();
      const nextValue = `${values[activeTab].slice(0, start)}${event.key}${pairs[event.key]}${values[activeTab].slice(end)}`;
      setters[activeTab](nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = start + 1;
        target.selectionEnd = start + 1;
      });
      return;
    }

    if (event.key !== "Enter") return;
    const target = event.currentTarget;
    const lineStart =
      values[activeTab].lastIndexOf("\n", target.selectionStart - 1) + 1;
    const currentLine = values[activeTab].slice(
      lineStart,
      target.selectionStart,
    );
    const currentIndent = currentLine.match(/^\s*/)?.[0] || "";
    const extraIndent = /[{([]\s*$/.test(currentLine) ? "  " : "";
    if (currentIndent || extraIndent) {
      event.preventDefault();
      const start = target.selectionStart;
      const nextValue = `${values[activeTab].slice(0, start)}\n${currentIndent}${extraIndent}${values[activeTab].slice(start)}`;
      setters[activeTab](nextValue);
      requestAnimationFrame(() => {
        target.selectionStart =
          start + 1 + currentIndent.length + extraIndent.length;
        target.selectionEnd = target.selectionStart;
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200">
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-blue-400 text-sm font-black">SuperAI</span>
        <span className="text-slate-600">/</span>
        <span className="text-xs text-slate-400">playground</span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRun}
            onChange={(e) => setAutoRun(e.target.checked)}
            className="accent-blue-500"
          />
          Auto Run
        </label>
        <button
          onClick={() => setRunKey((k) => k + 1)}
          className="px-3 py-1.5 text-xs font-black rounded-md bg-[#238636] text-white hover:bg-[#2ea043] transition"
        >
          ▶ Run
        </button>
        <button
          onClick={() => window.open(previewUrl, "_blank")}
          className="hidden sm:block px-3 py-1.5 text-xs font-bold rounded-md bg-[#21262d] text-slate-300 border border-[#30363d] hover:bg-[#30363d] transition"
        >
          ↗ Open Preview
        </button>
      </div>

      <div className="shrink-0 px-4 py-3 bg-[#10161f] border-b border-[#30363d]">
        <div className="flex flex-col lg:flex-row gap-2">
          <select
            value={agentMode}
            onChange={(event) =>
              setAgentMode(event.target.value as "web" | "android")
            }
            className="lg:w-44 px-3 py-2 rounded-md bg-[#21262d] border border-[#30363d] text-xs text-slate-200 outline-none"
            aria-label="AI loyiha turi"
          >
            <option value="web">🌐 Web app</option>
            <option value="android">📱 Android mini app</option>
          </select>
          <input
            value={agentPrompt}
            onChange={(event) => setAgentPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey))
                generateProject();
            }}
            placeholder="AI agentga loyiha topshirig'ini yozing: masalan, xarajatlar tracker app yarating"
            className="flex-1 min-w-0 px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
            aria-label="AI loyiha topshirig'i"
          />
          <button
            type="button"
            onClick={generateProject}
            disabled={agentLoading || !agentPrompt.trim()}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-[#21262d] disabled:text-slate-600 text-white text-xs font-black transition"
          >
            {agentLoading ? "⏳ Yaratilmoqda..." : "✦ AI bilan yaratish"}
          </button>
          {agentLoading && (
            <button
              type="button"
              onClick={() => {
                cancelActiveStream();
                setAgentLoading(false);
              }}
              className="px-3 py-2 rounded-md bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-bold hover:bg-red-900/70 transition"
              aria-label="AI agentni to'xtatish"
            >
              ■ Stop
            </button>
          )}
          <button
            type="button"
            onClick={exportProjectZip}
            className="px-3 py-2 rounded-md bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-slate-300 text-xs font-bold transition"
            title="Barcha loyiha fayllarini ZIP qilib yuklab olish"
          >
            ↓ ZIP
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 gap-3">
          <span className="text-[10px] text-slate-500">
            {agentMode === "android"
              ? "Android source project: APK build uchun Android Studio yoki CI kerak."
              : "Agent alohida fayllar, komponentlar va konfiguratsiyalar yaratadi."}
          </span>
          {agentError && (
            <span className="text-[10px] text-red-300 truncate">
              {agentError}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="hidden md:flex w-48 shrink-0 flex-col bg-[#0d1117] border-r border-[#30363d]">
          <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-black">
            Explorer
          </div>
          <div className="px-3 py-1.5 text-xs font-bold text-slate-300">
            ⌄ playground
          </div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 text-left text-xs transition ${activeTab === tab.id ? "bg-[#21262d] text-white" : "text-slate-500 hover:bg-[#161b22] hover:text-slate-300"}`}
            >
              <span
                className={
                  tab.id === "html"
                    ? "text-orange-400"
                    : tab.id === "css"
                      ? "text-blue-400"
                      : "text-yellow-300"
                }
              >
                {tab.icon}
              </span>
              {tab.label.toLowerCase()}.{tab.id === "js" ? "js" : tab.id}
            </button>
          ))}
          {Object.keys(projectFiles).length > 0 && (
            <>
              <div className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Generated files
              </div>
              {Object.values(projectFiles).map((file) => (
                <button
                  key={file.name}
                  onClick={() => setActiveProjectFile(file.name)}
                  className={`flex items-center gap-2 px-5 py-2 text-left text-xs transition ${activeProjectFile === file.name ? "bg-[#21262d] text-white" : "text-slate-500 hover:bg-[#161b22] hover:text-slate-300"}`}
                >
                  <span className="text-blue-300">
                    {file.name.endsWith(".kt")
                      ? "K"
                      : file.name.endsWith(".json")
                        ? "{}"
                        : "•"}
                  </span>
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 min-w-0 min-h-[250px] flex flex-col border-r border-[#30363d] bg-[#0d1117] overflow-hidden">
            {currentProjectFile ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs">
                  <span className="text-slate-200">
                    {currentProjectFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveProjectFile(null)}
                    className="text-slate-500 hover:text-white"
                    aria-label="Generated faylni yopish"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  ref={generatedEditorRef}
                  value={currentProjectFile.content}
                  onChange={(event) =>
                    setProjectFiles((files) => ({
                      ...files,
                      [currentProjectFile.name]: {
                        ...currentProjectFile,
                        content: event.target.value,
                      },
                    }))
                  }
                  spellCheck={false}
                  aria-label={`${currentProjectFile.name} kodi`}
                  className="flex-1 w-full bg-[#0d1117] p-4 text-[13px] font-mono text-[#c9d1d9] caret-blue-400 outline-none resize-none custom-scrollbar leading-relaxed"
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-0 bg-[#161b22] border-b border-[#30363d] shrink-0 overflow-x-auto">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-4 py-2.5 text-xs font-bold border-r border-[#30363d] transition ${
                        activeTab === t.id
                          ? "bg-[#0d1117] text-white border-t-2 border-t-blue-400"
                          : "text-slate-500 hover:text-slate-300 bg-[#161b22]"
                      }`}
                    >
                      <span
                        className={
                          t.id === "html"
                            ? "text-orange-400"
                            : t.id === "css"
                              ? "text-blue-400"
                              : "text-yellow-300"
                        }
                      >
                        {t.icon}
                      </span>{" "}
                      {t.label.toLowerCase()}.{t.id}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={formatActiveCode}
                    className="px-3 py-2 text-[10px] font-bold text-blue-300 hover:text-white transition"
                    title="CSS yoki JS kodini tartiblash"
                  >
                    ✨ Format
                  </button>
                  <button
                    onClick={() =>
                      setters[activeTab](
                        activeTab === "html"
                          ? DEFAULT_HTML
                          : activeTab === "css"
                            ? DEFAULT_CSS
                            : DEFAULT_JS,
                      )
                    }
                    className="px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-white transition"
                    title="Namunaga qaytarish"
                  >
                    ↺
                  </button>
                </div>
                <div className="relative flex-1 min-h-0 flex overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="w-12 shrink-0 py-4 pr-3 text-right bg-[#0d1117] text-[#484f58] text-[13px] font-mono leading-relaxed select-none"
                  >
                    {lineNumbers.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                  <textarea
                    value={values[activeTab]}
                    onChange={(e) => {
                      setters[activeTab](e.target.value);
                      updateSuggestions(
                        e.target.value,
                        e.target.selectionStart,
                      );
                    }}
                    onKeyDown={handleEditorKeyDown}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    spellCheck={false}
                    placeholder={activeTabObj.placeholder}
                    aria-label={`${activeTabObj.label} kodi`}
                    className="flex-1 w-full bg-[#0d1117] py-4 pr-4 text-[13px] font-mono text-[#c9d1d9] caret-blue-400 outline-none resize-none custom-scrollbar leading-relaxed"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-20 left-12 top-2 min-w-44 max-w-64 overflow-hidden rounded-md border border-[#3b4b61] bg-[#161b22] py-1 shadow-2xl">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) =>
                            acceptSuggestion(
                              suggestion,
                              event.currentTarget
                                .closest("div")
                                ?.parentElement?.querySelector(
                                  "textarea",
                                ) as HTMLTextAreaElement,
                            )
                          }
                          className={`block w-full px-3 py-1.5 text-left font-mono text-xs ${index === selectedSuggestion ? "bg-blue-600/40 text-white" : "text-slate-300 hover:bg-[#21262d]"}`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-t border-[#30363d] text-[10px] text-slate-500">
                  <span>
                    Ln {lineNumbers.length}, Col{" "}
                    {values[activeTab].split("\n").at(-1)?.length || 1}
                  </span>
                  <span>UTF-8 &nbsp; {activeTabObj.label}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 min-h-[250px] rounded-none border-l border-[#30363d] overflow-hidden flex flex-col bg-white">
            <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] text-xs">
              <span className="text-slate-400">◉ Preview</span>
              <span className="text-emerald-400">● Live</span>
            </div>
            <iframe
              title="playground-preview"
              key={previewUrl}
              src={previewUrl}
              sandbox="allow-scripts allow-modals allow-popups"
              className="flex-1 w-full"
            />
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-between px-3 py-1 bg-[#238636] text-[10px] text-white/90">
        <span>✓ Ready</span>
        <span>
          SuperAI Playground &nbsp; • &nbsp;{" "}
          {autoRun ? "Auto Run" : "Manual Run"}
        </span>
      </div>
    </div>
  );
};

export default PlaygroundView;
