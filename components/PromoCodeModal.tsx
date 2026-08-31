import React, { useState, useEffect } from "react";
import {
  applyPromoCode,
  getSubscriptionInfo,
  SubscriptionInfo,
  onSubscriptionChange,
} from "../services/promoService";

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (info: SubscriptionInfo) => void;
}

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState("");
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(getSubscriptionInfo());
  const [feedback, setFeedback] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSubInfo(getSubscriptionInfo());
      setFeedback(null);
      setCode("");
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = onSubscriptionChange(setSubInfo);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(code);
    setFeedback({
      success: res.success,
      message: res.message,
    });
    setSubInfo(res.info);

    if (res.success) {
      if (onSuccess) onSuccess(res.info);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative text-white max-h-[92vh] flex flex-col overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-500/30">
            🎁
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black">Promokod & VIP Obuna</h3>
              {subInfo.isPremium && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  VIP AKTIV
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              SuperAI barcha imkoniyatlari va maxsus balansni faollashtiring
            </p>
          </div>
        </div>

        {/* Current Balance & Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/20 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Joriy Balansingiz
            </span>
            <span className="text-xs font-black text-purple-300">
              {subInfo.planName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300">
              ${subInfo.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-semibold">USD</span>
          </div>
        </div>

        {/* Promo Input Form */}
        <form onSubmit={handleApply} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Promokodni kiriting
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masalan: Shuhratjon"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500 font-bold uppercase tracking-wider text-sm placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-900/30 active:scale-95 shrink-0"
              >
                Faollashtirish
              </button>
            </div>
          </div>

          {/* Special Quick Code Suggestion */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <span>Maxsus promokod: <strong className="text-amber-300 font-mono">Shuhratjon</strong></span>
            <button
              type="button"
              onClick={() => {
                setCode("Shuhratjon");
                const res = applyPromoCode("Shuhratjon");
                setFeedback({
                  success: res.success,
                  message: res.message,
                });
                setSubInfo(res.info);
                if (onSuccess) onSuccess(res.info);
              }}
              className="text-[11px] font-bold text-cyan-300 hover:underline"
            >
              Bir bosishda kiritish ⚡
            </button>
          </div>
        </form>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold mb-5 animate-fade-in ${
              feedback.success
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/20 border border-rose-500/40 text-rose-300"
            }`}
          >
            {feedback.success ? "🎉 " : "⚠️ "}
            {feedback.message}
          </div>
        )}

        {/* VIP Features List */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            🌟 VIP Obunaning Imkoniyatlari:
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center gap-2.5">
              <span className="text-base">💰</span>
              <span className="text-slate-200">
                <strong>$10,000.00 USD</strong> virtual balans (Cheksiz foydalanish)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center gap-2.5">
              <span className="text-base">🎬</span>
              <span className="text-slate-200">
                <strong>HeyGen AI Video Studio</strong>: Cheksiz video avatarlar va promptdan video generatsiyasi
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center gap-2.5">
              <span className="text-base">🎙</span>
              <span className="text-slate-200">
                <strong>ElevenLabs HD</strong>: Barcha professional tabiiy ovoz modellari
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-center gap-2.5">
              <span className="text-base">⚡</span>
              <span className="text-slate-200">
                <strong>Ultra-tezkor GPU render</strong>: Kechiktirishlarsiz bir lahzada video yaratish
              </span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;
