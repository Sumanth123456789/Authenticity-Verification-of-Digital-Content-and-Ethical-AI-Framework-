import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, RefreshCw, AlertCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MOCK_DETECTIONS, type Detection } from "@/lib/mock/data";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — AI-Content Verification Hub" },
      { name: "description", content: "Every scan you've run, filterable." },
    ],
  }),
  component: HistoryPage,
});

const filters = ["all", "image", "video", "audio", "text"] as const;

interface APIAnalysisItem {
  id: string;
  filename: string;
  analysis_type: string;
  verdict: string;
  risk_level: string;
  risk_score: number;
  confidence: number;
  model_used: string;
  file_size_bytes?: number;
  processing_time_ms?: number;
  explanation?: string;
  created_at: string;
  signals?: Array<{ label: string; score: number }>;
}

function HistoryPage() {
  const [type, setType] = useState<(typeof filters)[number]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiItems, setApiItems] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<any>("/api/v1/history?limit=50");
        const items: APIAnalysisItem[] = data.items || data;
        
        if (Array.isArray(items) && items.length > 0) {
          const mapped: Detection[] = items.map((item) => ({
            id: item.id,
            filename: item.filename,
            type: (item.analysis_type || "image").toLowerCase() as any,
            verdict: (item.verdict || "authentic").toLowerCase() as any,
            riskLevel: (item.risk_level || "low").toLowerCase() as any,
            riskScore: item.risk_score || 0,
            confidence: Math.round((item.confidence || 0.9) * 100),
            scannedBy: item.model_used || "google/vit-base-patch16-224",
            createdAt: item.created_at || new Date().toISOString(),
            size: item.file_size_bytes
              ? `${(item.file_size_bytes / 1024 / 1024).toFixed(2)} MB`
              : "1.2 MB",
            signals: (item.signals || []).map((s) => ({
              label: s.label,
              score: Math.round((s.score || 0.5) * 100),
            })),
          }));

          setApiItems(mapped);
          setIsLive(true);
        }
      } catch (err) {
        console.warn("Could not connect to live API history endpoint, falling back to cached view:", err);
      } finally {

        setIsLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const combinedList = useMemo(() => {
    const list = apiItems.length > 0 ? apiItems : MOCK_DETECTIONS;
    return type === "all" ? list : list.filter((d) => d.type === type);
  }, [apiItems, type]);

  return (
    <DashboardShell eyebrow="// CONSOLE / HISTORY" title="Every scan you've run.">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setType(f)}
              data-cursor="hover"
              className={cn(
                "rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors",
                type === f
                  ? "border-primary bg-primary/15 text-primary-glow"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
          ) : isLive ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE DATABASE CONNECTED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              OFFLINE DEMO MODE
            </span>
          )}
        </div>
      </div>

      <div className="brutal-border overflow-hidden rounded-2xl bg-surface/50">
        <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 mono-label">
          <span className="col-span-5">ASSET</span>
          <span className="col-span-2">TYPE</span>
          <span className="col-span-2">VERDICT</span>
          <span className="col-span-2">CONFIDENCE</span>
          <span className="col-span-1"></span>
        </div>
        {combinedList.map((d) => (
          <Row
            key={d.id}
            d={d}
            open={expanded === d.id}
            onToggle={() => setExpanded((e) => (e === d.id ? null : d.id))}
          />
        ))}
        {combinedList.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">Nothing matches.</p>
        )}
      </div>
    </DashboardShell>
  );
}

function Row({ d, open, onToggle }: { d: Detection; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-none">
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-12 items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
        data-cursor="hover"
      >
        <span className="col-span-5 min-w-0 truncate font-mono text-sm">{d.filename}</span>
        <span className="col-span-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {d.type}
        </span>
        <span
          className={cn(
            "col-span-2 font-mono text-xs uppercase tracking-widest",
            d.verdict === "authentic"
              ? "text-cyan-edge"
              : d.verdict === "manipulated"
                ? "text-destructive"
                : "text-primary-glow",
          )}
        >
          {d.verdict}
        </span>
        <span className="col-span-2 font-display text-lg font-bold">{d.confidence}%</span>
        <span className="col-span-1 flex justify-end">
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-6 border-t border-border bg-background/40 px-6 py-6 md:grid-cols-3">
          <dl className="space-y-2 text-sm">
            <MetaRow k="ID" v={d.id} />
            <MetaRow k="Size" v={d.size} />
            <MetaRow k="Model" v={d.scannedBy} />
            <MetaRow k="Scanned" v={new Date(d.createdAt).toLocaleString()} />
          </dl>
          <div className="md:col-span-2">
            <p className="mono-label">// SIGNALS</p>
            <ul className="mt-3 space-y-2">
              {d.signals.map((s) => (
                <li key={s.label}>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span>{s.label}</span>
                    <span>{s.score}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full bg-primary-glow" style={{ width: `${Math.min(100, s.score)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/results/$id"
              params={{ id: d.id }}
              className="mono-label mt-6 inline-block text-primary-glow"
            >
              Open full report →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <dt className="mono-label">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </div>
  );
}