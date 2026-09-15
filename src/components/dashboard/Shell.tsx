import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ScanLine,
  History,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Shield,
  Search,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Image,
  Video,
  Mic,
  Phone,
  FileText,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/verify", label: "Verify Content", icon: ScanLine },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin", label: "Admin", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const analyzerItems = [
  { to: "/verify/image", label: "Image Analyzer", icon: Image },
  { to: "/verify/video", label: "Video Analyzer", icon: Video },
  { to: "/verify/audio", label: "Audio Analyzer", icon: Mic },
  { to: "/verify/call", label: "Call Recording", icon: Phone },
  { to: "/verify/text", label: "Text Analyzer", icon: FileText },
  { to: "/verify/link", label: "Link & Message", icon: Link2 },
];

export function DashboardShell({
  title,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-border bg-surface/60 backdrop-blur transition-[width] duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary/10">
            <Shield className="h-4 w-4 text-primary-glow" />
          </span>
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">AI-CVHub</span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
          {mainItems.map((it) => {
            const active = pathname === it.to || (it.to === "/verify" && pathname === "/verify");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                data-cursor="hover"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors",
                  active
                    ? "bg-primary/15 text-primary-glow"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
                title={collapsed ? it.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{it.label}</span>}
              </Link>
            );
          })}

          {!collapsed && (
            <p className="mono-label px-3 pt-4 pb-1" style={{ fontSize: "0.62rem" }}>// ANALYZERS</p>
          )}
          {collapsed && <div className="my-2 border-t border-border" />}

          {analyzerItems.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                data-cursor="hover"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors",
                  active
                    ? "bg-primary/15 text-primary-glow"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
                title={collapsed ? it.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{it.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 flex items-center justify-center rounded-lg border border-border py-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>

      <main className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-8 backdrop-blur">
          <div className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search assets, hashes, cases…"
              className="w-full max-w-md bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <span className="mono-label ml-auto hidden md:inline">⌘K</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full border border-border p-2" data-cursor="hover">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary-glow" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/60 bg-primary/10 font-mono text-xs font-bold text-primary-glow">
              AR
            </div>
          </div>
        </header>
        <div className="px-8 py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow ? <p className="mono-label">{eyebrow}</p> : null}
              <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">{title}</h1>
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}