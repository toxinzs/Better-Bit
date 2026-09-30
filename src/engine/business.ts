import { Business, Character, WorldState } from "../types";
import { BUSINESSES, BizDef, EMPLOYEE_WAGE, LEVEL_MULT, bizDef } from "../data/businesses";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { hasActiveCondition } from "./worldState";
import { cityCost, cityWage, livingIndex, noteIncome } from "./where";
import { getRegion } from "../data/regions";
import { incomeTax, taxCredit } from "./taxes";
import { salaryNow } from "./career";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hasDegree = (c: Character) => c.hasCollegeDegree || (c.degrees ?? []).length > 0;

// ------------------------------------------------------------------ scale

const jm = (c: Character) => getRegion(c.originRegion).jobMultiplier;

export function startupCost(c: Character, def: BizDef): number {
  return Math.round(def.startup * livingIndex(c.originRegion) * (0.6 + 0.4 * cityCost(c)));
}

export type Outlook = { revenue: number; costs: number; wages: number; profit: number };

// what a year is expected to look like, before luck
export function outlook(c: Character, world: WorldState, b: Business | null | undefined = c.business): Outlook {
  const def = b ? bizDef(b.type) : undefined;
  if (!b || !def) return { revenue: 0, costs: 0, wages: 0, profit: 0 };
  const econ = hasActiveCondition(world, "recession") ? 0.82 : hasActiveCondition(world, "boom") ? 1.14 : 1;
  const talent = c.talents?.[def.talent] ?? 50;
  const founder = 1 + (talent - 50) / 200 + ((c.personality?.c ?? 50) - 50) / 400 + (c.workMode === "grind" ? 0.1 : c.workMode === "coast" ? -0.1 : 0);
  const size = LEVEL_MULT[b.level - 1] ?? 1;
  const staff = 1 + b.employees * 0.3;
  const scale = jm(c) * cityWage(c);
  let revenue = def.revenue * size * (0.55 + b.rep / 100) * econ * founder * staff * scale;
  if (b.sideline) revenue *= 0.6;
  const wages = b.employees * EMPLOYEE_WAGE * scale;
  const fixed = def.fixed * size * livingIndex(c.originRegion) * (0.6 + 0.4 * cityCost(c));
  const costs = revenue * (1 - def.margin) + fixed;
  return { revenue: Math.round(revenue), costs: Math.round(costs), wages: Math.round(wages), profit: Math.round(revenue - costs - wages) };
}

export const capacity = (b: Business) => b.level * 3;

// ------------------------------------------------------------------ checks

export type BizCheck = { ok: boolean; reason?: string; cost: number };

export function canStart(c: Character, def: BizDef): BizCheck {
  const cost = startupCost(c, def);
  if (c.business) return { ok: false, reason: "You already run a business.", cost };
  if (c.age < def.minAge) return { ok: false, reason: `You need to be ${def.minAge}.`, cost };
  if (c.inJail) return { ok: false, reason: "Not from behind bars.", cost };
  if (c.higher) return { ok: false, reason: "Finish your studies first.", cost };
  if (def.needsDegree && !hasDegree(c)) return { ok: false, reason: "You need a degree.", cost };
  if (c.money < cost) return { ok: false, reason: `You need ${money(cost)} to start.`, cost };
  return { ok: true, cost };
}

export const startupWarning = (c: Character, def: BizDef): string | undefined => {
  const talent = c.talents?.[def.talent] ?? 50;
  return talent < 40 ? `Your aptitude for this is low (${talent}). It will be an uphill climb.` : undefined;
};

// ------------------------------------------------------------------ actions

export function startBusiness(c: Character, key: string, name: string): boolean {
  const def = bizDef(key);
  if (!def) return false;
  const chk = canStart(c, def);
  if (!chk.ok) return false;
  c.money -= chk.cost;
  const label = name.trim() || `${c.lastName} ${def.label}`;
  c.business = { type: def.key, name: label, since: c.age, reserve: Math.round(chk.cost * 0.15), employees: 0, rep: 45, level: 1, lastRevenue: 0, lastProfit: 0, totalProfit: 0, badYears: 0, sideline: !!c.job };
  changeStat(c, "happiness", 6, "Being your own boss");
  c.stress = clamp((c.stress ?? 25) + 6);
  c.yearLog.push(`You opened ${label}, a ${def.label.toLowerCase()}. -${money(chk.cost)}`);
  c.fullLog.push({ age: c.age, text: `You started a business: ${label}.` });
  return true;
}

export const hireCost = (c: Character) => Math.round(1500 * jm(c) * cityWage(c));

export function hire(c: Character): boolean {
  const b = c.business;
  if (!b || b.employees >= capacity(b) || c.money < hireCost(c)) return false;
  c.money -= hireCost(c);
  b.employees += 1;
  c.yearLog.push(`You hired someone at ${b.name}. -${money(hireCost(c))} to recruit`);
  return true;
}

export function fireStaff(c: Character): boolean {
  const b = c.business;
  if (!b || b.employees <= 0) return false;
  b.employees -= 1;
  b.rep = clamp(b.rep - 2);
  changeStat(c, "happiness", -2, "Letting someone go");
  c.yearLog.push(`You let an employee go at ${b.name}.`);
  return true;
}

export const marketingCost = (c: Character, world: WorldState) => Math.max(400, Math.round(outlook(c, world).revenue * 0.1));

export function marketing(c: Character, world: WorldState): boolean {
  const b = c.business;
  if (!b || b.marketAge === c.age) return false;
  const cost = marketingCost(c, world);
  if (c.money < cost) return false;
  c.money -= cost;
  b.marketAge = c.age;
  b.rep = clamp(b.rep + randomInt(5, 10));
  c.yearLog.push(`You ran a marketing push for ${b.name}. -${money(cost)}`);
  return true;
}

export const expandCost = (c: Character): number => {
  const b = c.business;
  const def = bizDef(b?.type);
  return b && def ? Math.round(def.startup * 0.9 * b.level * livingIndex(c.originRegion) * (0.6 + 0.4 * cityCost(c))) : 0;
};

export function expand(c: Character): boolean {
  const b = c.business;
  if (!b || b.level >= 5) return false;
  const cost = expandCost(c);
  if (c.money < cost) return false;
  c.money -= cost;
  b.level += 1;
  c.stress = clamp((c.stress ?? 25) + 4);
  c.yearLog.push(`${b.name} expanded (level ${b.level}). -${money(cost)}`);
  return true;
}

export function valueOf(c: Character): number {
  const b = c.business;
  const def = bizDef(b?.type);
  if (!b || !def) return 0;
  const size = LEVEL_MULT[b.level - 1] ?? 1;
  return Math.max(0, Math.round(Math.max(0, b.lastProfit) * 4 + b.reserve + def.startup * 0.3 * size * livingIndex(c.originRegion)));
}

export function sellBusiness(c: Character): boolean {
  const b = c.business;
  if (!b) return false;
  const v = valueOf(c);
  c.money += v;
  c.yearLog.push(`You sold ${b.name} for ${money(v)}.`);
  c.fullLog.push({ age: c.age, text: `You sold ${b.name} for ${money(v)}.` });
  c.business = null;
  return true;
}

export function closeBusiness(c: Character): boolean {
  const b = c.business;
  if (!b) return false;
  const back = Math.round(Math.max(0, b.reserve) * 0.9);
  c.money += back;
  c.yearLog.push(`You closed ${b.name}${back > 0 ? ` and took ${money(back)} out of the till` : ""}.`);
  c.business = null;
  return true;
}

// ------------------------------------------------------------------ the yearly tick

export function tickBusiness(c: Character, world: WorldState): void {
  const b = c.business;
  if (!b) return;
  const def = bizDef(b.type);
  if (!def) { c.business = null; return; }
  if (c.inJail) return;
  b.sideline = !!c.job;
  const o = outlook(c, world, b);
  // luck: bigger swings for riskier ventures
  const swing = 1 + (Math.random() + Math.random() - 1) * def.risk * 1.1;
  let revenue = Math.max(0, Math.round(o.revenue * swing));
  if (def.moonshot && Math.random() < def.moonshot && b.level >= 1) {
    revenue = Math.round(revenue * (3 + Math.random() * 4));
    c.yearLog.push(`${b.name} had a breakout year: revenue leapt to ${money(revenue)}!`);
  }
  const costs = Math.round((revenue / Math.max(1, o.revenue)) * (o.costs) * (0.85 + Math.random() * 0.3));
  const profit = revenue - costs - o.wages;
  b.lastRevenue = revenue;
  b.lastProfit = profit;
  b.totalProfit += profit;
  // reputation follows how the year went
  b.rep = clamp(b.rep + (profit > 0 ? 2 : -3) + (Math.random() - 0.5) * 4 - (b.employees > capacity(b) ? 4 : 0));
  c.stress = clamp((c.stress ?? 25) + (b.sideline ? 5 : 3));
  if (profit >= 0) {
    const base = c.job ? salaryNow(c, world) : 0;
    const tax = Math.max(0, incomeTax(base + profit, c.originRegion, taxCredit(c)) - (c.job ? incomeTax(base, c.originRegion, taxCredit(c)) : 0));
    const net = profit - tax;
    const draw = Math.round(net * 0.75);
    c.money += draw;
    b.reserve += net - draw;
    b.badYears = 0;
    noteIncome(c, draw, tax);
    c.yearLog.push(`${b.name} made ${money(profit)} this year (revenue ${money(revenue)}). You took home ${money(draw)}.`);
    changeStat(c, "happiness", 2, "A profitable business");
  } else {
    b.reserve += profit;
    if (b.reserve < 0) {
      c.money += b.reserve; // the owner covers the hole
      b.reserve = 0;
    }
    b.badYears += 1;
    changeStat(c, "happiness", -4, "A struggling business");
    c.yearLog.push(`${b.name} lost ${money(-profit)} this year.`);
    if (b.badYears >= 3 && c.money < 0) {
      c.yearLog.push(`${b.name} went bankrupt.`);
      c.fullLog.push({ age: c.age, text: `${b.name} went bankrupt.` });
      c.creditScore = clamp((c.creditScore ?? 650) - 80, 300, 850);
      changeStat(c, "happiness", -12, "Losing your business");
      c.business = null;
    } else if (b.badYears >= 2) c.yearLog.push("The books are in the red for a second year. Something has to change.");
  }
}

export { BUSINESSES };
