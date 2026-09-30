import { Character, Immigration, RegionKey, ResidencyStatus, VisaRoute, WorldState } from "../types";
import { COUNTRIES, LANGUAGE_LABEL, LanguageKey, SCHOOL_ENGLISH, country } from "../data/countries";
import { citiesFor, cityByKey, defaultCityFor } from "../data/cities";
import { getRegion } from "../data/regions";
import { rngFrom } from "../data/companies";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { livingIndex, cityOf } from "./where";
import { hasDiploma } from "./education";
import { listingsFor, requirements, Requirement } from "./jobs";
import { refreshCoworkers } from "./people";
import { relocate, rentFor, depositFor, moveCost } from "./location";
import { sellHome } from "./assets";
import { RENT_OPTIONS } from "../data/housing";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ------------------------------------------------------------------ backfill

export function ensureAbroad(c: Character): void {
  c.originRegion ??= "us";
  c.birthRegion ??= c.originRegion;
  c.citizenships ??= [c.birthRegion];
  c.visited ??= [];
  c.abroadYears ??= 0;
  if (c.immigration === undefined) c.immigration = null;
  if (!c.languages) {
    const rng = rngFrom((c.avatarSeed ?? 1) + 991);
    const home = country(c.originRegion);
    const langs: Partial<Record<string, number>> = {};
    langs[home.language] = 100;
    if (home.language !== "english") langs.english = Math.round(clamp(SCHOOL_ENGLISH[c.originRegion] - 10 + rng() * 20, 5, 95));
    else if (c.originRegion === "canada") langs.french = Math.round(20 + rng() * 25);
    else if (c.originRegion === "us") langs.spanish = Math.round(rng() * 30);
    else if (c.originRegion === "uk") langs.french = Math.round(rng() * 25);
    c.languages = langs;
  }
  if (c.integration === undefined) c.integration = isAbroad(c) ? 60 : 100;
}

export const isCitizen = (c: Character, region: RegionKey | undefined = c.originRegion): boolean => (c.citizenships ?? [c.birthRegion ?? c.originRegion ?? "us"]).includes(region ?? "us");
export const isAbroad = (c: Character): boolean => !isCitizen(c);
export const langLevel = (c: Character, lang: LanguageKey): number => c.languages?.[lang] ?? 0;
export const localLangLevel = (c: Character, region: RegionKey | undefined = c.originRegion): number => langLevel(c, country(region).language);
export const passportStrength = (c: Character): number => Math.max(0, ...(c.citizenships ?? [c.birthRegion ?? "us"]).map((r) => country(r).passport));

export function languageWord(n: number): string {
  return n >= 95 ? "Native" : n >= 75 ? "Fluent" : n >= 50 ? "Conversational" : n >= 25 ? "Basic" : n > 0 ? "A few words" : "None";
}

export const statusLabel = (s: ResidencyStatus): string =>
  ({ student: "Student visa", work: "Work visa", investor: "Investor visa", holiday: "Working holiday", family: "Family visa", permanent: "Permanent resident", overstay: "Undocumented" }[s]);

export const ROUTE_LABEL: Record<VisaRoute, string> = {
  student: "Study visa", work: "Skilled-worker visa", investor: "Investor visa", holiday: "Working holiday", family: "Marriage / family visa", residence: "Permanent residence",
};

// ------------------------------------------------------------------ visa routes

export type RouteCheck = { route: VisaRoute; ok: boolean; reqs: Requirement[]; fee: number; funds: number; chance: number; wait: number; blurb: string };

const HOLIDAY_MAX_AGE = 30;

const hasDegree = (c: Character) => c.hasCollegeDegree || (c.degrees ?? []).length > 0;

export function routeCheck(c: Character, dest: RegionKey, route: VisaRoute): RouteCheck {
  ensureAbroad(c);
  const d = country(dest);
  const idx = livingIndex(dest);
  const lang = langLevel(c, d.language);
  const reqs: Requirement[] = [];
  const add = (label: string, met: boolean, note?: string) => reqs.push({ label, met, note });
  let fee = 0;
  let funds = 0;
  let wait = 1;
  let chance = 0.5;
  let blurb = "";
  const smarts = c.stats.smarts;
  const record = !!c.criminalRecord;

  add("Age 18+", c.age >= 18);
  add("Clean criminal record", !record, record ? "A record makes every application harder" : undefined);
  add("Not in jail", !c.inJail);
  add("No application pending", !c.visaApp);
  if (route !== "family" && route !== "residence") {
    add("Not already living there", c.originRegion !== dest);
    add("Finished with studies", !c.higher, "Leave or finish your course first");
  }

  if (route === "student") {
    fee = Math.round(450 * idx);
    funds = Math.round(16000 * idx);
    add("A school diploma", hasDiploma(c));
    add(`${money(funds)} to live on`, c.money >= funds + fee);
    add(`${LANGUAGE_LABEL[d.language]} - basic (25+)`, lang >= 25);
    chance = 0.42 + d.open * 0.35 + (smarts - 50) / 250 + (c.gpa ?? 3) / 20;
    wait = 1;
    blurb = "Study there. Once you arrive you can apply to universities in the new country, and a job after graduating can turn into a work visa.";
  } else if (route === "work") {
    fee = Math.round(900 * idx);
    funds = Math.round(6000 * idx);
    add("A degree, or 2+ years of work", hasDegree(c) || (c.workYears ?? 0) >= 2);
    add(`${LANGUAGE_LABEL[d.language]} - conversational (45+)`, lang >= 45);
    add(`${money(funds)} to settle in`, c.money >= funds + fee);
    add("Under 56", c.age <= 55);
    chance = 0.2 + d.open * 0.5 + (smarts - 50) / 200 + (hasDegree(c) ? 0.12 : 0) + Math.min(0.12, (c.workYears ?? 0) / 60) + (lang - 45) / 300;
    wait = 2;
    blurb = "An employer there sponsors you. On arrival you're offered a job that fits your experience.";
  } else if (route === "investor") {
    funds = Math.round(220000 * idx);
    fee = Math.round(3500 * idx);
    add(`${money(funds)} to invest`, c.money >= funds + fee);
    chance = 0.55 + d.open * 0.4;
    wait = 1;
    blurb = "Put serious money into the country and get the right to live there.";
  } else if (route === "holiday") {
    fee = Math.round(350 * idx);
    funds = Math.round(3500 * idx);
    add("Country offers a working holiday", d.holiday);
    add(`Age 18-${HOLIDAY_MAX_AGE}`, c.age >= 18 && c.age <= HOLIDAY_MAX_AGE);
    add(`${money(funds)} to get by`, c.money >= funds + fee);
    chance = 0.7 + d.open * 0.25;
    wait = 1;
    blurb = "Two years of living and working there. It can't be extended, but plenty of people find a way to stay.";
  } else if (route === "family") {
    fee = Math.round(700 * idx);
    const partner = c.relationships.find((r) => r.alive && r.type === "partner" && r.married);
    add("Living there on a temporary visa", c.originRegion === dest && isAbroad(c) && c.immigration?.status !== "permanent" && c.immigration?.status !== "overstay");
    add("Married to a local", !!partner, "Your spouse sponsors you");
    add(`${money(fee)} fee`, c.money >= fee);
    chance = 0.75 + d.open * 0.2;
    wait = 1;
    blurb = "Your spouse sponsors your right to stay. It leads straight to permanent residence.";
  } else {
    fee = Math.round(600 * idx);
    const st = c.immigration?.status;
    add("Living there legally", c.originRegion === dest && isAbroad(c) && !!st && st !== "overstay" && st !== "holiday" && st !== "permanent");
    add(`${d.prYears}+ years of residence`, (c.immigration?.years ?? 0) >= d.prYears);
    add("A job or study", !!c.job || !!c.higher || st === "investor" || st === "family");
    add(`${LANGUAGE_LABEL[d.language]} - conversational (45+)`, lang >= 45);
    add(`${money(fee)} fee`, c.money >= fee);
    chance = 0.55 + d.open * 0.3 + (c.integration ?? 50) / 400 + lang / 400;
    wait = 1;
    blurb = "A settled life, no more renewals. Permanent residents can apply for citizenship.";
  }
  if (record) chance -= 0.3;
  chance = clamp(chance, 0.05, 0.95);
  return { route, ok: reqs.every((r) => r.met), reqs, fee, funds, chance, wait, blurb };
}

export function oddsWord(p: number): string {
  return p >= 0.8 ? "Very likely" : p >= 0.6 ? "Likely" : p >= 0.4 ? "A coin flip" : p >= 0.22 ? "Unlikely" : "Long shot";
}

export function routesFor(c: Character, dest: RegionKey): RouteCheck[] {
  const list: VisaRoute[] = c.originRegion === dest && isAbroad(c) ? ["residence", "family"] : ["student", "work", "holiday", "investor"];
  return list.map((r) => routeCheck(c, dest, r));
}

export function apply(c: Character, dest: RegionKey, route: VisaRoute, cityKey?: string): boolean {
  const chk = routeCheck(c, dest, route);
  if (!chk.ok) return false;
  const city = cityByKey(cityKey) ?? defaultCityFor(dest);
  c.money -= chk.fee;
  c.visaApp = { dest, route, filed: c.age, decides: c.age + chk.wait, city: city.key, fee: chk.fee };
  c.yearLog.push(`You applied for a ${ROUTE_LABEL[route].toLowerCase()}${route === "residence" || route === "family" ? "" : ` for ${getRegion(dest).label}`}. Fee: ${money(chk.fee)}. The decision comes next year.`);
  return true;
}

export function withdraw(c: Character): void {
  if (!c.visaApp) return;
  c.yearLog.push("You withdrew your visa application. The fee isn't refundable.");
  c.visaApp = null;
}

// ------------------------------------------------------------------ moving abroad

const EXPIRY: Record<ResidencyStatus, number> = { student: 4, work: 4, investor: 5, holiday: 2, family: 3, permanent: 0, overstay: 0 };

function statusFor(route: VisaRoute): ResidencyStatus {
  return route === "residence" ? "permanent" : route;
}

// you actually go: everything at home is left behind
export function emigrate(c: Character, dest: RegionKey, route: VisaRoute, cityKey: string, world: WorldState): void {
  const from = cityOf(c);
  const city = cityByKey(cityKey) ?? defaultCityFor(dest);
  if (c.home) {
    const name = c.home.name;
    sellHome(c);
    c.yearLog.push(`You sold your ${name} before you left.`);
  }
  const cost = moveCost(c, city) * 2;
  c.money -= cost;
  // leave jobs and school behind
  for (const job of ["job", "partTime"] as const) {
    const j = c[job];
    if (!j) continue;
    (c as Character & Record<string, unknown>)[job] = null;
    c.yearLog.push(`You resigned from your job as a ${j.title}.`);
  }
  // set the new life up
  c.originRegion = dest;
  const res = c.residence!;
  res.city = city.key;
  const rentKey = c.money > 30000 * livingIndex(dest) ? "onebed" : "share";
  const rent = rentFor(c, city, rentKey);
  const deposit = depositFor(rent);
  c.money -= deposit;
  res.housing = "rent";
  res.rentKey = rentKey;
  res.rent = rent;
  res.since = c.age;
  res.arrears = 0;
  c.creditScore = Math.min(c.creditScore ?? 650, 600); // credit history doesn't cross borders
  const notes = relocate(c, city, true);
  // far more is left behind than in a domestic move
  for (const r of c.relationships) {
    if (!r.alive) continue;
    if (r.type === "friend" || r.type === "classmate") r.level = clamp(r.level - randomInt(12, 24));
    else if (r.type === "mother" || r.type === "father" || r.type === "sibling") r.level = clamp(r.level - randomInt(3, 9));
  }
  const imm: Immigration = { status: statusFor(route), since: c.age, years: 0 };
  if (EXPIRY[imm.status]) imm.expires = c.age + EXPIRY[imm.status];
  c.immigration = imm;
  c.integration = 12;
  c.visaApp = null;
  c.visited = c.visited?.includes(dest) ? c.visited : [...(c.visited ?? []), dest];
  const homesick = clamp(10 - ((c.personality?.o ?? 50) - 50) / 10, 4, 14);
  changeStat(c, "happiness", -Math.round(homesick), `Far from ${getRegion(c.birthRegion).label}`);
  c.yearLog.push(`You moved from ${from.name} to ${city.name}, ${getRegion(dest).label}. ${money(cost)} for flights and shipping, ${money(deposit)} deposit on a ${RENT_OPTIONS.find((o) => o.key === rentKey)?.label.toLowerCase()}.`);
  for (const n of notes) c.yearLog.push(n);
  c.yearLog.push(`${statusLabel(imm.status)}${imm.expires ? ` - valid until you're ${imm.expires}` : ""}.`);

  // sponsored workers arrive with a job
  if (route === "work") {
    const offers = listingsFor(c, world, "fulltime").filter((l) => requirements(c, l.job).every((r) => r.met));
    const pick = offers[randomInt(0, Math.max(0, offers.length - 1))];
    if (pick) {
      c.job = { ...pick.job };
      c.workYears = c.workYears ?? 0;
      (c.jobHistory ??= []).push({ title: pick.job.title, company: pick.job.company?.name, from: c.age, to: -1 });
      c.yearLog.push(`Your sponsor set you up as a ${pick.job.title}${pick.job.company ? ` at ${pick.job.company.name}` : ""}.`);
    }
  }
  if (route === "student") c.appliedAge = undefined;
  refreshCoworkers(c);
  c.abroadYears = c.abroadYears ?? 0;
}

// going back to a passport country you hold
export function returnTo(c: Character, dest: RegionKey): boolean {
  if (!isCitizen(c, dest) || c.originRegion === dest || c.inJail) return false;
  const city = cityByKey(dest === c.birthRegion ? c.birthCity : undefined) ?? defaultCityFor(dest);
  const cost = moveCost(c, city);
  if (c.money < cost + 500) return false;
  c.money -= cost;
  if (c.home) sellHome(c);
  for (const job of ["job", "partTime"] as const) {
    const j = c[job];
    if (!j) continue;
    (c as Character & Record<string, unknown>)[job] = null;
    c.yearLog.push(`You left your job as a ${j.title}.`);
  }
  const from = cityOf(c);
  c.originRegion = dest;
  c.residence!.city = city.key;
  c.residence!.housing = "rent";
  const key = "studio";
  c.residence!.rentKey = key;
  c.residence!.rent = rentFor(c, city, key);
  c.residence!.since = c.age;
  const notes = relocate(c, city, true);
  c.immigration = null;
  c.integration = 100;
  c.visaApp = null;
  changeStat(c, "happiness", 3, "Home again");
  c.yearLog.push(`You moved back from ${from.name} to ${city.name}, ${getRegion(dest).label}. -${money(cost)}`);
  for (const n of notes) c.yearLog.push(n);
  refreshCoworkers(c);
  return true;
}

// when the family emigrates: no visa game, you just go
export function familyEmigrate(c: Character, dest?: RegionKey): RegionKey | null {
  ensureAbroad(c);
  const options = (Object.keys(COUNTRIES) as RegionKey[]).filter((r) => r !== c.originRegion && country(r).open >= 0.5);
  const to = dest ?? options[randomInt(0, options.length - 1)];
  if (!to) return null;
  const city = defaultCityFor(to);
  const from = cityOf(c);
  c.originRegion = to;
  c.residence!.city = city.key;
  c.residence!.since = c.age;
  relocate(c, city, false);
  c.immigration = { status: "family", since: c.age, years: 0 };
  c.integration = 30;
  const d = country(to);
  // children pick a language up fast
  c.languages = { ...(c.languages ?? {}), [d.language]: Math.max(langLevel(c, d.language), c.age < 12 ? 55 : 30) };
  c.visited = c.visited?.includes(to) ? c.visited : [...(c.visited ?? []), to];
  c.yearLog.push(`Your family emigrated from ${from.name} to ${city.name}, ${getRegion(to).label}.`);
  return to;
}

// ------------------------------------------------------------------ language and money home

export const LANGUAGE_LESSON_COST = 700;

export function lessonCost(c: Character): number {
  return Math.round(LANGUAGE_LESSON_COST * livingIndex(c.originRegion));
}

export function studyLanguage(c: Character, lang: LanguageKey): boolean {
  ensureAbroad(c);
  if (c.age < 8 || c.langStudyAge === c.age) return false;
  const cost = lessonCost(c);
  if (c.money < cost) return false;
  const before = langLevel(c, lang);
  if (before >= 95) return false;
  c.money -= cost;
  const gain = Math.round(10 + ((c.stats.smarts - 50) / 8) + ((c.talents?.verbal ?? 50) - 50) / 10 + Math.random() * 4);
  c.languages = { ...(c.languages ?? {}), [lang]: Math.min(95, before + Math.max(6, gain)) };
  c.langStudyAge = c.age;
  changeStat(c, "smarts", 1, `Learning ${LANGUAGE_LABEL[lang]}`);
  c.yearLog.push(`You took ${LANGUAGE_LABEL[lang]} lessons: now ${languageWord(c.languages[lang]!).toLowerCase()}. -${money(cost)}`);
  return true;
}

export function sendMoneyHome(c: Character, amount: number): boolean {
  if (!isAbroad(c) || amount <= 0 || c.money < amount) return false;
  c.money -= amount;
  const family = c.relationships.filter((r) => r.alive && (r.type === "mother" || r.type === "father" || r.type === "sibling"));
  const bump = clamp(Math.round(amount / (1200 * Math.max(0.3, livingIndex(c.originRegion)))), 2, 10);
  for (const r of family) r.level = clamp(r.level + bump);
  changeStat(c, "happiness", 2, "Looking after family back home");
  c.yearLog.push(`You sent ${money(amount)} home to your family.`);
  return true;
}

// ------------------------------------------------------------------ citizenship

export type NaturalizeCheck = { ok: boolean; reqs: Requirement[]; chance: number; keepsOld: boolean };

export function naturalizeCheck(c: Character): NaturalizeCheck {
  ensureAbroad(c);
  const dest = c.originRegion!;
  const d = country(dest);
  const imm = c.immigration;
  const reqs: Requirement[] = [];
  const lang = langLevel(c, d.language);
  const legal = !!imm && imm.status !== "overstay" && imm.status !== "holiday";
  reqs.push({ label: "Living there legally", met: legal });
  reqs.push({ label: `${d.naturalizeYears}+ years of residence`, met: (imm?.years ?? 0) >= d.naturalizeYears });
  reqs.push({ label: `${LANGUAGE_LABEL[d.language]} - ${languageWord(d.langReq).toLowerCase()} (${d.langReq}+)`, met: lang >= d.langReq });
  reqs.push({ label: "Feel settled (integration 40+)", met: (c.integration ?? 0) >= 40 });
  reqs.push({ label: "Clean criminal record", met: !c.criminalRecord });
  const chance = clamp(0.55 + lang / 250 + c.stats.smarts / 300 + (c.integration ?? 0) / 400, 0.4, 0.97);
  const keepsOld = d.dual && (c.citizenships ?? []).every((r) => country(r).dual);
  return { ok: !!isAbroad(c) && reqs.every((r) => r.met), reqs, chance, keepsOld };
}

export function naturalize(c: Character): boolean {
  const chk = naturalizeCheck(c);
  if (!chk.ok) return false;
  const dest = c.originRegion!;
  const d = country(dest);
  if (Math.random() > chk.chance) {
    c.yearLog.push(`You sat the ${d.demonym} citizenship test and didn't pass. You can try again next year.`);
    changeStat(c, "happiness", -3, "Failing the citizenship test");
    return true;
  }
  if (chk.keepsOld) c.citizenships = [...(c.citizenships ?? []), dest];
  else {
    const gone = (c.citizenships ?? []).map((r) => country(r).demonym);
    c.citizenships = [dest];
    c.yearLog.push(`${d.demonym} law doesn't allow dual citizenship, so you gave up your ${gone.join(" and ")} passport.`);
  }
  c.immigration = null;
  c.integration = Math.max(c.integration ?? 0, 70);
  changeStat(c, "happiness", 10, `Becoming ${d.demonym}`);
  c.yearLog.push(`You passed the test and took the oath. You're now a ${d.demonym} citizen! ${d.flag}`);
  return true;
}

// ------------------------------------------------------------------ travel

export type TripCheck = { ok: boolean; reason?: string; cost: number; visaFree: boolean; visaFee: number };

export const canVisitFree = (c: Character, dest: RegionKey): boolean => isCitizen(c, dest) || passportStrength(c) >= country(dest).entry;

export function tripCheck(c: Character, dest: RegionKey): TripCheck {
  ensureAbroad(c);
  const idxHere = livingIndex(c.originRegion);
  const idxThere = livingIndex(dest);
  const cost = c.age < 18 ? 0 : Math.round(900 * (0.5 + 0.5 * idxHere) + 2200 * idxThere);
  const visaFree = canVisitFree(c, dest);
  const visaFee = visaFree ? 0 : Math.round(260 * idxThere);
  if (dest === c.originRegion) return { ok: false, reason: "You live here.", cost, visaFree, visaFee };
  if (c.inJail) return { ok: false, reason: "Not while you're locked up.", cost, visaFree, visaFee };
  if (c.tripAge === c.age) return { ok: false, reason: "You've already travelled this year.", cost, visaFree, visaFee };
  if (c.age < 18 && !c.relationships.some((r) => r.alive && (r.type === "mother" || r.type === "father"))) return { ok: false, reason: "You need an adult to take you.", cost, visaFree, visaFee };
  if (c.age < 5) return { ok: false, reason: "Too young to remember it.", cost, visaFree, visaFee };
  if (c.money < cost + visaFee) return { ok: false, reason: `You need ${money(cost + visaFee)}.`, cost, visaFree, visaFee };
  return { ok: true, cost, visaFree, visaFee };
}

export function takeTrip(c: Character, dest: RegionKey): boolean {
  const chk = tripCheck(c, dest);
  if (!chk.ok) return false;
  const d = country(dest);
  c.tripAge = c.age;
  if (!chk.visaFree) {
    c.money -= chk.visaFee;
    const p = c.criminalRecord ? 0.45 : 0.86;
    if (Math.random() > p) {
      c.yearLog.push(`Your tourist visa for ${getRegion(dest).label} was refused. -${money(chk.visaFee)}`);
      changeStat(c, "happiness", -3, "Visa refused");
      return true;
    }
  }
  c.money -= chk.cost;
  changeStat(c, "happiness", randomInt(7, 13), `A trip to ${getRegion(dest).label}`);
  c.stress = clamp((c.stress ?? 25) - 12);
  if (!(c.visited ?? []).includes(dest)) c.visited = [...(c.visited ?? []), dest];
  const before = langLevel(c, d.language);
  if (before < 60) c.languages = { ...(c.languages ?? {}), [d.language]: before + randomInt(2, 5) };
  const family = c.relationships.filter((r) => r.alive && (r.type === "partner" || r.type === "child"));
  for (const r of family) r.level = clamp(r.level + 5);
  const mishaps = ["Your bag went missing for two days.", "You got gloriously lost and found the best cafe of the trip.", "You made friends with a stranger on the train.", "You ate something wonderful you can't pronounce."];
  c.yearLog.push(`You took a trip to ${getRegion(dest).label}${chk.cost ? ` for ${money(chk.cost)}` : " with your family"}. ${mishaps[randomInt(0, mishaps.length - 1)]}`);
  return true;
}

// ------------------------------------------------------------------ the yearly tick

export function tickAbroad(c: Character, world: WorldState): void {
  ensureAbroad(c);
  const region = c.originRegion!;
  const d = country(region);

  // the decision on an application arrives
  const app = c.visaApp;
  if (app && c.age >= app.decides) {
    const chk = routeCheck({ ...c, visaApp: null } as Character, app.dest, app.route);
    const funds = app.route === "residence" || app.route === "family" ? 0 : chk.funds;
    if (Math.random() < chk.chance) {
      if (funds > 0 && c.money < funds * 0.8) {
        c.yearLog.push(`Your ${ROUTE_LABEL[app.route].toLowerCase()} for ${getRegion(app.dest).label} was approved, but you couldn't afford to go. It lapsed.`);
        c.visaApp = null;
      } else if (app.route === "residence" || app.route === "family") {
        c.immigration = { status: "permanent", since: c.age, years: c.immigration?.years ?? 0 };
        c.visaApp = null;
        c.yearLog.push(`Approved! You're now a permanent resident of ${getRegion(app.dest).label}.`);
        changeStat(c, "happiness", 8, "Permanent residence");
      } else {
        c.yearLog.push(`Approved! Your ${ROUTE_LABEL[app.route].toLowerCase()} for ${getRegion(app.dest).label} came through.`);
        emigrate(c, app.dest, app.route, app.city, world);
        return;
      }
    } else {
      c.yearLog.push(`Your ${ROUTE_LABEL[app.route].toLowerCase()} application${app.route === "residence" || app.route === "family" ? "" : ` for ${getRegion(app.dest).label}`} was refused. You can apply again.`);
      changeStat(c, "happiness", -5, "A visa refusal");
      c.visaApp = null;
    }
  }

  if (isCitizen(c)) {
    if (c.immigration) c.immigration = null;
    if (c.integration !== 100) c.integration = 100;
    return;
  }

  // living abroad
  const imm = (c.immigration ??= { status: "family", since: c.age, years: 0 });
  c.abroadYears = (c.abroadYears ?? 0) + 1;
  if (imm.status !== "overstay") imm.years += 1;
  const lang = langLevel(c, d.language);
  const gain = lang < 55 ? 9 : lang < 80 ? 5 : 2;
  c.languages = { ...(c.languages ?? {}), [d.language]: Math.min(100, lang + (c.age < 15 ? gain + 5 : gain)) };
  const newLang = langLevel(c, d.language);
  c.integration = clamp((c.integration ?? 30) + 4 + newLang / 30 + (c.job ? 3 : 0) + (c.relationships.filter((r) => r.type === "friend" && r.alive && r.level > 45).length > 2 ? 3 : 0));
  if ((c.integration ?? 0) < 40) changeStat(c, "happiness", -2, "Feeling like an outsider");

  // does your permission still hold?
  if (imm.status === "student" && !c.higher && c.age >= imm.since + 2) {
    if (c.job) {
      imm.status = "work";
      imm.expires = c.age + 3;
      c.yearLog.push("Your employer sponsored you: your student visa became a work visa.");
    } else imm.expires = c.age;
  }
  if (imm.expires !== undefined && imm.expires - c.age === 1 && imm.status !== "permanent" && imm.status !== "overstay") {
    c.yearLog.push(`Your ${statusLabel(imm.status).toLowerCase()} runs out next year. Sort out your papers.`);
  }
  if (imm.expires !== undefined && c.age >= imm.expires && (imm.status === "holiday" || imm.status === "student") && c.job && !c.criminalRecord) {
    imm.status = "work";
    imm.expires = c.age + 3;
    c.yearLog.push("Your employer offered to sponsor you, and your visa became a work visa.");
  }
  if (imm.expires !== undefined && c.age >= imm.expires && imm.status !== "permanent" && imm.status !== "overstay") {
    const canRenew =
      !c.criminalRecord &&
      ((imm.status === "work" && !!c.job) || (imm.status === "student" && !!c.higher) || (imm.status === "investor" && c.money > 100000 * livingIndex(region)) || (imm.status === "family" && c.relationships.some((r) => r.type === "partner" && r.married && r.alive)));
    if (canRenew) {
      imm.expires = c.age + 3;
      c.yearLog.push(`Your ${statusLabel(imm.status).toLowerCase()} was renewed.`);
    } else {
      imm.status = "overstay";
      imm.expires = c.age + 1;
      c.yearLog.push(`Your visa expired. You're in ${getRegion(region).label} without permission - leave, or find a way to stay.`);
      changeStat(c, "happiness", -6, "Your visa expired");
    }
  } else if (imm.status === "overstay" && imm.expires !== undefined && c.age >= imm.expires) {
    deport(c);
  }
}

function deport(c: Character): void {
  const home = (c.citizenships ?? [c.birthRegion ?? "us"])[0];
  const city = cityByKey(c.birthCity) ?? defaultCityFor(home);
  const from = getRegion(c.originRegion).label;
  c.originRegion = home;
  const res = c.residence!;
  res.city = city.key;
  res.housing = c.relationships.some((r) => r.alive && (r.type === "mother" || r.type === "father")) ? "family" : "homeless";
  res.rentKey = undefined;
  res.rent = undefined;
  res.since = c.age;
  for (const job of ["job", "partTime"] as const) (c as Character & Record<string, unknown>)[job] = null;
  if (c.home) sellHome(c);
  c.immigration = null;
  c.integration = 100;
  changeStat(c, "happiness", -14, "Deported");
  c.yearLog.push(`You were deported from ${from} and sent back to ${getRegion(home).label}.`);
  refreshCoworkers(c);
}

export function leaveVoluntarily(c: Character): boolean {
  const home = (c.citizenships ?? [c.birthRegion ?? "us"])[0];
  return returnTo(c, home);
}
