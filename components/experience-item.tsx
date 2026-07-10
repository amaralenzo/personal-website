"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useDelayedUnmount } from "@/lib/use-delayed-unmount";
import { EyeIcon } from "./eye-icon";
import { usePresence } from "./presence/provider";
import { TextLink } from "./text-link";
import styles from "./experiences.module.css";

interface ExperienceItemProps {
  slug: string;
  title: string;
  kind: string;
  period: string;
  summary?: string;
  url?: string;
  logo?: string;
  children: React.ReactNode;
}

const CLOSE_DURATION = 150;

export function ExperienceItem({
  slug,
  title,
  kind,
  period,
  summary,
  url,
  logo,
  children,
}: ExperienceItemProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { peers, ghostViewing, setViewing } = usePresence();
  const viewers = peers.filter((peer) => peer.viewing === slug);
  const viewer = viewers[0];
  const ghostViewer = !viewer && ghostViewing === slug;

  const viewed = Boolean(viewer || ghostViewer);
  const badgeMounted = useDelayedUnmount(viewed, CLOSE_DURATION);
  const [badge, setBadge] = useState({
    ghost: false,
    color: undefined as string | undefined,
    count: 0,
  });
  if (viewed) {
    const next = {
      ghost: ghostViewer,
      color: viewer?.color ?? badge.color,
      count: viewer ? viewers.length : 0,
    };
    if (
      next.ghost !== badge.ghost ||
      next.color !== badge.color ||
      next.count !== badge.count
    ) {
      setBadge(next);
    }
  }

  const open = (event: React.MouseEvent<HTMLButtonElement>) => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    dialog.removeAttribute("data-closing");

    const row = event.currentTarget.getBoundingClientRect();
    const fromKeyboard = event.detail === 0;
    const originX = fromKeyboard ? row.left + row.width / 2 : event.clientX;
    const originY = fromKeyboard ? row.top + row.height / 2 : event.clientY;

    dialog.showModal();
    setViewing(slug, {
      x: originX + window.scrollX,
      y: originY + window.scrollY,
    });

    const rect = dialog.getBoundingClientRect();
    panel.style.transformOrigin = `${originX - rect.left}px ${originY - rect.top}px`;
  };

  const close = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
    setViewing(null);
    dialog.setAttribute("data-closing", "");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.setTimeout(
      () => {
        dialog.close();
        dialog.removeAttribute("data-closing");
      },
      reduceMotion ? 0 : CLOSE_DURATION,
    );
  };

  return (
    <li>
      <button
        type="button"
        className={styles.row}
        onClick={open}
        data-viewed={viewer ? "" : undefined}
        data-ghost={ghostViewer ? "" : undefined}
        style={
          badge.color
            ? ({ "--viewer-color": badge.color } as React.CSSProperties)
            : undefined
        }
      >
        <Logo logo={logo} title={title} />
        <span className={styles.title}>{title}</span>
        <span className={styles.kind}>{kind}</span>
        {summary && <span className={styles.summary}>{summary}</span>}
        {badgeMounted && (
          <span
            className={styles.viewerBadge}
            data-ghost={badge.ghost ? "" : undefined}
            data-closing={viewed ? undefined : ""}
            aria-hidden="true"
          >
            <EyeIcon />
            {badge.count > 0 && badge.count}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={title}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div ref={panelRef} className={styles.panel}>
          <header className={styles.panelHeader}>
            <Logo logo={logo} title={title} size="lg" />
            <div className={styles.panelHeading}>
              <h3 className={styles.panelTitle}>
                {url ? <TextLink href={url} newTab>{title}</TextLink> : title}
              </h3>
              <p className={styles.panelMeta}>
                {kind} · {period}
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>
          <div className={`article ${styles.panelBody}`}>{children}</div>
        </div>
      </dialog>
    </li>
  );
}

interface LogoProps {
  title: string;
  logo?: string;
  size?: "sm" | "lg";
}

function Logo({ title, logo, size = "sm" }: LogoProps) {
  const px = size === "lg" ? 40 : 24;

  if (!logo) {
    return (
      <span className={styles.monogram} data-size={size} aria-hidden="true">
        {title.charAt(0)}
      </span>
    );
  }

  return (
    <Image
      className={styles.logo}
      data-size={size}
      src={logo}
      alt=""
      width={px}
      height={px}
      unoptimized
    />
  );
}
