import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  FileText,
  X,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      {
        title: "Verify — AI-Content Verification Hub",
      },
      {
        name: "description",
        content: "Upload content for real evidence-based verification.",
      },
    ],
  }),
  component: VerifyPage,
});

interface Queued {
  id: string;
  file: File;
  status: "waiting" | "analyzing" | "complete" | "failed";
  resultId?: string;
  error?: string;
}

function iconFor(mime: string) {
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("image/")) return ImageIcon;

  return FileText;
}

function createFileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

function VerifyPage() {
  const [queue, setQueue] = useState<Queued[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((files: File[]) => {
    const added: Queued[] = files.map((file) => ({
      id: createFileId(file),
      file,
      status: "waiting",
    }));

    setQueue((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const uniqueFiles = added.filter((item) => !existingIds.has(item.id));
      return [...current, ...uniqueFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const hasFiles = queue.length > 0;

  async function handleVerify() {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    let lastResultId: string | null = null;

    for (const item of queue) {
      if (item.status === "complete") continue;

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "analyzing" } : q)),
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);

        toast.info(`Analyzing ${item.file.name}...`);

        const response = await fetch(`${API_BASE}/api/v1/verify`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        lastResultId = data.id;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "complete", resultId: data.id }
              : q,
          ),
        );

        toast.success(`Verification complete for ${item.file.name}! Verdict: ${data.verdict.toUpperCase()}`);
      } catch (err: any) {
        console.error("Verification error:", err);
        const errMsg = err.name === "TypeError" && err.message?.includes("fetch")
          ? "Unable to connect to the verification server. Please try again later."
          : (err.message || "Failed to analyze");
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "failed", error: errMsg }
              : q,
          ),
        );
        toast.error(`Verification failed: ${errMsg}`);
      }
    }

    setIsProcessing(false);

    if (lastResultId) {
      setTimeout(() => {
        navigate({ to: "/history" });
      }, 1200);
    }
  }

  return (
    <DashboardShell
      eyebrow="// CONSOLE / VERIFY"
      title="Drop it in. Verify with evidence."
      actions={
        hasFiles ? (
          <MagneticButton onClick={handleVerify} disabled={isProcessing}>
            {isProcessing ? "Analyzing signals..." : "Verify selected files →"}
          </MagneticButton>
        ) : null
      }
    >
      <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <p className="font-medium text-cyan-300">
              Real Multi-Signal AI Verification Enabled
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Uploaded files are analyzed asynchronously via Vision Transformer models, EXIF forensic provenance extraction, and dynamic risk engine scoring.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          {...getRootProps()}
          className={`relative col-span-2 flex min-h-[420px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive
              ? "border-primary-glow bg-primary/10"
              : "border-border bg-surface/40 hover:border-primary/60"
          }`}
          data-cursor="hover"
          data-cursor-label="UPLOAD"
        >
          <input {...getInputProps()} />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: "var(--gradient-mesh)",
            }}
          />

          <UploadCloud className="relative h-16 w-16 text-primary-glow" />

          <p className="relative mt-6 font-display text-3xl font-bold">
            {isDragActive ? "Release to add." : "Drag files here."}
          </p>

          <p className="relative mt-3 max-w-lg text-sm text-muted-foreground">
            Add images, video, audio, call recordings, or text for evidence-based verification.
          </p>

          <p className="mono-label relative mt-6">
            // OR CLICK ANYWHERE IN THIS ZONE
          </p>
        </div>

        <div className="brutal-border rounded-3xl bg-surface/50 p-6">
          <p className="mono-label">// QUEUE</p>

          {queue.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No files selected.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              <AnimatePresence>
                {queue.map((item) => {
                  const Icon = iconFor(item.file.type);

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-border bg-background/60 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary-glow" />

                        <span className="flex-1 truncate font-mono text-sm">
                          {item.file.name}
                        </span>

                        {!isProcessing && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setQueue((current) =>
                                current.filter((queued) => queued.id !== item.id),
                              );
                            }}
                            aria-label={`Remove ${item.file.name}`}
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      <div className="mt-3 rounded-lg border border-border/60 bg-surface/50 p-3">
                        {item.status === "waiting" && (
                          <p className="mono-label text-cyan-400">READY FOR VERIFICATION</p>
                        )}

                        {item.status === "analyzing" && (
                          <div className="flex items-center gap-2 text-amber-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <p className="mono-label text-amber-400">ANALYZING SIGNALS...</p>
                          </div>
                        )}

                        {item.status === "complete" && (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <p className="mono-label text-emerald-400">ANALYSIS COMPLETE</p>
                          </div>
                        )}

                        {item.status === "failed" && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <p className="mono-label text-red-400">FAILED: {item.error}</p>
                          </div>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
