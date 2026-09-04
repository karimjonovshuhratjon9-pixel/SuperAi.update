import React, { useState, useRef, useEffect, useCallback } from "react";
import { Message, User, ChatSession, Snippet, PromptTemplate } from "../types";
import {
  streamChat,
  streamClaudeChat,
  hasApiKey,
  getChatMode,
  ChatMode,
} from "../services/geminiService";
import { dbService } from "../services/dbService";
import MarkdownRenderer from "./MarkdownRenderer";
import { AGENT_PROFILES } from "../constants";
import {
  clearUserMemory,
  getUserMemory,
  setUserMemory,
} from "../services/memoryService";
import {
  speakWithElevenLabs,
  stopElevenLabsAudio,
  hasElevenLabsApiKey,
} from "../services/elevenLabsService";
import { performWebSearch } from "../services/webSearchService";
import { executeAgentAction } from "../services/agentToolsService";

interface ChatViewProps {
  user: User | null;
  chatId: string | null;
  onNewMessage: () => void;
  onChatCreated: (id: string) => void;
  onOpenApiKeyModal: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  user,
  chatId,
  onNewMessage,
  onChatCreated,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [mode, setMode] = useState<ChatMode>(getChatMode());
  const [modelProvider, setModelProvider] = useState<"gemini" | "claude">(
    "gemini",
  );
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPromptLib, setShowPromptLib] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [agentId, setAgentId] = useState("general");
  const [memory, setMemory] = useState(getUserMemory());
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeFileInputRef = useRef<HTMLInputElement>(null);
  // Stream bo'laklarini frame birlashtirish uchun (ortiqcha render yo'q)
  const pendingContentRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  // Yangi chat yaratilganda bir martalik db-reload'ni o'tkazib yuborish uchun
  // (aks holda useEffect [chatId] stream davomida messages'ni db dagi eski
  // holat bilan almashtirib, AI javobining ko'rinmasligiga sabab bo'lardi)
  const skipReloadRef = useRef(false);
  const streamingChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (chatId) {
      if (skipReloadRef.current) {
        skipReloadRef.current = false;
        return;
      }
      if (streamingChatIdRef.current === chatId) return;
      dbService.getMessagesByChatId(chatId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Komponent yopilganda rejalashtirilgan renderni bekor qilish
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const runAssistant = useCallback(
    async (
      activeChatId: string,
      historyContext: Message[],
      prompt: string,
      image?: string,
    ) => {
      const assistantMsgId = (Date.now() + 1).toString();
      let assistantContent = "";

      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        chatId: activeChatId,
        role: "assistant",
        content: "Fikrlamoqda...",
        timestamp: Date.now(),
        type: "text",
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);
      setIsLoading(true);
      streamingChatIdRef.current = activeChatId;

      try {
        pendingContentRef.current = "";

        const flushPending = () => {
          rafRef.current = null;
          const content = pendingContentRef.current;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content } : m)),
          );
        };

        const handleChunk = (chunk: string) => {
          assistantContent += chunk;
          pendingContentRef.current = assistantContent;
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(flushPending);
          }
        };
        let webGroundingContext = "";
        if (webSearchEnabled) {
          try {
            const searchRes = await performWebSearch(prompt);
            if (searchRes.sources.length > 0) {
              webGroundingContext =
                "🌐 Internetdan qidirilgan eng so'nggi real faktlar va manbalar:\n" +
                searchRes.sources
                  .map((s, idx) => `[${idx + 1}] ${s.title}: ${s.snippet} (Manba: ${s.url})`)
                  .join("\n\n");
            }
          } catch (searchErr) {
            console.warn("Web search grounding error:", searchErr);
          }
        }

        const enrichedPrompt = [
          [
            AGENT_PROFILES.find((agent) => agent.id === agentId)?.instruction,
            memory ? `Foydalanuvchi xotirasi:\n${memory}` : "",
            webGroundingContext,
            systemPrompt,
          ]
            .filter(Boolean)
            .join("\n\n"),
          prompt,
        ]
          .filter(Boolean)
          .join("\n\n");
        if (modelProvider === "claude") {
          try {
            await streamClaudeChat(enrichedPrompt, historyContext, handleChunk);
          } catch (claudeError) {
            console.warn(
              "Claude ishlamadi, Gemini fallback ishga tushdi",
              claudeError,
            );
            await streamChat(prompt, image, historyContext, handleChunk, {
              mode,
              systemInstruction:
                [
                  AGENT_PROFILES.find((agent) => agent.id === agentId)
                    ?.instruction,
                  memory ? `Foydalanuvchi xotirasi:\n${memory}` : "",
                  systemPrompt,
                ]
                  .filter(Boolean)
                  .join("\n\n") || undefined,
            });
          }
        } else {
          await streamChat(prompt, image, historyContext, handleChunk, {
            mode,
            systemInstruction:
              [
                AGENT_PROFILES.find((agent) => agent.id === agentId)
                  ?.instruction,
                memory ? `Foydalanuvchi xotirasi:\n${memory}` : "",
                systemPrompt,
              ]
                .filter(Boolean)
                .join("\n\n") || undefined,
          });
        }

        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (assistantContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: assistantContent } : m,
            ),
          );
        }

        const finalAssistantMsg: Message = {
          ...assistantPlaceholder,
          content: assistantContent || "Afsuski, javob olinmadi.",
        };
        await dbService.saveMessage(finalAssistantMsg);
        await dbService.updateChatLastMessage(
          activeChatId,
          (assistantContent || "Javob berildi").substring(0, 50),
        );
        onNewMessage();
      } catch (err: any) {
        console.error(err);
        const errMsg =
          err?.message || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: `⚠️ ${errMsg}` } : m,
          ),
        );
      } finally {
        setIsLoading(false);
        if (streamingChatIdRef.current === activeChatId) {
          streamingChatIdRef.current = null;
        }
      }
    },
    [agentId, memory, mode, modelProvider, systemPrompt, onNewMessage],
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (
      (!input.trim() && !selectedImage && !selectedFile) ||
      isLoading ||
      !user
    )
      return;

    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }

    let activeChatId = chatId;
    const currentInput = selectedFile
      ? `${input}\n\n[Fayl: ${selectedFile.name}]\n\`\`\`${selectedFile.name.split(".").pop()}\n${selectedFile.content}\n\`\`\``
      : input;
    const currentImage = selectedImage;

    // Create new chat session if it doesn't exist
    if (!activeChatId) {
      activeChatId = Date.now().toString();
      const newChat: ChatSession = {
        id: activeChatId,
        userId: user.id,
        title: currentInput.substring(0, 30) || "Rasm/Fayl bilan suhbat",
        lastMessage: currentInput.substring(0, 50) || "Rasm yuklandi",
        timestamp: Date.now(),
      };
      await dbService.createChat(newChat);
      // chatId o'zgarishi useEffect'dagi db-reload'ni keltirib chiqaradi.
      // Stream davomida messages almashtirilmasligi uchun bir martalik
      // reload'ni o'tkazib yuboramiz (race condition tuzatildi).
      skipReloadRef.current = true;
      onChatCreated(activeChatId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      chatId: activeChatId,
      role: "user",
      content: currentInput,
      timestamp: Date.now(),
      type: "text",
      imageUrl: currentImage || undefined,
      fileName: selectedFile?.name,
    };

    await dbService.saveMessage(userMsg);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setSelectedFile(null);
    setIsLoading(true);
    onNewMessage();

    const historyContext = [...messages, userMsg];
    await runAssistant(
      activeChatId!,
      historyContext,
      currentInput,
      currentImage || undefined,
    );
  };

  const handleCodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({ name: file.name, content: reader.result as string });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ===== Xabar amallari =====

  // Javobni qayta generatsiya qilish — oxirgi assistant javobini o'chirib,
  // uning oldidagi savol asosida qayta so'raymiz
  const handleRegenerate = async (msg: Message) => {
    if (isLoading) return;
    const idx = messages.findIndex((m) => m.id === msg.id);
    const prevUser = [...messages.slice(0, idx)]
      .reverse()
      .find((m) => m.role === "user");
    if (!prevUser || !chatId) return;

    await dbService.saveMessage({ ...msg, content: "" });
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    const historyContext = messages.slice(0, idx);
    await runAssistant(
      chatId,
      historyContext,
      prevUser.content,
      prevUser.imageUrl,
    );
  };

  // Foydalanuvchi xabarini tahrirlash va qayta javob olish
  const startEdit = (msg: Message) => {
    setEditingMsgId(msg.id);
    setEditText(msg.content);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText("");
  };

  const saveEditAndResend = async () => {
    if (!editingMsgId || !chatId) return;
    const idx = messages.findIndex((m) => m.id === editingMsgId);
    if (idx < 0) return cancelEdit();

    const edited = { ...messages[idx], content: editText };
    await dbService.saveMessage(edited);

    // Shu xabardan keyingi barcha javoblarni o'chiramiz
    const removed = messages.slice(idx + 1);
    for (const m of removed) await dbService.saveMessage({ ...m, content: "" });
    setMessages((prev) => [
      ...prev.slice(0, idx + 1).map((m) => (m.id === edited.id ? edited : m)),
    ]);

    cancelEdit();
    setIsLoading(true);
    await runAssistant(
      chatId,
      messages.slice(0, idx + 1),
      edited.content,
      edited.imageUrl,
    );
  };

  const togglePin = async (msg: Message) => {
    const updated = { ...msg, pinned: !msg.pinned };
    await dbService.saveMessage(updated);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const rateMessage = (messageId: string, rating: "up" | "down") => {
    try {
      const raw = localStorage.getItem("superai_feedback_v1");
      const feedback = raw ? JSON.parse(raw) : {};
      feedback[messageId] = rating;
      localStorage.setItem("superai_feedback_v1", JSON.stringify(feedback));
    } catch {
      /* localStorage mavjud emas */
    }
  };

  // Javobni ovoz bilan o'qish (SpeechSynthesis)
  // ElevenLabs yoki Web Speech orqali ovoz chiqarish
  const toggleSpeak = async (msg: Message) => {
    if (speakingId === msg.id) {
      stopElevenLabsAudio();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    stopElevenLabsAudio();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(msg.id);

    if (hasElevenLabsApiKey()) {
      await speakWithElevenLabs(
        msg.content,
        undefined,
        () => setSpeakingId(msg.id),
        () => setSpeakingId(null),
        () => setSpeakingId(null),
      );
    } else {
      if (!("speechSynthesis" in window)) {
        setSpeakingId(null);
        return;
      }
      const plain = msg.content
        .replace(/```[\s\S]*?```/g, " kod bloki ")
        .replace(/[*#`_]/g, "");
      const utter = new SpeechSynthesisUtterance(plain);
      utter.lang = /[a-zʻ'g]/i.test(msg.content) ? "uz-UZ" : "ru-RU";
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utter);
    }
  };

  useEffect(() => {
    return () => {
      stopElevenLabsAudio();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  // Ovozli kiritish (Web Speech API)
  const toggleMic = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        "Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Chrome'dan foydalaning.",
      );
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "uz-UZ";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setInput(text);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  // Drag & drop fayl qabul qilish
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith("image/")) {
        setSelectedImage(reader.result as string);
      } else {
        setSelectedFile({ name: file.name, content: reader.result as string });
      }
    };
    if (file.type.startsWith("image/")) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  // Kod bloklarini snippet sifatida saqlash
  const saveSnippetFrom = async (code: string, lang: string) => {
    const snip: Snippet = {
      id: Date.now().toString(),
      code,
      lang: lang || "code",
      title: `${lang || "code"} snippet`,
      timestamp: Date.now(),
    };
    await dbService.saveSnippet(snip);
    alert(
      "✅ Snippet saqlandi! Sidebar'dagi 'Snippetlar' bo'limida ko'rinsin.",
    );
  };

  // Chatni export qilish
  const exportChat = (format: "md" | "json") => {
    if (!messages.length) return;
    let content: string;
    let filename: string;
    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      filename = `superai-chat-${Date.now()}.json`;
    } else {
      content = messages
        .map(
          (m) =>
            `## ${m.role === "user" ? "👤 Siz" : "🤖 SuperAI"} — ${new Date(m.timestamp).toLocaleString()}\n\n${m.content}`,
        )
        .join("\n\n---\n\n");
      filename = `superai-chat-${Date.now()}.md`;
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/20 border-4 border-dashed border-blue-400 rounded-3xl flex items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-blue-200">
            📄 Faylni tashlang...
          </span>
        </div>
      )}
      {/* Api key missing banner */}
      {!hasApiKey() && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md z-30">
          <span className="flex items-center gap-2">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Javob olish uchun Gemini API kalitini kiritishingiz kerak!
          </span>
          <button
            onClick={onOpenApiKeyModal}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-slate-100 transition"
          >
            API Key Kiriting
          </button>
        </div>
      )}

      {/* Toolbar: rejim + export + system prompt — scroll qilinadigan chip row */}
      <div className="shrink-0 flex items-center gap-2 px-4 md:px-10 py-2 border-b border-white/5 overflow-x-auto no-scrollbar">
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="shrink-0 px-3 h-8 text-[11px] font-bold rounded-full bg-emerald-600/15 text-emerald-200 border border-emerald-500/25 outline-none"
          title="Agent profilini tanlang"
        >
          {AGENT_PROFILES.map((agent) => (
            <option key={agent.id} value={agent.id} className="bg-slate-900">
              {agent.icon} {agent.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Barcha so'rovlar tez va kuchli Smart model orqali ishlaydi"
          className="shrink-0 px-3 h-8 text-[11px] font-black rounded-full border bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent"
        >
          ⚡ Smart model
        </button>
        <div className="hidden md:block flex-1" />
        <button
          onClick={() => setSystemPromptOpen((v) => !v)}
          className={`shrink-0 h-8 px-3 text-[11px] font-bold rounded-full border transition ${
            systemPrompt
              ? "bg-purple-600/30 text-purple-200 border-purple-500/40"
              : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
          }`}
          title="AI shaxsiyatini sozlash"
        >
          🎭 Rol{systemPrompt ? " ✓" : ""}
        </button>
        <button
          onClick={() => setMemoryOpen((value) => !value)}
          className={`shrink-0 h-8 px-3 text-[11px] font-bold rounded-full border transition ${memory ? "bg-amber-600/20 text-amber-200 border-amber-500/30" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`}
          title="Foydalanuvchi xotirasi"
        >
          🧠 Xotira{memory ? " ✓" : ""}
        </button>
        <button
          onClick={() => exportChat("md")}
          className="shrink-0 h-8 px-3 text-[11px] font-bold rounded-full bg-white/5 text-slate-400 border border-white/10 hover:text-white transition"
          title="Chatni Markdown fayl sifatida yuklab olish"
        >
          ⬇ Export
        </button>
      </div>

      {systemPromptOpen && (
        <div className="shrink-0 px-4 md:px-10 py-2 bg-slate-900/60 border-b border-white/5">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Masalan: Sen tajribali Python dasturchisisan. Har javobingda misollar bilan tushuntir..."
            rows={2}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500/50 resize-none"
          />
          <p className="text-[10px] text-slate-500 mt-1 px-1">
            🎭 AI'ga rol bering — bu ko'rsatma har bir javobga ta'sir qiladi.
          </p>
        </div>
      )}

      {memoryOpen && (
        <div className="shrink-0 px-4 md:px-10 py-2 bg-slate-900/60 border-b border-white/5">
          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            placeholder="Masalan: Men frontend dasturchiman. Javoblarni o'zbek tilida va qisqa bering."
            rows={2}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/50 resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-500 px-1">
              Bu ma'lumot keyingi chatlarda ham ishlatiladi.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearUserMemory();
                  setMemory("");
                }}
                className="px-2 py-1 text-[10px] font-bold text-red-300 hover:text-red-200"
              >
                Tozalash
              </button>
              <button
                onClick={() => {
                  setUserMemory(memory);
                  setMemory(getUserMemory());
                }}
                className="px-3 py-1 text-[10px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-500"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div
        ref={scrollRef}
        aria-live="polite"
        aria-label="Chat xabarlari"
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-90 animate-fade-in py-12">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
              <svg
                className="w-10 h-10 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <h3
                className="font-black text-white tracking-tight"
                style={{ fontSize: "clamp(1.625rem, 2vw + 1rem, 2.75rem)", lineHeight: 1.15 }}
              >
                Salom! 👋
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                  Aivora AI
                </span>{" "}
                sizga qanday yordam bera oladi?
              </h3>
              <p className="mx-auto max-w-md text-slate-400 text-sm md:text-[15px] font-medium">
                Savol bering, matn yoki rasm tahlil qiling.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-4">
              {[
                "O'zbek tilida she'r yoz",
                "Python koddagi xatoni top",
                "Rasm tahlil qilib ber",
                "Matnni xulosalab ber",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="flex items-center gap-2.5 px-3.5 h-[52px] w-full text-xs sm:text-[13px] font-bold text-slate-300 bg-slate-800/50 border border-white/5 rounded-xl hover:bg-slate-700/70 hover:text-white hover:border-white/10 transition text-left"
                >
                  <span className="text-base shrink-0" aria-hidden="true">
                    💡
                  </span>
                  <span className="truncate min-w-0">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex flex-col space-y-2 w-full min-w-0 max-w-[95%] md:max-w-[85%] lg:max-w-[min(85%,860px)] ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-3xl p-4 md:p-5 shadow-2xl w-full min-w-0 overflow-hidden ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none"
                    : "glass text-slate-100 rounded-tl-none border-white/10"
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded"
                    className="max-w-full max-h-80 object-cover rounded-2xl mb-4 border border-white/20 shadow-lg"
                  />
                )}
                <div className="whitespace-pre-wrap break-words text-sm md:text-[15px] leading-relaxed font-medium">
                  {msg.role === "assistant" ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {msg.fileName && msg.role === "user" && (
                <span className="text-[10px] text-blue-300 font-bold px-2 flex items-center gap-1">
                  📄 {msg.fileName}
                </span>
              )}
              {/* Xabar amallari */}
              <div className="flex items-center gap-1 px-1 flex-wrap opacity-60 hover:opacity-100 transition">
                <button
                  onClick={() => copyMessage(msg.content)}
                  className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-white/5 transition"
                  title="Nusxa olish"
                  aria-label="Xabarni nusxalash"
                >
                  📋
                </button>
                <button
                  onClick={() => togglePin(msg)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition ${msg.pinned ? "text-amber-400" : "text-slate-500 hover:text-amber-400"}`}
                  title={msg.pinned ? "Pin'dan olish" : "Pin qilish"}
                  aria-label={
                    msg.pinned
                      ? "Xabar pinini olib tashlash"
                      : "Xabarni pin qilish"
                  }
                >
                  📌
                </button>
                {msg.role === "assistant" && (
                  <>
                    <button
                      onClick={() => rateMessage(msg.id, "up")}
                      className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition"
                      title="Javob foydali bo'ldi"
                      aria-label="Javob foydali bo'ldi"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => rateMessage(msg.id, "down")}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                      title="Javob foydali bo'lmadi"
                      aria-label="Javob foydali bo'lmadi"
                    >
                      👎
                    </button>
                    <button
                      onClick={() => toggleSpeak(msg)}
                      className={`p-1.5 rounded-lg hover:bg-white/5 transition ${speakingId === msg.id ? "text-green-400 animate-pulse" : "text-slate-500 hover:text-green-400"}`}
                      title={
                        speakingId === msg.id
                          ? "O'qishni to'xtatish"
                          : "Ovoz bilan o'qish"
                      }
                      aria-label={
                        speakingId === msg.id
                          ? "O'qishni to'xtatish"
                          : "Xabarni ovoz chiqarib o'qish"
                      }
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => handleRegenerate(msg)}
                      disabled={isLoading}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition disabled:opacity-30"
                      title="Qayta generatsiya"
                      aria-label="Javobni qayta generatsiya qilish"
                    >
                      ↻
                    </button>
                  </>
                )}
                {msg.role === "user" && (
                  <button
                    onClick={() => startEdit(msg)}
                    className="p-1.5 text-slate-500 hover:text-yellow-400 rounded-lg hover:bg-white/5 transition"
                    title="Tahrirlash va qayta yuborish"
                    aria-label="Xabarni tahrirlash"
                  >
                    ✏️
                  </button>
                )}
              </div>
              {editingMsgId === msg.id && (
                <div className="w-full glass rounded-2xl p-3 border border-yellow-500/30">
                  <button
                    type="button"
                    onClick={() => setShowPromptLib(true)}
                    className="p-3 text-slate-400 hover:text-amber-400 hover:bg-amber-600/10 rounded-full transition-all"
                    title="Prompt kutubxonasi"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl p-2 text-xs text-slate-200 outline-none resize-none focus:border-yellow-500/50"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={saveEditAndResend}
                      className="px-3 py-1 text-[11px] font-black rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition"
                    >
                      ✓ Saqlash va qayta so'rash
                    </button>
                  </div>
                </div>
              )}
              <span className="text-[10px] text-slate-500 font-bold px-2 uppercase tracking-widest">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start animate-pulse">
            <div className="glass p-5 rounded-3xl rounded-tl-none border-white/10">
              <div className="flex space-x-2">
                <div
                  className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                ></div>
                <div
                  className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area — Aivora AI premium composer */}
      <div className="shrink-0 px-3 md:px-10 pt-2 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-6">
        <form onSubmit={handleSendMessage} className="composer-shell">
          <div className="ai-composer rounded-[1.25rem]">
            {selectedImage && (
              <div className="relative inline-block w-20 h-20 ml-2.5 mt-2">
                <img
                  src={selectedImage}
                  className="w-full h-full object-cover rounded-2xl border-2 border-blue-500 shadow-xl"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg border-2 border-[#0f172a]"
                  aria-label="Rasmni olib tashlash"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
                  </svg>
                </button>
              </div>
            )}
            {selectedFile && (
              <div className="flex items-center gap-2 mx-2.5 mt-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-xl w-fit max-w-full">
                <span className="text-lg">📄</span>
                <span className="text-xs font-bold text-blue-200 truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-400 hover:text-red-300 font-black text-xs"
                  aria-label="Faylni olib tashlash"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 p-1.5">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setToolsOpen((v) => !v)}
                  className={`w-10 h-10 rounded-xl inline-flex items-center justify-center transition ${
                    toolsOpen
                      ? "bg-slate-700/60 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                  aria-label="Qo'shimcha vositalar"
                  title="Vositalar (kod, export, promptlar)"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                {toolsOpen && (
                  <div
                    className="absolute bottom-[calc(100%+0.5rem)] left-0 w-56 glass rounded-2xl border border-white/10 shadow-2xl p-1.5 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        codeFileInputRef.current?.click();
                        setToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <span className="text-base" aria-hidden="true">💻</span>
                      <span>Kod fayl yuklash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportChat("md");
                        setToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <span className="text-base" aria-hidden="true">📥</span>
                      <span>Chatni eksport qilish</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptLib(true);
                        setToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <span className="text-base" aria-hidden="true">📚</span>
                      <span>Prompt kutubxonasi</span>
                    </button>
                  </div>
                )}
              </div>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Xabaringizni yozing..."
                aria-label="Xabar yozish"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 py-2.5 resize-none max-h-32 text-[16px] md:text-[15px] font-medium"
              />
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
              />
              <input
                type="file"
                className="hidden"
                ref={codeFileInputRef}
                accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.json,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.sql,.sh,.txt,.md,.xml,.yml,.yaml"
                onChange={handleCodeFileUpload}
              />
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (!input.trim() && !selectedImage && !selectedFile)
                }
                aria-label={isLoading ? "Javob kutilmoqda" : "Xabar yuborish"}
                className={`composer-send shrink-0 ${
                  isLoading ||
                  (!input.trim() && !selectedImage && !selectedFile)
                    ? "bg-slate-800 text-slate-600"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
              <div className="flex items-center gap-1 px-3 pb-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="composer-tool"
                title="Rasm yuklash"
                aria-label="Rasm yuklash"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={toggleMic}
                title={
                  isListening ? "Tinglashni to'xtatish" : "Ovozli kiritish"
                }
                aria-label={
                  isListening
                    ? "Ovozli kiritishni to'xtatish"
                    : "Ovozli kiritish"
                }
                className={`composer-tool ${isListening ? "is-listening" : ""}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                title={
                  webSearchEnabled
                    ? "Internetdan qidirish (Faol)"
                    : "Internetdan qidirishni yoqish"
                }
                aria-label="Internetdan qidirish"
                className={`composer-tool ${webSearchEnabled ? "is-active" : ""}`}
              >
                <span className="text-sm leading-none">🌐</span>
              </button>
              <div className="flex-1" />
              <select
                value={modelProvider}
                onChange={(event) =>
                  setModelProvider(event.target.value as "gemini" | "claude")
                }
                className="shrink-0 h-8 max-w-[7.5rem] rounded-lg border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-slate-300 outline-none focus:border-blue-400"
                title="AI modelini tanlang"
                aria-label="AI modelini tanlang"
              >
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      {/* Prompt kutubxonasi */}
      {showPromptLib && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowPromptLib(false)}
        >
          <div
            className="w-full max-w-lg glass rounded-3xl border border-white/20 shadow-2xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-white mb-1">
              📚 Prompt kutubxonasi
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tayyor shablonni tanlang — inputga qo'shiladi.
            </p>
            <div className="space-y-2">
              {[
                {
                  icon: "🐛",
                  title: "Xatoni topish",
                  text: "Quyidagi koddagi xatolarni topib, tuzatilgan versiyasini yozing va har bir o'zgartirishni tushuntiring:\n\n",
                },
                {
                  icon: "📝",
                  title: "Kod yozish",
                  text: "Menga quyidagi funksiyani amalga oshiruvchi to'liq, ishlaydigan kod yozib bering. Izohlar bilan yozing:\n\n",
                },
                {
                  icon: "🔄",
                  title: "Tarjima",
                  text: "Quyidagi matnni professional darajada tarjima qiling (manba tilini avtomatik aniqlang):\n\n",
                },
                {
                  icon: "📊",
                  title: "Xulosa",
                  text: "Quyidagi matnni asosiy fikrlarni saqlagan holda 5 ta bandda xulosalang:\n\n",
                },
                {
                  icon: "💡",
                  title: "G'oyalar",
                  text: "Menga quyidagi mavzu bo'yicha 10 ta ijodiy g'oya bering, har birini qisqa izohlang:\n\n",
                },
                {
                  icon: "📧",
                  title: "Email yozish",
                  text: "Quyidagi ma'lumot asosida rasmiy va muloyim email yozing:\n\n",
                },
                {
                  icon: "🧪",
                  title: "Test yozish",
                  text: "Quyidagi kod uchun to'liq unit-test'lar yozing (edge case'lar bilan):\n\n",
                },
                {
                  icon: "👨‍🏫",
                  title: "Tushuntirish",
                  text: "Quyidagi kodni yangi boshlovchiga tushunarli qilib, qadam-baqadam tushuntirib bering:\n\n",
                },
              ].map((tpl) => (
                <button
                  key={tpl.title}
                  onClick={() => {
                    setInput(tpl.text);
                    setShowPromptLib(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-700 border border-white/5 rounded-xl transition text-left"
                >
                  <span className="text-xl">{tpl.icon}</span>
                  <span className="flex-1">
                    <span className="block text-xs font-black text-white">
                      {tpl.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {tpl.text}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPromptLib(false)}
              className="mt-4 w-full py-2 text-xs font-bold rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/40 transition"
            >
              ✕ Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
