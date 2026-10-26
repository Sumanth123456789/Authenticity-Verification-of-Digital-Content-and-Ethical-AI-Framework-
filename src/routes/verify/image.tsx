import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, UploadCloud, ShieldCheck, Loader2, Cpu, Zap, Activity, CheckCircle2, Sparkles, AlertTriangle, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/verify/image")({
  head: () => ({
    meta: [
      { title: "Image Analyzer — AI-Content Verification Hub" },
      { name: "description", content: "Detect AI-generated images, deepfakes, face manipulation, and EXIF anomalies." },
    ],
  }),
  component: ImageAnalyzerPage,
});

const PRESET_SAMPLES = [
  {
    id: "ai_gen",
    title: "AI Generated (Midjourney v6)",
    filename: "ai_midjourney_synthetic.png",
    type: "image/png",
    verdictTarget: "manipulated",
    svgBg: "linear-gradient(135deg, #4f46e5 0%, #ec4899 50%, #8b5cf6 100%)",
    label: "SYNTHETIC GENERATOR",
  },
  {
    id: "deepfake",
    title: "Deepfake Face Swap",
    filename: "deepfake_face_swap_altered.jpg",
    type: "image/jpeg",
    verdictTarget: "manipulated",
    svgBg: "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #b91c1c 100%)",
    label: "FACE SWAP ANOMALY",
  },
  {
    id: "authentic",
    title: "Authentic Camera Photo",
    filename: "authentic_canon_exif_photo.jpg",
    type: "image/jpeg",
    verdictTarget: "authentic",
    svgBg: "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
    label: "AUTHENTIC CAMERA",
  },
];

function createSampleFile(name: string, type: string, bg: string): File {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, bg.includes("ef4444") ? "#7f1d1d" : bg.includes("06b6d4") ? "#064e3b" : "#312e81");
    grad.addColorStop(1, bg.includes("ef4444") ? "#991b1b" : bg.includes("06b6d4") ? "#0284c7" : "#581c87");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.fillText(name.toUpperCase(), 20, 150);
  }
  const dataUrl = canvas.toDataURL(type);
  const arr = dataUrl.split(",");
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], name, { type });
}

export function ImageAnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "samples">("upload");

  const steps = [
    { title: "Binary Magic-Byte & Header Scan", detail: "Validating JPEG/PNG container safety & EXIF tables" },
    { title: "2D FFT & Noise Floor Extraction", detail: "Extracting high-frequency periodic lattice artifacts" },
    { title: "ViT Deepfake Neural Classifier", detail: "Running semantic AI generator pattern inference" },
    { title: "Multi-Signal Evidence Aggregation", detail: "Computing final composite risk score & XAI breakdown" },
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
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
    multiple: false,
  });

  const handleSelectSample = (sample: typeof PRESET_SAMPLES[0]) => {
    const f = createSampleFile(sample.filename, sample.type, sample.svgBg);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    toast.success(`Selected sample: ${sample.title}`);
  };

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setProgress(5);
    setCurrentStep(0);

    // Smooth real-time progress simulation while API executes
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const next = prev + Math.floor(Math.random() * 12) + 8;
        if (next > 30 && next <= 60) setCurrentStep(1);
        else if (next > 60 && next <= 85) setCurrentStep(2);
        else if (next > 85) setCurrentStep(3);
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

      toast.success(`Analysis Complete! Verdict: ${res.verdict.toUpperCase()}`);
      setTimeout(() => {
        navigate({ to: "/results/$id", params: { id: res.id } });
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Image analysis error:", err);
      toast.error(err.message || "Failed to analyze image.");
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / IMAGE"
      title="Image & Deepfake Forensic Analyzer"
      actions={
        file && !analyzing ? (
          <MagneticButton onClick={handleVerify}>
            <Zap className="h-4 w-4 text-cyan-400" /> Start High-Speed Analysis →
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
              <p className="font-medium text-cyan-300">Multi-Signal Deepfake & AI Image Forensic Engine</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Combines Vision Transformers (ViT), 2D Fast Fourier Transform (FFT), Error Level Analysis (ELA),
                and Spatial Noise Floor Variance to detect Midjourney, DALL-E 3, Stable Diffusion, and face swaps.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection for Instant Preset Testing */}
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
              <UploadCloud className="h-4 w-4" /> Upload Custom Image
            </button>
            <button
              onClick={() => setActiveTab("samples")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-all ${
                activeTab === "samples"
                  ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold shadow-md shadow-cyan-500/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" /> Instant Sample Presets
            </button>
          </div>

          <span className="hidden sm:inline-block text-muted-foreground text-[11px]">
            ⚡ Real-time multi-signal vector inference
          </span>
        </div>

        {/* Interactive Sample Presets Drawer */}
        {activeTab === "samples" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {PRESET_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  handleSelectSample(sample);
                  setActiveTab("upload");
                }}
                className="group relative flex flex-col items-start rounded-2xl border border-border/80 bg-surface/50 p-4 text-left transition-all hover:border-cyan-400/80 hover:bg-background/80"
              >
                <div
                  className="h-28 w-full rounded-xl flex items-center justify-center font-mono font-bold text-white text-xs shadow-inner"
                  style={{ background: sample.svgBg }}
                >
                  <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur-md">
                    {sample.label}
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm font-bold text-foreground group-hover:text-cyan-300">
                  {sample.title}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  File: {sample.filename}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-cyan-400 group-hover:underline">
                  Select Preset →
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Main Upload Dropzone */}
        {activeTab === "upload" && (
          <div
            {...getRootProps()}
            className={`relative flex min-h-[360px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
              isDragActive
                ? "border-primary-glow bg-primary/10 scale-[1.01]"
                : file
                  ? "border-cyan-500/50 bg-surface/60"
                  : "border-border bg-surface/30 hover:border-cyan-400/60"
            }`}
          >
            <input {...getInputProps()} />

            {previewUrl ? (
              <div className="relative flex flex-col items-center gap-4">
                <div className="relative group overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
                  <img
                    src={previewUrl}
                    alt="Selected asset"
                    className="max-h-60 max-w-full rounded-2xl object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <span className="font-mono text-xs text-white font-bold bg-background/80 px-3 py-1.5 rounded-full border border-border">
                      Click to replace image
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="font-bold text-foreground">{file?.name}</span>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-cyan-400 border border-cyan-500/30">
                    {file ? (file.size / (1024 * 1024)).toFixed(2) : "0"} MB
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5">
                  <UploadCloud className="h-10 w-10 animate-bounce" />
                </div>
                <p className="mt-6 font-display text-2xl font-bold tracking-tight">
                  {isDragActive ? "Drop image file here" : "Drag & drop image file here"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Supports JPG, PNG, WEBP, GIF up to 100MB
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 font-mono text-xs text-cyan-400">
                  <ImageIcon className="h-3.5 w-3.5" /> CLICK OR DROP TO SELECT IMAGE
                </div>
              </div>
            )}
          </div>
        )}

        {/* High-Speed Multi-Stage Processing Overlay Modal */}
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
                      Executing Forensic Signal Pipeline...
                    </h3>
                    <p className="text-xs text-muted-foreground">Processing multi-vector deepfake detection</p>
                  </div>
                </div>
                <span className="font-display text-2xl font-bold text-cyan-400">{progress}%</span>
              </div>

              {/* Animated Real-time Progress Bar */}
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-background border border-border">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              {/* Step Progression Grid */}
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
              Selected: <span className="text-foreground font-bold">{file.name}</span>
            </div>

            <MagneticButton onClick={handleVerify} disabled={analyzing}>
              <Zap className="h-4 w-4 text-cyan-400" /> Analyze Image →
            </MagneticButton>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
