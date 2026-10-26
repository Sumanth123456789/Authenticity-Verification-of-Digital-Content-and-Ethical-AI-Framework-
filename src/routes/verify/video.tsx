import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Video as VideoIcon, UploadCloud, ShieldCheck, FileVideo, Zap, Loader2, CheckCircle2, Sparkles, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/verify/video")({
  head: () => ({
    meta: [
      { title: "Video Analyzer — AI-Content Verification Hub" },
      { name: "description", content: "Detect deepfakes and manipulated video frames using AI." },
    ],
  }),
  component: VideoAnalyzerPage,
});

const PRESET_VIDEO_SAMPLES = [
  {
    id: "deepfake_video",
    title: "Deepfake Face Swap Stream",
    filename: "deepfake_face_swap_video.mp4",
    type: "video/mp4",
    label: "FACE SWAP ANOMALY",
  },
  {
    id: "ai_sora_video",
    title: "AI Generated Video (OpenAI Sora / Runway)",
    filename: "ai_sora_generated_stream.mp4",
    type: "video/mp4",
    label: "SYNTHETIC GENERATOR",
  },
  {
    id: "authentic_recording",
    title: "Authentic Camera Video Stream",
    filename: "authentic_camera_recording.mp4",
    type: "video/mp4",
    label: "AUTHENTIC CAMERA",
  },
];

function createSampleVideoFile(name: string, type: string): File {
  // Simple dummy byte buffer for video testing
  const buffer = new ArrayBuffer(1024);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 1024; i++) view[i] = i % 256;
  return new File([buffer], name, { type });
}

export function VideoAnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "samples">("upload");

  const steps = [
    { title: "Container Demuxing & Audio Isolation", detail: "Extracting MP4/H264 stream headers & audio tracks" },
    { title: "Sampled Keyframe Extraction (2.0s Grid)", detail: "Isolating high-resolution temporal video keyframes" },
    { title: "Per-Frame Deepfake ViT Classifier", detail: "Detecting facial boundary warp & lip-sync anomalies" },
    { title: "Temporal Visual Continuity Aggregation", detail: "Generating timeline markers & composite risk score" },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".webm", ".avi", ".mkv"] },
    multiple: false,
  });

  const handleSelectSample = (sample: typeof PRESET_VIDEO_SAMPLES[0]) => {
    const f = createSampleVideoFile(sample.filename, sample.type);
    setFile(f);
    setPreviewUrl(null);
    toast.success(`Selected video preset: ${sample.title}`);
  };

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setProgress(5);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const next = prev + Math.floor(Math.random() * 12) + 8;
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

      toast.success(`Video Analysis Complete! Verdict: ${res.verdict.toUpperCase()}`);
      setTimeout(() => {
        navigate({ to: "/results/$id", params: { id: res.id } });
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Video analysis error:", err);
      toast.error(err.message || "Failed to analyze video file.");
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / VIDEO"
      title="Video Deepfake & Temporal Analyzer"
      actions={
        file && !analyzing ? (
          <MagneticButton onClick={handleVerify}>
            <Zap className="h-4 w-4 text-cyan-400" /> Start Video Analysis →
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
              <p className="font-medium text-cyan-300">Temporal & Facial Swap Deepfake Detector</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Extracts keyframes at 2-second intervals, measures frame-to-frame optical flow consistency,
                detects face-swap boundary artifacts, and flags synthetic lip-sync delays.
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
              <UploadCloud className="h-4 w-4" /> Upload Custom Video
            </button>
            <button
              onClick={() => setActiveTab("samples")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-all ${
                activeTab === "samples"
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold shadow-md shadow-cyan-500/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" /> Instant Video Presets
            </button>
          </div>
        </div>

        {/* Video Samples Drawer */}
        {activeTab === "samples" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3 font-mono"
          >
            {PRESET_VIDEO_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  handleSelectSample(sample);
                  setActiveTab("upload");
                }}
                className="group flex flex-col items-start rounded-2xl border border-border/80 bg-surface/50 p-5 text-left transition-all hover:border-cyan-400/80 hover:bg-background/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Film className="h-6 w-6" />
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

        {/* Main Video Upload Dropzone */}
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

            {previewUrl ? (
              <div className="relative flex flex-col items-center gap-4">
                <video
                  src={previewUrl}
                  controls
                  className="max-h-60 max-w-full rounded-2xl border border-border bg-black shadow-lg"
                />
                <p className="font-mono text-sm font-bold text-foreground">{file?.name}</p>
                <p className="mono-label text-xs text-cyan-400">Click or drop new file to replace</p>
              </div>
            ) : file ? (
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <FileVideo className="h-10 w-10 animate-pulse" />
                </div>
                <p className="font-mono text-sm font-bold text-foreground">{file.name}</p>
                <p className="mono-label text-xs text-cyan-400">Click or drop to replace video</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5">
                  <UploadCloud className="h-10 w-10 animate-bounce" />
                </div>
                <p className="mt-6 font-display text-2xl font-bold tracking-tight">
                  {isDragActive ? "Release to add video file" : "Drag video file here"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Supports MP4, MOV, WEBM, AVI, MKV up to 500MB
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 font-mono text-xs text-cyan-400">
                  <Film className="h-3.5 w-3.5" /> CLICK OR DROP TO SELECT VIDEO
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
                      Executing Keyframe & Temporal Video Pipeline...
                    </h3>
                    <p className="text-xs text-muted-foreground">Extracting optical flow & facial boundaries</p>
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
              Selected Video: <span className="text-foreground font-bold">{file.name}</span>
            </div>

            <MagneticButton onClick={handleVerify} disabled={analyzing}>
              <Zap className="h-4 w-4 text-cyan-400" /> Start Video Analysis →
            </MagneticButton>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
