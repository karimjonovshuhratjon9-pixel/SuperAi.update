import React, { useState } from "react";
import { PageHeader, Card, Badge, EmptyState } from "./ui/SharedUI";

export const HelpCenterView: React.FC = () => {
  const [search, setSearch] = useState("");

  const faqs = [
    {
      q: "SuperAI nima?",
      a: "SuperAI — bu professional AI workspace platformasi. Chat, rasm, video, ovoz, kod, tadqiqot va boshqa ko'plab AI vositalarini birlashtiradi.",
    },
    {
      q: "API kalitini qanday olish mumkin?",
      a: "Google AI Studio (aistudio.google.com) orqali bepul Gemini API kalitini oling. Kalit AIzaSy... bilan boshlanadi.",
    },
    {
      q: "Ma'lumotlarim xavfsizmi?",
      a: "Ha. Barcha ma'lumotlar brauzeringizda (IndexedDB) saqlanadi. Hech qanday ma'lumot tashqi serverga yuborilmaydi.",
    },
    {
      q: "Qanday qilib PRO rejimga o'tish mumkin?",
      a: "Subscription bo'limida PRO, VIP yoki ENTERPRISE rejalarini tanlang. Promokod orqali ham faollashtirish mumkin.",
    },
    {
      q: "AI Memory qanday ishlaydi?",
      a: "AI Memory sizning afzalliklaringiz va muhim faktlaringizni eslab qoladi. Siz uni ko'rishingiz, tahrirlashingiz va o'chirishingiz mumkin.",
    },
    {
      q: "Rasm yaratish uchun nima kerak?",
      a: "Image Studio bo'limida prompt yozing. AI avtomatik ravishda professional image promptga aylantiradi va rasm yaratadi.",
    },
    {
      q: "Video yaratish qanday ishlaydi?",
      a: "Video Studio'da ssenariy yozing yoki prompt bering. AI ssenariy, storyboard va video yaratadi.",
    },
    {
      q: "Coding Agent nima qila oladi?",
      a: "Coding Agent loyihalar yaratadi, kod yozadi, debug qiladi, test yozadi va kodni tahlil qiladi.",
    },
  ];

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Help Center"
          title="❓ Yordam Markazi"
          description="Ko'p so'raladigan savollar va qo'llanmalar"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Savol qidirish..."
          className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
        />

        <div className="space-y-3">
          {filtered.map((faq, idx) => (
            <Card key={idx} className="hover:border-blue-500/30 transition">
              <h4 className="text-sm font-black text-white">{faq.q}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {faq.a}
              </p>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon="❓"
            title="Savol topilmadi"
            description="Boshqa so'zlar bilan qidirib ko'ring."
          />
        )}
      </div>
    </div>
  );
};
