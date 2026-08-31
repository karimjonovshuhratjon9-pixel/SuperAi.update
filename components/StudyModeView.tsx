import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface StudyModeViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const StudyModeView: React.FC<StudyModeViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"explain" | "practice" | "homework">(
    "explain",
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStudy = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const prompts = {
        explain: `"${topic}" mavzusini yangi boshlovchiga tushunarli qilib, bosqichma-bosqich tushuntir. Misollar, analogiyalar va amaliy mashqlar bilan.`,
        practice: `"${topic}" mavzusi bo'yicha amaliy mashqlar va savollar tayyorla. Har bir savolga javob va tushuntirish bilan.`,
        homework: `"${topic}" mavzusi bo'yicha uy vazifasini bajarishda yordam ber. Yechimni tushuntirib, bosqichma-bosqich ko'rsat.`,
      };
      const res = await getGeminiResponse(prompts[mode]);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "O'rganishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Study Mode"
          title="🎓 O'quv Rejimi"
          description="AI sizga tushuntirib o'rgatadi — shunchaki javob bermaydi"
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { id: "explain", label: "📖 Tushuntirish" },
            { id: "practice", label: "✏️ Amaliyot" },
            { id: "homework", label: "📚 Uy vazifasi" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as typeof mode)}
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
            <Input
              value={topic}
              onChange={setTopic}
              placeholder="Mavzu (masalan: Python funksiyalari, Fizika qonunlari)"
            />
            <Button
              onClick={handleStudy}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? "🎓 O'rganilmoqda..." : "🎓 O'rganish"}
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
            <h3 className="text-sm font-black text-white mb-3">📚 Natija</h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </Card>
        )}

        {!topic && !loading && !result && (
          <EmptyState
            icon="🎓"
            title="O'rganishni boshlang"
            description="Mavzu yozing va AI uni sizga tushunarli qilib, bosqichma-bosqich o'rgatadi."
          />
        )}
      </div>
    </div>
  );
};
