import { ElevenLabsVoice, ElevenLabsSettings } from "../types";

const ELEVENLABS_KEY_STORAGE = "superai_elevenlabs_api_key";
const ELEVENLABS_VOICE_STORAGE = "superai_elevenlabs_voice_id";

export const DEFAULT_ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam (Erkak)",
    gender: "male",
    description: "Chuqur, professional va ravon ovoz",
    category: "premade",
  },
  {
    voice_id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George (Erkak)",
    gender: "male",
    description: "Iliq, samimiy va ishonchli ovoz",
    category: "premade",
  },
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella (Ayol)",
    gender: "female",
    description: "Muloyim, aniq va yoqimli ovoz",
    category: "premade",
  },
  {
    voice_id: "cgSgspJ2msm6clMCkdW9",
    name: "Jessica (Ayol)",
    gender: "female",
    description: "Yorqin, ifodali va jonli ovoz",
    category: "premade",
  },
  {
    voice_id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura (Ayol)",
    gender: "female",
    description: "Xushmuomala, taqdimot va yangiliklar ovozi",
    category: "premade",
  },
  {
    voice_id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie (Erkak)",
    gender: "male",
    description: "Do'stona va erkin suhbatdosh ovoz",
    category: "premade",
  },
  {
    voice_id: "nPczCjzI2devNBz1zQrb",
    name: "Brian (Erkak)",
    gender: "male",
    description: "Chuqur, salmoqli hikoyanavis ovoz",
    category: "premade",
  },
  {
    voice_id: "pFZP5JQG7iQjIQuC4Bku",
    name: "Lily (Ayol)",
    gender: "female",
    description: "Iliq va muloyim qiz ovozi",
    category: "premade",
  },
  {
    voice_id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel (Erkak)",
    gender: "male",
    description: "Professional diktor va suxandon ovoz",
    category: "premade",
  },
  {
    voice_id: "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam (Erkak)",
    gender: "male",
    description: "Yosh, faol va baquvvat ovoz",
    category: "premade",
  },
  {
    voice_id: "XB0fDUnXU5powFXDhCwa",
    name: "Charlotte (Ayol)",
    gender: "female",
    description: "Xotirjam va ravon talaffuz",
    category: "premade",
  },
];

let currentAudioElement: HTMLAudioElement | null = null;

export const getElevenLabsApiKey = (): string => {
  const local = localStorage.getItem(ELEVENLABS_KEY_STORAGE);
  if (local && local.trim()) return local.trim();
  return (import.meta.env.VITE_ELEVENLABS_API_KEY || "").trim();
};

export const setElevenLabsApiKey = (key: string): void => {
  if (key && key.trim()) {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(ELEVENLABS_KEY_STORAGE);
  }
};

export const hasElevenLabsApiKey = (): boolean => {
  return Boolean(getElevenLabsApiKey());
};

export const getSelectedVoiceId = (): string => {
  const local = localStorage.getItem(ELEVENLABS_VOICE_STORAGE);
  if (local && local.trim()) return local.trim();
  return (
    import.meta.env.VITE_ELEVENLABS_VOICE_ID ||
    DEFAULT_ELEVENLABS_VOICES[0].voice_id
  );
};

export const setSelectedVoiceId = (voiceId: string): void => {
  localStorage.setItem(ELEVENLABS_VOICE_STORAGE, voiceId);
};

export const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, " Kod namunasi. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, ". ")
    .replace(/[*_~>#]/g, "")
    .replace(/[😀-🙏🌀-🫿✨🚀💡🤖🔥⭐👍❤️🎉💻🎯]/gu, "")
    .replace(/\s*[:;]\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
};

export const stopElevenLabsAudio = (): void => {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      /* ignore */
    }
    currentAudioElement = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

export const isAudioPlaying = (): boolean => {
  return Boolean(
    (currentAudioElement && !currentAudioElement.paused) ||
    (window.speechSynthesis && window.speechSynthesis.speaking),
  );
};

export interface SpeechPlaybackOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export const speakWithBrowserFallback = (
  text: string,
  onEnd?: () => void,
  onError?: (err: any) => void,
  options?: SpeechPlaybackOptions,
): void => {
  if (!("speechSynthesis" in window)) {
    if (onError)
      onError(new Error("Brauzer ovoz sintezini qo'llab-quvvatlamaydi"));
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
  utterance.lang = options?.lang ?? "uz-UZ";
  utterance.rate = options?.rate ?? 0.95;
  utterance.pitch = options?.pitch ?? 0.95;
  if (typeof options?.volume === "number") {
    utterance.volume = Math.min(1, Math.max(0, options.volume));
  }

  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang.toLowerCase().startsWith("uz")) ||
    voices.find((v) =>
      /david|mark|daniel|alex|george|male|erkak/i.test(v.name),
    ) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("ru")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    null;

  if (voice) utterance.voice = voice;
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    if (onError) onError(e);
  };
  window.speechSynthesis.speak(utterance);
};

export const synthesizeSpeechAudio = async (
  text: string,
  voiceId?: string,
  settings?: Partial<ElevenLabsSettings>,
): Promise<Blob> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ElevenLabs API kaliti mavjud emas");
  }

  const selectedVoice = voiceId || getSelectedVoiceId();
  const speechText = cleanTextForSpeech(text);

  if (!speechText) {
    throw new Error("Ovozga aylantirish uchun matn bo'sh");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: speechText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings?.stability ?? 0.38,
          similarity_boost: settings?.similarity_boost ?? 0.82,
          style: settings?.style ?? 0.35,
          use_speaker_boost: settings?.use_speaker_boost ?? true,
          ...(settings && typeof (settings as any).speed === "number"
            ? { speed: (settings as any).speed }
            : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    let errorDetail = "ElevenLabs ovoz yaratishda xatolik";
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson?.detail?.message ||
        errorJson?.detail ||
        errorJson?.message ||
        `Xatolik statusi: ${response.status}`;
    } catch {
      errorDetail = `Server xatosi: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return await response.blob();
};

export const speakWithElevenLabs = async (
  text: string,
  voiceId?: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void,
  playback?: SpeechPlaybackOptions & { speed?: number },
): Promise<HTMLAudioElement | null> => {
  stopElevenLabsAudio();

  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    speakWithBrowserFallback(text, onEnd, onError, playback);
    if (onStart) onStart();
    return null;
  }

  try {
    const audioBlob = await synthesizeSpeechAudio(
      text,
      voiceId,
      playback as Partial<ElevenLabsSettings>,
    );
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    if (typeof playback?.volume === "number") {
      audio.volume = Math.min(1, Math.max(0, playback.volume));
    }

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      console.warn(
        "ElevenLabs audio play error, falling back to browser speech",
        e,
      );
      speakWithBrowserFallback(text, onEnd, onError, playback);
    };

    await audio.play();
    return audio;
  } catch (err: any) {
    console.warn(
      "ElevenLabs synthesis error, falling back to browser speech:",
      err,
    );
    speakWithBrowserFallback(text, onEnd, onError, playback);
    if (onError) onError(err);
    return null;
  }
};

export const testElevenLabsConnection = async (
  keyToTest?: string,
): Promise<{ success: boolean; message: string }> => {
  const key = keyToTest || getElevenLabsApiKey();
  if (!key) {
    return { success: false, message: "ElevenLabs API kaliti kiritilmagan" };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_ELEVENLABS_VOICES[0].voice_id}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": key,
        },
        body: JSON.stringify({
          text: "Salom",
          model_id: "eleven_multilingual_v2",
        }),
      },
    );

    if (response.ok) {
      return {
        success: true,
        message: "ElevenLabs API muvaffaqiyatli ulandi! Ovoz sintezi faol.",
      };
    }

    const err = await response.json().catch(() => ({}));
    const message =
      err?.detail?.message ||
      err?.detail ||
      err?.message ||
      `Server javobi: ${response.status}`;
    return { success: false, message };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Tarmoq xatoligi yoki ulanib bo'lmadi",
    };
  }
};
