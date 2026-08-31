import React, { useState, useEffect, useRef } from "react";
import { SYSTEM_INSTRUCTION } from "../constants";
import { askGemini, hasApiKey, streamChat } from "../services/geminiService";
import {
  DEFAULT_ELEVENLABS_VOICES,
  getSelectedVoiceId,
  setSelectedVoiceId,
  speakWithElevenLabs,
  stopElevenLabsAudio,
  hasElevenLabsApiKey,
} from "../services/elevenLabsService";

interface VoiceViewProps {
  onOpenApiKeyModal: () => void;
}

const VoiceView: React.FC<VoiceViewProps> = ({ onOpenApiKeyModal }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [currentVoiceId, setCurrentVoiceId] = useState(getSelectedVoiceId());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptionRef = useRef("");
  const autoStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "uz-UZ";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        transcriptionRef.current = text;
        setTranscription(text);
        if (
          finalTranscript.trim() &&
          mediaRecorderRef.current?.state === "recording"
        ) {
          if (autoStopTimerRef.current)
            window.clearTimeout(autoStopTimerRef.current);
          autoStopTimerRef.current = window.setTimeout(
            () => stopRecording(),
            250,
          );
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stopElevenLabsAudio();
    };
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const handleSpeak = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    setIsSpeaking(true);

    if (useElevenLabs && hasElevenLabsApiKey()) {
      await speakWithElevenLabs(
        textToSpeak,
        currentVoiceId,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false),
      );
    } else {
      if (!("speechSynthesis" in window)) {
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "uz-UZ";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.toLowerCase().startsWith("uz")) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("ru")) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("en"));
      if (voice) utterance.voice = voice;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setCurrentVoiceId(voiceId);
    setSelectedVoiceId(voiceId);
  };

  const startRecording = async () => {
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current);
        // Mikrofonni darhol bo'shatamiz — javob kutish shart emas
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          /* allaqachon faol */
        }
      }
    } catch (err) {
      console.error("Mikrofonni yoqishda xatolik:", err);
      alert(
        "Mikrofonni yoqib bo'lmadi. Iltimos brauzeringizda mikrofonga ruxsat bering.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setResponse("");

    try {
      const spokenText = transcriptionRef.current.trim();
      if (spokenText) {
        const responseText = await streamChat(
          spokenText,
          undefined,
          [],
          (chunk) => setResponse((current) => current + chunk),
          {
            mode: "fast",
            systemInstruction:
              SYSTEM_INSTRUCTION +
              " Siz ovozli rejimdasiz. Javobni insondek tabiiy, qisqa va aniq bering. Darhol asosiy javobni ayting.",
            maxOutputTokens: 512,
            timeoutMs: 30000,
          },
        );
        setResponse(responseText);
        await handleSpeak(responseText);
        return;
      }
      const parts: any[] = [];

      // Matn aniqlangan bo'lsa — uni yuboramiz (eng tez va aniq yo'l).
      // Matn bo'lmasa — audioni to'g'ridan-to'g'ri modelga yuboramiz.
      if (!spokenText && audioBlob.size > 0) {
        const base64Audio = await blobToBase64(audioBlob);
        if (base64Audio) {
          parts.push({
            inlineData: {
              mimeType: audioBlob.type || "audio/webm",
              data: base64Audio,
            },
          });
        }
      }

      parts.push({
        text:
          spokenText ||
          "Foydalanuvchi ovozli xabar yubordi. Qisqa va aniq javob ber.",
      });

      const responseText = await askGemini({
        parts,
        systemInstruction:
          SYSTEM_INSTRUCTION +
          " Siz ovozli rejimdasiz. Javobingiz qisqa, aniq va tushunarli bo'lsin.",
        maxOutputTokens: 512,
        timeoutMs: 30000,
      });

      setResponse(responseText);
      await handleSpeak(responseText);
    } catch (err: any) {
      console.error("Audio qayta ishlashda xatolik:", err);
      setResponse("⚠️ " + (err?.message || "Javob olishda xatolik yuz berdi."));
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center space-y-6 overflow-y-auto custom-scrollbar">
      {/* Voice engine and model selector bar */}
      <div className="flex items-center gap-3 flex-wrap justify-center glass px-4 py-2 rounded-2xl border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">Ovoz texnologiyasi:</span>
          <button
            onClick={() => setUseElevenLabs(!useElevenLabs)}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
              useElevenLabs
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 text-slate-400 border border-white/10"
            }`}
          >
            <span>🎙 ElevenLabs HD</span>
            <span
              className={`w-2 h-2 rounded-full ${hasElevenLabsApiKey() ? "bg-emerald-400" : "bg-amber-400"}`}
            />
          </button>
        </div>

        {useElevenLabs && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Ovoz:</span>
            <select
              value={currentVoiceId}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-2.5 py-1 text-slate-200 text-xs font-semibold outline-none"
            >
              {DEFAULT_ELEVENLABS_VOICES.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onOpenApiKeyModal}
          className="text-slate-400 hover:text-white underline font-semibold ml-2"
        >
          ⚙️ Sozlamalar
        </button>
      </div>

      <div className="relative my-2">
        <div
          className={`w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRecording
              ? "bg-red-600 scale-105 shadow-[0_0_80px_rgba(220,38,38,0.7)]"
              : isSpeaking
                ? "bg-cyan-600 scale-105 shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-pulse"
                : isProcessing
                  ? "bg-blue-600 scale-100 shadow-[0_0_40px_rgba(37,99,235,0.5)]"
                  : "bg-slate-800 border border-slate-700"
          }`}
        >
          {isRecording ? (
            <div className="flex space-x-1.5 items-center">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-white rounded-full animate-bounce h-12 md:h-16"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          ) : isSpeaking ? (
            <div className="flex space-x-1.5 items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-2 bg-white rounded-full animate-bounce h-8 md:h-12"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          ) : isProcessing ? (
            <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-16 h-16 md:w-20 md:h-20 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="max-w-lg space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold">
          {isRecording
            ? "Sizni eshityapman..."
            : isSpeaking
              ? "SuperAI gapirmoqda..."
              : isProcessing
                ? "Qayta ishlanmoqda..."
                : "Ovozli Muloqot Rejimi"}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {isRecording
            ? "SuperAI bilan jonli muloqot ketmoqda. Marhamat, gapiring."
            : isSpeaking
              ? "ElevenLabs tabiiy ovozi orqali javob berilmoqda."
              : isProcessing
                ? "Javob tayyorlanmoqda va ovozlantirilmoqda..."
                : "Ultra-tezkor va tabiiy ovozli muloqot. Tugmani bosib gapiring."}
        </p>

        {transcription && (
          <div className="p-4 glass rounded-2xl text-sm italic text-blue-100 max-h-32 overflow-y-auto border border-blue-500/20 shadow-inner">
            <strong className="text-blue-400 not-italic">Siz:</strong> "
            {transcription}"
          </div>
        )}

        {response && (
          <div className="p-4 glass rounded-2xl text-sm text-emerald-100 max-h-36 overflow-y-auto border border-emerald-500/20 shadow-inner relative group">
            <div className="flex items-start justify-between gap-2">
              <div className="text-left flex-1">
                <strong className="text-emerald-400">SuperAI:</strong>{" "}
                {response}
              </div>
              <button
                onClick={() => handleSpeak(response)}
                disabled={isSpeaking}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 transition"
                title="Qayta o'qish"
              >
                🔊 Qayta tinglash
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`px-10 md:px-14 py-4 rounded-2xl font-black text-base md:text-lg shadow-2xl transition-all active:scale-95 transform ${
            isRecording
              ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white"
              : isProcessing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white hover:brightness-110 shadow-blue-900/40"
          }`}
        >
          {isProcessing
            ? "Ishlanmoqda..."
            : isRecording
              ? "To'xtatish"
              : "Muloqotni boshlash"}
        </button>

        {isSpeaking && (
          <button
            onClick={() => {
              stopElevenLabsAudio();
              setIsSpeaking(false);
            }}
            className="px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-white/10 transition"
          >
            ⏹ Ovozni to'xtatish
          </button>
        )}
      </div>

      <div className="flex items-center space-x-6 text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold pt-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          ElevenLabs Natural Voice
        </span>
        <span>O'zbek / Rus / Ingliz</span>
        <span>Gemini AI</span>
      </div>
    </div>
  );
};

export default VoiceView;
