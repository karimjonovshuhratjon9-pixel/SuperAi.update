import React, { useState, useEffect, useRef } from "react";
import { FileItem } from "../types";
import { dbService } from "../services/dbService";
import { validateFile } from "../services/securityService";
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

interface FileLabViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const FileLabView: React.FC<FileLabViewProps> = ({
  userId,
  onOpenApiKeyModal,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    setLoading(true);
    const items = await dbService.getFilesByUserId(userId);
    setFiles(items);
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const content = reader.result as string;
      const fileItem: FileItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        userId,
        name: file.name,
        type: file.type,
        size: file.size,
        content: file.type.startsWith("image/") ? undefined : content,
        dataUrl: file.type.startsWith("image/") ? content : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await dbService.saveFile(fileItem);
      loadFiles();
    };
    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu faylni o'chirishni tasdiqlaysizmi?")) {
      await dbService.deleteFile(id);
      if (selectedFile?.id === id) setSelectedFile(null);
      loadFiles();
    }
  };

  const handleAnalyze = async (file: FileItem) => {
    setSelectedFile(file);
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setAnalyzing(true);
    setAnalysis("");
    try {
      const content = file.content || "Rasm fayli";
      const res = await getGeminiResponse(
        `Quyidagi faylni tahlil qil va batafsil xulosa ber:\n\nFayl nomi: ${file.name}\nFayl turi: ${file.type}\n\nFayl kontenti:\n${content.slice(0, 8000)}`,
        file.dataUrl,
      );
      setAnalysis(res);
      file.summary = res.slice(0, 200);
      await dbService.saveFile(file);
    } catch (err: any) {
      setAnalysis(`⚠️ ${err?.message || "Tahlil qilishda xatolik"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAsk = async () => {
    if (!selectedFile || !question.trim()) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setAsking(true);
    setAnswer("");
    try {
      const content = selectedFile.content || "";
      const res = await getGeminiResponse(
        `Fayl haqida savolga javob ber:\n\nFayl: ${selectedFile.name}\n\nFayl kontenti:\n${content.slice(0, 8000)}\n\nSavol: ${question}`,
      );
      setAnswer(res);
    } catch (err: any) {
      setAnswer(`⚠️ ${err?.message || "Xatolik"}`);
    } finally {
      setAsking(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (
      type.includes("word") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    )
      return "📝";
    if (
      type.includes("excel") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv")
    )
      return "📊";
    if (type.includes("powerpoint") || name.endsWith(".pptx")) return "📽️";
    if (type.includes("zip")) return "📦";
    if (type.includes("json")) return "🧾";
    return "📁";
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="File Lab"
          title="📁 Fayl Laboratoriyasi"
          description="Fayllarni yuklang, tahlil qiling, xulosa oling va savollar bering"
          actions={
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.json,.zip,image/*"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                📤 Fayl Yuklash
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File list */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">
              Fayllar ({files.length})
            </h3>
            {loading ? (
              <LoadingSkeleton count={4} />
            ) : files.length === 0 ? (
              <EmptyState
                icon="📁"
                title="Fayllar yo'q"
                description="PDF, DOCX, XLSX, CSV, JSON, ZIP yoki rasm fayllarini yuklang. AI ularni tahlil qiladi."
                action={
                  <Button onClick={() => fileInputRef.current?.click()}>
                    📤 Birinchi faylni yuklash
                  </Button>
                }
              />
            ) : (
              files.map((file) => (
                <Card
                  key={file.id}
                  className="hover:border-blue-500/30 transition cursor-pointer"
                  onClick={() => handleAnalyze(file)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {getFileIcon(file.type, file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge color="slate">{formatSize(file.size)}</Badge>
                        <Badge color="blue">
                          {file.type.split("/")[1] || "file"}
                        </Badge>
                      </div>
                      {file.summary && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {file.summary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 transition"
                    >
                      🗑
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Analysis panel */}
          <div className="glass rounded-2xl p-5 border-white/10 min-h-[400px]">
            <h3 className="text-sm font-black text-white mb-4">
              {selectedFile ? `📋 ${selectedFile.name}` : "📋 Tahlil paneli"}
            </h3>

            {selectedFile?.dataUrl && (
              <img
                src={selectedFile.dataUrl}
                alt={selectedFile.name}
                className="w-full max-h-48 object-cover rounded-xl mb-4 border border-white/10"
              />
            )}

            {analyzing && <LoadingSkeleton count={3} />}

            {!analyzing && analysis && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="block text-xs font-bold text-slate-400 mb-2">
                    Fayl haqida savol bering
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                      placeholder="Masalan: Bu hujjatda nima yozilgan?"
                      className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
                    />
                    <Button
                      onClick={handleAsk}
                      disabled={asking || !question.trim()}
                    >
                      {asking ? "..." : "So'roq"}
                    </Button>
                  </div>
                  {answer && (
                    <div className="mt-3 p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!analyzing && !analysis && (
              <EmptyState
                icon="🔬"
                title="Faylni tanlang"
                description="Chapdagi ro'yxatdan faylni tanlang. AI faylni tahlil qilib, xulosa va savollarga javob beradi."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
