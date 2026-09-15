import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/Shell";
import { MagneticButton } from "@/components/effects/MagneticButton";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AI-Content Verification Hub" },
      { name: "description", content: "Trust and safety controls." },
    ],
  }),
  component: AdminPage,
});

const users = [
  { name: "Alex Rivera", email: "alex@axis.media", role: "Owner", scans: 4820, status: "active" },
  { name: "Priya Ranganathan", email: "priya@axis.media", role: "Editor", scans: 1204, status: "active" },
  { name: "Jonas Weiss", email: "jonas@axis.media", role: "Analyst", scans: 862, status: "active" },
  { name: "Mei Tanaka", email: "mei@axis.media", role: "Analyst", scans: 415, status: "invited" },
  { name: "Ben Adeyemi", email: "ben@axis.media", role: "Read-only", scans: 88, status: "active" },
];

const models = [
  { id: "ai-cvh-image-v1", auc: 0.91, latency: 2100 },
  { id: "ai-cvh-video-v1", auc: 0.88, latency: 8500 },
  { id: "ai-cvh-voice-v1", auc: 0.89, latency: 4200 },
  { id: "ai-cvh-text-v1", auc: 0.87, latency: 950 },
];

function AdminPage() {
  return (
    <DashboardShell
      eyebrow="// CONSOLE / ADMIN"
      title="Trust & safety controls."
      actions={<MagneticButton>Invite member</MagneticButton>}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="brutal-border overflow-hidden rounded-3xl bg-surface/50 lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <p className="mono-label">// TEAM MEMBERS · {users.length}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="mono-label border-b border-border">
                <th className="px-6 py-3 text-left">NAME</th>
                <th className="px-6 py-3 text-left">ROLE</th>
                <th className="px-6 py-3 text-right">SCANS</th>
                <th className="px-6 py-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-b border-border last:border-none">
                  <td className="px-6 py-4">
                    <p className="font-mono">{u.name}</p>
                    <p className="mono-label mt-1">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs uppercase tracking-widest">{u.role}</td>
                  <td className="px-6 py-4 text-right font-display font-bold">{u.scans.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`mono-label ${u.status === "active" ? "text-cyan-edge" : "text-primary-glow"}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brutal-border rounded-3xl bg-surface/50 p-6">
          <p className="mono-label">// MODEL PERFORMANCE</p>
          <ul className="mt-6 space-y-5 font-mono text-sm">
            {models.map((m) => (
              <li key={m.id}>
                <div className="flex items-center justify-between">
                  <span>{m.id}</span>
                  <span className="text-primary-glow">AUC {m.auc}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-primary-glow" style={{ width: `${m.auc * 100}%` }} />
                </div>
                <p className="mono-label mt-1">P50 LATENCY · {m.latency}ms</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}