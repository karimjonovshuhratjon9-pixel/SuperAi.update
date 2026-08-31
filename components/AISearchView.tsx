import React, { useState } from "react";
import { performWebSearch } from "../services/webSearchService";
import { SearchSource } from "../types";
import {
  PageHeader,
  Button,
  Input,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface AISearchViewProps {
  userId: string;
}

const SEARCH_MODES = [
  { id: "quick", label: "⚡ Quick", description: "Tez natijalar" },
  { id: "deep", label: "🔍 Deep", description: "Chuqur qidiruv" },
  { id: "academic", label: "🎓 Academic", description: "Ilmiy manbalar" },
  { id: "news", label: "📰 News", description: "Yangiliklar" },
  { id: "technical", label: "💻 Technical", description: "Texnik qidiruv" },
];

export const AISearchView: React.FC<AISearchViewProps> = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("quick");
  const [results, setResults] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await performWebSearch(query);
      setResults(res.sources);
    } catch (err: any) {
      setError(err?.message || "Qidiruvda xatolik yuz berdi");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="AI Search"
          title="🔎 Global Qidiruv"
          description="Internet, chatlar, fayllar va loyihalar bo'ylab qidiring"
        />

        {/* Search input */}
        <div className="glass rounded-2xl p-5 border-white/10">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={query}
              onChange={setQuery}
              placeholder="Nimani qidirmoqchisiz?"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? "Qidirilmoqda..." : "🔍 Qidirish"}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            {SEARCH_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  mode === m.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
                title={m.description}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && <LoadingSkeleton count={4} />}

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <EmptyState
            icon="🔍"
            title="Natija topilmadi"
            description="Boshqa so'zlar bilan qayta urinib ko'ring yoki qidiruv rejimini o'zgartiring."
          />
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">
                {results.length} ta natija
              </h3>
              <Badge color="blue">{mode} rejim</Badge>
            </div>
            {results.map((result, idx) => (
              <Card key={idx} className="hover:border-blue-500/30 transition">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black text-blue-400 mt-1">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white hover:text-blue-300 transition">
                        {result.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {result.url}
                      </p>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                        {result.snippet}
                      </p>
                    </div>
                  </div>
                </a>
              </Card>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <EmptyState
            icon="🌐"
            title="Qidiruvni boshlang"
            description="Yuqoridagi qidiruv maydoniga so'z yozing va Enter tugmasini bosing. AI sizga eng yaxshi natijalarni topib beradi."
          />
        )}
      </div>
    </div>
  );
};
