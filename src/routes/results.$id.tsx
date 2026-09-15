import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Share2, AlertTriangle, ShieldCheck, Activity, Cpu, FileSearch, Info, HelpCircle, Film, Volume2, VolumeX, Clock, Mic, MessageSquare, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/results/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Result ${params.id} — AI-Content Verification Hub` },
      { name: "description", content: "Multi-signal forensic verification result." },
    ],
  }),
  component: ResultsPage,
});

interface AnalysisRecordDetail {
  id: string;
  filename: string;
  analysis_type?: string;
  verdict: string;
  risk_level: string;
  risk_score: number;
  confidence: number;
  synthetic_voice_probability?: number;
  provider: string;
  model_used: string;
  is_demo: boolean;
  processing_time_ms?: number;
  sources?: Array<{
    publisher: string;
    publisher_site?: string;
    url: string;
    title: string;
    publication_date?: string;
    textual_rating: string;
  }>;
  factors?: Array<{ signal: string; contribution_pct: number; score: number }>;
  timeline_markers?: Array<{
    frame_number: number;
    timestamp: number;
    risk_score: number;
    verdict: string;
    top_label?: string;
    explanation?: string;
  }>;
  transcription?: {
    full_text?: string;
    language?: string;
    language_probability?: number;
    segments?: Array<{ start: number; end: number; text: string }>;
  };
  signals?: Array<{
    signal: string;
    value: any;
    severity: string;
    confidence: number;
    description: string;
    limitations: string;
  }>;
  metadata?: any;
  explanation?: string;
  limitations?: string;
  heuristic_disclaimer?: string;
  created_at?: string;
}

function ResultsPage() {
  const { id } = Route.useParams();
  const [record, setRecord] = useState<AnalysisRecordDetail | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      setIsLoading(true);
      try {
        const data = await apiClient.get<any>(`/api/v1/history/${id}`);
        if (data) {
          const extra = data.extra_data || {};
          
          setRecord({
            id: data.id,
            filename: data.filename,
            analysis_type: (data.analysis_type || "image").toLowerCase(),
            verdict: (data.verdict || "authentic").toLowerCase(),
            risk_level: (data.risk_level || "LOW").toUpperCase(),
            risk_score: data.risk_score ?? 10,
            confidence: data.confidence ?? 0.85,
            synthetic_voice_probability: extra.synthetic_voice_probability,
            provider: extra.provider || "demo",
            model_used: data.model_used || "demo-vit-classifier",
            is_demo: extra.is_demo ?? true,
            processing_time_ms: data.processing_time_ms,
            factors: extra.factors || [],
            timeline_markers: extra.timeline_markers || [],
            transcription: extra.transcription,
            signals: data.signals || [],
            metadata: extra.metadata || {},
            explanation: data.explanation || "No explanation recorded.",
            limitations: data.limitations || "Standard analysis limitations apply.",
            heuristic_disclaimer: extra.heuristic_disclaimer || "Initial heuristic weights — not scientifically validated.",
            created_at: data.created_at || new Date().toISOString(),
          });
          return;
        }

      } catch (err) {
        console.warn("Using fallback demo record:", err);
      } finally {
        setIsLoading(false);
      }

      // Offline Fallback Record
      setRecord({
        id,
        filename: "sample_audio.wav",
        analysis_type: "audio",
        verdict: "authentic",
        risk_level: "LOW",
        risk_score: 14,
        confidence: 0.88,
        synthetic_voice_probability: 0.14,
        provider: "whisper",
        model_used: "audio:whisper",
        is_demo: true,
        factors: [
          { signal: "spectral_flux_analysis", contribution_pct: 35, score: 10 },
          { signal: "pitch_contour_micro_tremors", contribution_pct: 35, score: 10 },
          { signal: "background_noise_floor", contribution_pct: 30, score: 10 },
        ],
        transcription: {
          full_text: "Sample speech stream verification transcript. Forensic acoustic signals analyzed across speech spectrum.",
          language: "en",
          language_probability: 0.98,
          segments: [
            { start: 0.0, end: 2.5, text: "Sample speech stream verification transcript." },
            { start: 2.5, end: 5.0, text: "Forensic acoustic signals analyzed across speech spectrum." },
          ],
        },
        metadata: {
          duration_seconds: 5.0,
          sample_rate_hz: 16000,
          channels: 1,
          bitrate: "256 kbps",
          audio_codec: "pcm_s16le",
        },
        signals: [
          {
            signal: "SPECTRAL_FLUX_ANALYSIS",
            value: { mean_spectral_flux: 0.04, centroid_variance: 220.5 },
            severity: "info",
            confidence: 0.82,
            description: "Normal acoustic spectral flux profile.",
            limitations: "Lossy compression can smooth high frequency flux.",
          },
          {
            signal: "PITCH_CONTOUR_ANALYSIS",
            value: { micro_jitter_hz: 3.4, mean_pitch_f0_hz: 145.0 },
            severity: "info",
            confidence: 0.85,
            description: "Natural human vocal micro-tremors detected.",
            limitations: "Robotic effects or auto-tune influence pitch metrics.",
          },
        ],
        explanation: "The audio stream received a low-risk score of 14/100 (LOW risk level). Analysis revealed natural human vocal tract dynamics.",
        limitations: "Synthetic voice clone probability is a statistical acoustic signal estimation, not definitive proof of synthetic voice synthesis.",
        heuristic_disclaimer: "Initial heuristic weights — not scientifically validated.",
      });
    }

    fetchRecord();
  }, [id]);

  if (isLoading || !record) {
    return (
      <DashboardShell eyebrow="// RESULT" title="Loading analysis...">
        <div className="flex h-64 items-center justify-center">
          <p className="font-mono text-sm text-muted-foreground animate-pulse">
            Fetching multi-signal forensic record...
          </p>
        </div>
      </DashboardShell>
    );
  }

  const d = record;
  const verdictLabel = d.verdict.toUpperCase();
  const isBad = d.verdict !== "authentic";
  const isVideo = d.analysis_type === "video" || (d.timeline_markers && d.timeline_markers.length > 0);
  const isAudio = d.analysis_type === "audio" || Boolean(d.synthetic_voice_probability !== undefined || d.transcription);

  return (
    <DashboardShell
      eyebrow={`// RESULT · ${d.id}`}
      title={d.filename}
      actions={
        <div className="flex gap-2">
          <MagneticButton variant="outline">
            <Share2 className="h-4 w-4" /> Share
          </MagneticButton>
          <MagneticButton
            onClick={() => {
              const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${d.id}-report.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" /> Export JSON
          </MagneticButton>
        </div>
      }
    >
      {/* Top Header & Demo Mode Badge */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/history"
          className="mono-label inline-flex items-center gap-2 hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to history
        </Link>

        {d.is_demo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> DEMO / SIMULATED ANALYSIS
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> REAL MODEL EVIDENCE
          </span>
        )}
      </div>

      {/* AUDIO STREAM METADATA BAR (If Audio Asset) */}
      {isAudio && (
        <div className="mb-8 brutal-border rounded-3xl bg-surface/50 p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-emerald-400" />
              <h3 className="mono-label text-sm text-emerald-300">// AUDIO STREAM METADATA</h3>
            </div>
            {d.synthetic_voice_probability !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-cyan-400 font-mono font-bold">
                SYNTHETIC VOICE PROB: {Math.round(d.synthetic_voice_probability * 100)}%
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4 font-mono">
            <div>
              <p className="mono-label">DURATION</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.duration_seconds || 5.0}s</p>
            </div>
            <div>
              <p className="mono-label">SAMPLE RATE</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.sample_rate_hz || 16000} Hz</p>
            </div>
            <div>
              <p className="mono-label">CHANNELS</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.channels === 1 ? "MONO (1ch)" : "STEREO (2ch)"}</p>
            </div>
            <div>
              <p className="mono-label">CODEC / FORMAT</p>
              <p className="mt-1 text-base font-bold text-foreground uppercase">{d.metadata?.audio_codec || "PCM WAV"}</p>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO CONTAINER METADATA BAR (If Video Asset) */}
      {isVideo && !isAudio && (
        <div className="mb-8 brutal-border rounded-3xl bg-surface/50 p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-cyan-400" />
              <h3 className="mono-label text-sm text-cyan-300">// VIDEO CONTAINER METADATA</h3>
            </div>
            {d.metadata?.audio_present ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                <Volume2 className="h-3.5 w-3.5" /> AUDIO TRACK PRESENT ({d.metadata?.audio_codec || "PCM"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono">
                <VolumeX className="h-3.5 w-3.5" /> NO AUDIO STREAM
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4 font-mono">
            <div>
              <p className="mono-label">DURATION</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.duration_seconds || 10.0}s</p>
            </div>
            <div>
              <p className="mono-label">RESOLUTION</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.resolution || "1920x1080"}</p>
            </div>
            <div>
              <p className="mono-label">FPS</p>
              <p className="mt-1 text-base font-bold text-foreground">{d.metadata?.fps || 30} FPS</p>
            </div>
            <div>
              <p className="mono-label">CODEC</p>
              <p className="mt-1 text-base font-bold text-foreground uppercase">{d.metadata?.video_codec || "H264"}</p>
            </div>
          </div>
        </div>
      )}

      {/* SPEECH TRANSCRIPTION CARD (If Audio Asset) */}
      {isAudio && d.transcription && (
        <div className="mb-8 brutal-border rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Speech-to-Text Transcript & Segments
            </h2>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background/60 p-5 font-mono">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs text-cyan-300 font-bold uppercase">
                TRANSCRIPTION ENGINE: {d.transcription.language ? `LANG [${d.transcription.language.toUpperCase()}]` : "WHISPER"}
              </span>
              <span className="text-[10px] text-muted-foreground">AUTO-TIMESTAMPED</span>
            </div>
            <p className="mt-3 text-sm text-foreground leading-relaxed italic">
              "{d.transcription.full_text}"
            </p>
          </div>

          {d.transcription.segments && d.transcription.segments.length > 0 && (
            <div className="mt-4 space-y-2 font-mono text-xs">
              {d.transcription.segments.map((seg, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/30 p-3">
                  <span className="shrink-0 font-bold text-primary-glow">
                    [{seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s]
                  </span>
                  <span className="text-muted-foreground">{seg.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIER 1: CONTENT AUTHENTICITY & AGGREGATED RISK */}
      <div className="mb-8 brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            1. Content Authenticity & Aggregated Risk
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/50 p-6 text-center">
            <ConfidenceRing value={Math.round(d.confidence * 100)} good={!isBad} />
            <p className="mt-4 font-display text-2xl font-bold uppercase tracking-wider">
              {verdictLabel}
            </p>
            <p className="mono-label mt-1 text-xs text-muted-foreground">
              CONFIDENCE {Math.round(d.confidence * 100)}%
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="mono-label">// AGGREGATED RISK SCORE</span>
              <span className="font-mono text-sm font-bold text-primary-glow">
                {d.risk_score} / 100 ({d.risk_level} RISK)
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full transition-all duration-700 ${
                  d.risk_score >= 75
                    ? "bg-red-500"
                    : d.risk_score >= 50
                      ? "bg-amber-500"
                      : "bg-cyan-400"
                }`}
                style={{ width: `${Math.max(5, d.risk_score)}%` }}
              />
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              <p className="font-mono">
                ℹ️ {d.heuristic_disclaimer || "Aggregated risk score — not a scientifically proven probability of AI generation."}
              </p>
            </div>

            <div className="mt-6">
              <p className="mono-label mb-3">// HEURISTIC FACTOR CONTRIBUTIONS</p>
              <div className="space-y-2">
                {d.factors?.map((f) => (
                  <div key={f.signal} className="flex items-center justify-between font-mono text-xs">
                    <span className="capitalize">{f.signal.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">
                      Weight {f.contribution_pct}% · Subscore {f.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE VIDEO TIMELINE (If Video Asset) */}
      {isVideo && d.timeline_markers && d.timeline_markers.length > 0 && (
        <div className="mb-8 brutal-border rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Sampled Keyframe Timeline
            </h2>
          </div>

          <p className="mt-4 text-xs text-muted-foreground font-mono">
            Click any marker timestamp to inspect keyframe classification and forensic signals:
          </p>

          <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-4">
            {d.timeline_markers.map((m) => (
              <button
                key={m.frame_number}
                onClick={() => setSelectedMarker(m)}
                className={`flex min-w-[110px] flex-col items-center rounded-xl border p-3 text-center transition-all ${
                  selectedMarker?.frame_number === m.frame_number
                    ? "border-primary-glow bg-primary/20 scale-105"
                    : m.risk_score >= 50
                      ? "border-amber-500/60 bg-amber-500/10 hover:border-amber-400"
                      : "border-border bg-background/40 hover:border-cyan-400/60"
                }`}
              >
                <span className="font-mono text-xs font-bold text-foreground">{m.timestamp.toFixed(1)}s</span>
                <span className="mono-label mt-1 text-[10px] text-muted-foreground">FRAME {m.frame_number}</span>
                <span
                  className={`mt-2 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase font-semibold ${
                    m.risk_score >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  SCORE: {m.risk_score}
                </span>
              </button>
            ))}
          </div>

          {selectedMarker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-primary-glow/40 bg-background/60 p-5 font-mono"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm font-bold text-primary-glow">
                  INSPECTING KEYFRAME #{selectedMarker.frame_number} (TIMESTAMP {selectedMarker.timestamp.toFixed(1)}s)
                </span>
                <span className="text-xs uppercase text-muted-foreground">VERDICT: {selectedMarker.verdict}</span>
              </div>
              <p className="mt-3 text-xs text-foreground">
                Feature Tag: <span className="text-cyan-300 font-bold">{selectedMarker.top_label}</span>
              </p>
              {selectedMarker.explanation && (
                <p className="mt-2 text-xs text-muted-foreground">{selectedMarker.explanation}</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* TIER 2: AI MODEL EVIDENCE */}
      <div className="mb-8 brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Cpu className="h-5 w-5 text-primary-glow" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            2. AI Model Evidence
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-background/40 p-4">
            <p className="mono-label">PROVIDER</p>
            <p className="mt-1 font-mono text-base font-bold uppercase text-foreground">{d.provider}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/40 p-4">
            <p className="mono-label">MODEL</p>
            <p className="mt-1 font-mono text-base font-bold text-foreground">{d.model_used}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-background/40 p-4">
            <p className="mono-label">MODE</p>
            <p className="mt-1 font-mono text-base font-bold text-foreground">
              {d.is_demo ? "SIMULATED DEMO" : "PRODUCTION INFERENCE"}
            </p>
          </div>
        </div>
      </div>

      {/* FACT-CHECK SOURCES & EVIDENCE BLOCK (If Claim / Fact-Check Asset) */}
      {((d.sources && d.sources.length > 0) || (d as any).extra_data?.sources?.length > 0) && (
        <div className="mb-8 brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                Fact-Check Evidence & Authoritative Sources
              </h2>
            </div>
            <span className="mono-label text-xs text-cyan-300">
              {((d.sources || (d as any).extra_data?.sources) || []).length} SOURCES RETRIEVED
            </span>
          </div>

          <div className="mt-6 space-y-4 font-mono">
            {((d.sources || (d as any).extra_data?.sources) || []).map((src: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-border/80 bg-background/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs text-cyan-300 font-bold uppercase">
                      {src.publisher}
                    </span>
                    {src.publication_date && (
                      <span className="text-xs text-muted-foreground">DATE: {src.publication_date}</span>
                    )}
                  </div>

                  <span className={`rounded-full px-3 py-0.5 text-xs uppercase font-bold ${
                    (src.textual_rating || "").toLowerCase().includes("false") || (src.textual_rating || "").toLowerCase().includes("debunked")
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : (src.textual_rating || "").toLowerCase().includes("true")
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    RATING: {src.textual_rating}
                  </span>
                </div>

                <p className="mt-3 text-sm text-foreground font-sans font-medium">{src.title}</p>

                {src.url && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate max-w-[60%]">{src.url}</span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-bold"
                    >
                      View Source Article <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIER 3: FORENSIC SIGNALS & METADATA */}
      <div className="mb-8 brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <FileSearch className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            3. Complementary Forensic & Metadata Signals
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {d.signals?.map((s, idx) => (
            <div key={idx} className="rounded-2xl border border-border/80 bg-background/40 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary-glow uppercase">
                  {s.signal}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                    s.severity === "high" || s.severity === "critical"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : s.severity === "moderate"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  }`}
                >
                  SEVERITY: {s.severity || "info"}
                </span>
              </div>

              <p className="mt-3 text-sm text-foreground">{s.description}</p>

              {s.limitations && (
                <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                  Limitations: {s.limitations}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TIER 4: EXPLANATION & LIMITATIONS */}
      <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Info className="h-5 w-5 text-amber-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            4. Explanation & Limitations
          </h2>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
            <p className="mono-label text-cyan-300 mb-2">// WHY DID THE SYSTEM REACH THIS RESULT?</p>
            <p className="text-sm text-foreground leading-relaxed">{d.explanation}</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <HelpCircle className="h-4 w-4" />
              <p className="mono-label text-amber-300">// TECHNICAL LIMITATIONS & DISCLOSURE</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{d.limitations}</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ConfidenceRing({ value, good }: { value: number; good: boolean }) {
  const size = 180;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = good ? "var(--cyan-edge)" : "var(--primary-glow)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--border)"
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dy=".35em"
        textAnchor="middle"
        style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 42, fill: "var(--foreground)" }}
      >
        {value}%
      </text>
    </svg>
  );
}