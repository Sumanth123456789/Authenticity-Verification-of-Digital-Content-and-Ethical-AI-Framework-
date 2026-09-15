import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Mic, UploadCloud, ShieldCheck, FileAudio } from "lucide-react";
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

function AudioAnalyzerPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleVerify = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    toast.info(`Analyzing audio file ${file.name} for voice clones & spectral anomalies...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.upload<any>("/api/v1/verify", formData);
      toast.success(`Audio analysis complete! Verdict: ${res.verdict.toUpperCase()}`);
      navigate({ to: "/results/$id", params: { id: res.id } });
    } catch (err: any) {
      console.error("Audio analysis error:", err);
      toast.error(err.message || "Failed to analyze audio file.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="// ANALYZERS / AUDIO"
      title="Audio & Synthetic Voice Analyzer"
      actions={
        file ? (
          <MagneticButton onClick={handleVerify} disabled={analyzing}>
            {analyzing ? "Analyzing signals..." : "Analyze Audio →"}
          </MagneticButton>
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
            <div>
              <p className="font-medium text-cyan-300">Voice Clone & Prosody Forensic Engine</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluates spectral envelope discontinuities, pitch variance, synthetic vocoder artifacts, and speech-to-text transcript alignment.
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

          {file ? (
            <div className="relative flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                <FileAudio className="h-10 w-10" />
              </div>
              <p className="font-mono text-sm font-bold text-foreground">{file.name}</p>
              <p className="mono-label text-xs text-muted-foreground">
                SIZE: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="mono-label text-xs text-cyan-400">Click or drop new file to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="h-16 w-16 text-primary-glow" />
              <p className="mt-6 font-display text-2xl font-bold">
                {isDragActive ? "Release to add audio file" : "Drag speech audio file here"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Supports MP3, WAV, FLAC, OGG, M4A up to 100MB
              </p>
              <p className="mono-label mt-6">// CLICK TO BROWSE FILES</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

