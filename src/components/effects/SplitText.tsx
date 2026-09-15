import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function SplitText({ children, className, delay = 0, as = "span" }: Props) {
  const Tag = motion[as] as typeof motion.span;
  const chars = Array.from(children);
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      transition={{ staggerChildren: 0.02, delayChildren: delay }}
      aria-label={children}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="inline-block whitespace-pre"
          aria-hidden
        >
          {ch}
        </motion.span>
      )) as ReactNode}
    </Tag>
  );
}