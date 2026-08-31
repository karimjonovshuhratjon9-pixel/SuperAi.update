import React, { useState, useMemo, useEffect } from "react";

interface CodeBlockProps {
  code: string;
  lang?: string;
}

// Oddiy lekin samarali sintaksis bo'yash (tashqi kutubxonasiz)
const KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|class|extends|new|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|def|elif|print|lambda|None|True|False|self|public|private|static|void|int|string|boolean|number|interface|type|enum|switch|case|break|continue|do|null|undefined|true|false|this|super|yield|package|struct|impl|fn|use|pub|match)\b/g;

function highlight(code: string): string {
  const esc = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(
      /(&quot;|"|'|`)((?:\\.|(?!\1)[^\\])*?)\1/g,
      '<span class="text-emerald-300">$1$2$1</span>',
    )
    .replace(
      /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g,
      '<span class="text-slate-500 italic">$1</span>',
    )
    .replace(KEYWORDS, '<span class="text-fuchsia-400 font-semibold">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-amber-300">$1</span>');
}

const normLang = (l?: string) => (l || "").toLowerCase();
const isHtml = (code: string, lang: string) =>
  ["html", "xml", "svg"].includes(lang) || /<html|<!doctype html/i.test(code);
const isJs = (lang: string) => ["js", "javascript", "jsx"].includes(lang);
const isCss = (lang: string) => lang === "css";

const CodeBlock: React.FC<CodeBlockProps> = ({ code, lang = "code" }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wrap, setWrap] = useState(false);

  const language = normLang(lang);
  const highlighted = useMemo(() => highlight(code), [code]);
  const lines = useMemo(() => code.split("\n"), [code]);

  const runnable = isHtml(code, language) || isJs(language) || isCss(language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extMap: Record<string, string> = {
    javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts",
    tsx: "tsx", python: "py", py: "py", html: "html", css: "css",
    json: "json", java: "java", cpp: "cpp", c: "c", bash: "sh",
    sql: "sql", go: "go", rs: "rs", php: "php", ruby: "rb",
  };

  const handleDownload = () => {
    const ext = extMap[language] || language || "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superai-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview hujjati — Blob URL orqali yuklanadi (srcDoc escaping muammosiz ishlaydi)
  const previewUrl = useMemo(() => {
    if (!runnable) return null;
    let doc: string;
    if (isJs(language)) {
      doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:16px;margin:0}
        h3{margin:0 0 10px;color:#60a5fa;font-size:14px;text-transform:uppercase;letter-spacing:.1em}
        pre{white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.6}
        .err{color:#f87171;font-weight:bold}
      </style></head><body>
      <h3>▶ Console natijasi</h3><pre id="out"></pre>
      <script>
        var out = document.getElementById('out');
        var origLog = console.log;
        console.log = function(){ var a=[].slice.call(arguments).map(String); out.textContent += a.join(' ') + '\\n'; origLog.apply(console, arguments); };
        window.onerror = function(m){ out.innerHTML += '<span class="err">XATO: ' + m + '</span>\\n'; };
        try {
          ${code.replace(/<\/script/gi, "<\\/script")}
        } catch(e) { out.innerHTML += '<span class="err">XATO: ' + e.message + '</span>'; }
      <\/script></body></html>`;
    } else if (isCss(language)) {
      doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:sans-serif;padding:24px;background:#fff;color:#111}
        ${code}
      </style></head><body>
        <h1>Sarlavha namunasi</h1>
        <p>Bu oddiy paragraf matni. CSS kodingiz shu elementlarga qo'llanadi.</p>
        <button>Tugma</button> <a href="#">Havola</a>
        <div class="box demo card container"><p>.box / .demo / .card / .container klasslari</p></div>
        <ul><li>Ro'yxat elementi 1</li><li>Ro'yxat elementi 2</li></ul>
      </body></html>`;
    } else {
      doc = /<html|<!doctype html/i.test(code)
        ? code
        : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:16px;background:#fff}</style></head><body>${code}</body></html>`;
    }
    return URL.createObjectURL(new Blob([doc], { type: "text/html;charset=utf-8" }));
  }, [runnable, code, language]);

  // Eski Blob URL ni ozod qilish
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <>
      <div className="my-4 w-full min-w-0 max-w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0b1020] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-white/5 border-b border-white/10 flex-wrap">
          <span className="flex items-center gap-2 shrink-0 text-[11px] font-black uppercase tracking-widest text-blue-300">
            <span className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </span>
            {language} · {lines.length} qator
          </span>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {runnable && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/40 transition"
                title="Kodni ishga tushirish"
              >
                ▶ Run
              </button>
            )}
            <button
              onClick={() => setWrap((w) => !w)}
              className={`hidden sm:flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                wrap
                  ? "bg-blue-600/30 text-blue-200 border-blue-500/40"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/15"
              }`}
              title="Qatorlarni buklash"
            >
              ⏎ Wrap
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/15 hover:text-white transition"
              title="Faylni yuklab olish"
            >
              ⬇ Download
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                copied
                  ? "bg-green-600/30 text-green-200 border-green-500/40"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/15 hover:text-white"
              }`}
              title="Nusxa olish"
            >
              {copied ? "✓ OK!" : "📋 Copy"}
            </button>
          </div>
        </div>
        {/* Kod — gorizontal scroll, konteynerdan hech qachon chiqmaydi */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <pre
            className={`p-4 text-[13px] leading-relaxed font-mono ${
              wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            }`}
            style={{ margin: 0 }}
          >
            <code
              className="block text-slate-200 w-fit min-w-full"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      </div>

      {/* Jonli Preview Modal */}
      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-6 animate-fade-in"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-5xl h-[90vh] glass rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 md:px-5 py-3 bg-white/5 border-b border-white/10 flex-wrap">
              <span className="text-xs md:text-sm font-black text-white flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                Jonli Preview — {language.toUpperCase()}
              </span>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                >
                  ↗ Yangi oynada
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                >
                  ⬇ Yuklab olish
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/80 text-white hover:bg-red-500 transition"
                >
                  ✕ Yopish
                </button>
              </div>
            </div>
            <iframe
              title="preview"
              key={previewUrl}
              className="flex-1 w-full bg-white"
              sandbox="allow-scripts allow-modals allow-popups"
              src={previewUrl}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CodeBlock;
