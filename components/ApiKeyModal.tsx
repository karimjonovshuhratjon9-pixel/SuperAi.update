import React, { useState, useEffect } from "react";
import { getApiKey, setApiKey } from "../services/geminiService";
import {
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  testElevenLabsConnection,
  DEFAULT_ELEVENLABS_VOICES,
  getSelectedVoiceId,
  setSelectedVoiceId,
} from "../services/elevenLabsService";
import {
  getHeyGenApiKey,
  setHeyGenApiKey,
  testHeyGenConnection,
} from "../services/heygenService";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

type KeyTab = "gemini" | "elevenlabs" | "heygen";

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<KeyTab>("gemini");

  const [geminiKey, setGeminiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [heygenKey, setHeygenKey] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(getApiKey());
      setElevenLabsKey(getElevenLabsApiKey());
      setHeygenKey(getHeyGenApiKey());
      setSelectedVoice(getSelectedVoiceId());
      setTestStatus({ loading: false });
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async (tab: KeyTab) => {
    setTestStatus({ loading: true });
    try {
      if (tab === "gemini") {
        const key = geminiKey.trim();
        if (!key) {
          setTestStatus({
            loading: false,
            success: false,
            message: "Gemini API kaliti kiritilmagan",
          });
          return;
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
        );
        if (res.ok) {
          setTestStatus({
            loading: false,
            success: true,
            message: "Gemini API muvaffaqiyatli ulandi! Modellar faol.",
          });
        } else {
          setTestStatus({
            loading: false,
            success: false,
            message: `Gemini API xatosi (${res.status}). Kalitni tekshiring.`,
          });
        }
      } else if (tab === "elevenlabs") {
        const key = elevenLabsKey.trim();
        const res = await testElevenLabsConnection(key);
        setTestStatus({
          loading: false,
          success: res.success,
          message: res.message,
        });
      } else if (tab === "heygen") {
        const key = heygenKey.trim();
        const res = await testHeyGenConnection(key);
        setTestStatus({
          loading: false,
          success: res.success,
          message: res.message,
        });
      }
    } catch (e: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: e?.message || "Ulanishda xatolik yuz berdi",
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(geminiKey.trim());
    setElevenLabsApiKey(elevenLabsKey.trim());
    setHeyGenApiKey(heygenKey.trim());
    if (selectedVoice) {
      setSelectedVoiceId(selectedVoice);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSave) onSave();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl relative text-white max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            ⚡
          </div>
          <div>
            <h3 className="text-xl font-black">AI API Kalitlari Sozlamalari</h3>
            <p className="text-xs text-slate-400">
              Gemini, ElevenLabs va HeyGen xizmatlarini bir joyda boshqaring
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-800/80 border border-white/5 mb-5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("gemini");
              setTestStatus({ loading: false });
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "gemini"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🤖 Gemini</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("elevenlabs");
              setTestStatus({ loading: false });
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "elevenlabs"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎙 ElevenLabs</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("heygen");
              setTestStatus({ loading: false });
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "heygen"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎬 HeyGen</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* GEMINI TAB */}
          {activeTab === "gemini" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    Google Gemini API Key
                  </label>
                  <span className="text-[10px] text-blue-400 font-semibold">
                    Asosiy Chat & Vision
                  </span>
                </div>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="bg-blue-950/30 border border-blue-800/30 rounded-2xl p-3.5 text-xs text-blue-200 leading-relaxed">
                <p className="font-semibold mb-1">🔑 Bepul Gemini API key olish:</p>
                <p>
                  1.{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-blue-300"
                  >
                    Google AI Studio
                  </a>{" "}
                  sahifasiga kiring.
                </p>
                <p>2. "Create API key" tugmasini bosing va nusxalang.</p>
              </div>
            </div>
          )}

          {/* ELEVENLABS TAB */}
          {activeTab === "elevenlabs" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    ElevenLabs API Key
                  </label>
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    Tabiiy Ovoz Sintezi (TTS)
                  </span>
                </div>
                <input
                  type="password"
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  placeholder="sk_..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Standart Ovoz (Default Voice)
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none"
                >
                  {DEFAULT_ELEVENLABS_VOICES.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name} — {v.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-2xl p-3.5 text-xs text-cyan-200 leading-relaxed">
                <p className="font-semibold mb-1">🎙 ElevenLabs kalitini olish:</p>
                <p>
                  1.{" "}
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-cyan-300"
                  >
                    ElevenLabs.io
                  </a>{" "}
                  profilingizga kiring.
                </p>
                <p>2. Profile → API Keys bo'limidan kalit oling.</p>
              </div>
            </div>
          )}

          {/* HEYGEN TAB */}
          {activeTab === "heygen" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase">
                    HeyGen AI API Key
                  </label>
                  <span className="text-[10px] text-purple-400 font-semibold">
                    AI Video Avatarlar & Video Studiya
                  </span>
                </div>
                <input
                  type="password"
                  value={heygenKey}
                  onChange={(e) => setHeygenKey(e.target.value)}
                  placeholder="sk_V2_..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div className="bg-purple-950/30 border border-purple-800/30 rounded-2xl p-3.5 text-xs text-purple-200 leading-relaxed">
                <p className="font-semibold mb-1">🎬 HeyGen API kalitini olish:</p>
                <p>
                  1.{" "}
                  <a
                    href="https://app.heygen.com/home?from=&nav=API"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-purple-300"
                  >
                    HeyGen Dashboard → API Settings
                  </a>{" "}
                  ga kiring.
                </p>
                <p>2. "Create API Key" tugmasini bosib yangi kalit yarating.</p>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testStatus.message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold animate-fade-in ${
                testStatus.success
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/20 border border-rose-500/40 text-rose-300"
              }`}
            >
              {testStatus.success ? "✓ " : "✕ "}
              {testStatus.message}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold text-center animate-fade-in">
              ✓ Barcha API kalitlar muvaffaqiyatli saqlandi!
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestKey(activeTab)}
              disabled={testStatus.loading}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5"
            >
              {testStatus.loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>🔌 Ulanishni tekshirish</span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Yopish
            </button>

            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-black rounded-xl shadow-lg transition active:scale-95"
            >
              Barchasini Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
