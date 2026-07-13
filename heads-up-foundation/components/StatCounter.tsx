"use client";

import { useEffect, useRef, useState } from "react";

/** Animated stat number — Oswald Bold, teal, per brand system. */
export default function StatCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1400,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = Math.min((t - t0) / duration, 1);
              // ease-out cubic
              setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={`font-stat font-bold text-teal ${className}`}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
