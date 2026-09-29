import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { gainFitness } from "../../engine/health";
import { gainInternship, addStudentLoan } from "../../engine/higher";
import { setFlag } from "../../engine/school";
import { majorDef } from "../majors";

// Campus life: the moments that make a degree a place and a few years, not a
// spreadsheet. All of them need you to be enrolled somewhere.

const enrolled = (c: Character) => !!c.higher;
const yearsLeft = (c: Character) => (c.higher ? c.higher.years - c.higher.done : 0);
const teacher = (c: Character) => c.relationships.find((r) => r.type === "teacher" && r.alive);
const rich = (c: Character) => ["comfortable", "wealthy"].includes(c.background?.wealthClass ?? "middle");

export const COLLEGE_EXTRA_EVENTS: LifeEvent[] = [
  {
    id: "career-fair",
    minAge: 18,
    maxAge: 40,
    weight: 1.6,
    condition: (c) => enrolled(c) && (c.higher?.level ?? "bachelor") !== "certificate",
    text: (c) => `The careers fair is on campus. Employers in ${majorDef(c.higher!.major)?.field ?? "your field"} are handing out lanyards and business cards.`,
    choices: [
      { label: "Work the room", effect: (c) => { const ok = Math.random() < 0.35 + ((c.talents?.social ?? 50) - 50) / 200; if (ok) { gainInternship(c); c.yearLog.push("A contact from the fair turned into an internship."); } else changeStat(c, "happiness", 1, "Practice at networking"); }, resultText: () => "You shook a lot of hands." },
      { label: "Grab the free pens and go", effect: (c) => { changeStat(c, "happiness", 1, "Free pens"); }, resultText: () => "Fine pens, no plan." },
    ],
  },
  {
    id: "tuition-hike",
    minAge: 18,
    maxAge: 40,
    weight: 1,
    condition: (c) => enrolled(c) && (c.higher?.tuition ?? 0) > 2000,
    text: () => "The university announces a fee rise next year. Students are furious.",
    choices: [
      { label: "Join the protest", effect: (c) => { changeStat(c, "happiness", 2, "Standing up for something"); if (c.personality) c.personality.o = clamp(c.personality.o + 1); c.conduct = clamp((c.conduct ?? 80) - 1); }, resultText: () => "You marched, chanted and lost your voice." },
      { label: "Pick up extra hours at work", effect: (c) => { c.money += 600; c.stress = clamp((c.stress ?? 25) + 6); }, resultText: () => "Every hour helps." },
      { label: "Grit your teeth", effect: (c) => { if (c.higher) c.higher.tuition = Math.round(c.higher.tuition * 1.05); }, resultText: () => "Your course costs a little more from now on." },
    ],
  },
  {
    id: "scholarship-review",
    minAge: 19,
    maxAge: 30,
    weight: 1.5,
    condition: (c) => enrolled(c) && (c.higher?.scholarship ?? 0) > 0 && (c.higher?.done ?? 0) >= 1,
    text: (c) => `Your scholarship is up for review. ${(c.higher?.gpa ?? 3) < 3 ? "Your grades are on the borderline." : "Your grades should carry you."}`,
    choices: [
      { label: "Make your case", effect: (c) => { const h = c.higher!; const keep = h.gpa >= 3 || Math.random() < 0.4 + ((c.talents?.verbal ?? 50) - 50) / 250; if (!keep) { h.scholarship = Math.round(h.scholarship * 0.5); c.yearLog.push("They halved your scholarship."); } else changeStat(c, "happiness", 2, "Keeping your funding"); }, resultText: () => "You put on your best shirt and did your best." },
      { label: "Hope for the best", effect: (c) => { const h = c.higher!; if (h.gpa < 3 && Math.random() < 0.5) { h.scholarship = Math.round(h.scholarship * 0.5); c.yearLog.push("Your scholarship was cut in half."); } }, resultText: () => "The letter came in the post." },
    ],
  },
  {
    id: "professor-research",
    minAge: 19,
    maxAge: 40,
    once: true,
    weight: 1.4,
    condition: (c) => enrolled(c) && (c.higher?.gpa ?? 0) >= 3.2 && (c.higher?.done ?? 0) >= 1 && !!teacher(c),
    text: (c) => `${teacher(c)!.name} asks whether you'd like to help with a research project over the summer.`,
    choices: [
      { label: "Say yes", effect: (c) => { const t = teacher(c); if (t) t.level = clamp(t.level + 15); changeStat(c, "smarts", 3, "Research"); gainInternship(c); c.stress = clamp((c.stress ?? 25) + 4); c.yearLog.push("You spent the summer in the lab. It looks brilliant on a CV."); }, resultText: () => "Long days, short nights and your name on a paper." },
      { label: "Take the summer off", effect: (c) => { changeStat(c, "happiness", 4, "A proper summer"); }, resultText: () => "You lay in a park and read for fun." },
    ],
  },
  {
    id: "roommate-conflict",
    minAge: 18,
    maxAge: 24,
    weight: 1.1,
    condition: (c) => enrolled(c) && c.higher!.housing !== "commute",
    text: () => "Your roommate has stopped washing up and has started playing music at 2 a.m.",
    choices: [
      { label: "Have a proper talk", effect: (c) => { changeStat(c, "happiness", 2, "Clearing the air"); const p = c.relationships.find((r) => r.type === "classmate" && r.alive); if (p) p.level = clamp(p.level + 8); }, resultText: () => "It was awkward for ten minutes and better for a year." },
      { label: "Leave passive-aggressive notes", effect: (c) => { changeStat(c, "happiness", -2, "A cold war"); c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "The notes got longer. Nothing changed." },
      { label: "Move out", effect: (c) => { if (c.higher) { c.higher.housing = "apartment"; c.currentHousing = "apartment"; } changeStat(c, "happiness", 1, "Your own space"); }, resultText: () => "A little more expensive, a lot more peaceful." },
    ],
  },
  {
    id: "campus-job",
    minAge: 18,
    maxAge: 30,
    once: true,
    weight: 1.3,
    condition: (c) => enrolled(c) && !rich(c) && !c.partTime,
    text: () => "The library is hiring student staff for evenings and weekends.",
    choices: [
      { label: "Take the job", effect: (c) => { c.money += 1500; c.stress = clamp((c.stress ?? 25) + 4); changeStat(c, "smarts", 1, "Quiet study hours"); }, resultText: () => "It pays for the groceries and the coffee." },
      { label: "Focus on classes", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) + 2; }, resultText: () => "You can afford not to. Just." },
    ],
  },
  {
    id: "thesis-crunch",
    minAge: 20,
    maxAge: 40,
    weight: 2,
    condition: (c) => enrolled(c) && yearsLeft(c) <= 1 && (c.higher?.level ?? "bachelor") !== "certificate",
    text: () => "Your final project is due in three weeks and you've barely started.",
    choices: [
      { label: "Live in the library", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) + 3; c.stress = clamp((c.stress ?? 25) + 10); changeStat(c, "health", -3, "Thesis crunch"); }, resultText: () => "You handed it in with seconds to spare." },
      { label: "Ask for an extension", effect: (c) => { const t = teacher(c); const ok = Math.random() < 0.5; if (ok) { c.stress = clamp((c.stress ?? 25) + 3); } else { c.helpBonus = (c.helpBonus ?? 0) - 2; if (t) t.level = clamp(t.level - 5); } }, resultText: () => "You waited for the email." },
      { label: "Write it in a weekend", tone: "danger", effect: (c) => { c.helpBonus = (c.helpBonus ?? 0) - 1; changeStat(c, "happiness", 2, "Not stressing"); }, resultText: () => "You've never typed so fast." },
    ],
  },
  {
    id: "cheating-scandal",
    minAge: 18,
    maxAge: 30,
    weight: 0.7,
    condition: enrolled,
    text: () => "A friend offers you a copy of last year's exam paper.",
    choices: [
      { label: "Take it", tone: "danger", effect: (c) => { const caught = Math.random() < 0.3; if (caught) { const h = c.higher!; h.gpa = Math.max(0, h.gpa - 0.4); c.gpa = h.gpa; changeStat(c, "happiness", -8, "Academic misconduct"); setFlag(c, "cheating-record"); c.yearLog.push("You were caught cheating and your grade was voided."); } else { c.helpBonus = (c.helpBonus ?? 0) + 3; } }, resultText: () => "You looked at it for a long time." },
      { label: "Hand it back", effect: (c) => { c.conduct = clamp((c.conduct ?? 80) + 2); }, resultText: () => "You felt a bit like a saint." },
    ],
  },
  {
    id: "homesick",
    minAge: 18,
    maxAge: 22,
    once: true,
    weight: 1.5,
    condition: (c) => enrolled(c) && c.higher!.housing !== "commute" && (c.higher?.done ?? 0) === 0,
    text: () => "It's a few weeks in. You're eating dinner alone and you suddenly miss home very much.",
    choices: [
      { label: "Call home", effect: (c) => { for (const r of c.relationships) if (r.alive && (r.type === "mother" || r.type === "father")) r.level = clamp(r.level + 6); changeStat(c, "happiness", 2, "A call home"); }, resultText: () => "You talked for two hours." },
      { label: "Knock on your neighbour's door", effect: (c) => { const p = c.relationships.find((r) => r.type === "classmate" && r.alive); if (p) p.level = clamp(p.level + 12); changeStat(c, "happiness", 4, "A new friend"); }, resultText: () => "They had pasta and a very loud opinion about football." },
      { label: "Tough it out", effect: (c) => { changeStat(c, "happiness", -4, "Loneliness"); if (c.personality) c.personality.n = clamp(c.personality.n + 1); }, resultText: () => "You watched three films alone." },
    ],
  },
  {
    id: "first-gen-pressure",
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 1.2,
    condition: (c) => enrolled(c) && ["struggling", "working"].includes(c.background?.wealthClass ?? "middle"),
    text: () => "You're the first in your family at university. Everyone back home is proud - and quietly hopeful that you'll fix everything.",
    choices: [
      { label: "Carry it with pride", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 4); for (const r of c.relationships) if (r.alive && (r.type === "mother" || r.type === "father")) r.level = clamp(r.level + 5); }, resultText: () => "You wear it like a medal - and a weight." },
      { label: "Tell them it's not that simple", effect: (c) => { changeStat(c, "happiness", 1, "Honesty"); }, resultText: () => "They listened. Eventually." },
    ],
  },
  {
    id: "student-loan-worry",
    minAge: 19,
    maxAge: 40,
    weight: 1.3,
    condition: (c) => enrolled(c) && (c.loans ?? []).some((l) => l.kind === "student" && l.balance > 8000),
    text: (c) => `You add up your student loan: $${Math.round((c.loans ?? []).find((l) => l.kind === "student")?.balance ?? 0).toLocaleString()} and rising with interest.`,
    choices: [
      { label: "Pick up extra work", effect: (c) => { c.money += 800; c.stress = clamp((c.stress ?? 25) + 5); }, resultText: () => "A dent, if a small one." },
      { label: "Try not to think about it", effect: (c) => { changeStat(c, "happiness", -2, "Debt anxiety"); }, resultText: () => "You closed the spreadsheet." },
      { label: "Ask your family for help", effect: (c) => { const p = c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father")); const ok = !!p && (p.wealth ?? 30) > 55 && p.level > 45; if (ok && p) { const loan = (c.loans ?? []).find((l) => l.kind === "student"); if (loan) loan.balance = Math.max(0, loan.balance - 3000); p.level = clamp(p.level + 2); } else if (p) p.level = clamp(p.level - 2); }, resultText: () => "You had an awkward conversation about money." },
    ],
  },
  {
    id: "society-role",
    minAge: 18,
    maxAge: 30,
    weight: 1.2,
    condition: enrolled,
    text: () => "The drama society, the football club and the student paper all want you on their committee.",
    choices: [
      { label: "Take the treasurer role", effect: (c) => { const s = (c.skills ??= {}); s.leadership = clamp((s.leadership ?? 0) + 6); c.stress = clamp((c.stress ?? 25) + 3); c.popularity = clamp((c.popularity ?? 50) + 3); }, resultText: () => "You learned to chase people for money." },
      { label: "Just show up", effect: (c) => { changeStat(c, "happiness", 2, "Society nights"); gainFitness(c, 2); }, resultText: () => "The best bits, none of the admin." },
    ],
  },
  {
    id: "return-offer",
    minAge: 20,
    maxAge: 40,
    once: true,
    weight: 2.4,
    condition: (c) => enrolled(c) && yearsLeft(c) <= 1 && (c.internships ?? 0) >= 1 && (c.higher?.level ?? "bachelor") !== "certificate",
    text: () => "Your internship manager calls you into the office. \"We'd like to keep you when you graduate.\"",
    choices: [
      { label: "Accept the return offer", effect: (c) => { setFlag(c, "return-offer"); changeStat(c, "happiness", 6, "A job lined up"); c.stress = clamp((c.stress ?? 25) - 6); }, resultText: () => "You know where you're going after graduation." },
      { label: "Keep your options open", effect: () => {}, resultText: () => "You said you'd think about it." },
    ],
  },
  {
    id: "grad-school-thoughts",
    minAge: 20,
    maxAge: 40,
    once: true,
    weight: 1.4,
    condition: (c) => enrolled(c) && c.higher!.level === "bachelor" && yearsLeft(c) <= 1 && (c.higher?.gpa ?? 0) >= 3.2,
    text: () => "A professor tells you your grades would get you into a good graduate programme.",
    choices: [
      { label: "It's worth a serious look", effect: (c) => { setFlag(c, "considering-grad-school"); }, resultText: () => "You'll find it under College & beyond > Grad school after you graduate." },
      { label: "You're ready to work", effect: () => {}, resultText: () => "Enough exams for one lifetime." },
    ],
  },
  {
    id: "spring-break-trip",
    minAge: 18,
    maxAge: 25,
    weight: 1,
    condition: enrolled,
    text: () => "Your friends are planning a big spring trip. It's not cheap.",
    choices: [
      { label: "Go", effect: (c) => { const cost = 400; if (c.money >= cost) { c.money -= cost; changeStat(c, "happiness", 8, "The trip of a lifetime"); for (const r of c.relationships) if (r.alive && (r.type === "friend" || r.type === "classmate")) r.level = clamp(r.level + 8); } else { addStudentLoan(c, cost); changeStat(c, "happiness", 6, "The trip"); c.yearLog.push("You put the trip on the student loan. Oops."); } }, resultText: () => "You'll be telling stories about it at your wedding." },
      { label: "Stay and work", effect: (c) => { c.money += randomInt(200, 500); }, resultText: () => "A quiet week, and a fatter wallet." },
    ],
  },
];
