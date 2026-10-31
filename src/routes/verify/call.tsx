import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, PhoneOff, ShieldAlert, AlertTriangle, Activity, Mic, Volume2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { getApiBaseUrl } from "@/lib/api/config";

export const Route = createFileRoute("/verify/call")({
  head: () => ({
    meta: [
      { title: "Live Call Scam Monitor — AI-Content Verification Hub" },
      { name: "description", content: "Real-time voice call scam monitoring, OTP theft detection, and voice clone analysis." },
    ],
  }),
  component: LiveCallMonitorPage,
});

const SIMULATED_TRANSCRIPT_STEPS = [
  "Hello? Is this Mr. Smith?",
  "This is Officer Davis from the Bank Fraud Department.",
  "We detected suspicious wire transfers on your checking account right now.",
  "Your account will be frozen immediately unless you verify your identity.",
  "Please read me the 6-digit OTP verification code sent to your mobile phone to cancel the transfer.",
];

function LiveCallMonitorPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [scamScore, setScamScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState("SAFE");
  const [flaggedCats, setFlaggedCats] = useState<string[]>([]);
  const [actionDesc, setActionDesc] = useState("Call offline. Click 'Start Live Call Monitor' to begin real-time protection.");
  const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const startLiveCall = async () => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/call/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caller_label: "Incoming Unknown Call (+1-800-BANK)" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setIsCalling(true);
        setScamScore(0);
        setRiskLevel("SAFE");
        setFlaggedCats([]);
        setTranscriptChunks([]);
        setStepIndex(0);
        setActionDesc("Live call connected. Analyzing real-time speech transcript & acoustic stream...");
      }
    } catch (err) {
      console.error("Start call failed:", err);
    }
  };

  const pushNextChunk = async () => {
    if (!sessionId || stepIndex >= SIMULATED_TRANSCRIPT_STEPS.length) return;

    const nextChunk = SIMULATED_TRANSCRIPT_STEPS[stepIndex];
    setTranscriptChunks((prev) => [...prev, nextChunk]);
    setStepIndex((idx) => idx + 1);

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/call/chunk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          transcript_chunk: nextChunk,
          synthetic_voice_prob: stepIndex >= 3 ? 0.75 : 0.15,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScamScore(data.scam_score);
        setRiskLevel(data.risk_level);
        setFlaggedCats(data.flagged_categories || []);
        setActionDesc(data.recommended_action);
      }
    } catch (err) {
      console.error("Chunk processing failed:", err);
    }
  };

  const endLiveCall = async () => {
    if (!sessionId) return;
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/call/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsCalling(false);
        setSessionId(null);
        navigate({ to: "/results/$id", params: { id: data.id } });
      }
    } catch (err) {
      console.error("End call failed:", err);
    }
  };

  return (
    <DashboardShell
      eyebrow="// REAL-TIME MONITORING"
      title="Live Voice Call Scam Monitor"
    >
      <div className="space-y-8">
        {/* TOP STATUS BAR */}
        <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isCalling ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-cyan-500/20 text-cyan-400"}`}>
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">
                  {isCalling ? "ACTIVE LIVE VOICE CALL MONITORING" : "MONITORING IDLE"}
                </h3>
                <p className="mono-label text-xs text-muted-foreground">
                  {sessionId ? `SESSION ID: ${sessionId}` : "STANDBY · READY TO MONITOR"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isCalling ? (
                <MagneticButton onClick={startLiveCall}>
                  <Phone className="h-4 w-4" /> Start Live Call Monitor
                </MagneticButton>
              ) : (
                <MagneticButton variant="outline" className="border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30" onClick={endLiveCall}>
                  <PhoneOff className="h-4 w-4" /> End Call & View Report
                </MagneticButton>
              )}
            </div>
          </div>

          {/* REAL-TIME SCAM RISK METER */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/50 p-6 text-center">
              <span className="mono-label text-xs">// REAL-TIME SCAM SCORE</span>
              <span
                className={`mt-2 font-display text-5xl font-extrabold ${
                  scamScore >= 70
                    ? "text-red-500"
                    : scamScore >= 40
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {scamScore} / 100
              </span>
              <span className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                RISK: {riskLevel}
              </span>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between rounded-2xl border border-border/80 bg-background/50 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`h-5 w-5 ${scamScore >= 70 ? "text-red-500 animate-bounce" : "text-amber-400"}`} />
                  <span className="font-mono text-xs font-bold uppercase text-primary-glow">
                    RECOMMENDED SAFETY ACTION
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm text-foreground leading-relaxed">
                  {actionDesc}
                </p>
              </div>

              {flaggedCats.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="mono-label text-[10px] text-muted-foreground">FLAGGED PATTERNS:</span>
                  {flaggedCats.map((cat) => (
                    <span key={cat} className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 font-mono text-[10px] text-red-400 font-bold uppercase">
                      ⚠️ {cat.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIVE TRANSCRIPT FEED & CHUNK SIMULATOR */}
        <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                Live Call Speech Stream & Transcript
              </h2>
            </div>
            {isCalling && stepIndex < SIMULATED_TRANSCRIPT_STEPS.length && (
              <button
                onClick={pushNextChunk}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-mono text-xs text-cyan-300 hover:bg-cyan-400/20"
              >
                Simulate Next Speech Chunk <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3 font-mono text-sm">
            {transcriptChunks.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-10">
                {isCalling
                  ? "Listening to live speech stream... Click 'Simulate Next Speech Chunk' to inject incoming audio speech."
                  : "No active transcript stream. Click 'Start Live Call Monitor' above."}
              </p>
            ) : (
              transcriptChunks.map((chunk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-2xl border p-4 ${
                    chunk.toLowerCase().includes("otp") || chunk.toLowerCase().includes("fraud")
                      ? "border-red-500/50 bg-red-500/10 text-red-300"
                      : "border-border/70 bg-background/40 text-foreground"
                  }`}
                >
                  <span className="text-xs text-muted-foreground font-bold mr-3">[CALLER CHUNK #{i + 1}]</span>
                  {chunk}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
