import { Appearance, Gender, RegionKey } from "../types";
import { getRegion } from "./regions";

// Looks are data: every choice the creator offers, and every value the
// avatar renderer understands, lives here.

export const HAIR_STYLES: { key: string; label: string }[] = [
  { key: "buzz", label: "Buzz cut" },
  { key: "short", label: "Short" },
  { key: "sidepart", label: "Side part" },
  { key: "curly", label: "Curly" },
  { key: "afro", label: "Afro" },
  { key: "long", label: "Long" },
  { key: "ponytail", label: "Ponytail" },
  { key: "bun", label: "Bun" },
  { key: "bob", label: "Bob" },
  { key: "braids", label: "Braids" },
  { key: "mohawk", label: "Mohawk" },
  { key: "bald", label: "Bald" },
];

export const HAIR_COLORS = ["#1a1210", "#3b2417", "#6b4226", "#a8681f", "#d9a441", "#b5442f", "#2b2b2b", "#8a8a8a"];
export const HAIR_COLOR_NAMES: Record<string, string> = {
  "#1a1210": "Black", "#3b2417": "Dark brown", "#6b4226": "Brown", "#a8681f": "Auburn",
  "#d9a441": "Blond", "#b5442f": "Ginger", "#2b2b2b": "Charcoal", "#8a8a8a": "Silver",
};

export const EYE_COLORS: Record<string, { label: string; hex: string }> = {
  brown: { label: "Brown", hex: "#5a3a22" },
  dark: { label: "Dark brown", hex: "#241a14" },
  hazel: { label: "Hazel", hex: "#8a6a2c" },
  green: { label: "Green", hex: "#3f8a55" },
  blue: { label: "Blue", hex: "#3a78c4" },
  grey: { label: "Grey", hex: "#7c8a98" },
};

export const FACIAL_HAIR: { key: string; label: string }[] = [
  { key: "none", label: "None" },
  { key: "stubble", label: "Stubble" },
  { key: "mustache", label: "Mustache" },
  { key: "goatee", label: "Goatee" },
  { key: "beard", label: "Beard" },
];

export const BUILDS: Appearance["build"][] = ["slim", "average", "stocky", "athletic"];
export const HEIGHTS: Appearance["height"][] = ["short", "average", "tall"];

// The full range of skin tones the creator offers, light to deep.
export const SKIN_TONES = ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#a86432", "#8d5524", "#5c3317", "#3d2314"];

function hashSeed(n: number): () => number {
  let a = (n >>> 0) + 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];

const STYLES_BY_GENDER: Record<Gender, string[]> = {
  male: ["buzz", "short", "short", "sidepart", "curly", "afro", "mohawk", "braids", "bald"],
  female: ["long", "long", "bob", "ponytail", "bun", "braids", "curly", "afro", "short", "sidepart"],
  nonbinary: ["short", "curly", "bob", "long", "bun", "afro", "sidepart", "braids", "buzz", "mohawk"],
};

// A whole face derived deterministically from a seed - used for the creation
// screen's "randomise", for people who aren't the player (their look never
// changes between renders), and to fill in older saves.
export function appearanceFromSeed(seed: number, gender: Gender, region?: RegionKey): Appearance {
  const r = hashSeed(seed);
  const palette = getRegion(region).skinTonePalette;
  const skin = r() < 0.15 ? pick(r, SKIN_TONES) : pick(r, palette);
  // dark hair is the most common everywhere; other colours are rarer, and lighter hair is much rarer for the deepest skin tones
  const deep = SKIN_TONES.indexOf(skin) >= 5;
  const hairColor = r() < (deep ? 0.93 : 0.6) ? pick(r, HAIR_COLORS.slice(0, 3).concat(["#2b2b2b"])) : pick(r, HAIR_COLORS.slice(3, 6));
  const eyeKeys = deep ? ["dark", "brown", "brown", "hazel"] : ["brown", "brown", "dark", "hazel", "green", "blue", "grey"];
  const male = gender === "male";
  return {
    skin,
    hairStyle: pick(r, STYLES_BY_GENDER[gender]),
    hairColor,
    eyes: pick(r, eyeKeys),
    facialHair: male ? pick(r, ["none", "none", "none", "stubble", "mustache", "goatee", "beard"]) : gender === "nonbinary" && r() < 0.15 ? "stubble" : "none",
    glasses: r() < 0.2,
    freckles: r() < 0.12 && !deep,
    build: pick(r, BUILDS),
    height: pick(r, HEIGHTS),
    balding: male && r() < 0.4 ? 30 + Math.floor(r() * 25) : 0,
  };
}
