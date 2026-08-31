import React, { useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import { dbService } from "../services/dbService";
import { Quiz, QuizQuestion } from "../types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface QuizViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  userId,
  onOpenApiKeyModal,
}) => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
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
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    try {
      const res = await askGemini({
        parts: [
          {
            text: `"${topic}" mavzusi bo'yicha ${questionCount} ta test savoli yarat. Qiyinlik: ${difficulty}.\n\nFormat (JSON):\n[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "...", "difficulty": "easy|medium|hard"}]\n\nFaqat JSON qaytar, boshqa matn yo'q.`,
          },
        ],
        responseMimeType: "application/json",
      });
      const questions = JSON.parse(res) as QuizQuestion[];
      const newQuiz: Quiz = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        userId,
        topic,
        questions,
        createdAt: Date.now(),
      };
      setQuiz(newQuiz);
      await dbService.saveQuiz(newQuiz);
    } catch (err: any) {
      setError(err?.message || "Test yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    quiz.score = correct;
    dbService.saveQuiz(quiz);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Quiz"
          title="📝 Test Yaratish"
          description="AI sizga mavzu bo'yicha professional testlar yaratadi"
        />

        <Card>
          <div className="space-y-4">
            <Input
              value={topic}
              onChange={setTopic}
              placeholder="Mavzu (masalan: Python asoslari)"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Qiyinlik
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as typeof difficulty)
                  }
                  className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Savollar soni
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 outline-none"
                >
                  {[5, 10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} ta
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? "📝 Yaratilmoqda..." : "📝 Test yaratish"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {loading && <LoadingSkeleton count={4} />}

        {quiz && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">
                {quiz.topic} — {quiz.questions.length} savol
              </h3>
              {submitted && (
                <Badge
                  color={
                    score >= quiz.questions.length * 0.7
                      ? "green"
                      : score >= quiz.questions.length * 0.4
                        ? "yellow"
                        : "red"
                  }
                >
                  Natija: {score}/{quiz.questions.length}
                </Badge>
              )}
            </div>

            {quiz.questions.map((q, idx) => (
              <Card key={q.id}>
                <p className="text-sm font-bold text-white">
                  {idx + 1}. {q.question}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() =>
                        !submitted &&
                        setAnswers((prev) => ({ ...prev, [idx]: optIdx }))
                      }
                      className={`w-full text-left p-3 rounded-xl text-sm transition ${
                        submitted
                          ? optIdx === q.correctIndex
                            ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                            : answers[idx] === optIdx
                              ? "bg-red-600/20 text-red-300 border border-red-500/30"
                              : "bg-slate-800/60 text-slate-400"
                          : answers[idx] === optIdx
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800/60 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}. {opt}
                    </button>
                  ))}
                </div>
                {submitted && (
                  <p className="mt-3 text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl">
                    💡 {q.explanation}
                  </p>
                )}
              </Card>
            ))}

            {!submitted && (
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={Object.keys(answers).length < quiz.questions.length}
              >
                ✅ Natijani tekshirish
              </Button>
            )}
          </div>
        )}

        {!topic && !loading && !quiz && (
          <EmptyState
            icon="📝"
            title="Test yarating"
            description="Mavzu yozing va AI sizga professional test savollari yaratib beradi."
          />
        )}
      </div>
    </div>
  );
};
