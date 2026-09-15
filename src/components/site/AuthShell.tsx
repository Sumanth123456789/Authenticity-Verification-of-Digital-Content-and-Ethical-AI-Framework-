import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Shield } from "lucide-react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left: mesh */}
      <div
        aria-hidden
        className="relative hidden overflow-hidden md:block"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary/10">
              <Shield className="h-4 w-4 text-primary-glow" />
            </span>
            <span className="font-display text-lg font-bold">AI-Content Verification Hub</span>
          </Link>
          <div>
            <p className="mono-label text-primary-glow">// EVIDENCE. ON DEMAND.</p>
            <p className="mt-4 max-w-md font-display text-4xl font-bold leading-tight">
              Every asset. Every model. Verified in under a second.
            </p>
          </div>
          <p className="mono-label">STATUS · OPERATIONAL · 99.98% UPTIME</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="relative flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <p className="mono-label">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight">{title}</h1>
          {subtitle ? <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}