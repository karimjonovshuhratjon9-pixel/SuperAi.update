import React, { useState } from "react";
import { SecurityFinding, SecurityReport } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  TextArea,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface SecurityScannerViewProps {
  userId: string;
}

export const SecurityScannerView: React.FC<SecurityScannerViewProps> = ({
  userId,
}) => {
  const [code, setCode] = useState("");
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [scanning, setScanning] = useState(false);
  const [score, setScore] = useState(100);
  const [history, setHistory] = useState<SecurityReport[]>([]);

  const loadHistory = async () => {
    const reports = await dbService.getSecurityReportsByUserId(userId);
    setHistory(reports);
  };

  React.useEffect(() => {
    loadHistory();
  }, [userId]);

  const scanCode = () => {
    if (!code.trim()) return;
    setScanning(true);
    setFindings([]);

    // Simulate scanning with delay
    setTimeout(() => {
      const results: SecurityFinding[] = [];

      // XSS detection
      if (/<script|innerHTML|document\.write|eval\(/i.test(code)) {
        results.push({
          id: Date.now().toString(36) + "1",
          severity: "HIGH",
          category: "XSS",
          title: "XSS (Cross-Site Scripting) xavfi",
          description: "Kodda xavfli JavaScript kiritish imkoniyati mavjud",
          location: "HTML/JS kodi",
          recommendation:
            "Foydalanuvchi kiritgan ma'lumotlarni sanitize qiling va innerHTML o'rniga textContent ishlating",
        });
      }

      // SQL Injection detection
      if (
        /SELECT.*FROM|INSERT INTO|DELETE FROM|UPDATE.*SET/i.test(code) &&
        /['"]\s*\+|concat\(/i.test(code)
      ) {
        results.push({
          id: Date.now().toString(36) + "2",
          severity: "CRITICAL",
          category: "SQL Injection",
          title: "SQL Injection xavfi",
          description:
            "SQL so'rovlar foydalanuvchi kiritgan ma'lumotlar bilan birlashtirilmoqda",
          location: "SQL so'rov",
          recommendation:
            "Prepared statements yoki ORM parametrlashdan foydalaning",
        });
      }

      // Exposed secrets detection
      const secretPatterns = [
        { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, name: "API Key" },
        { pattern: /password\s*=\s*['"][^'"]+['"]/i, name: "Password" },
        { pattern: /secret\s*=\s*['"][^'"]+['"]/i, name: "Secret" },
        { pattern: /token\s*=\s*['"][^'"]+['"]/i, name: "Token" },
        { pattern: /sk-[a-zA-Z0-9]{20,}/, name: "Secret Key" },
      ];
      for (const sp of secretPatterns) {
        if (sp.pattern.test(code)) {
          results.push({
            id:
              Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            severity: "CRITICAL",
            category: "Exposed Secret",
            title: `${sp.name} kodi ochiq qolgan`,
            description: `Kodda ${sp.name} to'g'ridan-to'g'ri yozilgan`,
            location: "Kod ichida",
            recommendation: `Secretlarni environment variables orqali saqlang`,
          });
        }
      }

      // Unsafe dependencies
      if (/require\(['"]http['"]\)|fetch\(['"]http:\/\//i.test(code)) {
        results.push({
          id: Date.now().toString(36) + "3",
          severity: "MEDIUM",
          category: "Insecure Connection",
          title: "Xavfsiz bo'lmagan HTTP ulanish",
          description: "HTTP orqali ma'lumot uzatilmoqda",
          location: "Network so'rov",
          recommendation: "HTTPS protokolidan foydalaning",
        });
      }

      // Dangerous commands
      if (/exec\(|system\(|child_process|rm\s+-rf|eval\(/i.test(code)) {
        results.push({
          id: Date.now().toString(36) + "4",
          severity: "HIGH",
          category: "Dangerous Command",
          title: "Xavfli buyruq bajarilishi",
          description: "Kod tizim buyruqlarini bajarishi mumkin",
          location: "Shell buyrug'i",
          recommendation:
            "Foydalanuvchi kiritgan ma'lumotlarni shell buyruqlarida ishlatmang",
        });
      }

      // Insecure auth
      if (/localStorage.*password|sessionStorage.*token/i.test(code)) {
        results.push({
          id: Date.now().toString(36) + "5",
          severity: "MEDIUM",
          category: "Insecure Storage",
          title: "Xavfsiz saqlash",
          description:
            "Maxfiy ma'lumotlar localStorage/sessionStorage'da saqlanmoqda",
          location: "Storage",
          recommendation: "Maxfiy ma'lumotlarni serverda saqlang",
        });
      }

      setFindings(results);
      const severityWeights: Record<string, number> = {
        CRITICAL: 25,
        HIGH: 15,
        MEDIUM: 8,
        LOW: 3,
      };
      const totalPenalty = results.reduce(
        (sum, f) => sum + (severityWeights[f.severity] || 0),
        0,
      );
      setScore(Math.max(0, 100 - totalPenalty));

      // Save report
      const report: SecurityReport = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        userId,
        target: "Kod tahlili",
        findings: results,
        score: Math.max(0, 100 - totalPenalty),
        createdAt: Date.now(),
      };
      dbService.saveSecurityReport(report);
      loadHistory();
      setScanning(false);
    }, 1500);
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "red";
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "yellow";
      case "LOW":
        return "blue";
      default:
        return "slate";
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Security Scanner"
          title="🔐 Xavfsizlik Skanyeri"
          description="Kod va loyihalaringizni xavfsizlik uchun tekshiring"
        />

        <Card>
          <div className="space-y-4">
            <TextArea
              value={code}
              onChange={setCode}
              placeholder="Tekshirish uchun kodni joylashtiring..."
              rows={8}
            />
            <Button
              onClick={scanCode}
              disabled={scanning || !code.trim()}
              className="w-full"
            >
              {scanning
                ? "🔍 Skanyerlanmoqda..."
                : "🔍 Xavfsizlikni tekshirish"}
            </Button>
          </div>
        </Card>

        {scanning && <LoadingSkeleton count={3} />}

        {findings.length > 0 && !scanning && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">
                  Xavfsizlik hisoboti
                </h3>
                <div className="flex items-center gap-2">
                  <Badge
                    color={
                      score >= 80 ? "green" : score >= 50 ? "yellow" : "red"
                    }
                  >
                    Ball: {score}/100
                  </Badge>
                </div>
              </div>
            </Card>

            {findings.map((finding) => (
              <Card key={finding.id} className="border-white/10">
                <div className="flex items-start gap-3">
                  <Badge color={severityColor(finding.severity) as any}>
                    {finding.severity}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-white">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {finding.description}
                    </p>
                    {finding.location && (
                      <p className="text-xs text-slate-500 mt-1">
                        📍 {finding.location}
                      </p>
                    )}
                    <p className="text-xs text-emerald-300 mt-2">
                      💡 {finding.recommendation}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {findings.length === 0 && !scanning && code && (
          <Card className="border-emerald-500/30">
            <p className="text-sm text-emerald-300 font-bold">
              ✅ Xavfsizlik tekshiruvi o'tdi! Xavfli kod topilmadi.
            </p>
          </Card>
        )}

        {!code && !scanning && findings.length === 0 && (
          <EmptyState
            icon="🔐"
            title="Kodni tekshiring"
            description="Kodni joylashtiring va AI xavfsizlik skanyeri XSS, SQL injection, ochiq secretlar va boshqa xavflarni aniqlaydi."
          />
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white">
              📋 Tekshiruv tarixi
            </h3>
            {history.slice(0, 5).map((report) => (
              <Card
                key={report.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">
                      {report.target}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(report.createdAt).toLocaleString()} •{" "}
                      {report.findings.length} xavf
                    </p>
                  </div>
                  <Badge
                    color={
                      report.score >= 80
                        ? "green"
                        : report.score >= 50
                          ? "yellow"
                          : "red"
                    }
                  >
                    {report.score}/100
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
