import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { livingIndex, inflation } from "../../engine/where";
import { partner } from "./helpers";
import { getRegion } from "../regions";

// A wedding you plan, in four steps: the kind of day, who's invited, what goes
// wrong, and the honeymoon. What you spend is scaled to where you live.

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const scale = (c: Character) => livingIndex(c.originRegion) * inflation(c);
const first = (c: Character) => partner(c)?.name.split(" ")[0] ?? "your partner";
const parents = (c: Character) => c.relationships.filter((r) => r.alive && (r.type === "mother" || r.type === "father"));
const traditional = (c: Character) => ["nigeria", "india", "japan", "southkorea", "mexico", "brazil"].includes(c.originRegion ?? "");

type Style = { key: string; label: string; cost: number; joy: number; bond: number; blurb: string };
const STYLES: Style[] = [
  { key: "registry", label: "Registry office", cost: 400, joy: 10, bond: 8, blurb: "Two witnesses, a form and lunch afterwards." },
  { key: "small", label: "Small, close and cosy", cost: 3500, joy: 16, bond: 11, blurb: "Thirty people, a garden and a home-made cake." },
  { key: "big", label: "A proper wedding", cost: 15000, joy: 22, bond: 14, blurb: "A hall, a band, a hundred guests and a dress." },
  { key: "lavish", label: "The wedding of the year", cost: 50000, joy: 28, bond: 16, blurb: "Marquee, fireworks, a string quartet and a rented castle." },
];

function marry(c: Character, bond: number): void {
  const p = partner(c);
  if (p) {
    p.married = true;
    p.engaged = false;
    p.level = clamp(p.level + bond);
  }
}

export function weddingPlanning(c: Character): LifeEvent {
  return {
    id: `wedding-plan-${c.age}`,
    minAge: 0,
    maxAge: 200,
    text: () => `You and ${first(c)} sit down to plan the wedding. ${traditional(c) ? "Both families have opinions, and they've already started telling you what they are. " : ""}What kind of day do you want?`,
    choices: STYLES.map((st) => {
      const cost = Math.round(st.cost * scale(c));
      return {
        label: st.label,
        sublabel: `${money(cost)} · ${st.blurb}`,
        disabled: c.money < cost,
        effect: (cc: Character) => {
          cc.money -= cost;
          return guestList(cc, st, cost);
        },
      };
    }),
  };
}

function guestList(c: Character, st: Style, cost: number): LifeEvent {
  return {
    id: `wedding-guests-${c.age}`,
    minAge: 0,
    maxAge: 200,
    text: () => `The guest list. ${st.key === "registry" ? "It'll be quick, but who do you tell?" : "Every name on it is a small negotiation."}`,
    choices: [
      { label: "Invite everyone who matters", sublabel: st.key === "registry" ? "" : `Costs a bit more (${money(cost * 0.15)})`, effect: (cc) => { if (st.key !== "registry") cc.money -= Math.round(cost * 0.15); for (const r of parents(cc)) r.level = clamp(r.level + 5); cc.network = clamp((cc.network ?? 0) + 3); return bigDay(cc, st, true); } },
      { label: "Keep it to a handful", effect: (cc) => { for (const r of parents(cc)) r.level = clamp(r.level - 3); return bigDay(cc, st, false); } },
      { label: "Just the two of you", effect: (cc) => { cc.money += Math.round(cost * 0.5); for (const r of parents(cc)) r.level = clamp(r.level - 10); return bigDay(cc, { ...st, joy: st.joy - 6 }, false); }, resultText: () => "Your families were hurt, and you were happy." },
    ],
  };
}

const MISHAPS = [
  "The rain started ten minutes before the ceremony.",
  "The caterer was an hour late.",
  "Your uncle's speech went on for twenty minutes.",
  "The ring bearer lost the ring. It was found in a shoe.",
  "The band's van broke down.",
  "The cake leaned, gently, and then more than gently.",
];

function bigDay(c: Character, st: Style, _guests: boolean): LifeEvent {
  const mishap = MISHAPS[randomInt(0, MISHAPS.length - 1)];
  return {
    id: `wedding-day-${c.age}`,
    minAge: 0,
    maxAge: 200,
    text: () => `The day arrives. ${mishap}`,
    choices: [
      { label: "Laugh it off", tone: "good", effect: (cc) => { marry(cc, st.bond + 3); changeStat(cc, "happiness", st.joy, "Your wedding"); return honeymoon(cc); }, resultText: () => "By the first dance nobody remembered." },
      { label: "Fix it, whatever it takes", effect: (cc) => { marry(cc, st.bond); cc.money -= Math.round(300 * scale(cc)); changeStat(cc, "happiness", st.joy - 3, "Your wedding"); cc.stress = clamp((cc.stress ?? 25) + 6); return honeymoon(cc); } },
      { label: "Let it get to you", effect: (cc) => { marry(cc, Math.max(4, st.bond - 4)); changeStat(cc, "happiness", Math.max(4, st.joy - 10), "Your wedding"); return honeymoon(cc); }, resultText: () => "You cried in the bathroom, then went back out." },
    ],
  };
}

function honeymoon(c: Character): LifeEvent {
  const region = getRegion(c.originRegion).label;
  const local = Math.round(900 * scale(c));
  const far = Math.round(5000 * scale(c));
  return {
    id: `wedding-honeymoon-${c.age}`,
    minAge: 0,
    maxAge: 200,
    text: () => `Married! ${first(c)} squeezes your hand. Where to for the honeymoon?`,
    choices: [
      { label: "A big trip abroad", sublabel: money(far), disabled: c.money < far, effect: (cc) => { cc.money -= far; const p = partner(cc); if (p) p.level = clamp(p.level + 8); changeStat(cc, "happiness", 12, "Honeymoon"); cc.stress = clamp((cc.stress ?? 25) - 10); }, resultText: () => "Two weeks you'll remember for the rest of your life." },
      { label: `A weekend in ${region}`, sublabel: money(local), disabled: c.money < local, effect: (cc) => { cc.money -= local; const p = partner(cc); if (p) p.level = clamp(p.level + 4); changeStat(cc, "happiness", 6, "Honeymoon"); }, resultText: () => "Sea air, room service and no plans." },
      { label: "Back to work on Monday", effect: (cc) => { changeStat(cc, "happiness", 1, "No honeymoon"); }, resultText: () => "Later, you promise. Some day." },
    ],
  };
}
