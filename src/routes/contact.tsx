import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Field } from "@/components/site/Field";
import { MagneticButton } from "@/components/effects/MagneticButton";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AI-Content Verification Hub" },
      { name: "description", content: "Talk to the AI-Content Verification Hub team." },
      { property: "og:title", content: "Contact — AI-Content Verification Hub" },
      { property: "og:description", content: "Talk to the AI-Content Verification Hub team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div>
      <Navbar />
      <section className="relative overflow-hidden pt-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-mesh)" }}
        />
        <div className="mx-auto max-w-7xl px-6">
          <p className="mono-label">// CONTACT</p>
          <h1 className="mt-3 max-w-3xl font-display text-6xl font-bold leading-[0.95] md:text-8xl">
            Talk to <span className="text-gradient">a human.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Newsroom demos, enterprise onboarding, or trust-and-safety consultation. We reply within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 px-6 pb-24 lg:grid-cols-2">
        <form
          className="brutal-border space-y-6 rounded-3xl bg-surface/60 p-10"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Name" placeholder="Alex Rivera" required />
          <Field label="Work email" type="email" placeholder="you@newsroom.io" required />
          <Field label="Organization" placeholder="Axis Broadcasting" />
          <label className="block">
            <span className="mono-label">Message</span>
            <textarea
              rows={5}
              className="mt-2 w-full resize-none border-0 border-b border-border bg-transparent px-0 py-3 text-base outline-none focus:border-primary-glow"
              placeholder="Tell us what you're verifying."
            />
          </label>
          <MagneticButton type="submit" className="w-full">Send message</MagneticButton>
        </form>

        <div className="space-y-6">
          <div className="brutal-border rounded-3xl bg-surface/60 p-8">
            <p className="mono-label">// REACH US</p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary-glow" /> hello@aicvhub.local</li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary-glow" /> +1 (415) 555 0142</li>
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary-glow" /> Berlin · New York · Nairobi</li>
            </ul>
          </div>
          <div
            className="brutal-border relative aspect-[4/3] overflow-hidden rounded-3xl"
            style={{
              background:
                "radial-gradient(at 20% 20%, oklch(0.62 0.28 305 / 0.4), transparent 50%), radial-gradient(at 80% 60%, oklch(0.62 0.22 260 / 0.4), transparent 50%), var(--surface)",
            }}
          >
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.28 0.06 275)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {[
                [110, 90], [280, 130], [200, 210],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="oklch(0.76 0.22 315)" />
                  <circle cx={x} cy={y} r="14" fill="none" stroke="oklch(0.76 0.22 315)" opacity="0.4" />
                </g>
              ))}
            </svg>
            <span className="mono-label absolute bottom-4 left-4">// GLOBAL PRESENCE</span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}