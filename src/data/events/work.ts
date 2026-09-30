import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { hasActiveCondition } from "../../engine/worldState";
import { loseJob, pensionIncome, salaryNow, retireAge } from "../../engine/career";
import { refreshCoworkers } from "../../engine/people";
import { medicalBill } from "../../engine/health";
import { buyStock, ensureMarket } from "../../engine/stocks";
import { livingIndex } from "../../engine/where";
import { valueOf, marketingCost } from "../../engine/business";
import { toggleUnion } from "../../engine/career";
import { companyFor } from "../companies";
import { getRegion } from "../regions";

// Working life, running a business and money's little dramas.

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const employed = (c: Character) => !!c.job && c.job.kind === "fulltime" && !c.inJail;
const boss = (c: Character) => (c.job ? Math.round(c.job.rapport ?? 50) : 50);
const scale = (c: Character) => livingIndex(c.originRegion);
const bump = (c: Character, n: number) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) + n); };
const perfBump = (c: Character, n: number) => { if (c.job) c.job.perf = clamp((c.job.perf ?? 55) + n); };
const physical = ["Outdoors & Trades", "Logistics", "Public Service", "Healthcare", "Food & Hospitality"];
const publicFacing = ["Retail & Service", "Food & Hospitality", "Public Service", "Healthcare"];
const biz = (c: Character) => c.business;

export const WORK_EVENTS: LifeEvent[] = [
  // ------------------------------------------------------------ the job
  {
    id: "toxic-boss",
    minAge: 20,
    maxAge: 64,
    weight: 1.6,
    condition: (c) => employed(c) && boss(c) < 60,
    text: () => "Your manager has a habit of belittling people in meetings, and today it was your turn.",
    choices: [
      { label: "Take it to HR", effect: (c) => { if (Math.random() < 0.5) { bump(c, 6); changeStat(c, "happiness", 3, "Being heard"); } else { bump(c, -10); changeStat(c, "happiness", -4, "Retaliation"); } }, resultText: () => "You wrote everything down and booked a meeting." },
      { label: "Keep your head down", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 8); changeStat(c, "happiness", -4, "A miserable boss"); }, resultText: () => "You've stopped speaking in meetings." },
      { label: "Start job hunting", effect: (c) => { c.network = clamp((c.network ?? 0) + 5); changeStat(c, "happiness", 1, "A plan"); }, resultText: () => "Your CV got a long-overdue update." },
    ],
  },
  {
    id: "mentor",
    minAge: 21,
    maxAge: 45,
    weight: 1.4,
    once: true,
    condition: (c) => employed(c) && (c.job?.rung ?? 0) <= 2 && (c.job?.perf ?? 0) >= 50,
    autoEffect: (c) => { bump(c, 8); perfBump(c, 5); c.network = clamp((c.network ?? 0) + 6); changeStat(c, "smarts", 2, "A good mentor"); },
    text: () => "A senior colleague has taken you under their wing, sharing the unwritten rules and putting your name forward.",
  },
  {
    id: "overtime-crunch",
    minAge: 20,
    maxAge: 64,
    weight: 1.6,
    condition: (c) => employed(c),
    text: (c) => `A big deadline at ${c.job?.company?.name ?? "work"} means everyone's being asked to stay late for weeks.`,
    choices: [
      { label: "Give it everything", effect: (c) => { perfBump(c, 8); bump(c, 5); c.stress = clamp((c.stress ?? 25) + 12); changeStat(c, "health", -3, "Long hours"); }, resultText: () => "You lived on coffee and adrenaline, and people noticed." },
      { label: "Do your hours, no more", effect: (c) => { bump(c, -3); }, resultText: () => "You went home at five. Some people noticed that too." },
    ],
  },
  {
    id: "headhunter",
    minAge: 24,
    maxAge: 58,
    weight: 1.3,
    condition: (c) => employed(c) && (c.job?.perf ?? 0) >= 62 && (c.job?.rung ?? 0) >= 1,
    text: (c) => `A headhunter calls: a rival firm wants a ${c.job?.baseTitle ?? "someone like you"} with your track record, at a better salary.`,
    choices: [
      { label: "Take the job", effect: (c, world) => { const j = c.job; if (!j) return; j.salary = Math.round(j.salary * 1.18); j.company = companyFor(j.field ?? "Office & Admin", c.originRegion, `${c.avatarSeed ?? 0}|${c.age}|hh`, j.title); j.rapport = 50; j.since = c.age; j.perf = 60; (c.jobHistory ??= []).push({ title: j.title, company: j.company.name, from: c.age, to: -1 }); refreshCoworkers(c); c.yearLog.push(`You moved to ${j.company.name} on ${money(salaryNow(c, world))} a year.`); }, resultText: () => "New badge, new desk, new coffee machine." },
      { label: "Use it to negotiate a raise", effect: (c) => { const j = c.job; if (j && Math.random() < 0.6) { j.salary = Math.round(j.salary * (1.08 + Math.random() * 0.06)); c.yearLog.push("Your employer matched enough to keep you."); } else bump(c, -4); }, resultText: () => "You sat across the table and quietly named a number." },
      { label: "Not interested", effect: (c) => { bump(c, 2); }, resultText: () => "Loyalty has its own rewards." },
    ],
  },
  {
    id: "layoff-rumours",
    minAge: 20,
    maxAge: 62,
    weight: 2,
    condition: (c, world) => employed(c) && (hasActiveCondition(world, "recession") || (c.job?.perf ?? 60) < 50),
    text: () => "There are whispers of redundancies. Nobody will say anything official, and everyone's watching everyone else.",
    choices: [
      { label: "Refresh your CV and network", effect: (c) => { c.network = clamp((c.network ?? 0) + 8); c.stress = clamp((c.stress ?? 25) + 3); }, resultText: () => "Better to be ready." },
      { label: "Work harder to be indispensable", effect: (c) => { perfBump(c, 6); c.stress = clamp((c.stress ?? 25) + 8); }, resultText: () => "You stopped taking lunch breaks." },
      { label: "Volunteer for redundancy", effect: (c, world) => { loseJob(c, "laidoff", world); }, resultText: () => "You took the package and the open road." },
    ],
  },
  {
    id: "office-party",
    minAge: 21,
    maxAge: 64,
    weight: 1.3,
    condition: (c) => employed(c),
    text: () => "It's the company's end-of-year party. There's an open bar and your boss is holding court.",
    choices: [
      { label: "Mingle and stay sensible", effect: (c) => { bump(c, 5); c.network = clamp((c.network ?? 0) + 3); changeStat(c, "happiness", 2, "A good night out"); }, resultText: () => "You remembered everyone's name." },
      { label: "Make a night of it", effect: (c) => { if (Math.random() < 0.4) { bump(c, -10); changeStat(c, "happiness", -3, "A regrettable night"); } else { bump(c, 3); changeStat(c, "happiness", 4, "A great night"); } }, resultText: () => "The photos are already in the group chat." },
      { label: "Slip out early", effect: (c) => { bump(c, -1); }, resultText: () => "Nobody noticed. Probably." },
    ],
  },
  {
    id: "remote-work-offer",
    minAge: 23,
    maxAge: 58,
    weight: 1.2,
    once: true,
    condition: (c) => employed(c) && ["Tech", "Finance & Business", "Office & Admin", "Creative & Media"].includes(c.job?.field ?? ""),
    text: () => "Your team is trialling remote work. You could give up the commute, but you'd see a lot less of your colleagues.",
    choices: [
      { label: "Work from home", effect: (c) => { c.stress = clamp((c.stress ?? 25) - 6); changeStat(c, "happiness", 3, "No commute"); bump(c, -4); }, resultText: () => "Trousers are now optional." },
      { label: "Stay in the office", effect: (c) => { bump(c, 3); c.network = clamp((c.network ?? 0) + 3); }, resultText: () => "You like the buzz." },
    ],
  },
  {
    id: "union-drive",
    minAge: 20,
    maxAge: 62,
    weight: 1.2,
    once: true,
    condition: (c) => employed(c) && !c.inUnion,
    text: () => "A union rep is signing people up at your workplace. Dues come out of your pay, but they say they'll fight for job security and raises.",
    choices: [
      { label: "Join", effect: (c) => { if (!c.inUnion) toggleUnion(c); bump(c, -2); }, resultText: () => "You signed the card." },
      { label: "Stay out of it", effect: (c) => { bump(c, 3); }, resultText: () => "Management noticed you didn't sign." },
    ],
  },
  {
    id: "workplace-accident",
    minAge: 19,
    maxAge: 62,
    weight: 1.1,
    condition: (c) => employed(c) && physical.includes(c.job?.field ?? ""),
    text: () => "You hurt yourself on the job: not catastrophic, but painful.",
    choices: [
      { label: "Take time off to recover", effect: (c) => { c.money -= medicalBill(c, 250); changeStat(c, "health", -4, "An injury"); perfBump(c, -3); }, resultText: () => "You did what the doctor said, for once." },
      { label: "Push through it", effect: (c) => { changeStat(c, "health", -9, "Working through an injury"); perfBump(c, 2); }, resultText: () => "It'll be fine. Probably." },
    ],
  },
  {
    id: "customer-abuse",
    minAge: 16,
    maxAge: 64,
    weight: 1.4,
    condition: (c) => (!!c.job || !!c.partTime) && publicFacing.includes((c.job ?? c.partTime)?.field ?? ""),
    text: () => "A customer is shouting at you about something that isn't your fault, in front of a queue of people.",
    choices: [
      { label: "Stay calm and professional", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 4); bump(c, 3); }, resultText: () => "You smiled until it was over." },
      { label: "Snap back", effect: (c) => { changeStat(c, "happiness", 3, "Letting it out"); bump(c, -9); }, resultText: () => "It felt great. For about a minute." },
    ],
  },
  {
    id: "certification-offer",
    minAge: 22,
    maxAge: 55,
    weight: 1.2,
    condition: (c) => employed(c) && c.money > 2000 * scale(c),
    text: () => "A professional certification would look great on your file. It costs money and a lot of evenings.",
    choices: [
      { label: "Do it", effect: (c) => { c.money -= Math.round(1500 * scale(c)); perfBump(c, 7); if (c.job) c.job.salary = Math.round(c.job.salary * 1.03); changeStat(c, "smarts", 2, "A certification"); c.stress = clamp((c.stress ?? 25) + 5); }, resultText: () => "Three months of study later: a certificate and a pay bump." },
      { label: "Not now", effect: () => {}, resultText: () => "Maybe next year." },
    ],
  },
  {
    id: "burnout",
    minAge: 22,
    maxAge: 62,
    weight: 4,
    condition: (c) => employed(c) && (c.stress ?? 0) > 80 && c.workMode === "grind",
    text: () => "You wake up unable to face the day. Your body has decided the grind is over, whether you have or not.",
    choices: [
      { label: "Take a sabbatical", effect: (c, world) => { c.money -= Math.round(salaryNow(c, world) * 0.25); c.stress = 30; changeStat(c, "health", 6, "Rest"); changeStat(c, "happiness", 4, "Rest"); c.workMode = "steady"; }, resultText: () => "Three months away. It cost you, and you needed every day." },
      { label: "Push on regardless", effect: (c) => { changeStat(c, "health", -9, "Burnout"); changeStat(c, "happiness", -9, "Burnout"); perfBump(c, -10); }, resultText: () => "Something has to give." },
    ],
  },
  {
    id: "conference-invite",
    minAge: 23,
    maxAge: 58,
    weight: 1.1,
    condition: (c) => employed(c) && (c.job?.rung ?? 0) >= 1,
    text: () => "You've been asked to speak at an industry conference.",
    choices: [
      { label: "Accept and prepare properly", effect: (c) => { c.network = clamp((c.network ?? 0) + 12); perfBump(c, 3); c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "You were nervous and it went brilliantly." },
      { label: "Decline politely", effect: (c) => { bump(c, -1); }, resultText: () => "Someone else got the slot." },
    ],
  },
  {
    id: "company-scandal",
    minAge: 22,
    maxAge: 60,
    weight: 0.6,
    condition: (c) => employed(c) && c.job?.company?.size !== "Small business",
    text: (c) => `You've come across proof that ${c.job?.company?.name ?? "your employer"} is cutting corners in a way that could hurt people.`,
    choices: [
      { label: "Blow the whistle", effect: (c, world) => { changeStat(c, "happiness", 5, "Doing the right thing"); if (Math.random() < 0.45) { c.yearLog.push("You were pushed out for it."); loseJob(c, "fired", world); } else bump(c, -12); }, resultText: () => "It got very quiet in the office." },
      { label: "Keep quiet", effect: (c) => { changeStat(c, "happiness", -5, "A guilty conscience"); }, resultText: () => "You sleep worse." },
    ],
  },
  {
    id: "pension-letter",
    minAge: 50,
    maxAge: 64,
    once: true,
    weight: 3,
    autoEffect: (c) => { c.network = clamp((c.network ?? 0)); },
    text: (c, world) => `A statement arrives: at ${retireAge(c)}, your state pension should be around ${money(pensionIncome({ ...c, retired: true, age: retireAge(c) } as Character, world))} a year.`,
  },
  // ------------------------------------------------------------ the business
  {
    id: "biz-viral",
    minAge: 18,
    maxAge: 80,
    weight: 1.6,
    condition: (c) => !!biz(c),
    autoEffect: (c) => { if (c.business) { const good = Math.random() < 0.65; c.business.rep = clamp(c.business.rep + (good ? 12 : -12)); c.yearLog.push(good ? "A glowing review went viral." : "A furious review went viral."); } },
    text: (c) => `Something someone posted about ${c.business?.name} was shared all over town.`,
  },
  {
    id: "biz-supplier",
    minAge: 18,
    maxAge: 80,
    weight: 1.5,
    condition: (c) => !!biz(c),
    text: (c) => `Your main supplier for ${c.business?.name} has put prices up by 15%.`,
    choices: [
      { label: "Absorb it", effect: (c) => { if (c.business) c.business.reserve -= Math.round(5000 * scale(c)); }, resultText: () => "Margins shrank, customers noticed nothing." },
      { label: "Pass it on to customers", effect: (c) => { if (c.business) c.business.rep = clamp(c.business.rep - 6); }, resultText: () => "Some grumbling, but they stayed." },
      { label: "Find a new supplier", effect: (c) => { if (c.business) { c.business.reserve -= Math.round(1500 * scale(c)); c.business.rep = clamp(c.business.rep + (Math.random() < 0.5 ? 3 : -3)); } }, resultText: () => "Two weeks of phone calls." },
    ],
  },
  {
    id: "biz-key-staff",
    minAge: 18,
    maxAge: 80,
    weight: 1.3,
    condition: (c) => (biz(c)?.employees ?? 0) >= 1,
    text: () => "Your best employee says a competitor has offered them more money.",
    choices: [
      { label: "Match the offer", effect: (c) => { if (c.business) c.business.reserve -= Math.round(4000 * scale(c)); }, resultText: () => "They stayed, and they know their worth." },
      { label: "Let them go", effect: (c) => { if (c.business) { c.business.employees = Math.max(0, c.business.employees - 1); c.business.rep = clamp(c.business.rep - 4); } }, resultText: () => "You wished them luck. Then you started hiring." },
    ],
  },
  {
    id: "biz-big-client",
    minAge: 18,
    maxAge: 80,
    weight: 1.2,
    condition: (c) => !!biz(c) && (c.business?.rep ?? 0) >= 50,
    text: (c) => `A large customer wants to place a big, exclusive order with ${c.business?.name}.`,
    choices: [
      { label: "Take the deal", effect: (c) => { if (c.business) { c.business.reserve += Math.round(9000 * scale(c) * (0.8 + Math.random() * 0.8)); c.business.rep = clamp(c.business.rep + 4); c.stress = clamp((c.stress ?? 25) + 6); } }, resultText: () => "A busy, very profitable few months." },
      { label: "Decline; you'd be too dependent", effect: (c) => { changeStat(c, "smarts", 1, "Caution"); }, resultText: () => "Slow and steady." },
    ],
  },
  {
    id: "biz-competitor",
    minAge: 18,
    maxAge: 80,
    weight: 1.3,
    condition: (c) => !!biz(c),
    text: (c) => `A slick new competitor has opened two streets from ${c.business?.name}.`,
    choices: [
      { label: "Fight back with marketing", effect: (c, world) => { if (c.business) { c.money -= marketingCost(c, world); c.business.rep = clamp(c.business.rep + 4); } }, resultText: () => "You out-shouted them." },
      { label: "Stay the course", effect: (c) => { if (c.business) c.business.rep = clamp(c.business.rep - 6); }, resultText: () => "Some customers wandered off." },
    ],
  },
  {
    id: "biz-inspection",
    minAge: 18,
    maxAge: 80,
    weight: 1.4,
    condition: (c) => ["foodtruck", "cafe", "farm", "salon", "gym"].includes(c.business?.type ?? ""),
    text: () => "An inspector turns up unannounced.",
    choices: [
      { label: "Everything is in order", effect: (c) => { if (c.business) { const ok = c.business.rep > 40 && Math.random() < 0.7; if (ok) c.business.rep = clamp(c.business.rep + 4); else { c.business.reserve -= Math.round(2500 * scale(c)); c.business.rep = clamp(c.business.rep - 8); } } }, resultText: (c) => (c.business && c.business.rep >= 45 ? "You passed with a compliment." : "A fine and a public notice.") },
    ],
  },
  {
    id: "biz-investor",
    minAge: 21,
    maxAge: 70,
    weight: 1.2,
    once: true,
    condition: (c) => !!biz(c) && (c.business?.rep ?? 0) >= 55 && (c.business?.level ?? 1) >= 1 && (c.business?.lastProfit ?? 0) > 0,
    text: (c) => `An investor offers to back ${c.business?.name} and fund a big expansion.`,
    choices: [
      { label: "Take the investment", effect: (c) => { const b = c.business; if (!b) return; b.reserve += Math.round(valueOf(c) * 0.4); if (b.level < 5) b.level += 1; b.employees += 1; b.rep = clamp(b.rep + 3); }, resultText: () => "New premises, new staff, new pressure." },
      { label: "Stay independent", effect: (c) => { changeStat(c, "happiness", 2, "Staying in charge"); }, resultText: () => "It's yours, and it's staying yours." },
    ],
  },
  {
    id: "biz-acquisition",
    minAge: 24,
    maxAge: 75,
    weight: 1.1,
    once: true,
    condition: (c) => !!biz(c) && (c.business?.lastProfit ?? 0) > 0 && (c.business?.level ?? 1) >= 2,
    text: (c) => `A bigger company wants to buy ${c.business?.name} for ${money(valueOf(c) * 1.5)}.`,
    choices: [
      { label: "Sell", effect: (c) => { const b = c.business; if (!b) return; const v = Math.round(valueOf(c) * 1.5); c.money += v; c.business = null; c.yearLog.push(`You sold ${b.name} for ${money(v)}.`); }, resultText: () => "You signed, shook hands and felt strangely light." },
      { label: "Keep going", effect: (c) => { changeStat(c, "happiness", 1, "Loyal to your baby"); }, resultText: () => "Not for sale." },
    ],
  },
  // ------------------------------------------------------------ money
  {
    id: "phishing-scam",
    minAge: 14,
    maxAge: 90,
    weight: 1.5,
    condition: (c) => c.money > 500 * scale(c),
    text: () => "An email says your account has been suspended and you must log in immediately. The link looks almost right.",
    choices: [
      { label: "Click the link", effect: (c) => { const loss = Math.max(150, Math.round(c.money * 0.06)); c.money -= loss; changeStat(c, "happiness", -5, "Being scammed"); c.yearLog.push(`Scammers took ${money(loss)}.`); }, resultText: () => "The page looked so real." },
      { label: "Delete it", effect: (c) => { changeStat(c, "smarts", 1, "Staying alert"); }, resultText: () => "Never trust an urgent email." },
    ],
  },
  {
    id: "charity-drive",
    minAge: 16,
    maxAge: 90,
    weight: 1.2,
    text: () => "A local charity is collecting for a cause you care about.",
    choices: [
      { label: "Give generously", effect: (c) => { const g = Math.round(Math.max(20, Math.min(c.money * 0.05, 1500 * scale(c)))); if (c.money >= g) { c.money -= g; changeStat(c, "happiness", 5, "Giving"); } }, resultText: () => "It felt good to give." },
      { label: "Give a little", effect: (c) => { const g = Math.round(20 * scale(c)); if (c.money >= g) { c.money -= g; changeStat(c, "happiness", 2, "Giving"); } }, resultText: () => "Every bit helps." },
      { label: "Not this time", effect: () => {}, resultText: () => "You walked past." },
    ],
  },
  {
    id: "lottery-ticket",
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    text: () => "The jackpot's enormous this week and the queue at the shop is out the door.",
    choices: [
      { label: "Buy a ticket", effect: (c) => { const cost = Math.max(2, Math.round(5 * scale(c))); c.money -= cost; if (Math.random() < 0.004) { const win = Math.round(1500000 * scale(c)); c.money += win; c.yearLog.push(`You won the lottery: ${money(win)}!`); c.fullLog.push({ age: c.age, text: "You won the lottery." }); changeStat(c, "happiness", 25, "Winning the lottery"); } else if (Math.random() < 0.06) { const small = Math.round(60 * scale(c)); c.money += small; } }, resultText: () => "You checked the numbers with a hopeful heart."},
      { label: "Don't bother", effect: () => {}, resultText: () => "You know the odds." },
    ],
  },
  {
    id: "crypto-tip",
    minAge: 18,
    maxAge: 70,
    weight: 1.2,
    condition: (c) => c.money > 1500 * scale(c),
    text: () => "A friend of a friend swears a new coin is about to explode. They've put their savings in.",
    choices: [
      { label: "Put some in", effect: (c, world) => { const price = ensureMarket(world).find((s) => s.ticker === "BTNV")?.price ?? 50; const n = Math.max(1, Math.floor((c.money * 0.08) / price)); buyStock(c, world, "BTNV", n); }, resultText: () => "Everyone says it's different this time." },
      { label: "Pass", effect: (c) => { changeStat(c, "smarts", 1, "Not falling for it"); }, resultText: () => "If it sounds too good to be true..." },
    ],
  },
  {
    id: "tax-audit",
    minAge: 22,
    maxAge: 80,
    weight: 0.7,
    condition: (c, world) => employed(c) && salaryNow(c, world) > 40000 * scale(c),
    text: (c) => `The tax office in ${getRegion(c.originRegion).label} wants to check your return.`,
    choices: [
      { label: "Hire an accountant", effect: (c) => { c.money -= Math.round(900 * scale(c)); }, resultText: () => "Costly, but it was clean." },
      { label: "Handle it yourself", effect: (c) => { if (Math.random() < 0.4) { c.money -= Math.round(2500 * scale(c)); changeStat(c, "happiness", -4, "A tax penalty"); } else changeStat(c, "smarts", 1, "Paperwork survived"); }, resultText: () => "You found a lot of old receipts." },
    ],
  },
  {
    id: "market-panic",
    minAge: 21,
    maxAge: 85,
    weight: 4,
    condition: (c, world) => hasActiveCondition(world, "recession") && (c.portfolio ?? []).length > 0,
    text: () => "The market is falling and the news is all doom. Your portfolio is bleeding.",
    choices: [
      { label: "Hold your nerve", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "You stopped checking the app." },
      { label: "Sell everything", effect: (c, world) => { for (const h of [...(c.portfolio ?? [])]) { const p = ensureMarket(world).find((s) => s.ticker === h.ticker)?.price ?? 0; c.money += Math.round(p * h.shares); } c.portfolio = []; c.yearLog.push("You sold your whole portfolio at the bottom."); }, resultText: () => "You locked in the loss." },
    ],
  },
  {
    id: "tenant-trouble",
    minAge: 21,
    maxAge: 85,
    weight: 1.6,
    condition: (c) => (c.rentals ?? []).length > 0,
    text: () => "A tenant is two months behind on the rent.",
    choices: [
      { label: "Work something out", effect: (c) => { const r = c.rentals?.[0]; if (r) r.vacantYears = 0; c.money -= Math.round(200 * scale(c)); changeStat(c, "happiness", 1, "Being fair"); }, resultText: () => "A payment plan, and a handshake." },
      { label: "Evict", effect: (c) => { const r = c.rentals?.[0]; if (r) r.vacantYears = 1; c.money -= Math.round(1200 * scale(c)); changeStat(c, "happiness", -3, "Evicting a tenant"); }, resultText: () => "It was legal, and it wasn't nice." },
    ],
  },
  {
    id: "debt-collector",
    minAge: 18,
    maxAge: 90,
    weight: 3,
    condition: (c) => c.money < 0 && (c.loans ?? []).length > 0,
    text: () => "A debt collector keeps calling, at home and at work.",
    choices: [
      { label: "Negotiate a settlement", effect: (c) => { const l = (c.loans ?? []).find((x) => x.balance > 0); if (l) l.balance = Math.round(l.balance * 0.85); c.creditScore = clamp((c.creditScore ?? 600) - 15, 300, 850); }, resultText: () => "They accepted less than you owed. Your credit took a hit." },
      { label: "Ignore the calls", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 8); changeStat(c, "happiness", -5, "Constant calls"); }, resultText: () => "The phone won't stop." },
    ],
  },
];
