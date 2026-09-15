import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, className, ...rest }: Props) {
  return (
    <label className="block">
      <span className="mono-label">{label}</span>
      <input
        {...rest}
        className={cn(
          "peer mt-2 w-full border-0 border-b border-border bg-transparent px-0 py-3 text-base text-foreground outline-none transition-colors focus:border-primary-glow",
          className
        )}
      />
    </label>
  );
}