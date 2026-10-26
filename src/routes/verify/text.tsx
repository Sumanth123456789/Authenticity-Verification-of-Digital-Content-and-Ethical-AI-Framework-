import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, ShieldCheck, AlertTriangle, ArrowRight, Sparkles, Loader2, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/verify/text")({
  head: () => ({
    meta: [
      { title: "Text & Claim Analyzer — AI-Content Verification Hub" },
      { name: "description", content: "Detect AI-generated text, phishing patterns, and verify factual claims." },
    ],
  }),
  component: TextAnalyzerPage,
});

const PRESET_CLAIMS = [
  {
    mode: "claim",
    label: "Viral Health Claim",
    text: "COVID-19 vaccines alter human DNA and contain microchips for tracking.",
  },
  {
    mode: "claim",
    label: "Political Rumor",
    text: "The moon landing in 1969 was filmed in a Hollywood soundstage directed by Stanley Kubrick.",
  },
  {
    mode: "text",
    label: "Phishing Scam Email",
    text: "URGENT SECURITY NOTICE: Your bank account #4920 has been temporarily suspended. Click http://secure-bank-login-update.com/login to verify your credentials immediately or your funds will be locked!",
  },
];

export function TextAnalyzerPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"text" | "claim">("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleVerify = async () => {
    if (!inputText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 25));
    }, 120);

    try {
      const endpoint = mode === "claim" ? "/api/v1/verify/claim" : "/api/v1/verify/text";
      const body = mode === "claim" ? { claim: inputText } : { text: inputText };

      const data = await apiClient.post<any>(endpoint, body);
      clearInterval(interval);
      setProgress(100);

      toast.success(`${mode === "claim" ? "Claim Verification" : "Text Scan"} Complete!`);
      setTimeout(() => {
        navigate({ to: "/results/$id", params: { id: data.id } });
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Text verification error:", err);
      toast.error(err.message || "Failed to verify text.");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / TEXT & CLAIM"
      title="Text & Claim Verification Engine"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div>
              <p className="font-medium text-cyan-300">Multi-Vector Linguistic & Fact-Check Pipeline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluates perplexity, burstiness, phishing URL heuristics, and queries authoritative fact-checking databases (Google Fact Check, PolitiFact, Snopes).
              </p>
            </div>
          </div>
        </div>

        <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display text-xl font-bold uppercase">Multi-Vector Text Verification</h2>
            </div>

            <div className="flex gap-2 font-mono text-xs">
              <button
                onClick={() => setMode("text")}
                className={`rounded-full px-4 py-1.5 border transition-all ${
                  mode === "text"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Text & Phishing Scan
              </button>
              <button
                onClick={() => setMode("claim")}
                className={`rounded-full px-4 py-1.5 border transition-all ${
                  mode === "claim"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Fact-Check Claim
              </button>
            </div>
          </div>

          {/* Presets Bar */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs">
            <span className="shrink-0 text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Presets:
            </span>
            {PRESET_CLAIMS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMode(preset.mode as any);
                  setInputText(preset.text);
                }}
                className="shrink-0 rounded-full border border-border/80 bg-background/50 px-3 py-1 text-muted-foreground hover:border-cyan-400 hover:text-cyan-300 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "claim"
                  ? "Enter factual claim to verify (e.g. 'COVID-19 vaccines alter human DNA')..."
                  : "Paste suspicious text message, email snippet, or article text to scan for AI burstiness & phishing traps..."
              }
              rows={6}
              className="w-full rounded-2xl border border-border bg-background/60 p-4 font-mono text-sm text-foreground focus:border-cyan-400 focus:outline-none shadow-inner"
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="mono-label text-xs text-muted-foreground">
                {mode === "claim"
                  ? "VERIFICATION METHOD: Authoritative Fact Consensus API"
                  : "VERIFICATION METHOD: Linguistic Burstiness & Phishing Regex"}
              </span>

              <MagneticButton onClick={handleVerify} disabled={isSubmitting || !inputText.trim()}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" /> Verify {mode === "claim" ? "Claim" : "Text"} →
                  </span>
                )}
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
