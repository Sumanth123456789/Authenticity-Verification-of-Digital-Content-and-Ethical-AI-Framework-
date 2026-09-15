import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/verify", label: "Verify" },
  { to: "/analytics", label: "Analytics" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2" data-cursor="hover" data-cursor-label="HOME">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary/10">
            <Shield className="h-4 w-4 text-primary-glow" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">AI-CVHub</span>
          <span className="mono-label ml-2 hidden sm:inline">// SYSTEM ONLINE</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                data-cursor="hover"
                className={cn(
                  "relative px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors",
                  active ? "text-primary-glow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-primary-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="mono-label hover:text-foreground" data-cursor="hover">
            Sign in
          </Link>
          <Link to="/register" data-cursor="hover" data-cursor-label="LAUNCH">
            <MagneticButton>Launch console</MagneticButton>
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="flex flex-col p-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                {n.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="py-3 font-mono text-xs uppercase tracking-widest">
              Sign in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)} className="mt-2">
              <MagneticButton className="w-full">Launch console</MagneticButton>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}