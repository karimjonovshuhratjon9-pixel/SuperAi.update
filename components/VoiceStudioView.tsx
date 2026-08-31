import React, { useState } from "react";
import {
  synthesizeSpeechAudio,
  getElevenLabsApiKey,
  setElevenLabsApiKey,
  hasElevenLabsApiKey,
  DEFAULT_ELEVENLABS_VOICES,
  getSelectedVoiceId,
  setSelectedVoiceId,
} from "../services/elevenLabsService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Select,
  Badge,
  EmptyState,
} from "./ui/SharedUI";

interface VoiceStudioViewProps {
  onOpenApiKeyModal: () => void;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(getSelectedVoiceId());
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState(getElevenLabsApiKey());

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (!hasElevenLabsApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setAudioUrl(null);
    try {
      const blob = await synthesizeSpeechAudio(text, voiceId, {
        stability: 0.5,
        similarity_boost: 0.8,
      });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err?.message || "Ovoz yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    setElevenLabsApiKey(apiKey);
    alert("ElevenLabs API kaliti saqlandi!");
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Voice Studio"
          title="🎙️ AI Ovoz Studiyasi"
          description="Matnni tabiiy ovozga aylantiring — 11+ professional ovozlar"
        />

        {/* API Key */}
        <Card>
          <h3 className="text-sm font-black text-white mb-3">
            🔑 ElevenLabs API
          </h3>
          <div className="flex gap-2">
            <Input
              value={apiKey}
              onChange={setApiKey}
              placeholder="ElevenLabs API kaliti"
              type="password"
              className="flex-1"
            />
            <Button onClick={handleSaveKey} variant="secondary">
              Saqlash
            </Button>
          </div>
          {!hasElevenLabsApiKey() && (
            <p className="text-xs text-amber-300 mt-2">
              ⚠️ Ovoz yaratish uchun ElevenLabs API kaliti kerak
            </p>
          )}
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Matn
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Ovozga aylantiriladigan matnni yozing..."
                className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Ovoz
                </label>
                <Select
                  value={voiceId}
                  onChange={(v) => {
                    setVoiceId(v);
                    setSelectedVoiceId(v);
                  }}
                  options={DEFAULT_ELEVENLABS_VOICES.map((v) => ({
                    value: v.voice_id,
                    label: `${v.name} (${v.gender})`,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Tezlik: {speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Pitch: {pitch}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? "🎙️ Yaratilmoqda..." : "🎙️ Ovoz yaratish"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {audioUrl && (
          <Card>
            <h3 className="text-sm font-black text-white mb-3">▶️ Natija</h3>
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = audioUrl;
                  a.download = `superai-voice-${Date.now()}.mp3`;
                  a.click();
                }}
              >
                ⬇ Yuklab olish
              </Button>
            </div>
          </Card>
        )}

        {!text && !loading && !audioUrl && (
          <EmptyState
            icon="🎙️"
            title="Ovoz yarating"
            description="Matn yozing va AI uni tabiiy, professional ovozga aylantiradi. 11+ ovoz variantlari mavjud."
          />
        )}
      </div>
    </div>
  );
};
