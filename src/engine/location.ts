import { Character, Lifestyle, RentKey, Residence } from "../types";
import { CITIES, City, citiesFor, cityByKey, defaultCityFor, CITY_BIRTH_WEIGHT } from "../data/cities";
import { LIFESTYLES, RENT_BASE, RENT_OPTIONS, lifestyleDef, rentOption } from "../data/housing";
import { HomeListing, HOME_LISTINGS } from "../data/assets";
import { getRegion } from "../data/regions";
import { rngFrom } from "../data/companies";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { addPerson, refreshCoworkers } from "./people";
import { livingIndex, cityOf } from "./where";
import { enterSchool } from "./education";
import { sellHome } from "./assets";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ------------------------------------------------------------------ birth city

export function rollBirthCity(region: Character["originRegion"], rng: () => number = Math.random): City {
  const list = citiesFor(region);
  const total = list.reduce((s, c) => s + CITY_BIRTH_WEIGHT[c.tier], 0);
  let roll = rng() * total;
  for (const c of list) {
    roll -= CITY_BIRTH_WEIGHT[c.tier];
    if (roll <= 0) return c;
  }
  return list[list.length - 1];
}

const parentsAlive = (c: Character) => c.relationships.some((r) => r.alive && (r.type === "mother" || r.type === "father"));

// Older saves and freshly-created characters both come through here: it gives
// everyone a city, a housing situation and a lifestyle without changing
// anything they already have.
export function ensureLocation(c: Character): void {
  c.originRegion ??= "us";
  c.birthRegion ??= c.originRegion;
  c.lifestyle ??= "normal";
  c.moves ??= 0;
  if (!c.residence || !cityByKey(c.residence.city)) {
    const city = cityByKey(c.birthCity) ?? rollBirthCity(c.originRegion, rngFrom((c.avatarSeed ?? 1) + 77));
    c.birthCity ??= city.key;
    let housing: Residence["housing"] = "family";
    if (c.home) housing = "own";
    else if (c.age >= 18 && !parentsAlive(c)) housing = "rent";
    const res: Residence = { city: city.key, housing, since: housing === "family" ? 0 : c.age };
    if (housing === "rent") {
      res.rentKey = "studio";
      res.rent = rentFor(c, city, "studio");
    }
    c.residence = res;
  }
  c.birthCity ??= c.residence.city;
}

// ------------------------------------------------------------------ prices

export function rentFor(c: Character, city: City, key: RentKey): number {
  const opt = rentOption(key) ?? RENT_OPTIONS[1];
  return Math.round(RENT_BASE * opt.mult * city.cost * livingIndex(c.originRegion));
}

export function livingCost(c: Character): number {
  const city = cityOf(c);
  const base = lifestyleDef(c.lifestyle).cost * (0.4 + 0.6 * city.cost) * livingIndex(c.originRegion);
  return Math.round(base);
}

// what you actually pay towards living costs this year
export function livingShare(c: Character): number {
  if (c.inJail || c.age < 18) return 0;
  const res = c.residence;
  if (res?.housing === "homeless") return 0.5;
  if (res?.housing === "family") return 0.25; // you contribute to the household
  if (c.higher && (c.currentHousing === "dorm" || c.currentHousing === "greek" || c.currentHousing === "apartment")) return 0.6;
  return 1;
}

export function moveCost(c: Character, dest: City): number {
  const far = dest.key === c.residence?.city ? 0.4 : 1;
  return Math.round((900 + 1100 * dest.cost) * livingIndex(c.originRegion) * far);
}

export function homeListingsFor(c: Character): HomeListing[] {
  const city = cityOf(c);
  return HOME_LISTINGS.map((h) => ({ ...h, price: Math.round((h.price * city.cost * livingIndex(c.originRegion)) / 500) * 500 }));
}

export function depositFor(rent: number): number {
  return Math.round(rent / 6);
}

// ------------------------------------------------------------------ yearly tick

export function tickLocation(c: Character): void {
  ensureLocation(c);
  const res = c.residence!;
  const city = cityOf(c);
  const region = getRegion(c.originRegion);
  const budget = { age: c.age, income: 0, tax: 0, rent: 0, living: 0, upkeep: 0 };
  const carried = c.budget && c.budget.age === c.age ? c.budget : null;
  if (carried) {
    budget.income = carried.income;
    budget.tax = carried.tax;
  }

  // family home: it ends when the parents are gone, and a grown-up with a wage moves on
  if (res.housing === "family" && c.age >= 18 && !c.inJail) {
    const shareKey: RentKey = "share";
    if (!parentsAlive(c)) {
      res.housing = "rent";
      res.rentKey = "studio";
      res.rent = rentFor(c, city, "studio");
      res.since = c.age;
      c.yearLog.push("With the family home gone, you found a place of your own.");
    } else if (c.age >= 28 && (c.job || c.partTime) && !c.higher && c.money >= depositFor(rentFor(c, city, shareKey)) * 2) {
      const key: RentKey = c.money > 20000 * livingIndex(c.originRegion) ? "studio" : shareKey;
      if (rentPlace(c, key)) c.yearLog.push("It was finally time - you got a place of your own.");
    }
  }

  // the housing market moves
  if (c.home) {
    const drift = 1 + (Math.random() * 0.14 - 0.04);
    c.home.value = Math.round(c.home.value * drift);
    const tax = Math.round(c.home.value * 0.008);
    const upkeep = Math.round(c.home.value * 0.006);
    c.money -= tax + upkeep;
    budget.upkeep += tax + upkeep;
    if (res.housing !== "own") res.housing = "own";
  } else if (res.housing === "own") {
    res.housing = c.age >= 18 && !parentsAlive(c) ? "rent" : "family";
    if (res.housing === "rent") {
      res.rentKey = "studio";
      res.rent = rentFor(c, city, "studio");
    }
  }

  // rent (and the landlord's yearly nudge upwards)
  if (res.housing === "rent") {
    const opt = rentOption(res.rentKey) ?? RENT_OPTIONS[1];
    const market = rentFor(c, city, opt.key);
    res.rent = Math.round(Math.max(res.rent ?? market, 1) * (1 + Math.random() * 0.05));
    if (res.rent < market * 0.8) res.rent = Math.round(market * 0.8);
    c.money -= res.rent;
    budget.rent = res.rent;
    if (opt.happy) changeStat(c, "happiness", opt.happy, `Living in a ${opt.label.toLowerCase()}`);
  }

  // food, bills, transport
  const living = Math.round(livingCost(c) * livingShare(c));
  if (living > 0) {
    c.money -= living;
    budget.living = living;
    const ls = lifestyleDef(c.lifestyle);
    if (ls.happy) changeStat(c, "happiness", ls.happy, `A ${ls.label.toLowerCase()} lifestyle`);
    if (ls.health) changeStat(c, "health", ls.health, `A ${ls.label.toLowerCase()} lifestyle`);
  }
  c.budget = budget;

  // can you actually afford where you live?
  if (c.age >= 18 && (res.housing === "rent" || res.housing === "homeless") && c.money < 0) {
    res.arrears = (res.arrears ?? 0) + 1;
    changeStat(c, "happiness", -4, "Money worries");
    changeStat(c, "health", -1, "Money worries");
    if (res.housing === "rent" && res.arrears >= 2) evict(c);
    else if (res.housing === "rent") {
      // first missed year: the landlord lets you drop to the cheapest room instead of throwing you out
      if (res.rentKey !== "share") {
        const cheap = rentFor(c, city, "share");
        res.rentKey = "share";
        res.rent = cheap;
        c.yearLog.push(`You fell behind on the rent and had to downsize to a shared room at ${money(cheap)} a year.`);
      } else c.yearLog.push(`You fell behind on the ${money(res.rent ?? 0)} rent. The landlord is losing patience.`);
    }
  } else if (res.arrears) {
    res.arrears = 0;
  }
  if (res.housing === "homeless") {
    // charity, a couch, a friend's spare room: nobody stays on the street forever
    const friend = c.relationships.find((r) => r.alive && (r.type === "friend" || r.type === "sibling" || r.type === "mother" || r.type === "father") && r.level >= 40);
    if (friend && Math.random() < 0.45) {
      res.housing = "family";
      res.since = c.age;
      res.arrears = 0;
      c.yearLog.push(`${friend.name.split(" ")[0]} took you in. It's not much, but it's a roof.`);
      return;
    }
    if (c.money >= depositFor(rentFor(c, city, "share")) + moveCost(c, city) * 0.4 && (c.job || c.partTime) && rentPlace(c, "share")) {
      c.yearLog.push("You saved enough for a room in a shared house. You're off the street.");
      return;
    }
    changeStat(c, "health", -3, "Sleeping rough");
    changeStat(c, "happiness", -5, "Sleeping rough");
    c.yearLog.push("You have nowhere of your own to live. Every night is a scramble.");
  }
  void region;
}

function evict(c: Character): void {
  const res = c.residence!;
  if (parentsAlive(c) && c.age < 40) {
    res.housing = "family";
    res.rentKey = undefined;
    res.rent = undefined;
    res.arrears = 0;
    res.since = c.age;
    c.yearLog.push("You were evicted for unpaid rent, and had to move back in with your family.");
    changeStat(c, "happiness", -6, "Evicted");
  } else {
    res.housing = "homeless";
    res.rentKey = undefined;
    res.rent = undefined;
    res.arrears = 0;
    res.since = c.age;
    c.yearLog.push("You were evicted for unpaid rent. You have nowhere to go.");
    changeStat(c, "happiness", -10, "Evicted");
  }
  c.creditScore = clamp((c.creditScore ?? 650) - 40, 300, 850);
}

// ------------------------------------------------------------------ housing actions

export function setLifestyle(c: Character, key: Lifestyle): boolean {
  if (!LIFESTYLES.some((l) => l.key === key)) return false;
  c.lifestyle = key;
  c.yearLog.push(`You changed how you live: ${lifestyleDef(key).label.toLowerCase()}.`);
  return true;
}

export type HousingCheck = { ok: boolean; reason?: string; cost?: number };

export function canRent(c: Character, key: RentKey): HousingCheck {
  ensureLocation(c);
  const opt = rentOption(key);
  if (!opt) return { ok: false, reason: "That place isn't available." };
  if (c.age < opt.minAge) return { ok: false, reason: `You need to be ${opt.minAge} to rent this.` };
  if (c.inJail) return { ok: false, reason: "You can't do that while locked up." };
  if (c.residence?.housing === "own") return { ok: false, reason: "You own your home - sell it first." };
  const rent = rentFor(c, cityOf(c), key);
  const cost = depositFor(rent) + Math.round(moveCost(c, cityOf(c)) * 0.4);
  if (c.money < cost) return { ok: false, reason: `You need ${money(cost)} for the deposit and moving costs.`, cost };
  return { ok: true, cost };
}

// rent (or change to) a place in the city you already live in
export function rentPlace(c: Character, key: RentKey): boolean {
  const chk = canRent(c, key);
  if (!chk.ok) return false;
  const res = c.residence!;
  const rent = rentFor(c, cityOf(c), key);
  const wasFamily = res.housing === "family";
  c.money -= chk.cost ?? 0;
  res.housing = "rent";
  res.rentKey = key;
  res.rent = rent;
  res.since = c.age;
  res.arrears = 0;
  c.yearLog.push(`You ${wasFamily ? "moved out and " : ""}took a ${rentOption(key)!.label.toLowerCase()} in ${cityOf(c).name} for ${money(rent)} a year.`);
  if (wasFamily) {
    changeStat(c, "happiness", 4, "A place of your own");
    const parent = c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father"));
    if (parent) parent.level = clamp(parent.level + randomInt(-4, 2));
  }
  return true;
}

export function canMoveHome(c: Character): HousingCheck {
  if (!parentsAlive(c)) return { ok: false, reason: "There's no family home to go back to." };
  if (c.residence?.housing === "family") return { ok: false, reason: "You already live at home." };
  if (c.residence?.housing === "own") return { ok: false, reason: "You own your home - sell it first." };
  return { ok: true };
}

export function moveBackHome(c: Character): boolean {
  if (!canMoveHome(c).ok) return false;
  const res = c.residence!;
  res.housing = "family";
  res.rentKey = undefined;
  res.rent = undefined;
  res.arrears = 0;
  res.since = c.age;
  c.yearLog.push("You moved back in with your family. It's cheaper, if not exactly glamorous.");
  changeStat(c, "happiness", -2, "Back in your childhood bedroom");
  return true;
}

// buying puts you in the house; the mortgage engine (assets.ts) does the rest
export function afterBuyHome(c: Character): void {
  ensureLocation(c);
  const res = c.residence!;
  res.housing = "own";
  res.rentKey = undefined;
  res.rent = undefined;
  res.arrears = 0;
  res.since = c.age;
}

export function afterSellHome(c: Character): void {
  ensureLocation(c);
  const res = c.residence!;
  if (res.housing !== "own") return;
  if (parentsAlive(c) && c.age < 30) moveBackHome(c);
  else {
    res.housing = "rent";
    res.rentKey = "studio";
    res.rent = rentFor(c, cityOf(c), "studio");
    res.since = c.age;
  }
}

// ------------------------------------------------------------------ moving cities

export type MovePreview = {
  city: City;
  cost: number;
  job: "none" | "keep" | "lose";
  partTime: "none" | "keep" | "lose";
  sellsHome: boolean;
  blocked?: string;
  wageDelta: number; // % change in pay
  rentDelta: number; // % change in rent for the same kind of place
};

export function previewMove(c: Character, dest: City): MovePreview {
  ensureLocation(c);
  const here = cityOf(c);
  const jobFate = (job: Character["job"]): "none" | "keep" | "lose" => (!job ? "none" : job.field && dest.strengths.includes(job.field) ? "keep" : "lose");
  const p: MovePreview = {
    city: dest,
    cost: moveCost(c, dest),
    job: jobFate(c.job),
    partTime: jobFate(c.partTime ?? null),
    sellsHome: !!c.home,
    wageDelta: Math.round((dest.wage / here.wage - 1) * 100),
    rentDelta: Math.round((dest.cost / here.cost - 1) * 100),
  };
  if (dest.key === here.key) p.blocked = "You already live here.";
  else if (c.inJail) p.blocked = "You can't move while locked up.";
  else if (c.age < 18) p.blocked = "Your family decides where you live.";
  else if (c.money < p.cost) p.blocked = `You need ${money(p.cost)} for the move.`;
  return p;
}

// the parts of a move every kind of move shares
function relocate(c: Character, dest: City, voluntary: boolean): string[] {
  const notes: string[] = [];
  const res = c.residence!;
  const from = cityOf(c);
  res.city = dest.key;
  c.moves = (c.moves ?? 0) + 1;

  // friends you leave behind fade
  let lost = 0;
  for (const r of c.relationships) {
    if (!r.alive) continue;
    if (r.type === "friend" || r.type === "classmate") {
      r.level = clamp(r.level - randomInt(12, 24));
      lost++;
    } else if (r.type === "teacher") {
      r.level = clamp(r.level - 10);
    }
  }
  if (lost > 0) notes.push(`You left ${lost} ${lost === 1 ? "friend" : "friends"} behind.`);
  // the school you're in is a new one
  if (c.school) {
    c.school = null;
    if (c.age >= 5 && c.age <= 18) enterSchool(c, c.educationStage);
  }
  // homesickness fades with time and with a curious, sociable nature
  const p = c.personality;
  const hs = Math.round(clamp(8 - ((p?.o ?? 50) - 50) / 12 - ((p?.e ?? 50) - 50) / 15, 1, 12));
  changeStat(c, "happiness", -hs, `Homesick for ${from.name}`);
  // new neighbours
  const n = randomInt(1, 2);
  for (let i = 0; i < n; i++) {
    addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-4, 6), c.age < 18 ? Math.max(5, c.age - 2) : 18, 80), level: randomInt(25, 45) });
  }
  notes.push(`You met ${n} new ${n === 1 ? "neighbour" : "neighbours"}.`);
  void voluntary;
  return notes;
}

export function moveTo(c: Character, dest: City, rentKey: RentKey = "studio"): boolean {
  ensureLocation(c);
  const pre = previewMove(c, dest);
  if (pre.blocked) return false;
  const res = c.residence!;
  const from = cityOf(c);
  const wasFamily = res.housing === "family";
  c.money -= pre.cost;

  // a home has to be sold
  if (c.home) {
    const name = c.home.name;
    sellHome(c);
    c.yearLog.push(`You sold your ${name} to move.`);
  }
  if (res.housing === "own") res.housing = "rent";

  c.yearLog.push(`You moved from ${from.name} to ${dest.name}. -${money(pre.cost)}`);
  const notes = relocate(c, dest, true);

  // work
  const lose = (job: "job" | "partTime") => {
    const j = c[job];
    if (!j) return;
    (c as Character & Record<string, unknown>)[job] = null;
    c.yearLog.push(`Your job as a ${j.title} didn't come with you.`);
  };
  if (pre.job === "lose") lose("job");
  if (pre.partTime === "lose") lose("partTime");
  if (c.job || c.partTime) c.yearLog.push("Your employer found you a role in the new office.");
  refreshCoworkers(c);

  // a partner may follow
  const partner = c.relationships.find((r) => r.alive && r.type === "partner");
  if (partner) {
    if (partner.level >= 60) notes.push(`${partner.name} came with you.`);
    else {
      partner.level = clamp(partner.level - randomInt(15, 30));
      notes.push(`${partner.name} didn't take the move well.`);
    }
  }

  // set up a place to live
  if (wasFamily || res.housing === "rent" || res.housing === "homeless" || res.housing === "family") {
    const opt = rentOption(rentKey) ?? RENT_OPTIONS[1];
    const rent = rentFor(c, dest, opt.key);
    const deposit = depositFor(rent);
    c.money -= deposit;
    res.housing = "rent";
    res.rentKey = opt.key;
    res.rent = rent;
    res.since = c.age;
    res.arrears = 0;
    notes.push(`You took a ${opt.label.toLowerCase()} for ${money(rent)} a year (${money(deposit)} deposit).`);
  }
  for (const n of notes) c.yearLog.push(n);
  return true;
}

// minors move when their family does
export function familyMove(c: Character, dest?: City, logMove = true): City | null {
  ensureLocation(c);
  const here = cityOf(c);
  const options = citiesFor(c.originRegion).filter((x) => x.key !== here.key);
  if (options.length === 0) return null;
  const to = dest ?? options[randomInt(0, options.length - 1)];
  // families move for work, so a wealthier pull is likelier - but it's mostly random
  c.residence!.since = c.age;
  const notes = relocate(c, to, false);
  if (logMove) c.yearLog.push(`Your family moved from ${here.name} to ${to.name}.`);
  for (const n of notes) c.yearLog.push(n);
  return to;
}

export { CITIES, defaultCityFor };
