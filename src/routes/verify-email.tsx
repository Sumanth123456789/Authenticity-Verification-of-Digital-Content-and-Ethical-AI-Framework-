import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/site/AuthShell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify email — AI-Content Verification Hub" },
      { name: "description", content: "Confirm your AI-Content Verification Hub console email address." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="// CONFIRM YOUR EMAIL"
      title="Check your inbox."
      subtitle="We just sent a 6-digit code. Enter it below to activate your console."
      footer={
        <p>
          Wrong email?{" "}
          <Link to="/register" className="text-primary-glow">Start over</Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 p-4">
          <Mail className="h-5 w-5 text-primary-glow" />
          <span className="mono-label">CODE DISPATCHED · EXPIRES IN 10:00</span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              maxLength={1}
              inputMode="numeric"
              className="h-14 rounded-lg border border-border bg-surface/60 text-center font-display text-2xl font-bold outline-none focus:border-primary-glow"
            />
          ))}
        </div>
        <Link to="/dashboard">
          <MagneticButton className="w-full">Verify & continue</MagneticButton>
        </Link>
      </div>
    </AuthShell>
  );
}