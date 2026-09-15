import { type HTMLAttributes, type ReactNode } from "react";
import { useTilt } from "@/hooks/useTilt";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  max?: number;
}

export function TiltCard({ children, className, max = 8, ...rest }: Props) {
  const ref = useTilt<HTMLDivElement>(max);
  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-sm transition-transform duration-200 will-change-transform",
        className
      )}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), oklch(0.62 0.28 305 / 0.18), transparent 40%)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}