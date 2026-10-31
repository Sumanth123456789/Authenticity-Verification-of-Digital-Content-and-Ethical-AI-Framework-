import { useState, useEffect } from "react";
import { checkBackendHealth, getApiBaseUrl, type HealthCheckResult } from "@/lib/api/config";
import { openBackendSettings } from "./BackendSettingsModal";
import { Activity, Server } from "lucide-react";

export function BackendStatusIndicator() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth({
        ok: false,
        status: "disconnected",
        latencyMs: 0,
        url: getApiBaseUrl(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();

    const handleUrlChange = () => {
      check();
    };

    window.addEventListener("aicv_backend_url_changed", handleUrlChange);
    return () => {
      window.removeEventListener("aicv_backend_url_changed", handleUrlChange);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={openBackendSettings}
      title="Click to configure Backend API URL"
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/40 px-2.5 py-1 text-[11px] font-mono transition-colors hover:border-primary/60 hover:bg-surface/80"
    >
      <span className="relative flex h-2 w-2">
        {loading ? (
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        ) : health?.ok ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </>
        ) : health?.status === "sleeping" ? (
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        )}
      </span>

      <span className="hidden sm:inline text-muted-foreground">
        {loading
          ? "CHECKING API..."
          : health?.ok
          ? `API ${health.latencyMs}ms`
          : health?.status === "sleeping"
          ? "API WAKING..."
          : "API OFFLINE"}
      </span>

      <Server className="h-3 w-3 text-muted-foreground ml-0.5" />
    </button>
  );
}
