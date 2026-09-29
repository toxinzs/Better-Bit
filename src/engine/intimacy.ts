import { AdoptionKind, Bio, Character, EventChoice, LifeEvent, Pregnancy, Relationship } from "../types";
import { ageOf, addPerson, bioFor, uid } from "./people";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { fillTokens } from "./conversations";
import { randomFirstName } from "../data/names";
import { clamp, randomInt } from "./util";

// Adult intimacy, pregnancy and adoption. Everything in this file is gated on
// BOTH people being 18+ (a hardcoded rule, never a regional setting) and
// intimacy itself is fade-to-black text only.

const first = (r: Relationship) => r.name.split(" ")[0];
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const rel = (c: Character, id?: string) => c.relationships.find((x) => x.id === id);

export const ADULT_AGE = 18;

// ---------- fertility ----------

function ageCurve(bio: Bio, age: number): number {
  if (bio === "female") {
    if (age < 18) return 0;
    if (age <= 27) return 1;
    if (age <= 31) return 0.9;
    if (age <= 34) return 0.75;
    if (age <= 37) return 0.55;
    if (age <= 40) return 0.35;
    if (age <= 43) return 0.15;
    if (age <= 46) return 0.05;
    return 0.01;
  }
  if (age < 18) return 0;
  if (age <= 34) return 1;
  if (age <= 44) return 0.9;
  if (age <= 54) return 0.7;
  if (age <= 64) return 0.5;
  return 0.3;
}

// F = ageCurve x (0.35 + 0.65 x fertility/100) x (0.6 + 0.4 x health/100)
export function fertilityFactor(bio: Bio, age: number, fertility: number, health: number): number {
  return ageCurve(bio, age) * (0.35 + 0.65 * (fertility / 100)) * (0.6 + 0.4 * (health / 100));
}

export type Party = { bio: Bio; age: number; fertility: number; health: number; sterilized: boolean; onBC: boolean; id?: string };

export function playerParty(c: Character): Party {
  return {
    bio: c.bio ?? bioFor(c.gender, c.firstName),
    age: c.age,
    fertility: c.fertility ?? 60,
    health: c.stats.health,
    sterilized: !!c.sterilized,
    onBC: !!c.usingBirthControl,
  };
}

// About a third of adult women (biologically) partners are on birth control;
// decided once, deterministically, from their id.
function birthControlFor(r: Relationship, age: number): boolean {
  if (r.onBC !== undefined) return r.onBC;
  let h = 0;
  for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) >>> 0;
  r.onBC = (r.bio ?? "female") === "female" && age >= 18 && age <= 42 && h % 100 < 30;
  return r.onBC;
}

export function partnerParty(c: Character, r: Relationship): Party {
  const age = ageOf(c, r);
  return {
    bio: r.bio ?? bioFor(r.gender, r.id),
    age,
    fertility: r.fertility ?? 60,
    health: r.health ?? 80,
    sterilized: !!r.conditions?.includes("sterilized"),
    onBC: birthControlFor(r, age),
    id: r.id,
  };
}

export function bothAdults(c: Character, r: Relationship): boolean {
  return c.age >= ADULT_AGE && ageOf(c, r) >= ADULT_AGE;
}

// A baby is only possible between one biologically female and one male person,
// neither sterilized, when nobody is already expecting. (Everyone else builds a
// family through adoption or assisted conception.)
export function canConceive(c: Character, a: Party, b: Party): boolean {
  if (c.pregnancy) return false;
  if (a.bio === b.bio) return false;
  if (a.sterilized || b.sterilized) return false;
  return a.age >= ADULT_AGE && b.age >= ADULT_AGE;
}

// An adult couple who could conceive naturally right now.
export function couplePossible(c: Character, r: Relationship | undefined): r is Relationship {
  return !!r && r.type === "partner" && r.alive && bothAdults(c, r) && canConceive(c, playerParty(c), partnerParty(c, r));
}

export type Protection = "none" | "condom" | "bc" | "both" | "trying";

const PROTECTION_MULT: Record<Protection, number> = { none: 1, condom: 0.08, bc: 0.05, both: 0.01, trying: 1.8 };

export function conceptionChance(a: Party, b: Party, protection: Protection): number {
  const fa = fertilityFactor(a.bio, a.age, a.fertility, a.health);
  const fb = fertilityFactor(b.bio, b.age, b.fertility, b.health);
  return clamp(0.3 * fa * fb * PROTECTION_MULT[protection], 0, 0.6);
}

// ---------- making love (fade to black) ----------

const NIGHT_LINES = [
  "You and {n} spent the evening wrapped up in each other. Tender, unhurried, and exactly what you both needed.",
  "It was a quiet night in with {n}, and it ended better than either of you planned.",
  "You and {n} lost track of time. The rest of the world could wait.",
  "{n} pulled you close and the night went soft and slow from there.",
  "You and {n} stayed in, candles low, and reminded each other why you're together.",
  "The night with {n} was warm, playful and a little bit silly, the way it always is with the right person.",
];

const DECLINE_LINES = [
  "{n} wasn't in the mood tonight. You cuddled up and watched something instead.",
  "{n} was exhausted. You made tea and called it a night.",
];

export type LoveOutcome = { line: string; next?: LifeEvent };

// Runs one encounter with a partner. Returns the fade-to-black line and, when a
// pregnancy results, the reveal popup to chain.
export function makeLove(c: Character, r: Relationship, protection: Protection, dampen: number): LoveOutcome {
  const n = first(r);
  const willing = clamp(0.55 + (r.favor ?? 50) / 220 + r.level / 300, 0.3, 0.97);
  if (Math.random() > willing) {
    r.level = clamp(r.level + 1);
    return { line: fillTokens(DECLINE_LINES[randomInt(0, DECLINE_LINES.length - 1)], r) };
  }
  const bond = Math.max(1, Math.round(6 * dampen));
  r.level = clamp(r.level + bond);
  r.favor = clamp((r.favor ?? 50) + 4);
  c.stats.happiness = clamp(c.stats.happiness + 6);
  const line = `${fillTokens(NIGHT_LINES[randomInt(0, NIGHT_LINES.length - 1)], r)}  (+${bond} bond)`;

  const me = playerParty(c);
  const them = partnerParty(c, r);
  if (canConceive(c, me, them) && Math.random() < conceptionChance(me, them, protection)) {
    const carrier: "player" | "partner" = me.bio === "female" ? "player" : "partner";
    return { line, next: buildPregnancyEvent(c, r, carrier, n) };
  }
  return { line };
}

// ---------- the pregnancy reveal ----------

type Plan = "keep" | "adopt" | "end";

// When somebody else is carrying, the outcome is theirs to decide. What you say
// shifts the odds, and so do how close you are and how they feel about you.
function partnerDecides(r: Relationship, stance: "keep" | "support" | "adopt" | "notNow"): Plan {
  const close = r.level >= 55;
  const roll = Math.random();
  const shiftEnd = r.level < 45 ? 0.2 : 0;
  const table: Record<typeof stance, [number, number]> = {
    // [chance to keep, chance to place for adoption] - the remainder is ending it
    keep: [0.9 - shiftEnd, 0.05],
    support: [close ? 0.72 : 0.5, 0.15],
    adopt: [0.3, 0.55],
    notNow: [0.3, 0.2],
  };
  const [keep, adopt] = table[stance];
  if (roll < keep) return "keep";
  if (roll < keep + adopt) return "adopt";
  return "end";
}

export function startPregnancy(c: Character, p: Omit<Pregnancy, "conceivedAge">): void {
  c.pregnancy = { ...p, conceivedAge: c.age };
}

export function buildPregnancyEvent(c: Character, r: Relationship, carrier: "player" | "partner", n: string): LifeEvent {
  let result = "";
  const otherId = r.id;
  const begin = (cc: Character, plan: "keep" | "adopt") =>
    startPregnancy(cc, { carrier, carrierId: carrier === "partner" ? r.id : undefined, otherParentId: otherId, plan });

  // ---- you're carrying ----
  if (carrier === "player") {
    const choices: EventChoice[] = [
      {
        label: "Keep the baby",
        tone: "good",
        effect: (cc) => {
          const rr = rel(cc, otherId) ?? r;
          begin(cc, "keep");
          cc.stats.happiness = clamp(cc.stats.happiness + 10);
          rr.level = clamp(rr.level + (rr.level >= 50 ? 8 : 2));
          result = `You're keeping the baby. You told ${n}, who ${rr.level >= 50 ? "was thrilled" : "needed a few days to take it in"}. The baby arrives next year.`;
        },
        resultText: () => result,
      },
      {
        label: "Plan an adoption",
        effect: (cc) => {
          const rr = rel(cc, otherId) ?? r;
          begin(cc, "adopt");
          rr.level = clamp(rr.level - 3);
          cc.stats.happiness = clamp(cc.stats.happiness + 1);
          result = "You've decided to carry the baby and place them with a family who's ready. You'll decide what kind of contact you want after the birth.";
        },
        resultText: () => result,
      },
      {
        label: "Not right now",
        effect: (cc) => {
          const rr = rel(cc, otherId) ?? r;
          cc.stats.happiness = clamp(cc.stats.happiness - 8);
          rr.level = clamp(rr.level - 4);
          result = "You decided this wasn't the right time. It was a hard decision and you made it for your own reasons. The pregnancy did not continue.";
        },
        resultText: () => result,
      },
    ];
    return {
      id: uid("preg"),
      minAge: 0,
      maxAge: 999,
      who: r.id,
      logText: () => "",
      text: () => "You took a test. It's positive. You're pregnant.",
      choices,
    };
  }

  // ---- your partner is carrying ----
  const respond = (stance: "keep" | "support" | "adopt" | "notNow", said: string) => (cc: Character) => {
    const rr = rel(cc, otherId) ?? r;
    const plan = partnerDecides(rr, stance);
    if (plan === "end") {
      cc.stats.happiness = clamp(cc.stats.happiness - 6);
      rr.level = clamp(rr.level - 2);
      result = `${said} ${n} thought it over and decided this wasn't the right time. It was ${fillTokens("{his}", rr)} decision to make, and you respected it.`;
      return;
    }
    begin(cc, plan);
    const wanted = stance === "keep" ? "keep" : stance === "adopt" ? "adopt" : null;
    const opposed = wanted !== null && wanted !== plan;
    rr.level = clamp(rr.level + (opposed ? -8 : plan === "keep" ? 8 : 2));
    cc.stats.happiness = clamp(cc.stats.happiness + (plan === "keep" ? 10 : 2));
    result =
      plan === "keep"
        ? `${said} ${n} decided to keep the baby. You're going to be a parent - the baby arrives next year.`
        : `${said} ${n} decided to carry the baby and place them for adoption. You'll talk through what contact you want after the birth.`;
    if (opposed) result += ` It wasn't quite what you'd hoped for, and it caused some tension.`;
  };

  return {
    id: uid("preg"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `${n} takes a test and shows you: it's positive. ${n} is pregnant. ${n} looks at you. "What do you think?"`,
    choices: [
      { label: "\"I'm all in. Let's keep the baby.\"", tone: "good", effect: respond("keep", "You said you're all in."), resultText: () => result },
      { label: "\"I'm scared, but I'll support whatever you decide.\"", effect: respond("support", "You said you'd support whatever was decided."), resultText: () => result },
      { label: "\"Maybe adoption is the right answer.\"", effect: respond("adopt", "You raised adoption."), resultText: () => result },
      { label: "\"I don't think now is the right time.\"", tone: "danger", effect: respond("notNow", "You said now didn't feel like the right time."), resultText: () => result },
    ],
  };
}

// ---------- assisted conception / surrogacy ----------

export type ConceptionCarrier = "player" | "partner" | "surrogate";

// Who would carry the baby if you tried IVF/insemination/a donor.
export function assistedCarrier(c: Character, partner: Relationship | undefined, viaSurrogate: boolean): { carrier: ConceptionCarrier; r?: Relationship } | null {
  if (viaSurrogate) return { carrier: "surrogate", r: partner };
  const me = playerParty(c);
  if (me.bio === "female" && !me.sterilized) return { carrier: "player", r: partner };
  if (partner && bothAdults(c, partner)) {
    const them = partnerParty(c, partner);
    if (them.bio === "female" && !them.sterilized) return { carrier: "partner", r: partner };
  }
  return null;
}

// ---------- the year the baby arrives ----------

const BOY_GIRL = ["male", "female"] as const;

export function tickPregnancy(c: Character): void {
  const p = c.pregnancy;
  if (!p || c.age <= p.conceivedAge) return;
  c.pregnancy = undefined;
  const other = rel(c, p.otherParentId);
  const carrierRel = p.carrier === "partner" ? rel(c, p.carrierId) : undefined;
  const carrierAge = p.carrier === "player" ? c.age : carrierRel ? ageOf(c, carrierRel) : 30;

  // a loss is rare but real
  const loss = p.carrier === "surrogate" ? 0.03 : 0.07 + (carrierAge >= 35 ? 0.08 : 0) + (p.carrier === "player" && c.stats.health < 40 ? 0.05 : 0);
  if (Math.random() < loss) {
    c.stats.happiness = clamp(c.stats.happiness - 14);
    c.griefYears = Math.max(c.griefYears ?? 0, 1);
    if (other) other.level = clamp(other.level + 3);
    c.yearLog.push(
      p.carrier === "player"
        ? "The pregnancy ended in a miscarriage. It's a loss that doesn't have a name in most people's vocabulary, and you're allowed to grieve it."
        : `${carrierRel ? first(carrierRel) : "The surrogate"}'s pregnancy ended in a miscarriage. You're both heartbroken.`,
    );
    return;
  }

  const gender = BOY_GIRL[Math.random() < 0.5 ? 0 : 1];
  const baby = addPerson(c, {
    type: "child",
    age: 0,
    name: "Baby",
    gender,
    level: 80,
    fields: { coParent: other?.id },
  });

  if (p.plan === "keep") {
    c.pendingBabyId = baby.id;
    c.stats.happiness = clamp(c.stats.happiness + 15);
    c.yearLog.push(
      p.carrier === "player"
        ? "Your baby was born!"
        : p.carrier === "surrogate"
          ? "Your baby was born through your surrogate, healthy and loud!"
          : `${carrierRel ? first(carrierRel) : "Your partner"} gave birth to your baby!`,
    );
    return;
  }

  // placed for adoption: a decision about what kind of contact to keep
  const name = `${randomFirstName(gender, c.originRegion)} ${c.lastName}`;
  baby.name = name;
  baby.status = "placed";
  c.yearLog.push("Your baby was born. You've chosen adoption, and now comes the hardest part.");
  queueDecision(c, { kind: "adoption", relId: baby.id });
}

// ---------- adoption ----------

const ADOPTION_INFO: Record<AdoptionKind, { label: string; sub: string; level: number; line: string }> = {
  open: {
    label: "Open adoption",
    sub: "Letters, photos and visits",
    level: 60,
    line: "You chose an open adoption. You'll know the family and can stay part of the child's life.",
  },
  semiOpen: {
    label: "Semi-open adoption",
    sub: "Updates and photos through the agency",
    level: 45,
    line: "You chose a semi-open adoption. Updates and photos will reach you through the agency.",
  },
  closed: {
    label: "Closed adoption",
    sub: "No contact - they may find you when they're grown",
    level: 30,
    line: "You chose a closed adoption. You won't know where the child is, and the door stays open if they ever come looking.",
  },
};

registerDecision("adoption", (c, _world, d) => {
  const child = rel(c, d.relId);
  if (!child) return null;
  let result = "";
  const pick = (kind: AdoptionKind): EventChoice => ({
    label: ADOPTION_INFO[kind].label,
    sublabel: ADOPTION_INFO[kind].sub,
    effect: (cc) => {
      const ch = rel(cc, d.relId) ?? child;
      ch.status = "placed";
      ch.adoption = { kind, age: cc.age };
      ch.level = ADOPTION_INFO[kind].level;
      ch.hidden = kind === "closed";
      cc.stats.happiness = clamp(cc.stats.happiness - 6);
      result = `${ADOPTION_INFO[kind].line} It's bittersweet - relief, grief and hope, all at once.`;
      finishDecision(cc, d.id);
    },
    resultText: () => result,
  });
  return {
    id: `adoption-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: undefined,
    logText: () => "",
    text: () => "Your baby has been born. You've chosen to place them with a family who's ready. What kind of adoption do you want?",
    choices: [pick("open"), pick("semiOpen"), pick("closed")],
  };
});

// A child placed for adoption, all grown up, sometimes comes looking.
registerDecision("reunion", (c, _world, d) => {
  const child = rel(c, d.relId);
  if (!child) return null;
  const n = first(child);
  let result = "";
  const done = (cc: Character) => finishDecision(cc, d.id);
  const age = ageOf(c, child);
  return {
    id: `reunion-${d.id}`,
    minAge: 0,
    maxAge: 999,
    logText: () => "",
    text: () =>
      `A letter arrives from ${child.name}, ${age}. "I think you might be my birth parent. I was placed for adoption and I've always wondered. I'd love to meet you, if you're open to it."`,
    choices: [
      {
        label: "Meet them",
        tone: "good",
        effect: (cc) => {
          const ch = rel(cc, d.relId) ?? child;
          ch.hidden = false;
          ch.status = "active";
          ch.level = 45;
          cc.stats.happiness = clamp(cc.stats.happiness + 12);
          result = `You met ${n}. There was a lot of crying and laughing, and a strange, immediate familiarity. It's the start of something.`;
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Write back, but keep your distance",
        effect: (cc) => {
          const ch = rel(cc, d.relId) ?? child;
          ch.hidden = false;
          ch.status = "placed";
          ch.adoption = { kind: "open", age: ch.adoption?.age ?? cc.age };
          ch.level = 30;
          cc.stats.happiness = clamp(cc.stats.happiness + 3);
          result = `You wrote back to ${n}. You're not ready to meet yet, but the door is open.`;
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Not ready yet",
        effect: (cc) => {
          cc.stats.happiness = clamp(cc.stats.happiness - 2);
          result = "You put the letter in a drawer. You're not ready, and that's allowed.";
          done(cc);
        },
        resultText: () => result,
      },
    ],
  };
});

export function tickAdoption(c: Character): void {
  for (const r of c.relationships) {
    if (!r.alive || r.type !== "child" || r.status !== "placed" || !r.adoption) continue;
    if (!r.hidden && r.adoption.kind === "open") continue; // already in touch
    if (ageOf(c, r) < 18) continue;
    if ((c.decisions ?? []).some((d) => d.kind === "reunion" && d.relId === r.id)) continue;
    if (Math.random() < 0.06) queueDecision(c, { kind: "reunion", relId: r.id });
  }
}

// ---------- contact with a child you placed ----------

export function writeToPlacedChild(c: Character, r: Relationship): string {
  const n = first(r);
  r.level = clamp(r.level + 6);
  c.stats.happiness = clamp(c.stats.happiness + 3);
  return `You wrote a long letter to ${n}. A reply came back a few weeks later, with a photo. (+6 bond)`;
}

export function visitPlacedChild(c: Character, r: Relationship): string {
  const n = first(r);
  c.money = Math.max(0, c.money - 150);
  r.level = clamp(r.level + 9);
  c.stats.happiness = clamp(c.stats.happiness + 6);
  return `You visited ${n} and the family. It hurt and it healed, in equal measure. (+9 bond, -${money(150)})`;
}
