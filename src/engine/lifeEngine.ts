import { Appearance, Character, Gender, Job, LifeEvent, Personality, RegionKey, Talents, WealthClass, WorldState } from "../types";
import { appearanceFromSeed } from "../data/appearance";
import { CLASSES } from "../data/traits";
import { resetStatNotes } from "./stats";
import { tickWork } from "./jobs";
import { ensureSchool, tickSchool } from "./education";
import { ensureHigher, tickHigher } from "./higher";
export { changeMajor, dropOutOfCollege } from "./higher";
import { attendanceFactor, causeFromConditions, conditionMortality, tickHealth, tickWellbeing } from "./health";
import { classFamilyBlurb, familyAllowance, rollClass, rollPersonality, rollQuirks, rollTalents, tickCharacter } from "./character";
import { clamp, randomInt, pickWeighted } from "./util";
import { EVENTS } from "../data/events";
import { randomFirstName, randomLastName } from "../data/names";
import { getRegion } from "../data/regions";
import { MIN_AGE_CONVERSATION, getLifeStage } from "./lifeStage";
import { tickWorldState, hasActiveCondition, effectiveSalary } from "./worldState";
import { ambientMessageTick } from "./relationships";
import { addPerson, ensurePeople, newPerson, refreshCoworkers } from "./people";
import { deathChance } from "./mortality";
import { tickRelatives } from "./relatives";
import { tickAdoption, tickPregnancy } from "./intimacy";
import { tickExes, tickSanity } from "./exes";
import { tickKids } from "./kids";
import "./decisions"; // registers the funeral/crisis/request decision builders
import { nextDecisionEvent } from "./decisionQueue";
import { tickAssets, netWorth } from "./assets";
import { ensureLocation, tickLocation } from "./location";
import { cityWage, noteIncome } from "./where";
import { tickDebt } from "./debt";
import { tickMarket, portfolioValue } from "./stocks";
import { incomeTax } from "./taxes";
import { applyContribution, tickRetirementGrowth, retirementBalance } from "./retirement";
import { tickSentence, tickRecordClock, tickAnkleMonitor, tickJuvenileRecordClear } from "./crime";
import {
  applyVenue,
  visitDoctor,
  takeLesson,
  generateDatingCandidates,
  pursueDatingCandidate,
  goOnBlindDate,
  hookup,
  toggleBirthControl,
  getSterilized,
  tryConception,
  takeVacation,
} from "./activities";
import { onEnterSchoolStage } from "./school";

export { getLifeStage } from "./lifeStage";
export type { LifeStage } from "./lifeStage";
export { createInitialWorldState, effectiveSalary, hasActiveCondition, regionJobMultiplier } from "./worldState";
export { textRelationship, callRelationship, bootyCall, sendGift } from "./relationships";
export { seeTherapist, THERAPY_COST } from "./exes";
export { buyCar, sellCar, buyHome, sellHome, netWorth } from "./assets";
export { takeOutLoan, openCreditCard, payDownLoan, chargeCard } from "./debt";
export { creditScoreLabel } from "./finance";
export { buyStock, sellStock, portfolioValue } from "./stocks";
export { incomeTax, takeHomePay, effectiveTaxRate } from "./taxes";
export { setContributionRate, withdrawRetirement, retirementBalance } from "./retirement";
export {
  commitCrime,
  successChance,
  petitionExpungement,
  canPetitionExpungement,
  EXPUNGEMENT_FEE,
  EXPUNGEMENT_ELIGIBLE_YEARS,
} from "./crime";
export {
  applyVenue,
  visitDoctor,
  takeLesson,
  generateDatingCandidates,
  pursueDatingCandidate,
  goOnBlindDate,
  hookup,
  toggleBirthControl,
  getSterilized,
  tryConception,
  takeVacation,
} from "./activities";
export type { DatingCandidate } from "./activities";
export {
  hasFlag,
  joinClub,
  facultyAction,
  seduceFaculty,
  throwParty,
  skipClass,
} from "./school";
export { attack } from "./fighting";
export { runPersonAction, actionsFor, romanceCandidates, askCeiling, askChance, giveCeiling, romanceAllowed, bothAdults } from "./interactions";
export type { ActionKey, ActionDef } from "./interactions";
export { surrender } from "./surrender";

export function totalNetWorth(c: Character, world: WorldState): number {
  return netWorth(c) + portfolioValue(c, world) + retirementBalance(c);
}

export type CreationOptions = {
  appearance?: Appearance;
  personality?: Personality;
  talents?: Talents;
  quirks?: string[];
  wealthClass?: WealthClass;
  birthCity?: string;
};

export function createCharacter(
  firstName: string,
  lastName: string,
  gender: Gender,
  region: RegionKey,
  avatarSeed?: number,
  options: CreationOptions = {},
): Character {
  const motherName = `${randomFirstName("female", region)} ${lastName}`;
  const fatherName = `${randomFirstName("male", region)} ${lastName}`;
  const regionDef = getRegion(region);
  const seed = avatarSeed ?? randomInt(0, 999999);
  const personality = options.personality ?? rollPersonality();
  const talents = options.talents ?? rollTalents();
  const quirks = options.quirks ?? rollQuirks();
  const wealthClass = options.wealthClass ?? rollClass(region);
  const cls = CLASSES[wealthClass];

  const character: Character = {
    firstName,
    lastName,
    gender,
    age: 0,
    alive: true,
    stats: {
      health: clamp(randomInt(75, 100) + Math.round((talents.athletic - 50) / 12)),
      happiness: clamp(randomInt(60, 90) - Math.round((personality.n - 50) / 10)),
      smarts: clamp(randomInt(30, 65) + Math.round((talents.academic - 50) / 6)),
      looks: randomInt(30, 75),
    },
    money: Math.round(randomInt(regionDef.startingWealthRange[0], regionDef.startingWealthRange[1]) * cls.moneyFactor),
    job: null,
    educationStage: "none",
    inCollege: false,
    hasCollegeDegree: false,
    loans: [],
    creditScore: 650,
    degrees: [],
    flags: [],
    originRegion: region,
    appearanceFlavor: regionDef.appearanceFlavor[randomInt(0, regionDef.appearanceFlavor.length - 1)],
    avatarSeed: seed,
    personality,
    talents,
    quirks,
    background: { wealthClass, parentValues: classFamilyBlurb(wealthClass) },
    appearance: options.appearance ?? appearanceFromSeed(seed, gender, region),
    relationships: [],
    yearLog: [`You were born! ${motherName} and ${fatherName} welcomed you into the world.`],
    fullLog: [{ age: 0, text: "You were born." }],
    triggeredEvents: [],
  };

  // the family you're born into shapes what your parents do and have
  const parentFields = () => ({ job: cls.jobs[randomInt(0, cls.jobs.length - 1)], wealth: randomInt(cls.wealth[0], cls.wealth[1]) });
  character.relationships.push(
    newPerson(character, { id: "mother", type: "mother", name: motherName, gender: "female", age: randomInt(22, 36), level: randomInt(60, 90), fields: parentFields() }),
    newPerson(character, { id: "father", type: "father", name: fatherName, gender: "male", age: randomInt(22, 40), level: randomInt(55, 90), fields: parentFields() }),
  );
  ensurePeople(character);
  if (options.birthCity) character.birthCity = options.birthCity;
  ensureLocation(character);

  return character;
}

function educationForAge(age: number): Character["educationStage"] | null {
  // school ends by 19: anyone who never got a graduation moment (or dropped
  // out and never re-enrolled) is simply "graduated" rather than stuck in high
  // school for life
  if (age >= 19) return "graduated";
  if (age >= 14) return "high";
  if (age >= 11) return "middle";
  if (age >= 5) return "elementary";
  return "none";
}

// How many years before a non-`once` event is allowed to come up again -
// stops the same handful of events from looping year after year.
const REPEAT_COOLDOWN_YEARS = 8;
// Roughly one year in five just passes without a decision popup; a run of
// two quiet years in a row is much rarer than that.
const QUIET_YEAR_CHANCE = 0.18;
const QUIET_AFTER_QUIET_CHANCE = 0.04;

const QUIET_LINES: Record<string, string[]> = {
  baby: [
    "A gentle year of naps, snacks and stumbling around.",
    "You mostly played, giggled and got carried places.",
    "Not much happened - you just grew a little.",
  ],
  child: [
    "A regular year - school, friends and a lot of playing outside.",
    "Nothing dramatic. Just recess, cartoons and growing taller.",
    "A quiet stretch of ordinary childhood days.",
  ],
  teen: [
    "No big drama this year - homework, group chats and figuring yourself out.",
    "A calm year. You kept your head down and got through it.",
    "Nothing major happened. Just the slow work of becoming you.",
  ],
  adult: [
    "A steady year. No big drama - just work, bills and small wins.",
    "Nothing dramatic happened. Life just kept moving.",
    "A quiet year. You settled into your routine.",
  ],
  senior: [
    "A calm, comfortable year. You savored the little things.",
    "Nothing much happened, and that was just fine.",
    "A slow, peaceful year at your own pace.",
  ],
};

function rememberEvent(c: Character, id: string): void {
  const recent = (c.recentEvents ??= []);
  recent.push({ id, age: c.age });
  // keep the list short - only the cooldown window matters
  c.recentEvents = recent.filter((r) => c.age - r.age < REPEAT_COOLDOWN_YEARS);
}

function eligibleEvents(c: Character, world: WorldState): LifeEvent[] {
  const base = EVENTS.filter((e) => {
    if (c.age < e.minAge || c.age > e.maxAge) return false;
    if (e.once && c.triggeredEvents.includes(e.id)) return false;
    if (e.condition && !e.condition(c, world)) return false;
    return true;
  });
  const recent = c.recentEvents ?? [];
  const fresh = base.filter((e) => !recent.some((r) => r.id === e.id && c.age - r.age < REPEAT_COOLDOWN_YEARS));
  // if the cooldown would empty the pool entirely, allow repeats rather than nothing
  return fresh.length > 0 ? fresh : base;
}

export type AgeUpResult = {
  died: boolean;
  causeOfDeath?: string;
  pendingEvent?: LifeEvent;
};

export function ageUp(c: Character, world: WorldState): AgeUpResult {
  ensurePeople(c);
  ensureSchool(c);
  ensureHigher(c);
  tickWorldState(world);
  tickMarket(world);
  tickRetirementGrowth(c, world);

  // archive the year that's ending into the life story before it's wiped,
  // so the Life tab can show a real by-age history, not just event lines
  if (c.yearLog.length > 0 || (c.yearNews?.length ?? 0) > 0) {
    (c.lifeLog ??= []).push({ age: c.age, lines: c.yearLog, news: c.yearNews && c.yearNews.length > 0 ? c.yearNews : undefined });
  }

  // remember how the four stats stood as this year closed
  const hist = (c.statHistory ??= []);
  hist.push({ age: c.age, health: c.stats.health, happiness: c.stats.happiness, smarts: c.stats.smarts, looks: c.stats.looks });
  if (hist.length > 110) hist.shift();

  resetStatNotes(c);
  c.age += 1;
  c.yearLog = [];
  c.yearNews = [];

  // a pregnancy from the year before comes to term now (or, rarely, ends): the
  // baby exists as a real child right away with a placeholder name, and
  // c.pendingBabyId makes the UI hold up a naming prompt first. A pregnancy
  // that was planned as an adoption queues the "what kind of adoption?" decision.
  tickPregnancy(c);

  // natural stat drift
  c.stats.happiness = clamp(c.stats.happiness + randomInt(-2, 2));
  c.stats.looks = clamp(c.stats.looks + randomInt(-1, 1));
  if (c.age >= 6 && c.age <= 22) {
    // learning slows as you get good at it
    c.stats.smarts = clamp(c.stats.smarts + (c.stats.smarts > 72 ? randomInt(0, 1) * (Math.random() < 0.5 ? 1 : 0) : randomInt(0, 1)));
  }
  if (c.age >= 55) {
    // ageing itself is gentle until the seventies; illnesses (engine/health.ts) do the real damage
    c.stats.health = clamp(c.stats.health - (c.age < 70 ? randomInt(0, 1) : randomInt(0, 3)));
  } else {
    // youthful recovery: minor injuries/illnesses heal on their own
    c.stats.health = clamp(c.stats.health + (c.age < 40 ? randomInt(2, 5) : randomInt(1, 4)));
  }
  if (hasActiveCondition(world, "pandemic")) {
    c.stats.health = clamp(c.stats.health - randomInt(0, 4));
  }

  if (c.inJail) {
    c.stats.happiness = clamp(c.stats.happiness - randomInt(3, 8));
    if (Math.random() < 0.1) {
      c.stats.health = clamp(c.stats.health - randomInt(5, 15));
      c.yearLog.push("A fight broke out on your block.");
    }
  }

  // who you are: personality, quirks and talents at work, plus family pocket money
  tickCharacter(c);
  tickWellbeing(c, world);
  tickHealth(c, world);
  const allowance = familyAllowance(c);
  if (allowance > 0) {
    c.money += allowance;
    if (c.age === 6 || c.age === 10 || c.age === 14) c.yearLog.push(`Your family gives you $${allowance.toLocaleString()} a year in pocket money.`);
  }

  ambientMessageTick(c);
  // the people around you live their year: ageing, illness, news, and - the
  // hard part - some of them die (funerals and money requests queue up as
  // decisions that outrank random events below)
  tickRelatives(c, world);
  tickAdoption(c);
  tickKids(c);
  tickExes(c);
  tickSanity(c);
  if ((c.griefYears ?? 0) > 0) {
    c.griefYears = (c.griefYears ?? 0) - 1;
    c.stats.happiness = clamp(c.stats.happiness - 4);
    c.yearLog.push("Grief still weighs on you this year.");
  }

  // the school year that just ended: grades, report card, behaviour, bullying, teams
  tickSchool(c);

  // education auto-progression (doesn't override college/graduated)
  if (!c.inCollege && c.educationStage !== "graduated") {
    const stage = educationForAge(c.age);
    if (stage) {
      c.educationStage = stage;
      onEnterSchoolStage(c, stage);
    }
  }
  tickHigher(c);

  // income
  if (c.job) {
    // a head for business shows up in the pay packet
    const gross = Math.round(effectiveSalary(c.job, world, c.originRegion, cityWage(c)) * (1 + ((c.talents?.business ?? 50) - 50) / 1000) * attendanceFactor(c));
    const { contribution, employerMatch, taxableIncome } = applyContribution(c, gross);
    const tax = incomeTax(taxableIncome, c.originRegion);
    const net = taxableIncome - tax;
    c.money += net;
    noteIncome(c, net, tax);
    const contribText =
      contribution > 0
        ? ` $${contribution.toLocaleString()} to retirement${
            employerMatch > 0 ? ` (+$${employerMatch.toLocaleString()} employer match)` : ""
          },`
        : "";
    c.yearLog.push(
      `You earned $${gross.toLocaleString()} working as a ${c.job.title} —${contribText} $${tax.toLocaleString()} to taxes, $${net.toLocaleString()} take-home.`,
    );
  }

  tickWork(c, world);
  tickAssets(c);
  tickLocation(c);
  tickDebt(c);

  // death roll: very low health raises the odds sharply but never guarantees death on its own
  const dieFromHealth = c.stats.health <= 0 && Math.random() < 0.4;
  const dieFromAge = Math.random() < Math.min(0.95, deathChance(c.age, c.stats.health) * conditionMortality(c));
  if (dieFromHealth || dieFromAge) {
    c.alive = false;
    c.causeOfDeath = dieFromHealth ? "declining health" : causeFromConditions(c) ?? "natural causes";
    c.yearLog.push(
      `At age ${c.age}, your life came to an end${dieFromHealth ? " after your health gave out" : ""}.`,
    );
    c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
    return { died: true, causeOfDeath: c.causeOfDeath };
  }

  // no random civilian life events while incarcerated - a dedicated
  // sentence tick (countdown/parole/release) replaces the event pool instead
  let pendingEvent: LifeEvent | undefined;
  if (c.inJail) {
    tickSentence(c);
  } else {
    tickRecordClock(c);
    tickAnkleMonitor(c);
    tickJuvenileRecordClear(c);

    // pick events: apply auto-effect ones immediately, hold at most one choice event
    const pool = eligibleEvents(c, world);
    const autoPool = pool.filter((e) => !e.choices);
    const choicePool = pool.filter((e) => e.choices && e.choices.length > 0);

    const autoCount = Math.min(2, autoPool.length);
    const usedIds = new Set<string>();
    for (let i = 0; i < autoCount; i++) {
      const remaining = autoPool.filter((e) => !usedIds.has(e.id));
      const chosen = pickWeighted(remaining);
      if (!chosen) break;
      usedIds.add(chosen.id);
      if (chosen.once) c.triggeredEvents.push(chosen.id);
      chosen.autoEffect?.(c, world);
      rememberEvent(c, chosen.id);
      const text = chosen.text(c, world);
      c.yearLog.push(text);
      c.fullLog.push({ age: c.age, text });
    }

    const decision = nextDecisionEvent(c, world);
    const quiet = !decision && Math.random() < (c.quietLastYear ? QUIET_AFTER_QUIET_CHANCE : QUIET_YEAR_CHANCE);
    c.quietLastYear = quiet;
    if (decision) {
      pendingEvent = decision;
    } else if (quiet) {
      const lines = QUIET_LINES[getLifeStage(c.age)] ?? QUIET_LINES.adult;
      c.yearLog.push(lines[randomInt(0, lines.length - 1)]);
    } else {
      pendingEvent = pickWeighted(choicePool);
    }
  }

  if (c.yearLog.length === 0) {
    c.yearLog.push(
      c.inJail ? `Another year passed behind bars. You are now ${c.age}.` : `Another year passed. You are now ${c.age}.`,
    );
  }

  return { died: false, pendingEvent };
}

// Returns a follow-up LifeEvent when the chosen choice's effect chains one
// (see the EventChoice.effect return type) - the caller (the store) sets
// that as the next pendingEvent instead of clearing it.
export function resolveEvent(c: Character, world: WorldState, event: LifeEvent, choiceIndex: number): LifeEvent | undefined {
  const choice = event.choices?.[choiceIndex];
  if (!choice) return undefined;
  if (event.once) c.triggeredEvents.push(event.id);
  rememberEvent(c, event.id);
  const next = choice.effect(c, world);
  const baseText = event.logText ? event.logText(c, world) : event.text(c, world);
  const resultText = choice.resultText?.(c, world);
  const line = resultText ? `${baseText} ${resultText}`.trim() : baseText;
  if (line) {
    c.yearLog.push(line);
    c.fullLog.push({ age: c.age, text: line });
  }
  // a chained follow-up wins; otherwise the next queued decision (if any)
  return next || nextDecisionEvent(c, world) || undefined;
}

export function spendTimeWith(c: Character, relationshipId: string) {
  const r = c.relationships.find((x) => x.id === relationshipId && x.alive);
  if (!r) return;
  r.level = clamp(r.level + 5);
  c.stats.happiness = clamp(c.stats.happiness + 2);
  c.yearLog.push(`You spent time with ${r.name}.`);
}

export function haveConversation(c: Character, relationshipId: string) {
  if (c.age < MIN_AGE_CONVERSATION) {
    c.yearLog.push("You're too young to have a real conversation yet.");
    return;
  }
  const r = c.relationships.find((x) => x.id === relationshipId && x.alive);
  if (!r) return;
  r.level = clamp(r.level + 8);
  c.stats.happiness = clamp(c.stats.happiness + 3);
  c.yearLog.push(`You had a good conversation with ${r.name}.`);
}
