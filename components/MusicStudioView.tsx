import React, { useState } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  TextArea,
  Select,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface MusicStudioViewProps {
  onOpenApiKeyModal?: () => void;
}

const GENRES = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Jazz",
  "Classical",
  "Electronic",
  "R&B",
  "Country",
  "Folk",
  "Metal",
];
const MOODS = [
  "Happy",
  "Sad",
  "Energetic",
  "Calm",
  "Romantic",
  "Epic",
  "Mysterious",
  "Nostalgic",
];
const TEMPOS = [
  "Slow (60-80 BPM)",
  "Medium (80-120 BPM)",
  "Fast (120-160 BPM)",
  "Very Fast (160+ BPM)",
];

export const MusicStudioView: React.FC<MusicStudioViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [mood, setMood] = useState("Happy");
  const [tempo, setTempo] = useState("Medium (80-120 BPM)");
  const [lyrics, setLyrics] = useState("");
  const [songConcept, setSongConcept] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal?.();
      return;
    }
    setLoading(true);
    setError("");
    setLyrics("");
    setSongConcept("");
    setMusicPrompt("");
    try {
      const res = await getGeminiResponse(
        `"${topic}" mavzusida ${genre} janrida, ${mood} kayfiyatida, ${tempo} tempoda qo'shiq yarat.\n\nQuyidagilarni bering:\n1. Qo'shiq konsepti (2-3 jumla)\n2. To'liq qo'shiq matni (lyrics) - kupletlar va privev bilan\n3. Musiqa prompti (AI musiqa generatori uchun ingliz tilida)`,
      );
      setLyrics(res);
    } catch (err: any) {
      setError(err?.message || "Qo'shiq yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Music Studio"
          title="🎵 AI Musiqa Studiyasi"
          description="Qo'shiq matni, konsept va musiqa promptlarini yarating"
        />

        <Card>
          <div className="space-y-4">
            <Input
              value={topic}
              onChange={setTopic}
              placeholder="Qo'shiq mavzusi (masalan: Sevgi, Do'stlik, Yoz kechasi)"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Janr
                </label>
                <Select
                  value={genre}
                  onChange={setGenre}
                  options={GENRES.map((g) => ({ value: g, label: g }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Kayfiyat
                </label>
                <Select
                  value={mood}
                  onChange={setMood}
                  options={MOODS.map((m) => ({ value: m, label: m }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Tempo
                </label>
                <Select
                  value={tempo}
                  onChange={setTempo}
                  options={TEMPOS.map((t) => ({ value: t, label: t }))}
                />
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? "🎵 Yaratilmoqda..." : "🎵 Qo'shiq yaratish"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {loading && (
          <Card>
            <div className="flex items-center gap-3">
              <span className="animate-pulse text-2xl">🎵</span>
              <p className="text-sm text-slate-400">Qo'shiq yaratilmoqda...</p>
            </div>
          </Card>
        )}

        {lyrics && !loading && (
          <Card>
            <h3 className="text-sm font-black text-white mb-3">📝 Natija</h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {lyrics}
            </p>
          </Card>
        )}

        {!topic && !loading && !lyrics && (
          <EmptyState
            icon="🎵"
            title="Musiqa yarating"
            description="Mavzu yozing va AI sizga qo'shiq konsepti, to'liq matn va musiqa promptini yaratib beradi."
          />
        )}
      </div>
    </div>
  );
};
