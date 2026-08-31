import React, { useEffect, useRef, useState } from "react";
import { askGemini, hasApiKey } from "../services/geminiService";
import {
  speakWithElevenLabs,
  hasElevenLabsApiKey,
  getSelectedVoiceId,
  setSelectedVoiceId,
  stopElevenLabsAudio,
} from "../services/elevenLabsService";
import { AppView } from "../types";
import SuperAIAvatar from "./virtualFriend/SuperAIAvatar";
import type { SuperAIAvatarState } from "./virtualFriend/SuperAIAvatar";
import VoiceWaveform from "./virtualFriend/VoiceWaveform";
import VoiceSettingsModal, {
  DEFAULT_VOICE_SETTINGS,
  LANG_TAGS,
} from "./virtualFriend/VoiceSettingsModal";
import type { VoiceLang, VoiceSettings } from "./virtualFriend/VoiceSettingsModal";
import PersonalitySelectorModal, {
  PERSONALITIES,
  getPersonalityName,
} from "./virtualFriend/PersonalitySelectorModal";
import type { PersonalityId } from "./virtualFriend/PersonalitySelectorModal";
import "./virtualFriend/virtualFriend.css";

interface VirtualFriendViewProps {
  onOpenApiKeyModal: () => void;
  onNavigate: (view: AppView) => void;
}

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

const VOICE_SETTINGS_KEY = "superai_vf_voice_settings";
const LANGUAGE_KEY = "superai_vf_language";

const insecureMediaMessage =
  "Kamera va mikrofon uchun ilovani http://localhost:3000 orqali oching yoki HTTPS ishlating. http://192.168.x.x manzilida Chrome media ruxsatini bloklaydi.";

const loadVoiceSettings = (): VoiceSettings => {
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<VoiceSettings>;
      return {
        speed: typeof p.speed === "number" ? p.speed : DEFAULT_VOICE_SETTINGS.speed,
        pitch: typeof p.pitch === "number" ? p.pitch : DEFAULT_VOICE_SETTINGS.pitch,
        volume: typeof p.volume === "number" ? p.volume : DEFAULT_VOICE_SETTINGS.volume,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_VOICE_SETTINGS };
};

const STATUS_TEXT: Record<VoiceLang, Record<string, string>> = {
  uz: {
    idle: "Men siz bilanman",
    listening: "Men sizni tinglayapman...",
    thinking:"O'ylayapman...",
    speaking:"Gapiryapman...",
    connecting:"Ulanmoqda...",
    cameraOff:"Kamera o'chirilgan",
    error:"Ulanishda muammo yuz berdi",
  },
  en: {
    idle: "I am here with you",
    listening: "I am listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
    connecting: "Connecting...",
    cameraOff: "Camera is off",
    error: "Connection issue occurred",
  },
  ru: {
    idle: "Я с тобой",
    listening: "Я слушаю тебя...",
    thinking: "Думаю...",
    speaking: "Говорю...",
    connecting: "Подключение...",
    cameraOff: "Камера выключена",
    error: "Произошла ошибка соединения",
  },
};

interface PermissionBannerProps {
  kind: "camera" | "mic";
  onRetry: () => void;
  onDismiss: () => void;
}

const PermissionBanner: React.FC<PermissionBannerProps> = ({
  kind,
  onRetry,
  onDismiss,
}) => (
  <div className="vf-perm-banner" role="alert">
    <h3>
      {kind === "camera"
        ? "Kameraga ruxsat berilmadi"
        : "Mikrofonga ruxsat berilmadi"}
    </h3>
    <p>
      {kind === "camera"
        ? "Brauzer sozlamalaridan kamera ruxsatini yoqing va qayta urinib ko'ring."
        : "Brauzer sozlamalaridan mikrofon ruxsatini yoqing va qayta urinib ko'ring."}
    </p>
    <div className="vf-perm-banner-actions">
      <button type="button" className="vf-btn-primary" onClick={onRetry}>
        Ruxsat berish
      </button>
      <button type="button" className="vf-btn-ghost" onClick={onDismiss}>
        Keyinroq
      </button>
    </div>
  </div>
);

interface ChatPanelProps {
  messages: ChatMsg[];
  question: string;
  onQuestionChange: (v: string) => void;
  onSend: () => void;
  thinking: boolean;
  personality: PersonalityId;
  onPersonalityChange: (p: PersonalityId) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  question,
  onQuestionChange,
  onSend,
  thinking,
  personality,
  onPersonalityChange,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="vf-chat">
      <div className="vf-chat-head">💬 Suhbat</div>
      <div className="vf-chat-msgs" ref={listRef}>
        {messages.length === 0 && (
          <div className="vf-msg vf-msg-ai">
            Salom! Savol yozing yoki mikrofon tugmasini bosing.

          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`vf-msg ${m.role === "user" ? "vf-msg-user" : "vf-msg-ai"}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="vf-chat-input-row">
        <textarea
          className="vf-chat-input"
          rows={1}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={onKey}
          placeholder="Savol yozing... (Enter — yuborish)"
          aria-label="Xabar matni"
        />
        <button
          type="button"
          className="vf-chat-send"
          onClick={onSend}
          disabled={thinking || !question.trim()}
          aria-label="Yuborish"
        >
          ➤
        </button>
      </div>
      <div className="vf-chat-persona">
        <span className="vf-label" style={{ marginBottom: 0 }}>Xarakter</span>
        {PERSONALITIES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`vf-pill${personality === p.id ? " vf-pill-active" : ""}`}
            onClick={() => onPersonalityChange(p.id)}
            style={{ padding: "0.25rem 0.55rem", fontSize: "0.62rem" }}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const VirtualFriendView: React.FC<VirtualFriendViewProps> = ({
  onOpenApiKeyModal,
  onNavigate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const questionRef = useRef("");
  const finalSpeechRef = useRef(false);
  const sendQuestionRef = useRef<(() => Promise<void>) | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const eyeRafRef = useRef<number | null>(null);

  const [connecting, setConnecting] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceProviderError, setVoiceProviderError] = useState(false);
  const [faceImage, setFaceImage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(getSelectedVoiceId());
  const [personality, setPersonality] = useState<PersonalityId>("friendly");
  const [lang, setLang] = useState<VoiceLang>(
    () => (localStorage.getItem(LANGUAGE_KEY) as VoiceLang) || "uz",
  );
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(loadVoiceSettings);
  const [muted, setMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [happy, setHappy] = useState(false);
  const [eyeTarget, setEyeTarget] = useState({ x: 0, y: 0 });

  const apiReady = hasApiKey();
  const elevenLabsEnabled = hasElevenLabsApiKey();
  /* ---------- initial connecting state ---------- */
  useEffect(() => {
    const t = window.setTimeout(() => setConnecting(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  /* ---------- speech recognition setup ---------- */
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = LANG_TAGS[lang];
      recognition.onresult = (event: any) => {
        let text = "";
        let hasFinalResult = false;
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          text += event.results[index][0].transcript;
          hasFinalResult = hasFinalResult || event.results[index].isFinal;
        }
        setTranscript(text);
        questionRef.current = text;
        setQuestion(text);
        finalSpeechRef.current = hasFinalResult;

      };
      recognition.onend = () => {
        setListening(false);
        micStreamRef.current?.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
        if (finalSpeechRef.current && questionRef.current.trim()) {
          window.setTimeout(() => void sendQuestionRef.current?.(), 350);
        }
        finalSpeechRef.current = false;
      };
      recognition.onerror = (event: any) => {
        setListening(false);
        micStreamRef.current?.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
        if (event.error !== "aborted") {
          setError(
            "Mikrofon ishlamadi. Brauzerda mikrofon ruxsatini tekshiring.",
          );
        }
      };
      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      stopElevenLabsAudio();
      if (eyeRafRef.current) cancelAnimationFrame(eyeRafRef.current);
    };
  }, []);

  /* ---------- camera stream binding ---------- */
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      if (faceVideoRef.current)
        faceVideoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  /* ---------- language → recognition ---------- */
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANG_TAGS[lang];
    }
  }, [lang]);

  /* ---------- eye contact (pointer-based tracking) ---------- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 1.5));
      if (eyeRafRef.current) cancelAnimationFrame(eyeRafRef.current);
      eyeRafRef.current = requestAnimationFrame(() => {
        setEyeTarget({ x, y });
      });
    };
    const onLeave = () => setEyeTarget({ x: 0, y: 0 });
    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (eyeRafRef.current) cancelAnimationFrame(eyeRafRef.current);
    };
  }, []);

  /* ---------- happy flash after response ---------- */
  useEffect(() => {
    if (!happy) return;
    const t = window.setTimeout(() => setHappy(false), 2600);
    return () => window.clearTimeout(t);
  }, [happy]);

  /* ---------- end-confirm auto hide ---------- */
  useEffect(() => {
    if (!confirmEnd) return;
    const t = window.setTimeout(() => setConfirmEnd(false), 6000);
    return () => window.clearTimeout(t);
  }, [confirmEnd]);
  /* ================= HANDLERS (existing behavior preserved) ================= */
  const captureFrame = (): string | undefined => {
    const video = videoRef.current;
    if (!video || !cameraOn || video.readyState < 2) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  };

  const handleFaceImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setFaceImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (l: VoiceLang) => {
    setLang(l);
    localStorage.setItem(LANGUAGE_KEY, l);
    if (recognitionRef.current) recognitionRef.current.lang = LANG_TAGS[l];
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setSelectedVoiceId(voiceId);
  };

  const handleSettingsChange = (s: VoiceSettings) => {
    setVoiceSettings(s);
    try {
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  const speak = async (text: string) => {
    if (!text || muted) return;
    try {
      setVoiceLoading(true);
      setVoiceProviderError(false);
      setSpeaking(true);
      await speakWithElevenLabs(
        text,
        selectedVoice,
        () => {
          setVoiceLoading(false);
          setSpeaking(true);
        },
        () => {
          setVoiceLoading(false);
          setSpeaking(false);
        },
        (err: any) => {
          console.warn("ElevenLabs voice fallback:", err);
          setVoiceProviderError(true);
          setVoiceLoading(false);
          setSpeaking(false);
        },
        {
          rate: voiceSettings.speed,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume,
          lang: LANG_TAGS[lang],
          speed: voiceSettings.speed,
        },
      );
    } catch {
      setVoiceProviderError(true);
      setSpeaking(false);
    } finally {
      setVoiceLoading(false);
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (next) stopElevenLabsAudio();
      return next;
    });
  };

  const shutdownMedia = () => {
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    stopElevenLabsAudio();
  };

  const handleEnd = () => {
    shutdownMedia();
    onNavigate(AppView.DASHBOARD);
  };
  const sendQuestion = async () => {
    const text = questionRef.current.trim() || question.trim();
    if (!text || thinking) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setThinking(true);
    setError("");
    setAnswer("");
    setMessages((prev) => [...prev.slice(-7), { role: "user", text }as ChatMsg]);
    try {
      const lower = text.toLowerCase();
      const navigation: Array<[string, AppView]> = [
        ["playground", AppView.PLAYGROUND],
        ["hujjat", AppView.DOCS],
        ["tarjimon", AppView.TRANSLATOR],
        ["rasm", AppView.IMAGE_GEN],
        ["ovozli", AppView.VOICE],
        ["chat", AppView.CHAT],
      ];
      const target = navigation.find(([keyword]) => lower.includes(keyword));
      if (target && /och|o't|ut|kir|bor/i.test(lower)) {
        const message = `${target[0]} bolimini ochyapman.`;
        setAnswer(message);
        setMessages((prev) => [...prev.slice(-7), { role: "ai", text: message }as ChatMsg]);
        void speak(message);
        onNavigate(target[1]);
        return;
      }
      const personalityInstructions: Record<string, string> = {
        friendly:
          "Siz samimiy, iliq va do'stona virtual hamrohsiz. Foydalanuvchiga har doim dalda bering va samimiy so'zlar bilan gapiring.",
        professional:
          "Siz professional, jiddiy va aniq ekspert-maslahatchisiz. Fikrlarni faktlar va amaliy tavsiyalar bilan ifodalang.",
        funny:
          "Siz hazilkash, quvnoq va pozitiv virtual do'stsiz. Javoblaringizda engil hazil va ko'tarinki kayfiyat bo'lsin.",
        teacher:
          "Siz sabrli, tushunarli va pedagogik qobiliyatga ega ustozsiz. Murakkab tushunchalarni oson misollar bilan tushuntiring.",
        motivator:
          "Siz kuchli ruhlantiruvchi motivatorsiz. Foydalanuvchini yangi maqsadlar va yutuqlarga ilhomlantiring.",
      };

      const langInstruction =
        lang === "uz"
          ? "O'zbek tilida tabiiy gapiring."
          : lang === "ru"
            ? "Отвечайте на русском языке естественно и понятно."
            : "Respond in English naturally and warmly.";

      const parts: any[] = [
        {
          text: `Siz SuperAI virtual do'stisiz. ${personalityInstructions[personality]} ${langInstruction} Javobni ovoz chiqarib o'qish uchun oddiy matn ko'rinishida yozing: markdown, ro'yxat, emoji, kod va ortiqcha sarlavhalar ishlatmang. Qisqa tabiiy jumlalar, vergul va nuqtalardan foydalaning. O'zingizni haqiqiy odam deb da'vo qilmang. Foydalanuvchi savoli: ${text}`,
        },
      ];
      const frame = captureFrame();
      if (frame) {
        const [header, data] = frame.split(",");
        parts.push({
          inlineData: {
            mimeType: header.match(/data:(.*);base64/)?.[1] || "image/jpeg",
            data,
          },
        });
        parts[0].text +=
          " Kamera kadridagi ko'rinadigan narsalarni ham hisobga oling, lekin odam haqida nozik yoki taxminiy xulosalar qilmang.";
      }
      const result = await askGemini({
        parts,
        systemInstruction:
          "Siz SuperAI virtual do'stisiz. O'zbek tilida haqiqiy suhbatdosh kabi ravon, iliq va tabiiy gapiring. Javobni ovoz chiqarib o'qish uchun oddiy matn ko'rinishida yozing: markdown, ro'yxat, emoji, kod va ortiqcha sarlavhalar ishlatmang. Qisqa tabiiy jumlalar, vergul va nuqtalardan foydalaning. O'zingizni haqiqiy odam deb da'vo qilmang.",
        maxOutputTokens: 1024,
      });
      setAnswer(result);
      setMessages((prev) => [...prev.slice(-7), { role: "ai", text: result }as ChatMsg]);
      setHappy(personality === "friendly" || personality === "teacher");
      void speak(result);
    } catch (requestError: any) {
      setError(requestError?.message || "Javob olishda xatolik yuz berdi.");
    } finally {
      setThinking(false);
      setTranscript("");
    }
  };

  sendQuestionRef.current = sendQuestion;
  /* ------------------ derived UI state ------------------ */
  const statusKey = connecting
    ? "connecting"
    : thinking
      ? "thinking"
      : speaking
        ? "speaking"
        : listening
          ? "listening"
          : error
            ? "error"
            : "idle";
  const statusText = STATUS_TEXT[lang][statusKey];
  const avatarState: SuperAIAvatarState = thinking
    ? "thinking"
    : speaking
      ? "speaking"
      : listening
        ? "listening"
        : happy
          ? "happy"
          : error
            ? "confused"
            : "idle";
  const greetingText =
    lang === "uz"
      ? "Salom! Bugun qanday yordam berishim mumkin?"
      : lang === "en"
        ? "Hello! How can I help you today?"
        : "Привет! Чем я могу помочь тебе сегодня?";

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(insecureMediaMessage);
      return;
    }
    setCameraBlocked(false);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
        setCameraBlocked(true);
      } else {
        setError("Kameraga ruxsat berilmadi. Brauzer sozlamalaridan kamera ruxsatini yoqing.");
      }
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError("Bu brauzer ovozli buyruqlarni qo'llab-quvvatlamaydi.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript("");
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setError(insecureMediaMessage);
          return;
        }
        setError("");
        setMicBlocked(false);
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        try {
          recognitionRef.current.lang = LANG_TAGS[lang];
          recognitionRef.current.start();
          setListening(true);
        } catch {
          micStreamRef.current?.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
          setListening(false);
          setError("Mikrofonni yoqib bo'lmadi. Qayta urinib ko'ring.");
        }
      } catch (err: any) {
        micStreamRef.current?.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
        setListening(false);
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setMicBlocked(true);
        } else {
          setError("Mikrofonni yoqib bo'lmadi. Mikrofon ruxsatini bering va qayta urinib ko'ring.");
        }
      }
    }
  };
  return (
    <div className="vf-root">
      {/* ===== TOP BAR ===== */}
      <header className="vf-topbar">
        <button
          type="button"
          className="vf-btn-icon"
          onClick={() => setConfirmEnd(true)}
          aria-label="Orqaga (Virtual Do'stdan chiqish)"
          title="Orqaga"
        >
          ←
        </button>
        <div className="vf-title">
          Virtual Do'st
          <small>SuperAI · AI bilan tabiiy suhbat</small>
        </div>
        <button
          type="button"
          className={`vf-online${apiReady ? "" : " vf-warn"}`}
          onClick={!apiReady ? onOpenApiKeyModal : undefined}
          aria-label={apiReady ? "Online" : "API kaliti sozlanmagan"}
          title={apiReady ? "Online" : "API kalitini sozlash"}
        >
          <span role="status">{apiReady ? "● Online" : "● API sozlanmagan"}</span>
        </button>
        <button
          type="button"
          className="vf-topbar-select hidden md:inline-flex"
          onClick={() => setShowPersonality(true)}
          aria-label="Xarakterni tanlash"
        >
          {PERSONALITIES.find((p) => p.id === personality)?.icon} {getPersonalityName(personality)} ▾
        </button>
        <select
          className="vf-topbar-select hidden md:inline-flex"
          value={lang}
          onChange={(e) => handleLanguageChange(e.target.value as VoiceLang)}
          aria-label="Tilni tanlash"
          title="Til"
        >
          <option value="uz">O'zbekcha</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
        <button
          type="button"
          className="vf-btn-icon"
          onClick={() => setShowVoiceSettings(true)}
          aria-label="Ovoz sozlamalari"
          title="Ovoz sozlamalari"
        >
          ⚙️
        </button>
      </header>

      {/* ===== MAIN VIDEO STAGE ===== */}
      <main className="vf-stage-wrap">
        <div className="vf-stage" ref={stageRef}>
          {/* cinematic background */}
          <div className="vf-stage-bg" aria-hidden="true">
            <div className="vf-aurora vf-aurora-1" />
            <div className="vf-aurora vf-aurora-2" />
            <div className="vf-aurora vf-aurora-3" />
            <div className="vf-grid-floor" />
          </div>

          {/* user camera fills the stage as immersive backdrop */}
          {cameraOn && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="vf-camera-bg"
              aria-hidden="true"
            />
          )}
          {!cameraOn && (
            <div className="vf-camera-off-fallback" aria-hidden="true">
              <span className="vf-camera-ico">📷</span>
              <span>{STATUS_TEXT[lang].cameraOff || "Kamera o'chirilgan"}</span>
            </div>
          )}
          <div className="vf-stage-shade" />

          {/* status pill */}
          <div className={`vf-status-pill vf-st-${statusKey}`} role="status" aria-live="polite">
            <span className="vf-status-led" aria-hidden="true" />
            <span>{statusText}</span>
          </div>

          {/* floating AI identity panel */}
          <div className="vf-identity">
            <span className="vf-identity-avatar" aria-hidden="true">👤</span>
            <div>
              <div className="vf-identity-name">SuperAI Assistant</div>
              <div className="vf-identity-sub">
                ● {getPersonalityName(personality)}
              </div>
            </div>
            <label
              className="vf-btn-icon"
              style={{ width: "30px", height: "30px", fontSize: "0.8rem", cursor: "pointer" }}
              title="Yuz rasmini tanlash"
              aria-label="Yuz rasmini tanlash"
            >
              🖼
              <input
                type="file"
                accept="image/*"
                onChange={handleFaceImage}
                className="hidden"
              />
            </label>
          </div>

          {/* human-like AI avatar */}
          <div className={`vf-avatar-zone vf-zone-${statusKey}`}>
            <div className="vf-halo" aria-hidden="true" />
            <div className="vf-avatar-wrap">
              <SuperAIAvatar state={avatarState} eyeX={eyeTarget.x} eyeY={eyeTarget.y} />
            </div>
          </div>

          {/* live voice activity waveform */}
          {(speaking || listening || thinking) && (
            <div className="vf-waveform-zone" aria-hidden="true">
              {speaking && (
                <>
                  <span className="vf-voice-tag">
                    {elevenLabsEnabled && !voiceProviderError ? "AI ovoz" : "Brauzer ovozi"}
                  </span>
                  <VoiceWaveform active tone="ai" bars={22} />
                </>
              )}
              {!speaking && listening && (
                <>
                  <span className="vf-voice-tag">Eshitilmoqda</span>
                  <VoiceWaveform active tone="user" bars={18} />
                </>
              )}
              {thinking && <span className="vf-voice-tag">Tahlil...</span>}
            </div>
          )}
          {/* self-view picture-in-picture */}
          <div className="vf-selfview">
            {cameraOn ? (
              <video ref={faceVideoRef} autoPlay muted playsInline />
            ) : faceImage ? (
              <img src={faceImage} alt="Sizning yuzingiz" />
            ) : (
              <div className="vf-selfview-fallback">
                <span className="vf-selfview-initial" aria-hidden="true">S</span>
                <span>Kamera o'chirilgan</span>
              </div>
            )}
            <span className="vf-selfview-tag" aria-hidden="true">Siz</span>
          </div>

          {/* floating conversation overlay */}
          <div className="vf-conversation" aria-live="polite">
            {thinking && (
              <div className="vf-bubble vf-bubble-ai">
                <div className="vf-bubble-who">SuperAI</div>
                <span className="vf-typing" aria-label="Yozilmoqda"><span /><span /><span /></span>
              </div>
            )}
            {!thinking && answer && (
              <div className="vf-bubble vf-bubble-ai">
                <div className="vf-bubble-who">SuperAI</div>
                {answer}
              </div>
            )}
            {!answer && !thinking && messages.length === 0 && (
              <div className="vf-bubble vf-bubble-ai">
                <div className="vf-bubble-who">SuperAI</div>
                {greetingText}
              </div>
            )}
            {transcript && (
              <div className="vf-bubble vf-bubble-user">
                <div className="vf-bubble-who">Siz</div>
                {transcript}
              </div>
            )}
            {error && (
              <div
                className="vf-bubble vf-bubble-user"
                style={{ borderColor: "rgba(251,113,133,0.5)", color: "#fecdd3" }}
              >
                <div className="vf-bubble-who">Xatolik</div>
                {error}
              </div>
            )}
          </div>

          {/* permission denied states */}
          {cameraBlocked && (
            <PermissionBanner
              kind="camera"
              onRetry={() => void toggleCamera()}
              onDismiss={() => setCameraBlocked(false)}
            />
          )}
          {micBlocked && (
            <PermissionBanner
              kind="mic"
              onRetry={() => {
                setMicBlocked(false);
                void toggleListening();
              }}
              onDismiss={() => setMicBlocked(false)}
            />
          )}

          {/* end confirm toast */}
          {confirmEnd && (
            <div className="vf-toast" role="alertdialog" aria-label="Chiqishni tasdiqlash">
              <span>Virtual Do'stdan chiqasizmi?</span>
              <button type="button" onClick={handleEnd}>Ha</button>
              <button type="button" onClick={() => setConfirmEnd(false)}>Yo'q</button>
            </div>
          )}

          {/* chat overlay */}
          {showChat && (
            <ChatPanel
              messages={messages}
              question={question}
              onQuestionChange={(v) => {
                setQuestion(v);
                questionRef.current = v;
              }}
              onSend={() => void sendQuestion()}
              thinking={thinking}
              personality={personality}
              onPersonalityChange={setPersonality}
            />
          )}
          {/* floating control dock */}
          <nav className="vf-controls" aria-label="Video boshqaruv tugmalari">
            <button
              type="button"
              className={`vf-ctl${listening ? " vf-ctl-rec" : ""}`}
              onClick={() => void toggleListening()}
              aria-label={listening ? "Mikrofonni o'chirish" : "Mikrofonda gapirish"}
              title="Mikrofon"
            >
              🎙
              <span className="vf-ctl-label">Mikrofon</span>
            </button>
            <button
              type="button"
              className={`vf-ctl${cameraOn ? " vf-ctl-on" : ""}`}
              onClick={() => void toggleCamera()}
              aria-label={cameraOn ? "Kamerani o'chirish" : "Kamerani yoqish"}
              title="Kamera"
            >
              📷
              <span className="vf-ctl-label">Kamera</span>
            </button>
            <button
              type="button"
              className={`vf-ctl${muted ? " vf-ctl-danger" : " vf-ctl-on"}`}
              onClick={toggleMute}
              aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              title="Ovoz / Mute"
            >
              {muted ? "🔇" : "🔊"}
              <span className="vf-ctl-label">{muted ? "Jim" : "Ovoz"}</span>
            </button>
            <span className="vf-ctl-sep" aria-hidden="true" />
            <button
              type="button"
              className={`vf-ctl${showChat ? " vf-ctl-on" : ""}`}
              onClick={() => setShowChat((v) => !v)}
              aria-label="Chat panelini ochish/yopish"
              title="Chat"
            >
              💬
              <span className="vf-ctl-label">Chat</span>
            </button>
            <button
              type="button"
              className={`vf-ctl${showVoiceSettings ? " vf-ctl-on" : ""}`}
              onClick={() => setShowVoiceSettings(true)}
              aria-label="Ovoz sozlamalarini ochish"
              title="Ovoz sozlamalari"
            >
              🎛
              <span className="vf-ctl-label">Sozlamalar</span>
            </button>
            <span className="vf-ctl-sep" aria-hidden="true" />
            <button
              type="button"
              className="vf-ctl vf-ctl-danger"
              onClick={() => setConfirmEnd(true)}
              aria-label="Suhbatni tugatish"
              title="Suhbatni tugatish"
            >
              ✕
              <span className="vf-ctl-label">Chiqish</span>
            </button>
          </nav>
        </div>
      </main>

      {/* ===== MODALS ===== */}
      <VoiceSettingsModal
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        language={lang}
        onLanguageChange={handleLanguageChange}
        selectedVoice={selectedVoice}
        onVoiceChange={handleVoiceChange}
        settings={voiceSettings}
        onSettingsChange={handleSettingsChange}
      />
      <PersonalitySelectorModal
        isOpen={showPersonality}
        onClose={() => setShowPersonality(false)}
        current={personality}
        onSelect={setPersonality}
      />
    </div>
  );
};

export default VirtualFriendView;