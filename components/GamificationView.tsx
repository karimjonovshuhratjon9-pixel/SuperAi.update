import React, { useState, useEffect } from "react";
import { User } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
  ProgressBar,
} from "./ui/SharedUI";

interface GamificationViewProps {
  userId: string;
}

const ACHIEVEMENTS = [
  {
    id: "first_chat",
    name: "Birinchi Chat",
    description: "Birinchi AI chatni boshlang",
    icon: "💬",
    xpReward: 10,
  },
  {
    id: "first_image",
    name: "Rasm Ustasi",
    description: "Birinchi rasm yarating",
    icon: "🎨",
    xpReward: 20,
  },
  {
    id: "first_video",
    name: "Video Rejissyor",
    description: "Birinchi video yarating",
    icon: "🎬",
    xpReward: 30,
  },
  {
    id: "first_research",
    name: "Tadqiqotchi",
    description: "Birinchi Deep Research o'tkazing",
    icon: "🔬",
    xpReward: 25,
  },
  {
    id: "first_agent",
    name: "Agent Yaratuvchi",
    description: "Birinchi AI agent yarating",
    icon: "🤖",
    xpReward: 20,
  },
  {
    id: "first_file",
    name: "Fayl Tahlilchisi",
    description: "Birinchi faylni tahlil qiling",
    icon: "📁",
    xpReward: 15,
  },
  {
    id: "streak_3",
    name: "3 Kun Streak",
    description: "3 kun ketma-ket tashrif",
    icon: "🔥",
    xpReward: 30,
  },
  {
    id: "streak_7",
    name: "7 Kun Streak",
    description: "7 kun ketma-ket tashrif",
    icon: "⚡",
    xpReward: 50,
  },
  {
    id: "level_5",
    name: "5-Daraja",
    description: "5-darajaga erishing",
    icon: "🏆",
    xpReward: 40,
  },
  {
    id: "level_10",
    name: "10-Daraja",
    description: "10-darajaga erishing",
    icon: "👑",
    xpReward: 100,
  },
];

export const GamificationView: React.FC<GamificationViewProps> = ({
  userId,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await dbService.getUser(userId);
      setUser(u);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <LoadingSkeleton count={3} />;

  if (!user)
    return (
      <EmptyState
        icon="🎮"
        title="Foydalanuvchi topilmadi"
        description="Profil ma'lumotlari mavjud emas."
      />
    );

  const xp = user.xp || 0;
  const level = user.level || 1;
  const streak = user.streak || 0;
  const xpToNext = level * 100;
  const xpInLevel = xp - (level - 1) * 100;
  const progress = Math.min(100, (xpInLevel / 100) * 100);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Gamification"
          title="🎮 O'yinlashtirish"
          description="XP to'plang, darajalarga erishing va yutuqlarni qo'lga kiriting"
        />

        {/* Level card */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-xl">
              {level}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white">Daraja {level}</h3>
              <p className="text-sm text-slate-400 mt-1">Jami XP: {xp}</p>
              <div className="mt-3">
                <ProgressBar
                  progress={progress}
                  statusText={`${xpInLevel}/${xpToNext} XP`}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl">🔥</div>
              <p className="text-sm font-black text-white mt-1">{streak}</p>
              <p className="text-[10px] text-slate-500">kun streak</p>
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-black text-white mb-3">🏅 Yutuqlar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = xp >= achievement.xpReward;
              return (
                <Card
                  key={achievement.id}
                  className={`hover:border-blue-500/30 transition ${unlocked ? "border-emerald-500/30" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl ${unlocked ? "" : "grayscale"}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">
                          {achievement.name}
                        </h4>
                        {unlocked && <Badge color="green">✓</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {achievement.description}
                      </p>
                      <p className="text-[10px] text-amber-300 mt-1">
                        +{achievement.xpReward} XP
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
