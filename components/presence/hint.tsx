"use client";

import { useEffect, useRef, useState } from "react";
import { useDelayedUnmount } from "@/lib/use-delayed-unmount";
import { EyeIcon } from "../eye-icon";
import { usePresence } from "./provider";
import styles from "./hint.module.css";

const CLOSE_DURATION = 150;

export function PresenceHint() {
  const { socket, peers } = usePresence();
  const [open, setOpen] = useState(false);
  const cardMounted = useDelayedUnmount(open, CLOSE_DURATION);
  const rootRef = useRef<HTMLDivElement>(null);
  const others = peers.length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!socket) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      {cardMounted && (
        <div
          id="presence-hint-card"
          className={styles.card}
          data-closing={open ? undefined : ""}
        >
          <p className={styles.cardTitle}>
            i saw the dull white glow of the page flicker; it breathed hard, and
            a convulsive motion agitated some cursors.
          </p>
          <p className={styles.cardBody}>
            it&rsquo;s alive! i made the page a multiplayer document because{" "}
            <b>why not</b>? the colorful cursors belong to other visitors
            currently on the page, grey cursors are ghosts of recent visitors.
          </p>
          <p
            className={styles.cardStatus}
            data-live={others > 0 || undefined}
            aria-live="polite"
          >
            <EyeIcon size={12} />
            {others}
            <span className="sr-only">
              other {others === 1 ? "visitor" : "visitors"} here right now
            </span>
          </p>
        </div>
      )}
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="presence-hint-card"
        aria-label="About the live cursors"
      >
        ?{others > 0 && <span className={styles.buttonDot} />}
      </button>
    </div>
  );
}
