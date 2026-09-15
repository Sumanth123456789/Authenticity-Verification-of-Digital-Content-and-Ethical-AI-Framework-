import { useEffect, useRef } from "react";

interface Options {
  strength?: number;
  radius?: number;
}

/** Attach to any element to pull it toward the cursor within `radius`. */
export function useMagnetic<T extends HTMLElement>({
  strength = 0.35,
  radius = 80,
}: Options = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;

    // ============================================
    // ORIGINAL MAGNETIC EFFECT (TEMPORARILY DISABLED)
    // Uncomment this block after the review.
    // ============================================

    /*
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius + Math.max(rect.width, rect.height) / 2) {
        tx = dx * strength;
        ty = dy * strength;
      } else {
        tx = 0;
        ty = 0;
      }

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };
    */

    // ============================================
    // TEMPORARY NORMAL BUTTONS (NO MAGNETIC EFFECT)
    // ============================================
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = "translate3d(0,0,0)";
      });
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      el.style.transform = "translate3d(0,0,0)";
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [radius, strength]);

  return ref;
}