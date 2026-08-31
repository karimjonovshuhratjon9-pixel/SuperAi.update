import React, { useState } from "react";

interface AutomationItem {
  id: string;
  name: string;
  trigger: string;
  action: string;
  schedule: string;
  active: boolean;
  lastRun?: string;
}

const DEFAULT_AUTOMATIONS: AutomationItem[] = [
  {
    id: "auto_1",
    name: "🌅 Kunlik Reja & Xulosa",
    trigger: "Har kuni 08:00",
    action:
      "Bugungi rejalarni tahlil qilib, Telegram bot orqali xabar yuborish",
    schedule: "08:00 AM",
    active: true,
    lastRun: "Bugun 08:00",
  },
  {
    id: "auto_2",
    name: "📈 IT & AI Yangiliklari",
    trigger: "Har 12 soatda",
    action:
      "Web Search orqali so'nggi yangiliklarni yig'ish va tahliliy hisobot tayyorlash",
    schedule: "Every 12h",
    active: false,
    lastRun: "Kecha 20:00",
  },
  {
    id: "auto_3",
    name: "🛡 Xavfsizlik & Kod Auditi",
    trigger: "Haftalik yakshanba",
    action: "Loyiha xatoliklari va dependency yangilanishlarini tekshirish",
    schedule: "Sunday 22:00",
    active: true,
    lastRun: "Yakshanba 22:00",
  },
];

export const AutomationsView: React.FC = () => {
  const [automations, setAutomations] =
    useState<AutomationItem[]>(DEFAULT_AUTOMATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("Har kuni 09:00");
  const [action, setAction] = useState("");

  const toggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !action.trim()) return;
    const newAuto: AutomationItem = {
      id: `auto_${Date.now()}`,
      name,
      trigger,
      action,
      schedule: trigger,
      active: true,
      lastRun: "Hali ishga tushmadi",
    };
    setAutomations((prev) => [newAuto, ...prev]);
    setIsModalOpen(false);
    setName("");
    setAction("");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
            ⚙️
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI Automations & Workflows
            </h2>
            <p className="text-xs text-slate-400">
              Avtonom rejalashtirilgan vazifalar va triggerlar
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
        >
          + Yangi Avtomatlashtirish
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">{auto.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    ⏱ {auto.trigger}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{auto.action}</p>
                <span className="text-[10px] text-slate-500 block">
                  Oxirgi marta: {auto.lastRun}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStatus(auto.id)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    auto.active
                      ? "bg-emerald-500 justify-end"
                      : "bg-slate-800 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreate}
            className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-white">
              Yangi Avtomatlashtirish Yaratish
            </h3>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Nomi:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Kunlik hisobot"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Vaqt / Trigger:
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Har kuni 08:00">Har kuni 08:00 da</option>
                <option value="Har kuni 20:00">Har kuni 20:00 da</option>
                <option value="Har 6 soatda">Har 6 soatda</option>
                <option value="Haftalik">Haftada bir marta</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Bajariladigan AI Harakati:
              </label>
              <textarea
                rows={3}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="AI nima qilishi kerak..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold"
              >
                Yaratish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
