import { Character, NewsKind, Relationship, WorldState } from "../types";
import { AGE_MILESTONES, NEWS } from "../data/news";
import { CONDITIONS, ConditionDef, causeOfDeathFor, relativeDeathChance } from "./mortality";
import { PERSON_JOBS, ageOf, markDeceased } from "./people";
import { fillTokens } from "./conversations";
import { queueDecision } from "./decisionQueue";
import { hasActiveCondition } from "./worldState";
import { clamp, randomInt } from "./util";

// The yearly life of everybody around you: they age (derived from bornOffset),
// their health drifts, they develop conditions, change jobs, marry, have
// babies, drift away if you neglect them - and eventually die. What happens to
// them shows up in the "Around you" feed; the big moments (a serious diagnosis,
// a request for money, a death) come to you as decisions.

// "Around you" stays readable: at most this many non-death items a year (a
// serious diagnosis in the family may go a little over via `priority`).
const NEWS_BUDGET = 4;
const NEWS_BUDGET_PRIORITY = 6;

const first = (r: Relationship) => r.name.split(" ")[0];

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function addNews(c: Character, kind: NewsKind, r: Relationship | undefined, text: string, priority = false): boolean {
  const list = (c.yearNews ??= []);
  if (kind !== "death") {
    const used = list.filter((n) => n.kind !== "death").length;
    if (used >= (priority ? NEWS_BUDGET_PRIORITY : NEWS_BUDGET)) return false;
  }
  list.push({ kind, text, relId: r?.id });
  return true;
}

function say(template: string, r: Relationship, extra: { job?: string; cond?: string; age?: number } = {}): string {
  return fillTokens(
    template
      .replace(/\{job\}/g, extra.job ?? r.job ?? "worker")
      .replace(/\{cond\}/g, extra.cond ?? "an illness")
      .replace(/\{age\}/g, String(extra.age ?? "")),
    r,
  );
}

const sayAge = (template: string, r: Relationship, age: number) => say(template, r, { age });

// ---------- who gets a funeral ----------

export function needsFuneral(r: Relationship): boolean {
  if (["mother", "father", "partner", "child", "sibling", "grandchild"].includes(r.type)) return true;
  return r.type === "friend" && r.level >= 80;
}

// What they leave behind (hidden wealth squared, so it's lumpy). Parents' estates
// go to the surviving parent first; you inherit when the last one dies, split with
// your living siblings. A married partner's estate is yours.
export function estateFor(c: Character, r: Relationship): { amount: number; toSpouse: boolean } {
  const base = Math.round(((r.wealth ?? 30) ** 2 * 14) / 100) * 100;
  if (r.type === "mother" || r.type === "father") {
    const other = c.relationships.find((x) => x.alive && (x.type === "mother" || x.type === "father") && x.id !== r.id);
    if (other) return { amount: 0, toSpouse: true };
    const sibs = c.relationships.filter((x) => x.alive && x.type === "sibling").length;
    return { amount: Math.round(base / (1 + sibs) / 100) * 100, toSpouse: false };
  }
  if (r.type === "partner" && r.married) return { amount: base, toSpouse: false };
  return { amount: 0, toSpouse: false };
}

const GRIEF_BASE: Record<string, number> = {
  partner: 30, child: 35, grandchild: 25, mother: 22, father: 22, sibling: 18, friend: 10, coworker: 4, ex: 4,
};

// The single entry point for a person in your life dying: marks them
// deceased, hits your mood, writes the obituary line + news, and queues the
// funeral decision when it's someone you'd bury.
export function killRelative(c: Character, r: Relationship, cause: string, opts: { funeral?: boolean } = {}): void {
  if (!r.alive) return;
  const age = ageOf(c, r);
  const estate = estateFor(c, r);
  markDeceased(c, r, cause);

  const closeness = 0.5 + r.level / 100;
  const hit = Math.round((GRIEF_BASE[r.type] ?? 5) * closeness * (c.age < 6 ? 0.2 : 1));
  c.stats.happiness = clamp(c.stats.happiness - hit);
  if (hit >= 12) c.griefYears = Math.max(c.griefYears ?? 0, hit >= 25 ? 3 : 2);

  const line = `${r.name} passed away at ${age} of ${cause}.`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
  addNews(c, "death", r, `${first(r)} died at ${age}.`);

  if (opts.funeral !== false && needsFuneral(r)) {
    queueDecision(c, { kind: "funeral", relId: r.id, data: { cause, age, estate: estate.amount, toSpouse: estate.toSpouse } });
  }
}

// ---------- illness ----------

function onDiagnosis(c: Character, r: Relationship, d: ConditionDef): void {
  const close =
    ["mother", "father", "partner", "child", "sibling"].includes(r.type) || (r.type === "friend" && r.level >= 60);
  // minor conditions in distant people aren't worth a headline
  if (d.severe || (close && d.mortality > 1.4)) {
    addNews(c, "health", r, say(pick(NEWS.health.slice(0, 1)), r, { cond: d.label }), close);
  }
  if (d.severe && close && r.level >= 25) {
    queueDecision(c, { kind: "crisis", relId: r.id, data: { cond: d.key } });
  }
}

// ---------- the yearly tick ----------

const DRIFT: Record<string, number> = {
  friend: 3, coworker: 3, sibling: 2, mother: 1.5, father: 1.5, partner: 4, child: 1, grandchild: 1, ex: 2,
};

function previousYearActivity(c: Character, r: Relationship): number {
  if (!r.yr || r.yr.age !== c.age - 1) return 0;
  return Object.values(r.yr.n).reduce((a, b) => a + b, 0);
}

export function tickRelatives(c: Character, world: WorldState): void {
  const pandemic = hasActiveCondition(world, "pandemic");
  const people = c.relationships.filter((r) => r.alive && !r.hidden && r.type !== "teacher" && r.type !== "classmate");
  // random order so news isn't always about whoever was added first
  for (let i = people.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [people[i], people[j]] = [people[j], people[i]];
  }

  let requestQueued = false;
  const deaths: [Relationship, string][] = [];

  for (const r of people) {
    const age = ageOf(c, r);
    r.conditions ??= [];
    let health = r.health ?? 80;
    health += age >= 45 ? -randomInt(0, Math.ceil((age - 40) / 12)) : randomInt(0, 3);
    if (r.treated) health += 2;

    // new conditions
    for (const d of CONDITIONS) {
      if (age < d.minAge || r.conditions.includes(d.key)) continue;
      if (Math.random() < d.chance * (health < 50 ? 1.5 : 1)) {
        r.conditions.push(d.key);
        health -= d.healthHit;
        onDiagnosis(c, r, d);
      }
    }
    r.health = clamp(Math.round(health), 1, 100);

    // a treated serious illness sometimes goes into remission
    if (r.treated && r.conditions.some((k) => CONDITIONS.find((d) => d.key === k)?.severe) && Math.random() < 0.12) {
      r.conditions = r.conditions.filter((k) => !CONDITIONS.find((d) => d.key === k)?.severe);
      r.treated = false;
      r.health = clamp((r.health ?? 60) + 12);
      addNews(c, "health", r, `${first(r)} is in remission - good news.`);
    }

    // death
    if (Math.random() < relativeDeathChance(age, r.health, r.conditions, !!r.treated, pandemic)) {
      deaths.push([r, causeOfDeathFor(age, r.conditions)]);
      continue;
    }

    // neglect: a year with no contact lets the bond slip
    if (previousYearActivity(c, r) === 0 && r.status !== "estranged") {
      const drift = DRIFT[r.type] ?? 1;
      const amount = Math.round(drift * (0.6 + Math.random() * 0.8));
      const floor = ["mother", "father", "sibling", "child"].includes(r.type) ? 12 : 0;
      r.level = Math.max(floor, r.level - amount);
    }
    if (r.level < 20 && (r.type === "friend" || r.type === "coworker")) {
      r.lowYears = (r.lowYears ?? 0) + 1;
      if (r.lowYears >= 3 && r.status !== "distant") {
        r.status = "distant";
        addNews(c, "breakup", r, `You and ${first(r)} have lost touch.`);
      }
    } else {
      r.lowYears = 0;
    }

    // they repay what they owe you, in time
    if ((r.ledger ?? 0) > 0 && age >= 18 && Math.random() < 0.12) {
      const back = Math.max(10, Math.round(((r.ledger ?? 0) * (0.3 + Math.random() * 0.7)) / 10) * 10);
      const paid = Math.min(back, r.ledger ?? 0);
      r.ledger = (r.ledger ?? 0) - paid;
      c.money += paid;
      c.yearLog.push(`${first(r)} paid you back $${paid.toLocaleString()}.`);
    }

    // ---- news about their life ----
    // deterministic milestones for kids/siblings/grandkids
    if (["child", "sibling", "grandchild"].includes(r.type) && AGE_MILESTONES[age]) {
      addNews(c, "milestone", r, say(AGE_MILESTONES[age], r));
    }
    if (r.status !== "estranged" && age >= 18) {
      const adult = !["mother", "father"].includes(r.type) || age < 66;
      const working = !!r.job && !["Retired", "Student"].includes(r.job);
      if (age === 65 && working && Math.random() < 0.7) {
        r.job = "Retired";
        addNews(c, "retired", r, say(pick(NEWS.retired), r));
      } else if (age >= 20 && age < 65 && adult) {
        const roll = Math.random();
        if (roll < 0.03 && (working || r.job === "Between jobs")) {
          const job = pick(PERSON_JOBS);
          r.job = job;
          addNews(c, "job", r, say(pick(NEWS.job), r, { job: job.toLowerCase() }));
        } else if (roll < 0.05 && working) {
          r.wealth = clamp((r.wealth ?? 50) + 6);
          addNews(c, "promotion", r, say(pick(NEWS.promotion), r));
        } else if (roll < 0.065 && working) {
          r.job = "Between jobs";
          r.wealth = clamp((r.wealth ?? 50) - 10);
          addNews(c, "layoff", r, say(pick(NEWS.layoff), r));
        } else if (roll < 0.095 && !r.married && (r.type === "friend" || r.type === "sibling") && age >= 22 && age <= 44) {
          r.married = true;
          addNews(c, "wedding", r, say(pick(NEWS.wedding), r));
        } else if (roll < 0.13 && r.married && age >= 24 && age <= 40 && (r.type === "friend" || r.type === "sibling")) {
          addNews(c, "baby", r, say(pick(NEWS.baby), r));
        } else if (roll < 0.11 && (r.type === "friend" || r.type === "sibling" || r.type === "coworker")) {
          addNews(c, "move", r, say(pick(NEWS.move), r));
        } else if (roll < 0.165 && !r.married && (r.type === "friend" || r.type === "sibling") && age <= 50) {
          addNews(c, "breakup", r, say(pick(NEWS.breakup), r));
        } else if (roll < 0.19 && age % 10 === 0) {
          addNews(c, "milestone", r, sayAge(NEWS.milestone[0], r, age));
        }
      }
    }

    // ---- money requests from people who know you can spare it ----
    if (!requestQueued && c.age >= 18 && age >= 18 && c.money >= 200 && r.level >= 30 && !r.blocked && r.status === "active") {
      const eligible = ["friend", "sibling", "mother", "father", "child"].includes(r.type);
      const chance = 0.03 + ((r.wealth ?? 50) < 35 ? 0.03 : 0);
      if (eligible && Math.random() < chance) {
        const amount = Math.max(100, Math.round((randomInt(200, 2500) * (1.6 - (r.wealth ?? 50) / 100)) / 50) * 50);
        queueDecision(c, { kind: "request", relId: r.id, data: { amount } });
        requestQueued = true;
      }
    }
  }

  for (const [r, cause] of deaths) killRelative(c, r, cause);
}
