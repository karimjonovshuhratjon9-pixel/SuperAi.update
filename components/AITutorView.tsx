import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import { PageHeader, Button, Card, Input, EmptyState } from "./ui/SharedUI";

interface AITutorViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await getGeminiResponse(
        `Siz sabrli va tajribali o'qituvchisiz. Savolga javob berishdan oldin, o'quvchiga tushunishga yordam bering.\n\nSavol: ${question}\n\nJavobni quyidagi formatda bering:\n1. Qisqa javob\n2. Batafsil tushuntirish\n3. Misol\n4. O'quvchi tushunganini tekshirish uchun savol`,
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="AI Tutor"
          title="🧑‍🏫 AI Ustoz"
          description="Har qanday savolga tushuntirib javob beradi — o'rganishingizga yordam beradi"
        />

        <Card>
          <div className="space-y-4">
            <Input
              value={question}
              onChange={setQuestion}
              placeholder="Savolingizni yozing (masalan: Kvadrat tenglamani qanday yechish kerak?)"
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <Button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="w-full"
            >
              {loading ? "🧑‍🏫 Javob berilmoqda..." : "🧑‍🏫 So'roq"}
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
            <h3 className="text-sm font-black text-white mb-3">📚 Javob</h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </Card>
        )}

        {!question && !loading && !result && (
          <EmptyState
            icon="🧑‍🏫"
            title="Ustozdan so'rang"
            description="Har qanday mavzuda savol bering. AI ustoz sizga tushunarli qilib, bosqichma-bosqich o'rgatadi."
          />
        )}
      </div>
    </div>
  );
};
