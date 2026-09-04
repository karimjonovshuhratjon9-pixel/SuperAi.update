import React, { useState, useEffect } from "react";
import { AppView, User, ChatSession, Snippet } from "../types";
import { dbService } from "../services/dbService";
import { hasApiKey } from "../services/geminiService";
import {
  getSubscriptionInfo,
  onSubscriptionChange,
  SubscriptionInfo,
} from "../services/promoService";
import PromoCodeModal from "./PromoCodeModal";

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  currentChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  refreshTrigger: number;
  onOpenApiKeyModal: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  onLogout,
  user,
  currentChatId,
  onSelectChat,
  refreshTrigger,
  onOpenApiKeyModal,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSession[] | null>(
    null,
  );
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo>(
    getSubscriptionInfo(),
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsub = onSubscriptionChange(setSubInfo);
    return () => unsub();
  }, []);

  // Mobil sidebar ochiq vaqtida: body scroll'ni bloklash + Escape bilan yopish
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, onCloseMobile]);

  useEffect(() => {
    if (user) {
      dbService.getChatsByUserId(user.id).then(setHistory);
    }
  }, [user, refreshTrigger, currentChatId]);

  // Chat sarlavhalari bo'yicha tezkor filtr
  const filteredHistory = searchQuery.trim()
    ? history.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.lastMessage || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : history;

  // Pin qilingan chatlar tepada
  const sortedHistory = [
    ...filteredHistory.filter((c) => c.pinned),
    ...filteredHistory.filter((c) => !c.pinned),
  ];
  const visibleHistory = searchResults || sortedHistory;

  const toggleChatPin = async (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    await dbService.updateChat({ ...chat, pinned: !chat.pinned });
    if (user) dbService.getChatsByUserId(user.id).then(setHistory);
  };

  const handleSearchAll = async () => {
    if (!user || !searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const msgs = await dbService.searchMessages(user.id, searchQuery);
    const matchedIds = new Set(msgs.map((m) => m.chatId));
    setSearchResults(history.filter((c) => matchedIds.has(c.id)));
  };

  const loadSnippets = async () => {
    const all = await dbService.getAllSnippets();
    setSnippets(all);
    setShowSnippets(true);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm("Rostdan ham ushbu chatni o'chirmoqchimisiz?")) {
      await dbService.deleteChat(chatId);
      if (currentChatId === chatId) {
        onSelectChat(null);
      }
      if (user) {
        dbService.getChatsByUserId(user.id).then(setHistory);
      }
    }
  };

  interface MenuGroup {
    name: string;
    items: {
      view: AppView;
      label: string;
      icon: string;
      badge?: string;
    }[];
  }

  const menuGroups: MenuGroup[] = [
    {
      name: "MAIN",
      items: [
        {
          view: AppView.DASHBOARD,
          label: "Bosh sahifa",
          icon: "M3 12l9-9 9 9M5 10v10h14V10M9 20v-6h6v6",
        },
        { view: AppView.CHAT, label: "AI Chat", icon: "M12 4v16m8-8H4" },
        {
          view: AppView.AI_MEMORY,
          label: "AI Memory",
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        },
        {
          view: AppView.AI_SEARCH,
          label: "AI Search",
          icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
        },
      ],
    },
    {
      name: "CREATE",
      items: [
        {
          view: AppView.IMAGE_GEN,
          label: "Image Studio",
          icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
        {
          view: AppView.HEYGEN_AVATAR,
          label: "Video Studio",
          badge: "PRO 🎬",
          icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
        },
        {
          view: AppView.MUSIC_STUDIO,
          label: "Music Studio",
          icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
        },
        {
          view: AppView.VOICE_STUDIO,
          label: "Voice Studio",
          icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
        },
        {
          view: AppView.DOCUMENT_STUDIO,
          label: "Document Studio",
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        },
      ],
    },
    {
      name: "WORK",
      items: [
        {
          view: AppView.FILE_LAB,
          label: "File Lab",
          icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
        },
        {
          view: AppView.DATA_ANALYST,
          label: "Data Analyst",
          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        },
        {
          view: AppView.TRANSLATOR,
          label: "Translator",
          icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
        },
        {
          view: AppView.DEEP_RESEARCH,
          label: "Deep Research",
          icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
        },
        {
          view: AppView.CODING_AGENT,
          label: "Coding Agent",
          icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
      ],
    },
    {
      name: "AGENTS",
      items: [
        {
          view: AppView.AGENT_HUB,
          label: "Agent Hub",
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        },
        {
          view: AppView.AGENT_BUILDER,
          label: "Agent Builder",
          icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
        },
        {
          view: AppView.MULTI_AGENTS,
          label: "Multi-Agent",
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        },
        {
          view: AppView.WORKFLOWS,
          label: "Workflows",
          icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
        },
        {
          view: AppView.AUTOMATIONS,
          label: "Automations",
          icon: "M13 10V3L4 14h7v7l9-11h-7z",
        },
      ],
    },
    {
      name: "LEARN",
      items: [
        {
          view: AppView.STUDY_MODE,
          label: "Study Mode",
          icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        },
        {
          view: AppView.AI_TUTOR,
          label: "AI Tutor",
          icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        },
        {
          view: AppView.QUIZ,
          label: "Quiz",
          icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          view: AppView.FLASHCARDS,
          label: "Flashcards",
          icon: "M3 10h18M7 15h2m4 0h4M3 6h18v12H3V6z",
        },
        {
          view: AppView.EXAM_SIMULATOR,
          label: "Exam Simulator",
          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
        },
      ],
    },
    {
      name: "TOOLS",
      items: [
        {
          view: AppView.VISION_AI,
          label: "Vision AI",
          icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
        },
        {
          view: AppView.VOICE,
          label: "Voice AI",
          icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
        },
        {
          view: AppView.PLAYGROUND,
          label: "Playground",
          icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
        },
        {
          view: AppView.SECURITY_SCANNER,
          label: "Security Scanner",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        },
      ],
    },
    {
      name: "ACCOUNT",
      items: [
        {
          view: AppView.PROFILE,
          label: "Profile",
          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        },
        {
          view: AppView.SUBSCRIPTION,
          label: "Subscription",
          icon: "M3 10h18M7 15h2m4 0h4M3 6h18v12H3V6z",
        },
        {
          view: AppView.API_PLATFORM,
          label: "API",
          icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z",
        },
        {
          view: AppView.SETTINGS,
          label: "Settings",
          icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobil orqa fon */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`${collapsed ? "w-16" : "w-72 max-w-[88vw]"} glass flex-col h-full z-50 border-r border-white/5 select-none fixed md:static left-0 top-0 transition-all duration-300 overscroll-contain [touch-action:manipulation] ${
          mobileOpen
            ? "flex translate-x-0"
            : "flex -translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 md:p-6 flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
              AivoraAI
            </h2>
          )}
          {collapsed && (
            <div className="w-full text-center text-xl font-black text-blue-400">
              ⚡
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={collapsed ? "Kengaytirish" : "Yig'ish"}
            >
              {collapsed ? "→" : "←"}
            </button>
            <button
              onClick={onOpenApiKeyModal}
              className={`p-2 rounded-xl transition ${hasApiKey() ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"}`}
              title="API Key Sozlamalari"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z"
                />
              </svg>
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="px-4 mb-3">
            <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2">
              <svg
                className="w-4 h-4 text-slate-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchResults(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearchAll()}
                placeholder="Qidirish... (Enter)"
                className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(null);
                  }}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="px-3 space-y-4 mb-4 flex-1 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.name} className="space-y-1">
              {!collapsed && (
                <span className="text-[9px] font-black tracking-wider text-slate-500 uppercase px-3 block">
                  {group.name}
                </span>
              )}
              {group.items.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    if (item.view === AppView.CHAT) onSelectChat(null);
                    setView(item.view);
                    onCloseMobile?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-all ${
                    currentView === item.view &&
                    (item.view !== AppView.CHAT || !currentChatId)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white font-medium"
                  }`}
                >
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {!collapsed && (
                    <>
                      <span className="text-xs tracking-wide truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-3 flex items-center justify-between">
              <span>
                {searchResults ? "Qidiruv natijalari" : "Tarix / History"}
              </span>
              <button
                onClick={loadSnippets}
                className="text-emerald-400 hover:text-emerald-300 normal-case tracking-normal"
                title="Saqlangan kod snippetlari"
              >
                📦 Snippetlar
              </button>
            </p>
            <div className="space-y-1">
              {visibleHistory.length === 0 ? (
                <p className="px-2 text-xs text-slate-500 italic">
                  Hali chatlar yo'q
                </p>
              ) : (
                visibleHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      setView(AppView.CHAT);
                      onCloseMobile?.();
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                      currentChatId === chat.id
                        ? "bg-slate-800 border border-slate-700/80 shadow"
                        : "hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="overflow-hidden pr-2 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${currentChatId === chat.id ? "text-blue-400" : "text-slate-300"}`}
                      >
                        {chat.pinned ? "📌 " : ""}
                        {chat.title || "Yangi suhbat"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    <button
                      onClick={(e) => toggleChatPin(e, chat)}
                      className={`opacity-0 group-hover:opacity-100 p-1 transition ${chat.pinned ? "text-amber-400 opacity-100" : "text-slate-500 hover:text-amber-400"}`}
                      title={chat.pinned ? "Pin'dan olish" : "Pin qilish"}
                    >
                      📌
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                      title="Chatni o'chirish"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-slate-900/40 space-y-3">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setIsPromoOpen(true)}
              className="w-full text-left p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-400/30 hover:border-amber-400/60 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <span>🎁 Promokod</span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {subInfo.isPremium ? "VIP PRO" : "Faollashtirish"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-emerald-200">
                  $
                  {subInfo.balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  USD
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-white transition">
                  Ochish →
                </span>
              </div>
            </button>
          )}

          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-red-400 transition font-bold text-xs rounded-xl hover:bg-slate-800/40"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!collapsed && <span>Tizimdan chiqish</span>}
          </button>
        </div>
        {/* Snippetlar modali */}
        {showSnippets && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setShowSnippets(false)}
          >
            <div
              className="w-full max-w-2xl glass rounded-3xl border border-white/20 shadow-2xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-white mb-4">
                📦 Saqlangan kod snippetlari
              </h3>
              {snippets.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Hali snippet yo'q. Chatdagi kod bloklaridan saqlashingiz
                  mumkin.
                </p>
              ) : (
                <div className="space-y-3">
                  {snippets.map((s) => (
                    <div
                      key={s.id}
                      className="bg-slate-800/60 border border-white/10 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-emerald-300">
                          {s.title}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(s.code)
                            }
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white/5 text-slate-300 hover:bg-white/15 transition"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={async () => {
                              await dbService.deleteSnippet(s.id);
                              setSnippets((prev) =>
                                prev.filter((x) => x.id !== s.id),
                              );
                            }}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 transition"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      <pre className="text-[11px] text-slate-400 overflow-x-auto custom-scrollbar whitespace-pre max-h-32">
                        {s.code}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowSnippets(false)}
                className="mt-4 w-full py-2 text-xs font-bold rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/40 transition"
              >
                ✕ Yopish
              </button>
            </div>
          </div>
        )}
      </aside>
      {/* Promo Code Modal */}
      <PromoCodeModal
        isOpen={isPromoOpen}
        onClose={() => setIsPromoOpen(false)}
      />
    </>
  );
};

export default Sidebar;
