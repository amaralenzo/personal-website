"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Peer, ServerMessage, Trail } from "@/party/protocol";
import { CursorArrow } from "./cursor-arrow";
import { usePresence } from "./provider";
import styles from "./presence.module.css";

interface Position {
  x: number;
  y: number;
}

interface Ripple {
  key: number;
  peerId: string;
  x: number;
  y: number;
}

export function PresenceOverlay() {
  const { socket, peers, trails } = usePresence();
  const [cursors, setCursors] = useState(new Map<string, Position>());
  const [readers, setReaders] = useState(new Map<string, number>());
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleKey = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = overlayRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setHeight(element.offsetHeight),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as ServerMessage;
      switch (message.type) {
        case "sync": {
          const cursors = new Map<string, Position>();
          const readers = new Map<string, number>();
          for (const peer of message.peers) {
            if (peer.x !== undefined && peer.y !== undefined) {
              cursors.set(peer.id, { x: peer.x, y: peer.y });
            }
            if (peer.frac !== undefined) readers.set(peer.id, peer.frac);
          }
          setCursors(cursors);
          setReaders(readers);
          break;
        }
        case "move":
          setCursors((current) =>
            new Map(current).set(message.id, { x: message.x, y: message.y }),
          );
          break;
        case "read":
          setReaders((current) =>
            new Map(current).set(message.id, message.frac),
          );
          break;
        case "tap": {
          const key = rippleKey.current++;
          setRipples((current) => [
            ...current,
            { key, peerId: message.id, x: message.x, y: message.y },
          ]);
          window.setTimeout(() => {
            setRipples((current) =>
              current.filter((ripple) => ripple.key !== key),
            );
          }, 900);
          break;
        }
        case "leave":
          setCursors((current) => without(current, message.id));
          setReaders((current) => without(current, message.id));
          break;
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [socket]);

  if (!socket) return null;

  const peerById = new Map(peers.map((peer) => [peer.id, peer]));

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      {[...cursors].map(([id, position]) => {
        const peer = peerById.get(id);
        if (!peer) return null;
        return (
          <RemoteCursor
            key={id}
            peer={peer}
            target={position}
            hidden={peer.viewing != null}
          />
        );
      })}
      {[...readers].map(([id, frac]) => {
        const peer = peerById.get(id);
        if (!peer) return null;
        return (
          <span
            key={id}
            className={styles.reader}
            style={{
              transform: `translate3d(0, ${frac * height}px, 0)`,
              color: peer.color,
            }}
          />
        );
      })}
      {ripples.map((ripple) => {
        const peer = peerById.get(ripple.peerId);
        if (!peer) return null;
        return (
          <span
            key={ripple.key}
            className={styles.ripple}
            style={{
              left: `calc(50% + ${ripple.x}px)`,
              top: ripple.y,
              color: peer.color,
            }}
          />
        );
      })}
      <GhostTrails trails={trails} alone={peers.length === 0} />
    </div>
  );
}

function without<V>(map: Map<string, V>, id: string) {
  const next = new Map(map);
  next.delete(id);
  return next;
}

interface RemoteCursorProps {
  peer: Peer;
  target: Position;
  hidden: boolean;
}

function RemoteCursor({ peer, target, hidden }: RemoteCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const position = { ...targetRef.current };
    element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;

    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const ease = reduceMotion ? 1 : 1 - Math.exp((last - now) / 90);
      last = now;
      position.x += (targetRef.current.x - position.x) * ease;
      position.y += (targetRef.current.y - position.y) * ease;
      element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} className={styles.cursor} data-hidden={hidden || undefined}>
      <CursorArrow color={peer.color} className={styles.arrow} />
      <span className={styles.cursorLabel} style={{ background: peer.color }}>
        {peer.name}
      </span>
    </div>
  );
}

const GHOST_REPLAYS = 3;
const GHOST_MIN_AGE = 60 * 1000;

function GhostTrails({ trails, alone }: { trails: Trail[]; alone: boolean }) {
  const [played, setPlayed] = useState(0);
  const [current, setCurrent] = useState<Trail | null>(null);

  // ghost trails replays
  useEffect(() => {
    if (current || !alone || played >= GHOST_REPLAYS) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(
      () => {
        const queue = trails
          .filter((trail) => Date.now() - trail.endedAt > GHOST_MIN_AGE)
          .slice(0, GHOST_REPLAYS);
        const next = queue[played];
        if (next) setCurrent(next);
        else setPlayed(GHOST_REPLAYS);
      },
      played === 0 ? 3000 : 5000,
    );
    return () => window.clearTimeout(timer);
  }, [current, alone, played, trails]);

  const handleDone = useCallback(() => {
    setCurrent(null);
    setPlayed((count) => count + 1);
  }, []);

  if (!current) return null;
  return <Ghost trail={current} onDone={handleDone} />;
}

const GHOST_FADE = 600;
const GHOST_MAX_GAP = 1000;
const GHOST_HOLD = 5000;
const GHOST_MAX_SPEED = 0.6; // px/ms
const GHOST_SMOOTHING = 220;
const GHOST_ARRIVE = 12; // px

function Ghost({ trail, onDone }: { trail: Trail; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setGhostViewing } = usePresence();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // nao ficar parado por muito tempo, nem se mover rapido demais
    const points = trail.points;
    const times = [0];
    for (let i = 1; i < points.length; i++) {
      const gap = Math.min(points[i][2] - points[i - 1][2], GHOST_MAX_GAP);
      const distance = Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      );
      times.push(times[i - 1] + Math.max(gap, distance / GHOST_MAX_SPEED));
    }

    const compress = (t: number) => {
      let i = 0;
      while (i < points.length - 1 && points[i + 1][2] <= t) i++;
      if (i >= points.length - 1) return times[times.length - 1];
      const span = points[i + 1][2] - points[i][2];
      const fraction = span > 0 ? Math.max((t - points[i][2]) / span, 0) : 0;
      return times[i] + fraction * (times[i + 1] - times[i]);
    };

    const holds = (trail.views ?? []).map(([slug, viewStart], index) => {
      const raw = compress(viewStart);
      return { slug, raw, at: raw + index * GHOST_HOLD };
    });

    const total =
      times[times.length - 1] + holds.length * GHOST_HOLD + GHOST_FADE;
    const start = performance.now();
    const position = { x: points[0][0], y: points[0][1] };
    let opacity = 0;
    let holding: string | null = null;
    let last = start;
    let segment = 0;

    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;

      let pointsTime = elapsed;
      let view: string | null = null;
      for (const hold of holds) {
        if (elapsed >= hold.at + GHOST_HOLD) pointsTime -= GHOST_HOLD;
        else if (elapsed >= hold.at) {
          view = hold.slug;
          pointsTime = hold.raw;
          break;
        } else break;
      }
      while (segment < times.length - 1 && times[segment + 1] <= pointsTime)
        segment++;

      const [x1, y1] = points[segment];
      const [x2, y2] = points[Math.min(segment + 1, points.length - 1)];
      const span =
        segment < times.length - 1 ? times[segment + 1] - times[segment] : 1;
      const progress = Math.min(
        Math.max((pointsTime - times[segment]) / span, 0),
        1,
      );
      const targetX = x1 + (x2 - x1) * progress;
      const targetY = y1 + (y2 - y1) * progress;

      const ease = 1 - Math.exp((last - now) / GHOST_SMOOTHING);
      last = now;
      position.x += (targetX - position.x) * ease;
      position.y += (targetY - position.y) * ease;

      const arrived =
        Math.hypot(targetX - position.x, targetY - position.y) < GHOST_ARRIVE;
      if (view !== holding && (view === null || arrived)) {
        holding = view;
        setGhostViewing(view);
      }

      const target = holding
        ? 0
        : Math.min(elapsed / GHOST_FADE, (total - elapsed) / GHOST_FADE, 0.75);
      opacity += (target - opacity) * ease;

      element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      element.style.opacity = String(opacity);

      if (elapsed >= total && opacity < 0.02) {
        onDone();
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
      setGhostViewing(null);
    };
  }, [trail, onDone, setGhostViewing]);

  return (
    <div ref={ref} className={styles.ghost}>
      <CursorArrow ghost className={styles.arrow} />
      <span className={styles.ghostLabel}>
        {trail.name}, {formatAgo(trail.endedAt)}
      </span>
    </div>
  );
}

function formatAgo(timestamp: number) {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / (60 * 24))}d ago`;
}
