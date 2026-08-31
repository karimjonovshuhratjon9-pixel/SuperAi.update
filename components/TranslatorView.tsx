import React, { useState, useEffect } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import {
  speakWithElevenLabs,
  stopElevenLabsAudio,
  isAudioPlaying,
} from "../services/elevenLabsService";

const LANGS = [
  "O'zbek tili",
  "Ingliz tili",
  "Rus tili",
  "Turk tili",
  "Nemis tili",
  "Fransuz tili",
  "Xitoy tili",
  "Yapon tili",
  "Arab tili",
  "Koreys tili",
  "Ispan tili",
  "Italyan tili",
];

const TranslatorView: React.FC<{ onOpenApiKeyModal: () => void }> = ({
  onOpenApiKeyModal,
}) => {
  const [text, setText] = useState("");
  const [from, setFrom] = useState("Avtomatik aniqlash");
  const [to, setTo] = useState("Ingliz tili");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopElevenLabsAudio();
    };
  }, []);

  const handleSpeakResult = async () => {
    if (!result.trim()) return;
    if (isSpeaking) {
      stopElevenLabsAudio();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    await speakWithElevenLabs(
      result,
      undefined,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!text.trim() || isLoading) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setIsLoading(true);
    setError("");
    setResult("");
    try {
      const res = await askGemini({
        parts: [
          {
            text: `Translate the following text ${
              from === "Avtomatik aniqlash"
                ? "(detect the source language automatically)"
                : `from ${from}`
            } into ${to}. Respond with the translation ONLY — no explanations, no quotes, no transliteration notes.\n\nText:\n${text}`,
          },
        ],
        temperature: 0.3,
        maxOutputTokens: 4096,
        timeoutMs: 45_000,
      });
      setResult(res.trim());
    } catch (e: any) {
      setError(e?.message || "Tarjima qilishda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const swap = () => {
    if (from === "Avtomatik aniqlash") return;
    setFrom(to);
    setTo(from);
    setText(result);
    setResult(text);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-white/5">
        <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-500">
          🌐 Tarjimon
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Professional darajada tarjima — istalgan til juftligi
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {/* Til tanlash */}
        <div className="flex items-center gap-2 flex-wrap glass rounded-2xl p-3 border border-white/10">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none"
          >
            <option>Avtomatik aniqlash</option>
            {LANGS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button
            onClick={swap}
            title="Tillarni almashtirish"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/15 transition"
          >
            ⇄
          </button>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none"
          >
            {LANGS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Matnlar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col min-h-[220px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tarjima qilinadigan matnni yozing..."
              className="flex-1 w-full bg-transparent outline-none resize-none text-sm text-slate-100 placeholder-slate-500 leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500">
                {text.length} belgi
              </span>
              <button
                onClick={handleTranslate}
                disabled={!text.trim() || isLoading}
                className={`px-5 py-2 text-xs font-black rounded-xl transition ${
                  !text.trim() || isLoading
                    ? "bg-slate-800 text-slate-600"
                    : "bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-sky-900/30"
                }`}
              >
                {isLoading ? "⏳ Tarjima qilinmoqda..." : "🌐 Tarjima qilish"}
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col min-h-[220px]">
            {error ? (
              <p className="text-sm text-red-400">⚠️ {error}</p>
            ) : result ? (
              <>
                <p className="flex-1 whitespace-pre-wrap text-sm text-emerald-100 leading-relaxed">
                  {result}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={handleSpeakResult}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition flex items-center gap-1.5 ${
                      isSpeaking
                        ? "bg-cyan-600 text-white border-cyan-500 animate-pulse"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/15"
                    }`}
                  >
                    <span>{isSpeaking ? "⏹ To'xtatish" : "🔊 Ovoz chiqarib o'qish"}</span>
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/15 transition"
                  >
                    📋 Nusxa olish
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic m-auto">
                {isLoading ? "⏳ Tarjima..." : "Natija shu yerda ko'rinadi"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorView;
