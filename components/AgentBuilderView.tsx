import React, { useState } from "react";
import { AgentDefinition } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  TextArea,
  Select,
  Badge,
  ProgressBar,
} from "./ui/SharedUI";

interface AgentBuilderViewProps {
  userId: string;
}

const STEPS = [
  { id: 1, name: "Nomi" },
  { id: 2, name: "Shaxsiyat" },
  { id: 3, name: "Ko'rsatmalar" },
  { id: 4, name: "Model" },
  { id: 5, name: "Tools" },
  { id: 6, name: "Xotira" },
  { id: 7, name: "Ruxsatlar" },
  { id: 8, name: "Test" },
  { id: 9, name: "Nashr" },
];

const TOOLS = [
  "web_search",
  "send_telegram",
  "send_email",
  "calculate",
  "get_weather",
  "execute_code",
];
const MODELS = ["gemini-flash", "gemini-pro", "claude-haiku", "claude-sonnet"];
const PERMISSIONS = ["chat", "files", "search", "code", "image", "voice"];

export const AgentBuilderView: React.FC<AgentBuilderViewProps> = ({
  userId,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🤖");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [instructions, setInstructions] = useState("");
  const [model, setModel] = useState("gemini-flash");
  const [tools, setTools] = useState<string[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [permissions, setPermissions] = useState<string[]>(["chat"]);
  const [isPublic, setIsPublic] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    setTestResult("🤖 Agent test qilinmoqda...");
    try {
      const { getGeminiResponse } = await import("../services/geminiService");
      const res = await getGeminiResponse(
        `Siz ${name || "Agent"} sifatida ishlaysiz. ${instructions}\n\nTest so'rovi: ${testInput}`,
      );
      setTestResult(res);
    } catch (err: any) {
      setTestResult(`⚠️ ${err?.message || "Xatolik"}`);
    }
  };

  const handlePublish = async () => {
    if (!name.trim()) return;
    const agent: AgentDefinition = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      name: name.trim(),
      description: description.trim() || `${name} agenti`,
      icon,
      personality,
      instructions: instructions.trim() || "Siz foydali AI yordamchisiz.",
      model,
      tools,
      memoryEnabled,
      permissions,
      isPublic,
      status: "published",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveAgent(agent);
    setSaved(true);
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Agent Builder"
          title="🛠️ Agent Yaratish"
          description="O'z AI agentingizni 9 bosqichda yarating"
        />

        <ProgressBar progress={progress} statusText={`Qadam ${step}/9`} />

        {/* Step navigation */}
        <div className="flex gap-2 flex-wrap">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                step === s.id
                  ? "bg-blue-600 text-white"
                  : s.id < step
                    ? "bg-emerald-600/20 text-emerald-300"
                    : "bg-slate-800/60 text-slate-400"
              }`}
            >
              {s.id}. {s.name}
            </button>
          ))}
        </div>

        <Card>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">📝 Agent nomi</h3>
              <Input
                value={name}
                onChange={setName}
                placeholder="Agent nomi (masalan: Marketing Pro)"
              />
              <div className="flex gap-2">
                {["🤖", "🔬", "💻", "📊", "✍️", "🎓", "📣", "🌐", "🔐"].map(
                  (ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`w-10 h-10 rounded-xl text-xl transition ${
                        icon === ic
                          ? "bg-blue-600"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      {ic}
                    </button>
                  ),
                )}
              </div>
              <TextArea
                value={description}
                onChange={setDescription}
                placeholder="Agent tavsifi"
                rows={2}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🎭 Shaxsiyat</h3>
              <TextArea
                value={personality}
                onChange={setPersonality}
                placeholder="Masalan: Do'stona, professional, sabrli va tushunarli tilda javob beradi"
                rows={4}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">📋 Ko'rsatmalar</h3>
              <TextArea
                value={instructions}
                onChange={setInstructions}
                placeholder="Agentga qanday ishlashini ko'rsating. Masalan: Siz marketing bo'yicha ekspertsiz. Har doim aniq misollar bilan javob bering."
                rows={6}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🧠 Model</h3>
              <Select
                value={model}
                onChange={setModel}
                options={MODELS.map((m) => ({ value: m, label: m }))}
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🔧 Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map((tool) => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`p-3 rounded-xl text-xs font-bold transition ${
                      tools.includes(tool)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🧠 Xotira</h3>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={memoryEnabled}
                  onChange={(e) => setMemoryEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Agent xotirasini yoqish
                </span>
              </label>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🔐 Ruxsatlar</h3>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    onClick={() => togglePermission(perm)}
                    className={`p-3 rounded-xl text-xs font-bold transition ${
                      permissions.includes(perm)
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {perm}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🧪 Test</h3>
              <div className="flex gap-2">
                <Input
                  value={testInput}
                  onChange={setTestInput}
                  placeholder="Agentni sinab ko'ring..."
                />
                <Button onClick={handleTest}>Test</Button>
              </div>
              {testResult && (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {testResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white">🚀 Nashr qilish</h3>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Ommaviy (Marketplace'da ko'rinadi)
                </span>
              </label>
              {saved ? (
                <div className="p-4 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
                  <p className="text-sm text-emerald-300 font-bold">
                    ✅ Agent muvaffaqiyatli nashr qilindi!
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={!name.trim()}
                  className="w-full"
                >
                  📤 Agentni nashr qilish
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <Button
              variant="secondary"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              ← Orqaga
            </Button>
            <Button
              onClick={() => setStep((s) => Math.min(9, s + 1))}
              disabled={step === 9}
            >
              Keyingi →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
