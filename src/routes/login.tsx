import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/AuthShell";
import { Field } from "@/components/site/Field";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { apiClient } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AI-Content Verification Hub" },
      { name: "description", content: "Sign in to the AI-Content Verification Hub verification console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.login(email, password);
      toast.success("Successfully logged in!");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="// SIGN IN"
      title="Welcome back."
      subtitle="Access the console, resume scans, review evidence."
      footer={
        <p>
          No account?{" "}
          <Link to="/register" className="text-primary-glow">Request access</Link>
        </p>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          placeholder="••••••••"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs">
          <label className="mono-label flex items-center gap-2">
            <input type="checkbox" className="accent-[color:var(--primary)]" /> Remember device
          </label>
          <Link to="/forgot-password" className="mono-label text-primary-glow">Forgot?</Link>
        </div>
        <MagneticButton className="w-full" type="submit" disabled={loading}>
          {loading ? "Authenticating..." : "Sign in"}
        </MagneticButton>
      </form>
    </AuthShell>
  );
}