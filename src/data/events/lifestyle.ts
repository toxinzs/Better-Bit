import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { addPerson } from "../../engine/people";
import { livingIndex, inflation } from "../../engine/where";
import { getRegion } from "../regions";
import { setDiet, setRoutine, checkup } from "../../engine/body";
import { addictionOf, hooked, isHooked, quit, use } from "../../engine/addiction";
import { activeHobbies } from "../../engine/hobbies";
import { hobbyDef, HOBBIES } from "../hobbies";

// Body, habits, hobbies and the mind: what comes up when you look after (or
// don't look after) yourself.

const s = (c: Character) => livingIndex(c.originRegion) * inflation(c);
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const parent = (c: Character) => c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father"));
const friend = (c: Character) => c.relationships.find((r) => r.alive && r.type === "friend");
const heavy = (c: Character) => (c.bmi ?? 23) >= 30;
const hasHobby = (c: Character) => activeHobbies(c).length > 0;
const anyHobby = (c: Character) => { const a = activeHobbies(c); return a.length ? hobbyDef(a[randomInt(0, a.length - 1)]) : undefined; };
const drinkAge = (c: Character) => getRegion(c.originRegion).legalAges.drinking;
const smokeAge = (c: Character) => getRegion(c.originRegion).legalAges.smoking;

export const BODY_EVENTS: LifeEvent[] = [
  { id: "new-year-resolution", minAge: 15, maxAge: 70, weight: 1.8, text: () => "It's January and everyone's making resolutions. Yours is to finally sort yourself out.",
    choices: [
      { label: "Join a gym", effect: (c) => { if (c.money > 300 * s(c)) setRoutine(c, "regular"); changeStat(c, "happiness", 2, "A fresh start"); }, resultText: () => "You paid the joining fee and bought new trainers." },
      { label: "Eat properly", effect: (c) => { setDiet(c, "healthy"); }, resultText: () => "The fridge is full of vegetables. For now." },
      { label: "Not this year", effect: () => {}, resultText: () => "Maybe in February." },
    ] },
  { id: "fad-diet", minAge: 16, maxAge: 60, weight: 1.2, text: () => "Everyone online is raving about an extreme new diet.",
    choices: [
      { label: "Give it a go", effect: (c) => { if (c.bmi !== undefined) c.bmi = clamp(c.bmi - 1.2, 14, 46); changeStat(c, "health", -2, "A crash diet"); changeStat(c, "happiness", -2, "Hunger"); }, resultText: () => "You lost a few kilos and most of your sense of humour." },
      { label: "Ignore the hype", effect: (c) => { changeStat(c, "smarts", 1, "Common sense"); }, resultText: () => "If it sounds too good..." },
    ] },
  { id: "doctor-weight-warning", minAge: 25, maxAge: 80, weight: 3, condition: (c) => heavy(c), text: () => "Your doctor is blunt: your weight is putting your health at real risk, and it's not going to fix itself.",
    choices: [
      { label: "Change how you live", effect: (c) => { setDiet(c, "healthy"); if (c.money > 300 * s(c)) setRoutine(c, "regular"); else setRoutine(c, "light"); }, resultText: () => "You wrote it all down: meals, walks and a date to see them again." },
      { label: "Brush it off", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 3); }, resultText: () => "You know they're right. You changed the subject." },
    ] },
  { id: "food-poisoning", minAge: 5, maxAge: 90, weight: 0.9, autoEffect: (c) => { changeStat(c, "health", -4, "Food poisoning"); c.stress = clamp((c.stress ?? 25) + 2); }, text: () => "Something you ate disagreed with you badly. Two miserable days later, you're back to normal." },
  { id: "growth-spurt", minAge: 11, maxAge: 16, weight: 1.6, once: true, autoEffect: (c) => { changeStat(c, "looks", randomInt(0, 3), "A growth spurt"); c.fitness = clamp((c.fitness ?? 50) + 3); }, text: () => "You shot up over the summer. Nothing fits, and everyone has an opinion about it." },
  { id: "body-image", minAge: 12, maxAge: 22, weight: 1.6, text: () => "You've been comparing yourself with people online, and it's starting to weigh on you.",
    choices: [
      { label: "Talk to someone", effect: (c) => { const p = parent(c) ?? friend(c); if (p) p.level = clamp(p.level + 4); changeStat(c, "happiness", 2, "Being honest"); c.sanity = clamp((c.sanity ?? 75) + 1); }, resultText: () => "They said the kindest thing, and it helped more than you expected." },
      { label: "Keep scrolling", effect: (c) => { changeStat(c, "happiness", -4, "Comparison"); c.sanity = clamp((c.sanity ?? 75) - 1); }, resultText: () => "The more you looked, the worse it felt." },
      { label: "Delete the apps for a while", effect: (c) => { changeStat(c, "happiness", 2, "A break from screens"); const a = addictionOf(c, "screen"); if (a) a.level = Math.max(0, a.level - 8); }, resultText: () => "The silence was strange, then lovely." },
    ] },
  { id: "sleep-trouble", minAge: 18, maxAge: 75, weight: 1.6, condition: (c) => (c.stress ?? 0) > 55, text: () => "You haven't slept properly in weeks. The ceiling has become very familiar.",
    choices: [
      { label: "Fix your sleep habits", effect: (c) => { c.stress = clamp((c.stress ?? 25) - 6); changeStat(c, "health", 1, "Sleeping better"); }, resultText: () => "No screens, no coffee after noon, a regular bedtime. It worked." },
      { label: "Ask for sleeping pills", effect: (c) => { use(c, "drugs", true); c.stress = clamp((c.stress ?? 25) - 8); }, resultText: () => "Sleep came quickly. You noticed how much you liked that." },
      { label: "Power through", effect: (c) => { changeStat(c, "health", -2, "No sleep"); changeStat(c, "happiness", -2, "No sleep"); }, resultText: () => "Coffee held you upright." },
    ] },
  { id: "midlife-health-scare", minAge: 38, maxAge: 60, weight: 1.8, condition: (c) => (c.fitness ?? 50) < 35, text: () => "You got out of breath climbing a flight of stairs and it frightened you.",
    choices: [
      { label: "Book a check-up and start moving", effect: (c) => { checkup(c); setRoutine(c, "light"); }, resultText: () => "The doctor's advice was simple: move more, eat better, come back in six months." },
      { label: "It's nothing", effect: (c) => { changeStat(c, "health", -2, "Ignoring the signs"); }, resultText: () => "You took the lift after that." },
    ] },
  { id: "personal-trainer", minAge: 20, maxAge: 60, weight: 1.1, condition: (c) => c.money > 3000 * s(c), text: () => "A trainer at your gym offers a discounted programme.",
    choices: [
      { label: "Sign up", sublabel: "", effect: (c) => { c.money -= Math.round(900 * s(c)); setRoutine(c, "intense"); changeStat(c, "happiness", 2, "Feeling strong"); }, resultText: () => "Six weeks in, you can see it." },
      { label: "No thanks", effect: () => {}, resultText: () => "You'll keep going on your own." },
    ] },
  { id: "free-screening", minAge: 40, maxAge: 80, weight: 1.4, once: true, autoEffect: (c) => { checkup(c); }, text: () => "You got a letter inviting you to a free health screening, and for once you actually went." },
  { id: "healthy-cooking-glow", minAge: 16, maxAge: 80, weight: 1.2, condition: (c) => c.diet === "healthy" || c.diet === "strict", autoEffect: (c) => { changeStat(c, "happiness", 2, "Feeling good"); changeStat(c, "looks", 1, "A clear complexion"); }, text: () => "You've been eating well for a while now, and it's showing in your skin, your energy and your mood." },
  { id: "weight-milestone", minAge: 18, maxAge: 80, weight: 1.5, condition: (c) => (c.bmi ?? 23) < 25 && c.routine !== "none" && c.diet !== "junk", autoEffect: (c) => { changeStat(c, "happiness", 3, "Reaching your goal"); changeStat(c, "looks", 1, "Looking good"); }, text: () => "You stepped on the scales and saw a number you've been chasing for years." },
  { id: "kid-sports-day", minAge: 6, maxAge: 12, weight: 1.6, text: () => "It's sports day, and the whole school is out on the field.",
    choices: [
      { label: "Race with everything you've got", effect: (c) => { const win = Math.random() < 0.25 + ((c.talents?.athletic ?? 50) - 40) / 200; changeStat(c, "happiness", win ? 6 : 1, win ? "Winning" : "Trying hard"); c.fitness = clamp((c.fitness ?? 50) + 2); }, resultText: (c) => (c.stats.happiness > 0 ? "You crossed the line gasping and laughing." : "") },
      { label: "Cheer from the side", effect: (c) => { changeStat(c, "happiness", 2, "Cheering friends"); }, resultText: () => "You were the loudest one there." },
    ] },
];

export const ADDICTION_EVENTS: LifeEvent[] = [
  { id: "offered-cigarette", minAge: 12, maxAge: 30, weight: 1.6, condition: (c) => !addictionOf(c, "nicotine")?.level, text: () => "Someone you want to impress offers you a cigarette behind the building.",
    choices: [
      { label: "Try it", effect: (c) => { use(c, "nicotine", true); changeStat(c, "health", -1, "Smoking"); }, resultText: () => "You coughed until your eyes watered. They laughed, and so did you." },
      { label: "Say no", effect: (c) => { changeStat(c, "smarts", 1, "Saying no"); }, resultText: () => "Nobody minded as much as you feared." },
    ] },
  { id: "teen-party-drinks", minAge: 14, maxAge: 20, weight: 1.6, condition: (c) => c.age < drinkAge(c), text: () => "There's alcohol at the party, and everyone's passing it around.",
    choices: [
      { label: "Have a few", effect: (c) => { changeStat(c, "happiness", 3, "A party"); changeStat(c, "health", -1, "Underage drinking"); const p = parent(c); if (p && Math.random() < 0.3) { p.level = clamp(p.level - 6); c.yearLog.push("Your parents found out."); } if (Math.random() < 0.15) { const a = addictionOf(c, "alcohol"); if (a) a.level = clamp(a.level + 6); else (c.addictions ??= []).push({ key: "alcohol", level: 6, since: c.age }); } }, resultText: () => "You woke up with a pounding head and a lot of questions." },
      { label: "Stick to soft drinks", effect: (c) => { changeStat(c, "smarts", 1, "Good judgement"); }, resultText: () => "You got a lift home from someone who'd had a lot more." },
      { label: "Leave early", effect: (c) => { c.conduct = clamp((c.conduct ?? 80) + 2); }, resultText: () => "Nobody noticed you'd gone." },
    ] },
  { id: "drug-offer", minAge: 16, maxAge: 32, weight: 1.3, text: () => "At a party, someone offers you something in a small bag. \"Come on. Everyone's doing it.\"",
    choices: [
      { label: "Try it", tone: "danger", effect: (c) => { use(c, "drugs", true); }, resultText: () => "For a few hours everything was brilliant. Then it wasn't." },
      { label: "Say no and leave", effect: (c) => { changeStat(c, "smarts", 1, "Staying sensible"); }, resultText: () => "You got some looks. You also got home safely." },
    ] },
  { id: "gambling-streak", minAge: 18, maxAge: 75, weight: 1.3, condition: (c) => c.money > 500 * s(c), text: () => "A friend shows you how much they won last night on a betting app. It looks so easy.",
    choices: [
      { label: "Have a flutter", effect: (c) => { use(c, "gambling", true); }, resultText: () => "The first bet felt like magic." },
      { label: "Walk away", effect: (c) => { changeStat(c, "smarts", 1, "Knowing the odds"); }, resultText: () => "The house always wins." },
    ] },
  { id: "friend-worried", minAge: 16, maxAge: 80, weight: 4, condition: (c) => hooked(c).length > 0 && !!friend(c), text: () => "A friend takes you aside. \"I'm worried about you,\" they say. \"This isn't like you.\"",
    choices: [
      { label: "Listen, and try to change", effect: (c) => { const h = hooked(c)[0]; if (h) quit(c, h.key, "group"); const f = friend(c); if (f) f.level = clamp(f.level + 5); }, resultText: () => "It was the hardest conversation you'd had in years." },
      { label: "Get defensive", effect: (c) => { const f = friend(c); if (f) f.level = clamp(f.level - 10); changeStat(c, "happiness", -3, "Pushing people away"); }, resultText: () => "You said things you didn't mean. They left." },
    ] },
  { id: "family-intervention", minAge: 18, maxAge: 80, weight: 5, condition: (c) => hooked(c).some((a) => a.level >= 50) && !!parent(c), text: () => "Your family are waiting when you get home. They've booked you into a clinic. \"Please,\" your mother says.",
    choices: [
      { label: "Accept help", effect: (c) => { const h = hooked(c).find((a) => a.level >= 50); if (h) quit(c, h.key, "group"); const p = parent(c); if (p) p.level = clamp(p.level + 8); }, resultText: () => "You cried. So did they." },
      { label: "Storm out", tone: "danger", effect: (c) => { const p = parent(c); if (p) p.level = clamp(p.level - 12); changeStat(c, "happiness", -4, "Cutting family off"); }, resultText: () => "The door slam echoed for a long time." },
    ] },
  { id: "dui-scare", minAge: 18, maxAge: 80, weight: 3, condition: (c) => isHooked(c, "alcohol") && !!c.car, text: () => "You got in the car after drinking, and flashing lights appear in the mirror.",
    choices: [
      { label: "Pull over and accept it", effect: (c) => { c.money = Math.max(0, c.money - Math.round(2000 * s(c))); c.criminalRecord = true; c.recordCleanYears = 0; changeStat(c, "happiness", -8, "A drink-driving charge"); }, resultText: () => "A fine, a ban and a record." },
      { label: "Get lucky", effect: (c) => { changeStat(c, "happiness", -2, "A close call"); c.stress = clamp((c.stress ?? 25) + 8); }, resultText: () => "You were waved on. Your hands shook for an hour." },
    ] },
  { id: "hungover-at-work", minAge: 20, maxAge: 65, weight: 3, condition: (c) => isHooked(c, "alcohol") && !!c.job, text: () => "You wake up shaking, late, and in no state to face a meeting.",
    choices: [
      { label: "Call in sick", effect: (c) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) - 3); }, resultText: () => "Your manager's voice said everything." },
      { label: "Drag yourself in", effect: (c) => { if (c.job) c.job.perf = clamp((c.job.perf ?? 55) - 6); changeStat(c, "health", -1, "Bad mornings"); }, resultText: () => "You made it through the day in a fog." },
    ] },
  { id: "clean-anniversary", minAge: 16, maxAge: 90, weight: 4, condition: (c) => (c.addictions ?? []).some((a) => a.quitting && (a.clean ?? 0) >= 1), autoEffect: (c) => { changeStat(c, "happiness", 5, "A year clean"); }, text: () => "Another year clear. You marked it quietly, and it meant more than any birthday." },
  { id: "smokers-cough", minAge: 30, maxAge: 85, weight: 3, condition: (c) => isHooked(c, "nicotine"), text: () => "A cough that won't go away has you worried.",
    choices: [
      { label: "Quit for good", effect: (c) => { quit(c, "nicotine", "group"); }, resultText: () => "You threw the packet away, and then bought a nicotine patch." },
      { label: "Ignore it", effect: (c) => { changeStat(c, "health", -3, "The cough"); }, resultText: () => "It's just a cough." },
    ] },
  { id: "screen-time-fight", minAge: 9, maxAge: 19, weight: 3, condition: (c) => isHooked(c, "screen") && !!parent(c), text: () => "Your parents have had enough of the phone at the dinner table, and they're taking it away.",
    choices: [
      { label: "Hand it over", effect: (c) => { const a = addictionOf(c, "screen"); if (a) a.level = Math.max(0, a.level - 15); changeStat(c, "happiness", -2, "No phone"); }, resultText: () => "The first two days were hell. The third was fine." },
      { label: "Scream and slam the door", effect: (c) => { const p = parent(c); if (p) p.level = clamp(p.level - 6); c.conduct = clamp((c.conduct ?? 80) - 4); }, resultText: () => "You went to bed furious, phone in hand." },
    ] },
  { id: "gambling-debt", minAge: 20, maxAge: 80, weight: 3, condition: (c) => isHooked(c, "gambling") && c.money < 1000 * s(c), text: () => "The bets have caught up with you. You owe money you don't have.",
    choices: [
      { label: "Confess and get help", effect: (c) => { quit(c, "gambling", "group"); c.creditScore = clamp((c.creditScore ?? 650) - 20, 300, 850); }, resultText: () => "Saying it out loud was the first honest thing in months." },
      { label: "Chase the losses", tone: "danger", effect: (c) => { c.money -= Math.round(1500 * s(c)); changeStat(c, "happiness", -6, "Chasing losses"); }, resultText: () => "You bet the rent. You lost the rent." },
    ] },
  { id: "painkillers", minAge: 25, maxAge: 80, weight: 1.6, condition: (c) => (c.conditions ?? []).some((x) => ["injury", "back pain", "arthritis"].includes(x.key)), text: () => "The pain won't ease, and your doctor offers strong painkillers.",
    choices: [
      { label: "Take the pills", effect: (c) => { changeStat(c, "health", 2, "Pain relief"); use(c, "drugs", true); }, resultText: () => "The pain faded. So did some other things." },
      { label: "Try physiotherapy instead", effect: (c) => { c.money -= Math.round(600 * s(c)); changeStat(c, "health", 3, "Physio"); }, resultText: () => "Slower, and better for you." },
    ] },
  { id: "relapse-temptation", minAge: 16, maxAge: 90, weight: 3, condition: (c) => (c.addictions ?? []).some((a) => a.quitting && (a.clean ?? 0) <= 2), text: () => "A stressful week, an old friend, and the old habit calls.",
    choices: [
      { label: "Resist", tone: "good", effect: (c) => { changeStat(c, "happiness", 2, "Holding on"); }, resultText: () => "You called your sponsor instead." },
      { label: "Give in", tone: "danger", effect: (c) => { const a = (c.addictions ?? []).find((x) => x.quitting); if (a) { a.quitting = false; a.level = clamp(a.level + 15); } changeStat(c, "happiness", -5, "A relapse"); }, resultText: () => "Just once, you told yourself." },
    ] },
];

export const HOBBY_EVENTS: LifeEvent[] = [
  { id: "hobby-friend", minAge: 8, maxAge: 85, weight: 2, condition: hasHobby, autoEffect: (c) => { const h = anyHobby(c); const p = addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-6, 10), 8, 85), level: randomInt(45, 65) }); changeStat(c, "happiness", 2, `Meeting ${p.name.split(" ")[0]}`); c.yearLog.push(`You met ${p.name.split(" ")[0]} through ${h?.label.toLowerCase() ?? "your hobby"}.`); }, text: (c) => `A new face keeps turning up wherever you do ${anyHobby(c)?.label.toLowerCase() ?? "your hobby"}. You got talking.` },
  { id: "hobby-mentor", minAge: 10, maxAge: 85, weight: 1.4, once: true, condition: (c) => Object.values(c.hobbies ?? {}).some((h) => h.active && h.level >= 20 && h.level < 60), autoEffect: (c) => { const k = activeHobbies(c).find((x) => (c.hobbies![x].level >= 20)); if (k) c.hobbies![k].level = clamp(c.hobbies![k].level + 7); }, text: () => "Someone who's been doing it for thirty years took you aside and showed you what you were doing wrong." },
  { id: "hobby-kit-broke", minAge: 12, maxAge: 85, weight: 1.4, condition: hasHobby, text: (c) => `Your ${anyHobby(c)?.label.toLowerCase() ?? "hobby"} gear finally gave out.`,
    choices: [
      { label: "Replace it", effect: (c) => { c.money -= Math.round(220 * s(c)); }, resultText: () => "Better kit than before, at least." },
      { label: "Make do", effect: (c) => { changeStat(c, "happiness", -1, "Broken kit"); }, resultText: () => "You patched it with tape." },
    ] },
  { id: "hobby-burnout", minAge: 12, maxAge: 85, weight: 1.6, condition: (c) => Object.values(c.hobbies ?? {}).some((h) => h.active && h.level >= 50), text: () => "You've been at it for so long it's stopped being fun.",
    choices: [
      { label: "Take a break", effect: (c) => { c.stress = clamp((c.stress ?? 25) - 4); const k = activeHobbies(c)[0]; if (k) c.hobbies![k].level = clamp(c.hobbies![k].level - 3); }, resultText: () => "Two weeks off. You missed it more than you expected." },
      { label: "Push through", effect: (c) => { const k = activeHobbies(c)[0]; if (k) c.hobbies![k].level = clamp(c.hobbies![k].level + 4); c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "The grind paid off, a little." },
    ] },
  { id: "hobby-club", minAge: 10, maxAge: 85, weight: 1.5, condition: hasHobby, text: (c) => `A local ${anyHobby(c)?.label.toLowerCase() ?? "hobby"} club invites you to join.`,
    choices: [
      { label: "Join", effect: (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-8, 8), 10, 85), level: 55 }); c.network = clamp((c.network ?? 0) + 3); const k = activeHobbies(c)[0]; if (k) c.hobbies![k].level = clamp(c.hobbies![k].level + 3); changeStat(c, "happiness", 3, "Belonging"); }, resultText: () => "Thursday nights are now sacred." },
      { label: "Prefer to go it alone", effect: () => {}, resultText: () => "You like your own pace." },
    ] },
  { id: "hobby-viral", minAge: 14, maxAge: 70, weight: 1.1, condition: (c) => ["painting", "photography", "cooking", "guitar", "writing", "dancing"].some((k) => (c.hobbies?.[k]?.level ?? 0) >= 45 && c.hobbies?.[k]?.active), autoEffect: (c) => { c.money += Math.round(300 * s(c)); c.network = clamp((c.network ?? 0) + 4); changeStat(c, "happiness", 4, "Going viral"); }, text: () => "Something you made was shared by an account with a million followers. Your phone hasn't stopped buzzing." },
  { id: "new-interest", minAge: 10, maxAge: 80, weight: 1.6, condition: (c) => !hasHobby(c), text: () => "You've got time on your hands and a feeling that something's missing.",
    choices: [
      { label: "Try something new", effect: (c) => { const opts = HOBBIES.filter((h) => c.age >= h.minAge && h.cost < 400); const h = opts[randomInt(0, opts.length - 1)]; if (h) { (c.hobbies ??= {})[h.key] = { level: 4, since: c.age, active: true, done: [] }; c.yearLog.push(`You took up ${h.label.toLowerCase()}.`); } }, resultText: () => "You surprised yourself by sticking with it." },
      { label: "Nothing appeals", effect: () => {}, resultText: () => "Maybe next year." },
    ] },
  { id: "hobby-competition-invite", minAge: 10, maxAge: 70, weight: 1.3, condition: (c) => Object.values(c.hobbies ?? {}).some((h) => h.active && h.level >= 35), text: () => "You've been asked to take part in a local competition.",
    choices: [
      { label: "Enter", effect: (c) => { const k = activeHobbies(c).find((x) => c.hobbies![x].level >= 35); if (k) { const win = Math.random() < 0.4; c.hobbies![k].level = clamp(c.hobbies![k].level + (win ? 4 : 2)); changeStat(c, "happiness", win ? 5 : 1, win ? "Winning" : "Taking part"); c.yearLog.push(win ? "You won!" : "You didn't win, but you were in the mix."); } }, resultText: () => "The nerves were half the fun." },
      { label: "Decline", effect: () => {}, resultText: () => "Not this time." },
    ] },
  { id: "kid-talent-spotted", minAge: 6, maxAge: 14, weight: 1.4, condition: hasHobby, autoEffect: (c) => { const k = activeHobbies(c)[0]; if (k) c.hobbies![k].level = clamp(c.hobbies![k].level + 5); changeStat(c, "happiness", 3, "Being noticed"); }, text: () => "A teacher noticed how much effort you put into your hobby, and told your parents you had real promise." },
];

export const MIND_EVENTS: LifeEvent[] = [
  { id: "meditation-retreat", minAge: 20, maxAge: 75, weight: 1.1, condition: (c) => (c.stress ?? 0) > 50 && c.money > 1000 * s(c), text: () => "A friend suggests a week-long silent retreat in the mountains.",
    choices: [
      { label: "Go", effect: (c) => { c.money -= Math.round(700 * s(c)); c.stress = clamp((c.stress ?? 25) - 25); c.sanity = clamp((c.sanity ?? 75) + 4); c.meditating = true; changeStat(c, "happiness", 5, "A week of quiet"); }, resultText: () => "Seven days without a phone. You came back changed." },
      { label: "Too much of a stretch", effect: () => {}, resultText: () => "Maybe someday." },
    ] },
  { id: "faith-question", minAge: 16, maxAge: 80, weight: 1.4, condition: (c) => !!c.faith && c.faith !== "none" && !!c.practising, text: () => "A hard year has left you questioning what you believe.",
    choices: [
      { label: "Lean into your community", effect: (c) => { changeStat(c, "happiness", 3, "Held up by others"); c.stress = clamp((c.stress ?? 25) - 4); }, resultText: () => "They showed up, every one of them." },
      { label: "Step back and think", effect: (c) => { c.practising = false; changeStat(c, "smarts", 1, "Reflection"); }, resultText: () => "You took a long time and a lot of walks." },
    ] },
  { id: "charity-run", minAge: 14, maxAge: 70, weight: 1.3, text: () => "A friend asks you to join a charity fun run at the weekend.",
    choices: [
      { label: "Sign up", effect: (c) => { c.fitness = clamp((c.fitness ?? 50) + 3); changeStat(c, "happiness", 4, "Doing good"); c.network = clamp((c.network ?? 0) + 2); }, resultText: () => "You walked half of it and it didn't matter." },
      { label: "Sponsor them instead", effect: (c) => { if (c.age >= 18) c.money -= Math.round(30 * s(c)); changeStat(c, "happiness", 1, "Supporting a friend"); }, resultText: () => "A small donation, gladly given." },
    ] },
  { id: "lonely-reach-out", minAge: 18, maxAge: 90, weight: 2.5, condition: (c) => c.relationships.filter((r) => r.alive && r.type === "friend" && r.level >= 40).length === 0, text: () => "You realise when you last had a proper conversation with a friend, and it's been far too long.",
    choices: [
      { label: "Send a message", effect: (c) => { const f = c.relationships.find((r) => r.alive && (r.type === "friend" || r.type === "sibling")); if (f) f.level = clamp(f.level + 12); changeStat(c, "happiness", 4, "Reaching out"); }, resultText: () => "The reply came in a minute. \"I was literally about to text you.\"" },
      { label: "Put it off", effect: (c) => { changeStat(c, "happiness", -2, "Loneliness"); }, resultText: () => "Tomorrow." },
    ] },
  { id: "midlife-crisis", minAge: 40, maxAge: 55, weight: 1.6, once: true, text: () => "You wake up one morning, look at your life and wonder how you got here.",
    choices: [
      { label: "Treat yourself to something big", effect: (c) => { c.money -= Math.round(6000 * s(c)); changeStat(c, "happiness", 7, "A big treat"); }, resultText: () => "It was fun and it was expensive." },
      { label: "Take up something completely new", effect: (c) => { const opts = HOBBIES.filter((h) => c.age >= h.minAge && h.cost < 600); const h = opts[randomInt(0, opts.length - 1)]; if (h) (c.hobbies ??= {})[h.key] = { level: 4, since: c.age, active: true, done: [] }; changeStat(c, "happiness", 4, "A new chapter"); }, resultText: () => "You surprised everyone, mostly yourself." },
      { label: "Ride it out", effect: (c) => { changeStat(c, "happiness", -3, "A wobble"); }, resultText: () => "It passed, like it always does." },
    ] },
  { id: "gratitude-moment", minAge: 12, maxAge: 95, weight: 1.6, autoEffect: (c) => { changeStat(c, "happiness", 3, "A moment of gratitude"); c.sanity = clamp((c.sanity ?? 75) + 1); }, text: () => "You caught yourself on an ordinary afternoon realising that, right now, you have everything you need." },
  { id: "panic-attack", minAge: 14, maxAge: 80, weight: 1.6, condition: (c) => (c.stress ?? 0) > 65, text: () => "Your chest tightens, your hands go numb and the room starts to spin.",
    choices: [
      { label: "Ride it out, breathing slowly", effect: (c) => { c.sanity = clamp((c.sanity ?? 75) + 1); changeStat(c, "happiness", -2, "A panic attack"); }, resultText: () => "It passed. You sat very still for a long time." },
      { label: "See someone about it", effect: (c) => { c.money -= Math.round(150 * s(c)); c.stress = clamp((c.stress ?? 25) - 8); }, resultText: () => "They gave it a name, and a plan." },
    ] },
  { id: "news-anxiety", minAge: 16, maxAge: 85, weight: 1.2, condition: (c) => (addictionOf(c, "screen")?.level ?? 0) >= 15, autoEffect: (c) => { c.stress = clamp((c.stress ?? 25) + 6); changeStat(c, "happiness", -2, "Doomscrolling"); }, text: () => "You've spent weeks glued to the news, and the world feels like it's on fire." },
  { id: "old-journal", minAge: 20, maxAge: 90, weight: 1, autoEffect: (c) => { changeStat(c, "happiness", 2, "Looking back"); c.sanity = clamp((c.sanity ?? 75) + 1); }, text: () => "You found an old journal in a drawer and spent an evening reading your younger self. You were braver than you remember." },
  { id: "random-kindness", minAge: 8, maxAge: 95, weight: 1.6, autoEffect: (c) => { changeStat(c, "happiness", 3, "A kindness"); }, text: () => "A stranger paid for your coffee and walked off before you could say thank you. It changed your whole day." },
];
