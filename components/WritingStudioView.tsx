import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  TextArea,
  Select,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface WritingStudioViewProps {
  onOpenApiKeyModal: () => void;
}

const MODES = [
  {
    id: "rewrite",
    label: "🔄 Qayta yozish",
    prompt: "Quyidagi matnni professional darajada qayta yoz:",
  },
  {
    id: "improve",
    label: "✨ Yaxshilash",
    prompt: "Quyidagi matnni yaxshilab, professional darajaga olib chiq:",
  },
  {
    id: "summarize",
    label: "📋 Xulosa",
    prompt: "Quyidagi matnni asosiy fikrlarni saqlagan holda xulosa qil:",
  },
  {
    id: "expand",
    label: "📖 Kengaytirish",
    prompt: "Quyidagi matnni batafsil kengaytir:",
  },
  {
    id: "shorten",
    label: "✂️ Qisqartirish",
    prompt: "Quyidagi matnni qisqartir, asosiy ma'noni saqlab:",
  },
  {
    id: "formal",
    label: "🎩 Rasmiy",
    prompt: "Quyidagi matnni rasmiy uslubda qayta yoz:",
  },
  {
    id: "casual",
    label: "😊 Norasmiy",
    prompt: "Quyidagi matnni norasmiy, do'stona uslubda qayta yoz:",
  },
  {
    id: "creative",
    label: "🎨 Kreativ",
    prompt: "Quyidagi matnni kreativ va ijodiy uslubda qayta yoz:",
  },
  {
    id: "grammar",
    label: "✅ Grammatika",
    prompt:
      "Quyidagi matndagi grammatik xatolarni tuzat va to'g'rilangan versiyasini bering:",
  },
  {
    id: "translate",
    label: "🌐 Tarjima",
    prompt: "Quyidagi matnni tarjima qil (tilni avtomatik aniqlang):",
  },
];

export const WritingStudioView: React.FC<WritingStudioViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [mode, setMode] = useState("rewrite");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = async () => {
    if (!text.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const modeInfo = MODES.find((m) => m.id === mode);
      const res = await getGeminiResponse(`${modeInfo?.prompt}\n\n${text}`);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Writing Studio"
          title="✍️ Yozuv Studiyasi"
          description="Matnlarni professional darajada qayta ishlang"
        />

        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                mode === m.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Card>
          <div className="space-y-4">
            <TextArea
              value={text}
              onChange={setText}
              placeholder="Matnni kiriting..."
              rows={6}
            />
            <Button
              onClick={handleProcess}
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? "✍️ Ishlanmoqda..." : "✍️ Ishga tushirish"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {result && !loading && (
          <Card>
            <h3 className="text-sm font-black text-white mb-3">📝 Natija</h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => navigator.clipboard.writeText(result)}
            >
              📋 Nusxalash
            </Button>
          </Card>
        )}

        {!text && !loading && !result && (
          <EmptyState
            icon="✍️"
            title="Matnni qayta ishlang"
            description="Matn kiriting va rejimni tanlang — AI uni professional darajada qayta ishlaydi."
          />
        )}
      </div>
    </div>
  );
};
