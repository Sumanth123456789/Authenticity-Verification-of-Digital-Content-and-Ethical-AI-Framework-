import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}

export function Marquee({ children, className, duration = 30, reverse }: Props) {
  return (
    <div className={cn("group relative flex overflow-hidden", className)}>
      <div
        className="flex shrink-0 items-center gap-12 pr-12 [animation-play-state:running] group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-x ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-12 pr-12 [animation-play-state:running] group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-x ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
      <style>{`@keyframes marquee-x { from { transform: translateX(0); } to { transform: translateX(-100%); } }`}</style>
    </div>
  );
}