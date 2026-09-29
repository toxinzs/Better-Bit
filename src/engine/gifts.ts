import { Character, LifeEvent, Relationship } from "../types";
import { Audience, GIFTS, GiftDef, TASTE_LABEL, TASTE_TAGS, TasteTag } from "../data/gifts";
import { ageOf, uid } from "./people";
import { clamp } from "./util";

// Gifts: ten offers per person per year (seeded by who + which year, so they
// rotate but are stable within a year) and each person has hidden tastes, so
// the best present changes with the person. You learn tastes by watching how
// they react - the picker then hints "they'd love this".

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(xs: T[], rng: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function audienceOf(age: number): Audience {
  if (age < 13) return "kid";
  if (age < 18) return "teen";
  if (age < 65) return "adult";
  return "senior";
}

export type Tastes = { likes: TasteTag[]; dislikes: TasteTag[] };

export function tastesFor(r: Relationship): Tastes {
  const rng = rngFrom(hash("taste:" + r.id));
  const tags = shuffled(TASTE_TAGS, rng);
  return { likes: tags.slice(0, 3), dislikes: tags.slice(3, 5) };
}

export type Pref = "loved" | "fine" | "disliked";

export function preferenceFor(r: Relationship, gift: GiftDef): Pref {
  const { likes, dislikes } = tastesFor(r);
  if (gift.tags.some((t) => likes.includes(t))) return "loved";
  if (gift.tags.some((t) => dislikes.includes(t))) return "disliked";
  return "fine";
}

// what the player has learned so far ("+tag" liked, "-tag" disliked)
export function hintFor(r: Relationship, gift: GiftDef): string | undefined {
  const known = r.likesKnown ?? [];
  if (gift.tags.some((t) => known.includes("+" + t))) return "they'd love this";
  if (gift.tags.some((t) => known.includes("-" + t))) return "not their thing";
  return undefined;
}

// Ten offers, mixed across price tiers to suit what the player can afford.
export function offersFor(c: Character, r: Relationship): GiftDef[] {
  const age = ageOf(c, r);
  const aud = audienceOf(age);
  const romanticOk = r.type === "partner";
  const eligible = GIFTS.filter((g) => g.aud.includes(aud) && (!g.romantic || romanticOk));
  const rng = rngFrom(hash(`offers:${r.id}:${c.age}`));
  const pool = shuffled(eligible, rng);

  const tier = (g: GiftDef) => (g.price <= 30 ? 0 : g.price <= 120 ? 1 : g.price <= 600 ? 2 : 3);
  const quota = c.money >= 5000 ? [2, 3, 3, 2] : c.money >= 200 ? [3, 3, 2, 1] : [5, 4, 1, 0];
  const picked: GiftDef[] = [];
  // partners always get a couple of romantic options in the mix
  if (romanticOk) {
    pool.filter((g) => g.romantic).slice(0, 2).forEach((g) => picked.push(g));
  }
  for (let t = 0; t < 4; t++) {
    const have = picked.filter((g) => tier(g) === t).length;
    pool
      .filter((g) => tier(g) === t && !picked.includes(g))
      .slice(0, Math.max(0, quota[t] - have))
      .forEach((g) => picked.push(g));
  }
  for (const g of pool) {
    if (picked.length >= 10) break;
    if (!picked.includes(g)) picked.push(g);
  }
  return picked.slice(0, 10).sort((a, b) => a.price - b.price);
}

function basePoints(price: number): number {
  return clamp(Math.round(2 + Math.log2(Math.max(price, 5) / 5) * 1.6), 2, 16);
}

const REPEAT_WINDOW_YEARS = 3;

export type GiftOutcome = { delta: number; pref: Pref; line: string };

export function giveGift(c: Character, r: Relationship, gift: GiftDef): GiftOutcome {
  c.money -= gift.price;
  const pref = preferenceFor(r, gift);
  const repeat = (r.giftLog ?? []).some((g) => g.item === gift.name && c.age - g.age < REPEAT_WINDOW_YEARS);
  const typeBoost = r.type === "partner" ? 1.1 : 1;
  const mult = (pref === "loved" ? 2 : pref === "disliked" ? 0.4 : 1) * (repeat ? 0.5 : 1) * typeBoost;
  const delta = Math.max(1, Math.round(basePoints(gift.price) * mult));
  r.level = clamp(r.level + delta);
  if (pref === "loved") r.favor = clamp((r.favor ?? 50) + Math.max(2, Math.round(basePoints(gift.price) / 2)));
  (r.giftLog ??= []).push({ age: c.age, item: gift.name });
  if (r.giftLog.length > 12) r.giftLog.shift();
  c.stats.happiness = clamp(c.stats.happiness + (pref === "loved" ? 3 : 1));

  // they teach you their tastes by reacting
  const known = (r.likesKnown ??= []);
  const learn = (sign: "+" | "-", tags: TasteTag[]) =>
    tags.forEach((t) => {
      if (!known.includes(sign + t)) known.push(sign + t);
    });
  const { likes, dislikes } = tastesFor(r);
  if (pref === "loved") learn("+", gift.tags.filter((t) => likes.includes(t)));
  if (pref === "disliked") learn("-", gift.tags.filter((t) => dislikes.includes(t)));

  const first = r.name.split(" ")[0];
  const why = (list: TasteTag[]) => gift.tags.find((t) => list.includes(t));
  const line =
    pref === "loved"
      ? `${first} absolutely loved the ${gift.name.toLowerCase()} - clearly they're into ${TASTE_LABEL[why(likes) ?? gift.tags[0]]}.`
      : pref === "disliked"
        ? `${first} thanked you for the ${gift.name.toLowerCase()}, but it wasn't really their thing.`
        : repeat
          ? `${first} smiled - a ${gift.name.toLowerCase()}, again, but it's the thought that counts.`
          : `${first} liked the ${gift.name.toLowerCase()}. Thoughtful!`;
  return { delta, pref, line };
}

// The picker, as a popup with one choice per offer.
export function buildGiftEvent(c: Character, r: Relationship, onGiven: () => void): LifeEvent {
  const offers = offersFor(c, r);
  let result = "";
  return {
    id: uid("gift"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    text: () => `What do you want to get ${r.name.split(" ")[0]}? These are what's available this year.`,
    logText: () => "",
    choices: [
      ...offers.map((g) => {
        const hint = hintFor(r, g);
        return {
          label: g.name,
          sublabel: `$${g.price.toLocaleString()}${hint ? " · " + hint : ""}`,
          disabled: c.money < g.price,
          tone: hint === "they'd love this" ? ("good" as const) : undefined,
          // use the character handed in at resolve time - the store swaps in a
          // fresh copy after this popup opened, so the `c` captured above can
          // be stale (money is a plain field on it)
          effect: (cc: Character) => {
            const out = giveGift(cc, cc.relationships.find((x) => x.id === r.id) ?? r, g);
            result = `${out.line}  (+${out.delta} bond, -$${g.price.toLocaleString()})`;
            onGiven();
          },
          resultText: () => result,
        };
      }),
      { label: "Never mind", effect: () => {} },
    ],
  };
}
