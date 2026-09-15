import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Activity, ScanLine, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { NumberCounter } from "@/components/effects/NumberCounter";
import { MOCK_DETECTIONS } from "@/lib/mock/data";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Console — AI-Content Verification Hub" },
      { name: "description", content: "AI-Content Verification Hub — verification console overview." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState({
    total_analyses: 1284,
    authentic_pct: 78.4,
    manipulated_pct: 14.2,
    avg_latency_ms: 782,
  });
  const [recentDetections, setRecentDetections] = useState(MOCK_DETECTIONS.slice(0, 5));

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const statsData = await apiClient.get<any>("/api/v1/dashboard/stats");
        if (statsData) {
          const total = statsData.total_analyses || 1284;
          const suspicious = statsData.suspicious_detections || 0;
          const highRisk = statsData.high_risk_detections || 0;

          const manipulated_pct = total > 0 ? Number(((highRisk / total) * 100).toFixed(1)) : 14.2;
          const authentic_pct = total > 0 ? Number((((total - highRisk - suspicious) / total) * 100).toFixed(1)) : 78.4;

          setStats({
            total_analyses: total,
            authentic_pct: Math.max(0, authentic_pct),
            manipulated_pct: Math.max(0, manipulated_pct),
            avg_latency_ms: statsData.average_processing_time_ms || 782,
          });
        }
      } catch (err) {
        console.warn("Could not fetch live dashboard stats, using cached view:", err);
      }

      try {
        const historyData = await apiClient.get<any>("/api/v1/history?limit=5");
        const items = historyData?.items || historyData;
        if (Array.isArray(items) && items.length > 0) {
          const mapped = items.map((item: any) => ({
            id: item.id,
            filename: item.filename,
            type: (item.analysis_type || "image").toLowerCase(),
            verdict: (item.verdict || "authentic").toLowerCase(),
            riskLevel: (item.risk_level || "low").toLowerCase(),
            riskScore: item.risk_score || 0,
            confidence: Math.round((item.confidence || 0.9) * 100),
            scannedBy: item.model_used || "FastAPI Pipeline",
            createdAt: item.created_at || new Date().toISOString(),
            signals: (item.signals || []).map((s: any) => ({
              label: s.label || s.signal || "Detector",
              score: Math.round((s.confidence || s.score || 0.5) * 100),
            })),
            size: item.file_size_bytes
              ? `${(item.file_size_bytes / 1024 / 1024).toFixed(2)} MB`
              : "1.2 MB",
          }));
          setRecentDetections(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch live recent activity, using cached list:", err);
      }
    }

    loadDashboardData();
  }, []);

  const statCards = [
    { label: "Total Scans", value: stats.total_analyses, suffix: "", icon: ScanLine, trend: "LIVE DB" },
    { label: "Authentic", value: stats.authentic_pct, suffix: "%", decimals: 1, icon: ShieldCheck, trend: "SAFE" },
    { label: "Manipulated", value: stats.manipulated_pct, suffix: "%", decimals: 1, icon: AlertTriangle, trend: "ALERT" },
    { label: "Avg latency", value: stats.avg_latency_ms, suffix: "ms", icon: Clock, trend: "-42ms" },
  ];

  return (
    <DashboardShell
      eyebrow="// CONSOLE / OVERVIEW"
      title="Signals, live."
      actions={
        <Link to="/verify">
          <MagneticButton>
            New scan <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="brutal-border rounded-2xl bg-surface/50 p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary-glow" />
                <span className="mono-label text-primary-glow">{s.trend}</span>
              </div>
              <p className="mt-6 font-display text-4xl font-bold">
                <NumberCounter value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mono-label mt-2">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="brutal-border rounded-2xl bg-surface/50 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="mono-label">// RECENT ACTIVITY</p>
            <Link to="/history" className="mono-label text-primary-glow">View all</Link>
          </div>
          <div className="mt-6 divide-y divide-border">
            {recentDetections.map((d: any) => (
              <Link
                key={d.id}
                to="/results/$id"
                params={{ id: d.id }}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface"
                data-cursor="hover"
                data-cursor-label="VIEW"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm">{d.filename}</p>
                  <p className="mono-label mt-1">{d.type.toUpperCase()} · {d.size} · {d.id}</p>
                </div>
                <VerdictPill verdict={d.verdict} confidence={d.confidence} />
              </Link>
            ))}
          </div>
        </div>

        <div className="brutal-border rounded-2xl bg-surface/50 p-6">
          <div className="flex items-center justify-between">
            <p className="mono-label">// LIVE FEED</p>
            <span className="flex items-center gap-2 text-xs text-primary-glow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-glow" /> LIVE
            </span>
          </div>
          <ul className="mt-6 space-y-3 font-mono text-xs">
            {[
              "12:42:03 · scan queued · anon-42",
              "12:41:58 · verdict · manipulated (0.94)",
              "12:41:41 · scan started · img/9a1e",
              "12:41:20 · verdict · authentic (0.12)",
              "12:40:59 · webhook · newsroom.io",
              "12:40:42 · scan started · vid/3f8b",
              "12:40:18 · verdict · suspicious (0.68)",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-3 w-3 text-primary-glow" /> {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}


function VerdictPill({ verdict, confidence }: { verdict: string; confidence: number }) {
  const styles: Record<string, string> = {
    authentic: "border-cyan-edge/60 text-cyan-edge",
    suspicious: "border-primary/70 text-primary-glow",
    manipulated: "border-destructive/70 text-destructive",
  };
  return (
    <span className={cn("shrink-0 rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-widest", styles[verdict])}>
      {verdict} · {confidence}%
    </span>
  );
}