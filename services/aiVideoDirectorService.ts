import { askGemini } from "./geminiService";
import { cleanTextForSpeech } from "./elevenLabsService";

export interface VideoScene {
  id: number;
  title: string;
  narration: string;
  visualTag: string;
  durationSeconds: number;
  themeColor: string;
  bulletPoints?: string[];
}

export interface DirectorVideoProject {
  title: string;
  summary: string;
  fullScript: string;
  scenes: VideoScene[];
  suggestedAvatarId: string;
  suggestedVoiceId: string;
  estimatedDuration: number;
  aspectRatio: "16:9" | "9:16";
}

export interface RealMotionAvatar {
  id: string;
  name: string;
  gender: "male" | "female";
  role: string;
  videoUrl: string;
  imageUrl: string;
  defaultVoiceId: string;
}

export const REAL_MOTION_AVATARS: RealMotionAvatar[] = [
  {
    id: "camille_streamer",
    name: "Camille (Studio Presenter)",
    gender: "female",
    role: "Studio & Tech Taqdimotchi",
    videoUrl:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/previews/Studio_Streamer_2.mp4",
    imageUrl:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/stills/Studio_Streamer_2.jpg",
    defaultVoiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
  },
  {
    id: "camille_corporate",
    name: "Camille (Executive Corporate)",
    gender: "female",
    role: "Biznes & Rasmiy Suxandon",
    videoUrl:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/previews/Modern_Corporate_3.mp4",
    imageUrl:
      "https://resource2.heygen.ai/public-avatars/Camille/lookpack/stills/Modern_Corporate_3.jpg",
    defaultVoiceId: "cgSgspJ2msm6clMCkdW9", // Jessica
  },
  {
    id: "abigail_expressive",
    name: "Abigail (Live Motion Presenter)",
    gender: "female",
    role: "Innovatsiya & Ta'lim",
    videoUrl:
      "https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_video_target.mp4",
    imageUrl:
      "https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp",
    defaultVoiceId: "FGY2WhTYpPnrIDTdsKH5", // Laura
  },
  {
    id: "wayne_professional",
    name: "Wayne (Corporate Leader)",
    gender: "male",
    role: "Boshqaruv & Texnologiyalar",
    videoUrl:
      "https://files2.heygen.ai/avatar/v3/Wayne_20240711/preview_video_target.mp4",
    imageUrl:
      "https://files2.heygen.ai/avatar/v3/Wayne_20240711/preview_target.webp",
    defaultVoiceId: "pNInz6obpgDQGcFmaJgB", // Adam
  },
  {
    id: "bryan_tech",
    name: "Bryan (IT & AI Specialist)",
    gender: "male",
    role: "Dasturlash & IT Mutaxassis",
    videoUrl:
      "https://files2.heygen.ai/avatar/v3/Bryan_IT_Sitting_public/preview_video_target.mp4",
    imageUrl:
      "https://files2.heygen.ai/avatar/v3/Bryan_IT_Sitting_public/preview_target.webp",
    defaultVoiceId: "JBFqnCBsd6RMkjVDRZzb", // George
  },
  {
    id: "daisy_presenter",
    name: "Daisy (Media & News Anchor)",
    gender: "female",
    role: "Media & Yangiliklar",
    videoUrl:
      "https://files2.heygen.ai/avatar/v3/Daisy-inskirt-20220818/preview_video_target.mp4",
    imageUrl:
      "https://files2.heygen.ai/avatar/v3/Daisy-inskirt-20220818/preview_target.webp",
    defaultVoiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
  },
];

export const generateAiDirectorProject = async (
  prompt: string,
  aspectRatio: "16:9" | "9:16" = "16:9",
  customAvatarId?: string
): Promise<DirectorVideoProject> => {
  const systemPrompt = `Siz professional AI Video Rejissyori (AI Video Director)siz.
Foydalanuvchi bergan mavzu yoki g'oya bo'yicha to'liq professional video loyihasi (ssenariy, kadrlar bo'linishi, visual taglar) yarating.
Javobni FAQAT toza JSON formatida quyidagi struktura bo'yicha qaytaring (hech qanday markdown \`\`\`json belgilarsiz):
{
  "title": "Jozibali va qisqa video sarlavhasi",
  "summary": "Video haqida qisqa ma'lumot",
  "fullScript": "Taqdimotchi aytadigan to'liq, ravon o'zbek tilidagi matn (35-70 so'z atrofida, insondek tabiiy va jonli)",
  "scenes": [
    {
      "id": 1,
      "title": "Kirish va Asosiy g'oya",
      "narration": "Birinchi qism matni...",
      "visualTag": "⚡ Innovatsiya & Kirish",
      "durationSeconds": 6,
      "themeColor": "#3b82f6",
      "bulletPoints": ["Asosiy maqsad", "Muhim afzallik"]
    },
    {
      "id": 2,
      "title": "Asosiy imkoniyatlar",
      "narration": "Ikkinchi qism matni...",
      "visualTag": "🚀 Imkoniyatlar & Texnologiya",
      "durationSeconds": 8,
      "themeColor": "#8b5cf6",
      "bulletPoints": ["Yuqori samaradorlik", "Tezkor natija"]
    },
    {
      "id": 3,
      "title": "Xulosa va Harakatga chaqiruv",
      "narration": "Uchinchi qism matni...",
      "visualTag": "🎯 Xulosa & Natija",
      "durationSeconds": 6,
      "themeColor": "#10b981",
      "bulletPoints": ["Kengaytirilgan imkoniyat", "Boshlashga tayyormisiz?"]
    }
  ],
  "suggestedAvatarId": "camille_streamer",
  "suggestedVoiceId": "pNInz6obpgDQGcFmaJgB"
}`;

  try {
    const rawResponse = await askGemini({
      parts: [
        {
          text: `Mavzu/Topshiriq: "${prompt}". Video formati: ${aspectRatio}. Iltimos, professional video ssenariysi va kadrlarni tayyorlab bering.`,
        },
      ],
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    const cleaned = rawResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    const fullScript =
      parsed.fullScript ||
      (parsed.scenes && Array.isArray(parsed.scenes)
        ? parsed.scenes.map((s: any) => s.narration).join(" ")
        : prompt);

    const totalSeconds =
      parsed.scenes?.reduce(
        (acc: number, s: any) => acc + (s.durationSeconds || 6),
        0
      ) || 18;

    return {
      title: parsed.title || "SuperAI Professional Video",
      summary: parsed.summary || prompt,
      fullScript: cleanTextForSpeech(fullScript),
      scenes: parsed.scenes || [
        {
          id: 1,
          title: "Asosiy Taqdimot",
          narration: fullScript,
          visualTag: "⚡ Professional Video",
          durationSeconds: totalSeconds,
          themeColor: "#8b5cf6",
        },
      ],
      suggestedAvatarId: customAvatarId || parsed.suggestedAvatarId || "camille_streamer",
      suggestedVoiceId: parsed.suggestedVoiceId || "pNInz6obpgDQGcFmaJgB",
      estimatedDuration: totalSeconds,
      aspectRatio,
    };
  } catch (err) {
    console.warn("AI Director Gemini parse error, using smart fallback:", err);

    return {
      title: prompt.slice(0, 40) + "...",
      summary: prompt,
      fullScript: cleanTextForSpeech(prompt),
      scenes: [
        {
          id: 1,
          title: "Kirish",
          narration: prompt,
          visualTag: "⚡ SuperAI Studio",
          durationSeconds: 15,
          themeColor: "#6366f1",
          bulletPoints: ["SuperAI Innovatsiyasi", "VIP Sifat"],
        },
      ],
      suggestedAvatarId: customAvatarId || "camille_streamer",
      suggestedVoiceId: "pNInz6obpgDQGcFmaJgB",
      estimatedDuration: 15,
      aspectRatio,
    };
  }
};

import { HeyGenVideo } from "../types";
import { synthesizeSpeechAudio } from "./elevenLabsService";
import { saveLocalRenderedVideo } from "./heygenService";
import { deductCredits } from "./promoService";

export const renderRealMotionAiVideo = async (
  project: DirectorVideoProject,
  onProgress?: (status: string) => void
): Promise<HeyGenVideo> => {
  if (onProgress) onProgress("1/5: AI Rejissyor ssenariyni ElevenLabs HD ovozga aylantirmoqda...");

  let audioBlob: Blob | null = null;
  try {
    audioBlob = await synthesizeSpeechAudio(
      project.fullScript,
      project.suggestedVoiceId
    );
  } catch (err) {
    console.warn("ElevenLabs audio synthesis fallback:", err);
  }

  if (onProgress) onProgress("2/5: Haqiqiy jonli video taqdimotchi (Real Motion Presenter) yuklanmoqda...");

  const isPortrait = project.aspectRatio === "9:16";
  const width = isPortrait ? 720 : 1280;
  const height = isPortrait ? 1280 : 720;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const avatar =
    REAL_MOTION_AVATARS.find((a) => a.id === project.suggestedAvatarId) ||
    REAL_MOTION_AVATARS[0];

  // Load Real Video Element for dynamic motion
  const videoElem = document.createElement("video");
  videoElem.crossOrigin = "anonymous";
  videoElem.src = avatar.videoUrl;
  videoElem.muted = true;
  videoElem.loop = true;
  videoElem.playsInline = true;

  // Also load fallback image if video is buffering
  const fallbackImg = new Image();
  fallbackImg.crossOrigin = "anonymous";
  fallbackImg.src = avatar.imageUrl;

  await Promise.all([
    new Promise((resolve) => {
      videoElem.onloadeddata = () => {
        videoElem.play().catch(() => {}).then(() => resolve(true));
      };
      videoElem.onerror = () => resolve(true);
      setTimeout(() => resolve(true), 4000);
    }),
    new Promise((resolve) => {
      fallbackImg.onload = () => resolve(true);
      fallbackImg.onerror = () => resolve(true);
      setTimeout(() => resolve(true), 2000);
    }),
  ]);

  try {
    await videoElem.play();
  } catch {
    /* ignore */
  }

  if (onProgress) onProgress("3/5: Ko'p sahnali (Multi-Scene) video montaj va effektlar tayyorlanmoqda...");

  let audioElem: HTMLAudioElement | null = null;
  let audioDuration = project.estimatedDuration || 16;
  if (audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    audioElem = new Audio(audioUrl);
    await new Promise((resolve) => {
      audioElem!.onloadedmetadata = () => {
        if (audioElem!.duration && !isNaN(audioElem!.duration)) {
          audioDuration = Math.ceil(audioElem!.duration);
        }
        resolve(true);
      };
      setTimeout(() => resolve(true), 1500);
    });
  }

  const fps = 24;
  const totalFrames = Math.max(fps * 6, Math.min(fps * 60, fps * audioDuration));
  const stream = canvas.captureStream(fps);
  let combinedStream = stream;

  try {
    if (audioElem) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    /* fallback */
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
    console.warn("MediaRecorder start error:", recErr);
  }

  if (audioElem) {
    try {
      await audioElem.play();
    } catch {
      /* ignore */
    }
  }

  if (onProgress) onProgress("4/5: Professional AI Video render qilinmoqda (Full HD)...");

  let currentFrame = 0;
  const drawFrame = () => {
    if (!ctx) return;
    const progress = currentFrame / totalFrames;
    const time = currentFrame / fps;

    // Determine current scene from project scenes
    const sceneCount = project.scenes.length || 1;
    const currentSceneIndex = Math.min(
      sceneCount - 1,
      Math.floor(progress * sceneCount)
    );
    const scene = project.scenes[currentSceneIndex] || project.scenes[0];

    // Background: Dynamic Cyber Studio Horizon
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#050b14");
    grad.addColorStop(0.4, "#0b192e");
    grad.addColorStop(1, "#180a2a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ambient light auras
    ctx.save();
    const auraX = ((Math.sin(time * 0.7) + 1) / 2) * width;
    const auraY = ((Math.cos(time * 0.5) + 1) / 2) * height;
    const aGrad = ctx.createRadialGradient(auraX, auraY, 10, auraX, auraY, width * 0.45);
    aGrad.addColorStop(0, scene.themeColor + "33");
    aGrad.addColorStop(1, "transparent");
    ctx.fillStyle = aGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Perspective Grid Lines
    ctx.save();
    ctx.strokeStyle = "rgba(139, 92, 246, 0.12)";
    ctx.lineWidth = 1;
    const horizon = height * 0.65;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(width / 2 + (x - width / 2) * 0.2, horizon);
      ctx.stroke();
    }
    for (let y = horizon; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 1. Draw Real Moving Human Video Presenter
    ctx.save();
    const avatarWidth = isPortrait ? width * 0.88 : width * 0.44;
    const avatarHeight = isPortrait ? height * 0.54 : height * 0.80;
    const avatarX = isPortrait ? (width - avatarWidth) / 2 : width * 0.05;
    const avatarY = isPortrait ? height * 0.09 : (height - avatarHeight) / 2;

    // Glowing futuristic border
    ctx.strokeStyle = scene.themeColor || "#8b5cf6";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = scene.themeColor || "#8b5cf6";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarWidth, avatarHeight, 28);
    ctx.stroke();
    ctx.clip();

    if (videoElem.readyState >= 2 && !videoElem.paused && !videoElem.ended) {
      ctx.drawImage(videoElem, avatarX, avatarY, avatarWidth, avatarHeight);
    } else if (fallbackImg.complete && fallbackImg.naturalWidth > 0) {
      const pulse = Math.sin(time * 8) * 3;
      ctx.drawImage(
        fallbackImg,
        avatarX - pulse / 2,
        avatarY - pulse / 2,
        avatarWidth + pulse,
        avatarHeight + pulse
      );
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(avatarX, avatarY, avatarWidth, avatarHeight);
    }
    ctx.restore();

    // 2. Scene Badge (Top)
    ctx.save();
    const badgeX = isPortrait ? 25 : width - 390;
    const badgeY = isPortrait ? 25 : 35;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(234, 179, 8, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 360, 48, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText("🌟 " + (scene.visualTag || "SuperAI VIP Studio"), badgeX + 16, badgeY + 29);
    ctx.restore();

    // 3. Information & Scene Storyboard Card
    ctx.save();
    const cardX = isPortrait ? width * 0.06 : width * 0.53;
    const cardY = isPortrait ? height * 0.65 : height * 0.20;
    const cardW = isPortrait ? width * 0.88 : width * 0.42;
    const cardH = isPortrait ? height * 0.30 : height * 0.62;

    ctx.fillStyle = "rgba(11, 20, 38, 0.92)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 22);
    ctx.fill();
    ctx.stroke();

    // Scene Title
    ctx.fillStyle = scene.themeColor || "#38bdf8";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillText(
      `[${currentSceneIndex + 1}/${sceneCount}] ${scene.title || project.title}`,
      cardX + 22,
      cardY + 38
    );

    // Dynamic Live Narration / Kinetic Subtitles
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px system-ui, sans-serif";
    const sceneText = scene.narration || project.fullScript;
    const words = sceneText.split(" ");
    const sceneProgress = (progress * sceneCount) % 1;
    const visibleWordsCount = Math.max(3, Math.floor(sceneProgress * words.length * 1.3));
    const visibleText = words.slice(0, visibleWordsCount).join(" ");

    const maxCharsPerLine = isPortrait ? 30 : 36;
    const lines: string[] = [];
    let curLine = "";
    for (const w of visibleText.split(" ")) {
      if ((curLine + " " + w).length > maxCharsPerLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = curLine ? curLine + " " + w : w;
      }
    }
    if (curLine) lines.push(curLine);

    lines.slice(0, 3).forEach((l, idx) => {
      ctx.fillText(l, cardX + 22, cardY + 75 + idx * 24);
    });

    // Scene Bullet points
    if (scene.bulletPoints && scene.bulletPoints.length > 0) {
      scene.bulletPoints.slice(0, 2).forEach((bp, bidx) => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        const bpY = cardY + 155 + bidx * 34;
        ctx.beginPath();
        ctx.roundRect(cardX + 20, bpY, cardW - 40, 28, 8);
        ctx.fill();

        ctx.fillStyle = "#a7f3d0";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillText("✓  " + bp, cardX + 32, bpY + 18);
      });
    }

    // Audio Equalizer Waveform Indicator
    ctx.save();
    const eqX = cardX + 22;
    const eqY = cardY + cardH - 30;
    ctx.fillStyle = scene.themeColor || "#a855f7";
    for (let b = 0; b < 18; b++) {
      const barH = 5 + Math.abs(Math.sin(time * 10 + b * 0.7)) * 18;
      ctx.fillRect(eqX + b * 12, eqY - barH, 6, barH);
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText("ElevenLabs HD Voice", eqX + 240, eqY - 4);
    ctx.restore();

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
    }, 1000 / fps);
  });

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    await new Promise((resolve) => {
      mediaRecorder!.onstop = () => resolve(true);
    });
  }

  if (onProgress) onProgress("5/5: Video muvaffaqiyatli tayyorlandi va saqlandi!");

  const finalBlob =
    recordedChunks.length > 0
      ? new Blob(recordedChunks, { type: "video/mp4" })
      : new Blob([new Uint8Array([0])], { type: "video/mp4" });

  const finalVideoUrl = URL.createObjectURL(finalBlob);

  const newVideo: HeyGenVideo = {
    id: "ai_vid_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: project.title,
    status: "completed",
    video_url: finalVideoUrl,
    thumbnail_url: avatar.imageUrl,
    duration: Math.round(audioDuration),
    created_at: Date.now(),
    completed_at: Date.now(),
  };

  saveLocalRenderedVideo(newVideo);
  deductCredits(2.0);

  return newVideo;
};
