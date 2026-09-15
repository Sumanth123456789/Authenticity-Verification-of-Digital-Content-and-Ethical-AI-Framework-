import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Search, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";

export const Route = createFileRoute("/verify/text")({
  head: () => ({
    meta: [
      { title: "Text & Claim Analyzer — AI-Content Verification Hub" },
      { name: "description", content: "Detect AI-generated text, phishing patterns, and verify factual claims." },
    ],
  }),
  component: TextAnalyzerPage,
});

const API_BASE = "http://localhost:8000";

function TextAnalyzerPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"text" | "claim">("text");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!inputText.trim()) return;
    setIsSubmitting(true);

    try {
      const endpoint = mode === "claim" ? `${API_BASE}/api/v1/verify/claim` : `${API_BASE}/api/v1/verify/text`;
      const body = mode === "claim" ? { claim: inputText } : { text: inputText };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        navigate({ to: "/results/$id", params: { id: data.id } });
      }
    } catch (err) {
      console.error("Text verification error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / TEXT & CLAIM"
      title="Text & Claim Verification Engine"
    >
      <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <h2 className="font-display text-xl font-bold uppercase">Multi-Vector Text Verification</h2>
          </div>

          <div className="flex gap-2 font-mono text-xs">
            <button
              onClick={() => setMode("text")}
              className={`rounded-full px-3 py-1 border transition-all ${mode === "text" ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold" : "border-border text-muted-foreground"}`}
            >
              Text & Phishing Scan
            </button>
            <button
              onClick={() => setMode("claim")}
              className={`rounded-full px-3 py-1 border transition-all ${mode === "claim" ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold" : "border-border text-muted-foreground"}`}
            >
              Fact-Check Claim
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "claim"
                ? "Enter factual claim to verify (e.g. 'COVID-19 vaccines alter human DNA')..."
                : "Paste suspicious text message, email snippet, or article text to scan for AI burstiness & phishing traps..."
            }
            rows={6}
            className="w-full rounded-2xl border border-border bg-background/60 p-4 font-mono text-sm text-foreground focus:border-cyan-400 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="mono-label text-xs text-muted-foreground">
              {mode === "claim" ? "VERIFICATION METHOD: Authoritative Consensus Lookup" : "VERIFICATION METHOD: Linguistic Burstiness & Phishing Regex"}
            </span>

            <MagneticButton onClick={handleVerify} disabled={isSubmitting || !inputText.trim()}>
              {isSubmitting ? "Analyzing..." : "Verify Text"} <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
