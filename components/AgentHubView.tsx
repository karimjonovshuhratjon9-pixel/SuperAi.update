import React, { useState, useEffect } from "react";
import { AgentDefinition } from "../types";
import { dbService } from "../services/dbService";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
  Modal,
} from "./ui/SharedUI";

interface AgentHubViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

const BUILTIN_AGENTS = [
  {
    id: "research",
    name: "Research Agent",
    icon: "🔬",
    description: "Internetdan chuqur tadqiqot olib boradi",
    tools: ["web_search"],
    model: "gemini",
  },
  {
    id: "coding",
    name: "Coding Agent",
    icon: "💻",
    description: "Kod yozadi, debug qiladi va tahlil qiladi",
    tools: ["execute_code", "web_search"],
    model: "gemini",
  },
  {
    id: "data",
    name: "Data Analyst",
    icon: "📊",
    description: "Ma'lumotlarni tahlil qiladi va chartlar yaratadi",
    tools: ["calculate", "execute_code"],
    model: "gemini",
  },
  {
    id: "writing",
    name: "Writing Agent",
    icon: "✍️",
    description: "Matn, post va kontent yozadi",
    tools: [],
    model: "gemini",
  },
  {
    id: "study",
    name: "Study Agent",
    icon: "🎓",
    description: "O'quv materiallarini tushuntiradi",
    tools: ["web_search"],
    model: "gemini",
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    icon: "📣",
    description: "Marketing strategiyalari yaratadi",
    tools: ["web_search"],
    model: "gemini",
  },
  {
    id: "translator",
    name: "Translator Agent",
    icon: "🌐",
    description: "Matnlarni tarjima qiladi",
    tools: [],
    model: "gemini",
  },
  {
    id: "document",
    name: "Document Agent",
    icon: "📄",
    description: "Hujjatlarni tahlil qiladi",
    tools: ["web_search"],
    model: "gemini",
  },
  {
    id: "security",
    name: "Security Agent",
    icon: "🔐",
    description: "Kod xavfsizligini tekshiradi",
    tools: ["execute_code"],
    model: "gemini",
  },
];

export const AgentHubView: React.FC<AgentHubViewProps> = ({
  userId,
  onOpenApiKeyModal,
}) => {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(
    null,
  );
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatting, setChatting] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    const items = await dbService.getAgentsByUserId(userId);
    setAgents(items);
    setLoading(false);
  };

  useEffect(() => {
    loadAgents();
  }, [userId]);

  const handleChat = async () => {
    if (!selectedAgent || !chatInput.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setChatting(true);
    setChatResponse("");
    try {
      const res = await getGeminiResponse(
        `Siz ${selectedAgent.name} agentsiz. ${selectedAgent.instructions}\n\nFoydalanuvchi so'rovi: ${chatInput}`,
      );
      setChatResponse(res);
    } catch (err: any) {
      setChatResponse(`⚠️ ${err?.message || "Xatolik"}`);
    } finally {
      setChatting(false);
    }
  };

  const handleInstall = async (agent: AgentDefinition) => {
    const newAgent: AgentDefinition = {
      ...agent,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      isPublic: false,
      status: "published",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveAgent(newAgent);
    loadAgents();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu agentni o'chirishni tasdiqlaysizmi?")) {
      await dbService.deleteAgent(id);
      loadAgents();
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Agent Hub"
          title="🤖 AI Agentlar"
          description="Professional AI agentlar — har biri o'z vazifasiga ixtisoslashgan"
        />

        {/* Built-in agents */}
        <div>
          <h3 className="text-sm font-black text-white mb-3">
            Tayyor agentlar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUILTIN_AGENTS.map((agent) => (
              <Card
                key={agent.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{agent.icon}</div>
                  <Badge color="purple">{agent.model}</Badge>
                </div>
                <h4 className="mt-3 text-sm font-black text-white">
                  {agent.name}
                </h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {agent.description}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} color="slate">
                      {tool}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full mt-4"
                  onClick={() =>
                    handleInstall({
                      ...agent,
                      id: "",
                      userId,
                      instructions: `Siz ${agent.name} sifatida ishlaysiz. ${agent.description}`,
                      tools: agent.tools,
                      memoryEnabled: true,
                      permissions: ["chat"],
                      isPublic: false,
                      status: "published",
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    })
                  }
                >
                  📥 O'rnatish
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* User agents */}
        <div>
          <h3 className="text-sm font-black text-white mb-3">
            Mening agentlarim ({agents.length})
          </h3>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : agents.length === 0 ? (
            <EmptyState
              icon="🤖"
              title="Agentlar yo'q"
              description="Yuqoridagi tayyor agentlardan birini o'rnating yoki Agent Builder orqali o'z agentingizni yarating."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="hover:border-blue-500/30 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{agent.icon}</div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedAgent(agent)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition"
                        title="Chat"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition"
                        title="O'chirish"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <h4 className="mt-3 text-sm font-black text-white">
                    {agent.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {agent.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} color="slate">
                        {tool}
                      </Badge>
                    ))}
                    {agent.tools.length > 3 && (
                      <Badge color="slate">+{agent.tools.length - 3}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent chat modal */}
      <Modal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title={`${selectedAgent?.icon || "🤖"} ${selectedAgent?.name || "Agent"} bilan suhbat`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
            {chatting ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="animate-pulse">🤖 Fikrlamoqda...</span>
              </div>
            ) : chatResponse ? (
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {chatResponse}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Agentga savol bering...
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder="Savolingizni yozing..."
              className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
            />
            <Button
              onClick={handleChat}
              disabled={chatting || !chatInput.trim()}
            >
              {chatting ? "..." : "Yuborish"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
