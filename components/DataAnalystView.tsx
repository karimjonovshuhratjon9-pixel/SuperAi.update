import React, { useState, useRef } from "react";
import { getGeminiResponse, hasApiKey } from "../services/geminiService";
import { dbService } from "../services/dbService";
import { DataAnalysisResult, ChartData } from "../types";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface DataAnalystViewProps {
  userId: string;
  onOpenApiKeyModal: () => void;
}

export const DataAnalystView: React.FC<DataAnalystViewProps> = ({
  userId,
  onOpenApiKeyModal,
}) => {
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<Record<string, any>>({});
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<DataAnalysisResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    const results = await dbService.getDataAnalysisByUserId(userId);
    setHistory(results);
  };

  React.useEffect(() => {
    loadHistory();
  }, [userId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setFileContent(reader.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseCSV = (
    content: string,
  ): { headers: string[]; rows: string[][] } => {
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines
      .slice(1)
      .map((line) => line.split(",").map((c) => c.trim()));
    return { headers, rows };
  };

  const generateCharts = (headers: string[], rows: string[][]): ChartData[] => {
    const charts: ChartData[] = [];
    const numericCols = headers.filter((_, idx) =>
      rows.some((row) => !isNaN(Number(row[idx])) && row[idx] !== ""),
    );

    if (numericCols.length >= 1) {
      const col = numericCols[0];
      const colIdx = headers.indexOf(col);
      const data = rows.map((row) => Number(row[colIdx]) || 0).slice(0, 20);
      const labels = rows.map((_, i) => `#${i + 1}`).slice(0, 20);

      charts.push({
        id: Date.now().toString(36) + "1",
        type: "bar",
        title: `${col} — Bar chart`,
        labels,
        datasets: [{ label: col, data }],
      });

      charts.push({
        id: Date.now().toString(36) + "2",
        type: "line",
        title: `${col} — Line chart`,
        labels,
        datasets: [{ label: col, data }],
      });
    }

    if (numericCols.length >= 2) {
      const col1 = numericCols[0];
      const col2 = numericCols[1];
      const idx1 = headers.indexOf(col1);
      const idx2 = headers.indexOf(col2);
      const data1 = rows.map((row) => Number(row[idx1]) || 0).slice(0, 20);
      const data2 = rows.map((row) => Number(row[idx2]) || 0).slice(0, 20);

      charts.push({
        id: Date.now().toString(36) + "3",
        type: "scatter",
        title: `${col1} vs ${col2}`,
        labels: data1.map((_, i) => `#${i + 1}`),
        datasets: [
          { label: col1, data: data1 },
          { label: col2, data: data2 },
        ],
      });
    }

    return charts;
  };

  const handleAnalyze = async () => {
    if (!fileContent) return;
    if (!hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis("");
    setInsights([]);
    setStatistics({});
    setCharts([]);

    try {
      const { headers, rows } = parseCSV(fileContent);
      const sampleData = rows
        .slice(0, 50)
        .map((row) =>
          Object.fromEntries(headers.map((h, i) => [h, row[i] || ""])),
        );

      const res = await getGeminiResponse(
        `Quyidagi CSV ma'lumotlarini tahlil qil. Statistik xulosalar, naqshlar, anomaliyalar va muhim insightlar bering.\n\nUstunlar: ${headers.join(", ")}\n\nMa'lumotlar:\n${JSON.stringify(sampleData).slice(0, 6000)}`,
      );

      setAnalysis(res);
      setInsights(
        res
          .split("\n")
          .filter(
            (line) =>
              line.trim().startsWith("-") || line.trim().startsWith("•"),
          )
          .map((line) => line.trim().replace(/^[-•]\s*/, ""))
          .slice(0, 10),
      );

      // Calculate basic statistics
      const stats: Record<string, any> = {};
      headers.forEach((header, idx) => {
        const values = rows
          .map((row) => Number(row[idx]))
          .filter((v) => !isNaN(v));
        if (values.length > 0) {
          stats[header] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: Number(
              (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
            ),
            count: values.length,
          };
        }
      });
      setStatistics(stats);

      const generatedCharts = generateCharts(headers, rows);
      setCharts(generatedCharts);

      // Save result
      const result: DataAnalysisResult = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        userId,
        fileName,
        summary: res.slice(0, 500),
        insights,
        statistics: stats,
        charts: generatedCharts,
        createdAt: Date.now(),
      };
      await dbService.saveDataAnalysis(result);
      loadHistory();
    } catch (err: any) {
      setError(err?.message || "Tahlil qilishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (chart: ChartData) => {
    const maxVal = Math.max(...chart.datasets.flatMap((d) => d.data), 1);
    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

    if (chart.type === "pie") {
      const total = chart.datasets[0].data.reduce((a, b) => a + b, 0);
      let cumulative = 0;
      return (
        <div className="flex items-center gap-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {chart.datasets[0].data.map((value, i) => {
                const startAngle = (cumulative / total) * 360;
                cumulative += value;
                const endAngle = (cumulative / total) * 360;
                const x1 =
                  50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
                const y1 =
                  50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
                const x2 =
                  50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
                const y2 =
                  50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                return (
                  <path
                    key={i}
                    d={`M50 50 L${x1} ${y1} A40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[i % colors.length]}
                  />
                );
              })}
            </svg>
          </div>
          <div className="space-y-1">
            {chart.datasets[0].data.map((value, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
                <span className="text-slate-300">{chart.labels[i]}</span>
                <span className="text-slate-500 font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex items-end gap-1 h-40">
          {chart.datasets[0].data.map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500">{value}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(value / maxVal) * 120}px`,
                  background: colors[i % colors.length],
                  opacity: 0.8,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {chart.labels.map((label, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[9px] text-slate-500 truncate"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Data Analyst"
          title="📊 Ma'lumotlar Tahlili"
          description="CSV/XLSX fayllarni yuklang — AI tahlil qiladi, statistikani hisoblaydi va chartlar yaratadi"
          actions={
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.txt,.json"
                onChange={handleFileUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                📤 Ma'lumot Yuklash
              </Button>
            </>
          }
        />

        {fileName && (
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-sm font-black text-white">{fileName}</p>
                  <p className="text-xs text-slate-500">
                    {fileContent.split("\n").length} qator
                  </p>
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? "Tahlil qilinmoqda..." : "🔬 Tahlil qilish"}
              </Button>
            </div>
          </Card>
        )}

        {loading && <LoadingSkeleton count={4} />}

        {error && (
          <Card className="border-red-500/30">
            <p className="text-sm text-red-300 font-bold">⚠️ {error}</p>
          </Card>
        )}

        {analysis && !loading && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-black text-white mb-3">📋 Xulosa</h3>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {analysis}
              </p>
            </Card>

            {Object.keys(statistics).length > 0 && (
              <Card>
                <h3 className="text-sm font-black text-white mb-3">
                  📈 Statistika
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(statistics).map(
                    ([key, stats]: [string, any]) => (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-slate-800/60 border border-white/10"
                      >
                        <p className="text-xs font-black text-blue-300">
                          {key}
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-slate-400">
                          <p>
                            Min:{" "}
                            <span className="text-white font-bold">
                              {stats.min}
                            </span>
                          </p>
                          <p>
                            Max:{" "}
                            <span className="text-white font-bold">
                              {stats.max}
                            </span>
                          </p>
                          <p>
                            O'rtacha:{" "}
                            <span className="text-white font-bold">
                              {stats.avg}
                            </span>
                          </p>
                          <p>
                            Count:{" "}
                            <span className="text-white font-bold">
                              {stats.count}
                            </span>
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            )}

            {charts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white">📊 Chartlar</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {charts.map((chart) => (
                    <Card key={chart.id}>
                      <h4 className="text-xs font-black text-slate-300 mb-3">
                        {chart.title}
                      </h4>
                      {renderChart(chart)}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!fileName && !loading && !analysis && (
          <EmptyState
            icon="📊"
            title="Ma'lumotlarni tahlil qiling"
            description="CSV yoki XLSX fayl yuklang. AI ma'lumotlarni tahlil qiladi, statistikani hisoblaydi, naqshlarni topadi va professional chartlar yaratadi."
            action={
              <Button onClick={() => fileInputRef.current?.click()}>
                📤 Ma'lumot yuklash
              </Button>
            }
          />
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">📚 Tahlil tarixi</h3>
            {history.slice(0, 5).map((result) => (
              <Card
                key={result.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">
                      {result.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge color="green">{result.charts.length} chart</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
