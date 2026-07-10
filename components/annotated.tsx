"use client";

import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";

interface AnnotatedProps {
  type: "highlight" | "circle" | "underline";
  delay?: number;
  children: React.ReactNode;
}

const styles = {
  highlight: { color: "var(--color-highlight)", multiline: true },
  circle: { color: "var(--color-pencil)", strokeWidth: 1.5, padding: 6 },
  underline: { color: "var(--color-pencil)", strokeWidth: 1.5, padding: 2 },
} as const;

export function Annotated({ type, delay = 0, children }: AnnotatedProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const annotation = annotate(element, {
      type,
      animationDuration: 900,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ...styles[type],
    });

    let timeout: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timeout = window.setTimeout(() => annotation.show(), delay);
        observer.disconnect();
      },
      { threshold: 1 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      annotation.remove();
    };
  }, [type, delay]);

  return <span ref={ref}>{children}</span>;
}
