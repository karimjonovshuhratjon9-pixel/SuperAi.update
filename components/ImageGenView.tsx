import React, { useState, useRef } from "react";
import { generateImage, editImage, hasApiKey } from "../services/geminiService";

interface ImageGenViewProps {
  onOpenApiKeyModal: () => void;
}

const ImageGenView: React.FC<ImageGenViewProps> = ({ onOpenApiKeyModal }) => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [aspectRatio, setAspectRatio] = useState<
    "square" | "portrait" | "landscape"
  >("square");
  const [style, setStyle] = useState("Photorealistic");
  const [negativePrompt, setNegativePrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusText, setStatusText] = useState(
    "AI prompt tahlil qilinmoqda...",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleGenerateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setErrorText(null);
    setStatusText("🌐 Prompt tarjima qilinmoqda...");

    try {
      let imageUrl;
      if (mode === "edit" && baseImage) {
        imageUrl = await editImage(prompt, baseImage);
      } else {
        imageUrl = await generateImage(prompt, {
          onStatus: setStatusText,
          aspectRatio,
          style,
          negativePrompt,
        });
      }

      if (imageUrl) {
        setStatusText("🎨 Rasm chizilmoqda, biroz kuting...");
        // Preload: rasm to'liq yuklangach ko'rsatamiz. Pollinations ba'zan
        // sekin bo'ladi — 60 soniyagacha kutamiz.
        const loaded = await new Promise<boolean>((resolve) => {
          const img = new Image();
          const timeout = setTimeout(() => resolve(false), 60_000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
          img.src = imageUrl;
        });
        if (loaded) {
          setResult(imageUrl);
        } else {
          setErrorText(
            "Rasm generatori javob bermadi (server band bo'lishi mumkin). Qayta urinib ko'ring yoki promptni o'zgartiring.",
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(
        err?.message || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
        setMode("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 py-1">
          SuperAI Image Studio
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          Yangi rasm yarating yoki mavjudini sun'iy intellekt yordamida
          tahrirlang.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="glass p-1 rounded-2xl flex border border-white/5">
          <button
            onClick={() => {
              setMode("create");
              setBaseImage(null);
            }}
            className={`px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${mode === "create" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
          >
            Yangi yaratish
          </button>
          <button
            onClick={() => setMode("edit")}
            className={`px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${mode === "edit" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
          >
            Rasm tahrirlash
          </button>
        </div>
      </div>

      {mode === "create" && (
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs font-bold text-slate-400">
            Format
            <select
              value={aspectRatio}
              onChange={(e) =>
                setAspectRatio(e.target.value as typeof aspectRatio)
              }
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
            >
              <option value="square">Kvadrat 1:1</option>
              <option value="portrait">Portret 3:4</option>
              <option value="landscape">Landshaft 4:3</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-400">
            Uslub
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
            >
              <option>Photorealistic</option>
              <option>Cinematic photography</option>
              <option>Editorial portrait</option>
              <option>Product photography</option>
              <option>Digital illustration</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-400">
            Keraksiz detallar
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blur, text, watermark..."
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none placeholder-slate-600"
            />
          </label>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl">
          {/* Base Image Section (for Edit mode) */}
          {mode === "edit" && (
            <div className="flex-1 w-full max-w-sm space-y-3">
              <p className="text-xs font-bold uppercase text-slate-500 text-center">
                Asl rasm
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square rounded-3xl overflow-hidden glass border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-500 group ${baseImage ? "border-blue-500/50" : "border-slate-700"}`}
              >
                {baseImage ? (
                  <img
                    src={baseImage}
                    alt="Base"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 text-slate-600 group-hover:text-blue-500 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-slate-500 text-sm">Rasm yuklash</span>
                  </>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleBaseImageUpload}
              />
            </div>
          )}

          {/* Arrow indicator for Edit mode */}
          {mode === "edit" && baseImage && (
            <div className="hidden md:block">
              <svg
                className="w-8 h-8 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 5l7 7-7 7M5 12h15"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {/* Result Section */}
          <div className="flex-1 w-full max-w-md space-y-3">
            <p className="text-xs font-bold uppercase text-slate-500 text-center">
              {isLoading ? "Yaratilmoqda..." : "Natija"}
            </p>
            <div className="aspect-square rounded-3xl overflow-hidden glass shadow-2xl relative border border-white/10 flex items-center justify-center bg-slate-900/50">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-4 px-4 text-center">
                  <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 text-sm font-bold animate-pulse">
                    {statusText}
                  </p>
                </div>
              ) : errorText ? (
                <div className="text-center p-8 space-y-4">
                  <span className="text-5xl">😕</span>
                  <p className="text-red-300 font-bold text-xs md:text-sm max-w-xs">
                    {errorText}
                  </p>
                  <button
                    onClick={() => {
                      setErrorText(null);
                      // Formani qayta yuborish uchun sun'iy submit
                      const form = document.querySelector<HTMLFormElement>(
                        "form.relative.group",
                      );
                      form?.requestSubmit();
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white font-black text-xs rounded-2xl hover:bg-blue-500 transition active:scale-95 shadow-xl"
                  >
                    ↻ Qayta urinish
                  </button>
                </div>
              ) : result ? (
                <>
                  <img
                    src={result}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <a
                      href={result}
                      download="superai-image.png"
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 bg-white text-black font-black text-xs md:text-sm rounded-2xl hover:bg-slate-200 transition-transform active:scale-95 shadow-xl"
                    >
                      YUKLAB OLISH
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <svg
                    className="w-16 h-16 text-slate-700 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-slate-500 font-medium text-xs md:text-sm">
                    {mode === "edit"
                      ? "Tahrirlash buyrug'ini yozing"
                      : "O'zbekcha yozing — AI o'zi tarjima qiladi! Masalan: 'tog'lar orasida tong otmoqda'"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="max-w-4xl mx-auto w-full pb-6">
        <form onSubmit={handleGenerateOrEdit} className="relative group">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === "edit"
                ? "Masalan: rasmga quyoshli fon qo'sh, ranglarni yorqinroq qil..."
                : "O'zbekcha yozing: masalan, kelajakdagi Toshkent shahri, kiberpank uslubida..."
            }
            className="w-full bg-slate-800/80 backdrop-blur border border-slate-700 px-6 py-5 rounded-[2rem] text-white text-sm md:text-base outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-500 transition-all shadow-2xl pr-32"
          />
          <button
            type="submit"
            disabled={isLoading || (mode === "edit" && !baseImage)}
            className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs md:text-sm rounded-[1.5rem] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {mode === "edit" ? "TAHRIRLASH" : "YARATISH"}
          </button>
        </form>
        {mode === "edit" && !baseImage && (
          <p className="text-center mt-2 text-amber-400 text-xs font-bold">
            Iltimos, avval tahrirlash uchun rasm yuklang!
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageGenView;
