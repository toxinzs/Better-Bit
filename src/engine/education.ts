import { Character, Diploma, EducationStage, LifeEvent, ReportCard, School, SchoolKind, StudyMode } from "../types";
import { CLUBS, ClubDef, ClubKey } from "../data/school";
import { SCHOOL_KINDS, CLIQUE_EFFECT, eduSystem, schoolName, scoreToGpa, subjectsFor } from "../data/education";
import { CLASSES } from "../data/traits";
import { SKILL_TALENT, traitMod } from "./character";
import { changeStat } from "./stats";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { easeStress, priceLevel } from "./health";
import { clamp, randomInt } from "./util";
import { cityOf } from "./where";

// The school system: where you go, how you're doing (per-subject grades and a
// yearly report card), how you behave, who you run with, whether you're being
// bullied (or doing the bullying), the teams and clubs you belong to, and
// what all of it adds up to at graduation.

const K12 = (s: EducationStage) => s === "elementary" || s === "middle" || s === "high";
export const inK12 = (c: Character) => K12(c.educationStage) && c.age >= 5 && c.age <= 18;
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------- your school

const CLASS_RANK: Record<string, number> = { struggling: 0, working: 1, middle: 2, comfortable: 3, wealthy: 4 };

function pickKind(c: Character, stage: EducationStage): SchoolKind {
  const cls = CLASS_RANK[c.background?.wealthClass ?? "middle"];
  const roll = Math.random();
  if (cls >= 4) return roll < 0.55 ? "private" : roll < 0.62 && stage === "high" ? "boarding" : "public";
  if (cls === 3) return roll < 0.3 ? "private" : roll < 0.42 && c.stats.smarts >= 60 ? "magnet" : "public";
  if (cls === 2) return roll < 0.1 && c.stats.smarts >= 65 ? "magnet" : "public";
  return "public";
}

export function buildSchool(c: Character, stage: EducationStage, kind: SchoolKind): School {
  const cls = CLASS_RANK[c.background?.wealthClass ?? "middle"];
  // neighbourhoods roughly track family wealth: richer areas, better public schools
  const city = cityOf(c);
  const base = 40 + cls * 5 + Math.round((city.schools - 60) / 4) + randomInt(-8, 8);
  const def = SCHOOL_KINDS[kind];
  const st = stage === "elementary" || stage === "middle" || stage === "high" ? stage : "high";
  return {
    name: schoolName(c.originRegion, st, kind, `${c.avatarSeed ?? 0}|${stage}|${kind}|${c.age}|${c.residence?.city ?? ""}`),
    kind,
    quality: clamp(base + def.qualityBoost),
    tuition: def.tuition,
    stage,
  };
}

export function enterSchool(c: Character, stage: EducationStage): void {
  if (!K12(stage)) {
    c.school = null;
    return;
  }
  if (c.school && c.school.stage === stage) return; // still the same school year-on-year
  c.school = buildSchool(c, stage, pickKind(c, stage));
  c.studyMode ??= "normal";
  c.conduct ??= 80;
  if (c.bullying && Math.random() < 0.6) c.bullying = null; // a fresh start
}

// older saves: give anyone in school a school
export function ensureSchool(c: Character): void {
  c.conduct ??= 80;
  c.studyMode ??= "normal";
  c.popularity ??= 50;
  if (K12(c.educationStage) && !c.school && c.age >= 5 && c.age <= 18) c.school = buildSchool(c, c.educationStage, "public");
  if (!c.upbringing) c.upbringing = upbringingFor(c);
}

// ---------------------------------------------------------------- how you were raised

export function upbringingFor(c: Character): string {
  const parents = c.relationships.filter((r) => r.type === "mother" || r.type === "father");
  const has = (words: string[]) => parents.reduce((n, p) => n + (p.traits ?? []).filter((t) => words.includes(t)).length, 0);
  const strict = has(["stubborn", "grumpy", "competitive"]);
  const warm = has(["warm", "patient", "generous", "loyal"]);
  const loose = has(["adventurous", "flirty", "funny", "dramatic"]);
  const neglect = (c.background?.wealthClass === "struggling" ? 1 : 0) + has(["private", "anxious"]) * 0.5;
  const scores: [string, number][] = [["strict", strict], ["nurturing", warm], ["permissive", loose], ["neglectful", neglect]];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "nurturing";
}

export const UPBRINGING_BLURB: Record<string, string> = {
  strict: "Strict but fair - rules, routines and high expectations.",
  nurturing: "Warm and supportive - you always knew you were loved.",
  permissive: "Easygoing - lots of freedom, few rules.",
  neglectful: "Busy or distant - you mostly raised yourself.",
};

// gentle yearly personality drift from how you're being raised (ages 3-16)
function tickUpbringing(c: Character): void {
  if (c.age < 3 || c.age > 16 || !c.personality) return;
  const p = c.personality;
  switch (c.upbringing) {
    case "strict": p.c = clamp(p.c + 0.35); p.n = clamp(p.n + 0.2); p.e = clamp(p.e - 0.1); break;
    case "nurturing": p.n = clamp(p.n - 0.35); p.a = clamp(p.a + 0.3); break;
    case "permissive": p.c = clamp(p.c - 0.25); p.e = clamp(p.e + 0.2); p.o = clamp(p.o + 0.15); break;
    case "neglectful": p.n = clamp(p.n + 0.3); p.a = clamp(p.a - 0.2); p.c = clamp(p.c - 0.1); break;
  }
}

// ---------------------------------------------------------------- effort and grades

export function effortLevel(c: Character): number {
  const mode = c.studyMode ?? "normal";
  let e = 50 + traitMod(c, "c") * 20 + (c.quirks?.includes("perfectionist") ? 8 : 0) + (c.quirks?.includes("bookworm") ? 6 : 0);
  if ((c.stress ?? 0) >= 80) e -= 10;
  e += mode === "hard" ? 25 : mode === "slack" ? -25 : 0;
  return clamp(e);
}

const teacherRapport = (c: Character): number => {
  const t = c.relationships.filter((r) => r.type === "teacher" && r.alive);
  if (t.length === 0) return 0;
  const avg = t.reduce((s, r) => s + r.level, 0) / t.length;
  return (avg - 50) / 10; // -5 .. +5
};

function subjectScore(c: Character, sub: { talent: keyof NonNullable<Character["talents"]>; weight: number }): number {
  const talent = c.talents?.[sub.talent] ?? 50;
  const light = sub.weight < 0.7; // art and PE lean on aptitude, not smarts
  let s = 39 + c.stats.smarts * (light ? 0.16 : 0.36) + talent * (light ? 0.3 : 0.12) + effortLevel(c) * 0.18 + (c.school?.quality ?? 50) * 0.08;
  s += teacherRapport(c) + (c.helpBonus ?? 0);
  if (c.bullying?.role === "victim") s -= 6;
  if ((c.stress ?? 0) > 70) s -= ((c.stress ?? 0) - 70) / 4;
  if (c.stats.health < 35) s -= 4;
  if ((c.partTime?.hours ?? 0) >= 15) s -= 2;
  if ((c.conduct ?? 80) < 40) s -= 3;
  if ((c.schoolActivities?.length ?? 0) > 3) s -= 2;
  s += (Math.random() + Math.random() + Math.random() - 1.5) * 8; // luck of the year
  return Math.round(clamp(s));
}

const NOTES_GOOD = ["A pleasure to teach. Keep it up.", "Works hard and it shows.", "A bright, curious student.", "Consistently excellent."];
const NOTES_OK = ["Doing fine, with room to grow.", "Capable of more when fully engaged.", "A steady year.", "Solid work, but could contribute more in class."];
const NOTES_BAD = ["Struggling this year - please get in touch.", "Needs to apply themselves.", "Missing work and low effort.", "We're concerned about progress."];
const pickOne = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

// ---------------------------------------------------------------- the yearly tick

export function tickSchool(c: Character): void {
  ensureSchool(c);
  tickUpbringing(c);
  const stage = c.educationStage;
  if (!K12(stage) || c.age - 1 < 5 || !c.school) {
    c.helpBonus = 0;
    tickPopularity(c);
    return;
  }
  const subs = subjectsFor(stage);
  const grades: Record<string, number> = {};
  let sum = 0;
  let wsum = 0;
  for (const sub of subs) {
    const g = subjectScore(c, sub);
    grades[sub.key] = g;
    sum += g * sub.weight;
    wsum += sub.weight;
  }
  const avg = sum / wsum;
  c.helpBonus = 0; // teacher and tutor help only lasts the year it was given
  const gpaYear = scoreToGpa(avg);
  c.gpa = Math.round(((c.gpa ?? gpaYear) * 0.4 + gpaYear * 0.6) * 100) / 100;

  // where you finished in the class
  const classSize = c.school.kind === "private" ? 18 : c.school.kind === "magnet" ? 30 : 24;
  const mean = 58 + c.school.quality * 0.15 + (c.school.kind === "magnet" ? 8 : 0);
  let ahead = 0;
  for (let i = 0; i < classSize - 1; i++) {
    const peer = mean + (Math.random() + Math.random() + Math.random() - 1.5) * 24;
    if (peer > avg) ahead++;
  }
  const rank = ahead + 1;
  const honor = gpaYear >= 3.5;
  const note = avg >= 78 ? pickOne(NOTES_GOOD) : avg >= 58 ? pickOne(NOTES_OK) : pickOne(NOTES_BAD);
  const card: ReportCard = { age: c.age - 1, stage, school: c.school.name, grades, gpa: gpaYear, rank, classSize, honor, note };
  const cards = (c.reportCards ??= []);
  cards.push(card);
  if (cards.length > 14) cards.shift();

  // what the year did to you
  const line = `Report card: ${gpaYear.toFixed(1)} GPA - ${rank}${rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th"} of ${classSize}${honor ? " · honour roll" : ""}.`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
  if (honor) {
    changeStat(c, "happiness", 3, "Making the honour roll");
    for (const r of c.relationships) if (r.alive && (r.type === "mother" || r.type === "father")) r.level = clamp(r.level + 3);
  } else if (avg < 55) {
    changeStat(c, "happiness", -3, "A poor report card");
    for (const r of c.relationships) if (r.alive && (r.type === "mother" || r.type === "father")) r.level = clamp(r.level - 3);
  }
  const mode = c.studyMode ?? "normal";
  if (mode === "hard") {
    changeStat(c, "smarts", 1, "Studying hard");
    changeStat(c, "happiness", -2, "Studying hard");
  } else if (mode === "slack") {
    changeStat(c, "happiness", 2, "Taking it easy");
    if (Math.random() < 0.4) changeStat(c, "smarts", -1, "Coasting");
  }

  // failing the year
  if (avg < 45) {
    c.failedYears = (c.failedYears ?? 0) + 1;
    queueDecision(c, { kind: "summerschool", data: { age: c.age - 1 } });
  }

  tickConduct(c);
  tickBullying(c);
  tickActivities(c);
  tickPopularity(c);
}

// ---------------------------------------------------------------- behaviour

export function misbehave(c: Character, severity: 1 | 2 | 3, what = "trouble"): void {
  c.conduct = clamp((c.conduct ?? 80) - severity * 8);
  const conduct = c.conduct;
  if (c.educationStage === "college" || !inK12(c)) return;
  if (conduct < 45 && severity >= 1 && Math.random() < 0.5) {
    changeStat(c, "happiness", -2, "Detention");
    c.yearLog.push(`You got detention for ${what}.`);
  }
  if (conduct < 28 && Math.random() < 0.55) {
    c.suspensions = (c.suspensions ?? 0) + 1;
    changeStat(c, "happiness", -4, "A suspension");
    for (const r of c.relationships) if (r.alive && (r.type === "mother" || r.type === "father")) r.level = clamp(r.level - 8);
    c.yearLog.push(`You were suspended for ${what}. Your parents were called in.`);
    if ((c.suspensions ?? 0) >= 3 || conduct < 12) expel(c);
  }
}

export function expel(c: Character): void {
  if (!K12(c.educationStage)) return;
  c.school = buildSchool(c, c.educationStage, "alternative");
  c.conduct = 45;
  c.suspensions = 0;
  changeStat(c, "happiness", -8, "Being expelled");
  const line = `You were expelled. You're being moved to ${c.school.name}.`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
}

function tickConduct(c: Character): void {
  // good kids stay good, and a year without trouble clears the slate a little
  let d = 4;
  if (traitMod(c, "a") < -0.3) d -= 3;
  if (c.quirks?.includes("hot-headed")) d -= 3;
  if (c.upbringing === "neglectful") d -= 2;
  if (c.upbringing === "strict") d += 2;
  c.conduct = clamp((c.conduct ?? 80) + d);
}

// ---------------------------------------------------------------- popularity and cliques

function tickPopularity(c: Character): void {
  if (c.age < 8) return;
  const clique = c.clique ? CLIQUE_EFFECT[c.clique] : undefined;
  const acts = c.schoolActivities ?? [];
  let target = 50 + (c.stats.looks - 50) * 0.3 + traitMod(c, "e") * 10 + ((c.talents?.social ?? 50) - 50) * 0.15;
  if (acts.some((a) => /Team|Council/.test(a))) target += 6;
  if (acts.some((a) => /Drama|Band|Choir/.test(a))) target += 3;
  if (c.bullying?.role === "victim") target -= 12;
  if (c.bullying?.role === "bully") target += 4;
  if (c.flags?.includes("faculty-scandal")) target -= 8;
  const pop = c.popularity ?? 50;
  c.popularity = clamp(Math.round(pop + (target - pop) * 0.3 + (clique?.pop ?? 0)));
  if (clique && c.age <= 18) {
    if (clique.smarts) c.stats.smarts = clamp(c.stats.smarts + clique.smarts);
    if (clique.happy) changeStat(c, "happiness", clique.happy, `Running with the ${c.clique}`);
    if (clique.fitness) c.fitness = clamp((c.fitness ?? 50) + clique.fitness);
    if (clique.stress) c.stress = clamp((c.stress ?? 25) + clique.stress);
  }
}

export function popularityWord(p: number): string {
  return p >= 80 ? "Everyone knows you" : p >= 62 ? "Well liked" : p >= 42 ? "Fits in" : p >= 25 ? "Mostly overlooked" : "Outcast";
}

export function switchClique(c: Character, clique: string): void {
  if (c.clique === clique) return;
  c.clique = clique;
  c.popularity = clamp((c.popularity ?? 50) - 3);
  c.yearLog.push(`You started hanging out with the ${clique}.`);
}

// ---------------------------------------------------------------- bullying

function tickBullying(c: Character): void {
  if (c.age < 7 || c.age > 17) {
    c.bullying = null;
    return;
  }
  const b = c.bullying;
  if (b) {
    b.years += 1;
    if (b.role === "victim") {
      changeStat(c, "happiness", -4, "Being bullied");
      if (Math.random() < 0.5) changeStat(c, "health", -1, "Being bullied");
      if (Math.random() < 0.25) {
        c.bullying = null;
        c.yearLog.push("The bullying finally stopped.");
      }
    } else {
      c.popularity = clamp((c.popularity ?? 50) + 3);
      c.conduct = clamp((c.conduct ?? 80) - 6);
      if (Math.random() < 0.15) misbehave(c, 2, "bullying another student");
      if (Math.random() < 0.2) {
        c.bullying = null;
        c.yearLog.push("You lost interest in picking on people.");
      }
    }
    return;
  }
  const pop = c.popularity ?? 50;
  let pv = 0.04 + (pop < 30 ? 0.06 : 0) + (c.stats.looks < 35 ? 0.03 : 0) + Math.max(0, traitMod(c, "n")) * 0.04 + (c.clique === "Loners" ? 0.03 : 0) - (c.clique === "Jocks" || c.clique === "Popular" ? 0.04 : 0);
  pv = Math.max(0.01, pv);
  let pb = 0.015 + (c.quirks?.includes("hot-headed") ? 0.03 : 0) + Math.max(0, -traitMod(c, "a")) * 0.04 + (pop >= 65 ? 0.02 : 0);
  if (c.age < 9) pb *= 0.4;
  const r = Math.random();
  if (r < pv) queueDecision(c, { kind: "bullied" });
  else if (r < pv + pb) queueDecision(c, { kind: "bully" });
}

export type BullyAction = "ignore" | "teacher" | "parents" | "fight" | "counsel";

export function respondToBullying(c: Character, action: BullyAction): void {
  if (c.bullying?.role !== "victim") return;
  const teacher = c.relationships.find((r) => r.type === "teacher" && r.alive);
  const parent = c.relationships.find((r) => (r.type === "mother" || r.type === "father") && r.alive);
  const end = (line: string) => {
    c.bullying = null;
    c.yearLog.push(line);
  };
  switch (action) {
    case "ignore":
      if (Math.random() < 0.25) end("You kept your head down and they lost interest.");
      else c.yearLog.push("You tried to ignore it. It didn't stop.");
      break;
    case "teacher":
      if (teacher) teacher.level = clamp(teacher.level + 3);
      if (Math.random() < 0.55) end("You told a teacher and they dealt with it. The bullying stopped.");
      else c.yearLog.push("You told a teacher, but not much changed.");
      break;
    case "parents":
      if (parent) parent.level = clamp(parent.level + 6);
      if (Math.random() < 0.65) end("Your parents went in to speak to the school. It stopped.");
      else c.yearLog.push("Your parents complained, but the school shrugged.");
      break;
    case "fight": {
      const win = Math.random() < clamp(0.35 + ((c.talents?.athletic ?? 50) - 50) / 200 + (c.fitness ?? 50) / 400, 0.15, 0.7);
      if (win) {
        c.popularity = clamp((c.popularity ?? 50) + 6);
        end("You stood up for yourself and won. Nobody messed with you again.");
      } else {
        changeStat(c, "health", -6, "A fight");
        c.yearLog.push("You fought back and came off worse.");
      }
      misbehave(c, 2, "fighting");
      break;
    }
    case "counsel":
      easeStress(c, 15);
      c.sanity = clamp((c.sanity ?? 75) + 5);
      if (Math.random() < 0.3) end("Talking it through gave you the confidence to stand up to them. It stopped.");
      else c.yearLog.push("The counsellor helped you cope, even though it hasn't stopped yet.");
      break;
  }
}

registerDecision("bullied", (c, _w, d) => {
  if (c.bullying) {
    return null;
  }
  const mk = (label: string, action: BullyAction, sub?: string) => ({
    label,
    sublabel: sub,
    effect: (cc: Character) => {
      finishDecision(cc, d.id);
      cc.bullying = { role: "victim", years: 0 };
      respondToBullying(cc, action);
    },
  });
  return {
    id: `bullied-${d.id}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "Trouble at school", icon: "warning", subtitle: c.school?.name },
    text: () => "Someone has started picking on you - the name-calling, the whispers, the shoving in the corridor. It isn't going away on its own.",
    choices: [
      mk("Tell a teacher", "teacher"),
      mk("Tell your parents", "parents"),
      mk("Fight back", "fight", "Risky - and you could be punished"),
      mk("Talk to the school counsellor", "counsel"),
      mk("Keep your head down", "ignore"),
    ],
  } as LifeEvent;
});

registerDecision("bully", (c, _w, d) => {
  if (c.bullying) return null;
  return {
    id: `bully-${d.id}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "The crowd", icon: "people", subtitle: c.school?.name },
    text: () => "Somebody weaker than you is an easy target, and the people around you are laughing. It would be easy to join in.",
    choices: [
      {
        label: "Join in",
        tone: "danger",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.bullying = { role: "bully", years: 0 };
          cc.popularity = clamp((cc.popularity ?? 50) + 5);
        },
        resultText: () => "The laughter feels good for about a minute. Then you notice who isn't laughing.",
      },
      {
        label: "Walk away",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.conduct = clamp((cc.conduct ?? 80) + 3);
        },
        resultText: () => "You walked away. It wasn't easy, but you can look at yourself.",
      },
      {
        label: "Stand up for them",
        tone: "good",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.popularity = clamp((cc.popularity ?? 50) - 4);
          changeStat(cc, "happiness", 3, "Doing the right thing");
          const kid = cc.relationships.find((r) => r.type === "classmate" && r.alive);
          if (kid) kid.level = clamp(kid.level + 20);
        },
        resultText: () => "You said something. The room went quiet. It cost you a little - and it was worth it.",
      },
    ],
  } as LifeEvent;
});

// ---------------------------------------------------------------- failing a year

const summerCost = (c: Character) => Math.round(300 * priceLevel(c));

registerDecision("summerschool", (c, _w, d) => {
  const cost = summerCost(c);
  const afford = c.money >= cost;
  return {
    id: `summerschool-${d.id}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "You failed the year", icon: "school", subtitle: c.school?.name },
    text: () => "Your grades weren't enough to pass. The school offers a summer programme to make up the credits - or you can take your chances and move on.",
    choices: [
      {
        label: "Do summer school",
        sublabel: afford ? money(cost) : `${money(cost)} - you can't afford it`,
        disabled: !afford,
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.money -= cost;
          if (Math.random() < 0.85) {
            cc.failedYears = Math.max(0, (cc.failedYears ?? 1) - 1);
            cc.yearLog.push("You spent the summer catching up and passed.");
          } else cc.yearLog.push("You put in the summer but still fell short.");
          changeStat(cc, "happiness", -3, "A summer in class");
        },
      },
      {
        label: "Move on anyway",
        tone: "danger",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.yearLog.push("You moved up with the failing grade on your record.");
        },
      },
    ],
  } as LifeEvent;
});

// ---------------------------------------------------------------- study, teachers, counsellor

export function setStudyMode(c: Character, mode: StudyMode): void {
  c.studyMode = mode;
  c.yearLog.push(mode === "hard" ? "You'll hit the books hard from now on." : mode === "slack" ? "You'll take it easy with school." : "You'll study at a normal pace.");
}

export function askTeacherForHelp(c: Character, id: string): void {
  const t = c.relationships.find((r) => r.id === id && r.alive && r.type === "teacher");
  if (!t) return;
  if ((c.helpBonus ?? 0) >= 4) {
    c.yearLog.push("You've already got all the extra help you can use this year.");
    return;
  }
  c.helpBonus = 4;
  t.level = clamp(t.level + 5);
  c.yearLog.push(`${t.name} stayed after class to help you. Your grades should benefit this year.`);
}

const TRACKS: { key: NonNullable<Character["track"]>; label: string }[] = [
  { key: "college", label: "College and a professional career" },
  { key: "trade", label: "A trade or apprenticeship" },
  { key: "arts", label: "The arts or a creative path" },
  { key: "work", label: "Straight into work" },
];

export function recommendedTrack(c: Character): NonNullable<Character["track"]> {
  const t = c.talents;
  if (c.stats.smarts >= 60 && (c.gpa ?? 3) >= 2.8) return "college";
  if (t && Math.max(t.artistic, t.musical, t.verbal) >= 75) return "arts";
  if (t && Math.max(t.technical, t.athletic) >= 68) return "trade";
  return "work";
}

export function seeCounsellor(c: Character): LifeEvent | undefined {
  if (c.age < 13 || !inK12(c)) {
    c.yearLog.push("The counsellor's office is for older students.");
    return undefined;
  }
  if (c.flags?.includes(`counselled-${c.age}`)) {
    c.yearLog.push("You've already seen the counsellor this year.");
    return undefined;
  }
  (c.flags ??= []).push(`counselled-${c.age}`);
  const rec = recommendedTrack(c);
  return {
    id: `counsellor-${c.age}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "Guidance counsellor", icon: "compass", subtitle: c.school?.name },
    text: () => `The counsellor looks over your grades, your interests and how you spend your time. "Where do you see yourself after school?" they ask. They think ${TRACKS.find((t) => t.key === rec)!.label.toLowerCase()} could suit you.`,
    choices: TRACKS.map((t) => ({
      label: t.label,
      sublabel: t.key === rec ? "The counsellor's suggestion" : undefined,
      tone: t.key === rec ? ("good" as const) : undefined,
      effect: (cc: Character) => {
        cc.track = t.key;
        cc.helpBonus = Math.max(cc.helpBonus ?? 0, t.key === rec ? 3 : 1);
        cc.yearLog.push(`You settled on a plan: ${t.label.toLowerCase()}.`);
      },
    })),
  } as LifeEvent;
}

// ---------------------------------------------------------------- changing schools

export function schoolOptions(c: Character): { kind: SchoolKind; ok: boolean; why?: string }[] {
  const cls = CLASS_RANK[c.background?.wealthClass ?? "middle"];
  const lastAvg = (() => {
    const g = c.reportCards?.[c.reportCards.length - 1]?.grades;
    if (!g) return 60;
    const v = Object.values(g);
    return v.reduce((s, x) => s + x, 0) / v.length;
  })();
  const parentBond = Math.max(0, ...c.relationships.filter((r) => r.alive && (r.type === "mother" || r.type === "father")).map((r) => r.level));
  const cur = c.school?.kind;
  return (["public", "private", "magnet", "boarding"] as SchoolKind[]).map((kind) => {
    if (kind === cur) return { kind, ok: false, why: "You already go to one" };
    if (kind === "private" && (cls < 3 || parentBond < 40)) return { kind, ok: false, why: cls < 3 ? "Your family can't afford it" : "Your parents won't hear of it" };
    if (kind === "boarding" && (cls < 4 || parentBond < 40 || c.age < 11)) return { kind, ok: false, why: cls < 4 ? "Your family can't afford it" : "Not right now" };
    if (kind === "magnet" && (lastAvg < 78 || c.stats.smarts < 65)) return { kind, ok: false, why: "You need higher grades to get in" };
    return { kind, ok: true };
  });
}

export function changeSchool(c: Character, kind: SchoolKind): void {
  if (!K12(c.educationStage)) return;
  const opt = schoolOptions(c).find((o) => o.kind === kind);
  if (!opt?.ok) {
    c.yearLog.push(opt?.why ?? "That isn't possible right now.");
    return;
  }
  c.school = buildSchool(c, c.educationStage, kind);
  c.popularity = clamp((c.popularity ?? 50) - 8);
  changeStat(c, "happiness", -3, "Being the new kid");
  if (c.bullying?.role === "victim" && Math.random() < 0.6) c.bullying = null;
  // new classmates and teachers
  c.relationships = c.relationships.filter((r) => r.type !== "classmate" && r.type !== "teacher" ? true : !r.alive);
  resetRoster?.(c);
  c.yearLog.push(`You changed schools and started at ${c.school.name}.`);
}

let resetRoster: ((c: Character) => void) | undefined;
export function registerRosterReset(fn: (c: Character) => void) {
  resetRoster = fn;
}

// ---------------------------------------------------------------- leaving and graduating

export function evaluateDiploma(c: Character): Diploma {
  if (c.diploma === "ged") return "ged";
  if ((c.failedYears ?? 0) >= 2 || (c.gpa ?? 3) < 1.0) return "none";
  return "diploma";
}

export function awardDiploma(c: Character): void {
  c.diploma = evaluateDiploma(c);
  const line =
    c.diploma === "diploma"
      ? "You graduated with your diploma."
      : "You didn't earn enough credits to graduate. No diploma - but there's always the GED.";
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
  if (c.diploma === "none") changeStat(c, "happiness", -8, "Not graduating");
}

export function dropOutOfSchool(c: Character): void {
  const min = eduSystem(c.originRegion).leavingAge;
  if (!K12(c.educationStage)) return;
  if (c.age < min) {
    c.yearLog.push(`You have to stay in school until ${min} where you live.`);
    return;
  }
  c.educationStage = "graduated";
  c.diploma = "none";
  c.school = null;
  c.bullying = null;
  changeStat(c, "happiness", 2, "Leaving school");
  c.yearLog.push("You dropped out of school.");
  // teachers fade off the roster; classmates you were close to stay as friends
  c.relationships = c.relationships.filter((r) => r.type !== "teacher" && (r.type !== "classmate" || !r.alive || r.level >= 55));
  for (const r of c.relationships) if (r.type === "classmate") r.type = "friend";
}

export function gedCost(c: Character): number {
  return Math.round(150 * priceLevel(c));
}

export function takeGED(c: Character): void {
  if (c.diploma === "diploma" || c.diploma === "ged") return;
  if (c.age < 16) {
    c.yearLog.push("You're too young for the GED.");
    return;
  }
  if (inK12(c)) {
    c.yearLog.push("Finish school first.");
    return;
  }
  if (c.flags?.includes(`ged-${c.age}`)) {
    c.yearLog.push("You've already sat the equivalency exam this year.");
    return;
  }
  const cost = gedCost(c);
  if (c.money < cost) {
    c.yearLog.push(`You couldn't afford the exam fee (${money(cost)}).`);
    return;
  }
  c.money -= cost;
  (c.flags ??= []).push(`ged-${c.age}`);
  const p = clamp((30 + c.stats.smarts * 0.6 + ((c.talents?.academic ?? 50) - 50) * 0.2) / 100, 0.15, 0.95);
  if (Math.random() < p) {
    c.diploma = "ged";
    changeStat(c, "happiness", 8, "Passing the GED");
    c.yearLog.push("You passed the high-school equivalency exam.");
  } else {
    c.yearLog.push("You sat the equivalency exam but didn't pass. You can try again next year.");
  }
}

export const hasDiploma = (c: Character) => c.diploma === "diploma" || c.diploma === "ged" || c.hasCollegeDegree || (c.age > 18 && c.diploma === undefined);

// ---------------------------------------------------------------- teams and clubs

export const MAX_ACTIVITIES = 3;

export function clubTryout(c: Character, club: ClubDef): boolean {
  if (!club.tryout) return true;
  const talent = club.talent ? c.talents?.[club.talent] ?? 50 : 50;
  const skill = club.skill ? c.skills?.[club.skill] ?? 0 : 0;
  const fit = club.kind === "sport" ? (c.fitness ?? 50) / 300 : 0;
  const p = clamp(0.35 + talent / 150 + skill / 300 + fit, 0.15, 0.92);
  return Math.random() < p;
}

export function joinClub(c: Character, key: ClubKey): void {
  const def = CLUBS.find((cl) => cl.key === key);
  if (!def) return;
  if (c.age < def.minAge) {
    c.yearLog.push("You're too young for that yet.");
    return;
  }
  const acts = (c.schoolActivities ??= []);
  if (acts.includes(def.label)) {
    c.yearLog.push(`You're already in ${def.label}.`);
    return;
  }
  if (acts.length >= MAX_ACTIVITIES) {
    c.yearLog.push(`You can't take on more than ${MAX_ACTIVITIES} activities. Drop one first.`);
    return;
  }
  if (!clubTryout(c, def)) {
    changeStat(c, "happiness", -2, "Not making the team");
    c.yearLog.push(`You tried out for the ${def.label.toLowerCase()} but didn't make it.`);
    return;
  }
  acts.push(def.label);
  (c.activityYears ??= {})[def.label] = 0;
  changeStat(c, "happiness", 4, "Joining something");
  c.yearLog.push(def.tryout ? `You made the ${def.label.toLowerCase()}!` : `You joined ${def.label}.`);
}

export function quitClub(c: Character, label: string): void {
  c.schoolActivities = (c.schoolActivities ?? []).filter((a) => a !== label);
  if (c.activityYears) delete c.activityYears[label];
  c.yearLog.push(`You left ${label}.`);
}

function tickActivities(c: Character): void {
  const acts = c.schoolActivities ?? [];
  if (acts.length === 0) return;
  const years = (c.activityYears ??= {});
  for (const label of acts.slice()) {
    const def = CLUBS.find((cl) => cl.label === label);
    years[label] = (years[label] ?? 0) + 1;
    if (!def) continue;
    const talent = def.talent ? c.talents?.[def.talent] ?? 50 : 50;
    if (def.skill) {
      const skills = (c.skills ??= {});
      const mult = 0.6 + talent / 100;
      skills[def.skill] = clamp((skills[def.skill] ?? 0) + Math.round(randomInt(2, 5) * mult));
    }
    if (def.kind === "sport") {
      c.fitness = clamp((c.fitness ?? 50) + 6);
      changeStat(c, "health", 1, "Playing sport");
      if (Math.random() < 0.06) {
        changeStat(c, "health", -8, "A sports injury");
        c.yearLog.push(`You picked up an injury playing ${label.toLowerCase().replace(" team", "")}.`);
      }
    } else if (def.kind === "academic") {
      if (Math.random() < 0.5) changeStat(c, "smarts", 1, "Clubs that make you think");
    } else if (def.kind === "service") {
      c.conduct = clamp((c.conduct ?? 80) + 2);
    } else changeStat(c, "happiness", 1, "Making art");
    // team captain / lead role
    if ((years[label] ?? 0) === 2 && (def.tryout || def.kind === "sport") && Math.random() < 0.3 + talent / 300) {
      c.popularity = clamp((c.popularity ?? 50) + 6);
      const skills = (c.skills ??= {});
      skills.leadership = clamp((skills.leadership ?? 0) + 6);
      c.yearLog.push(`You were made captain of the ${label.toLowerCase().replace(" team", "")} squad.`);
    }
  }
}

export function clubStatus(c: Character, label: string): string {
  const y = c.activityYears?.[label] ?? 0;
  return y === 0 ? "New this year" : `${y} year${y === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------- helpers for the screens

export function gpaOf(c: Character): number {
  return c.gpa ?? 3;
}

export const teacherList = (c: Character) => c.relationships.filter((r) => r.type === "teacher" && r.alive);
export const classmateList = (c: Character) => c.relationships.filter((r) => r.type === "classmate" && r.alive);
