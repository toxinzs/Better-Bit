import { Character, LifeEvent, Relationship, WorldState } from "../types";
import { Venue, MINOR_VENUES, ADULT_VENUES, MINOR_DATE_VENUES, PARTY_VENUES, SLEEPOVER_MINOR, SLEEPOVER_ADULT } from "../data/outings";
import { MIN_AGE_CONVERSATION } from "./lifeStage";
import { ageOf, uid } from "./people";
import { buildTalkEvent, categoryOf, dim, fillTokens, hasScene } from "./conversations";
import { buildGiftEvent } from "./gifts";
import { clamp, randomInt } from "./util";

// Everything you can do with a person from their sheet. `actionsFor()` is the
// pure catalog the UI renders (available / used up / locked, with a reason);
// `runPersonAction()` performs one. Adult-only options are gated here with
// hardcoded age checks - never by a region's consent age.

export type ActionKey =
  | "talk" | "spendTime" | "goOut" | "party" | "sleepover" | "gift" | "giveMoney" | "askMoney"
  | "holdHands" | "firstKiss" | "askOut" | "breakUp";

export type ActionCategory = "Connect" | "Outings" | "Money" | "Romance";

export type ActionDef = {
  key: ActionKey;
  label: string;
  icon: string; // an Ionicons name
  cat: ActionCategory;
  state: "available" | "capped" | "locked";
  reason?: string; // why it's locked
  used: number;
  cap: number;
};

const CAPS: Record<ActionKey, number> = {
  talk: 3, spendTime: 3, goOut: 2, party: 1, sleepover: 2, gift: 3, giveMoney: 3, askMoney: 2,
  holdHands: 1, firstKiss: 1, askOut: 1, breakUp: 1,
};

// ---------- age & romance gates (hardcoded) ----------

export function bothAdults(c: Character, r: Relationship): boolean {
  return c.age >= 18 && ageOf(c, r) >= 18;
}

// Who may start a romance: adults with adults, or teens (13-17) with
// classmate-age peers (within a year, also 13-17). Never across the 18 line.
export function romanceAllowed(c: Character, r: Relationship): boolean {
  const a = c.age;
  const b = ageOf(c, r);
  if (a >= 18 && b >= 18) return true;
  return a >= 13 && a < 18 && b >= 13 && b < 18 && Math.abs(a - b) <= 1;
}

function hasPartner(c: Character): boolean {
  return c.relationships.some((r) => r.type === "partner" && r.alive);
}

// Classmates and friends you could start something with right now.
export function romanceCandidates(c: Character): Relationship[] {
  if (hasPartner(c)) return [];
  return c.relationships
    .filter((r) => r.alive && (r.type === "classmate" || r.type === "friend") && !r.blocked && romanceAllowed(c, r))
    .sort((a, b) => b.level - a.level || a.id.localeCompare(b.id));
}

// ---------- yearly counters ----------

export function usedThisYear(c: Character, r: Relationship, key: ActionKey): number {
  return r.yr && r.yr.age === c.age ? r.yr.n[key] ?? 0 : 0;
}

function bump(c: Character, r: Relationship, key: ActionKey): void {
  if (!r.yr || r.yr.age !== c.age) r.yr = { age: c.age, n: {} };
  r.yr.n[key] = (r.yr.n[key] ?? 0) + 1;
}

// ---------- money limits ----------

// The most they could spare if you asked (hidden wealth, age and relation).
export function askCeiling(c: Character, r: Relationship): number {
  const age = ageOf(c, r);
  if (age < 18) return 40 + (r.wealth ?? 10);
  const w = r.wealth ?? 40;
  const mult = r.type === "mother" || r.type === "father" ? 1.4 : r.type === "friend" ? 0.7 : 1;
  return Math.max(50, Math.round(((150 + w * w * 2.4) * mult) / 10) * 10);
}

// The odds an ask goes through (0-1). The UI only ever shows this as a word.
export function askChance(c: Character, r: Relationship, amount: number): number {
  const cap = askCeiling(c, r);
  const ratio = amount / cap;
  const owed = Math.max(0, -(r.ledger ?? 0));
  let p = 0.28 + (r.favor ?? 50) / 220 + r.level / 260 - ratio * 0.55 - Math.min(0.3, (owed / cap) * 0.5);
  if (c.age < 18 && (r.type === "mother" || r.type === "father")) p += 0.12;
  if (ratio > 1) p *= 0.2;
  return clamp(p, 0.03, 0.9);
}

export function giveCeiling(c: Character): number {
  return Math.max(0, Math.floor(c.money));
}

// ---------- the catalog ----------

const first = (r: Relationship) => r.name.split(" ")[0];

function contactBlocked(r: Relationship): string | null {
  if (r.blocked) return "Contact is blocked";
  if (r.status === "estranged") return "You're estranged";
  if (r.status === "placed") return "They're not in your life right now";
  return null;
}

function lockFor(c: Character, r: Relationship, key: ActionKey): string | null {
  const blocked = contactBlocked(r);
  const theirAge = ageOf(c, r);
  const adultPair = bothAdults(c, r);
  switch (key) {
    case "talk":
      if (blocked) return blocked;
      if (c.age < MIN_AGE_CONVERSATION || theirAge < 3) return "Too young to chat";
      return hasScene(c, r) ? null : "Nothing to say right now";
    case "spendTime":
      return blocked;
    case "goOut":
      if (blocked) return blocked;
      if (c.age < 8) return "Too young";
      if (theirAge < 6) return "They're too little";
      if (r.type === "teacher" || r.type === "ex") return "Not an option";
      return null;
    case "party":
      if (blocked) return blocked;
      if (!adultPair) return "Adults only";
      if (!["friend", "sibling", "partner", "coworker"].includes(r.type)) return "Not an option";
      return null;
    case "sleepover":
      if (blocked) return blocked;
      if (!["friend", "sibling"].includes(r.type)) return "Not an option";
      if (c.age < 6 || theirAge < 6) return "Too young";
      // never across the age-18 line
      if ((c.age >= 18) !== (theirAge >= 18)) return "Not an option";
      return null;
    case "gift":
      if (blocked) return blocked;
      if (c.age < 8) return "Too young";
      if (r.type === "teacher") return "Not an option";
      return null;
    case "giveMoney":
      if (blocked) return blocked;
      if (c.age < 10) return "Too young";
      if (c.money < 1) return "You're broke";
      if (r.type === "teacher") return "Not an option";
      return null;
    case "askMoney":
      if (blocked) return blocked;
      if (c.age < 10) return "Too young";
      if (c.age < 18 && !["mother", "father", "sibling"].includes(r.type)) return "Ask a parent";
      if (!["mother", "father", "sibling", "friend", "partner"].includes(r.type)) return "Not an option";
      return null;
    case "holdHands":
      if (r.type !== "partner" || adultPair || r.kissed) return "n/a";
      if (!romanceAllowed(c, r) && c.age >= 18) return "n/a";
      if ((r.dates ?? 0) < 1) return "Go on a date first";
      if (r.level < 45) return "Get closer first";
      return null;
    case "firstKiss":
      if (r.type !== "partner" || adultPair || r.kissed) return "n/a";
      if ((r.dates ?? 0) < 2) return "A couple of dates first";
      if (r.level < 60) return "Get closer first";
      return null;
    case "askOut":
      if (!["classmate", "friend"].includes(r.type)) return "n/a";
      if (hasPartner(c)) return "You're already seeing someone";
      if (!romanceAllowed(c, r)) return "n/a";
      return blocked;
    case "breakUp":
      return r.type === "partner" ? null : "n/a";
  }
}

const META: Record<ActionKey, { label: string; icon: string; cat: ActionCategory }> = {
  talk: { label: "Talk", icon: "chatbubbles", cat: "Connect" },
  spendTime: { label: "Spend Time", icon: "time", cat: "Connect" },
  goOut: { label: "Go Out", icon: "ticket", cat: "Outings" },
  party: { label: "Party", icon: "musical-notes", cat: "Outings" },
  sleepover: { label: "Sleepover", icon: "moon", cat: "Outings" },
  gift: { label: "Give a Gift", icon: "gift", cat: "Money" },
  giveMoney: { label: "Give Money", icon: "cash", cat: "Money" },
  askMoney: { label: "Ask for Money", icon: "wallet", cat: "Money" },
  holdHands: { label: "Hold Hands", icon: "heart-half", cat: "Romance" },
  firstKiss: { label: "First Kiss", icon: "heart", cat: "Romance" },
  askOut: { label: "Ask Out", icon: "heart-circle", cat: "Romance" },
  breakUp: { label: "Break Up", icon: "heart-dislike", cat: "Romance" },
};

const ORDER: ActionKey[] = [
  "talk", "spendTime", "goOut", "party", "sleepover", "gift", "giveMoney", "askMoney",
  "askOut", "holdHands", "firstKiss", "breakUp",
];

export function actionsFor(c: Character, r: Relationship): ActionDef[] {
  if (!r.alive) return [];
  const out: ActionDef[] = [];
  for (const key of ORDER) {
    const reason = lockFor(c, r, key);
    if (reason === "n/a") continue; // doesn't apply to this person at all
    const used = usedThisYear(c, r, key);
    const cap = CAPS[key];
    const meta = META[key];
    // "Go Out" reads as a date when the person is a partner
    const label = key === "goOut" && r.type === "partner" ? "Go on a Date" : meta.label;
    out.push({
      key,
      label,
      icon: meta.icon,
      cat: meta.cat,
      state: reason ? "locked" : used >= cap && key !== "breakUp" ? "capped" : "available",
      reason: reason ?? undefined,
      used,
      cap,
    });
  }
  return out;
}

// ---------- shared helpers ----------

const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function bond(r: Relationship, delta: number): string {
  return `(${sign(delta)} bond)`;
}

function venueEvent(c: Character, r: Relationship, key: ActionKey, prompt: string, venues: Venue[]): LifeEvent {
  const usedBefore = usedThisYear(c, r, key);
  let result = "";
  const list = venues.filter((v) => !v.partnerOnly || r.type === "partner");
  return {
    id: uid("out"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    text: () => prompt,
    logText: () => "",
    choices: [
      ...list.map((v) => ({
        label: v.name,
        sublabel: v.cost > 0 ? money(v.cost) : "Free",
        disabled: c.money < v.cost,
        effect: (cc: Character) => {
          // resolve-time character (the store copies it after the popup opens)
          c = cc;
          r = cc.relationships.find((x) => x.id === r.id) ?? r;
          bump(c, r, key);
          c.money -= v.cost;
          const meh = Math.random() < 0.18;
          const mult = dim(usedBefore) * (meh ? 0.5 : 1);
          const lvl = Math.max(1, Math.round(randomInt(v.lvl[0], v.lvl[1]) * mult));
          const hap = Math.max(1, Math.round(randomInt(v.hap[0], v.hap[1]) * (meh ? 0.5 : 1)));
          r.level = clamp(r.level + lvl);
          c.stats.happiness = clamp(c.stats.happiness + hap);
          if (v.health) c.stats.health = clamp(c.stats.health + v.health);
          if (r.type === "partner") r.dates = (r.dates ?? 0) + 1;
          result = `${meh ? v.meh : v.blurb}  ${bond(r, lvl)}${v.cost > 0 ? ` (-${money(v.cost)})` : ""}`;
        },
        resultText: () => result,
      })),
      { label: "Never mind", effect: () => {} },
    ],
  };
}

function confirmBreakUp(c: Character, r: Relationship): LifeEvent {
  const first_ = first(r);
  const married = !!r.married;
  let result = "";
  const end = (kind: "kind" | "blunt") => (cc: Character) => {
    c = cc;
    r = cc.relationships.find((x) => x.id === r.id) ?? r;
    const wasMarried = r.married;
    r.type = "ex";
    r.married = false;
    r.engaged = false;
    r.dates = 0;
    r.level = clamp(r.level - (kind === "kind" ? 22 : 35));
    c.stats.happiness = clamp(c.stats.happiness - (kind === "kind" ? 6 : 9));
    let cost = 0;
    if (wasMarried) {
      cost = Math.min(Math.round(c.money * 0.25), 25000);
      c.money -= cost;
    }
    result = wasMarried
      ? `You and ${first_} divorced. It cost you ${money(cost)} and a lot of sleepless nights.`
      : kind === "kind"
        ? `You ended things with ${first_} as gently as you could. It still hurt, for both of you.`
        : `You told ${first_} it was over, with no cushioning. ${first_} didn't take it well. ${first_} is now an ex.`;
  };
  return {
    id: uid("breakup"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    text: () => (married ? `Divorce ${r.name}? This will cost you and can't be undone.` : `Break up with ${r.name}?`),
    logText: () => "",
    choices: [
      { label: married ? "File for divorce" : "End it kindly", tone: "danger", effect: end("kind"), resultText: () => result },
      ...(married ? [] : [{ label: "End it bluntly", tone: "danger" as const, effect: end("blunt"), resultText: () => result }]),
      { label: "Not now", effect: () => {} },
    ],
  };
}

const TIME_LINES: Record<string, string[]> = {
  parent: ["You helped around the house and chatted over tea.", "You watched a show together, sharing snacks.", "You took a long drive together with the windows down."],
  sibling: ["You and {n} just hung around and did nothing, which was the point.", "You built something ridiculous together.", "You raided the fridge together at midnight."],
  friend: ["You hung out with {n}, talking about everything and nothing.", "You and {n} wasted a whole afternoon and loved it.", "You and {n} went on an impromptu adventure."],
  partner: ["You spent a quiet evening at home with {n}.", "You and {n} cooked dinner together.", "You and {n} stayed in and did absolutely nothing."],
  child: ["You played together for hours.", "You read to {n} until {he} fell asleep.", "You and {n} did a puzzle on the floor."],
  other: ["You spent time with {n}.", "You and {n} caught up for a while."],
};

// ---------- the actions ----------

export function runPersonAction(
  c: Character,
  _world: WorldState,
  relId: string,
  key: ActionKey,
  amount?: number,
): LifeEvent | null {
  const r = c.relationships.find((x) => x.id === relId && x.alive);
  if (!r) return null;
  const reason = lockFor(c, r, key);
  if (reason) {
    c.yearLog.push(reason === "n/a" ? "That isn't possible." : `${reason}.`);
    return null;
  }
  if (key !== "breakUp" && usedThisYear(c, r, key) >= CAPS[key]) {
    c.yearLog.push(`You've done plenty of that with ${first(r)} this year - give it some time.`);
    return null;
  }
  const n = first(r);
  const used = usedThisYear(c, r, key);

  switch (key) {
    case "talk": {
      const ev = buildTalkEvent(c, r, used);
      if (ev) bump(c, r, "talk");
      return ev;
    }
    case "spendTime": {
      bump(c, r, "spendTime");
      const lvl = Math.max(1, Math.round(6 * dim(used)));
      r.level = clamp(r.level + lvl);
      c.stats.happiness = clamp(c.stats.happiness + 2);
      const cat = categoryOf(r) ?? "other";
      const pool = TIME_LINES[cat === "parent" ? "parent" : cat] ?? TIME_LINES.other;
      c.yearLog.push(`${fillTokens(pool[randomInt(0, pool.length - 1)], r)}  ${bond(r, lvl)}`);
      return null;
    }
    case "goOut": {
      const teen = c.age < 18 || ageOf(c, r) < 18;
      const venues = teen ? [...MINOR_VENUES, ...(r.type === "partner" ? MINOR_DATE_VENUES : [])] : ADULT_VENUES;
      return venueEvent(c, r, "goOut", r.type === "partner" ? `Where do you want to take ${n}?` : `Where do you and ${n} want to go?`, venues);
    }
    case "party":
      return venueEvent(c, r, "party", `What kind of night out do you and ${n} want?`, PARTY_VENUES);
    case "sleepover": {
      const minors = c.age < 18;
      return venueEvent(c, r, "sleepover", minors ? `What's the plan for the sleepover with ${n}?` : `${n} is staying over. What's the plan?`, minors ? SLEEPOVER_MINOR : SLEEPOVER_ADULT);
    }
    case "gift":
      return buildGiftEvent(c, r, () => bump(c, r, "gift"));
    case "giveMoney": {
      const amt = Math.floor(amount ?? 0);
      if (!(amt >= 1) || amt > c.money) {
        c.yearLog.push("You can't give that amount.");
        return null;
      }
      bump(c, r, "giveMoney");
      const ratio = amt / Math.max(50, askCeiling(c, r));
      const lvl = Math.max(1, Math.round(clamp(2 + ratio * 20, 1, 12) * dim(used)));
      c.money -= amt;
      r.level = clamp(r.level + lvl);
      r.favor = clamp((r.favor ?? 50) + Math.round(1 + ratio * 10));
      c.stats.happiness = clamp(c.stats.happiness + 2);
      let extra = "";
      if ((r.ledger ?? 0) < 0) {
        r.ledger = Math.min(0, (r.ledger ?? 0) + amt);
        extra = r.ledger === 0 ? ` That settles what you owed ${n}.` : ` You still owe ${n} ${money(-(r.ledger ?? 0))}.`;
      }
      c.yearLog.push(`You gave ${n} ${money(amt)}. ${ratio > 0.25 ? "That means a lot." : "Kind of you."}${extra}  ${bond(r, lvl)}`);
      return null;
    }
    case "askMoney": {
      const amt = Math.floor(amount ?? 0);
      const cap = askCeiling(c, r);
      if (!(amt >= 1)) {
        c.yearLog.push("You didn't ask for anything.");
        return null;
      }
      bump(c, r, "askMoney");
      const ratio = amt / cap;
      if (Math.random() < askChance(c, r, amt)) {
        c.money += amt;
        r.level = clamp(r.level - Math.round(ratio * 8));
        r.favor = clamp((r.favor ?? 50) - Math.round(ratio * 15));
        const family = r.type === "mother" || r.type === "father";
        if (!family || amt > 1500) r.ledger = (r.ledger ?? 0) - amt;
        c.yearLog.push(`${n} sent you ${money(amt)}.${!family || amt > 1500 ? ` You owe ${n} ${money(-(r.ledger ?? 0))} now.` : ""}`);
      } else {
        r.level = clamp(r.level - 3);
        r.favor = clamp((r.favor ?? 50) - 2);
        c.yearLog.push(`${n} turned you down. "Sorry - I can't right now."  ${bond(r, -3)}`);
      }
      return null;
    }
    case "holdHands": {
      bump(c, r, "holdHands");
      if (Math.random() < 0.82) {
        r.level = clamp(r.level + 8);
        c.stats.happiness = clamp(c.stats.happiness + 5);
        c.yearLog.push(`You held ${n}'s hand for the first time. Your palms were sweaty and neither of you said a word. ${bond(r, 8)}`);
      } else {
        r.level = clamp(r.level + 2);
        c.yearLog.push(`You reached for ${n}'s hand and missed completely. You both laughed. Next time. ${bond(r, 2)}`);
      }
      return null;
    }
    case "firstKiss": {
      bump(c, r, "firstKiss");
      if (Math.random() < 0.85) {
        r.kissed = true;
        r.level = clamp(r.level + 10);
        c.stats.happiness = clamp(c.stats.happiness + 8);
        c.yearLog.push(`You and ${n} shared your first kiss. It was short, a little clumsy and completely perfect. ${bond(r, 10)}`);
      } else {
        r.level = clamp(r.level + 1);
        c.yearLog.push(`The moment with ${n} passed before either of you could act. You both laughed it off.`);
      }
      return null;
    }
    case "askOut": {
      bump(c, r, "askOut");
      const p = clamp(0.25 + r.level / 200 + c.stats.looks / 500 + (r.favor ?? 50) / 400, 0.15, 0.8);
      if (Math.random() < p) {
        r.type = "partner";
        r.level = clamp(Math.max(r.level, 55) + 5);
        r.dates = 0;
        r.kissed = ageOf(c, r) >= 18 && c.age >= 18;
        c.stats.happiness = clamp(c.stats.happiness + 12);
        c.yearLog.push(`You asked ${n} out and ${fillTokens("{he}", r)} said yes! You're officially together.`);
      } else {
        r.level = clamp(r.level - 6);
        c.stats.happiness = clamp(c.stats.happiness - 4);
        c.yearLog.push(`You asked ${n} out. ${fillTokens("{He}", r)} said ${fillTokens("{he}", r)} just sees you as a friend. It stings. ${bond(r, -6)}`);
      }
      return null;
    }
    case "breakUp":
      return confirmBreakUp(c, r);
  }
}
