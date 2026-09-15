import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/AuthShell";
import { Field } from "@/components/site/Field";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — AI-Content Verification Hub" },
      { name: "description", content: "Request access to AI-Content Verification Hub." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.register(email, password, fullName);
      toast.success("Account created successfully!");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(err.message || "Failed to create account. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="// REQUEST ACCESS"
      title="Create your console."
      subtitle="14-day evaluation. No credit card. Every feature unlocked."
      footer={
        <p>
          Already inside?{" "}
          <Link to="/login" className="text-primary-glow">Sign in</Link>
        </p>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Field
          label="Full name"
          required
          placeholder="Alex Rivera"
          value={fullName}
          onChange={(e: any) => setFullName(e.target.value)}
        />
        <Field
          label="Work email"
          type="email"
          required
          placeholder="you@newsroom.io"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          required
          placeholder="At least 8 characters"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />
        <MagneticButton className="w-full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </MagneticButton>
        <p className="mono-label text-center">
          BY CONTINUING YOU AGREE TO OUR TERMS + PRIVACY POLICY
        </p>
      </form>
    </AuthShell>
  );
}