import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/site/AuthShell";
import { Field } from "@/components/site/Field";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — AI-Content Verification Hub" },
      { name: "description", content: "Reset your AI-Content Verification Hub console password." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell
      eyebrow="// RECOVERY"
      title="Reset your access."
      subtitle="We'll send a one-time recovery link to your work email."
      footer={
        <p>
          Back to{" "}
          <Link to="/login" className="text-primary-glow">sign in</Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-6">
          <CheckCircle2 className="h-6 w-6 text-primary-glow" />
          <p className="mt-3 font-display text-xl font-bold">Recovery link dispatched.</p>
          <p className="mono-label mt-2">CHECK YOUR INBOX. LINK EXPIRES IN 15 MINUTES.</p>
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <Field label="Work email" type="email" required placeholder="you@newsroom.io" />
          <MagneticButton className="w-full" type="submit">Send recovery link</MagneticButton>
        </form>
      )}
    </AuthShell>
  );
}