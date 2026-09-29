import { Character, Job, JobKind, LifeEvent, WorldState } from "../types";
import { getRegion, WorkAges } from "../data/regions";
import { ALL_JOBS, FULLTIME_JOBS, PARTTIME_JOBS } from "../data/jobs";
import { Humour, Interviewer, companyFor, hashKey, interviewerFor, rngFrom } from "../data/companies";
import { Ans, Cat, QUESTIONS, Question } from "../data/interviews";
import { GIGS, GigDef, gigDef } from "../data/gigs";
import { changeStat } from "./stats";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { effectiveSalary, hasActiveCondition, regionJobMultiplier } from "./worldState";
import { incomeTax } from "./taxes";
import { refreshCoworkers } from "./people";
import { traitMod } from "./character";
import { attendanceFactor, gainFitness } from "./health";
import { clamp, randomInt } from "./util";

// Finding, applying for and doing work: three separate kinds (part-time,
// full-time, gigs), real listings with generated companies, legal working ages
// by region, and an interview that scores how you answer.

export const MAX_APPS_PER_YEAR = 6;
export const REJECTION_COOLDOWN_YEARS = 3;

export type Listing = { key: string; job: Job; interviewer: Interviewer; difficulty: number };
export type Requirement = { label: string; met: boolean; note?: string };

const workAgesFor = (c: Character): WorkAges => getRegion(c.originRegion).workAge;
export const jobMinAge = (c: Character, job: Job): number => {
  const wa = workAgesFor(c);
  return Math.max(job.minAge, job.kind === "fulltime" ? wa.fulltime : wa.parttime);
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------- listings

function deterministicShuffle<T>(xs: T[], rng: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function difficultyFor(c: Character, job: Job, world?: WorldState): number {
  let d = 15 + (job.minSmarts ?? 0) * 0.5 + (job.requiresCollege ? 15 : 0) + Math.min(20, job.salary / 6000);
  if (job.company?.size === "Corporation") d += 10;
  else if (job.company?.size === "Large company") d += 5;
  if (world && hasActiveCondition(world, "recession")) d += 10;
  if (world && hasActiveCondition(world, "boom")) d -= 5;
  return Math.max(5, Math.min(98, Math.round(d)));
}

export function listingsFor(c: Character, world: WorldState, kind: JobKind): Listing[] {
  const pool = (kind === "parttime" ? PARTTIME_JOBS : FULLTIME_JOBS).filter((j) => c.age >= jobMinAge(c, j) - 1);
  const rng = rngFrom(hashKey(`${c.avatarSeed ?? 0}|${c.age}|${kind}`));
  const want = kind === "parttime" ? 8 : 12;
  return deterministicShuffle(pool, rng)
    .slice(0, want)
    .map((tpl) => {
      const seedKey = `${c.avatarSeed ?? 0}|${c.age}|${tpl.title}|${c.originRegion ?? "us"}`;
      const company = companyFor(tpl.field ?? "Office & Admin", c.originRegion, seedKey, tpl.title);
      const job: Job = { ...tpl, company };
      return { key: seedKey, job, interviewer: interviewerFor(company, c.originRegion, seedKey), difficulty: difficultyFor(c, job, world) };
    })
    .sort((a, b) => a.job.salary - b.job.salary);
}

// ---------------------------------------------------------------- requirements

const parentApproval = (c: Character): boolean => {
  const parents = c.relationships.filter((r) => r.alive && (r.type === "mother" || r.type === "father"));
  if (parents.length === 0) return true;
  return parents.some((p) => p.level >= 30);
};

export function requirements(c: Character, job: Job): Requirement[] {
  const wa = workAgesFor(c);
  const minAge = jobMinAge(c, job);
  const reqs: Requirement[] = [];
  reqs.push({ label: `Age ${minAge}+`, met: c.age >= minAge, note: job.kind === "fulltime" ? `Full-time work starts at ${wa.fulltime} here` : `Part-time work starts at ${wa.parttime} here` });
  if (job.minSmarts) reqs.push({ label: `Smarts ${job.minSmarts}+`, met: c.stats.smarts >= job.minSmarts, note: `Yours: ${Math.round(c.stats.smarts)}` });
  if (job.requiresCollege) reqs.push({ label: "College degree", met: c.hasCollegeDegree });
  if (job.requiresCleanRecord) reqs.push({ label: "Clean criminal record", met: !c.criminalRecord });
  if (job.minSkill) {
    const have = c.skills?.[job.minSkill.skill] ?? 0;
    reqs.push({ label: `${SKILL_LABEL[job.minSkill.skill]} skill ${job.minSkill.level}+`, met: have >= job.minSkill.level, note: `Yours: ${Math.round(have)}` });
  }
  if (job.kind === "parttime" && c.age < 18 && (c.age < 16 || c.educationStage !== "graduated")) {
    reqs.push({ label: "A parent's permission", met: parentApproval(c), note: "Under 16 you need a signed work permit" });
  }
  if (job.kind === "parttime" && (job.hours ?? 0) > 20 && c.age < 18 && c.educationStage !== "graduated") {
    reqs.push({ label: "Hours that fit around school", met: false, note: `${job.hours} hrs a week is too many while you're in school` });
  }
  return reqs;
}

const SKILL_LABEL: Record<string, string> = { music: "Music", singing: "Singing", art: "Art", martialArts: "Martial arts", acting: "Acting" };

export function canApply(c: Character, listing: Listing): { ok: boolean; reason?: string } {
  if (c.inJail) return { ok: false, reason: "You can't apply from behind bars." };
  if ((c.appsThisYear ?? 0) >= MAX_APPS_PER_YEAR) return { ok: false, reason: "You've sent as many applications as you can this year." };
  const bad = requirements(c, listing.job).find((r) => !r.met);
  if (bad) return { ok: false, reason: `You don't meet a requirement: ${bad.label}.` };
  const name = listing.job.company?.name;
  const rej = (c.rejections ?? []).find((r) => r.company === name && c.age - r.age < REJECTION_COOLDOWN_YEARS);
  if (rej) return { ok: false, reason: `${name} turned you down recently. Try again in ${REJECTION_COOLDOWN_YEARS - (c.age - rej.age)} year(s).` };
  const current = listing.job.kind === "parttime" ? c.partTime : c.job;
  if (current && current.title === listing.job.title && current.company?.name === name) return { ok: false, reason: "You already work there." };
  return { ok: true };
}

// ---------------------------------------------------------------- the interview

type Run = { total: number; picks: { q: Question; a: Ans; s: number }[] };

const LANDS_BASE: Record<Humour, number> = { goofy: 0.85, warm: 0.65, dry: 0.4, stern: 0.12 };

// How an answer scores for *you*, with this interviewer: its base score, moved
// by your personality; jokes live or die by the room; lies may be seen through.
function scoreAnswer(c: Character, a: Ans, iv: Interviewer): { s: number; note?: string } {
  let s = a[1];
  const traits = a[2];
  if (traits) for (const k of Object.keys(traits) as (keyof typeof traits)[]) s += traitMod(c, k) * (traits[k] ?? 0) * 1.4;
  const flag = a[3];
  if (flag === "f") {
    const p = LANDS_BASE[iv.humour] + ((c.talents?.social ?? 50) - 50) / 300 + traitMod(c, "e") * 0.08;
    if (Math.random() < p) return { s: Math.max(s, 1.5), note: "landed" };
    return { s: -2.2, note: "flopped" };
  }
  if (flag === "l") {
    if (Math.random() < 0.4) return { s: -4, note: "caught" };
    return { s: Math.max(s, 1), note: "believed" };
  }
  return { s };
}

const REACT_GOOD = ["nods slowly, clearly impressed.", "smiles and jots something down.", "leans forward. \"Now that's a good answer.\"", "seems genuinely pleased."];
const REACT_OK = ["gives a polite nod.", "says \"Mm-hm\" and moves on.", "makes a small note.", "nods without expression."];
const REACT_BAD = ["pauses for a long moment.", "smile tightens a little.", "glances at the clock.", "writes something short and unreadable.", "coughs politely and shuffles the papers."];
const pickOne = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

function reaction(iv: Interviewer, s: number, note?: string): string {
  const first = iv.name.split(" ")[0];
  if (note === "landed") return `${first} laughs out loud. That worked.`;
  if (note === "flopped") return `Silence. ${first} doesn't laugh. That did not work.`;
  if (note === "caught") return `${first} raises an eyebrow. "Really?" - they don't believe you.`;
  if (note === "believed") return `${first} accepts it without a flicker.`;
  return `${first} ${s >= 2.5 ? pickOne(REACT_GOOD) : s >= 0.5 ? pickOne(REACT_OK) : pickOne(REACT_BAD)}`;
}

// how many questions and which
function pickQuestions(c: Character, job: Job, difficulty: number): Question[] {
  const n = job.kind === "parttime" ? 3 : difficulty >= 60 ? 5 : 4;
  const eligible = QUESTIONS.filter((q) => (q.minAge === undefined || c.age >= q.minAge) && (q.maxAge === undefined || c.age <= q.maxAge));
  const byCat = (cat: Cat) => eligible.filter((q) => q.cat === cat);
  const chosen: Question[] = [];
  const taken = new Set<string>();
  const take = (pool: Question[]) => {
    const fresh = pool.filter((q) => !taken.has(q.id));
    if (fresh.length === 0) return;
    const q = pickOne(fresh);
    taken.add(q.id);
    chosen.push(q);
  };
  // always open with a real question; first jobs lean on the simple ones
  take(job.kind === "parttime" || c.age < 20 ? [...byCat("first"), ...byCat("genuine")] : byCat("genuine"));
  const weights: [Cat, number][] = job.kind === "parttime" || c.age < 20
    ? [["first", 35], ["genuine", 25], ["situational", 20], ["curveball", 10], ["bs", 10]]
    : [["genuine", 38], ["situational", 28], ["curveball", 20], ["bs", 14]];
  while (chosen.length < n) {
    const total = weights.reduce((s, w) => s + w[1], 0);
    let r = Math.random() * total;
    let cat: Cat = "genuine";
    for (const [k, w] of weights) {
      r -= w;
      if (r <= 0) {
        cat = k;
        break;
      }
    }
    const before = chosen.length;
    take(byCat(cat));
    if (chosen.length === before) take(eligible);
    if (chosen.length === before) break;
  }
  return chosen;
}

// what you bring to the table, before a word is said
export function preparedness(c: Character, job: Job): number {
  let p = (c.stats.smarts - 50) / 25 + (c.stats.looks - 50) / 30;
  p += ((c.talents?.verbal ?? 50) - 50) / 40 + ((c.talents?.social ?? 50) - 50) / 50;
  p += Math.min(3, (c.workYears ?? 0) / 2);
  if (c.hasCollegeDegree) p += 1;
  if (job.minSkill) p += ((c.skills?.[job.minSkill.skill] ?? 0) - job.minSkill.level) / 20;
  if ((c.sanity ?? 75) < 40) p -= 1;
  if (c.stats.health < 35) p -= 1;
  if ((c.stress ?? 0) >= 75) p -= 0.5;
  if (job.kind === "parttime" && (c.gigRep ?? 0) >= 50) p += 0.5;
  return p;
}

function feedbackFor(run: Run, prep: number, c: Character): string {
  const worst = run.picks.slice().sort((a, b) => a.s - b.s)[0];
  const lines: string[] = [];
  if (worst && worst.s <= -1.5) lines.push("Your answer to one of the questions didn't sit well with them.");
  if (prep < -0.5) lines.push("Another candidate simply had more experience.");
  if (c.stats.looks < 40 && Math.random() < 0.3) lines.push("They wanted someone who made a stronger first impression.");
  if (lines.length === 0) lines.push("It was close - somebody else edged you out.");
  return lines[0];
}

export function acceptJob(c: Character, listing: Listing, salary: number): void {
  const job: Job = { ...listing.job, salary };
  const slot = job.kind === "parttime" ? "partTime" : "job";
  const old = c[slot];
  if (old) (c.jobHistory ??= []).push({ title: old.title, company: old.company?.name, from: c.age - 1, to: c.age });
  c[slot] = job;
  (c.jobHistory ??= []).push({ title: job.title, company: job.company?.name, from: c.age, to: -1 });
  if (slot === "job" || !c.job) refreshCoworkers(c);
  const line = `You started as a ${job.title}${job.company ? ` at ${job.company.name}` : ""}: ${money(salary)} a year.`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
}

function offerEvent(c: Character, world: WorldState, listing: Listing, margin: number, onDone: (cc: Character) => void): LifeEvent {
  const job = listing.job;
  const co = job.company!;
  const gross = effectiveSalary(job, world, c.originRegion);
  return {
    id: `offer-${listing.key}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: co.name, subtitle: `${listing.interviewer.name} · ${listing.interviewer.role}`, step: "The offer", icon: "ribbon" },
    text: () => `"We'd love to have you." ${co.name} offers you the ${job.title} job - about ${money(gross)} a year${job.hours ? `, ${job.hours} hours a week` : ""}.`,
    choices: [
      {
        label: "Accept the offer",
        tone: "good",
        effect: (cc) => {
          onDone(cc);
          acceptJob(cc, listing, gross);
        },
        resultText: () => `You're a ${job.title} now.`,
      },
      ...(job.kind === "fulltime"
        ? [
            {
              label: "Try to negotiate the pay",
              sublabel: "Might get you more - might sour the offer",
              effect: (cc: Character) => {
                onDone(cc);
                const p = clamp(0.28 + margin / 14 + traitMod(cc, "e") * 0.05, 0.1, 0.8);
                if (Math.random() < p) {
                  const bump = 1 + (8 + Math.floor(Math.random() * 11)) / 100;
                  acceptJob(cc, listing, Math.round(gross * bump));
                } else if (Math.random() < 0.2) {
                  cc.yearLog.push(`You pushed too hard: ${co.name} withdrew the offer.`);
                } else {
                  cc.yearLog.push("They wouldn't move on the pay, so you took the original offer.");
                  acceptJob(cc, listing, gross);
                }
              },
            },
          ]
        : []),
      {
        label: "Turn it down",
        effect: (cc) => {
          onDone(cc);
          cc.yearLog.push(`You turned down the ${job.title} job at ${co.name}.`);
        },
      },
    ],
  };
}

export function startApplication(c: Character, world: WorldState, listing: Listing): LifeEvent | undefined {
  const can = canApply(c, listing);
  if (!can.ok) {
    c.yearLog.push(can.reason ?? "You can't apply for that.");
    return undefined;
  }
  c.appsThisYear = (c.appsThisYear ?? 0) + 1;
  const co = listing.job.company!;
  const iv = listing.interviewer;
  const questions = pickQuestions(c, listing.job, listing.difficulty);
  const run: Run = { total: 0, picks: [] };
  const first = iv.name.split(" ")[0];
  const moodLine = { cheerful: `${first} greets you with a big smile.`, neutral: `${first} shakes your hand.`, rushed: `${first} glances at a watch and waves you in.`, tired: `${first} looks like they've had a long week.` }[iv.mood];

  const result = (): LifeEvent => {
    const prep = preparedness(c, listing.job);
    const luck = (Math.random() + Math.random() - 1) * 1.6;
    const S = prep + run.total + luck;
    // the bar rises with the difficulty of the job and scales with how many questions were asked
    const T = (2.2 + listing.difficulty / 8) * (questions.length / 4);
    const margin = S - T;
    const banner = { title: co.name, subtitle: `${iv.name} · ${iv.role}`, step: "The verdict", icon: "briefcase" };
    if (margin >= 1) return offerEvent(c, world, listing, margin, () => {});
    if (margin >= -1.5) {
      // "we'll be in touch": the answer arrives next year
      const ok = Math.random() < 0.4;
      return {
        id: `interview-wait-${listing.key}`,
        minAge: 0,
        maxAge: 200,
        banner,
        text: () => `${first} thanks you for your time. "We have a few more people to see. We'll be in touch." You leave not knowing.`,
        choices: [
          {
            label: "Wait to hear back",
            effect: (cc) => {
              queueDecision(cc, { kind: "jobcallback", data: { job: listing.job, iv, ok, key: listing.key, margin } });
              cc.yearLog.push(`You interviewed at ${co.name}. They said they'd be in touch.`);
            },
          },
        ],
      };
    }
    return {
      id: `interview-no-${listing.key}`,
      minAge: 0,
      maxAge: 200,
      banner,
      text: () => `${first} is polite but firm. "Thank you for coming in - we've decided to go with someone else." ${feedbackFor(run, prep, c)}`,
      choices: [
        {
          label: "Thank them and go",
          effect: (cc) => {
            (cc.rejections ??= []).push({ company: co.name, age: cc.age });
            cc.stats.happiness = clamp(cc.stats.happiness - 3);
            cc.yearLog.push(`You didn't get the ${listing.job.title} job at ${co.name}.`);
          },
        },
      ],
    };
  };

  const ask = (i: number): LifeEvent => {
    const q = questions[i];
    const answers = q.answers.slice().sort(() => Math.random() - 0.5);
    let reactLine = "";
    return {
      id: `interview-${listing.key}-${i}`,
      minAge: 0,
      maxAge: 200,
      banner: { title: co.name, subtitle: `${iv.name} · ${iv.role}`, step: `Question ${i + 1} of ${questions.length}`, icon: "briefcase" },
      text: () =>
        i === 0
          ? `You arrive at ${co.name} for the ${listing.job.title} interview. ${moodLine}\n\n"${q.text}"`
          : `"${q.text}"`,
      choices: answers.map((a) => ({
        label: a[0],
        effect: (cc: Character) => {
          const { s, note } = scoreAnswer(cc, a, iv);
          run.total += s;
          run.picks.push({ q, a, s });
          reactLine = reaction(iv, s, note);
          return i + 1 < questions.length ? withReaction(ask(i + 1), reactLine) : withReaction(result(), reactLine);
        },
      })),
    };
  };
  return ask(0);
}

// prepend the interviewer's reaction to the next screen's text
function withReaction(ev: LifeEvent, line: string): LifeEvent {
  const text = ev.text;
  return { ...ev, text: (c, w) => `${line}\n\n${text(c, w)}` };
}

// a queued "we'll be in touch" resolving a year later
registerDecision("jobcallback", (c, world, d) => {
  const job = d.data?.job as Job | undefined;
  const iv = d.data?.iv as Interviewer | undefined;
  if (!job || !job.company || !iv) return null;
  const listing: Listing = { key: String(d.data?.key ?? d.id), job, interviewer: iv, difficulty: 0 };
  const co = job.company;
  if (d.data?.ok) {
    const ev = offerEvent(c, world, listing, Number(d.data?.margin ?? 0), (cc) => finishDecision(cc, d.id));
    return { ...ev, text: () => `A message from ${co.name}: "Thanks for waiting - we'd like to offer you the ${job.title} position."` };
  }
  return {
    id: `callback-no-${d.id}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: co.name, step: "Their answer", icon: "mail" },
    text: () => `An email from ${co.name}: "Thank you for your interest in the ${job.title} role. The position has now been filled."`,
    choices: [
      {
        label: "Oh well",
        effect: (cc) => {
          finishDecision(cc, d.id);
          (cc.rejections ??= []).push({ company: co.name, age: cc.age });
        },
      },
    ],
  };
});

// ---------------------------------------------------------------- quitting

export function quitWork(c: Character, kind: JobKind): void {
  const job = kind === "parttime" ? c.partTime : c.job;
  if (!job) return;
  const hist = (c.jobHistory ??= []);
  const open = hist.slice().reverse().find((h) => h.title === job.title && h.to === -1);
  if (open) open.to = c.age;
  if (kind === "parttime") c.partTime = null;
  else c.job = null;
  if (kind === "fulltime" || !c.job) refreshCoworkers(c);
  c.yearLog.push(`You quit your ${kind === "parttime" ? "part-time " : ""}job${job.company ? ` at ${job.company.name}` : ""}.`);
}

// ---------------------------------------------------------------- gigs

export const gigCap = (c: Character) => 3 + Math.floor((c.gigRep ?? 0) / 25);

export function gigGateAge(c: Character, gig: GigDef): number {
  const wa = workAgesFor(c);
  return gig.gate === "light" ? wa.light : gig.gate === "parttime" ? wa.parttime : wa.fulltime;
}

export function gigReqs(c: Character, gig: GigDef): Requirement[] {
  const reqs: Requirement[] = [{ label: `Age ${gigGateAge(c, gig)}+`, met: c.age >= gigGateAge(c, gig) }];
  if (gig.minSmarts) reqs.push({ label: `Smarts ${gig.minSmarts}+`, met: c.stats.smarts >= gig.minSmarts });
  if (gig.skill) reqs.push({ label: `${SKILL_LABEL[gig.skill.key]} skill ${gig.skill.level}+`, met: (c.skills?.[gig.skill.key] ?? 0) >= gig.skill.level });
  if (gig.needsCar) reqs.push({ label: "A car", met: !!c.car });
  return reqs;
}

export function canGig(c: Character, gig: GigDef): { ok: boolean; reason?: string } {
  if (c.inJail) return { ok: false, reason: "Not from behind bars." };
  const bad = gigReqs(c, gig).find((r) => !r.met);
  if (bad) return { ok: false, reason: `Needs: ${bad.label}` };
  if ((c.gigsThisYear ?? 0) >= gigCap(c)) return { ok: false, reason: "You've done as many gigs as you can fit in this year." };
  return { ok: true };
}

export function doGig(c: Character, key: string): void {
  const gig = gigDef(key);
  if (!gig) return;
  const can = canGig(c, gig);
  if (!can.ok) {
    c.yearLog.push(can.reason ?? "You can't do that gig.");
    return;
  }
  c.gigsThisYear = (c.gigsThisYear ?? 0) + 1;
  const rep = c.gigRep ?? 0;
  const talent = c.talents?.[gig.talent] ?? 50;
  const talentFactor = 0.7 + (talent / 100) * 0.7;
  const repFactor = 0.8 + rep / 250;
  const success = Math.random() < clamp(0.86 + (talent - 50) / 300 + rep / 500, 0.5, 0.97);
  const label = gig.label.toLowerCase();
  if (!success) {
    c.gigRep = clamp(rep - 3);
    c.yearLog.push(`Your ${label} gig didn't go well - the client wasn't happy and you didn't get paid.`);
    return;
  }
  const region = regionJobMultiplier(c.originRegion);
  let pay = randomInt(gig.pay[0], gig.pay[1]) * talentFactor * repFactor * region;
  if (gig.key === "freelance") pay *= 1 + c.stats.smarts / 200;
  pay = Math.round(pay);
  c.money = Math.max(0, c.money + pay);
  c.gigRep = clamp(rep + randomInt(2, 5));
  if (["dogwalk", "carwash", "lawn", "delivery"].includes(gig.key)) gainFitness(c, 3);
  changeStat(c, "happiness", 1, "Earning your own money");
  c.yearLog.push(pay >= 0 ? `You did some ${label} and made ${money(pay)}.` : `You tried ${label} but lost ${money(-pay)}.`);
  if (gig.risk && Math.random() < gig.risk.chance) {
    const cost = Math.round(randomInt(gig.risk.cost[0], gig.risk.cost[1]) * region);
    c.money = Math.max(0, c.money - cost);
    c.yearLog.push(`${gig.risk.text} (-${money(cost)})`);
  }
}

// ---------------------------------------------------------------- the yearly tick

// part-time pay, experience, and the annual reset of applications and gigs
export function tickWork(c: Character, world: WorldState): void {
  c.appsThisYear = 0;
  c.gigsThisYear = 0;
  // events can end a job (layoff, retirement) without going through quitWork:
  // close any history entry that no longer matches a job you hold
  for (const h of c.jobHistory ?? []) {
    if (h.to === -1 && c.job?.title !== h.title && c.partTime?.title !== h.title) h.to = c.age;
  }
  if (c.gigRep) c.gigRep = clamp(c.gigRep - 1);
  if (c.job || c.partTime) c.workYears = (c.workYears ?? 0) + 1;
  if (c.partTime && !c.inJail) {
    const gross = Math.round(effectiveSalary(c.partTime, world, c.originRegion) * attendanceFactor(c));
    const tax = incomeTax(gross, c.originRegion);
    c.money += gross - tax;
    c.yearLog.push(`Your part-time job${c.partTime.company ? ` at ${c.partTime.company.name}` : ""} paid you ${money(gross - tax)}.`);
    // work and school pull against each other
    const inSchool = c.age >= 6 && c.age <= 22 && !c.job;
    if (inSchool && (c.partTime.hours ?? 0) >= 15 && Math.random() < 0.35) changeStat(c, "smarts", -1, "Less time for school");
    changeStat(c, "happiness", 1, "Your own money");
  }
}

export { ALL_JOBS, GIGS };
