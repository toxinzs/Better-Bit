import { Character, EventChoice, LifeEvent, PendingDecision, Relationship } from "../types";
import { registerDecision, finishDecision } from "./decisionQueue";
import { conditionDef } from "./mortality";
import { fillTokens } from "./conversations";
import { clamp } from "./util";

// The builders behind Character.decisions (see decisionQueue.ts). Each turns a
// small saved descriptor into a LifeEvent, and only commits its effects on the
// terminal choice so a reload mid-chain can never half-apply a decision.

const first = (r: Relationship) => r.name.split(" ")[0];
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const rel = (c: Character, id?: string) => c.relationships.find((x) => x.id === id);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// the people who'd be at the funeral with you
const MOURNERS = ["mother", "father", "sibling", "partner", "child"];
function mourners(c: Character, deceased: Relationship): Relationship[] {
  return c.relationships.filter((x) => x.alive && x.id !== deceased.id && MOURNERS.includes(x.type));
}
function shiftMourners(c: Character, deceased: Relationship, delta: number): void {
  mourners(c, deceased).forEach((m) => (m.level = clamp(m.level + delta)));
}

// ---------- funerals ----------

export type FuneralTier = {
  key: string;
  label: string;
  cost: number;
  happy: number;
  mourners: number;
  blurb: string;
  askEulogy: boolean;
};

export const FUNERAL_TIERS: FuneralTier[] = [
  { key: "county", label: "A simple county service", cost: 600, happy: 0, mourners: 0, blurb: "a short, simple service", askEulogy: true },
  { key: "cremation", label: "Cremation, with a small gathering", cost: 1500, happy: 2, mourners: 1, blurb: "a quiet cremation and a small gathering afterwards", askEulogy: true },
  { key: "traditional", label: "A traditional funeral and burial", cost: 9000, happy: 4, mourners: 4, blurb: "a traditional funeral and burial", askEulogy: true },
  { key: "lavish", label: "A lavish farewell", cost: 24000, happy: 6, mourners: 7, blurb: "a farewell people are still talking about", askEulogy: true },
];

registerDecision("funeral", (c, _world, d: PendingDecision) => {
  const r = rel(c, d.relId);
  if (!r) return null;
  const n = first(r);
  const age = Number(d.data?.age ?? 0);
  const cause = String(d.data?.cause ?? "natural causes");
  const estate = Number(d.data?.estate ?? 0);
  const toSpouse = !!d.data?.toSpouse;
  const survivor = c.relationships.find((x) => x.alive && (x.type === "mother" || x.type === "father") && x.id !== r.id);
  const adult = c.age >= 18;

  let result = "";
  const finish = (cc: Character) => finishDecision(cc, d.id);

  const inheritance = (cc: Character): string => {
    if (estate > 0) {
      cc.money += estate;
      return ` ${n}'s estate left you ${money(estate)}.`;
    }
    if (toSpouse && survivor) return ` ${n} left everything to ${first(survivor)}.`;
    return "";
  };

  const head: LifeEvent = {
    id: `funeral-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () =>
      adult
        ? `${r.name} has passed away at ${age}, of ${cause}. How do you want to lay ${fillTokens("{him}", r)} to rest?`
        : `${r.name} has passed away at ${age}. The family gathers to say goodbye.`,
    choices: [],
  };

  // ---- a kid at a funeral: no planning, just how they cope ----
  if (!adult) {
    head.choices = [
      {
        label: "Say a few words",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          cc.stats.happiness = clamp(cc.stats.happiness + 1);
          shiftMourners(cc, rr, 3);
          rr.funeral = "family service";
          result = `You said a few words about ${n}. Everyone hugged you afterwards.`;
          finish(cc);
        },
        resultText: () => result,
      },
      {
        label: "Stay close and hold a hand",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          shiftMourners(cc, rr, 5);
          rr.funeral = "family service";
          result = "You stayed close and quiet. It meant more than words would have.";
          finish(cc);
        },
        resultText: () => result,
      },
      {
        label: "Be too upset to go",
        tone: "danger",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          cc.stats.happiness = clamp(cc.stats.happiness - 2);
          shiftMourners(cc, rr, -4);
          rr.funeral = "family service";
          result = "You couldn't face it and stayed home. It's a decision you'll think about for a long time.";
          finish(cc);
        },
        resultText: () => result,
      },
    ];
    return head;
  }

  // ---- adults: planning and paying ----
  let picked: FuneralTier | null = null;

  const eulogy = (): LifeEvent => ({
    id: `eulogy-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `The service is about to begin. Do you want to say a few words about ${n}?`,
    choices: [
      { label: "Give a heartfelt eulogy", key: "heart", happy: 2, m: 3, line: `You gave a eulogy about ${n} that had the whole room in tears - and laughing.` },
      { label: "Read a short poem", key: "poem", happy: 1, m: 1, line: `You read a poem ${n} loved. It was simple and it was right.` },
      { label: "Stay silent - you can't find the words", key: "silent", happy: -1, m: 0, line: "You couldn't find the words, and that was okay. You stood there and let the day carry you." },
    ].map<EventChoice>((o) => ({
      label: o.label,
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        const tier = picked!;
        cc.money = Math.max(0, cc.money - tier.cost);
        cc.stats.happiness = clamp(cc.stats.happiness + tier.happy + o.happy);
        shiftMourners(cc, rr, tier.mourners + o.m);
        rr.funeral = tier.blurb;
        result = `You arranged ${tier.blurb} for ${n} (-${money(tier.cost)}). ${o.line}${inheritance(cc)}`;
        finish(cc);
      },
      resultText: () => result,
    })),
  });

  const stepOne: EventChoice[] = FUNERAL_TIERS.map((t) => ({
    label: t.label,
    sublabel: c.money < t.cost ? `${money(t.cost)} - can't afford` : money(t.cost),
    disabled: c.money < t.cost,
    effect: () => {
      picked = t; // nothing is committed until the eulogy step resolves
      return eulogy();
    },
  }));

  head.choices = [
    ...stepOne,
    {
      label: "Donate their body to science",
      sublabel: "Free - some of the family may be uneasy",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        cc.stats.happiness = clamp(cc.stats.happiness + 1);
        shiftMourners(cc, rr, -3);
        rr.funeral = "donated to science";
        result = `${n}'s body was donated to science. A small memorial was held instead. It felt like a meaningful last gift.${inheritance(cc)}`;
        finish(cc);
      },
      resultText: () => result,
    },
    {
      label: "Let the family handle it",
      sublabel: "Free - but they won't forget it",
      tone: "danger",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        cc.stats.happiness = clamp(cc.stats.happiness - 2);
        shiftMourners(cc, rr, -8);
        rr.funeral = "arranged by the family";
        result = `You left the arrangements to the rest of the family. They noticed.${inheritance(cc)}`;
        finish(cc);
      },
      resultText: () => result,
    },
  ];
  return head;
});

// ---------- a serious diagnosis ----------

registerDecision("crisis", (c, _world, d) => {
  const r = rel(c, d.relId);
  if (!r || !r.alive) return null;
  const def = conditionDef(String(d.data?.cond));
  if (!def) return null;
  const n = first(r);
  const cost = def.treatCost ?? 3000;
  const adult = c.age >= 18;
  let result = "";
  const done = (cc: Character) => finishDecision(cc, d.id);

  const choices: EventChoice[] = [
    {
      label: `Be there for ${n}`,
      sublabel: "Time, not money",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        rr.level = clamp(rr.level + 9);
        rr.favor = clamp((rr.favor ?? 50) + 5);
        cc.stats.happiness = clamp(cc.stats.happiness - 3);
        result = `You went to every appointment you could and sat with ${n} through the worst of it.`;
        done(cc);
      },
      resultText: () => result,
    },
  ];
  if (adult) {
    choices.push(
      {
        label: "Pay for the treatment",
        sublabel: c.money < cost ? `${money(cost)} - can't afford` : money(cost),
        disabled: c.money < cost,
        tone: "good",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          cc.money = Math.max(0, cc.money - cost);
          rr.treated = true;
          rr.health = clamp((rr.health ?? 50) + 8);
          rr.level = clamp(rr.level + 12);
          rr.favor = clamp((rr.favor ?? 50) + 10);
          result = `You paid for ${n}'s treatment (-${money(cost)}). The doctors are hopeful.`;
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Chip in for part of it",
        sublabel: money(Math.round(cost / 2 / 10) * 10),
        disabled: c.money < Math.round(cost / 2 / 10) * 10,
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          const half = Math.round(cost / 2 / 10) * 10;
          cc.money = Math.max(0, cc.money - half);
          rr.level = clamp(rr.level + 8);
          rr.favor = clamp((rr.favor ?? 50) + 6);
          if (Math.random() < 0.55) rr.treated = true;
          result = `You put in ${money(half)} towards ${n}'s treatment. Together with the family, it was enough to start.`;
          done(cc);
        },
        resultText: () => result,
      },
    );
  }
  choices.push(
    {
      label: "Send love from a distance",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        rr.level = clamp(rr.level + 2);
        result = `You sent ${n} messages and flowers. It's not the same as being there.`;
        done(cc);
      },
      resultText: () => result,
    },
    {
      label: "Keep your distance",
      tone: "danger",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        rr.level = clamp(rr.level - 8);
        cc.stats.happiness = clamp(cc.stats.happiness - 1);
        result = `You told yourself it wasn't your place. ${n} noticed you weren't around.`;
        done(cc);
      },
      resultText: () => result,
    },
  );

  return {
    id: `crisis-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `${r.name} has been diagnosed with ${def.label}. ${fillTokens("{He}", r)} is scared, and the family is looking to you.`,
    choices,
  };
});

// ---------- someone asks for money ----------

const REASONS = [
  "My car broke down and I can't get to work",
  "I'm a couple of months behind on rent",
  "There's a medical bill I wasn't expecting",
  "I'm starting a small business and I'm short",
  "It's just until payday, I swear",
  "My phone and laptop both died the same week",
  "I need a deposit on a new place",
  "I've got a family emergency",
];

registerDecision("request", (c, _world, d) => {
  const r = rel(c, d.relId);
  if (!r || !r.alive) return null;
  const n = first(r);
  const amount = Number(d.data?.amount ?? 300);
  const small = Math.max(50, Math.round(amount / 3 / 10) * 10);
  const reason = REASONS[hash(d.id) % REASONS.length];
  const family = r.type === "mother" || r.type === "father";
  let result = "";
  const done = (cc: Character) => finishDecision(cc, d.id);

  const gift = (amt: number, lvl: number, favor: number, lend: boolean): EventChoice["effect"] => (cc) => {
    const rr = rel(cc, d.relId) ?? r;
    cc.money = Math.max(0, cc.money - amt);
    rr.level = clamp(rr.level + lvl);
    rr.favor = clamp((rr.favor ?? 50) + favor);
    if (lend) rr.ledger = (rr.ledger ?? 0) + amt;
    rr.wealth = clamp((rr.wealth ?? 40) + Math.round(amt / 400));
    result = lend
      ? `You lent ${n} ${money(amt)}. ${n} promised to pay you back.`
      : `You gave ${n} ${money(amt)}. ${n} was really grateful.`;
    done(cc);
  };

  const choices: EventChoice[] = [
    {
      label: `Give ${money(amount)}`,
      sublabel: c.money < amount ? "can't afford" : "A gift",
      disabled: c.money < amount,
      effect: gift(amount, 7, 8, false),
      resultText: () => result,
    },
    ...(family
      ? []
      : [
          {
            label: `Lend ${money(amount)}`,
            sublabel: c.money < amount ? "can't afford" : "They'll owe you",
            disabled: c.money < amount,
            effect: gift(amount, 4, 4, true),
            resultText: () => result,
          } as EventChoice,
        ]),
    {
      label: `Give ${money(small)}`,
      sublabel: c.money < small ? "can't afford" : "What you can spare",
      disabled: c.money < small,
      effect: gift(small, 3, 3, false),
      resultText: () => result,
    },
    {
      label: "Say no",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        rr.level = clamp(rr.level - 4);
        rr.favor = clamp((rr.favor ?? 50) - 4);
        result = `You turned ${n} down. It was awkward.`;
        done(cc);
      },
      resultText: () => result,
    },
    {
      label: "Say no, and tell them to sort it out",
      tone: "danger",
      effect: (cc) => {
        const rr = rel(cc, d.relId) ?? r;
        rr.level = clamp(rr.level - 10);
        rr.favor = clamp((rr.favor ?? 50) - 9);
        cc.stats.happiness = clamp(cc.stats.happiness - 1);
        result = `You told ${n} to work it out on their own. They hung up.`;
        done(cc);
      },
      resultText: () => result,
    },
  ];

  return {
    id: `request-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `${n} calls with a favor to ask. "${reason}. Could you spare ${money(amount)}?"`,
    choices,
  };
});
