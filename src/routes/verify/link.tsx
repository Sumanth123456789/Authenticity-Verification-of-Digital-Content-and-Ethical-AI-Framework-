import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link2, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";

export const Route = createFileRoute("/verify/link")({
  head: () => ({
    meta: [
      { title: "Link & Domain Reputation Radar — AI-Content Verification Hub" },
      { name: "description", content: "Analyze URLs for typosquatting, homographs, IP-literal hosts, and phishing." },
    ],
  }),
  component: LinkAnalyzerPage,
});

const API_BASE = "http://localhost:8000";

function LinkAnalyzerPage() {
  const navigate = useNavigate();
  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!inputUrl.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/verify/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        navigate({ to: "/results/$id", params: { id: data.id } });
      }
    } catch (err) {
      console.error("Link verification error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / LINK REPUTATION"
      title="Link Security & Typosquatting Radar"
    >
      <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Link2 className="h-5 w-5 text-cyan-400" />
          <h2 className="font-display text-xl font-bold uppercase">URL Domain Security Scan</h2>
        </div>

        <p className="mt-3 font-mono text-xs text-amber-300">
          ⚠ Safe Sandbox Inspection: URLs are never automatically opened or executed on your device.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste suspicious URL or domain (e.g. http://paypaI.com/login/verify)..."
            className="w-full rounded-2xl border border-border bg-background/60 p-4 font-mono text-sm text-foreground focus:border-cyan-400 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="mono-label text-xs text-muted-foreground">
              CHECKS: Typosquatting Homographs · IP-Literals · Suspicious TLDs · Path Keywords
            </span>

            <MagneticButton onClick={handleVerify} disabled={isSubmitting || !inputUrl.trim()}>
              {isSubmitting ? "Scanning Domain..." : "Scan URL"} <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
