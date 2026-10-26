import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Mic, UploadCloud, ShieldCheck, FileAudio, Zap, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/verify/audio")({
  head: () => ({
    meta: [
      { title: "Audio Analyzer — AI-Content Verification Hub" },
      { name: "description", content: "Detect AI-generated speech, voice cloning, and audio manipulation." },
    ],
  }),
  component: AudioAnalyzerPage,
});

const PRESET_AUDIO_SAMPLES = [
  {
    id: "elevenlabs_clone",
    title: "ElevenLabs Voice Clone",
    filename: "synthetic_voice_clone_scam.wav",
    type: "audio/wav",
    label: "SYNTHETIC VOCODER",
  },
  {
    id: "deepfake_call",
    title: "Deepfake Spoof Voice Call",
    filename: "deepfake_audio_spoof.mp3",
    type: "audio/mp3",
    label: "VOICE CLONE ANOMALY",
  },
  {
    id: "human_speech",
    title: "Authentic Human Speech",
    filename: "authentic_human_vocal.wav",
    type: "audio/wav",
    label: "NATURAL PROSODY",
  },
];

function createSampleAudioFile(name: string, type: string): File {
  // Simple dummy WAV header + silence buffer
  const buffer = new ArrayBuffer(44 + 16000 * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false);
  /* file length */
  view.setUint32(4, 36 + 16000 * 2, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false);
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false);
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (pcm) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, 16000, true);
  /* byte rate */
  view.setUint32(28, 32000, true);
  /* block align */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false);
  /* data chunk length */
  view.setUint32(40, 16000 * 2, true);

  return new File([buffer], name, { type });
}

export function AudioAnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "samples">("upload");

  const steps = [
    { title: "Audio Stream & PCM 16kHz Decoding", detail: "Reading WAV/MP3 container & channel parameters" },
    { title: "STFT Spectral Flux & Micro-Tremors", detail: "Extracting acoustic vocal tract pitch stability metrics" },
    { title: "Whisper Speech-to-Text Transcription", detail: "Transcribing speech stream & temporal alignment" },
    { title: "Synthetic Voice Probability Calculation", detail: "Computing aggregated acoustic risk score" },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".m4a"] },
    multiple: false,
  });

  const handleSelectSample = (sample: typeof PRESET_AUDIO_SAMPLES[0]) => {
    const f = createSampleAudioFile(sample.filename, sample.type);
    setFile(f);
    toast.success(`Selected audio preset: ${sample.title}`);
  };

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setProgress(5);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const next = prev + Math.floor(Math.random() * 14) + 8;
        if (next > 25 && next <= 55) setCurrentStep(1);
        else if (next > 55 && next <= 82) setCurrentStep(2);
        else if (next > 82) setCurrentStep(3);
        return Math.min(next, 92);
      });
    }, 180);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.upload<any>("/api/v1/verify", formData);
      clearInterval(interval);
      setProgress(100);
      setCurrentStep(3);

      toast.success(`Audio Analysis Complete! Verdict: ${res.verdict.toUpperCase()}`);
      setTimeout(() => {
        navigate({ to: "/results/$id", params: { id: res.id } });
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Audio analysis error:", err);
      toast.error(err.message || "Failed to analyze audio file.");
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / AUDIO"
      title="Audio & Synthetic Voice Analyzer"
      actions={
        file && !analyzing ? (
          <MagneticButton onClick={handleVerify}>
            <Zap className="h-4 w-4 text-cyan-400" /> Start Audio Verification →
          </MagneticButton>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div className="space-y-1">
              <p className="font-medium text-cyan-300">Voice Clone & Prosody Forensic Engine</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Evaluates spectral envelope discontinuities, vocal tract micro-jitter, synthetic vocoder artifacts,
                and Whisper speech-to-text transcript alignment to detect voice clones and AI call impersonation.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 font-mono text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-all ${
                activeTab === "upload"
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold shadow-md shadow-cyan-500/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <UploadCloud className="h-4 w-4" /> Upload Custom Audio
            </button>
            <button
              onClick={() => setActiveTab("samples")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-all ${
                activeTab === "samples"
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold shadow-md shadow-cyan-500/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" /> Instant Audio Presets
            </button>
          </div>
        </div>

        {/* Audio Samples Drawer */}
        {activeTab === "samples" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3 font-mono"
          >
            {PRESET_AUDIO_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  handleSelectSample(sample);
                  setActiveTab("upload");
                }}
                className="group flex flex-col items-start rounded-2xl border border-border/80 bg-surface/50 p-5 text-left transition-all hover:border-cyan-400/80 hover:bg-background/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Mic className="h-6 w-6" />
                </div>
                <span className="mt-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] text-cyan-300 uppercase font-bold">
                  {sample.label}
                </span>
                <p className="mt-2 text-sm font-bold text-foreground group-hover:text-cyan-300">
                  {sample.title}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">{sample.filename}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 group-hover:underline">
                  Select Preset →
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Main Audio Upload Dropzone */}
        {activeTab === "upload" && (
          <div
            {...getRootProps()}
            className={`relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
              isDragActive
                ? "border-primary-glow bg-primary/10"
                : file
                  ? "border-cyan-500/50 bg-surface/60"
                  : "border-border bg-surface/30 hover:border-cyan-400/60"
            }`}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <FileAudio className="h-10 w-10 animate-pulse" />
                </div>
                <p className="font-mono text-sm font-bold text-foreground">{file.name}</p>
                <p className="mono-label text-xs text-cyan-400">
                  SIZE: {(file.size / (1024 * 1024)).toFixed(2)} MB · Click or drop to replace file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5">
                  <UploadCloud className="h-10 w-10 animate-bounce" />
                </div>
                <p className="mt-6 font-display text-2xl font-bold tracking-tight">
                  {isDragActive ? "Release to upload audio" : "Drag audio file here"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Supports MP3, WAV, FLAC, OGG, M4A up to 100MB
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 font-mono text-xs text-cyan-400">
                  <Mic className="h-3.5 w-3.5" /> CLICK OR DROP TO SELECT AUDIO
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Multi-Stage Progress Modal */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-cyan-500/40 bg-surface/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl space-y-6 font-mono"
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase text-foreground">
                      Executing Acoustic & Voice Clone Pipeline...
                    </h3>
                    <p className="text-xs text-muted-foreground">Processing speech spectrum & transcription</p>
                  </div>
                </div>
                <span className="font-display text-2xl font-bold text-cyan-400">{progress}%</span>
              </div>

              <div className="relative h-3 w-full overflow-hidden rounded-full bg-background border border-border">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                {steps.map((step, idx) => {
                  const isDone = idx < currentStep || progress === 100;
                  const isCurrent = idx === currentStep && progress < 100;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                        isDone
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : isCurrent
                            ? "border-cyan-400 bg-cyan-400/15 text-cyan-300 shadow-md shadow-cyan-500/10"
                            : "border-border/60 bg-background/30 text-muted-foreground opacity-60"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="mt-0.5 h-4 w-4 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <div>
                        <p className="font-bold">{step.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        {file && !analyzing && (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface/50 p-4">
            <div className="font-mono text-xs text-muted-foreground">
              Selected Audio: <span className="text-foreground font-bold">{file.name}</span>
            </div>

            <MagneticButton onClick={handleVerify} disabled={analyzing}>
              <Zap className="h-4 w-4 text-cyan-400" /> Start Audio Verification →
            </MagneticButton>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
