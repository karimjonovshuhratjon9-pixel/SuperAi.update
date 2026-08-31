import {
  SubscriptionPlan,
  Subscription,
  CreditBalance,
  CreditTransaction,
} from "../types";
import { dbService } from "./dbService";

// ================= PLANS =================
export const PLANS: SubscriptionPlan[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    currency: "USD",
    limits: {
      messages: 50,
      models: ["gemini-flash"],
      files: 10,
      storage: 100 * 1024 * 1024,
      imageGen: 10,
      video: 0,
      research: 5,
      agents: 2,
      api: 0,
      automations: 1,
    },
    features: [
      "50 ta AI chat xabari",
      "10 ta fayl yuklash",
      "10 ta rasm generatsiyasi",
      "5 ta Deep Research",
      "2 ta AI Agent",
      "1 ta Automation",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 9.99,
    currency: "USD",
    limits: {
      messages: 1000,
      models: ["gemini-flash", "gemini-pro", "claude-haiku"],
      files: 100,
      storage: 1 * 1024 * 1024 * 1024,
      imageGen: 100,
      video: 10,
      research: 50,
      agents: 10,
      api: 1000,
      automations: 10,
    },
    features: [
      "1000 ta AI chat xabari",
      "100 ta fayl yuklash",
      "100 ta rasm generatsiyasi",
      "10 ta video generatsiya",
      "50 ta Deep Research",
      "10 ta AI Agent",
      "1000 ta API so'rov",
      "10 ta Automation",
    ],
  },
  {
    id: "VIP",
    name: "VIP",
    price: 29.99,
    currency: "USD",
    limits: {
      messages: 10000,
      models: ["gemini-flash", "gemini-pro", "claude-haiku", "claude-sonnet"],
      files: 1000,
      storage: 10 * 1024 * 1024 * 1024,
      imageGen: 1000,
      video: 100,
      research: 500,
      agents: 50,
      api: 10000,
      automations: 100,
    },
    features: [
      "10000 ta AI chat xabari",
      "1000 ta fayl yuklash",
      "1000 ta rasm generatsiyasi",
      "100 ta video generatsiya",
      "500 ta Deep Research",
      "50 ta AI Agent",
      "10000 ta API so'rov",
      "100 ta Automation",
      "Barcha premium modellar",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 99.99,
    currency: "USD",
    limits: {
      messages: 100000,
      models: [
        "gemini-flash",
        "gemini-pro",
        "claude-haiku",
        "claude-sonnet",
        "claude-opus",
      ],
      files: 10000,
      storage: 100 * 1024 * 1024 * 1024,
      imageGen: 10000,
      video: 1000,
      research: 5000,
      agents: 500,
      api: 100000,
      automations: 1000,
    },
    features: [
      "100000 ta AI chat xabari",
      "10000 ta fayl yuklash",
      "10000 ta rasm generatsiyasi",
      "1000 ta video generatsiya",
      "5000 ta Deep Research",
      "500 ta AI Agent",
      "100000 ta API so'rov",
      "1000 ta Automation",
      "Barcha premium modellar",
      "Priority support",
    ],
  },
];

export const getPlan = (planId: string): SubscriptionPlan => {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
};

// ================= CREDITS =================
const CREDITS_KEY = "superai_credits_v2";

export const getCreditBalance = (userId: string): CreditBalance => {
  try {
    const raw = localStorage.getItem(`${CREDITS_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    userId,
    text: 100,
    image: 10,
    video: 0,
    voice: 10,
    research: 5,
    total: 125,
  };
};

export const saveCreditBalance = (balance: CreditBalance): void => {
  localStorage.setItem(
    `${CREDITS_KEY}_${balance.userId}`,
    JSON.stringify(balance),
  );
};

export const deductCreditsByCategory = (
  userId: string,
  category: "text" | "image" | "video" | "voice" | "research",
  amount: number,
): { success: boolean; balance: CreditBalance } => {
  const balance = getCreditBalance(userId);
  if (balance[category] < amount) {
    return { success: false, balance };
  }
  balance[category] -= amount;
  balance.total -= amount;
  saveCreditBalance(balance);

  // Record transaction
  const tx: CreditTransaction = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    type: "usage",
    amount: -amount,
    category,
    description: `${category} usage`,
    timestamp: Date.now(),
  };
  dbService.saveCreditTransaction(tx).catch(() => {});

  return { success: true, balance };
};

export const addCreditsByCategory = (
  userId: string,
  category: "text" | "image" | "video" | "voice" | "research",
  amount: number,
  description = "Credit added",
): CreditBalance => {
  const balance = getCreditBalance(userId);
  balance[category] += amount;
  balance.total += amount;
  saveCreditBalance(balance);

  const tx: CreditTransaction = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    type: "purchase",
    amount,
    category,
    description,
    timestamp: Date.now(),
  };
  dbService.saveCreditTransaction(tx).catch(() => {});

  return balance;
};

// ================= SUBSCRIPTION =================
export const activatePlan = async (
  userId: string,
  planId: "FREE" | "PRO" | "VIP" | "ENTERPRISE",
  promoCodeApplied?: string,
): Promise<Subscription> => {
  const sub: Subscription = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    plan: planId,
    status: "active",
    startedAt: Date.now(),
    expiresAt:
      planId === "FREE" ? undefined : Date.now() + 30 * 24 * 60 * 60 * 1000,
    autoRenew: planId !== "FREE",
    promoCodeApplied,
  };
  await dbService.saveSubscription(sub);

  // Grant credits based on plan
  const plan = getPlan(planId);
  addCreditsByCategory(
    userId,
    "text",
    plan.limits.messages,
    `Plan activation: ${planId}`,
  );
  addCreditsByCategory(
    userId,
    "image",
    plan.limits.imageGen,
    `Plan activation: ${planId}`,
  );
  addCreditsByCategory(
    userId,
    "video",
    plan.limits.video,
    `Plan activation: ${planId}`,
  );
  addCreditsByCategory(
    userId,
    "research",
    plan.limits.research,
    `Plan activation: ${planId}`,
  );

  return sub;
};

export const getActiveSubscription = async (
  userId: string,
): Promise<Subscription | null> => {
  const subs = await dbService.getSubscriptionsByUserId(userId);
  const active = subs.find((s) => s.status === "active");
  if (!active) return null;
  if (active.expiresAt && active.expiresAt < Date.now()) {
    active.status = "expired";
    await dbService.saveSubscription(active);
    return null;
  }
  return active;
};

export const cancelSubscription = async (userId: string): Promise<void> => {
  const subs = await dbService.getSubscriptionsByUserId(userId);
  for (const sub of subs) {
    if (sub.status === "active") {
      sub.status = "cancelled";
      sub.autoRenew = false;
      await dbService.saveSubscription(sub);
    }
  }
};

// ================= USAGE TRACKING =================
export const trackUsage = async (
  userId: string,
  feature: string,
  model?: string,
  tokensIn?: number,
  tokensOut?: number,
): Promise<void> => {
  try {
    await dbService.saveUsageRecord({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      feature,
      model,
      tokensIn,
      tokensOut,
      timestamp: Date.now(),
    });
  } catch {
    /* ignore */
  }
};

// ================= GAMIFICATION =================
export const addXP = async (
  userId: string,
  amount: number,
): Promise<{ xp: number; level: number }> => {
  const user = await dbService.getUser(userId);
  if (!user) return { xp: 0, level: 1 };

  user.xp = (user.xp || 0) + amount;
  user.level = Math.floor((user.xp || 0) / 100) + 1;
  await dbService.saveUser(user);
  return { xp: user.xp, level: user.level };
};

export const updateStreak = async (userId: string): Promise<number> => {
  const user = await dbService.getUser(userId);
  if (!user) return 0;

  const today = new Date().toDateString();
  const lastActive = user.lastLoginAt
    ? new Date(user.lastLoginAt).toDateString()
    : "";

  if (lastActive === today) {
    return user.streak || 0;
  }

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  user.streak = lastActive === yesterday ? (user.streak || 0) + 1 : 1;
  await dbService.saveUser(user);
  return user.streak;
};
