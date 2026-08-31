import React, { useState } from "react";
import { setUserMemory } from "../services/memoryService";

interface OnboardingProps {
  userName: string;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("work");
  const [language, setLanguage] = useState("uz");

  const goals = [
    {
      id: "work",
      icon: "⚙️",
      title: "Ish va biznes",
      text: "Reja, email, tahlil va qarorlar",
    },
    {
      id: "coding",
      icon: "</>",
      title: "Dasturlash",
      text: "Kod, debug va texnik arxitektura",
    },
    {
      id: "study",
      icon: "📚",
      title: "O'qish",
      text: "Tushuntirish, mashq va tarjima",
    },
    {
      id: "creative",
      icon: "✦",
      title: "Kreativ ishlar",
      text: "Kontent, g'oya va dizayn",
    },
  ];

  const finish = () => {
    const goalText =
      goals.find((item) => item.id === goal)?.title || "Ish va biznes";
    const languageText =
      language === "uz" ? "o'zbek" : language === "ru" ? "rus" : "ingliz";
    setUserMemory(
      `${userName} uchun asosiy yo'nalish: ${goalText}. Javoblarni asosan ${languageText} tilida bering. Javoblar amaliy, aniq va keraksiz cho'zilmagan bo'lsin.`,
    );
    localStorage.setItem("superai_onboarding_v1", "done");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-xl glass rounded-3xl border border-white/15 shadow-2xl p-6 md:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300 font-black">
              SuperAI setup
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {step === 0
                ? `Xush kelibsiz, ${userName}`
                : "SuperAI sizga moslashsin"}
            </h2>
          </div>
          <span className="text-xs font-black text-slate-500">
            {step + 1} / 2
          </span>
        </div>

        {step === 0 ? (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-400">
              Bir necha tanlov orqali SuperAI javoblarini ish uslubingizga
              moslaymiz. Buni keyin xotira bo'limidan o'zgartirishingiz mumkin.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`text-left p-4 rounded-2xl border transition ${goal === item.id ? "bg-blue-600/20 border-blue-400/60" : "bg-slate-800/50 border-white/10 hover:border-white/25"}`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="block mt-2 text-sm font-black text-white">
                    {item.title}
                  </span>
                  <span className="block mt-1 text-xs text-slate-500">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition"
            >
              Davom etish
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-black mb-2">
                Asosiy javob tili
              </label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-sm text-white outline-none"
              >
                <option value="uz">O'zbek tili</option>
                <option value="ru">Rus tili</option>
                <option value="en">Ingliz tili</option>
              </select>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4">
              <p className="text-sm font-black text-emerald-200">
                Tayyor workspace
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">
                Siz uchun asosiy agent, xotira va tezkor ishlar dashboard’da
                tayyor bo‘ladi.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition"
              >
                Orqaga
              </button>
              <button
                type="button"
                onClick={finish}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition"
              >
                Boshlash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
