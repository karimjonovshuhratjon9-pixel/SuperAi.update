import React, { useState } from "react";
import { hasApiKey } from "../services/geminiService";

interface AIModelMeta {
  id: string;
  name: string;
  provider: "Google" | "Anthropic" | "ElevenLabs" | "HeyGen";
  status: "active" | "standby" | "config_needed";
  latencyMs: number;
  capabilities: string[];
  contextWindow: string;
}

const MODELS_DATA: AIModelMeta[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    status: "active",
    latencyMs: 380,
    capabilities: ["Chat", "Vision", "Reasoning", "Tools"],
    contextWindow: "1M tokens",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    status: "active",
    latencyMs: 720,
    capabilities: ["Deep Research", "Long Context", "Coding"],
    contextWindow: "2M tokens",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    status: "standby",
    latencyMs: 420,
    capabilities: ["Fast Coding", "Reasoning", "Writing"],
    contextWindow: "200k tokens",
  },
  {
    id: "elevenlabs-v3",
    name: "ElevenLabs Multilingual v2",
    provider: "ElevenLabs",
    status: "active",
    latencyMs: 510,
    capabilities: ["HD Audio", "Speech Synthesis", "Emotion"],
    contextWindow: "Unlimited",
  },
  {
    id: "heygen-v3-avatars",
    name: "HeyGen Interactive Avatar v3",
    provider: "HeyGen",
    status: "active",
    latencyMs: 1200,
    capabilities: ["Photorealistic Video", "Lip-Sync", "3D Scene"],
    contextWindow: "60s per job",
  },
];

export const ModelHubView: React.FC<{ onOpenApiKeyModal: () => void }> = ({
  onOpenApiKeyModal,
}) => {
  const [models] = useState<AIModelMeta[]>(MODELS_DATA);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
            🔌
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">
              SuperAI Model Hub & Providers
            </h2>
            <p className="text-xs text-slate-400">
              Ulangan barcha AI modellari va ularning holati
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiKeyModal}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
        >
          🔑 API Kalitlarini Sozlash
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {m.provider}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {m.latencyMs}ms
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-1">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Kontekst: {m.contextWindow}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {m.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Holat:</span>
                  <span className="text-emerald-400 font-bold">🟢 Tayyor</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
