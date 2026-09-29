import { Character, Gender, LifeEvent, Relationship } from "../types";
import { ConvCategory, Scene } from "../data/conversations/types";
import { FAMILY_SCENES } from "../data/conversations/family";
import { SOCIAL_SCENES } from "../data/conversations/social";
import { ageOf, uid } from "./people";
import { clamp } from "./util";

const SCENES: Scene[] = [...FAMILY_SCENES, ...SOCIAL_SCENES];

export function categoryOf(r: Relationship): ConvCategory | null {
  switch (r.type) {
    case "mother":
    case "father":
      return "parent";
    case "teacher":
      return null;
    default:
      return r.type as ConvCategory;
  }
}

const PRONOUNS: Record<Gender, { he: string; him: string; his: string; himself: string }> = {
  male: { he: "he", him: "him", his: "his", himself: "himself" },
  female: { he: "she", him: "her", his: "her", himself: "herself" },
  nonbinary: { he: "they", him: "them", his: "their", himself: "themself" },
};

// verbs that need to lose their -s when the subject becomes "they"
const THEY_VERBS: Record<string, string> = {
  was: "were", has: "have", is: "are", does: "do", "doesn't": "don't", "wasn't": "weren't", "isn't": "aren't", "hasn't": "haven't",
  says: "say", looks: "look", asks: "ask", needs: "need", wants: "want", tells: "tell", shows: "show", gets: "get",
  thinks: "think", mentions: "mention", takes: "take", keeps: "keep", knows: "know", seems: "seem", sounds: "sound",
  turns: "turn", goes: "go", comes: "come", sits: "sit", brings: "bring", makes: "make", stays: "stay",
};

function fixThey(s: string): string {
  return s
    .replace(/\b(They|they) ([a-z']+)/g, (m, they, verb) => `${they} ${THEY_VERBS[verb] ?? verb}`)
    .replace(/\b(They|they)'s\b/g, "$1're");
}

export function fillTokens(text: string, r: Relationship): string {
  const g = PRONOUNS[r.gender ?? "female"];
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
  let out = text
    .replace(/\{n\}/g, r.name.split(" ")[0])
    .replace(/\{He\}/g, cap(g.he))
    .replace(/\{he\}/g, g.he)
    .replace(/\{Him\}/g, cap(g.him))
    .replace(/\{him\}/g, g.him)
    .replace(/\{His\}/g, cap(g.his))
    .replace(/\{his\}/g, g.his)
    .replace(/\{himself\}/g, g.himself);
  if (r.gender === "nonbinary") out = fixThey(out);
  return out;
}

// how much a repeated interaction with the same person is worth
const DIMINISHING = [1, 0.75, 0.5, 0.3, 0.2];
export const dim = (usedBefore: number) => DIMINISHING[Math.min(usedBefore, DIMINISHING.length - 1)];

const SEEN_MEMORY = 30;

function fits(s: Scene, c: Character, r: Relationship, cat: ConvCategory): boolean {
  if (!s.who.includes(cat)) return false;
  if (s.age && (c.age < s.age[0] || c.age > s.age[1])) return false;
  const their = ageOf(c, r);
  if (s.theirAge && (their < s.theirAge[0] || their > s.theirAge[1])) return false;
  return true;
}

export function pickScene(c: Character, r: Relationship): Scene | undefined {
  const cat = categoryOf(r);
  if (!cat) return undefined;
  const all = SCENES.filter((s) => fits(s, c, r, cat));
  if (all.length === 0) return undefined;
  const seen = r.seen ?? [];
  const fresh = all.filter((s) => !seen.includes(s.id));
  const pool = fresh.length > 0 ? fresh : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function hasScene(c: Character, r: Relationship): boolean {
  return pickScene(c, r) !== undefined;
}

const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// A conversation as a popup: the scene, a few ways to answer, and effects on
// the bond (scaled down by how often you've already talked this year).
export function buildTalkEvent(c: Character, r: Relationship, usedBefore: number): LifeEvent | null {
  const scene = pickScene(c, r);
  if (!scene) return null;
  r.seen = [...(r.seen ?? []), scene.id].slice(-SEEN_MEMORY);
  const mult = dim(usedBefore);
  let result = "";
  return {
    id: uid("talk"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    text: () => fillTokens(scene.text, r),
    logText: () => "",
    choices: scene.choices.map((ch) => {
      const cost = ch.money && ch.money < 0 ? -ch.money : 0;
      return {
        label: fillTokens(ch.label, r),
        sublabel: cost > 0 ? `-$${cost}` : undefined,
        tone: ch.tone,
        disabled: cost > 0 && c.money < cost,
        effect: (cc: Character) => {
          r = cc.relationships.find((x) => x.id === r.id) ?? r;
          c = cc;
          const raw = ch.lvl ?? 0;
          const delta = raw > 0 ? Math.max(1, Math.round(raw * mult)) : raw;
          r.level = clamp(r.level + delta);
          if (ch.hap) c.stats.happiness = clamp(c.stats.happiness + ch.hap);
          if (ch.smarts) c.stats.smarts = clamp(c.stats.smarts + ch.smarts);
          if (ch.looks) c.stats.looks = clamp(c.stats.looks + ch.looks);
          if (ch.health) c.stats.health = clamp(c.stats.health + ch.health);
          if (ch.money) c.money = Math.max(0, c.money + ch.money);
          if (ch.favor) r.favor = clamp((r.favor ?? 50) + ch.favor);
          result = `${fillTokens(ch.result, r)}  (${sign(delta)} bond)`;
        },
        resultText: () => result,
      };
    }),
  };
}
