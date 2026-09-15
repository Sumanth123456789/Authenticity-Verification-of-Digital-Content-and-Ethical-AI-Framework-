import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 150, damping: 20, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 150, damping: 20, mass: 0.6 });
  const dotX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.2 });
  const dotY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.2 });

  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
      });

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor]'
      ) as HTMLElement | null;
      if (interactive) {
        setHover(true);
        setLabel(interactive.dataset.cursorLabel ?? null);
      } else {
        setHover(false);
        setLabel(null);
      }
    };

    const down = () => setClicking(true);
    const up = () => setClicking(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.classList.remove("has-custom-cursor");
      cancelAnimationFrame(rafRef.current);
    };
  }, [x, y]);

  if (!enabled) return null;

  const ringSize = hover ? 64 : 32;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
        style={{ x: dotX, y: dotY }}
      >
        <div
          className="rounded-full bg-primary-glow transition-opacity"
          style={{
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
            opacity: hover ? 0 : 1,
          }}
        />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        style={{ x: ringX, y: ringY }}
      >
        <motion.div
          animate={{
            width: ringSize,
            height: ringSize,
            scale: clicking ? 1.4 : 1,
            opacity: 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="flex items-center justify-center rounded-full border border-primary"
          style={{
            marginLeft: -ringSize / 2,
            marginTop: -ringSize / 2,
            background: hover ? "oklch(0.62 0.28 305 / 0.15)" : "transparent",
          }}
        >
          {label ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
              {label}
            </span>
          ) : null}
        </motion.div>
      </motion.div>
    </>
  );
}