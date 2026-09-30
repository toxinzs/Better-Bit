import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { addPerson } from "../../engine/people";
import { cityOf, livingIndex } from "../../engine/where";
import { COUNTRIES, LANGUAGE_LABEL, country } from "../countries";
import { getRegion } from "../regions";
import { ensureAbroad, familyEmigrate, isAbroad, langLevel, sendMoneyHome, statusLabel, routeCheck, apply } from "../../engine/immigration";
import type { RegionKey } from "../../types";

// Life on the other side of a border: newcomers, visas, family back home, and
// the offers that make people wonder what else is out there.

const abroad = (c: Character) => isAbroad(c) && !c.inJail;
const here = (c: Character) => getRegion(c.originRegion).label;
const homeLabel = (c: Character) => getRegion(c.birthRegion).label;
const parent = (c: Character) => c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father"));
const localLang = (c: Character) => LANGUAGE_LABEL[country(c.originRegion).language];

export const ABROAD_EVENTS: LifeEvent[] = [
  {
    id: "culture-shock",
    minAge: 8,
    maxAge: 90,
    weight: 3,
    condition: (c) => abroad(c) && (c.integration ?? 50) < 40 && (c.immigration?.years ?? 9) <= 2,
    text: (c) => `Nothing works the way you expect in ${here(c)}: the shops, the manners, the queues, even the way people say goodbye. Some days you just want to go home.`,
    choices: [
      { label: "Throw yourself into it", effect: (c) => { c.integration = clamp((c.integration ?? 30) + 8); changeStat(c, "happiness", -2, "A rough week"); changeStat(c, "smarts", 1, "Learning fast"); }, resultText: () => "You said yes to everything for a month. It got easier." },
      { label: "Find other expats", effect: (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-5, 8), 8, 80), level: randomInt(50, 70) }); changeStat(c, "happiness", 3, "People who understand"); c.integration = clamp((c.integration ?? 30) + 3); }, resultText: () => "A group chat in your own language, and a place that sells the right snacks." },
      { label: "Stay in and video-call home", effect: (c) => { changeStat(c, "happiness", 1, "A call home"); c.integration = clamp((c.integration ?? 30) - 3); const p = parent(c); if (p) p.level = clamp(p.level + 4); }, resultText: () => "Comforting, but the country outside your window stays a stranger." },
    ],
  },
  {
    id: "language-mixup",
    minAge: 10,
    maxAge: 90,
    weight: 2,
    condition: (c) => abroad(c) && langLevel(c, country(c.originRegion).language) < 65,
    autoEffect: (c) => { changeStat(c, "happiness", 1, "Laughing at yourself"); c.integration = clamp((c.integration ?? 30) + 2); },
    text: (c) => `You confidently ordered what you thought was one thing in ${localLang(c)}. The waiter brought something else entirely. You ate it anyway.`,
  },
  {
    id: "discrimination-abroad",
    minAge: 10,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => abroad(c) && (c.integration ?? 50) < 55,
    text: (c) => `Someone in ${cityOf(c).name} made a comment about "people like you". It wasn't an accident, and other people heard.`,
    choices: [
      { label: "Call it out", effect: (c) => { if (Math.random() < 0.5) { changeStat(c, "happiness", 2, "Standing up for yourself"); c.integration = clamp((c.integration ?? 40) + 3); } else { changeStat(c, "happiness", -4, "It went badly"); } }, resultText: () => "Your heart was going like a drum." },
      { label: "Let it go", effect: (c) => { changeStat(c, "happiness", -3, "Swallowing it"); }, resultText: () => "You walked away. It stayed with you for weeks." },
      { label: "Talk to a friend", effect: (c) => { changeStat(c, "happiness", 1, "Someone had your back"); const f = c.relationships.find((r) => r.type === "friend" && r.alive); if (f) f.level = clamp(f.level + 5); }, resultText: () => "It helped to say it out loud to someone who understood." },
    ],
  },
  {
    id: "kind-local",
    minAge: 8,
    maxAge: 90,
    weight: 2,
    condition: (c) => abroad(c),
    autoEffect: (c) => { const p = addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-8, 10), 8, 85), level: randomInt(45, 65) }); changeStat(c, "happiness", 3, `${p.name.split(" ")[0]} made you feel welcome`); c.integration = clamp((c.integration ?? 40) + 4); },
    text: (c) => `A local in ${cityOf(c).name} went out of their way to help you with something small. It turned into a friendship.`,
  },
  {
    id: "homesick-festival",
    minAge: 8,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => abroad(c),
    autoEffect: (c) => { changeStat(c, "happiness", -3, `Missing ${homeLabel(c)}`); },
    text: (c) => `It's the big holiday back in ${homeLabel(c)}. Here it's just a Tuesday. You ate alone and looked at photos of everyone at home.`,
  },
  {
    id: "family-asks-money",
    minAge: 18,
    maxAge: 80,
    weight: 2,
    condition: (c) => abroad(c) && !!parent(c) && c.money > 3000,
    text: (c) => `${parent(c)!.name.split(" ")[0]} calls from ${homeLabel(c)}. Things are tight, and they'd never ask directly, but the hint is clear.`,
    choices: [
      { label: "Send a generous amount", effect: (c) => { sendMoneyHome(c, Math.round(1500 * livingIndex(c.birthRegion) + 800)); }, resultText: () => "You sent it the same day." },
      { label: "Send a little", effect: (c) => { sendMoneyHome(c, Math.round(500 * livingIndex(c.birthRegion) + 200)); }, resultText: () => "Every bit helps." },
      { label: "Explain that money's tight for you too", effect: (c) => { const p = parent(c); if (p) p.level = clamp(p.level - 4); changeStat(c, "happiness", -2, "Guilt"); }, resultText: () => "They said they understood. The line was quiet for a moment." },
    ],
  },
  {
    id: "visa-renewal-scare",
    minAge: 18,
    maxAge: 90,
    weight: 4,
    condition: (c) => abroad(c) && !!c.immigration && c.immigration.status !== "permanent" && c.immigration.status !== "overstay" && c.immigration.expires !== undefined && c.immigration.expires - c.age <= 1,
    text: (c) => `Your ${statusLabel(c.immigration!.status).toLowerCase()} runs out soon. The forms are a maze, and a wrong box could cost you your right to stay.`,
    choices: [
      { label: "Hire an immigration lawyer", effect: (c) => { const fee = Math.round(1800 * livingIndex(c.originRegion)); c.money -= fee; if (c.immigration && c.immigration.expires !== undefined && Math.random() < 0.85) { c.immigration.expires += 2; c.yearLog.push("The lawyer sorted it out - you have two more years."); } else changeStat(c, "happiness", -3, "Paperwork trouble"); }, resultText: () => "Expensive, but you slept better." },
      { label: "Do the paperwork yourself", effect: (c) => { const ok = Math.random() < 0.45 + (c.stats.smarts - 50) / 200; if (ok && c.immigration && c.immigration.expires !== undefined) { c.immigration.expires += 1; changeStat(c, "smarts", 1, "Navigating bureaucracy"); } else changeStat(c, "happiness", -4, "A bureaucratic mess"); }, resultText: () => "Three offices, two queues and one very unhelpful form." },
    ],
  },
  {
    id: "recruiter-abroad",
    minAge: 23,
    maxAge: 50,
    once: true,
    weight: 1.2,
    condition: (c) => !isAbroad(c) && !!c.job && (c.hasCollegeDegree || (c.degrees ?? []).length > 0) && !c.visaApp && !c.higher && !c.inJail,
    text: () => "A recruiter has found your profile. A company overseas is looking for someone with your background and would sponsor a work visa.",
    choices: [
      { label: "Hear them out", effect: (c) => { const options = (Object.keys(COUNTRIES) as RegionKey[]).filter((r) => r !== c.originRegion && COUNTRIES[r].open >= 0.5); const pick = options[randomInt(0, options.length - 1)]; const chk = routeCheck(c, pick, "work"); if (chk.ok && pick) { apply(c, pick, "work"); c.yearLog.push(`The company is in ${getRegion(pick).label}.`); } else c.yearLog.push(`The role was in ${getRegion(pick).label}, but you didn't quite meet the visa requirements.`); }, resultText: () => "You spent an evening researching what it would take." },
      { label: "Politely decline", effect: (c) => { changeStat(c, "happiness", 1, "Knowing what you want"); }, resultText: () => "You're happy where you are." },
    ],
  },
  {
    id: "family-emigrates",
    minAge: 6,
    maxAge: 16,
    once: true,
    weight: 0.35,
    condition: (c) => !isAbroad(c) && !!parent(c) && !c.higher && c.residence?.housing === "family",
    text: () => "Your parents sit you down. They've been offered a chance to start over in another country. The whole family is going.",
    choices: [
      { label: "Get excited", effect: (c) => { familyEmigrate(c); changeStat(c, "happiness", 2, "A big adventure"); }, resultText: (c) => `Suitcases, goodbyes and one very long flight. Welcome to ${cityOf(c).name}.` },
      { label: "Feel devastated", effect: (c) => { familyEmigrate(c); changeStat(c, "happiness", -8, "Leaving everything you know"); }, resultText: (c) => `You cried at the airport. Your new home is ${cityOf(c).name}, ${here(c)}.` },
    ],
  },
  {
    id: "retire-back-home",
    minAge: 60,
    maxAge: 85,
    once: true,
    weight: 3,
    condition: (c) => abroad(c) && (c.abroadYears ?? 0) >= 8,
    text: (c) => `After all these years in ${here(c)}, you keep thinking about ${homeLabel(c)}: the food, the people, the sound of it.`,
    choices: [
      { label: "Go home for good", effect: (c) => { ensureAbroad(c); changeStat(c, "happiness", 4, "Going home"); c.flags = [...(c.flags ?? []), "wants-to-return"]; c.yearLog.push("You decided it's time to go back. Open Across Borders to make the move."); }, resultText: () => "You started sorting your things into 'take' and 'let go'." },
      { label: "Stay where you've built a life", effect: (c) => { changeStat(c, "happiness", 2, "Peace with your choice"); }, resultText: () => "Home is wherever your people are now." },
    ],
  },
  {
    id: "expat-community",
    minAge: 10,
    maxAge: 90,
    weight: 1.5,
    condition: (c) => abroad(c) && (c.immigration?.years ?? 0) >= 1,
    autoEffect: (c) => { changeStat(c, "happiness", 3, "Your own community"); c.integration = clamp((c.integration ?? 40) + 3); },
    text: (c) => `You found the ${homeLabel(c)} community in ${cityOf(c).name}: a market, a place of worship, a football team, and people who answer 'where are you from?' the same way you do.`,
  },
  {
    id: "passport-pride",
    minAge: 12,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => (c.citizenships ?? []).length >= 2,
    autoEffect: (c) => { changeStat(c, "happiness", 2, "Two passports"); },
    text: () => "You breezed through the special queue at the airport and realised, again, how lucky it is to hold two passports.",
  },
];
