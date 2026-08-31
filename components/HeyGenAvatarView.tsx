import React, { useState, useEffect } from "react";
import {
  HeyGenAvatar,
  HeyGenVoice,
  HeyGenVideo,
  HeyGenUserInfo,
} from "../types";
import {
  getHeyGenAccountInfo,
  getHeyGenAvatars,
  getHeyGenVoices,
  listHeyGenVideos,
  hasHeyGenApiKey,
  deleteHeyGenVideo,
  DEFAULT_HEYGEN_AVATARS,
} from "../services/heygenService";
import {
  getSubscriptionInfo,
  onSubscriptionChange,
  SubscriptionInfo,
} from "../services/promoService";
import {
  generateAiDirectorProject,
  renderRealMotionAiVideo,
  REAL_MOTION_AVATARS,
  DirectorVideoProject,
} from "../services/aiVideoDirectorService";
import PromoCodeModal from "./PromoCodeModal";

interface HeyGenAvatarViewProps {
  onOpenApiKeyModal: () => void;
}

type TabType = "agent" | "avatar" | "gallery";

const PROMPT_IDEAS = [
  {
    title: "🚀 Mahsulot taqdimoti",
    prompt:
      "Bizning yangi SuperAI platformamiz haqida 30 soniyali qisqa, dinamik va qiziqarli taqdimot videosi tayyorlang.",
  },
  {
    title: "💡 AI va kelajak texnologiyalari",
    prompt:
      "Sun'iy intellektning insoniyat hayotini qanday o'zgartirishi haqida professional ma'lumot beruvchi video yarating.",
  },
  {
    title: "📱 Instagram Reels / TikTok",
    prompt:
      "Dasturlashni o'rganish bo'yicha 3 ta eng muhim maslahat haqida vertikal 9:16 formatdagi baquvvat video.",
  },
  {
    title: "📚 Ta'lim va darslik",
    prompt:
      "Xushmuomala o'qituvchi obrazida bugungi zamonaviy ko'nikmalar haqida qisqacha tushuntirib bering.",
  },
];

const SCRIPT_TEMPLATES = [
  {
    title: "👋 Salomlashuv va kirish",
    text: "Assalomu alaykum! Men SuperAI ning raqamli elchisiman. Sizga loyihangizni yangi bosqichga olib chiqishda yordam berishdan mamnunman.",
  },
  {
    title: "🎯 Biznes va xizmatlar",
    text: "Bizning kompaniyamiz mijozlarga zamonaviy AI yechimlarini taklif etadi. Tezkor xizmat va yuqori sifat — bizning asosiy maqsadimiz.",
  },
  {
    title: "🎉 Tabrik va minnatdorchilik",
    text: "Kompaniyamiz nomidan barcha hamkorlarimizga samimiy minnatdorchilik bildiramiz. Yangi yutuqlar sari birga intilamiz!",
  },
];

const HeyGenAvatarView: React.FC<HeyGenAvatarViewProps> = ({
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("agent");
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>(
    DEFAULT_HEYGEN_AVATARS,
  );
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    DEFAULT_HEYGEN_AVATARS[0].id,
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape",
  );
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [prompt, setPrompt] = useState("");
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("");
  const [motionPrompt, setMotionPrompt] = useState("");

  const [userInfo, setUserInfo] = useState<HeyGenUserInfo | null>(null);
  const [videos, setVideos] = useState<HeyGenVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [generatedVideo, setGeneratedVideo] = useState<HeyGenVideo | null>(
    null,
  );
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedRealAvatarId, setSelectedRealAvatarId] = useState<string>(
    REAL_MOTION_AVATARS[0].id,
  );
  const [createdProject, setCreatedProject] =
    useState<DirectorVideoProject | null>(null);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(
    getSubscriptionInfo(),
  );
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  useEffect(() => {
    loadAccountData();
    const unsub = onSubscriptionChange((info) => {
      setSubInfo(info);
      loadAccountData();
    });
    return () => unsub();
  }, []);

  const loadAccountData = async () => {
    if (!hasHeyGenApiKey()) return;
    try {
      getHeyGenAccountInfo()
        .then(setUserInfo)
        .catch((e) => console.warn("HeyGen account info fetch error:", e));

      getHeyGenAvatars(30)
        .then((list) => {
          if (list.length > 0) {
            setAvatars(list);
            if (
              !selectedAvatarId ||
              selectedAvatarId === DEFAULT_HEYGEN_AVATARS[0].id
            ) {
              setSelectedAvatarId(list[0].id);
            }
          }
        })
        .catch(console.warn);

      getHeyGenVoices(30).then(setVoices).catch(console.warn);

      listHeyGenVideos(15).then(setVideos).catch(console.warn);
    } catch (err) {
      console.warn("Init HeyGen data error:", err);
    }
  };

  const handleGenerateAgentVideo = async () => {
    if (!prompt.trim()) {
      setError("Iltimos, video uchun g'oya yoki mavzu yozing!");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setLoadingStep("1/5: AI Rejissyor ssenariy va kadrlarni tayyorlamoqda...");

    try {
      // 1-Qadam: AI Video Rejissyor ssenariy va kadrlarni yaratadi
      const project = await generateAiDirectorProject(
        prompt.trim(),
        orientation === "portrait" ? "9:16" : "16:9",
        selectedRealAvatarId,
      );
      setCreatedProject(project);

      // 2-Qadam: Haqiqiy harakatlanuvchi inson taqdimotchi va ElevenLabs ovozi bilan render qilish
      const video = await renderRealMotionAiVideo(project, (step) => {
        setLoadingStep(step);
      });

      setGeneratedVideo(video);
      setSuccessMessage(
        "Professional AI Video muvaffaqiyatli yaratildi va saqlandi!",
      );
      listHeyGenVideos(15).then(setVideos).catch(console.warn);
      getHeyGenAccountInfo().then(setUserInfo).catch(console.warn);
    } catch (err: any) {
      console.error("Video agent error:", err);
      setError(
        err?.message ||
          "Video yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
      );
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerateAvatarVideo = async () => {
    if (!script.trim()) {
      setError("Iltimos, gapiriladigan matn (ssenariy)ni yozing!");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setLoadingStep("1/4: Real Motion Presenter tayyorlanmoqda...");

    try {
      const selectedReal =
        REAL_MOTION_AVATARS.find((a) => a.id === selectedRealAvatarId) ||
        REAL_MOTION_AVATARS[0];

      const singleSceneProject: DirectorVideoProject = {
        title: title.trim() || "SuperAI Taqdimot Videosi",
        summary: script.trim(),
        fullScript: script.trim(),
        scenes: [
          {
            id: 1,
            title: title.trim() || "Jonli Taqdimot",
            narration: script.trim(),
            visualTag: "🌟 Real Motion Presenter",
            durationSeconds: Math.max(
              8,
              Math.ceil(script.split(" ").length / 2.2),
            ),
            themeColor: "#8b5cf6",
            bulletPoints: motionPrompt
              ? [motionPrompt]
              : ["Yuqori sifatli video", "ElevenLabs HD Ovoz"],
          },
        ],
        suggestedAvatarId: selectedReal.id,
        suggestedVoiceId: selectedVoiceId || selectedReal.defaultVoiceId,
        estimatedDuration: Math.max(
          8,
          Math.ceil(script.split(" ").length / 2.2),
        ),
        aspectRatio: orientation === "portrait" ? "9:16" : "16:9",
      };

      const video = await renderRealMotionAiVideo(
        singleSceneProject,
        (step) => {
          setLoadingStep(step);
        },
      );

      setGeneratedVideo(video);
      setSuccessMessage(
        "Harakatlanuvchi avatar videosi muvaffaqiyatli yaratildi!",
      );
      listHeyGenVideos(15).then(setVideos).catch(console.warn);
      getHeyGenAccountInfo().then(setUserInfo).catch(console.warn);
    } catch (err: any) {
      console.error("Avatar video error:", err);
      setError(err?.message || "Avatar video yaratishda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleDeleteVideo = async (e: React.MouseEvent, vidId: string) => {
    e.stopPropagation();
    if (window.confirm("Ushbu videoni o'chirishga ishonchingiz komilmi?")) {
      const ok = await deleteHeyGenVideo(vidId);
      if (ok) {
        setVideos((prev) => prev.filter((v) => v.id !== vidId));
        if (generatedVideo?.id === vidId) setGeneratedVideo(null);
      }
    }
  };

  const selectedAvatar =
    avatars.find((a) => a.id === selectedAvatarId) || avatars[0];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#090f1d] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass rounded-3xl p-6 border border-white/10 bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-slate-900/60 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                HeyGen AI Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {hasHeyGenApiKey() ? "API Faol" : "Key Kerak"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              HeyGen AI Avatar & Video Studiyasi
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Fotorealistik AI avatarlar orqali ssenariy yoki g'oyangizdan
              professional darajadagi videolarni bir zumda yarating.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-white">
                  {subInfo.isPremium
                    ? "Shuhratjon (VIP PRO)"
                    : userInfo?.first_name || "SuperAI User"}
                </span>
                {subInfo.isPremium && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300 font-black">
                Balans: $
                {(subInfo.isPremium
                  ? subInfo.balance
                  : (userInfo?.remaining_quota ?? 0)
                ).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                USD
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPromoModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:brightness-125 text-amber-300 border border-amber-400/40 transition flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
            >
              <span>🎁 Promokod</span>
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5"
            >
              <span>⚙️ API</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border border-white/10 bg-slate-900/80 w-fit">
          <button
            onClick={() => setActiveTab("agent")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "agent"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎬 AI Video Agent (G'oyadan Video)</span>
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "avatar"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>👤 Jonli Talking Avatar (Ssenariy)</span>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "gallery"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎞 Mening Videolarim ({videos.length})</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between animate-fade-in">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: AI Video Agent */}
        {activeTab === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Video G'oyasi yoki Topshiriq (Prompt)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">
                    1-bosqichli avtomatik generatsiya
                  </span>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Masalan: Bizning yangi sun'iy intellekt xizmatimiz haqida 30 soniyali qiziqarli taqdimot videosi yarating..."
                  rows={4}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none leading-relaxed"
                />

                {/* Preset Prompt Ideas */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-2">
                    💡 Tayyor g'oyalardan foydalaning:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROMPT_IDEAS.map((idea, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(idea.prompt)}
                        className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition group"
                      >
                        <p className="font-bold text-purple-300 group-hover:text-purple-200">
                          {idea.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {idea.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options (Orientation, Format) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Video formati (Aspect Ratio)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrientation("landscape")}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          orientation === "landscape"
                            ? "bg-purple-600/30 border-purple-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>🖥 16:9 Gorizontal (YouTube)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientation("portrait")}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          orientation === "portrait"
                            ? "bg-purple-600/30 border-purple-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>📱 9:16 Vertikal (Reels/TikTok)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Ovoz turi
                    </label>
                    <select
                      value={selectedVoiceId}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-xs text-white font-semibold outline-none"
                    >
                      <option value="">Avtomatik ovoz tanlash (HeyGen)</option>
                      {voices.map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.name} ({v.language || "Multi-lingual"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerateAgentVideo}
                  disabled={isLoading || !prompt.trim()}
                  className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl ${
                    isLoading || !prompt.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingStep || "Video Yaratilmoqda..."}</span>
                    </>
                  ) : (
                    <>
                      <span>✨ AI Video Yaratish (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar Real Motion Avatar Preview */}
            <div className="space-y-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Jonli Harakatlanuvchi Taqdimotchi
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                    🎬 Real Motion HD
                  </span>
                </div>

                {(() => {
                  const currentRealAvatar =
                    REAL_MOTION_AVATARS.find(
                      (a) => a.id === selectedRealAvatarId,
                    ) || REAL_MOTION_AVATARS[0];
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-slate-950 aspect-[4/3] group shadow-xl shadow-purple-950/50">
                      <video
                        src={currentRealAvatar.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4 pointer-events-none">
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{currentRealAvatar.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </p>
                        <p className="text-[11px] text-purple-300 font-semibold">
                          {currentRealAvatar.role}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">
                    Taqdimotchi obrazini almashtirish:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {REAL_MOTION_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedRealAvatarId(av.id);
                          setSelectedAvatarId(av.id);
                        }}
                        className={`relative rounded-xl overflow-hidden border p-1.5 text-left transition ${
                          selectedRealAvatarId === av.id
                            ? "border-purple-500 bg-purple-600/20 ring-2 ring-purple-500/40"
                            : "border-white/10 bg-slate-900/60 hover:border-white/30"
                        }`}
                      >
                        <div className="aspect-[4/3] rounded-lg overflow-hidden mb-1.5 bg-black">
                          <img
                            src={av.imageUrl}
                            alt={av.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">
                          {av.name}
                        </p>
                        <p className="text-[9px] text-purple-300 truncate">
                          {av.role}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Talking Avatar (Script to Video) */}
        {activeTab === "avatar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Ssenariy (Matn)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Avatar ushbu matnni to'liq jonli va fotorealistik gapirib
                    beradi
                  </span>
                </div>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video sarlavhasi (ixtiyoriy)..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />

                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Avatar aytishi kerak bo'lgan matnni yozing..."
                  rows={5}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none leading-relaxed"
                />

                {/* Script templates */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-2">
                    📝 Namuna matnlardan foydalaning:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SCRIPT_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setScript(tmpl.text)}
                        className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition"
                      >
                        <p className="font-bold text-purple-300">
                          {tmpl.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tmpl.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Sifat (Resolution)
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) =>
                        setResolution(e.target.value as "720p" | "1080p")
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-semibold outline-none"
                    >
                      <option value="1080p">
                        1080p Full HD (Tavsiya etiladi)
                      </option>
                      <option value="720p">720p HD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Format
                    </label>
                    <select
                      value={orientation}
                      onChange={(e) =>
                        setOrientation(
                          e.target.value as "landscape" | "portrait",
                        )
                      }
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-semibold outline-none"
                    >
                      <option value="landscape">16:9 Gorizontal</option>
                      <option value="portrait">9:16 Vertikal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Ovoz
                    </label>
                    <select
                      value={selectedVoiceId}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-semibold outline-none"
                    >
                      <option value="">Avatar o'z ovozi</option>
                      {voices.map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Harakat & Imo-ishoralar (Ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={motionPrompt}
                    onChange={(e) => setMotionPrompt(e.target.value)}
                    placeholder="Masalan: Tabassum bilan qo'l harakatlari qil, faol tushuntir..."
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                  />
                </div>

                {/* Render Button */}
                <button
                  type="button"
                  onClick={handleGenerateAvatarVideo}
                  disabled={isLoading || !script.trim()}
                  className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl ${
                    isLoading || !script.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>
                        {loadingStep || "Avatar Render qilinmoqda..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>👤 Talking Avatar Videoni Yaratish</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Avatar Selector Grid */}
            <div className="space-y-4">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Jonli Harakatlanuvchi Taqdimotchilar
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    🎬 Real Motion
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                  {REAL_MOTION_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedRealAvatarId(av.id);
                        setSelectedAvatarId(av.id);
                      }}
                      className={`relative rounded-2xl overflow-hidden border text-left transition group ${
                        selectedRealAvatarId === av.id
                          ? "border-purple-500 ring-2 ring-purple-500/50 shadow-lg"
                          : "border-white/10 opacity-75 hover:opacity-100 hover:border-white/30"
                      }`}
                    >
                      <div className="aspect-[4/3] bg-slate-950 overflow-hidden">
                        <img
                          src={av.imageUrl}
                          alt={av.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-2.5 bg-slate-900">
                        <p className="text-xs font-bold text-white truncate">
                          {av.name}
                        </p>
                        <p className="text-[10px] text-purple-300 truncate">
                          {av.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Video Gallery & History */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                Yaratilgan Videolar ({videos.length})
              </h3>
              <button
                onClick={loadAccountData}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs text-slate-300 border border-white/10 transition"
              >
                🔄 Yangilash
              </button>
            </div>

            {videos.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center border border-white/10 max-w-md mx-auto">
                <div className="text-4xl mb-3">🎬</div>
                <h4 className="text-base font-bold text-white">
                  Hali videolar mavjud emas
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Video Agent yoki Talking Avatar orqali birinchi videongizni
                  yarating!
                </p>
                <button
                  onClick={() => setActiveTab("agent")}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition"
                >
                  Video Yaratishni Boshlash
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="glass rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 flex flex-col group transition hover:border-purple-500/40"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {vid.thumbnail_url ? (
                        <img
                          src={vid.thumbnail_url}
                          alt={vid.title || "Video"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl">
                          ▶
                        </div>
                      )}
                      <span
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          vid.status === "completed"
                            ? "bg-emerald-500/80 text-white"
                            : vid.status === "failed"
                              ? "bg-rose-500/80 text-white"
                              : "bg-amber-500/80 text-slate-950 animate-pulse"
                        }`}
                      >
                        {vid.status}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">
                          {vid.title || `Video (${vid.id.slice(0, 8)}...)`}
                        </h4>
                        {vid.duration && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Davomiyligi: {Math.round(vid.duration)}s
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                        {vid.video_url && (
                          <>
                            <button
                              onClick={() => setPlayingVideoUrl(vid.video_url!)}
                              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              <span>▶ Ko'rish</span>
                            </button>
                            <a
                              href={vid.video_url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition"
                              title="Yuklab olish"
                            >
                              ⬇
                            </a>
                          </>
                        )}
                        <button
                          onClick={(e) => handleDeleteVideo(e, vid.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition"
                          title="O'chirish"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video Player Modal */}
        {(playingVideoUrl || generatedVideo?.video_url) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-white/15 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎬 HeyGen AI Video Player</span>
                </h4>
                <button
                  onClick={() => {
                    setPlayingVideoUrl(null);
                    setGeneratedVideo(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 bg-black flex items-center justify-center">
                <video
                  src={playingVideoUrl || generatedVideo?.video_url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-full rounded-xl"
                />
              </div>
              <div className="p-4 flex items-center justify-between bg-slate-900/90">
                <span className="text-xs text-slate-400">
                  Video muvaffaqiyatli render qilindi
                </span>
                <div className="flex gap-2">
                  <a
                    href={playingVideoUrl || generatedVideo?.video_url}
                    download="heygen-superai-video.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>⬇ Yuklab olish (MP4)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Promo Code Modal */}
        <PromoCodeModal
          isOpen={isPromoModalOpen}
          onClose={() => setIsPromoModalOpen(false)}
          onSuccess={() => loadAccountData()}
        />
      </div>
    </div>
  );
};

export default HeyGenAvatarView;
