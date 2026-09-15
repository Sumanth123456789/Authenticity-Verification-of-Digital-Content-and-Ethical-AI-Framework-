import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Video, UploadCloud, ShieldCheck, FileVideo } from "lucide-react";
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

function VideoAnalyzerPage() {
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
    accept: { "video/*": [".mp4", ".mov", ".webm", ".avi", ".mkv"] },
    multiple: false,
  });

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    toast.info(`Extracting video frames from ${file.name} for deepfake detection...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.upload<any>("/api/v1/verify", formData);
      toast.success(`Video analysis complete! Verdict: ${res.verdict.toUpperCase()}`);
      navigate({ to: "/results/$id", params: { id: res.id } });
    } catch (err: any) {
      console.error("Video analysis error:", err);
      toast.error(err.message || "Failed to analyze video file.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / VIDEO"
      title="Video Deepfake & Temporal Analyzer"
      actions={
        file ? (
          <MagneticButton onClick={handleVerify} disabled={analyzing}>
            {analyzing ? "Analyzing signals..." : "Analyze Video →"}
          </MagneticButton>
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div>
              <p className="font-medium text-cyan-300">Temporal & Facial Swap Deepfake Detector</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Extracts keyframes at 1-second intervals, measures frame-to-frame optical flow consistency, detects face-swap boundary artifacts, and flags synthetic lip-sync delays.
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
              <video
                src={previewUrl}
                controls
                className="max-h-64 max-w-full rounded-2xl border border-border bg-black shadow-lg"
              />
              <p className="font-mono text-sm font-bold text-foreground">{file?.name}</p>
              <p className="mono-label text-xs text-cyan-400">Click or drop new file to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="h-16 w-16 text-primary-glow" />
              <p className="mt-6 font-display text-2xl font-bold">
                {isDragActive ? "Release to add video file" : "Drag video file here"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Supports MP4, MOV, WEBM, AVI, MKV up to 500MB
              </p>
              <p className="mono-label mt-6">// CLICK TO BROWSE FILES</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

