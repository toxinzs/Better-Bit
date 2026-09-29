import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { cityOf, livingIndex } from "../../engine/where";
import { ensureLocation, familyMove, livingCost, rentPlace, afterSellHome } from "../../engine/location";
import { sellHome } from "../../engine/assets";
import { addPerson } from "../../engine/people";
import { rentOption } from "../housing";

// Where you live shapes what happens to you: landlords, neighbours, rent that
// goes up, streets that are safe or aren't, and families that relocate.

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const renting = (c: Character) => c.residence?.housing === "rent";
const homeowner = (c: Character) => c.residence?.housing === "own" && !!c.home;
const adultOnOwn = (c: Character) => c.age >= 18 && (renting(c) || homeowner(c));
const parentOf = (c: Character) => c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father"));
const verbal = (c: Character) => ((c.talents?.verbal ?? 50) - 50) / 200;

export const PLACE_EVENTS: LifeEvent[] = [
  // ------------------------------------------------------------ families move
  {
    id: "family-relocation-teen",
    minAge: 12,
    maxAge: 17,
    once: true,
    weight: 0.7,
    condition: (c) => !c.higher && !!c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father")),
    text: (c) => `${parentOf(c)?.name.split(" ")[0] ?? "Your parent"} has been offered a job in another city. The whole family would have to go.`,
    choices: [
      { label: "Argue to stay", effect: (c) => { if (Math.random() < 0.15) { changeStat(c, "happiness", 3, "Getting your way"); return; } const p = parentOf(c); if (p) p.level = clamp(p.level - 6); familyMove(c, undefined, false); changeStat(c, "happiness", -3, "Arguing and losing"); }, resultText: (c) => (cityOf(c).key === c.birthCity ? "They listened, for once. You're staying." : `You lost the argument. Welcome to ${cityOf(c).name}.`) },
      { label: "Make the best of it", effect: (c) => { familyMove(c, undefined, false); changeStat(c, "happiness", 1, "A fresh start"); if (c.personality) c.personality.o = clamp(c.personality.o + 1); }, resultText: (c) => `The removal van is loaded. Hello, ${cityOf(c).name}.` },
    ],
  },
  // ------------------------------------------------------------ getting your own place
  {
    id: "flying-the-nest",
    minAge: 18,
    maxAge: 26,
    once: true,
    weight: 3,
    condition: (c) => c.residence?.housing === "family" && (!c.higher || c.currentHousing === "commute") && !c.inJail && !!c.job,
    text: (c) => `You've got a steady income now. ${parentOf(c)?.name.split(" ")[0] ?? "Your family"} keeps hinting that it might be time to get your own place.`,
    choices: [
      { label: "Rent a studio", effect: (c) => { if (!rentPlace(c, "studio")) c.yearLog.push("You couldn't afford the deposit yet."); }, resultText: (c) => (c.residence?.housing === "rent" ? `You signed for a studio in ${cityOf(c).name}. The keys feel heavy.` : "You looked at the deposit, and at your bank balance, and stayed put.") },
      { label: "Share a house with friends", effect: (c) => { if (!rentPlace(c, "share")) c.yearLog.push("You couldn't afford the deposit yet."); }, resultText: (c) => (c.residence?.housing === "rent" ? "A room in a shared house. Someone else always does the dishes wrong." : "You couldn't scrape the deposit together yet.") },
      { label: "Stay home and save", effect: (c) => { c.money += 500; changeStat(c, "smarts", 1, "Saving sensibly"); }, resultText: () => "Cheap, comfortable, and a little embarrassing." },
    ],
  },
  {
    id: "students-flat",
    minAge: 19,
    maxAge: 30,
    once: true,
    weight: 1.6,
    condition: (c) => c.residence?.housing === "family" && !c.higher && !c.job && !c.inJail,
    text: () => "A friend has found a house-share and there's a spare room going. Rent is cheap - if you can find work.",
    choices: [
      { label: "Take the room", effect: (c) => { if (!rentPlace(c, "share")) c.yearLog.push("The deposit was out of reach."); }, resultText: (c) => (c.residence?.housing === "rent" ? "Your own key, your own shelf in the fridge." : "You couldn't find the deposit in time.") },
      { label: "Stay where you are", effect: () => {}, resultText: () => "Someone else got the room by morning." },
    ],
  },
  // ------------------------------------------------------------ renting
  {
    id: "rent-hike",
    minAge: 18,
    maxAge: 90,
    weight: 1.7,
    condition: (c) => renting(c) && (c.residence?.rent ?? 0) > 0,
    text: (c) => `A letter from the landlord: rent is going up by ${randomInt(8, 15)}% next year. ${cityOf(c).tier === "capital" || cityOf(c).tier === "big" ? "Everyone in the building got the same letter." : "It's the first rise in a while."}`,
    choices: [
      { label: "Negotiate", effect: (c) => { const res = c.residence!; if (Math.random() < 0.4 + verbal(c)) { c.yearLog.push("You talked the landlord down to a small rise."); res.rent = Math.round((res.rent ?? 0) * 1.03); } else { res.rent = Math.round((res.rent ?? 0) * 1.12); c.yearLog.push("The landlord wouldn't budge."); } }, resultText: () => "You wrote a very polite email." },
      { label: "Pay it", effect: (c) => { const res = c.residence!; res.rent = Math.round((res.rent ?? 0) * 1.1); changeStat(c, "happiness", -1, "Rent going up"); }, resultText: () => "Nothing you can do about it." },
      { label: "Look for somewhere cheaper", effect: (c) => { const cur = c.residence?.rentKey ?? "studio"; const cheaper = cur === "house" ? "twobed" : cur === "twobed" ? "onebed" : cur === "onebed" ? "studio" : "share"; if (cheaper !== cur && rentPlace(c, cheaper)) c.yearLog.push(`You downsized to a ${rentOption(cheaper)!.label.toLowerCase()}.`); else changeStat(c, "happiness", -2, "Nothing cheaper to be found"); }, resultText: () => "You spent a month on listing sites." },
    ],
  },
  {
    id: "landlord-repairs",
    minAge: 18,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => renting(c),
    text: () => "The heating has been off for a week. The landlord has 'a plumber coming Thursday'. Again.",
    choices: [
      { label: "Push until it's fixed", effect: (c) => { changeStat(c, "happiness", 1, "Getting it fixed"); c.stress = clamp((c.stress ?? 25) + 3); }, resultText: () => "Seven phone calls later, warmth." },
      { label: "Fix it yourself", effect: (c) => { const ok = Math.random() < 0.3 + ((c.talents?.technical ?? 50) - 50) / 150; c.money -= Math.round(120 * ensureRatio(c)); if (ok) { changeStat(c, "smarts", 1, "Fixing your own boiler"); } else changeStat(c, "health", -1, "A cold week"); }, resultText: () => "YouTube said it would be easy." },
      { label: "Put up with it", effect: (c) => { changeStat(c, "health", -2, "A cold flat"); changeStat(c, "happiness", -2, "A cold flat"); }, resultText: () => "You wore a coat indoors for a week." },
    ],
  },
  {
    id: "roommate-drama",
    minAge: 18,
    maxAge: 40,
    weight: 1.7,
    condition: (c) => renting(c) && ["share", "studio", "onebed", "twobed"].includes(c.residence?.rentKey ?? "") && c.residence?.rentKey === "share",
    text: () => "Your housemate has been eating your food, leaving dishes in the sink and hosting loud guests on weeknights.",
    choices: [
      { label: "Have a calm chat", effect: (c) => { if (Math.random() < 0.55 + verbal(c) + ((c.personality?.a ?? 50) - 50) / 200) { changeStat(c, "happiness", 2, "Clearing the air"); } else { changeStat(c, "happiness", -2, "An awkward silence at home"); } }, resultText: () => "You said it out loud, which was the hard part." },
      { label: "Leave passive-aggressive notes", effect: (c) => { changeStat(c, "happiness", -1, "Cold war at home"); }, resultText: () => "The fridge is now a battleground." },
      { label: "Move out", effect: (c) => { const before = c.residence?.rentKey; rentPlace(c, "studio"); if (before === c.residence?.rentKey) c.yearLog.push("You couldn't find a better place you could afford."); }, resultText: (c) => (c.residence?.rentKey === "studio" ? "Sweet, blissful quiet." : "You couldn't afford to leave just yet.") },
    ],
  },
  {
    id: "noisy-neighbours",
    minAge: 18,
    maxAge: 90,
    weight: 1.5,
    condition: (c) => adultOnOwn(c) && ["capital", "big"].includes(cityOf(c).tier) || (adultOnOwn(c) && Math.random() < 0.4),
    text: () => "The people next door have a subwoofer and a very active social life. It's 2 a.m.",
    choices: [
      { label: "Knock politely", effect: (c) => { if (Math.random() < 0.55) changeStat(c, "happiness", 1, "Sorted it out"); else { changeStat(c, "happiness", -1, "Broken sleep"); changeStat(c, "health", -1, "Broken sleep"); } }, resultText: () => "You put on your slippers and went next door." },
      { label: "Earplugs and a fan", effect: (c) => { changeStat(c, "health", -1, "Broken sleep"); c.money -= 30; }, resultText: () => "Somewhere in the muffled distance, a bassline." },
      { label: "Call the council", effect: (c) => { changeStat(c, "happiness", 1, "Some peace"); const n = c.relationships.find((r) => r.type === "friend"); if (n) n.level = clamp(n.level - 1); }, resultText: () => "The noise stopped. So did the waving in the stairwell." },
    ],
  },
  {
    id: "friendly-neighbour",
    minAge: 18,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => adultOnOwn(c),
    text: (c) => `A neighbour in ${cityOf(c).name} leaves a plate of something home-cooked at your door with a note: "Welcome! Come round sometime."`,
    choices: [
      { label: "Go round for tea", effect: (c) => { const p = addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-10, 15), 18, 85), level: randomInt(45, 65) }); changeStat(c, "happiness", 3, `Getting to know ${p.name.split(" ")[0]}`); }, resultText: () => "Tea turned into dinner." },
      { label: "Send a thank-you note", effect: (c) => { changeStat(c, "happiness", 1, "A kind neighbour"); }, resultText: () => "Polite, and at a safe distance." },
    ],
  },
  {
    id: "eviction-warning",
    minAge: 18,
    maxAge: 90,
    weight: 9,
    condition: (c) => renting(c) && (c.residence?.arrears ?? 0) >= 1,
    text: (c) => `A formal notice on the door: rent of ${money(c.residence?.rent ?? 0)} is overdue. "Further arrears will result in eviction."`,
    choices: [
      { label: "Ask family for help", effect: (c) => { const p = parentOf(c); if (p && p.level >= 45) { c.money += Math.round((c.residence?.rent ?? 0) * 0.6); p.level = clamp(p.level - 4); c.yearLog.push(`${p.name.split(" ")[0]} helped you out, with a look.`); } else c.yearLog.push("Nobody was in a position to help."); }, resultText: () => "The hardest phone call you've made." },
      { label: "Take a short-term loan", effect: (c) => { c.money += Math.round((c.residence?.rent ?? 0) * 0.6); c.creditScore = clamp((c.creditScore ?? 650) - 20, 300, 850); }, resultText: () => "The interest rate is criminal, but the notice can wait." },
      { label: "Cut everything back", effect: (c) => { c.lifestyle = "frugal"; changeStat(c, "happiness", -3, "Tight times"); }, resultText: () => "Beans, toast and long walks." },
    ],
  },
  {
    id: "cost-of-living-squeeze",
    minAge: 18,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => adultOnOwn(c) && c.money < livingCost(c) * 0.5 && c.lifestyle !== "frugal",
    text: (c) => `Everything in ${cityOf(c).name} costs more than it did last year, and your account is looking thin.`,
    choices: [
      { label: "Go frugal", effect: (c) => { c.lifestyle = "frugal"; }, resultText: () => "You started meal-prepping on Sundays." },
      { label: "Pick up extra work", effect: (c) => { c.money += Math.round(livingCost(c) * 0.4); c.stress = clamp((c.stress ?? 25) + 8); changeStat(c, "happiness", -1, "Extra shifts"); }, resultText: () => "Evenings vanish, but the bills get paid." },
      { label: "Carry on as normal", effect: (c) => { changeStat(c, "happiness", -1, "Money worries"); }, resultText: () => "You'll worry about it later." },
    ],
  },
  // ------------------------------------------------------------ owning
  {
    id: "estate-agent-offer",
    minAge: 21,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => homeowner(c) && (c.home?.value ?? 0) > 0,
    text: (c) => `A buyer has made an unsolicited offer on your ${c.home?.name.toLowerCase()}: ${money(Math.round((c.home?.value ?? 0) * 1.15))}, 15% over what it's worth.`,
    choices: [
      { label: "Sell up", effect: (c) => { if (!c.home) return; c.home.value = Math.round(c.home.value * 1.15); sellHome(c); afterSellHome(c); }, resultText: (c) => `You banked the profit. You now rent a ${rentOption(c.residence?.rentKey)?.label.toLowerCase() ?? "place"}.` },
      { label: "Turn it down", effect: (c) => { changeStat(c, "happiness", 1, "Home sweet home"); }, resultText: () => "It's not for sale. It's home." },
    ],
  },
  {
    id: "home-repair-bill",
    minAge: 21,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => homeowner(c),
    text: () => "The roof is leaking. Of course it is.",
    choices: [
      { label: "Get it done properly", effect: (c) => { c.money -= Math.round((c.home?.value ?? 100000) * 0.02); }, resultText: () => "A bill you felt in your teeth." },
      { label: "Patch it yourself", effect: (c) => { const ok = Math.random() < 0.35 + ((c.talents?.technical ?? 50) - 50) / 150; c.money -= 200; if (!ok) c.money -= Math.round((c.home?.value ?? 100000) * 0.03); }, resultText: () => "A weekend, a ladder and a lot of optimism." },
    ],
  },
  // ------------------------------------------------------------ city life
  {
    id: "break-in",
    minAge: 18,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => adultOnOwn(c) && Math.random() < Math.max(0, (68 - cityOf(c).safety) / 60),
    text: (c) => `You come home to a jimmied door. ${cityOf(c).name} has its rough edges.`,
    choices: [
      { label: "Call the police", effect: (c) => { const loss = Math.round(600 * ensureRatio(c)); c.money -= loss; changeStat(c, "happiness", -4, "Burgled"); }, resultText: () => "They took a report. You took a lot of photos." },
      { label: "Fit better locks", effect: (c) => { const loss = Math.round(600 * ensureRatio(c)); c.money -= loss + Math.round(150 * ensureRatio(c)); changeStat(c, "happiness", -3, "Burgled"); }, resultText: () => "Never again." },
    ],
  },
  {
    id: "safe-streets",
    minAge: 8,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => cityOf(c).safety >= 80,
    autoEffect: (c) => { changeStat(c, "happiness", 2, "Feeling safe where you live"); },
    text: (c) => `Walking home after dark through ${cityOf(c).name} doesn't even cross your mind. It's one of the small luxuries of living here.`,
  },
  {
    id: "city-festival",
    minAge: 5,
    maxAge: 90,
    weight: 1.3,
    autoEffect: (c) => { changeStat(c, "happiness", randomInt(2, 4), "A festival in your city"); },
    text: (c) => `The streets of ${cityOf(c).name} fill up for the yearly festival: music, food stalls and everyone out until late.`,
  },
  {
    id: "long-commute",
    minAge: 18,
    maxAge: 67,
    weight: 1.4,
    condition: (c) => !!c.job && ["capital", "big"].includes(cityOf(c).tier),
    autoEffect: (c) => { c.stress = clamp((c.stress ?? 25) + 6); changeStat(c, "happiness", -2, "The commute"); },
    text: (c) => `Another year of sardine-tin trains across ${cityOf(c).name}. The commute is eating your life, one delay at a time.`,
  },
  {
    id: "small-town-gossip",
    minAge: 12,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => cityOf(c).tier === "small",
    autoEffect: (c) => { changeStat(c, "happiness", -1, "Everyone knows your business"); },
    text: (c) => `Somebody in ${cityOf(c).name} saw something and told someone who told everyone. By lunchtime the whole town knew.`,
  },
  {
    id: "big-city-lonely",
    minAge: 19,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => ["capital", "big"].includes(cityOf(c).tier) && (c.personality?.e ?? 50) < 45,
    autoEffect: (c) => { changeStat(c, "happiness", -3, "Lonely in a crowd"); },
    text: () => "You're surrounded by millions of people and known by almost none of them. The city can do that.",
  },
];

// prices scale with where you live: a burglary costs less in a cheap country
function ensureRatio(c: Character): number {
  ensureLocation(c);
  return cityOf(c).cost * livingIndex(c.originRegion);
}
