import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import { Quiz, QuizQuestion } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface ExamSimulatorViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  userId,
  onOpenApiKeyModal,
}) => {
  const [topic, setTopic] = useState("");
  const [exam, setExam] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setExam(null);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    try {
      const res = await askGemini({
        parts: [
          {
            text: `"${topic}" mavzusi bo'yicha imtihon testi yarat. 20 ta savol, qiyinlik aralash (easy, medium, hard).\n\nFormat (JSON):\n[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "...", "difficulty": "easy|medium|hard"}]\n\nFaqat JSON qaytar.`,
          },
        ],
        responseMimeType: "application/json",
      });
      const questions = JSON.parse(res) as QuizQuestion[];
      const newExam: Quiz = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        userId,
        topic: `${topic} — Imtihon`,
        questions,
        createdAt: Date.now(),
      };
      setExam(newExam);
      setTimeLeft(questions.length * 60); // 1 minute per question
      await dbService.saveQuiz(newExam);
    } catch (err: any) {
      setError(err?.message || "Imtihon yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!exam) return;
    let correct = 0;
    exam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    exam.score = correct;
    dbService.saveQuiz(exam);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Exam Simulator"
          title="🧪 Imtihon Simulyatori"
          description="Haqiqiy imtihon sharoitida bilimingizni sinang"
        />

        <Card>
          <div className="space-y-4">
            <Input
              value={topic}
              onChange={setTopic}
              placeholder="Imtihon mavzusi (masalan: Matematika, Ingliz tili)"
            />
            <Button
              onClick={handleStart}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? "🧪 Tayyorlanmoqda..." : "🧪 Imtihonni boshlash"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {loading && <LoadingSkeleton count={4} />}

        {exam && !loading && !submitted && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">{exam.topic}</h3>
              <Badge color="yellow">⏱ {formatTime(timeLeft)}</Badge>
            </div>

            {exam.questions.map((q, idx) => (
              <Card key={q.id}>
                <p className="text-sm font-bold text-white">
                  {idx + 1}. {q.question}
                  <Badge
                    color={
                      q.difficulty === "easy"
                        ? "green"
                        : q.difficulty === "medium"
                          ? "yellow"
                          : "red"
                    }
                    className="ml-2"
                  >
                    {q.difficulty}
                  </Badge>
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [idx]: optIdx }))
                      }
                      className={`w-full text-left p-3 rounded-xl text-sm transition ${
                        answers[idx] === optIdx
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}. {opt}
                    </button>
                  ))}
                </div>
              </Card>
            ))}

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={Object.keys(answers).length < exam.questions.length}
            >
              ✅ Imtihonni yakunlash
            </Button>
          </div>
        )}

        {submitted && exam && (
          <Card>
            <div className="text-center py-6">
              <div className="text-5xl mb-4">
                {score >= exam.questions.length * 0.7
                  ? "🏆"
                  : score >= exam.questions.length * 0.4
                    ? "📚"
                    : "📖"}
              </div>
              <h3 className="text-2xl font-black text-white">
                Natija: {score}/{exam.questions.length}
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Foiz: {Math.round((score / exam.questions.length) * 100)}%
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge
                  color={
                    score >= exam.questions.length * 0.7
                      ? "green"
                      : score >= exam.questions.length * 0.4
                        ? "yellow"
                        : "red"
                  }
                >
                  {score >= exam.questions.length * 0.7
                    ? "A'lo"
                    : score >= exam.questions.length * 0.4
                      ? "Yaxshi"
                      : "O'rganish kerak"}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => {
                setExam(null);
                setSubmitted(false);
                setTopic("");
              }}
              className="w-full"
              variant="secondary"
            >
              🔄 Yangi imtihon
            </Button>
          </Card>
        )}

        {!topic && !loading && !exam && (
          <EmptyState
            icon="🧪"
            title="Imtihon simulyatori"
            description="Mavzu yozing va AI sizga 20 savollik imtihon tayyorlaydi. Vaqt chegarasi bilan!"
          />
        )}
      </div>
    </div>
  );
};
