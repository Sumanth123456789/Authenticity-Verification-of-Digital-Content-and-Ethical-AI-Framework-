import { createFileRoute, Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Zap, Radio, ScanLine, FileText, Cpu } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { TiltCard } from "@/components/effects/TiltCard";
import { SplitText } from "@/components/effects/SplitText";
import { NumberCounter } from "@/components/effects/NumberCounter";
import { Marquee } from "@/components/effects/Marquee";
import { FEATURES, STATS, TESTIMONIALS, TRUST_LOGOS } from "@/lib/mock/data";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURE_ICONS = [ScanLine, Radio, Shield, FileText, Zap, Cpu];

function Landing() {
  const featuresRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const section = featuresRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const track = section.querySelector<HTMLElement>("[data-track]");
      if (!track) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        const getScrollAmount = () =>
          Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

        const tween = gsap.to(track, {
          x: () => -getScrollAmount(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <TrustStrip />
      <section ref={featuresRef} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24">
          <p className="mono-label">// CAPABILITIES</p>
          <h2 className="mt-3 max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            Every modality. Every model. <span className="text-gradient">One console.</span>
          </h2>
        </div>
        <div className="mt-16 pb-32">
          <div data-track className="flex gap-6 px-6 will-change-transform md:flex-nowrap">
            {FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <TiltCard
                  key={f.tag}
                  className="min-h-[360px] w-[85vw] shrink-0 md:w-[420px]"
                >
                  <p className="mono-label text-primary-glow">{f.tag}</p>
                  <Icon className="mt-8 h-8 w-8 text-primary-glow" />
                  <h3 className="mt-6 font-display text-2xl font-bold leading-tight">
                    {f.title}
                  </h3>
                  <p className="mt-4 text-sm text-muted-foreground">{f.body}</p>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>
      <StatsBand />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Gradient mesh */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-mesh)" }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.28 0.06 275 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.28 0.06 275 / 0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />
      <OrbitalShield />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 py-24 md:grid-cols-12">
        <div className="md:col-span-8">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mono-label"
          >
            // AI-CONTENT VERIFICATION HUB — v4.2
          </motion.p>
          <SplitText
            as="h1"
            className="mt-4 block font-display text-[clamp(3rem,8vw,7.5rem)] font-bold leading-[0.9] tracking-[-0.04em]"
          >
            {`See what's real.`}
          </SplitText>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl"
          >
            Forensic-grade detection of deepfakes, voice clones, generated imagery, and
            machine-written text. Every verdict is explainable, auditable, and shippable in
            under a second.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link to="/verify" data-cursor="hover" data-cursor-label="SCAN">
              <MagneticButton>
                Start verifying <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
            </Link>
            <Link to="/dashboard" data-cursor="hover" data-cursor-label="VIEW">
              <MagneticButton variant="outline">View live console</MagneticButton>
            </Link>
          </motion.div>
          <div className="mt-16 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            {STATS.slice(0, 3).map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold md:text-3xl">
                  <NumberCounter
                    value={s.value}
                    suffix={s.suffix ?? ""}
                    decimals={"decimals" in s ? (s.decimals as number) : 0}
                  />
                </p>
                <p className="mono-label mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrbitalShield() {
  return (
    <div className="pointer-events-none absolute right-[-12vw] top-1/2 hidden aspect-square w-[52vw] -translate-y-1/2 md:block">
      <div className="absolute inset-0 rounded-full"
        style={{ background: "var(--gradient-orb)", filter: "blur(30px)" }}
      />
      {[0.55, 0.75, 0.95].map((s, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-primary/40"
          style={{ scale: s }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40 + i * 20, ease: "linear", repeat: Infinity }}
        >
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary-glow shadow-[0_0_20px_theme(colors.primary)]" />
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-primary bg-surface/70 backdrop-blur">
          <Shield className="h-14 w-14 text-primary-glow" />
          <span className="absolute -inset-4 rounded-3xl border border-primary/30" />
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="relative border-y border-border bg-surface/40 py-6">
      <p className="mono-label mb-4 text-center">// TRUSTED BY VERIFICATION TEAMS AT</p>
      <Marquee duration={40}>
        {TRUST_LOGOS.map((logo) => (
          <span
            key={logo}
            className="font-mono text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            {logo}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="relative border-y border-border bg-surface/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mono-label">// TELEMETRY — LAST 30 DAYS</p>
        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-l border-border pl-6">
              <p className="font-display text-4xl font-bold md:text-6xl">
                <NumberCounter
                  value={s.value}
                  suffix={s.suffix ?? ""}
                  decimals={"decimals" in s ? (s.decimals as number) : 0}
                />
              </p>
              <p className="mono-label mt-3">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mono-label">// EVIDENCE</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold md:text-6xl">
          The teams closest to the disinformation frontline.
        </h2>
      </div>
      <div className="mt-12">
        <Marquee duration={60}>
          {TESTIMONIALS.map((t) => (
            <div
              key={t.who}
              className="w-[400px] shrink-0 rounded-2xl border border-border bg-surface/60 p-6"
            >
              <p className="text-lg leading-snug">"{t.quote}"</p>
              <p className="mono-label mt-6">
                {t.who} · {t.role}
              </p>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl border border-primary/50 p-12 md:p-20"
          style={{ background: "var(--gradient-hero)" }}
        >
          <p className="mono-label text-primary-glow">// READY WHEN YOU ARE</p>
          <h2 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[0.95] md:text-7xl">
            Verify your first asset in under 60 seconds.
          </h2>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/register"><MagneticButton>Create free account</MagneticButton></Link>
            <Link to="/verify"><MagneticButton variant="outline">Try a demo scan</MagneticButton></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
