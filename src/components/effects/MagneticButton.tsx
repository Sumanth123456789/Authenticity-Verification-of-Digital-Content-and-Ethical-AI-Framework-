import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  children: ReactNode;
}

export const MagneticButton = forwardRef<HTMLButtonElement, Props>(
  ({ children, className, variant = "primary", ...props }, _fwd) => {
    const ref = useMagnetic<HTMLButtonElement>({ strength: 0.3, radius: 90 });
    const base =
      "relative inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-[box-shadow,background,color] duration-300 will-change-transform";
    const variants = {
      primary:
        "bg-primary text-primary-foreground shadow-[0_0_0_1px_var(--primary),0_10px_40px_-10px_var(--primary)] hover:shadow-[0_0_0_1px_var(--primary-glow),0_20px_60px_-10px_var(--primary-glow)]",
      outline:
        "border border-primary text-foreground hover:bg-primary/15",
      ghost: "text-foreground hover:text-primary-glow",
    } as const;
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        data-cursor="hover"
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
MagneticButton.displayName = "MagneticButton";