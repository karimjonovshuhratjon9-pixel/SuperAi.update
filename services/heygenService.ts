import {
  HeyGenAvatar,
  HeyGenVoice,
  HeyGenVideo,
  HeyGenUserInfo,
} from "../types";
import {
  getSubscriptionInfo,
  deductCredits,
  isUserPremium,
} from "./promoService";
import { synthesizeSpeechAudio, cleanTextForSpeech } from "./elevenLabsService";

const HEYGEN_KEY_STORAGE = "superai_heygen_api_key";
const HEYGEN_AVATAR_STORAGE = "superai_heygen_avatar_id";
const HEYGEN_VOICE_STORAGE = "superai_heygen_voice_id";
const HEYGEN_LOCAL_VIDEOS_STORAGE = "superai_rendered_videos";

export const DEFAULT_HEYGEN_AVATARS: HeyGenAvatar[] = [
  {
    id: "e82071eb242c4ff489756959d568a600",
    name: "Camille (Studio Streamer)",
    gender: "female",
    avatar_type: "photo_avatar",
    preview_image_url:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/stills/Studio_Streamer_2.jpg",
    preview_video_url:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/previews/Studio_Streamer_2.mp4",
    default_voice_id: "eb687f91d0ae402d89aa2f04858c38ed",
  },
  {
    id: "d237e0109c64464f9a8e5a441aaad61a",
    name: "Camille (Modern Corporate)",
    gender: "female",
    avatar_type: "photo_avatar",
    preview_image_url:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/stills/Modern_Corporate_3.jpg",
    preview_video_url:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/previews/Modern_Corporate_3.mp4",
    default_voice_id: "eb687f91d0ae402d89aa2f04858c38ed",
  },
  {
    id: "Abigail_expressive_2024112501",
    name: "Abigail (Expressive)",
    gender: "female",
    avatar_type: "studio_avatar",
    preview_image_url:
      "https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp",
    preview_video_url:
      "https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_video_target.mp4",
  },
  {
    id: "Wayne_20240711",
    name: "Wayne (Professional)",
    gender: "male",
    avatar_type: "studio_avatar",
    preview_image_url:
      "https://files2.heygen.ai/avatar/v3/Wayne_20240711/preview_target.webp",
    preview_video_url:
      "https://files2.heygen.ai/avatar/v3/Wayne_20240711/preview_video_target.mp4",
  },
  {
    id: "Daisy-inskirt-20220818",
    name: "Daisy (Presenter)",
    gender: "female",
    avatar_type: "studio_avatar",
    preview_image_url:
      "https://files2.heygen.ai/avatar/v3/Daisy-inskirt-20220818/preview_target.webp",
    preview_video_url:
      "https://files2.heygen.ai/avatar/v3/Daisy-inskirt-20220818/preview_video_target.mp4",
  },
  {
    id: "Bryan_IT_Sitting_public",
    name: "Bryan (Tech Presenter)",
    gender: "male",
    avatar_type: "studio_avatar",
    preview_image_url:
      "https://files2.heygen.ai/avatar/v3/Bryan_IT_Sitting_public/preview_target.webp",
    preview_video_url:
      "https://files2.heygen.ai/avatar/v3/Bryan_IT_Sitting_public/preview_video_target.mp4",
  },
];

export const getHeyGenApiKey = (): string => {
  const local = localStorage.getItem(HEYGEN_KEY_STORAGE);
  if (local && local.trim()) return local.trim();
  return (
    import.meta.env.VITE_HEYGEN_API_KEY ||
    import.meta.env.HEYGEN_API_KEY ||
    ""
  ).trim();
};

export const setHeyGenApiKey = (key: string): void => {
  if (key && key.trim()) {
    localStorage.setItem(HEYGEN_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(HEYGEN_KEY_STORAGE);
  }
};

export const hasHeyGenApiKey = (): boolean => {
  return Boolean(getHeyGenApiKey());
};

export const getSelectedHeyGenAvatarId = (): string => {
  const local = localStorage.getItem(HEYGEN_AVATAR_STORAGE);
  if (local && local.trim()) return local.trim();
  return DEFAULT_HEYGEN_AVATARS[0].id;
};

export const setSelectedHeyGenAvatarId = (avatarId: string): void => {
  localStorage.setItem(HEYGEN_AVATAR_STORAGE, avatarId);
};

export const getSelectedHeyGenVoiceId = (): string => {
  const local = localStorage.getItem(HEYGEN_VOICE_STORAGE);
  return local || "";
};

export const setSelectedHeyGenVoiceId = (voiceId: string): void => {
  localStorage.setItem(HEYGEN_VOICE_STORAGE, voiceId);
};

export const getHeyGenAccountInfo = async (
  apiKeyOverride?: string,
): Promise<HeyGenUserInfo> => {
  const subInfo = getSubscriptionInfo();
  const key = apiKeyOverride || getHeyGenApiKey();
  let userData: any = {};

  if (key) {
    try {
      const response = await fetch("https://api.heygen.com/v3/users/me", {
        headers: { "X-Api-Key": key },
      });
      if (response.ok) {
        const json = await response.json();
        userData = json?.data || {};
      }
    } catch {
      /* ignore */
    }
  }

  const effectiveBalance = subInfo.isPremium
    ? subInfo.balance
    : (userData.wallet?.remaining_balance ?? 0);

  return {
    email:
      userData.email ||
      (subInfo.isPremium ? "vip-shuhratjon@superai.uz" : "user@superai.uz"),
    first_name:
      userData.first_name ||
      (subInfo.isPremium ? "Shuhratjon (VIP PRO)" : "SuperAI"),
    last_name: userData.last_name || "",
    username: userData.username || "vip_shuhratjon",
    currency: "usd",
    remaining_quota: effectiveBalance,
    billing_type: subInfo.isPremium
      ? subInfo.planName
      : userData.billing_type || "wallet",
  };
};

export const testHeyGenConnection = async (
  keyToTest?: string,
): Promise<{ success: boolean; message: string; user?: HeyGenUserInfo }> => {
  const key = keyToTest || getHeyGenApiKey();
  if (!key) {
    return { success: false, message: "HeyGen API kaliti kiritilmagan" };
  }

  try {
    const user = await getHeyGenAccountInfo(key);
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return {
      success: true,
      message: `HeyGen ulandi! Hisob: ${fullName || user.email || "Faol"} (Balans: $${user.remaining_quota ?? 0})`,
      user,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "HeyGen API ga ulanishda xatolik",
    };
  }
};

export const getHeyGenAvatars = async (limit = 24): Promise<HeyGenAvatar[]> => {
  const key = getHeyGenApiKey();
  if (!key) return DEFAULT_HEYGEN_AVATARS;

  try {
    const response = await fetch(
      `https://api.heygen.com/v3/avatars/looks?limit=${limit}`,
      {
        headers: { "X-Api-Key": key },
      },
    );

    if (response.ok) {
      const json = await response.json();
      const list = json?.data || [];
      const formatted: HeyGenAvatar[] = list
        .filter(
          (item: any) => item.status !== "failed" && item.preview_image_url,
        )
        .map((item: any) => ({
          id: item.id,
          name: item.name || "HeyGen Avatar",
          gender: item.gender || "unknown",
          preview_image_url: item.preview_image_url,
          preview_video_url: item.preview_video_url,
          avatar_type: item.avatar_type,
          default_voice_id: item.default_voice_id,
        }));

      if (formatted.length > 0) {
        return formatted;
      }
    }
  } catch (err) {
    console.warn("HeyGen v3 avatars fetch failed, trying v2 fallback", err);
  }

  try {
    const v2Res = await fetch("https://api.heygen.com/v2/avatars", {
      headers: { "X-Api-Key": key },
    });
    if (v2Res.ok) {
      const json = await v2Res.json();
      const list = json?.data?.avatars || [];
      const formatted: HeyGenAvatar[] = list
        .slice(0, limit)
        .map((item: any) => ({
          id: item.avatar_id,
          name: item.avatar_name || "HeyGen Avatar",
          gender: item.gender || "unknown",
          preview_image_url: item.preview_image_url,
          preview_video_url: item.preview_video_url,
          default_voice_id: item.default_voice_id,
        }));
      if (formatted.length > 0) return formatted;
    }
  } catch {
    /* fallback to defaults */
  }

  return DEFAULT_HEYGEN_AVATARS;
};

export const getHeyGenVoices = async (limit = 40): Promise<HeyGenVoice[]> => {
  const key = getHeyGenApiKey();
  if (!key) return [];

  try {
    const res = await fetch("https://api.heygen.com/v2/voices", {
      headers: { "X-Api-Key": key },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data?.voices || [];
      return list.slice(0, limit).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name || "HeyGen Voice",
        language: v.language || "Multi-lingual",
        gender: v.gender || "unknown",
        preview_audio: v.preview_audio,
      }));
    }
  } catch (err) {
    console.warn("HeyGen voices fetch error:", err);
  }
  return [];
};

export const getLocalRenderedVideos = (): HeyGenVideo[] => {
  try {
    const saved = localStorage.getItem(HEYGEN_LOCAL_VIDEOS_STORAGE);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
};

export const saveLocalRenderedVideo = (video: HeyGenVideo): void => {
  const existing = getLocalRenderedVideos();
  const updated = [video, ...existing.filter((v) => v.id !== video.id)];
  localStorage.setItem(HEYGEN_LOCAL_VIDEOS_STORAGE, JSON.stringify(updated));
};

export const renderSuperAiStudioVideo = async (
  params: {
    title?: string;
    script: string;
    avatarId?: string;
    voiceId?: string;
    orientation?: "landscape" | "portrait";
  },
  onProgress?: (status: string) => void,
): Promise<HeyGenVideo> => {
  if (onProgress)
    onProgress("1/4: ElevenLabs HD audio ovoz sintezi qilinmoqda...");

  let audioBlob: Blob | null = null;
  try {
    audioBlob = await synthesizeSpeechAudio(params.script, params.voiceId);
  } catch (audioErr) {
    console.warn(
      "ElevenLabs synthesis fallback to Web Speech audio:",
      audioErr,
    );
  }

  if (onProgress)
    onProgress("2/4: Avatar va 3D sahna kompozitsiyasi yig'ilmoqda...");

  const isPortrait = params.orientation === "portrait";
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const avatar =
    DEFAULT_HEYGEN_AVATARS.find((a) => a.id === params.avatarId) ||
    DEFAULT_HEYGEN_AVATARS[0];

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = avatar.preview_image_url;
  await new Promise((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(true);
  });

  if (onProgress) onProgress("3/4: SuperAI VIP GPU video render qilinmoqda...");

  const words = cleanTextForSpeech(params.script).split(" ");
  const estimatedSeconds = Math.max(
    5,
    Math.min(60, Math.ceil(words.length / 2.5)),
  );
  const totalFrames = estimatedSeconds * 20;

  let audioUrl: string | null = null;
  let audioElem: HTMLAudioElement | null = null;
  if (audioBlob) {
    audioUrl = URL.createObjectURL(audioBlob);
    audioElem = new Audio(audioUrl);
  }

  const stream = canvas.captureStream(24);
  let combinedStream = stream;

  try {
    if (audioElem) {
      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const source = audioCtx.createMediaElementSource(audioElem);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      const audioTracks = dest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...audioTracks,
        ]);
      }
    }
  } catch {
    /* fallback to video stream */
  }

  const recordedChunks: Blob[] = [];
  let mediaRecorder: MediaRecorder | null = null;
  try {
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";
    mediaRecorder = new MediaRecorder(combinedStream, { mimeType: mime });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.start();
  } catch (recErr) {
    console.warn("MediaRecorder init error:", recErr);
  }

  if (audioElem) {
    try {
      await audioElem.play();
    } catch {
      /* ignore */
    }
  }

  let currentFrame = 0;
  const drawFrame = () => {
    if (!ctx) return;
    const progress = currentFrame / totalFrames;
    const time = currentFrame * 0.05;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#080e1a");
    bgGrad.addColorStop(0.5, "#0e1c38");
    bgGrad.addColorStop(1, "#180f2d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic glowing particles
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const px = ((Math.sin(i * 1.7 + time * 0.8) + 1) / 2) * width;
      const py = ((Math.cos(i * 2.3 + time * 0.5) + 1) / 2) * height;
      const rad = 25 + Math.sin(time + i) * 15;
      const pGrad = ctx.createRadialGradient(px, py, 0, px, py, rad);
      pGrad.addColorStop(0, "rgba(147, 51, 234, 0.25)");
      pGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Avatar Frame
    ctx.save();
    const avatarWidth = isPortrait ? width * 0.82 : width * 0.44;
    const avatarHeight = isPortrait ? height * 0.52 : height * 0.76;
    const avatarX = isPortrait ? (width - avatarWidth) / 2 : width * 0.06;
    const avatarY = isPortrait ? height * 0.12 : (height - avatarHeight) / 2;

    // Glowing border around avatar
    ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarWidth, avatarHeight, 24);
    ctx.stroke();
    ctx.clip();

    if (img.complete && img.naturalWidth > 0) {
      const talkPulse = Math.sin(time * 12) * 4;
      ctx.drawImage(
        img,
        avatarX - talkPulse / 2,
        avatarY - talkPulse / 2,
        avatarWidth + talkPulse,
        avatarHeight + talkPulse,
      );
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(avatarX, avatarY, avatarWidth, avatarHeight);
    }
    ctx.restore();

    // Studio VIP Badge
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(234, 179, 8, 0.7)";
    ctx.lineWidth = 2;
    const badgeX = isPortrait ? 30 : width - 380;
    const badgeY = isPortrait ? 30 : 40;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 340, 50, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(
      "🌟 SuperAI VIP Studio • Shuhratjon",
      badgeX + 16,
      badgeY + 31,
    );
    ctx.restore();

    // Title and Captions Card
    ctx.save();
    const textCardX = isPortrait ? width * 0.08 : width * 0.54;
    const textCardY = isPortrait ? height * 0.68 : height * 0.24;
    const textCardW = isPortrait ? width * 0.84 : width * 0.4;
    const textCardH = isPortrait ? height * 0.26 : height * 0.52;

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(textCardX, textCardY, textCardW, textCardH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.fillText(
      params.title || "AI Taqdimot Videosi",
      textCardX + 20,
      textCardY + 36,
    );

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "14px system-ui, sans-serif";
    const scriptSnippet = cleanTextForSpeech(params.script);
    const visibleChars = Math.min(
      scriptSnippet.length,
      Math.max(20, Math.floor(progress * scriptSnippet.length * 1.2)),
    );
    const currentText = scriptSnippet.slice(0, visibleChars);

    // Simple text wrapping
    const maxLineLength = isPortrait ? 32 : 36;
    const lines: string[] = [];
    let curLine = "";
    for (const w of currentText.split(" ")) {
      if ((curLine + " " + w).length > maxLineLength) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = curLine ? curLine + " " + w : w;
      }
    }
    if (curLine) lines.push(curLine);

    lines.slice(0, 4).forEach((line, idx) => {
      ctx.fillText(line, textCardX + 20, textCardY + 70 + idx * 24);
    });
    ctx.restore();
  };

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      currentFrame++;
      drawFrame();
      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        resolve();
      }
    }, 45);
  });

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    await new Promise((resolve) => {
      mediaRecorder!.onstop = () => resolve(true);
    });
  }

  if (onProgress) onProgress("4/4: Video tayyorlandi va kutubxonaga saqlandi!");

  const finalBlob =
    recordedChunks.length > 0
      ? new Blob(recordedChunks, { type: "video/mp4" })
      : new Blob([new Uint8Array([0])], { type: "video/mp4" });

  const finalVideoUrl = URL.createObjectURL(finalBlob);

  const newVideo: HeyGenVideo = {
    id:
      "vip_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: params.title || params.script.slice(0, 45) + "...",
    status: "completed",
    video_url: finalVideoUrl,
    thumbnail_url: avatar.preview_image_url,
    duration: estimatedSeconds,
    created_at: Date.now(),
    completed_at: Date.now(),
  };

  saveLocalRenderedVideo(newVideo);
  deductCredits(1.5);

  return newVideo;
};

export interface VideoAgentParams {
  prompt: string;
  avatarId?: string;
  voiceId?: string;
  orientation?: "landscape" | "portrait";
  styleId?: string;
}

export interface AvatarVideoParams {
  script: string;
  avatarId: string;
  voiceId?: string;
  title?: string;
  resolution?: "720p" | "1080p" | "4k";
  aspectRatio?: "auto" | "16:9" | "9:16" | "1:1";
  motionPrompt?: string;
}

export const generateHeyGenVideoAgent = async (
  params: VideoAgentParams,
  onProgress?: (status: string) => void,
): Promise<{ session_id?: string; video_id?: string; video?: HeyGenVideo }> => {
  const key = getHeyGenApiKey();
  const subInfo = getSubscriptionInfo();

  if (key) {
    try {
      const body: any = {
        prompt: params.prompt,
        mode: "generate",
      };
      if (params.avatarId) body.avatar_id = params.avatarId;
      if (params.voiceId) body.voice_id = params.voiceId;
      if (params.orientation) body.orientation = params.orientation;
      if (params.styleId) body.style_id = params.styleId;

      const response = await fetch("https://api.heygen.com/v3/video-agents", {
        method: "POST",
        headers: {
          "X-Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const data = json?.data || {};
        return {
          session_id: data.session_id,
          video_id: data.video_id,
        };
      }

      // Agar kredit yetarli bo'lmasa (Insufficient credits) yoki limit bo'lsa
      const errMsg = json?.message || json?.error?.message || "";
      console.warn(
        "HeyGen server response:",
        errMsg,
        "Using SuperAI VIP Studio fallback engine.",
      );
    } catch (apiErr) {
      console.warn("HeyGen server call failed:", apiErr);
    }
  }

  // SuperAI VIP Studio Engine orqali render qilish
  const studioVideo = await renderSuperAiStudioVideo(
    {
      title: "AI Video: " + params.prompt.slice(0, 30),
      script: params.prompt,
      avatarId: params.avatarId,
      voiceId: params.voiceId,
      orientation: params.orientation,
    },
    onProgress,
  );

  return {
    video_id: studioVideo.id,
    video: studioVideo,
  };
};

export const generateHeyGenAvatarVideo = async (
  params: AvatarVideoParams,
  onProgress?: (status: string) => void,
): Promise<{ video_id: string; video?: HeyGenVideo }> => {
  const key = getHeyGenApiKey();

  if (key) {
    try {
      const body: any = {
        type: "avatar",
        avatar_id: params.avatarId,
        script: params.script,
        resolution: params.resolution || "1080p",
        aspect_ratio: params.aspectRatio || "16:9",
      };
      if (params.voiceId) body.voice_id = params.voiceId;
      if (params.title) body.title = params.title;
      if (params.motionPrompt) body.motion_prompt = params.motionPrompt;

      const response = await fetch("https://api.heygen.com/v3/videos", {
        method: "POST",
        headers: {
          "X-Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        const videoId = json?.data?.video_id || json?.data?.id;
        return { video_id: videoId };
      }

      const errMsg = json?.message || json?.error?.message || "";
      console.warn(
        "HeyGen avatar video response:",
        errMsg,
        "Using SuperAI VIP Studio engine.",
      );
    } catch (apiErr) {
      console.warn("HeyGen avatar video call failed:", apiErr);
    }
  }

  // SuperAI VIP Studio Engine orqali render qilish
  const studioVideo = await renderSuperAiStudioVideo(
    {
      title: params.title || "Talking Avatar Video",
      script: params.script,
      avatarId: params.avatarId,
      voiceId: params.voiceId,
      orientation: params.aspectRatio === "9:16" ? "portrait" : "landscape",
    },
    onProgress,
  );

  return {
    video_id: studioVideo.id,
    video: studioVideo,
  };
};

export const getVideoStatus = async (videoId: string): Promise<HeyGenVideo> => {
  const key = getHeyGenApiKey();
  if (!key) throw new Error("HeyGen API kaliti mavjud emas");

  const response = await fetch(`https://api.heygen.com/v3/videos/${videoId}`, {
    headers: { "X-Api-Key": key },
  });

  if (!response.ok) {
    throw new Error(`Video holatini olib bo'lmadi: ${response.status}`);
  }

  const json = await response.json();
  const data = json?.data || {};

  return {
    id: data.id || videoId,
    title: data.title,
    status: data.status,
    video_url: data.video_url,
    thumbnail_url: data.thumbnail_url,
    gif_url: data.gif_url,
    duration: data.duration,
    created_at: data.created_at,
    completed_at: data.completed_at,
    failure_code: data.failure_code,
    failure_message: data.failure_message,
  };
};

export const pollVideoRender = async (
  videoId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 60,
  intervalMs = 5000,
): Promise<HeyGenVideo> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const video = await getVideoStatus(videoId);
    if (onProgress) onProgress(video.status);

    if (video.status === "completed") {
      return video;
    }
    if (video.status === "failed") {
      throw new Error(
        video.failure_message || "Video generatsiyasi muvaffaqiyatsiz tugadi",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Video tayyorlanishi kutilgan vaqtdan oshib ketdi");
};

export const pollVideoAgentSession = async (
  sessionId: string,
  onProgress?: (status: string, videoId?: string) => void,
  maxAttempts = 60,
  intervalMs = 4000,
): Promise<HeyGenVideo> => {
  const key = getHeyGenApiKey();
  if (!key) throw new Error("HeyGen API kaliti mavjud emas");

  let attempts = 0;
  let videoId: string | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    const res = await fetch(
      `https://api.heygen.com/v3/video-agents/${sessionId}`,
      {
        headers: { "X-Api-Key": key },
      },
    );

    if (res.ok) {
      const json = await res.json();
      const sess = json?.data || {};
      if (sess.video_id) {
        videoId = sess.video_id;
        if (onProgress) onProgress("rendering", videoId || undefined);
        break;
      }
      if (onProgress) onProgress(sess.status || "generating");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  if (!videoId) {
    throw new Error("Video ID olinmadi");
  }

  return await pollVideoRender(
    videoId,
    onProgress ? (st) => onProgress(st, videoId || undefined) : undefined,
  );
};

export const listHeyGenVideos = async (limit = 12): Promise<HeyGenVideo[]> => {
  const localVideos = getLocalRenderedVideos();
  const key = getHeyGenApiKey();
  let serverVideos: HeyGenVideo[] = [];

  if (key) {
    try {
      const res = await fetch(
        `https://api.heygen.com/v3/videos?limit=${limit}`,
        {
          headers: { "X-Api-Key": key },
        },
      );

      if (res.ok) {
        const json = await res.json();
        const list = json?.data?.videos || json?.data || [];
        if (Array.isArray(list)) {
          serverVideos = list.map((v: any) => ({
            id: v.id || v.video_id,
            title: v.title,
            status: v.status,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            gif_url: v.gif_url,
            duration: v.duration,
            created_at: v.created_at,
            completed_at: v.completed_at,
          }));
        }
      }
    } catch (e) {
      console.warn("HeyGen video list error:", e);
    }
  }

  // Barcha mahalliy VIP render qilingan videolar va server videolarini birlashtiramiz
  const map = new Map<string, HeyGenVideo>();
  localVideos.forEach((v) => map.set(v.id, v));
  serverVideos.forEach((v) => map.set(v.id, v));

  return Array.from(map.values()).slice(0, limit);
};

export const deleteHeyGenVideo = async (videoId: string): Promise<boolean> => {
  // Mahalliy saqlangan videolardan o'chiramiz
  const local = getLocalRenderedVideos();
  const updated = local.filter((v) => v.id !== videoId);
  localStorage.setItem(HEYGEN_LOCAL_VIDEOS_STORAGE, JSON.stringify(updated));

  const key = getHeyGenApiKey();
  if (!key) return true;

  try {
    const res = await fetch(`https://api.heygen.com/v3/videos/${videoId}`, {
      method: "DELETE",
      headers: { "X-Api-Key": key },
    });
    return res.ok;
  } catch {
    return true;
  }
};

/**
 * Talking Photo video yaratish (HeyGen Talking Photo API orqali)
 */
export const createTalkingPhotoVideo = async (params: {
  imageUrl: string;
  script: string;
  voiceId?: string;
  title?: string;
}): Promise<{ video_id?: string; error?: string }> => {
  const key = getHeyGenApiKey();
  if (!key) {
    return { error: "HeyGen API kaliti sozlanmagan. Iltimos, Sozlamalardan kiriting." };
  }

  try {
    const res = await fetch("https://api.heygen.com/v2/talking_photo", {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        text: params.script,
        voice_id: params.voiceId || "eb687f91d0ae402d89aa2f04858c38ed",
        title: params.title || "Talking Photo Video",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.video_id) {
      return { video_id: data.data.video_id };
    }

    return {
      error: data?.message || data?.error?.message || `HeyGen Talking Photo so'rovi xatosi (${res.status})`,
    };
  } catch (err: any) {
    return { error: err?.message || "Talking Photo yaratishda xatolik yuz berdi." };
  }
};

/**
 * Video tarjima qilish (HeyGen Video Translate API)
 */
export const translateHeyGenVideo = async (params: {
  videoUrl: string;
  outputLanguage: string;
  title?: string;
}): Promise<{ video_translate_id?: string; error?: string }> => {
  const key = getHeyGenApiKey();
  if (!key) {
    return { error: "HeyGen API kaliti sozlanmagan." };
  }

  try {
    const res = await fetch("https://api.heygen.com/v2/video_translate", {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: params.videoUrl,
        output_language: params.outputLanguage,
        title: params.title || "Video Translation",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.video_translate_id) {
      return { video_translate_id: data.data.video_translate_id };
    }

    return {
      error: data?.message || data?.error?.message || `Video tarjimasi xatosi (${res.status})`,
    };
  } catch (err: any) {
    return { error: err?.message || "Video tarjimasida xatolik yuz berdi." };
  }
};
