import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Key, Bell, User, Keyboard } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { Field } from "@/components/site/Field";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI-Content Verification Hub" },
      { name: "description", content: "Profile, API keys, and preferences." },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "api", label: "API keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("profile");
  return (
    <DashboardShell eyebrow="// CONSOLE / SETTINGS" title="Console preferences.">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <aside className="brutal-border h-fit rounded-2xl bg-surface/50 p-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-cursor="hover"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors",
                  tab === t.id
                    ? "bg-primary/15 text-primary-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </aside>

        <div className="brutal-border rounded-2xl bg-surface/50 p-8">
          {tab === "profile" && (
            <div className="space-y-6">
              <p className="mono-label">// PROFILE</p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Full name" defaultValue="Alex Rivera" />
                <Field label="Work email" defaultValue="alex@axis.media" />
                <Field label="Organization" defaultValue="Axis Broadcasting" />
                <Field label="Timezone" defaultValue="Europe/Berlin" />
              </div>
              <MagneticButton>Save changes</MagneticButton>
            </div>
          )}
          {tab === "api" && (
            <div className="space-y-6">
              <p className="mono-label">// API KEYS</p>
              {[
              { name: "Production", key: "aicvh_live_●●●●…●●●●" },
                { name: "Staging", key: "aicvh_test_●●●●…●●●●" },
              ].map((k) => (
                <div key={k.name} className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
                  <div>
                    <p className="mono-label">{k.name}</p>
                    <p className="mt-1 font-mono text-sm">{k.key}</p>
                  </div>
                  <button className="rounded-lg border border-border px-3 py-2 text-xs" data-cursor="hover">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <MagneticButton variant="outline">Generate new key</MagneticButton>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-6">
              <p className="mono-label">// NOTIFICATIONS</p>
              {["High-confidence manipulations", "Weekly digest", "Model version updates", "Team activity"].map((n) => (
                <label key={n} className="flex items-center justify-between border-b border-border py-3">
                  <span className="text-sm">{n}</span>
                  <input type="checkbox" defaultChecked className="accent-[color:var(--primary)]" />
                </label>
              ))}
            </div>
          )}
          {tab === "shortcuts" && (
            <div className="space-y-4">
              <p className="mono-label">// KEYBOARD SHORTCUTS</p>
              {[
                ["Open command palette", "⌘K"],
                ["New scan", "N"],
                ["Go to dashboard", "G D"],
                ["Go to history", "G H"],
                ["Copy result JSON", "⌘⇧C"],
              ].map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between border-b border-border py-3 font-mono text-sm">
                  <span>{label}</span>
                  <span className="rounded-md border border-border px-2 py-1 text-xs">{keys}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}