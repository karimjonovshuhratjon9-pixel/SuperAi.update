import React, { useState, useRef } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";

interface DocMsg {
  role: "user" | "assistant";
  content: string;
}

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

const DocsView: React.FC<{ onOpenApiKeyModal: () => void }> = ({
  onOpenApiKeyModal,
}) => {
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [docText, setDocText] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [messages, setMessages] = useState<DocMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE) {
      alert("Fayl hajmi 15MB dan kichik bo'lishi kerak.");
      return;
    }
    const reader = new FileReader();
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    reader.onloadend = () => {
      if (isPdf) {
        setDocBase64(reader.result as string);
        setDocText(null);
      } else {
        setDocBase64(null);
        setDocText(String(reader.result || "").slice(0, 120_000));
      }
      setDocName(file.name);
      setMessages([]);
    };
    if (isPdf) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const ask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || (!docBase64 && !docText)) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    const q = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setIsLoading(true);
    try {
      // dataURL -> inlineData formatiga ajratish
      const parts: any[] = [];
      if (docText) {
        parts.push({
          text: `Hujjat mazmuni (${docName}):\n\n${docText}`,
        });
      } else if (docBase64) {
        const match = docBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
      parts.push({
        text:
          messages.length === 0
            ? `Bu hujjat (${docName}) yuklandi. Foydalanuvchi savoli: ${q}`
            : q,
      });
      const res = await askGemini({
        parts,
        temperature: 0.5,
        maxOutputTokens: 8192,
        timeoutMs: 90_000,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err?.message || "Xatolik yuz berdi."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-white/5 flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-500">
          📄 Hujjat AI
        </h2>
        <input
          type="file"
          ref={fileRef}
          accept=".pdf,.txt,.md,.csv,.json,.html"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-orange-900/30 transition"
        >
          📤 Hujjat yuklash
        </button>
        {docName && (
          <span className="text-xs font-bold text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-1.5">
            📄 {docName}
            <button
              onClick={() => {
                setDocBase64(null);
                setDocText(null);
                setDocName("");
                setMessages([]);
              }}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {!docBase64 && !docText ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center p-8 m-4 border-2 border-dashed border-white/10 rounded-3xl hover:border-orange-500/40 transition cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <span className="text-5xl mb-4">📄</span>
          <p className="text-sm font-bold text-slate-300">
            PDF yoki matn hujjatini yuklang
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Hujjatni shu yerga tashlang yoki bosing. Keyin undan istalgan savol
            bering — AI hujjat mazmunini o'qib javob beradi.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4"
          >
            {messages.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-6">
                {[
                  "Bu hujjatni xulosalab ber",
                  "Asosiy fikrlar ro'yxatini chiqar",
                  "Hujjatdagi raqamlarni tahlil qil",
                  "Ushbu hujjat haqida test savollari tuz",
                ].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="p-3 text-xs font-bold text-slate-300 bg-slate-800/60 border border-white/5 rounded-xl hover:bg-slate-700 hover:text-white transition text-left"
                  >
                    💡 {hint}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-orange-600 to-rose-700 text-white rounded-tr-none"
                      : "glass text-slate-100 rounded-tl-none border-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="glass p-4 rounded-2xl rounded-tl-none border-white/10 text-xs text-slate-400">
                  ⏳ Hujjat o'qilmoqda...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={ask} className="shrink-0 px-4 pb-4 md:px-6 md:pb-6">
            <div className="glass rounded-3xl p-2.5 flex items-center gap-2 border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hujjat bo'yicha savol bering..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500 px-3 py-2"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-full transition-all ${
                  !input.trim() || isLoading
                    ? "bg-slate-800 text-slate-600"
                    : "bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/40"
                }`}
              >
                ➤
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default DocsView;
