import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  checkBackendHealth,
  isCustomApiUrl,
  type HealthCheckResult,
} from "@/lib/api/config";
import { toast } from "sonner";
import {
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

export const EVENT_OPEN_BACKEND_SETTINGS = "open_backend_settings";

export function openBackendSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN_BACKEND_SETTINGS));
  }
}

interface BackendSettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BackendSettingsModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: BackendSettingsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [inputUrl, setInputUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);

  // Sync internal state when opened or when global open event fires
  useEffect(() => {
    const handleGlobalOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener(EVENT_OPEN_BACKEND_SETTINGS, handleGlobalOpen);
    return () => {
      window.removeEventListener(EVENT_OPEN_BACKEND_SETTINGS, handleGlobalOpen);
    };
  }, [setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      const current = getApiBaseUrl();
      setInputUrl(current);
      runHealthCheck(current);
    }
  }, [isOpen]);

  const runHealthCheck = async (urlToCheck?: string) => {
    setChecking(true);
    try {
      const result = await checkBackendHealth(urlToCheck);
      setHealth(result);
    } catch {
      setHealth({
        ok: false,
        status: "disconnected",
        latencyMs: 0,
        url: urlToCheck || "",
        error: "Failed to connect",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    setApiBaseUrl(inputUrl);
    toast.success("Backend URL updated successfully");
    await runHealthCheck(inputUrl);
  };

  const handleReset = async () => {
    resetApiBaseUrl();
    const def = getApiBaseUrl();
    setInputUrl(def);
    toast.info("Backend URL reset to default");
    await runHealthCheck(def);
  };

  const handlePreset = (url: string) => {
    setInputUrl(url);
    runHealthCheck(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg border border-border/80 bg-background/95 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary bg-primary/10">
              <Server className="h-4 w-4 text-primary-glow" />
            </span>
            <DialogTitle className="font-display text-lg">Backend API Configuration</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure the FastAPI backend server URL dynamically. Changes take effect immediately without redeployment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Connection Status Card */}
          <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[10px] text-muted-foreground">// CONNECTION STATUS</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => runHealthCheck(inputUrl)}
                disabled={checking}
              >
                <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin text-primary-glow" : ""}`} />
                {checking ? "Checking..." : "Test"}
              </Button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {checking ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-mono">Pinging backend...</span>
                </div>
              ) : health?.ok ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-mono font-medium">
                    Connected ({health.latencyMs}ms)
                  </span>
                </div>
              ) : health?.status === "sleeping" ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-mono font-medium">
                    Render Server Waking Up (~30-50s)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-mono font-medium">Disconnected</span>
                </div>
              )}
            </div>

            {health && !health.ok && health.error && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {health.error}
              </p>
            )}

            {health?.details?.service && (
              <p className="mt-1 font-mono text-[10px] text-emerald-400/80">
                Service: {health.details.service} (v{health.details.version || "1.0.0"})
              </p>
            )}
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            <label className="mono-label text-xs">BACKEND URL</label>
            <div className="flex gap-2">
              <Input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://your-backend.onrender.com or http://localhost:8000"
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={handleSave}
                className="shrink-0"
              >
                Apply
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Leave blank to use relative Vercel proxy rewrite (<code>/api</code>).
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="mono-label text-[10px] text-muted-foreground">// QUICK PRESETS</span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-mono"
                onClick={() => handlePreset("")}
              >
                Vercel Proxy (/api)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-mono"
                onClick={() => handlePreset("https://aicvhub-backend.onrender.com")}
              >
                Render Backend
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-mono"
                onClick={() => handlePreset("http://localhost:8000")}
              >
                Localhost:8000
              </Button>
            </div>
          </div>

          {/* Render Sleep Notice */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-300/80">
            <strong>Note for Render Free Tier:</strong> Free services spin down after 15 minutes of inactivity. When woken up, the initial request can take 30–50 seconds before responding.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Default
          </Button>
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
