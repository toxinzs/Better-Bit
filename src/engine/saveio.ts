import type { Character, WorldState } from "../types";

// Moving a life between devices or browsers: the save becomes a block of text you can copy
// and paste. Plain JSON wrapped in base64 so it survives chat apps and notes.

const PREFIX = "BB1:";
export type SavePayload = { character: Character; worldState: WorldState; screen: "home" | "gameover" };

const b64 = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
};
const unb64 = (s: string): string => {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export function encodeSave(p: SavePayload): string {
  return PREFIX + b64(JSON.stringify({ v: 1, ...p }));
}

export function decodeSave(text: string): { ok: true; payload: SavePayload } | { ok: false; error: string } {
  const t = text.trim().replace(/\s+/g, "");
  if (!t) return { ok: false, error: "Paste a save first." };
  try {
    const json = t.startsWith(PREFIX) ? unb64(t.slice(PREFIX.length)) : text.trim();
    const o = JSON.parse(json);
    const c = o?.character;
    if (!c || typeof c.firstName !== "string" || typeof c.age !== "number" || !c.stats || !Array.isArray(c.relationships)) {
      return { ok: false, error: "That doesn't look like a Better Bit save." };
    }
    return { ok: true, payload: { character: c, worldState: o.worldState ?? undefined, screen: o.screen === "gameover" ? "gameover" : "home" } };
  } catch {
    return { ok: false, error: "That save is damaged or incomplete. Copy it again in full." };
  }
}
