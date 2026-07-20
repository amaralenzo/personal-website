import {
  routePartykitRequest,
  Server,
  type Connection,
  type WSMessage,
} from "partyserver";
import type { ClientMessage, Peer, Point, Trail, View } from "./protocol";
import { COLORS, NAMES } from "./protocol";

const TRAIL_MIN_POINTS = 24;
const TRAIL_MAX_POINTS = 200;
const TRAIL_MAX_VIEWS = 8;
const TRAIL_KEEP = 6;
const TRAIL_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_COORD = 20000;
const MAX_VIEW_EVENTS = 64;
const MAX_MESSAGES_PER_SECOND = 40;

interface ViewEvent {
  slug: string;
  start: number;
  end: number | null;
}

interface Env {
  Main: unknown;
}

export class PresenceServer extends Server<Env> {
  peers = new Map<string, Peer>();
  buffers = new Map<string, Point[]>();
  views = new Map<string, ViewEvent[]>();
  rates = new Map<string, { count: number; start: number }>();
  trails: Trail[] = [];

  async onStart() {
    this.trails = (await this.ctx.storage.get<Trail[]>("trails")) ?? [];
  }

  onConnect(connection: Connection) {
    const peer: Peer = {
      id: connection.id,
      color: this.nextColor(),
      name: this.nextName(),
      viewing: null,
    };
    this.peers.set(peer.id, peer);

    connection.send(
      JSON.stringify({
        type: "sync",
        peers: [...this.peers.values()].filter((p) => p.id !== peer.id),
        trails: this.freshTrails(),
      }),
    );
    this.broadcast(JSON.stringify({ type: "join", peer }), [peer.id]);
  }

  onMessage(sender: Connection, raw: WSMessage) {
    const peer = this.peers.get(sender.id);
    if (!peer || typeof raw !== "string" || raw.length > 256) return;
    if (!this.allowMessage(sender.id)) return;

    const message = parseMessage(raw);
    if (!message) return;
    switch (message.type) {
      case "move":
        peer.x = message.x;
        peer.y = message.y;
        if (!peer.viewing) this.record(sender.id, message.x, message.y);
        break;
      case "tap":
        break;
      case "read":
        peer.frac = message.frac;
        break;
      case "viewing": {
        if (
          message.slug &&
          typeof message.x === "number" &&
          typeof message.y === "number"
        ) {
          this.record(sender.id, message.x, message.y);
        }
        peer.viewing = message.slug;
        let events = this.views.get(sender.id);
        if (!events) {
          events = [];
          this.views.set(sender.id, events);
        }
        const open = events[events.length - 1];
        if (open && open.end === null) open.end = Date.now();
        if (message.slug) {
          events.push({ slug: message.slug, start: Date.now(), end: null });
          if (events.length > MAX_VIEW_EVENTS) events.shift();
        }
        break;
      }
      default:
        return;
    }
    this.broadcast(JSON.stringify({ ...message, id: sender.id }), [sender.id]);
  }

  async onClose(connection: Connection) {
    const saved = this.saveTrail(connection.id);
    this.peers.delete(connection.id);
    this.buffers.delete(connection.id);
    this.views.delete(connection.id);
    this.rates.delete(connection.id);
    this.broadcast(JSON.stringify({ type: "leave", id: connection.id }));
    await saved;
  }

  allowMessage(id: string) {
    const now = Date.now();
    const rate = this.rates.get(id);
    if (!rate || now - rate.start > 1000) {
      this.rates.set(id, { count: 1, start: now });
      return true;
    }
    return ++rate.count <= MAX_MESSAGES_PER_SECOND;
  }

  record(id: string, x: number, y: number) {
    let buffer = this.buffers.get(id);
    if (!buffer) {
      buffer = [];
      this.buffers.set(id, buffer);
    }
    buffer.push([x, y, Date.now()]);
    if (buffer.length > TRAIL_MAX_POINTS) buffer.shift();
  }

  saveTrail(id: string) {
    const points = this.buffers.get(id);
    if (!points || points.length < TRAIL_MIN_POINTS) return;

    const start = points[0][2];
    const endedAt = Date.now();
    const views = (this.views.get(id) ?? [])
      .map((view) => ({ ...view, end: view.end ?? endedAt }))
      .filter((view) => view.end > start)
      .slice(-TRAIL_MAX_VIEWS)
      .map((view): View => [
        view.slug,
        Math.max(view.start - start, 0),
        Math.min(view.end - start, endedAt - start),
      ]);

    const trail: Trail = {
      name: this.peers.get(id)?.name ?? this.randomName(),
      endedAt,
      points: points.map(([x, y, t]): Point => [x, y, t - start]),
      views,
    };
    this.trails = [trail, ...this.freshTrails()].slice(0, TRAIL_KEEP);
    return this.ctx.storage.put("trails", this.trails);
  }

  freshTrails() {
    const cutoff = Date.now() - TRAIL_MAX_AGE;
    return this.trails.filter((trail) => trail.endedAt > cutoff);
  }

  nextColor() {
    const used = new Set([...this.peers.values()].map((peer) => peer.color));
    return (
      COLORS.find((color) => !used.has(color)) ??
      COLORS[this.peers.size % COLORS.length]
    );
  }

  nextName() {
    const used = new Set([...this.peers.values()].map((peer) => peer.name));
    const available = NAMES.filter((name) => !used.has(name));
    return randomItem(available.length > 0 ? available : NAMES);
  }

  randomName() {
    return randomItem(NAMES);
  }
}

const worker = {
  async fetch(request: Request, env: Env) {
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    );
  },
};

export default worker;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function parseMessage(raw: string): ClientMessage | null {
  try {
    const message = JSON.parse(raw) as Record<string, unknown>;
    const coord = (value: unknown) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      Math.abs(value) <= MAX_COORD;

    if (
      (message.type === "move" || message.type === "tap") &&
      coord(message.x) &&
      coord(message.y)
    )
      return message as ClientMessage;

    if (
      message.type === "read" &&
      typeof message.frac === "number" &&
      message.frac >= 0 &&
      message.frac <= 1
    )
      return message as ClientMessage;

    if (
      message.type === "viewing" &&
      (message.slug === null || typeof message.slug === "string") &&
      ((message.x === undefined && message.y === undefined) ||
        (coord(message.x) && coord(message.y)))
    )
      return message as ClientMessage;
  } catch {}

  return null;
}
