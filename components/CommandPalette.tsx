import React, { useState, useEffect } from "react";
import { AppView } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onNewChat: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  shortcut?: string;
  icon: string;
  action: () => void;
  category: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewChat,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Toggle palette
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    {
      id: "new_chat",
      title: "Yangi Chat Ochish",
      shortcut: "Ctrl+N",
      icon: "➕",
      category: "Chat & AI",
      action: () => {
        onNewChat();
        onNavigate(AppView.CHAT);
        onClose();
      },
    },
    {
      id: "video_studio",
      title: "AI Video Studio",
      icon: "🎬",
      category: "Media & Create",
      action: () => {
        onNavigate(AppView.HEYGEN_AVATAR);
        onClose();
      },
    },
    {
      id: "playground",
      title: "Playground Studio (HTML/CSS/JS)",
      icon: "💻",
      category: "Develop",
      action: () => {
        onNavigate(AppView.PLAYGROUND);
        onClose();
      },
    },
    {
      id: "translator",
      title: "Ko'p Tilli Tarjimon",
      icon: "🌐",
      category: "Language",
      action: () => {
        onNavigate(AppView.TRANSLATOR);
        onClose();
      },
    },
    {
      id: "virtual_friend",
      title: "Virtual Do'st (Real Companion)",
      icon: "👤",
      category: "Core",
      action: () => {
        onNavigate(AppView.VIRTUAL_FRIEND);
        onClose();
      },
    },
    {
      id: "voice",
      title: "Ovozli Muloqot (ElevenLabs)",
      icon: "🎙",
      category: "Core",
      action: () => {
        onNavigate(AppView.VOICE);
        onClose();
      },
    },
    {
      id: "image_studio",
      title: "Image Studio (AI Rasm)",
      icon: "🎨",
      category: "Media & Create",
      action: () => {
        onNavigate(AppView.IMAGE_GEN);
        onClose();
      },
    },
    {
      id: "docs",
      title: "Hujjat AI (RAG & PDF)",
      icon: "📄",
      category: "Media & Create",
      action: () => {
        onNavigate(AppView.DOCS);
        onClose();
      },
    },
    {
      id: "deep_research",
      title: "Deep Research (Chuqur Tadqiqot)",
      icon: "🔎",
      category: "Research",
      action: () => {
        onNavigate(AppView.DEEP_RESEARCH);
        onClose();
      },
    },
    {
      id: "coding_agent",
      title: "AI Coding Agent",
      icon: "💻",
      category: "Develop",
      action: () => {
        onNavigate(AppView.CODING_AGENT);
        onClose();
      },
    },
    {
      id: "ai_debugger",
      title: "AI Debugger",
      icon: "🐛",
      category: "Develop",
      action: () => {
        onNavigate(AppView.AI_DEBUGGER);
        onClose();
      },
    },
    {
      id: "knowledge_base",
      title: "Knowledge Base (RAG)",
      icon: "📚",
      category: "Research",
      action: () => {
        onNavigate(AppView.KNOWLEDGE_BASE);
        onClose();
      },
    },
    {
      id: "multi_agents",
      title: "Multi-Agent Swarm",
      icon: "🤖",
      category: "Automation",
      action: () => {
        onNavigate(AppView.MULTI_AGENTS);
        onClose();
      },
    },
    {
      id: "super_mode",
      title: "Super Mode (End-to-End Generator)",
      icon: "⚡",
      category: "Core",
      action: () => {
        onNavigate(AppView.SUPER_MODE);
        onClose();
      },
    },
    {
      id: "model_hub",
      title: "AI Model Hub & Status",
      icon: "🔌",
      category: "System",
      action: () => {
        onNavigate(AppView.MODEL_HUB);
        onClose();
      },
    },
    {
      id: "analytics",
      title: "Analytics & Usage",
      icon: "📊",
      category: "System",
      action: () => {
        onNavigate(AppView.ANALYTICS);
        onClose();
      },
    },
    {
      id: "settings",
      title: "Sozlamalar & Integratsiyalar",
      icon: "⚙️",
      category: "System",
      action: () => {
        onNavigate(AppView.SETTINGS);
        onClose();
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-24 z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-white/10 flex items-center gap-3">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buyruqni yozing yoki bo'limga o'ting (Ctrl+K)..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500"
          />
          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">
            ESC
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((cmd) => (
            <div
              key={cmd.id}
              onClick={cmd.action}
              className="p-2.5 rounded-xl hover:bg-indigo-600/30 hover:border-indigo-500/40 border border-transparent text-xs text-slate-200 cursor-pointer flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{cmd.icon}</span>
                <div>
                  <div className="font-semibold text-white group-hover:text-indigo-300">
                    {cmd.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {cmd.category}
                  </div>
                </div>
              </div>
              {cmd.shortcut && (
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {cmd.shortcut}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Mos buyruq topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
