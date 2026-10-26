# AI-Content Verification Hub — Build Plan

A cinematic, neon-brutalist multi-route app for detecting deepfakes and AI-generated media. This is a large build, so I'll ship it in phases and confirm after each so you can steer.

## Scope assumptions (tell me if wrong)

- **Frontend-only, mocked data.** No real ML detection, no backend, no auth. Uploads simulate progress and return mocked confidence scores from `src/lib/mock/`. Lovable Cloud (auth, DB, storage) is **not** enabled unless you say so.
- **All 10 routes** are built with realistic mocked content, not stubs.
- **Design system first**: tokens, cursor, smooth scroll, magnetic/tilt primitives before pages.
- Mobile: custom cursor disabled, Lenis kept, heavy WebGL/pin animations simplified.

## Phases

### Phase 1 — Foundation (design system + core effects)
- Rewrite `src/styles.css` with neon-brutalist tokens (oklch equivalents of the hex palette), gradients, shadows, grain overlay, Space Grotesk + Inter + JetBrains Mono via `<link>` in `__root.tsx`.
- Install: `framer-motion`, `@studio-freight/lenis`, `gsap`, `lucide-react`, `recharts`, `react-dropzone`, `@tsparticles/react @tsparticles/slim`, `clsx` (already there).
- Build `src/components/effects/`: `CustomCursor`, `SmoothScroll` (Lenis + ScrollTrigger sync), `NoiseOverlay`, `ScrollProgressBar`, `SplitText`, `MagneticButton`, `TiltCard`, `Marquee`, `NumberCounter`.
- Hooks: `useMagnetic`, `useTilt`, `useLenis`, `useScrollReveal`, `useHydrated`.
- Wire cursor + smooth scroll + noise + progress bar in `__root.tsx` (client-only guards).

### Phase 2 — Site shell + Landing
- `Navbar`, `Footer`, `AuthShell`, page-transition wrapper (`AnimatePresence` + clip-path reveal).
- Landing route: hero (orbital rings around shield, split-text headline, magnetic CTAs), scroll-pinned feature showcase (GSAP), live stats counters, testimonial marquee, brutalist footer.
- Route metadata (title/description/og) per `tanstack-route-architecture`.

### Phase 3 — Auth routes (mock only)
- `/login`, `/register`, `/forgot-password`, `/verify-email` — split-screen with animated gradient mesh + brutalist form. Submits fake, redirects to `/dashboard`.

### Phase 4 — Dashboard shell + Upload & Verify + Results
- `_authenticated` layout (client-side mock gate, not real auth) with collapsible shadcn sidebar (magnetic icons), topbar, ⌘K shortcuts modal.
- `/dashboard`: stat cards, recent activity, live feed (mock ticker).
- `/verify`: react-dropzone + tsparticles convergence effect, multi-file, progress rings, mocked scan.
- `/results/$id`: animated SVG confidence ring, Recharts radial signal breakdown, mocked XAI heatmap overlay on the uploaded image, "download report" (client-side JSON/PDF-ish blob).

### Phase 5 — Remaining routes
- `/history` (filterable table, row expansion), `/analytics` (Recharts area/bar with neon glow), `/admin` (mock user table, model perf), `/settings` (profile, API keys, theme, shortcuts), `/contact` (brutalist form + static map image).

### Phase 6 — Polish pass
- Sitemap + robots. SEO metadata per route. Responsive audit. Reduced-motion fallbacks. Verify build + a Playwright screenshot of landing/dashboard/results.

## Technical notes

- Colors go into `src/styles.css` as `oklch()` tokens mapped through `@theme inline`. No hex in components; hero gradient exposed as `--gradient-hero`.
- Lenis + GSAP ScrollTrigger initialized inside a `useEffect` in a client component mounted from `__root.tsx` — never at module scope (SSR safety per `tanstack-execution-model`).
- Custom cursor gated by `matchMedia('(pointer: fine)')` and `useHydrated()`.
- All fonts via `<link>` tags in root head, never `@import` in CSS (Tailwind v4 rule).
- Mock data typed with TS interfaces in `src/lib/mock/`.

## What I need from you

1. **Confirm frontend-only + mocked** (no Lovable Cloud / auth backend right now). If you want real auth + persistence, I'll enable Lovable Cloud and add ~1 extra phase.
2. **Green-light Phase 1** and I'll start immediately, then check in before Phase 2.
