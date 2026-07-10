export const COLORS = [
  "#4c7cf0",
  "#e05d55",
  "#3fa06a",
  "#9a63e0",
  "#df8f2d",
  "#d95fa4",
  "#2fa3a8",
] as const;

export const NAMES = [
  "Ash Ketchum",
  "Giovanni",
  "Stephen Holstrom",
  "Fiora",
  "Braum",
  "Claude",
  "Gippity",
  "Harrier Du Bois",
  "Kim Kitsuragi",
  "Drizzt Do'Urden",
  "Strahd",
  "Linus",
] as const;

export type Point = [x: number, y: number, t: number];

export interface Peer {
  id: string;
  color: string;
  name: string;
  viewing: string | null;
  x?: number;
  y?: number;
  frac?: number;
}

export type View = [slug: string, start: number, end: number];

export interface Trail {
  name: string;
  endedAt: number;
  points: Point[];
  views?: View[];
}

export type ClientMessage =
  | { type: "move"; x: number; y: number }
  | { type: "tap"; x: number; y: number }
  | { type: "read"; frac: number }
  | { type: "viewing"; slug: string | null; x?: number; y?: number };

export type ServerMessage =
  | { type: "sync"; peers: Peer[]; trails: Trail[] }
  | { type: "join"; peer: Peer }
  | { type: "leave"; id: string }
  | (ClientMessage & { id: string });
