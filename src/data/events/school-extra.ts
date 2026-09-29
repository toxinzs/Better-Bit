import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { inK12, misbehave } from "../../engine/education";
import { priceLevel } from "../../engine/health";
import { randomClassmate } from "../../engine/school";
import { CLASSES } from "../../data/traits";

// School life that plugs into the school system: what you do about exams,
// teachers, bullies and trouble changes your grades, conduct, popularity.

const school = (c: Character) => inK12(c) && c.age >= 8;
// always the same teacher for a given popup (text() is called more than once)
const teacherOf = (c: Character) => c.relationships.find((r) => r.type === "teacher" && r.alive);
const pop = (c: Character, n: number) => {
  c.popularity = clamp((c.popularity ?? 50) + n);
};
const conduct = (c: Character, n: number) => {
  c.conduct = clamp((c.conduct ?? 80) + n);
};

export const SCHOOL_EXTRA_EVENTS: LifeEvent[] = [
  {
    id: "exam-week",
    minAge: 11,
    maxAge: 18,
    weight: 2.4,
    condition: school,
    text: () => "Exam week. Every teacher is handing out revision lists and the library is full.",
    choices: [
      { label: "Cram every night", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) + 3; c.stress = clamp((c.stress ?? 25) + 8); changeStat(c, "health", -2, "No sleep during exams"); }, resultText: () => "Coffee, flash cards and a strange calm at the end." },
      { label: "Study steadily", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) + 2; c.stress = clamp((c.stress ?? 25) + 3); }, resultText: () => "A routine, a plan, and eight hours of sleep." },
      { label: "Wing it", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) - 2; changeStat(c, "happiness", 2, "Not stressing"); }, resultText: () => "You'll find out how it went in a few weeks." },
    ],
  },
  {
    id: "favourite-teacher",
    minAge: 8,
    maxAge: 18,
    once: true,
    weight: 1.5,
    condition: (c) => school(c) && !!teacherOf(c),
    text: (c) => `${teacherOf(c)?.name ?? "Your teacher"} pulls you aside after class. "I think you've got real potential."`,
    choices: [
      { label: "Ask for advice", effect: (c) => { const t = teacherOf(c); if (t) t.level = clamp(t.level + 14); c.helpBonus = (c.helpBonus ?? 0) + 3; changeStat(c, "smarts", 2, "A teacher who believes in you"); }, resultText: () => "For the first time you felt seen by a teacher." },
      { label: "Mumble thanks and leave", effect: (c) => { const t = teacherOf(c); if (t) t.level = clamp(t.level + 2); }, resultText: () => "You thought about it all week." },
    ],
  },
  {
    id: "tutoring-offer",
    minAge: 10,
    maxAge: 17,
    weight: 1.4,
    condition: (c) => school(c) && (c.reportCards?.[c.reportCards.length - 1]?.gpa ?? 3) < 2.6,
    text: (c) => `Your last report card wasn't great. ${c.relationships.find((r) => r.type === "mother" || r.type === "father")?.name.split(" ")[0] ?? "Your parent"} suggests a tutor.`,
    choices: [
      { label: "Accept the tutor", sublabel: "Costs your family money", effect: (c) => { const cost = Math.round(200 * priceLevel(c)); if (CLASSES[c.background?.wealthClass ?? "middle"].allowance >= 100) { c.helpBonus = (c.helpBonus ?? 0) + 5; changeStat(c, "smarts", 2, "Tutoring"); } else { c.helpBonus = (c.helpBonus ?? 0) + 2; c.yearLog.push(`Your family stretched their budget for tutoring ($${cost}).`); } }, resultText: () => "Twice a week, and it starts to click." },
      { label: "No thanks, you'll manage", effect: (c) => { conduct(c, 0); }, resultText: () => "You say you'll work harder. We'll see." },
    ],
  },
  {
    id: "class-election",
    minAge: 11,
    maxAge: 17,
    weight: 1.2,
    condition: school,
    text: () => "Nominations are open for class representative. Someone from your row suggests you should run.",
    choices: [
      { label: "Run", effect: (c) => { const p = clamp(0.25 + (c.popularity ?? 50) / 200 + ((c.talents?.social ?? 50) - 50) / 200, 0.1, 0.8); const s = (c.skills ??= {}); s.leadership = clamp((s.leadership ?? 0) + 3); if (Math.random() < p) { pop(c, 8); s.leadership = clamp((s.leadership ?? 0) + 4); changeStat(c, "happiness", 5, "Winning an election"); c.yearLog.push("You were elected class representative."); } else { pop(c, -1); changeStat(c, "happiness", -2, "Losing an election"); } }, resultText: () => "You made a speech. Your hands were shaking." },
      { label: "Stay out of it", effect: () => {}, resultText: () => "Someone else got the job." },
    ],
  },
  {
    id: "school-newspaper",
    minAge: 12,
    maxAge: 17,
    once: true,
    weight: 1.1,
    condition: school,
    text: () => "The school newspaper is short on writers.",
    choices: [
      { label: "Write for it", effect: (c) => { const s = (c.skills ??= {}); s.debate = clamp((s.debate ?? 0) + randomInt(3, 7)); changeStat(c, "smarts", 2, "Writing for the paper"); pop(c, 2); }, resultText: () => "Your first byline was for a piece on the canteen." },
      { label: "Not for you", effect: () => {}, resultText: () => "You read it every issue anyway." },
    ],
  },
  {
    id: "prank-invite",
    minAge: 12,
    maxAge: 17,
    weight: 1.2,
    condition: school,
    text: () => "Your friends have planned a prank on the last day of term. They want you in.",
    choices: [
      { label: "Join in", effect: (c) => { pop(c, 5); const caught = Math.random() < 0.35; if (caught) { misbehave(c, 2, "a prank"); c.yearLog.push("The prank went wrong and you were caught."); } else { changeStat(c, "happiness", 5, "A perfect prank"); conduct(c, -3); } }, resultText: () => "It'll be told at reunions." },
      { label: "Say no", effect: (c) => { conduct(c, 2); pop(c, -2); }, resultText: () => "They thought you were boring. You weren't in trouble." },
    ],
  },
  {
    id: "graffiti-dare",
    minAge: 13,
    maxAge: 17,
    weight: 0.8,
    condition: school,
    text: () => "Someone dares you to spray your name on the back wall of the gym.",
    choices: [
      { label: "Do it", tone: "danger", effect: (c) => { pop(c, 4); if (Math.random() < 0.45) { misbehave(c, 3, "vandalism"); const p = c.relationships.find((r) => r.type === "mother" || r.type === "father"); if (p) p.level = clamp(p.level - 8); } else conduct(c, -6); }, resultText: () => "Your name is on the wall. Somebody will find out." },
      { label: "Refuse", effect: (c) => { conduct(c, 2); }, resultText: () => "You walked away." },
    ],
  },
  {
    id: "school-trip",
    minAge: 9,
    maxAge: 17,
    weight: 1.3,
    condition: school,
    text: () => "The school is running an overnight trip - a museum, a hostel and very little sleep. It costs money.",
    choices: [
      { label: "Go", effect: (c) => { const rich = CLASSES[c.background?.wealthClass ?? "middle"].allowance >= 100; if (rich) { changeStat(c, "happiness", 7, "A school trip"); for (const r of c.relationships) if (r.alive && r.type === "classmate") r.level = clamp(r.level + 6); changeStat(c, "smarts", 1, "Seeing the world"); } else { changeStat(c, "happiness", 2, "Not being able to afford it"); c.yearLog.push("Your family couldn't afford the trip this time."); } }, resultText: () => "You came back exhausted and in love with your friends." },
      { label: "Stay home", effect: (c) => { changeStat(c, "happiness", -1, "Missing the trip"); }, resultText: () => "You watched the photos afterwards." },
    ],
  },
  {
    id: "homework-overload",
    minAge: 9,
    maxAge: 17,
    weight: 1.6,
    condition: school,
    text: () => "Three teachers have set big assignments for the same week.",
    choices: [
      { label: "Pull an all-nighter", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 6); changeStat(c, "health", -2, "An all-nighter"); c.helpBonus = (c.helpBonus ?? 0) + 1; }, resultText: () => "You handed everything in with zombie eyes." },
      { label: "Do what you can", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) - 1; }, resultText: () => "Two out of three isn't bad." },
      { label: "Copy a friend's", tone: "danger", effect: (c) => { const caught = Math.random() < 0.3; if (caught) misbehave(c, 2, "copying work"); else conduct(c, -3); }, resultText: () => "It's only a little bit cheating." },
    ],
  },
  {
    id: "teacher-unfair",
    minAge: 10,
    maxAge: 17,
    weight: 1.1,
    condition: (c) => school(c) && !!teacherOf(c),
    text: (c) => `${teacherOf(c)?.name ?? "Your teacher"} accuses you of talking during a test. You weren't.`,
    choices: [
      { label: "Argue your case", effect: (c) => { const t = teacherOf(c); if (Math.random() < 0.5) { if (t) t.level = clamp(t.level + 4); changeStat(c, "happiness", 2, "Being believed"); } else { if (t) t.level = clamp(t.level - 8); misbehave(c, 1, "arguing with a teacher"); } }, resultText: () => "You kept your voice level." },
      { label: "Accept it", effect: (c) => { changeStat(c, "happiness", -3, "An unfair mark"); if (c.personality) c.personality.a = clamp(c.personality.a + 1); }, resultText: () => "It stung more than it should have." },
      { label: "Tell your parents", effect: (c) => { const p = c.relationships.find((r) => r.type === "mother" || r.type === "father"); if (p) p.level = clamp(p.level + 4); const t = teacherOf(c); if (t) t.level = clamp(t.level - 3); }, resultText: () => "Your parent sent an email. It was polite and slightly terrifying." },
    ],
  },
  {
    id: "new-student",
    minAge: 8,
    maxAge: 15,
    weight: 1.3,
    condition: school,
    text: () => "A new student joins your class halfway through the term. They're sitting alone at lunch.",
    choices: [
      { label: "Sit with them", effect: (c) => { changeStat(c, "happiness", 3, "Making a friend"); pop(c, -1); const cm = randomClassmate(c); if (cm) cm.level = clamp(cm.level + 12); c.yearLog.push("You befriended the new kid."); }, resultText: () => "By Friday they were telling you their whole life story." },
      { label: "Stay with your usual group", effect: () => {}, resultText: () => "Somebody else sat with them." },
      { label: "Make fun of their accent", tone: "danger", effect: (c) => { pop(c, 3); conduct(c, -6); if (Math.random() < 0.3) misbehave(c, 1, "picking on a new student"); }, resultText: () => "A few of the others laughed. You weren't proud of it later." },
    ],
  },
  {
    id: "bully-witness",
    minAge: 8,
    maxAge: 16,
    weight: 1.2,
    condition: (c) => school(c) && !c.bullying,
    text: () => "In the corridor, a group is picking on someone smaller. Nobody is doing anything.",
    choices: [
      { label: "Step in", effect: (c) => { const win = Math.random() < 0.55; if (win) { pop(c, 3); changeStat(c, "happiness", 4, "Doing the right thing"); } else { pop(c, -3); changeStat(c, "happiness", -1, "Standing up and getting shoved"); } c.conduct = clamp((c.conduct ?? 80) + 1); }, resultText: () => "You said 'leave them alone'. Your legs were shaking." },
      { label: "Tell a teacher", effect: (c) => { const t = teacherOf(c); if (t) t.level = clamp(t.level + 4); changeStat(c, "happiness", 1, "Telling someone"); }, resultText: () => "A teacher was there in seconds." },
      { label: "Walk past", effect: (c) => { changeStat(c, "happiness", -2, "Looking away"); }, resultText: () => "You looked at the floor and kept moving." },
    ],
  },
  {
    id: "perfectionist-pressure",
    minAge: 14,
    maxAge: 18,
    weight: 1.3,
    condition: (c) => school(c) && (c.reportCards?.[c.reportCards.length - 1]?.honor ?? false) && !!c.quirks?.includes("perfectionist"),
    text: () => "You got an A-minus. All you can think about is the minus.",
    choices: [
      { label: "Talk to someone about it", effect: (c) => { c.stress = clamp((c.stress ?? 25) - 8); c.sanity = clamp((c.sanity ?? 75) + 4); }, resultText: () => "You cried a bit. It helped." },
      { label: "Redouble your efforts", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 8); c.studyMode = "hard"; }, resultText: () => "Tomorrow, you'll do better." },
    ],
  },
  {
    id: "college-fair",
    minAge: 15,
    maxAge: 17,
    once: true,
    weight: 1.6,
    condition: school,
    text: () => "A college and careers fair comes to the school hall - stalls for universities, apprenticeships and armed forces.",
    choices: [
      { label: "Visit the universities", effect: (c) => { c.track = "college"; changeStat(c, "smarts", 1, "Thinking about your future"); }, resultText: () => "You collected a bag of leaflets." },
      { label: "Talk to the trades and apprenticeships", effect: (c) => { c.track = "trade"; }, resultText: () => "A plumber gave you a very honest talk about earning while you learn." },
      { label: "Head straight for the free snacks", effect: (c) => { changeStat(c, "happiness", 2, "Free snacks"); }, resultText: () => "You'd think about it next year." },
    ],
  },
];
