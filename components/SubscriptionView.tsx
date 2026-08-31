import React, { useState, useEffect } from "react";
import {
  PLANS,
  activatePlan,
  getActiveSubscription,
  getCreditBalance,
} from "../services/subscriptionService";
import { Subscription, CreditBalance } from "../types";
import { PageHeader, Button, Card, Badge, EmptyState } from "./ui/SharedUI";

interface SubscriptionViewProps {
  userId: string;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  userId,
}) => {
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);

  const loadData = async () => {
    const sub = await getActiveSubscription(userId);
    setCurrentSub(sub);
    setCredits(getCreditBalance(userId));
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleActivate = async (
    planId: "FREE" | "PRO" | "VIP" | "ENTERPRISE",
  ) => {
    if (window.confirm(`${planId} planini faollashtirasizmi?`)) {
      await activatePlan(userId, planId);
      loadData();
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Subscription"
          title="💳 Obuna Rejalari"
          description="SuperAI'ning barcha imkoniyatlaridan foydalaning"
        />

        {currentSub && (
          <Card className="border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">
                  Joriy reja: {currentSub.plan}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {currentSub.expiresAt
                    ? `Amal qilish muddati: ${new Date(currentSub.expiresAt).toLocaleDateString()}`
                    : "Cheksiz muddat"}
                </p>
              </div>
              <Badge color="green">Faol</Badge>
            </div>
          </Card>
        )}

        {credits && (
          <Card>
            <h3 className="text-sm font-black text-white mb-3">💰 Kreditlar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-[10px] text-slate-500">Text</p>
                <p className="text-lg font-black text-white">{credits.text}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-[10px] text-slate-500">Image</p>
                <p className="text-lg font-black text-white">{credits.image}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-[10px] text-slate-500">Video</p>
                <p className="text-lg font-black text-white">{credits.video}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-[10px] text-slate-500">Voice</p>
                <p className="text-lg font-black text-white">{credits.voice}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-[10px] text-slate-500">Research</p>
                <p className="text-lg font-black text-white">
                  {credits.research}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`hover:border-blue-500/30 transition ${currentSub?.plan === plan.id ? "border-blue-500/50" : ""}`}
            >
              <div className="text-center">
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                <p className="mt-2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  ${plan.price}
                </p>
                <p className="text-xs text-slate-500">/ oy</p>
              </div>
              <div className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="text-xs text-slate-300 flex items-center gap-2"
                  >
                    <span className="text-emerald-400">✓</span> {feature}
                  </p>
                ))}
              </div>
              <Button
                className="w-full mt-4"
                variant={currentSub?.plan === plan.id ? "secondary" : "primary"}
                onClick={() => handleActivate(plan.id)}
                disabled={currentSub?.plan === plan.id}
              >
                {currentSub?.plan === plan.id
                  ? "Joriy reja"
                  : plan.id === "FREE"
                    ? "Bepul boshlash"
                    : "Faollashtirish"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
