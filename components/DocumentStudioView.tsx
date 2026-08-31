import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Select,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface DocumentStudioViewProps {
  onOpenApiKeyModal: () => void;
}

const DOC_TYPES = [
  {
    id: "cv",
    name: "CV / Resume",
    icon: "📄",
    prompt: "Professional CV yarat",
  },
  {
    id: "cover_letter",
    name: "Cover Letter",
    icon: "✉️",
    prompt: "Motivatsion xat yoz",
  },
  { id: "essay", name: "Essay", icon: "📝", prompt: "Insho yoz" },
  { id: "report", name: "Report", icon: "📊", prompt: "Hisobot tayyorla" },
  {
    id: "business_plan",
    name: "Business Plan",
    icon: "💼",
    prompt: "Biznes reja tuz",
  },
  { id: "article", name: "Article", icon: "📰", prompt: "Maqola yoz" },
  { id: "letter", name: "Letter", icon: "💌", prompt: "Xat yoz" },
  { id: "notes", name: "Notes", icon: "📋", prompt: "Eslatmalar tayyorla" },
  {
    id: "presentation",
    name: "Presentation",
    icon: "📽️",
    prompt: "Taqdimot kontenti yarat",
  },
];

export const DocumentStudioView: React.FC<DocumentStudioViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [docType, setDocType] = useState("cv");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const type = DOC_TYPES.find((d) => d.id === docType);
      const res = await getGeminiResponse(
        `${type?.prompt}. Mavzu: ${topic}\n\nProfessional, to'liq va tayyor hujjat yarat.`,
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Hujjat yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: "txt" | "md") => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `superai-document-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Document Studio"
          title="📄 AI Hujjat Studiyasi"
          description="CV, hisobot, maqola, biznes reja va boshqa hujjatlarni yarating"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOC_TYPES.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setDocType(doc.id)}
              className={`p-3 rounded-xl text-xs font-bold transition ${
                docType === doc.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="text-xl block mb-1">{doc.icon}</span>
              {doc.name}
            </button>
          ))}
        </div>

        <Card>
          <div className="space-y-4">
            <Input
              value={topic}
              onChange={setTopic}
              placeholder="Hujjat mavzusi (masalan: Frontend dasturchi uchun CV)"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? "📄 Yaratilmoqda..." : "📄 Hujjat yaratish"}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-white">📋 Natija</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("txt")}
                >
                  ⬇ TXT
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("md")}
                >
                  ⬇ MD
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </Card>
        )}

        {!topic && !loading && !result && (
          <EmptyState
            icon="📄"
            title="Hujjat yarating"
            description="Hujjat turini tanlang va mavzu yozing. AI professional, to'liq hujjat yaratib beradi."
          />
        )}
      </div>
    </div>
  );
};
