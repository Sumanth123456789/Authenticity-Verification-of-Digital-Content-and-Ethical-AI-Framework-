import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: [
      { to: "/verify", label: "Verify" },
      { to: "/analytics", label: "Analytics" },
      { to: "/history", label: "History" },
      { to: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/admin", label: "Trust & safety" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/", label: "Terms" },
      { to: "/", label: "Privacy" },
      { to: "/", label: "Model card" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-5">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary/10">
              <Shield className="h-4 w-4 text-primary-glow" />
            </span>
            <span className="font-display text-lg font-bold">AI-Content Verification Hub</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Forensic-grade verification for a world where every pixel and phoneme is under suspicion.
          </p>
          <p className="mono-label mt-6">// v4.2.0 — LAST DEPLOY 12m AGO</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mono-label mb-4">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground" data-cursor="hover">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span className="font-mono uppercase tracking-widest">© 2026 AI-Content Verification Hub SYSTEMS — ALL SIGNALS RESERVED</span>
          <span className="font-mono uppercase tracking-widest">STATUS: OPERATIONAL · 99.98% UPTIME</span>
        </div>
      </div>
    </footer>
  );
}