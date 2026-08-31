import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface VisionAIViewProps {
  onOpenApiKeyModal: () => void;
}

export const VisionAIView: React.FC<VisionAIViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    "Bu rasmni tahlil qil va batafsil tushuntir.",
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await getGeminiResponse(prompt, image);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Tahlil qilishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Vision AI"
          title="👁️ Rasm Tahlili"
          description="Rasm yuklang — AI uni tahlil qiladi, matnni o'qiydi (OCR), ob'ektlarni aniqlaydi va tushuntiradi"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload side */}
          <div className="space-y-4">
            <div
              className="glass rounded-2xl p-5 border-white/10"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            >
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {image ? (
                  <div className="relative">
                    <img
                      src={image}
                      alt="Uploaded"
                      className="w-full h-64 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setImage(null);
                        setResult("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl hover:border-blue-500/50 transition">
                    <div className="text-5xl mb-3">🖼️</div>
                    <p className="text-sm font-bold text-slate-300">
                      Rasm yuklash uchun bosing
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      yoki drag & drop qiling
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="glass rounded-2xl p-5 border-white/10">
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Tahlil so'rovi
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
                placeholder="Masalan: Bu xatoni tuzat. Rasmda nima tasvirlangan?"
              />
              <Button
                onClick={handleAnalyze}
                disabled={!image || loading}
                className="w-full mt-3"
              >
                {loading ? "🔍 Tahlil qilinmoqda..." : "🔍 Tahlil qilish"}
              </Button>
            </div>
          </div>

          {/* Result side */}
          <div className="glass rounded-2xl p-5 border-white/10 min-h-[400px]">
            <h3 className="text-sm font-black text-white mb-4">📋 Natija</h3>
            {loading && <LoadingSkeleton count={3} />}
            {error && (
              <div className="p-4 rounded-xl bg-red-600/20 border border-red-500/30">
                <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
              </div>
            )}
            {!loading && !error && result && (
              <div className="prose prose-invert max-w-none">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {result}
                </p>
              </div>
            )}
            {!loading && !error && !result && (
              <EmptyState
                icon="👁️"
                title="Rasm tahlili"
                description="Rasm yuklang va 'Tahlil qilish' tugmasini bosing. AI rasmni tahlil qilib, batafsil javob beradi."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
