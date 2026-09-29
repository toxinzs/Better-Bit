import { Character, EventChoice, LifeEvent, Relationship } from "../types";
import { CrimeDef } from "../data/crimes";
import { EX_CALL_BAD, EX_CALL_GOOD, EX_TEXT_OPENERS, EX_TEXT_REPLIES_COLD, EX_TEXT_REPLIES_WARM, randomLine } from "../data/textLines";
import { pushMessage } from "./relationships";
import { ageOf, uid } from "./people";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { fillTokens } from "./conversations";
import { buildArrestEvent } from "./crime";
import { romanceAllowed } from "./romanceRules";
import { clamp, randomInt } from "./util";
import { easeStress, hasCondition } from "./health";

// Exes, obsession and restraining orders. Two hidden numbers drive it:
//  - YOUR sanity (Character.sanity, default 75; "craziness" = 100 - sanity):
//    stalking and spiralling wear it down, therapy rebuilds it, and the lower
//    it is the more your unwanted contact reads as a threat.
//  - THEIR craziness (derived from their id + traits, never stored): whether
//    a bitter ex ever starts harassing YOU.
// Options that imply anything sexual stay adult-only (18+, both of you).

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

// ---------- hidden stats ----------

export function adjustSanity(c: Character, delta: number): void {
  c.sanity = clamp((c.sanity ?? 75) + delta);
}

// 0-100, stable per person. Most people are settled; a small tail is volatile.
export function craziness(r: Relationship): number {
  const base = hash("crazy:" + r.id) % 100;
  let v = base < 70 ? Math.round(base * 0.5) : base < 90 ? 35 + Math.round((base - 70) * 1.5) : 65 + Math.round((base - 90) * 3.5);
  const t = r.traits ?? [];
  if (t.includes("dramatic")) v += 12;
  if (t.includes("stubborn")) v += 6;
  if (t.includes("grumpy")) v += 4;
  if (t.includes("romantic")) v += 5;
  if (t.includes("patient")) v -= 10;
  if (t.includes("warm")) v -= 8;
  return clamp(v);
}

export function bumpHarass(r: Relationship, n: number): void {
  r.harass = (r.harass ?? 0) + n;
}

// ---------- restraining orders ----------

export function orderActive(c: Character, r: Relationship): boolean {
  return !!r.order && r.order.untilAge > c.age;
}

// Why an action toward this person is off the table, if it is.
export function orderLock(c: Character, r: Relationship): string | null {
  if (!orderActive(c, r)) return null;
  if (r.order!.by === "you") return "You have an order against them";
  return r.order!.ignoring ? null : `Restraining order until ${r.order!.untilAge}`;
}

// You chose to ignore the order, and then reached out anyway.
export function isViolation(c: Character, r: Relationship): boolean {
  return orderActive(c, r) && r.order!.by === "them" && !!r.order!.ignoring;
}

const VIOLATION_CRIME: CrimeDef = {
  id: "order-violation",
  label: "violating a restraining order",
  tier: "moderate",
  minAge: 0,
  successBase: 0,
  rewardMin: 0,
  rewardMax: 0,
  sentenceMinYears: 0,
  sentenceMaxYears: 1,
  bailAmount: 1000,
};

export function violationArrest(c: Character, r: Relationship): LifeEvent {
  r.level = clamp(r.level - 20);
  bumpHarass(r, 2);
  adjustSanity(c, -3);
  c.yearLog.push(`You contacted ${first(r)} despite the restraining order. ${first(r)} called the police.`);
  return buildArrestEvent(VIOLATION_CRIME, c);
}

// ---------- everyday contact ----------

export function exText(c: Character, r: Relationship, dampen: number): string {
  const n = first(r);
  pushMessage(r, { text: randomLine(EX_TEXT_OPENERS), fromPlayer: true, age: c.age });
  const warm = Math.random() < 0.4 + r.level / 200 - (r.harass ?? 0) * 0.04;
  pushMessage(r, { text: randomLine(warm ? EX_TEXT_REPLIES_WARM : EX_TEXT_REPLIES_COLD), fromPlayer: false, age: c.age });
  const delta = warm ? Math.max(1, Math.round(5 * dampen)) : -3;
  r.level = clamp(r.level + delta);
  c.stats.happiness = clamp(c.stats.happiness + (warm ? 3 : -1));
  if (r.level < 30) bumpHarass(r, 1);
  return warm ? `You texted ${n} and ${fillTokens("{he}", r)} answered warmly. (+${delta} bond)` : `You texted ${n}. The reply was cold. (${delta} bond)`;
}

export function exCall(c: Character, r: Relationship, dampen: number): string {
  const n = first(r);
  const good = Math.random() < 0.35 + r.level / 150 - (r.harass ?? 0) * 0.04;
  const line = randomLine(good ? EX_CALL_GOOD : EX_CALL_BAD);
  pushMessage(r, { text: `📞 ${line}`, fromPlayer: false, age: c.age });
  const delta = good ? Math.max(1, Math.round(9 * dampen)) : -7;
  r.level = clamp(r.level + delta);
  c.stats.happiness = clamp(c.stats.happiness + (good ? 5 : -4));
  if (r.level < 30) bumpHarass(r, 1);
  return `You called ${n}. ${line}  (${delta > 0 ? "+" : ""}${delta} bond)`;
}

// Ask to get back together. Only where a romance between you two is allowed
// at your ages; you can't while you're with someone else.
export function askBack(c: Character, r: Relationship): string {
  const n = first(r);
  const p = clamp(0.08 + r.level / 160 + (r.favor ?? 50) / 300 - (r.harass ?? 0) * 0.05 - (r.incidents ?? 0) * 0.03, 0.02, 0.8);
  if (Math.random() < p) {
    r.type = "partner";
    r.level = clamp(Math.max(r.level, 55));
    r.dates = 0;
    r.kissed = true;
    r.harass = 0;
    r.incidents = 0;
    c.stats.happiness = clamp(c.stats.happiness + 14);
    return `You asked ${n} to try again, and ${fillTokens("{he}", r)} said yes. You're back together.`;
  }
  r.level = clamp(r.level - 4);
  c.stats.happiness = clamp(c.stats.happiness - 3);
  if (r.level < 30) bumpHarass(r, 1);
  return `${n} said no. "I don't think it's a good idea." It hurt. (-4 bond)`;
}

export function hasCurrentPartner(c: Character, except?: string): boolean {
  return c.relationships.some((x) => x.alive && x.type === "partner" && x.id !== except);
}

export function canAskBack(c: Character, r: Relationship): string | null {
  if (hasCurrentPartner(c, r.id)) return "You're with someone";
  if (!romanceAllowed(c, r)) return "n/a";
  return null;
}

// ---------- arguing (a real 3-way choice) ----------

export function buildArgueEvent(c: Character, r: Relationship): LifeEvent {
  const n = first(r);
  let result = "";
  const go = (fn: (cc: Character, rr: Relationship) => string): EventChoice["effect"] => (cc) => {
    const rr = rel(cc, r.id) ?? r;
    result = fn(cc, rr);
  };
  return {
    id: uid("argue"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `You and ${n} end up arguing. It's been building for a while.`,
    choices: [
      {
        label: "Say what you really think",
        effect: go((cc, rr) => {
          rr.level = clamp(rr.level - 10);
          cc.stats.happiness = clamp(cc.stats.happiness + 3);
          adjustSanity(cc, -1);
          return `You said everything you'd been holding in. It felt good for a minute, and then it didn't. (-10 bond)`;
        }),
        resultText: () => result,
      },
      {
        label: "Try to talk it out calmly",
        tone: "good",
        effect: go((cc, rr) => {
          if (rr.level >= 25) {
            rr.level = clamp(rr.level + 5);
            cc.stats.happiness = clamp(cc.stats.happiness + 1);
            return `You kept your voice level and, for once, so did ${n}. Something eased. (+5 bond)`;
          }
          rr.level = clamp(rr.level - 2);
          return `You tried to stay calm, but ${n} wasn't interested in talking. (-2 bond)`;
        }),
        resultText: () => result,
      },
      {
        label: "Bring up everything from the past",
        tone: "danger",
        effect: go((cc, rr) => {
          rr.level = clamp(rr.level - 15);
          cc.stats.happiness = clamp(cc.stats.happiness - 3);
          adjustSanity(cc, -2);
          if (rr.level < 30) bumpHarass(rr, 1);
          return `You dragged every old grievance into it. ${n} hung up. (-15 bond)`;
        }),
        resultText: () => result,
      },
    ],
  };
}

// ---------- stalking (a 3-4 way choice, escalating) ----------

const SOCIAL_FINDS = [
  "{n} looks like {he}'s doing really well. Vacation photos, a new haircut, a big grin.",
  "You scrolled back through {n}'s photos for an hour and learned nothing you wanted to know.",
  "{n} seems to be seeing someone. You closed the app and didn't sleep much.",
  "{n} got a new job. Good for {him}. It doesn't feel good.",
  "There's a photo of you two, still up. You're not sure what that means.",
];

export function buildStalkEvent(c: Character, r: Relationship): LifeEvent {
  const n = first(r);
  const adult = c.age >= 18 && ageOf(c, r) >= 18;
  let result = "";
  const go = (fn: (cc: Character, rr: Relationship) => string): EventChoice["effect"] => (cc) => {
    const rr = rel(cc, r.id) ?? r;
    result = fn(cc, rr);
  };
  const choices: EventChoice[] = [
    {
      label: "Scroll their social media",
      sublabel: "Quiet, but it adds up",
      effect: go((cc, rr) => {
        adjustSanity(cc, -1);
        cc.stats.happiness = clamp(cc.stats.happiness - 2);
        if (rr.level < 30) bumpHarass(rr, 1);
        return fillTokens(SOCIAL_FINDS[randomInt(0, SOCIAL_FINDS.length - 1)], rr);
      }),
      resultText: () => result,
    },
  ];
  if (adult) {
    choices.push(
      {
        label: "Drive by their place",
        sublabel: "Risky",
        effect: go((cc, rr) => {
          adjustSanity(cc, -2);
          bumpHarass(rr, 2);
          if (Math.random() < 0.3) {
            rr.level = clamp(rr.level - 8);
            rr.incidents = (rr.incidents ?? 0) + 1;
            return `You drove past ${n}'s place twice. On the second pass, ${n}'s curtain twitched. You think you were seen. (-8 bond)`;
          }
          return `You drove past ${n}'s place and saw the lights on. You sat there a while, then drove home feeling worse.`;
        }),
        resultText: () => result,
      },
      {
        label: "Show up at their door",
        sublabel: "Very risky",
        tone: "danger",
        effect: go((cc, rr) => {
          adjustSanity(cc, -3);
          bumpHarass(rr, 3);
          rr.incidents = (rr.incidents ?? 0) + 1;
          if (Math.random() < 0.25) {
            rr.level = clamp(rr.level - 15);
            return `You showed up at ${n}'s door. ${n} called the police, who told you to leave and not come back. (-15 bond)`;
          }
          rr.level = clamp(rr.level - 12);
          return `You showed up at ${n}'s door. ${n} was furious and told you never to do that again. (-12 bond)`;
        }),
        resultText: () => result,
      },
    );
  } else {
    choices.push({
      label: "Ask a mutual friend what they're up to",
      effect: go((cc, rr) => {
        rr.level = clamp(rr.level - 1);
        return `You quizzed a mutual friend about ${n}. It got back to ${n}, who found it a bit much.`;
      }),
      resultText: () => result,
    });
  }
  choices.push({ label: "Close the app and leave it", tone: "good", effect: () => {} });
  return {
    id: uid("stalk"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `You can't stop thinking about ${n}. What do you do?`,
    choices,
  };
}

// ---------- sanity & therapy ----------

export const THERAPY_COST = 120;

export function seeTherapist(c: Character): void {
  if (c.money < THERAPY_COST) {
    c.yearLog.push("You couldn't afford a therapy session.");
    return;
  }
  c.money -= THERAPY_COST;
  adjustSanity(c, 8);
  c.stats.happiness = clamp(c.stats.happiness + 3);
  easeStress(c, 18);
  for (const key of ["depression", "anxiety"]) {
    if (hasCondition(c, key) && Math.random() < 0.35) {
      c.conditions = (c.conditions ?? []).filter((x) => x.key !== key);
      c.yearLog.push(`Therapy is working - you've come out the other side of ${key}.`);
    }
  }
  c.yearLog.push(`You saw a therapist and talked through what's been weighing on you. It helped. (-$${THERAPY_COST})`);
}

// sanity settles toward 72, and grief, jail and misery wear at it
export function tickSanity(c: Character): void {
  const s = c.sanity ?? 75;
  if (s < 72) adjustSanity(c, 1);
  else if (s > 78) adjustSanity(c, -1);
  if (c.inJail) adjustSanity(c, -3);
  if ((c.griefYears ?? 0) > 0) adjustSanity(c, -1);
  if (c.stats.happiness < 25) adjustSanity(c, -1);
}

// ---------- the yearly tick ----------

export function tickExes(c: Character): void {
  const sanity = c.sanity ?? 75;
  for (const r of c.relationships) {
    if (!r.alive || r.type !== "ex" || r.hidden) continue;

    // an order runs its course
    if (r.order && r.order.untilAge <= c.age) {
      c.yearLog.push(
        r.order.by === "them"
          ? `The restraining order ${first(r)} took out against you has expired.`
          : `The restraining order you took out against ${first(r)} has expired.`,
      );
      r.order = undefined;
    }

    // they go to the court if the contact has been relentless
    if (!r.order && (r.harass ?? 0) > 0) {
      const threat = (r.harass ?? 0) * (1 + Math.max(0, 60 - sanity) / 60);
      const p = clamp((threat - 4) * 0.12, 0, 0.9);
      if (Math.random() < p && !(c.decisions ?? []).some((d) => d.kind === "orderServed" && d.relId === r.id)) {
        queueDecision(c, { kind: "orderServed", relId: r.id });
      }
    }

    // a volatile ex, still bitter, may start on YOU
    if (!r.order && r.level < 40 && craziness(r) > 65 && Math.random() < 0.1 + (craziness(r) - 65) / 300) {
      if (!(c.decisions ?? []).some((d) => d.kind === "exHarassment" && d.relId === r.id)) {
        queueDecision(c, { kind: "exHarassment", relId: r.id });
      }
    }

    // an order you hold is not always respected
    if (r.order?.by === "you" && craziness(r) > 65 && Math.random() < 0.2) {
      c.yearLog.push(`${first(r)} violated the restraining order and was arrested.`);
      r.level = clamp(r.level - 5);
    }

    // the heat cools if you leave them alone
    r.harass = Math.floor((r.harass ?? 0) * 0.5);
    if (r.incidents) r.incidents = Math.max(0, r.incidents - (Math.random() < 0.4 ? 1 : 0));
  }
}

// ---------- decisions ----------

// They've filed against you.
registerDecision("orderServed", (c, _world, d) => {
  const r = rel(c, d.relId);
  if (!r || !r.alive) return null;
  const n = first(r);
  const years = 2 + ((r.incidents ?? 0) > 3 ? 2 : 0);
  let result = "";
  const done = (cc: Character) => finishDecision(cc, d.id);
  const issue = (cc: Character, rr: Relationship, ignoring: boolean) => {
    rr.order = { by: "them", untilAge: cc.age + years, ignoring };
    rr.harass = 0;
    rr.level = clamp(rr.level - 5);
  };
  const contest = (cost: number, win: number, label: string): EventChoice => ({
    label,
    sublabel: cost > 0 ? money(cost) : "Free",
    disabled: c.money < cost,
    effect: (cc) => {
      const rr = rel(cc, d.relId) ?? r;
      cc.money = Math.max(0, cc.money - cost);
      const chance = clamp(win - (rr.incidents ?? 0) * 0.05 - Math.max(0, 50 - (cc.sanity ?? 75)) / 400, 0.1, 0.85);
      if (Math.random() < chance) {
        rr.level = clamp(rr.level - 2);
        rr.harass = 0;
        cc.stats.happiness = clamp(cc.stats.happiness + 3);
        result = `You went to court and the judge threw the order out. It doesn't make things any warmer between you and ${n}. ${cost > 0 ? `(-${money(cost)})` : ""}`;
      } else {
        issue(cc, rr, false);
        cc.money = Math.max(0, cc.money - 300);
        cc.stats.happiness = clamp(cc.stats.happiness - 4);
        result = `The judge granted the order. You're barred from contacting ${n} until you're ${cc.age + years}, and court costs took another ${money(300)}.`;
      }
      done(cc);
    },
    resultText: () => result,
  });
  return {
    id: `order-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `A process server hands you court papers. ${n} has filed for a restraining order against you, citing repeated unwanted contact. What do you do?`,
    choices: [
      {
        label: "Comply and stay away",
        tone: "good",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          issue(cc, rr, false);
          cc.stats.happiness = clamp(cc.stats.happiness - 6);
          adjustSanity(cc, 1);
          result = `You didn't fight it. You're not to contact ${n} until you're ${cc.age + years}. It stings, but it's a clean line.`;
          done(cc);
        },
        resultText: () => result,
      },
      contest(0, 0.3, "Contest it with a public defender"),
      contest(2500, 0.6, "Hire a lawyer to fight it"),
      {
        label: "Write an apology letter",
        sublabel: r.level >= 15 ? "It might work" : "It's too late for that",
        disabled: r.level < 15,
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          if (Math.random() < 0.4) {
            rr.harass = 0;
            cc.stats.happiness = clamp(cc.stats.happiness + 2);
            result = `You wrote ${n} a sincere apology. ${n} withdrew the order. Don't waste the second chance.`;
          } else {
            issue(cc, rr, false);
            cc.stats.happiness = clamp(cc.stats.happiness - 4);
            result = `Your letter didn't change ${n}'s mind. The order stands until you're ${cc.age + years}.`;
          }
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Ignore it",
        sublabel: "Risky: any contact means arrest",
        tone: "danger",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          issue(cc, rr, true);
          cc.stats.happiness = clamp(cc.stats.happiness - 2);
          adjustSanity(cc, -2);
          result = `You tossed the papers on the counter. The order is in force anyway - if you contact ${n}, you'll be arrested.`;
          done(cc);
        },
        resultText: () => result,
      },
    ],
  };
});

// They've started harassing you.
registerDecision("exHarassment", (c, _world, d) => {
  const r = rel(c, d.relId);
  if (!r || !r.alive) return null;
  const n = first(r);
  const cost = 150;
  let result = "";
  const done = (cc: Character) => finishDecision(cc, d.id);
  const escalate = (cc: Character, rr: Relationship, text: string, health = 0) => {
    rr.incidents = (rr.incidents ?? 0) + 1;
    cc.stats.happiness = clamp(cc.stats.happiness - 4);
    adjustSanity(cc, -2);
    if (health) cc.stats.health = clamp(cc.stats.health - health);
    result = text;
  };
  return {
    id: `harass-${d.id}`,
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `${n} has been on your case: calls at all hours, messages that swing between pleading and furious, a car outside your place at night. It's getting to you.`,
    choices: [
      {
        label: "Ignore it and hope it stops",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          if (Math.random() < 0.4) result = `You gave ${n} nothing to work with, and eventually ${fillTokens("{he}", rr)} stopped.`;
          else escalate(cc, rr, `You ignored ${n}, but it didn't stop. If anything it got worse.`);
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Block them everywhere",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          rr.blocked = true;
          cc.stats.happiness = clamp(cc.stats.happiness - 1);
          if (Math.random() < 0.65) result = `You blocked ${n} on everything. The silence was a relief.`;
          else escalate(cc, rr, `You blocked ${n}, but ${fillTokens("{he}", rr)} found other ways to reach you.`);
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Confront them",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          if (Math.random() < 0.4) {
            rr.level = clamp(rr.level + 3);
            result = `You told ${n} clearly to stop. It landed. ${n} apologised and backed off.`;
          } else if (Math.random() < 0.15) {
            escalate(cc, rr, `You confronted ${n} and it turned ugly. You left with a bruise and a police report.`, 10);
          } else {
            escalate(cc, rr, `You confronted ${n}, and it only fed the fire.`);
          }
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "File a restraining order",
        sublabel: c.money < cost ? `${money(cost)} - can't afford` : `${money(cost)} filing fee`,
        disabled: c.money < cost,
        tone: "good",
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          cc.money = Math.max(0, cc.money - cost);
          const p = clamp(0.4 + (rr.incidents ?? 0) * 0.1, 0.3, 0.9);
          if (Math.random() < p) {
            rr.order = { by: "you", untilAge: cc.age + 3 };
            rr.harass = 0;
            cc.stats.happiness = clamp(cc.stats.happiness + 3);
            adjustSanity(cc, 2);
            result = `The judge granted your restraining order against ${n}. You'll be protected until you're ${cc.age + 3}.`;
          } else {
            cc.stats.happiness = clamp(cc.stats.happiness - 3);
            result = `The judge denied it - not enough evidence. Start keeping a log of every incident.`;
          }
          done(cc);
        },
        resultText: () => result,
      },
      {
        label: "Change numbers and move on",
        sublabel: money(400),
        disabled: c.money < 400,
        effect: (cc) => {
          const rr = rel(cc, d.relId) ?? r;
          cc.money = Math.max(0, cc.money - 400);
          rr.blocked = true;
          cc.stats.happiness = clamp(cc.stats.happiness - 2);
          adjustSanity(cc, 1);
          result = `You changed your numbers and cleaned up your accounts. ${n} lost track of you. (-${money(400)})`;
          done(cc);
        },
        resultText: () => result,
      },
    ] as EventChoice[],
  };
});
