"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";

type Variant = "events" | "passes" | "workspace";

export function AmbientPage({ children, variant }: { children: ReactNode; variant: Variant }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const follow = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || !ref.current || event.pointerType === "touch") return;
    ref.current.style.setProperty("--ambient-x", `${event.clientX}px`);
    ref.current.style.setProperty("--ambient-y", `${event.clientY}px`);
    ref.current.style.setProperty("--ambient-opacity", "1");
  };
  return <div ref={ref} onPointerMove={follow} onPointerLeave={() => ref.current?.style.setProperty("--ambient-opacity", "0")} className={`ambient-page ambient-page-${variant}`}>
    <div className="ambient-page-grid" aria-hidden="true" />
    <motion.div className="ambient-page-content" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .75, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
  </div>;
}
