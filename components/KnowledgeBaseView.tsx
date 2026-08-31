import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import { chunkDocument, searchRelevantChunks } from "../services/ragService";
import { RAGDocumentChunk } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";

interface KnowledgeBaseProps {
  onOpenApiKeyModal: () => void;
}

interface KBCollection {
  id: string;
  name: string;
  icon: string;
  docCount: number;
}

const DEFAULT_COLLECTIONS: KBCollection[] = [
  { id: "tech", name: "Dasturlash & IT", icon: "💻", docCount: 3 },
  { id: "business", name: "Biznes & Marketing", icon: "📈", docCount: 2 },
  { id: "science", name: "Fan & Ta'lim", icon: "📚", docCount: 4 },
  { id: "personal", name: "Shaxsiy Qaydlar", icon: "⭐", docCount: 1 },
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseProps> = ({
  onOpenApiKeyModal,
}) => {
  const [collections] = useState<KBCollection[]>(DEFAULT_COLLECTIONS);
  const [selectedColId, setSelectedColId] = useState("tech");
  const [docContent, setDocContent] = useState<string>("");
  const [docName, setDocName] = useState<string>("Default_Manual.txt");
  const [chunks, setChunks] = useState<RAGDocumentChunk[]>([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<RAGDocumentChunk[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setDocContent(text);
      const generatedChunks = chunkDocument(text, 500, 80);
      setChunks(generatedChunks);
    };
    reader.readAsText(file);
  };

  const handleAskKnowledge = async () => {
    if (!query.trim() || !docContent.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    setIsSearching(true);
    setAnswer("");
    setCitations([]);

    try {
      const relevant = await searchRelevantChunks(query, chunks, 3);
      setCitations(relevant);

      const contextText = relevant
        .map((c, i) => `[Iqtibos #${i + 1} - ID: ${c.id}]\n${c.content}`)
        .join("\n\n");

      const prompt = `Sen bilimlar bazasi bo'yicha ekspert AI asistentsan.
Foydalanuvchi savoli: "${query}"

Hujjatdan ajratilgan eng muhim bo'laklar (Context):
${contextText}

Faqat taqdim etilgan kontekst asosida aniq, faktik va to'liq javob ber. Har bir xulosangiz yonida qaysi iqtibosdan olinganini [Iqtibos #1] kabi belgilang.`;

      const res = await askGemini({
        parts: [{ text: prompt }],
        temperature: 0.2,
      });

      setAnswer(res);
    } catch (err: any) {
      setAnswer(`⚠️ Xatolik: ${err?.message || "Bilimlar bazasidan ma'lumot olib bo'lmadi"}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
            📚
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">SuperAI Knowledge Base (RAG)</h2>
            <p className="text-xs text-slate-400">Semantik qidiruv va hujjatlar intellekti</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Collections & Files Panel */}
        <div className="w-80 border-r border-white/10 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Kolleksiyalar
            </span>
            <div className="space-y-1.5">
              {collections.map((col) => (
                <div
                  key={col.id}
                  onClick={() => setSelectedColId(col.id)}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                    selectedColId === col.id
                      ? "bg-indigo-600/20 border border-indigo-500 text-indigo-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <span>{col.name}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">{col.docCount} ta</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Hujjat Yuklash
            </span>
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
            {chunks.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-300">
                <p className="font-semibold text-emerald-400">✓ {docName}</p>
                <p className="text-slate-400">{chunks.length} ta semantik bo'lakka (chunk) ajratildi</p>
              </div>
            )}
          </div>
        </div>

        {/* Search & Answer Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-950/80">
          <div className="max-w-3xl w-full mx-auto space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bilimlar bazasidan qidirish yoki savol berish..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleAskKnowledge()}
              />
              <button
                onClick={handleAskKnowledge}
                disabled={isSearching || !query.trim() || !docContent.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSearching ? "Qidirilmoqda..." : "Savol Berish"}
              </button>
            </div>

            {/* Answer Box */}
            {answer && (
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  AI Javobi (Citations bilan):
                </h3>
                <MarkdownRenderer content={answer} />

                {citations.length > 0 && (
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Foydalanilgan Hujjat Bo'laklari:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {citations.map((c, i) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-[11px] text-slate-300"
                        >
                          <span className="font-bold text-indigo-400 block mb-1">
                            [Iqtibos #{i + 1}]
                          </span>
                          <p className="line-clamp-3 text-slate-400 font-mono text-[10px]">
                            {c.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
