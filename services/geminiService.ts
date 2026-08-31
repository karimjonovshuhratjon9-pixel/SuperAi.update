import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODELS, SYSTEM_INSTRUCTION } from "../constants";
import { Message } from "../types";

const NO_KEY_MESSAGE =
  "API kalit kiritilmagan. Iltimos, bepul Gemini API kalitingizni kiriting (AIzaSy... bilan boshlanadi).";

// ================= API KEY =================

export const getApiKey = (): string => {
  try {
    const localKey = localStorage.getItem("superai_api_key");
    if (localKey && localKey.trim().length > 0) {
      return localKey.trim();
    }
  } catch {
    /* localStorage mavjud emas */
  }

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) {
    const envKey = import.meta.env.VITE_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }
  }

  return "";
};

export const setApiKey = (key: string): void => {
  localStorage.setItem("superai_api_key", key.trim());
  invalidateClient();
  invalidateModelCache();
};

export const hasApiKey = (): boolean => getApiKey().length > 0;

// ================= MODEL TANLASH VA REJIMLAR =================

export type ChatMode = "fast" | "deep" | "creative";

export interface ModeConfig {
  label: string;
  icon: string;
  temperature: number;
  preferPro: boolean;
  hint: string;
}

export const CHAT_MODES: Record<ChatMode, ModeConfig> = {
  fast: {
    label: "Smart",
    icon: "⚡",
    temperature: 0.7,
    preferPro: false,
    hint: "Tez va kuchli model siyosati",
  },
  deep: {
    label: "Smart",
    icon: "🧠",
    temperature: 0.7,
    preferPro: false,
    hint: "Tez va kuchli model siyosati",
  },
  creative: {
    label: "Smart",
    icon: "🎨",
    temperature: 0.7,
    preferPro: false,
    hint: "Tez va kuchli model siyosati",
  },
};

const PREF_KEY = "superai_preferred_model";
const MODE_KEY = "superai_chat_mode";

export const getPreferredModel = (): string =>
  localStorage.getItem(PREF_KEY) || "";
export const setPreferredModel = (name: string): void => {
  if (name) localStorage.setItem(PREF_KEY, name);
  else localStorage.removeItem(PREF_KEY);
};

export const getChatMode = (): ChatMode =>
  (localStorage.getItem(MODE_KEY) as ChatMode) || "fast";
export const setChatMode = (mode: ChatMode): void =>
  localStorage.setItem(MODE_KEY, mode);

// ================= STREAM BEKOR QILISH =================
// Foydalanuvchi "To'xtatish" tugmasini bossa, joriy so'rov bekor qilinadi.
let activeAbort: AbortController | null = null;

export const cancelActiveStream = (): void => {
  activeAbort?.abort();
  activeAbort = null;
};

const newAbortSignal = (): AbortSignal => {
  cancelActiveStream();
  activeAbort = new AbortController();
  return activeAbort.signal;
};

// ================= SO'ROV STATISTIKASI =================

const STATS_KEY = "superai_stats_v1";

interface UsageStats {
  requests: number;
  charsIn: number;
  charsOut: number;
  day: string;
}

const todayKey = (): string => new Date().toISOString().slice(0, 10);

export const getUsageStats = (): UsageStats => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const s: UsageStats = JSON.parse(raw);
      if (s.day === todayKey()) return s;
    }
  } catch {
    /* ignore */
  }
  return { requests: 0, charsIn: 0, charsOut: 0, day: todayKey() };
};

const bumpStats = (charsIn: number, charsOut: number): void => {
  try {
    const s = getUsageStats();
    s.requests += 1;
    s.charsIn += charsIn;
    s.charsOut += charsOut;
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

// Barcha rejimlar bir xil Smart model zanjiridan foydalanadi.
// Foydalanuvchi modelni alohida belgilagan bo'lsa, u birinchi sinovdan o'tadi.
export const resolveModelChainForMode = async (
  mode: ChatMode,
): Promise<string[]> => {
  const base = await resolveModelChain();
  const preferred = getPreferredModel();
  let chain = [...base];
  if (preferred && chain.includes(preferred)) {
    chain = [preferred, ...chain.filter((m) => m !== preferred)];
  }
  return chain;
};

// ================= CLIENT (singleton) =================
// Har chaqiruvda yangi klient yaratilmaydi — resurs tejaladi.

let cachedClient: { key: string; client: GoogleGenerativeAI } | null = null;

const getClient = (): GoogleGenerativeAI => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error(NO_KEY_MESSAGE);
  if (!cachedClient || cachedClient.key !== apiKey) {
    cachedClient = { key: apiKey, client: new GoogleGenerativeAI(apiKey) };
  }
  return cachedClient.client;
};

export const invalidateClient = (): void => {
  cachedClient = null;
};

// ================= MODEL DISCOVERY =================
// Mavjud modellarni API'dan avtomatik aniqlaydi. Notog'ri/yaroqsiz model
// nomlari sababli ketma-ket muvaffaqiyatsiz urinishlar (asosiy sekinlik
// manbasi) butunlay yo'q qilinadi.

const MODEL_CACHE_KEY = "superai_model_cache_v2";
const MODEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

const UNAVAILABLE_NEW_USER_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
]);

let memoryChain: string[] | null = null;

const speedScore = (name: string): number => {
  if (/flash-lite/i.test(name)) return 0; // eng tezkor modellar birinchi
  if (/flash/i.test(name)) return 1;
  return 2;
};

const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body}`);
  }
  const data = await res.json();
  const models: Array<{
    name: string;
    supportedGenerationMethods?: string[];
  }> = data?.models || [];

  return models
    .filter((m) =>
      (m.supportedGenerationMethods || []).includes("generateContent"),
    )
    .map((m) => m.name.replace(/^models\//, ""))
    .filter((n) => !UNAVAILABLE_NEW_USER_MODELS.has(n))
    .filter(
      (n) =>
        !/(embedding|aqa|imagen|image|tts|audio|live|veo|learnlm|robotics)/i.test(
          n,
        ),
    )
    .sort((a, b) => speedScore(a) - speedScore(b));
};

export const resolveModelChain = async (): Promise<string[]> => {
  if (memoryChain && memoryChain.length > 0) return memoryChain;

  // 1) Keshdan o'qish (24 soatgacha yaroqli)
  try {
    const raw = localStorage.getItem(MODEL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Date.now() - parsed.t < MODEL_CACHE_TTL_MS &&
        Array.isArray(parsed.models) &&
        parsed.models.length > 0
      ) {
        const cachedModels: string[] = parsed.models.filter(
          (name: string) => !UNAVAILABLE_NEW_USER_MODELS.has(name),
        );
        if (cachedModels.length > 0) {
          memoryChain = cachedModels;
          return cachedModels;
        }
      }
    }
  } catch {
    /* kesh buzgan — qayta aniqlaymiz */
  }

  const apiKey = getApiKey();
  if (!apiKey) throw new Error(NO_KEY_MESSAGE);

  // 2) API'dan jonli aniqlash
  try {
    const available = await fetchAvailableModels(apiKey);
    if (available.length > 0) {
      const preferredAvailable = MODELS.TEXT_FALLBACKS.filter((name) =>
        available.includes(name),
      );
      memoryChain = [...new Set([...preferredAvailable, ...available])].slice(
        0,
        4,
      );
      try {
        localStorage.setItem(
          MODEL_CACHE_KEY,
          JSON.stringify({ t: Date.now(), models: memoryChain }),
        );
      } catch {
        /* ignore */
      }
      return memoryChain;
    }
  } catch (err) {
    if (isFatalKeyError(err)) throw toFriendlyError(err);
    // tarmoq xatosi — statik zaxira ro'yxatga o'tamiz
  }

  // 3) Zaxira statik ro'yxat
  memoryChain = [...MODELS.TEXT_FALLBACKS];
  return memoryChain;
};

export const invalidateModelCache = (): void => {
  memoryChain = null;
  try {
    localStorage.removeItem(MODEL_CACHE_KEY);
  } catch {
    /* ignore */
  }
};

// ================= ERROR CLASSIFICATION =================

const statusOf = (err: any): number | null => {
  const text = String(err?.message || err || "");
  const match = text.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : null;
};

const isModelNotFound = (err: any): boolean =>
  statusOf(err) === 404 ||
  /not found|does not exist|is not supported/i.test(String(err?.message || ""));

const isRetryable = (err: any): boolean =>
  [408, 429, 500, 502, 503, 504].includes(statusOf(err) ?? 0);

const isFatalKeyError = (err: any): boolean => {
  const status = statusOf(err);
  const text = String(err?.message || "");
  return (
    status === 401 ||
    status === 403 ||
    (status === 400 && /api key/i.test(text))
  );
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const toFriendlyError = (err: any): Error => {
  const status = statusOf(err);
  const raw = String(err?.message || err || "");

  if (
    /api key not valid|invalid api key/i.test(raw) ||
    (status === 400 && /api key/i.test(raw))
  ) {
    return new Error(
      "API kalit noto'g'ri. Google AI Studio'da yangi kalit oling (AIzaSy... bilan boshlanadi) va uni ilovaga kiriting.",
    );
  }
  if (status === 429) {
    return new Error(
      "So'rovlar limitiga yetildi (429). Bir necha soniya kutib qayta urinib ko'ring.",
    );
  }
  if (status === 403) {
    return new Error(
      "Ruxsat yo'q (403). API kalitingiz ushbu model uchun faollashtirilmagan bo'lishi mumkin.",
    );
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return new Error(
      "Internet aloqasi uzilgan. Tarmoqni tekshirib qayta urinib ko'ring.",
    );
  }
  if (status === 404) {
    return new Error(
      "Mos model topilmadi. Ilovani qayta ochib ko'ring (modellar qayta aniqlanadi).",
    );
  }
  return new Error(
    raw || "Kutilmagan xatolik yuz berdi. Qaytadan urinib ko'ring.",
  );
};

// ================= TIMEOUT =================

const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label = "So'rov",
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `${label} ${Math.round(ms / 1000)} soniyada javob bermadi.`,
            ),
          ),
        ms,
      ),
    ),
  ]);

// ================= RESILIENT RUNNER =================
// Har bir model uchun: vaqt chegarasi + vaqtinchalik xatlarda retry (backoff).
// Model topilmasa: darhol keyingi modelga o'tadi — hech qachon osilib qolmaydi.

class NoRetryError extends Error {
  constructor(public cause: any) {
    super(String(cause?.message || cause));
  }
}

interface ResilienceOptions {
  timeoutMs?: number;
  retriesPerModel?: number;
}

const runResilient = async <T>(
  run: (modelName: string) => Promise<T>,
  options: ResilienceOptions = {},
  modelChain?: string[],
): Promise<T> => {
  if (!hasApiKey()) throw new Error(NO_KEY_MESSAGE);

  const timeoutMs = options.timeoutMs ?? 45_000;
  const retriesPerModel = options.retriesPerModel ?? 2;

  const chain = modelChain ?? (await resolveModelChain());
  let lastError: any = null;

  for (const modelName of chain) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await withTimeout(run(modelName), timeoutMs);
      } catch (err) {
        lastError = err;
        if (err instanceof NoRetryError) throw toFriendlyError(err.cause);
        if (isFatalKeyError(err)) throw toFriendlyError(err);
        if (isModelNotFound(err)) {
          invalidateModelCache();
          break; // keyingi modelga
        }
        if (isRetryable(err) && attempt < retriesPerModel) {
          await sleep(700 * Math.pow(2, attempt)); // 700ms → 1400ms
          continue;
        }
        break; // noma'lum xato — keyingi modelga
      }
    }
  }

  throw toFriendlyError(lastError);
};

// ================= PUBLIC API =================

const buildImagePart = (imageBase64: string): any | null => {
  const match = imageBase64.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
};

export interface AskOptions {
  parts: any[];
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  responseMimeType?: "text/plain" | "application/json";
}

/** Umumiy chidamli so'rov — chat, ovoz va rasm tahrirda ishlatiladi. */
export const askGemini = (options: AskOptions): Promise<string> => {
  const {
    parts,
    systemInstruction = SYSTEM_INSTRUCTION,
    maxOutputTokens = 8192,
    temperature = 0.7,
    timeoutMs,
    responseMimeType,
  } = options;

  return runResilient(
    (modelName) => {
      const model = getClient().getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      return model
        .generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature,
            topP: 0.95,
            maxOutputTokens,
            ...(responseMimeType ? { responseMimeType } : {}),
          },
        })
        .then((result) => {
          const text = result.response.text();
          bumpStats(
            parts.reduce((n, p) => n + (p.text?.length || 0), 0),
            text.length,
          );
          return text;
        });
    },
    { timeoutMs },
  );
};

export const getGeminiResponse = (
  prompt: string,
  imageBase64?: string,
): Promise<string> => {
  const parts: any[] = [];
  if (imageBase64) {
    const imagePart = buildImagePart(imageBase64);
    if (imagePart) parts.push(imagePart);
  }
  parts.push({ text: prompt });
  return askGemini({ parts });
};

export const streamChat = async (
  prompt: string,
  imageBase64: string | undefined,
  historyMessages: Message[] = [],
  onChunk?: (text: string) => void,
  opts?: {
    mode?: ChatMode;
    systemInstruction?: string;
    maxOutputTokens?: number;
    timeoutMs?: number;
  },
): Promise<string> => {
  const contents: any[] = [];

  // Oldingi kontekst (oxirgi 10 xabar)
  const recentHistory = historyMessages.slice(-10);
  for (const msg of recentHistory) {
    const role = msg.role === "user" ? "user" : "model";
    const parts: any[] = [];
    if (msg.imageUrl) {
      const imagePart = buildImagePart(msg.imageUrl);
      if (imagePart) parts.push(imagePart);
    }
    if (
      msg.content &&
      msg.content !== "Thinking..." &&
      msg.content !== "Fikrlamoqda..."
    ) {
      parts.push({ text: msg.content });
    }
    if (parts.length > 0) contents.push({ role, parts });
  }

  // Joriy so'rov
  const currentParts: any[] = [];
  if (imageBase64) {
    const imagePart = buildImagePart(imageBase64);
    if (imagePart) currentParts.push(imagePart);
  }
  currentParts.push({
    text: prompt || "Rasm haqida ma'lumot ber va tahlil qil.",
  });
  contents.push({ role: "user", parts: currentParts });

  const mode = opts?.mode || "fast";
  const sysInstruction = opts?.systemInstruction || SYSTEM_INSTRUCTION;
  const temperature = CHAT_MODES[mode].temperature;
  const chain = await resolveModelChainForMode(mode);

  return runResilient(
    async (modelName) => {
      const model = getClient().getGenerativeModel({
        model: modelName,
        systemInstruction: sysInstruction,
      });

      const result = await model.generateContentStream(
        {
          contents,
          generationConfig: {
            temperature,
            topP: 0.95,
            maxOutputTokens: opts?.maxOutputTokens ?? 8192,
          },
          safetySettings: [],
        } as any,
        { signal: newAbortSignal() },
      );

      let fullResponse = "";
      let emitted = false;
      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponse += chunkText;
            emitted = true;
            if (onChunk) onChunk(chunkText);
          }
        }
      } catch (err) {
        // Oqim o'rtasida uzilsa, qayta urinish matnni ikki marta
        // chiqarib qo'yishi mumkin — shuning uchun darhol to'xtatamiz.
        if (emitted) throw new NoRetryError(err);
        throw err;
      }
      bumpStats(
        contents.reduce(
          (n, c) =>
            n +
            (c.parts || []).reduce(
              (k: number, p: { text?: string }) => k + (p.text?.length || 0),
              0,
            ),
          0,
        ),
        fullResponse.length,
      );
      return fullResponse;
    },
    { timeoutMs: opts?.timeoutMs ?? 90_000 },
    chain,
  );
};

export const streamClaudeChat = async (
  prompt: string,
  historyMessages: Message[] = [],
  onChunk?: (text: string) => void,
): Promise<string> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Claude API key kiritilmagan. .env.local fayliga VITE_ANTHROPIC_API_KEY qo'shing.",
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 2048,
      stream: true,
      messages: [
        ...historyMessages
          .filter(
            (message) =>
              message.content && message.content !== "Fikrlamoqda...",
          )
          .slice(-10)
          .map((message) => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
          })),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Claude so'rovi xatosi (${response.status}): ${detail.slice(0, 180)}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullResponse = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        const text = event?.delta?.text || "";
        if (text) {
          fullResponse += text;
          onChunk?.(text);
        }
      } catch {
        /* Ignore incomplete SSE frames. */
      }
    }
  }
  return fullResponse;
};

// ================= IMAGE GENERATION =================
// 1) Prompt avtomatik tarjima: o'zbek/rus/istalgan til -> boy inglizcha
//    image-prompt (Gemini orqali). Bu Flux kabi generatorlarning o'zbekcha
//    promptni tushunmasligi muammosini butunlay hal qiladi.
// 2) Keyin Pollinations (Flux) generatoriga yuboriladi.

const translatePrompt = async (prompt: string): Promise<string> => {
  try {
    const translated = await askGemini({
      parts: [
        {
          text: `Translate and enrich this image-generation prompt into ONE detailed English prompt for an AI image generator. Keep every detail the user described, add helpful visual details (style, lighting, composition) only if they fit naturally. Respond with the English prompt text ONLY — no explanations, no quotes.\n\nUser prompt: "${prompt}"`,
        },
      ],
      maxOutputTokens: 400,
      temperature: 0.4,
      timeoutMs: 25_000,
    });
    const clean = translated.trim().replace(/^"|"$/g, "");
    // Tarjima juda qisqa chiqsa (xato bo'lsa) — asl promptni ishlatamiz
    return clean.length > 5 ? clean : prompt;
  } catch {
    // Gemini ishlamasa — asl prompt bilan urinib ko'ramiz
    return prompt;
  }
};

export const generateImage = async (
  prompt: string,
  opts?: {
    onStatus?: (text: string) => void;
    aspectRatio?: "square" | "portrait" | "landscape";
    style?: string;
    negativePrompt?: string;
  },
): Promise<string> => {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error("Rasm yaratish uchun prompt bo'sh bo'lmasligi kerak.");
  }

  opts?.onStatus?.("🌐 Prompt inglizchaga tarjima qilinmoqda...");
  const englishPrompt = await translatePrompt(trimmed);

  const style = opts?.style ? `, ${opts.style} style` : "";
  const negative = opts?.negativePrompt
    ? `, avoid: ${opts.negativePrompt}`
    : "";
  const finalPrompt = `${englishPrompt}${style}, natural realistic details, accurate anatomy, coherent composition, professional lighting, sharp focus, high quality${negative}`;
  const encodedPrompt = encodeURIComponent(finalPrompt);
  const seed = Math.floor(Math.random() * 1_000_000);
  const dimensions =
    opts?.aspectRatio === "portrait"
      ? { width: 768, height: 1024 }
      : opts?.aspectRatio === "landscape"
        ? { width: 1024, height: 768 }
        : { width: 1024, height: 1024 };

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&nologo=true&private=true&enhance=true&model=flux&seed=${seed}`;
};

export const editImage = async (
  prompt: string,
  baseImageBase64: string,
): Promise<string> => {
  const imagePart = buildImagePart(baseImageBase64);
  if (!imagePart) throw new Error("Yaroqsiz rasm formati.");

  const description = await askGemini({
    parts: [
      imagePart,
      {
        text: `The user wants this edit applied to the image: "${prompt}". The user may write in Uzbek, Russian or any language — understand it anyway. Write ONE concise standalone English image-generation prompt describing the COMPLETE edited scene (the final result, not the difference). Respond with the prompt text only.`,
      },
    ],
    maxOutputTokens: 512,
    temperature: 0.6,
    timeoutMs: 30_000,
  });

  return generateImage(description.trim() || prompt);
};
