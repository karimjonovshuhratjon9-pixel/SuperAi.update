import React, { useEffect, useRef, useState } from "react";
import {
  DEFAULT_ELEVENLABS_VOICES,
  hasElevenLabsApiKey,
  speakWithElevenLabs,
  stopElevenLabsAudio,
} from "../../services/elevenLabsService";
import SuperAIModal from "./SuperAIModal";

export interface VoiceSettings {
  speed: number;
  pitch: number;
  volume: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  speed: 1,
  pitch: 0.95,
  volume: 1,
};

export type VoiceLang = "uz" | "en" | "ru";

export const LANG_TAGS: Record<VoiceLang, string> = {
  uz: "uz-UZ",
  en: "en-US",
  ru: "ru-RU",
};

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: VoiceLang;
  onLanguageChange: (lang: VoiceLang) => void;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  settings: VoiceSettings;
  onSettingsChange: (s: VoiceSettings) => void;
}

const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  selectedVoice,
  onVoiceChange,
  settings,
  onSettingsChange,
}) => {
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewLock = useRef(false);

  useEffect(() => {
    return () => {
      stopElevenLabsAudio();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPreviewPlaying(false);
      stopElevenLabsAudio();
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (previewLock.current) return;
    if (previewPlaying) {
      stopElevenLabsAudio();
      setPreviewPlaying(false);
      return;
    }
    previewLock.current = true;
    setPreviewPlaying(true);
    const text =
      language === "uz"
        ? "Salom! Men SuperAI Virtual Do'stingizman. Siz bilan suhbatlashishdan xursandman."
        : language === "en"
          ? "Hello! I am your SuperAI Virtual Friend, and I am glad to talk with you."
          : "Привет! Я твой виртуальный друг SuperAI, мне приятно с тобой общаться.";
    try {
      await speakWithElevenLabs(
        text,
        selectedVoice,
        () => undefined,
        () => {
          setPreviewPlaying(false);
        },
        (err: any) => {
          console.warn("Preview ovoz xatosi:", err);
          setPreviewPlaying(false);
        },
        {
          rate: settings.speed,
          pitch: settings.pitch,
          volume: settings.volume,
          lang: LANG_TAGS[language],
          speed: settings.speed,
        },
      );
    } catch {
      setPreviewPlaying(false);
    } finally {
      previewLock.current = false;
    }
  };

  const set = (patch: Partial<VoiceSettings>) =>
    onSettingsChange({ ...settings, ...patch });
  return (
    <SuperAIModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ovoz sozlamalari"
      icon="🎛"
    >
      <div className="vf-field">
        <span className="vf-label">Ovoz</span>
        <div>
          <select
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="vf-topbar-select w-full"
            aria-label="ElevenLabs ovozi"
          >
            {DEFAULT_ELEVENLABS_VOICES.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name}
              </option>
            ))}
          </select>
          <small
            style={{
              display: "block",
              marginTop: "0.35rem",
              fontSize: "0.62rem",
              color: hasElevenLabsApiKey() ? "#7dd3fc" : "#fbbf24",
              fontWeight: 600,
            }}
          >
            {hasElevenLabsApiKey()
              ? "● ElevenLabs HD ovoz faol"
              : "● ElevenLabs kaliti sozlanmagan — brauzer ovozi ishlatiladi"}
          </small>
        </div>
      </div>

      <div className="vf-field">
        <span className="vf-label">Til</span>
        <div className="vf-pill-group">
          {(["uz", "en", "ru"] as VoiceLang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`vf-pill${language === l ? " vf-pill-active" : ""}`}
              onClick={() => onLanguageChange(l)}
              aria-pressed={language === l}
            >
              {l === "uz" ? "O'zbekcha" : l === "en" ? "English" : "Русский"}
            </button>
          ))}
        </div>
      </div>

      <div className="vf-field">
        <span className="vf-label">Tezlik</span>
        <div className="vf-range-row">
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={settings.speed}
            onChange={(e) => set({ speed: Number(e.target.value) })}
            aria-label="Ovoz tezligi"
          />
          <span className="vf-range-val">{settings.speed.toFixed(2)}×</span>
        </div>
      </div>

      <div className="vf-field">
        <span className="vf-label">Ohang</span>
        <div className="vf-range-row">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={settings.pitch}
            onChange={(e) => set({ pitch: Number(e.target.value) })}
            aria-label="Ovoz ohangi"
          />
          <span className="vf-range-val">{settings.pitch.toFixed(2)}</span>
        </div>
      </div>

      <div className="vf-field">
        <span className="vf-label">Ovoz balandligi</span>
        <div className="vf-range-row">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => set({ volume: Number(e.target.value) })}
            aria-label="Ovoz balandligi"
          />
          <span className="vf-range-val">{Math.round(settings.volume * 100)}%</span>
        </div>
      </div>

      <button
        type="button"
        className="vf-btn-primary"
        style={{
          marginTop: "0.4rem",
          width: "100%",
          padding: "0.6rem",
          borderRadius: "0.8rem",
          fontWeight: 800,
          fontSize: "0.78rem",
          cursor: "pointer",
        }}
        onClick={() => void handlePreview()}
      >
        {previewPlaying ? "⏹ To'xtatish" : "▶ Yangi ovozni sinab ko'rish"}
      </button>
    </SuperAIModal>
  );
};

export default VoiceSettingsModal;