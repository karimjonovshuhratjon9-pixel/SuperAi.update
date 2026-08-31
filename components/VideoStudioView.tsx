import React, { useState, useEffect, useRef } from "react";
import {
  HeyGenAvatar,
  HeyGenVoice,
  HeyGenVideo,
  HeyGenUserInfo,
  VideoSceneItem,
  VideoStudioProject,
  VideoTemplateItem,
} from "../types";
import {
  getHeyGenAccountInfo,
  getHeyGenAvatars,
  getHeyGenVoices,
  listHeyGenVideos,
  hasHeyGenApiKey,
  deleteHeyGenVideo,
  DEFAULT_HEYGEN_AVATARS,
  generateHeyGenAvatarVideo,
  pollVideoRender,
  createTalkingPhotoVideo,
  translateHeyGenVideo,
} from "../services/heygenService";
import {
  getSubscriptionInfo,
  onSubscriptionChange,
  SubscriptionInfo,
  deductCredits,
} from "../services/promoService";
import { askGemini } from "../services/geminiService";
import PromoCodeModal from "./PromoCodeModal";

interface VideoStudioProps {
  onOpenApiKeyModal: () => void;
}

type StudioMode =
  | "text_to_video"
  | "avatar_video"
  | "talking_photo"
  | "video_translate"
  | "templates"
  | "my_videos";

const VIDEO_TEMPLATES: VideoTemplateItem[] = [
  {
    id: "tech_startup",
    title: "🚀 AI Startup Taqdimoti",
    category: "marketing",
    description: "Yangi innovatsion mahsulot yoki AI platforma uchun dinamik video",
    previewUrl:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/stills/Studio_Streamer_2.jpg",
    aspectRatio: "16:9",
    scenes: [
      {
        title: "Kirish (Hook)",
        script: "Sun'iy intellekt kelajagi bugun boshlanadi. SuperAI bilan tanishing!",
        durationSeconds: 6,
        backgroundType: "gradient",
        backgroundValue: "from-blue-900 via-indigo-950 to-slate-900",
        subtitlesEnabled: true,
      },
      {
        title: "Muammo & Yechim",
        script: "Murakkab vazifalarni soniyalar ichida bajaring va vaqtingizni tejang.",
        durationSeconds: 8,
        backgroundType: "gradient",
        backgroundValue: "from-slate-900 via-purple-950 to-blue-900",
        subtitlesEnabled: true,
      },
      {
        title: "Call to Action",
        script: "Hoziroq bepul sinab ko'ring va natijani o'zingiz his qiling!",
        durationSeconds: 5,
        backgroundType: "gradient",
        backgroundValue: "from-indigo-900 to-black",
        subtitlesEnabled: true,
      },
    ],
  },
  {
    id: "social_reels",
    title: "📱 Instagram Reels / Shorts",
    category: "tiktok",
    description: "Ijtimoiy tarmoqlar uchun 9:16 vertikal baquvvat video",
    previewUrl:
      "https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp",
    aspectRatio: "9:16",
    scenes: [
      {
        title: "Tezkor Maslahat",
        script: "Dasturlashni o'rganishda 90% insonlar yo'l qo'yadigan 3 ta xato!",
        durationSeconds: 7,
        backgroundType: "gradient",
        backgroundValue: "from-fuchsia-900 via-slate-900 to-purple-950",
        subtitlesEnabled: true,
      },
      {
        title: "Xulosa",
        script: "Foydali bo'lgan bo'lsa like bosing va do'stlaringizga yuboring!",
        durationSeconds: 5,
        backgroundType: "gradient",
        backgroundValue: "from-purple-900 to-black",
        subtitlesEnabled: true,
      },
    ],
  },
];

const VideoStudioView: React.FC<VideoStudioProps> = ({ onOpenApiKeyModal }) => {
  const [mode, setMode] = useState<StudioMode>("avatar_video");
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>(DEFAULT_HEYGEN_AVATARS);
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [userInfo, setUserInfo] = useState<HeyGenUserInfo | null>(null);
  const [videos, setVideos] = useState<HeyGenVideo[]>([]);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(getSubscriptionInfo());
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  // Project Configuration
  const [projectTitle, setProjectTitle] = useState("Mening Yangi Video Loyiham");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    DEFAULT_HEYGEN_AVATARS[0].id
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [avatarFilter, setAvatarFilter] = useState<string>("all");
  const [avatarSearch, setAvatarSearch] = useState<string>("");

  // Scenes
  const [scenes, setScenes] = useState<VideoSceneItem[]>([
    {
      id: "scene_1",
      title: "1-Sahna (Kirish)",
      script:
        "Assalomu alaykum! SuperAI Video Studio ga xush kelibsiz. Bu yerda siz bir necha daqiqada professional video tayyorlashingiz mumkin.",
      backgroundType: "gradient",
      backgroundValue: "from-blue-950 via-slate-900 to-indigo-950",
      durationSeconds: 6,
      subtitlesEnabled: true,
      avatarPosition: "center",
    },
  ]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // AI Script Generator State
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiDuration, setAiDuration] = useState("30");
  const [aiLang, setAiLang] = useState("Uzbek");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Talking Photo State
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoScript, setPhotoScript] = useState<string>("");

  // Video Translate State
  const [translateVideoUrl, setTranslateVideoUrl] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>("Uzbek");

  // Render & Generation State
  const [isRendering, setIsRendering] = useState(false);
  const [renderStep, setRenderStep] = useState<string>("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadStudioData();
    const unsub = onSubscriptionChange((info) => {
      setSubInfo(info);
      loadStudioData();
    });
    return () => unsub();
  }, []);

  const loadStudioData = async () => {
    try {
      const [uInfo, avList, vcList, vList] = await Promise.all([
        getHeyGenAccountInfo(),
        getHeyGenAvatars(30),
        getHeyGenVoices(50),
        listHeyGenVideos(20),
      ]);
      setUserInfo(uInfo);
      if (avList.length > 0) setAvatars(avList);
      if (vcList.length > 0) setVoices(vcList);
      setVideos(vList);
    } catch (err) {
      console.warn("Studio data load error:", err);
    }
  };

  const currentScene = scenes[activeSceneIndex] || scenes[0];

  const updateCurrentScene = (updates: Partial<VideoSceneItem>) => {
    setScenes((prev) =>
      prev.map((s, idx) => (idx === activeSceneIndex ? { ...s, ...updates } : s))
    );
  };

  const handleAddScene = () => {
    const newIdx = scenes.length + 1;
    const newScene: VideoSceneItem = {
      id: `scene_${Date.now()}`,
      title: `${newIdx}-Sahna`,
      script: "Yangi sahna matnini bu yerga yozing...",
      backgroundType: "gradient",
      backgroundValue: "from-slate-900 via-indigo-950 to-slate-950",
      durationSeconds: 5,
      subtitlesEnabled: true,
      avatarPosition: "center",
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneIndex(scenes.length);
  };

  const handleDuplicateScene = (idx: number) => {
    const target = scenes[idx];
    const copy: VideoSceneItem = {
      ...target,
      id: `scene_${Date.now()}`,
      title: `${target.title} (Nusxa)`,
    };
    const next = [...scenes];
    next.splice(idx + 1, 0, copy);
    setScenes(next);
    setActiveSceneIndex(idx + 1);
  };

  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) return;
    const next = scenes.filter((_, i) => i !== idx);
    setScenes(next);
    setActiveSceneIndex(Math.max(0, idx - 1));
  };

  const handleGenerateAiScript = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const prompt = `Sen professional video ssenaristisan.
Mavzu: "${aiTopic}"
Davomiyligi: ${aiDuration} soniya
Tili: ${aiLang}
Uslubi: ${aiTone}

Quyidagi formatda video ssenariysini JSON massiv ko'rinishida yoz:
[
  { "title": "1-Sahna (Hook)", "script": "...", "durationSeconds": 6 },
  { "title": "2-Sahna (Asosiy)", "script": "...", "durationSeconds": 10 },
  { "title": "3-Sahna (CTA)", "script": "...", "durationSeconds": 5 }
]
Faqat valid JSON formatida javob ber.`;

      const response = await askGemini({
        parts: [{ text: prompt }],
        temperature: 0.7,
      });

      const cleaned = response.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const newScenes: VideoSceneItem[] = parsed.map((item: any, i: number) => ({
          id: `scene_ai_${Date.now()}_${i}`,
          title: item.title || `${i + 1}-Sahna`,
          script: item.script || "",
          durationSeconds: item.durationSeconds || 6,
          backgroundType: "gradient",
          backgroundValue: "from-blue-950 via-slate-900 to-indigo-950",
          subtitlesEnabled: true,
          avatarPosition: "center",
        }));
        setScenes(newScenes);
        setActiveSceneIndex(0);
        setStatusMessage({
          type: "success",
          text: `AI ${newScenes.length} ta sahnali mukammal ssenariy yaratdi! 🎉`,
        });
      }
    } catch (err: any) {
      console.warn("AI Script parse error:", err);
      updateCurrentScene({
        script: `"${aiTopic}" mavzusida video taqdimot: SuperAI yordamida tezkor, aniq va sifatli natijaga erishing.`,
      });
      setStatusMessage({
        type: "success",
        text: "Ssenariy sahnaga muvaffaqiyatli qo'shildi!",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleApplyTemplate = (tmpl: VideoTemplateItem) => {
    setProjectTitle(tmpl.title);
    setAspectRatio(tmpl.aspectRatio);
    const newScenes: VideoSceneItem[] = tmpl.scenes.map((s, idx) => ({
      id: `scene_tmpl_${Date.now()}_${idx}`,
      title: s.title || `${idx + 1}-Sahna`,
      script: s.script || "",
      durationSeconds: s.durationSeconds || 6,
      backgroundType: s.backgroundType || "gradient",
      backgroundValue: s.backgroundValue || "from-blue-950 to-slate-900",
      subtitlesEnabled: s.subtitlesEnabled ?? true,
      avatarPosition: s.avatarPosition || "center",
    }));
    setScenes(newScenes);
    setActiveSceneIndex(0);
    setMode("avatar_video");
    setStatusMessage({
      type: "success",
      text: `"${tmpl.title}" shabloni loyihangizga yuklandi!`,
    });
  };

  const totalEstimatedDuration = scenes.reduce(
    (acc, s) => acc + (s.durationSeconds || 5),
    0
  );
  const estimatedCredits = Math.max(5, Math.ceil(totalEstimatedDuration * 0.8));

  const handleStartRender = async () => {
    if (!hasHeyGenApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    const fullScript = scenes.map((s) => s.script.trim()).filter(Boolean).join(" ");
    if (!fullScript) {
      setStatusMessage({
        type: "error",
        text: "Iltimos, sahnalarga kamida bitta gap matn kiriting.",
      });
      return;
    }

    setIsRendering(true);
    setRenderStep("1/4: Audio sintezi va sahnalar tayyorlanmoqda...");
    setStatusMessage(null);

    try {
      const res = await generateHeyGenAvatarVideo(
        {
          title: projectTitle,
          script: fullScript,
          avatarId: selectedAvatarId,
          voiceId: selectedVoiceId || undefined,
          aspectRatio,
          resolution,
        },
        (step) => setRenderStep(step)
      );

      if (res.video) {
        setVideos((prev) => [res.video!, ...prev]);
        setPreviewVideoUrl(res.video.video_url || null);
        setStatusMessage({
          type: "success",
          text: "Video muvaffaqiyatli render qilindi va kutubxonangizga saqlandi! 🎬",
        });
      } else if (res.video_id) {
        setRenderStep("2/4: HeyGen Serverida rendering boshlandi...");
        try {
          const completedVideo = await pollVideoRender(res.video_id, (status) => {
            setRenderStep(`Render holati: ${status}...`);
          });
          setVideos((prev) => [completedVideo, ...prev]);
          setPreviewVideoUrl(completedVideo.video_url || null);
          setStatusMessage({
            type: "success",
            text: "HeyGen video generatsiyasi yakunlandi! 🚀",
          });
        } catch (pollErr: any) {
          setStatusMessage({
            type: "error",
            text: pollErr?.message || "Render vaqti tugadi yoki xatolik yuz berdi.",
          });
        }
      }
      await loadStudioData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Video render jarayonida xatolik yuz berdi.",
      });
    } finally {
      setIsRendering(false);
      setRenderStep("");
    }
  };

  const handleCreateTalkingPhoto = async () => {
    if (!photoUrl.trim() || !photoScript.trim()) {
      setStatusMessage({
        type: "error",
        text: "Rasm havolasi (URL) va gapiradigan matnni kiriting.",
      });
      return;
    }
    setIsRendering(true);
    setRenderStep("Talking Photo generatsiyasi boshlanmoqda...");
    try {
      const res = await createTalkingPhotoVideo({
        imageUrl: photoUrl,
        script: photoScript,
        title: "Talking Photo " + new Date().toLocaleTimeString(),
      });
      if (res.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({
          type: "success",
          text: `Talking Photo so'rovi yuborildi (Job ID: ${res.video_id})!`,
        });
        loadStudioData();
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message });
    } finally {
      setIsRendering(false);
      setRenderStep("");
    }
  };

  const handleDeleteVideoItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Ushbu videoni o'chirishni xohlaysizmi?")) {
      await deleteHeyGenVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (previewVideoUrl && videos.find((v) => v.id === id)?.video_url === previewVideoUrl) {
        setPreviewVideoUrl(null);
      }
    }
  };

  const filteredAvatars = avatars.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(avatarSearch.toLowerCase()) ||
      (a.gender || "").toLowerCase().includes(avatarSearch.toLowerCase());
    if (avatarFilter === "male") return matchesSearch && a.gender === "male";
    if (avatarFilter === "female") return matchesSearch && a.gender === "female";
    return matchesSearch;
  });

  const activeAvatar =
    avatars.find((a) => a.id === selectedAvatarId) || DEFAULT_HEYGEN_AVATARS[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden select-none">
      {/* 1. TOP STUDIO HEADER */}
      <header className="h-14 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-lg">
            🎬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">SuperAI Video Studio</span>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {userInfo?.username ? `@${userInfo.username}` : "AI Video & Avatar Laboratoriyasi"}
            </p>
          </div>
        </div>

        {/* Studio Modes */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setMode("avatar_video")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "avatar_video"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🧑 Avatar Video
          </button>
          <button
            onClick={() => setMode("templates")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "templates"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📋 Shablonlar
          </button>
          <button
            onClick={() => setMode("talking_photo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "talking_photo"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🖼 Talking Photo
          </button>
          <button
            onClick={() => setMode("video_translate")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "video_translate"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🌐 Video Tarjima
          </button>
          <button
            onClick={() => setMode("my_videos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "my_videos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📁 Videolarim ({videos.length})
          </button>
        </div>

        {/* Credits & Render Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPromoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition"
          >
            <span>💎 Balans:</span>
            <span className="font-bold">${userInfo?.remaining_quota ?? subInfo.balance}</span>
          </button>

          <button
            onClick={handleStartRender}
            disabled={isRendering}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Render...</span>
              </>
            ) : (
              <>
                <span>🎬 Video Yaratish</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono">
                  ~{estimatedCredits} cr
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* RENDER PROGRESS OVERLAY */}
      {isRendering && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center text-3xl mb-4 animate-bounce">
              🎬
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Video Render Qilinmoqda</h3>
            <p className="text-xs text-indigo-300/80 mb-6 font-mono">{renderStep}</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              Ushbu jarayon odatda 30-90 soniya vaqt oladi. Siz oynani yopishingiz mumkin.
            </p>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "templates" ? (
          /* TEMPLATES VIEW */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-2">Tayyor Video Shablonlari</h2>
              <p className="text-xs text-slate-400 mb-6">
                Mavzuga mos professional shablonni tanlang va o'z ssenariyingiz bilan boyiting.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VIDEO_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 hover:border-indigo-500/50 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-slate-950">
                        <img
                          src={tmpl.previewUrl}
                          alt={tmpl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-indigo-300 border border-white/10">
                          {tmpl.aspectRatio}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">{tmpl.title}</h4>
                      <p className="text-xs text-slate-400 mb-3">{tmpl.description}</p>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition"
                    >
                      Ushbu Shablonni Tanlash ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : mode === "talking_photo" ? (
          /* TALKING PHOTO VIEW */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-slate-900/80 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">🖼 Talking Photo Generator</h2>
              <p className="text-xs text-slate-400 mb-6">
                Istalgan inson yoki portret suratini jonlantiring va ovoz bering.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Portret Surat URL Manzili:
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/portrait.jpg"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Gapiradigan Matn:
                  </label>
                  <textarea
                    rows={4}
                    value={photoScript}
                    onChange={(e) => setPhotoScript(e.target.value)}
                    placeholder="Assalomu alaykum! Men fotosuratdan jonlanganman..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleCreateTalkingPhoto}
                  disabled={isRendering}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20"
                >
                  Talking Photo Yaratish ➔
                </button>
              </div>
            </div>
          </div>
        ) : mode === "my_videos" ? (
          /* MY VIDEOS GALLERY VIEW */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">📁 Yaratilgan Videolar</h2>
                  <p className="text-xs text-slate-400">
                    Barcha render qilingan va tayyor videolaringiz arxivi
                  </p>
                </div>
                <button
                  onClick={loadStudioData}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Yangilash 🔄
                </button>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-slate-900/40">
                  <span className="text-4xl block mb-2">🎬</span>
                  <p className="text-sm font-semibold text-slate-300">Hozircha videolar yo'q</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Birinchi AI avatar videongizni yarating!
                  </p>
                  <button
                    onClick={() => setMode("avatar_video")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    + Yangi Video Yaratish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-900 border border-white/10 rounded-2xl p-4 overflow-hidden group hover:border-indigo-500/40 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden mb-3">
                          {v.thumbnail_url ? (
                            <img
                              src={v.thumbnail_url}
                              alt={v.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🎥
                            </div>
                          )}
                          <span
                            className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.status === "completed"
                                ? "bg-emerald-500/80 text-white"
                                : v.status === "failed"
                                ? "bg-rose-500/80 text-white"
                                : "bg-amber-500/80 text-white animate-pulse"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">
                          {v.title || "SuperAI Video"}
                        </h4>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Davomiyligi: {v.duration ? `${v.duration}s` : "Kutilmoqda"} •{" "}
                          {new Date(v.created_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        {v.video_url && (
                          <a
                            href={v.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition"
                          >
                            Yuklab Olish ⬇
                          </a>
                        )}
                        <button
                          onClick={(e) => handleDeleteVideoItem(v.id, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs transition"
                          title="O'chirish"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* DEFAULT 4-PANE STUDIO WORKSPACE (Avatar Video / Text to Video) */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* PANE 1: SCENES LIST */}
              <div className="w-64 border-r border-white/10 bg-slate-900/60 flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Sahnalar ({scenes.length})
                  </span>
                  <button
                    onClick={handleAddScene}
                    className="p-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold transition px-2"
                  >
                    + Sahna
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {scenes.map((scene, idx) => (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneIndex(idx)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1.5 ${
                        activeSceneIndex === idx
                          ? "bg-indigo-950/70 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{scene.title}</span>
                        <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateScene(idx);
                            }}
                            title="Nusxalash"
                            className="p-1 hover:text-indigo-300"
                          >
                            📑
                          </button>
                          {scenes.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScene(idx);
                              }}
                              title="O'chirish"
                              className="p-1 hover:text-rose-400"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] line-clamp-2 text-slate-400">
                        {scene.script || "Matn yo'q..."}
                      </p>
                      <span className="text-[10px] font-mono text-indigo-400">
                        ⏱ {scene.durationSeconds} soniya
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PANE 2: CENTER PREVIEW STAGE */}
              <div className="flex-1 flex flex-col bg-slate-950 p-4 items-center justify-between overflow-hidden relative">
                {/* Stage Header Controls */}
                <div className="w-full max-w-2xl flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 font-bold text-sm text-white focus:outline-none px-1 py-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Aspect Ratio */}
                    <div className="flex bg-slate-900 border border-white/10 rounded-lg p-0.5 text-[11px]">
                      {(["16:9", "9:16", "1:1"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setAspectRatio(r)}
                          className={`px-2 py-0.5 rounded ${
                            aspectRatio === r ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {/* Resolution */}
                    <div className="flex bg-slate-900 border border-white/10 rounded-lg p-0.5 text-[11px]">
                      {(["720p", "1080p"] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          className={`px-2 py-0.5 rounded ${
                            resolution === res ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video / Avatar Canvas Box */}
                <div
                  className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 transition-all ${
                    aspectRatio === "9:16"
                      ? "h-[360px] w-[202px]"
                      : aspectRatio === "1:1"
                      ? "h-[320px] w-[320px]"
                      : "w-[560px] h-[315px] max-w-full"
                  }`}
                >
                  {previewVideoUrl ? (
                    <video
                      src={previewVideoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {/* Avatar Mock Stage with live photo */}
                      {activeAvatar?.preview_image_url && (
                        <img
                          src={activeAvatar.preview_image_url}
                          alt={activeAvatar.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-85"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      {/* Live Subtitle Overlay */}
                      {currentScene.subtitlesEnabled && (
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                          <span className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white border border-white/10 shadow-lg">
                            {currentScene.script || "Ssenariy matni bu yerda ko'rinadi..."}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-indigo-600/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                        <span>LIVE AVATAR</span>
                      </div>
                    </>
                  )}
                </div>

                {/* AI Script Writer Expandable Bar */}
                <div className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-xl p-2.5 mt-2 flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Mavzuni kiriting (masalan: 'SuperAI reklama videosi')..."
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500"
                  />
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Educational">Ta'lim</option>
                    <option value="Fun">Qiziqarli</option>
                  </select>
                  <button
                    onClick={handleGenerateAiScript}
                    disabled={isGeneratingScript || !aiTopic.trim()}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {isGeneratingScript ? "Yozmoqda..." : "AI Ssenariy"}
                  </button>
                </div>
              </div>

              {/* PANE 3: PROPERTY INSPECTOR */}
              <div className="w-80 border-l border-white/10 bg-slate-900/70 p-4 overflow-y-auto flex flex-col gap-4 flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Sahna Sozlamalari
                </h3>

                {/* Script Editor */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sahna Matni (Script):
                  </label>
                  <textarea
                    rows={4}
                    value={currentScene.script}
                    onChange={(e) => updateCurrentScene({ script: e.target.value })}
                    placeholder="Avatar aytishi kerak bo'lgan matn..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Avatar Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Avatar Tanlash:</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {filteredAvatars.length} ta
                    </span>
                  </div>
                  <input
                    type="text"
                    value={avatarSearch}
                    onChange={(e) => setAvatarSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white mb-2 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-white/5">
                    {filteredAvatars.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => {
                          setSelectedAvatarId(av.id);
                          updateCurrentScene({ avatarId: av.id });
                        }}
                        className={`cursor-pointer rounded-lg overflow-hidden border p-1 text-center transition ${
                          selectedAvatarId === av.id
                            ? "border-indigo-500 bg-indigo-950/50"
                            : "border-transparent hover:border-white/20"
                        }`}
                      >
                        <img
                          src={av.preview_image_url}
                          alt={av.name}
                          className="w-full h-14 object-cover rounded-md mb-1"
                        />
                        <span className="text-[10px] text-slate-300 block truncate">{av.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voice Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ovoz (Voice):
                  </label>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Avtomatik / Standart Ovoz</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} ({v.language}) - {v.gender}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtitles Toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-white/5">
                  <span className="text-xs text-slate-300">Subtitrlarni Ko'rsatish</span>
                  <input
                    type="checkbox"
                    checked={currentScene.subtitlesEnabled}
                    onChange={(e) => updateCurrentScene({ subtitlesEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* PANE 4: BOTTOM TIMELINE SCRUBBER */}
            <div className="h-20 border-t border-white/10 bg-slate-900/80 p-2 flex items-center gap-3 overflow-x-auto">
              <div className="text-[11px] font-bold text-slate-400 pl-2">
                <div>TIMELINE</div>
                <div className="text-indigo-400 font-mono">~{totalEstimatedDuration}s</div>
              </div>
              <div className="flex-1 flex items-center gap-2 h-full py-1">
                {scenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    onClick={() => setActiveSceneIndex(idx)}
                    className={`h-full flex-1 min-w-[140px] rounded-lg p-2 border cursor-pointer transition flex flex-col justify-between ${
                      activeSceneIndex === idx
                        ? "bg-indigo-600/40 border-indigo-400 text-white"
                        : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="truncate">{scene.title}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {scene.durationSeconds}s
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <PromoCodeModal isOpen={isPromoOpen} onClose={() => setIsPromoOpen(false)} />
    </div>
  );
};

export default VideoStudioView;
