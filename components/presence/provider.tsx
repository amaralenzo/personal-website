"use client";

import { usePathname } from "next/navigation";
import type PartySocket from "partysocket";
import usePartySocket from "partysocket/react";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ClientMessage, Peer, ServerMessage, Trail } from "@/party/protocol";

const HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
  (process.env.NODE_ENV === "development" ? "localhost:1999" : null);

interface Presence {
  socket: PartySocket | null;
  peers: Peer[];
  trails: Trail[];
  ghostViewing: string | null;
  setGhostViewing: (slug: string | null) => void;
  setViewing: (slug: string | null, at?: { x: number; y: number }) => void;
}

const PresenceContext = createContext<Presence>({
  socket: null,
  peers: [],
  trails: [],
  ghostViewing: null,
  setGhostViewing: () => {},
  setViewing: () => {},
});

export const usePresence = () => use(PresenceContext);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  if (!HOST) return children;
  return <ConnectedPresenceProvider host={HOST}>{children}</ConnectedPresenceProvider>;
}

function ConnectedPresenceProvider({
  host,
  children,
}: {
  host: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [ghostViewing, setGhostViewing] = useState<string | null>(null);

  const socket = usePartySocket({
    host,
    room: pathname === "/" ? "home" : pathname.slice(1).replace(/\//g, "-"),
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ServerMessage;
      switch (message.type) {
        case "sync":
          setPeers(message.peers);
          setTrails(message.trails);
          break;
        case "join":
          setPeers((current) => [
            ...current.filter((peer) => peer.id !== message.peer.id),
            message.peer,
          ]);
          break;
        case "leave":
          setPeers((current) => current.filter((peer) => peer.id !== message.id));
          break;
        case "viewing":
          setPeers((current) =>
            current.map((peer) =>
              peer.id === message.id ? { ...peer, viewing: message.slug } : peer,
            ),
          );
          break;
      }
    },
  });

  useInputBroadcast(socket);

  const setViewing = useCallback(
    (slug: string | null, at?: { x: number; y: number }) => {
      const message: ClientMessage = at
        ? { type: "viewing", slug, x: centerOffset(at.x), y: Math.round(at.y) }
        : { type: "viewing", slug };
      socket.send(JSON.stringify(message));
    },
    [socket],
  );

  const presence = useMemo(
    () => ({ socket, peers, trails, ghostViewing, setGhostViewing, setViewing }),
    [socket, peers, trails, ghostViewing, setViewing],
  );

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

function centerOffset(pageX: number) {
  return Math.round(pageX - document.documentElement.clientWidth / 2);
}

function useInputBroadcast(socket: PartySocket) {
  useEffect(() => {
    const send = (message: ClientMessage) => socket.send(JSON.stringify(message));

    if (window.matchMedia("(pointer: fine)").matches) {
      const onMove = throttle((event: MouseEvent) => {
        send({ type: "move", x: centerOffset(event.pageX), y: Math.round(event.pageY) });
      }, 50);
      window.addEventListener("mousemove", onMove);
      return () => {
        window.removeEventListener("mousemove", onMove);
        onMove.cancel();
      };
    }

    const onClick = (event: MouseEvent) => {
      send({ type: "tap", x: centerOffset(event.pageX), y: Math.round(event.pageY) });
    };
    const onScroll = throttle(() => {
      const middle = window.scrollY + window.innerHeight / 2;
      const frac = middle / document.documentElement.scrollHeight;
      send({ type: "read", frac: Math.round(frac * 1000) / 1000 });
    }, 200);

    window.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      onScroll.cancel();
    };
  }, [socket]);
}

function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let last = 0;
  let timer: number | undefined;
  return Object.assign(
    (...args: A) => {
      const wait = last + ms - Date.now();
      window.clearTimeout(timer);
      if (wait <= 0) {
        last = Date.now();
        fn(...args);
        return;
      }
      timer = window.setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, wait);
    },
    { cancel: () => window.clearTimeout(timer) },
  );
}
