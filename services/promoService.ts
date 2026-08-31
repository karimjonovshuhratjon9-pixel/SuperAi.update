export interface SubscriptionInfo {
  isPremium: boolean;
  planName: string;
  balance: number;
  promoCodeApplied?: string;
  activatedAt?: number;
  unlimitedGenerations: boolean;
  features: string[];
}

const SUBSCRIPTION_STORAGE = "superai_subscription_info";
const SUBSCRIPTION_EVENT = "superai_subscription_changed";

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  isPremium: false,
  planName: "Free Starter",
  balance: 0,
  unlimitedGenerations: false,
  features: ["Gemini 2.0 Flash", "Web Speech Voice", "Cheklangan Avatarlar"],
};

export const getSubscriptionInfo = (): SubscriptionInfo => {
  try {
    const saved = localStorage.getItem(SUBSCRIPTION_STORAGE);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_SUBSCRIPTION;
};

export const saveSubscriptionInfo = (info: SubscriptionInfo): void => {
  localStorage.setItem(SUBSCRIPTION_STORAGE, JSON.stringify(info));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SUBSCRIPTION_EVENT, { detail: info }));
  }
};

export const applyPromoCode = (
  code: string
): { success: boolean; message: string; info: SubscriptionInfo } => {
  const cleanCode = code.trim();
  const normalized = cleanCode.toLowerCase();

  if (!cleanCode) {
    return {
      success: false,
      message: "Iltimos, promokod matnini kiriting!",
      info: getSubscriptionInfo(),
    };
  }

  // Maxsus kod: Shuhratjon
  if (normalized === "shuhratjon" || normalized === "shuxratjon") {
    const vipInfo: SubscriptionInfo = {
      isPremium: true,
      planName: "VIP PRO UNLIMITED (Shuhratjon)",
      balance: 10000.0,
      promoCodeApplied: cleanCode,
      activatedAt: Date.now(),
      unlimitedGenerations: true,
      features: [
        "🌟 VIP Premium Obuna (Cheksiz muddat)",
        "💰 $10,000.00 USD Virtual Balans",
        "🎬 HeyGen AI Video Studio Cheksiz Render",
        "🎙 ElevenLabs HD Ovoz Sintezi (Barcha Ovozlar)",
        "⚡ Ultra-Tezkor Render & Maxsus GPU Serverlar",
        "💎 1080p & 4K Full HD Video Eksport",
        "👤 Barcha 1200+ AI Avatarlardan Foydalanish",
      ],
    };

    saveSubscriptionInfo(vipInfo);

    return {
      success: true,
      message:
        "Tabriklaymiz! 'Shuhratjon' maxsus promokodi faollashtirildi! Sizga VIP PRO Premium obunasi va $10,000.00 balans berildi!",
      info: vipInfo,
    };
  }

  if (normalized === "superai" || normalized === "vip2025") {
    const promoInfo: SubscriptionInfo = {
      isPremium: true,
      planName: "SuperAI Pro Pass",
      balance: 2500.0,
      promoCodeApplied: cleanCode,
      activatedAt: Date.now(),
      unlimitedGenerations: true,
      features: [
        "🌟 Pro Obuna",
        "💰 $2,500.00 Balans",
        "🎬 HeyGen AI Video Studio",
        "🎙 ElevenLabs HD Ovoz",
      ],
    };

    saveSubscriptionInfo(promoInfo);

    return {
      success: true,
      message: `Promokod qabul qilindi! Balans $2,500.00 ga to'ldirildi va Pro rejim yoqildi.`,
      info: promoInfo,
    };
  }

  return {
    success: false,
    message: "Noto'g'ri yoki muddati o'tgan promokod. 'Shuhratjon' promokodidan foydalaning!",
    info: getSubscriptionInfo(),
  };
};

export const deductCredits = (amount = 1.0): boolean => {
  const info = getSubscriptionInfo();
  if (info.isPremium && info.unlimitedGenerations) {
    if (info.balance > 0) {
      info.balance = Math.max(0, Number((info.balance - amount).toFixed(2)));
      saveSubscriptionInfo(info);
    }
    return true;
  }

  if (info.balance >= amount) {
    info.balance = Number((info.balance - amount).toFixed(2));
    saveSubscriptionInfo(info);
    return true;
  }

  return false;
};

export const addCredits = (amount: number): SubscriptionInfo => {
  const info = getSubscriptionInfo();
  info.balance = Number((info.balance + amount).toFixed(2));
  saveSubscriptionInfo(info);
  return info;
};

export const isUserPremium = (): boolean => {
  return getSubscriptionInfo().isPremium;
};

export const onSubscriptionChange = (
  callback: (info: SubscriptionInfo) => void
): (() => void) => {
  const handler = (e: any) => {
    callback(e.detail || getSubscriptionInfo());
  };
  if (typeof window !== "undefined") {
    window.addEventListener(SUBSCRIPTION_EVENT, handler);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(SUBSCRIPTION_EVENT, handler);
    }
  };
};
