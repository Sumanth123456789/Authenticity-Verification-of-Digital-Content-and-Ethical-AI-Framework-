import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, UploadCloud, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
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

function ImageAnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    toast.info(`Analyzing ${file.name} for AI generation & EXIF anomalies...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.upload<any>("/api/v1/verify", formData);
      toast.success(`Image analysis complete! Verdict: ${res.verdict.toUpperCase()}`);
      navigate({ to: "/results/$id", params: { id: res.id } });
    } catch (err: any) {
      console.error("Image analysis error:", err);
      toast.error(err.message || "Failed to analyze image.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / IMAGE"
      title="Image Analyzer"
      actions={
        file ? (
          <MagneticButton onClick={handleVerify} disabled={analyzing}>
            {analyzing ? "Analyzing signals..." : "Analyze Image →"}
          </MagneticButton>
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div>
              <p className="font-medium text-cyan-300">Deepfake & SynthImage Forensic Pipeline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Detects AI-generated images (Midjourney, DALL-E, Stable Diffusion), face swaps, EXIF metadata tampering, and frequency spectrum anomalies.
              </p>
            </div>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`relative flex min-h-[380px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive
              ? "border-primary-glow bg-primary/10"
              : "border-border bg-surface/40 hover:border-primary/60"
          }`}
        >
          <input {...getInputProps()} />

          {previewUrl ? (
            <div className="relative flex flex-col items-center gap-4">
              <img
                src={previewUrl}
                alt="Selected asset"
                className="max-h-64 rounded-2xl border border-border object-contain shadow-lg"
              />
              <p className="font-mono text-sm font-bold text-foreground">{file?.name}</p>
              <p className="mono-label text-xs text-cyan-400">Click or drop new file to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="h-16 w-16 text-primary-glow" />
              <p className="mt-6 font-display text-2xl font-bold">
                {isDragActive ? "Release to add image" : "Drag image file here"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Supports JPG, PNG, WEBP, GIF up to 100MB
              </p>
              <p className="mono-label mt-6">// CLICK TO BROWSE FILES</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

