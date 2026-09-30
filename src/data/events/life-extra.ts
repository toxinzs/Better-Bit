import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { addPerson } from "../../engine/people";
import { livingIndex, inflation } from "../../engine/where";
import { partner, children, sibling } from "./helpers";
import { activeHobbies } from "../../engine/hobbies";
import { hobbyDef } from "../hobbies";

// Family beyond the front door, the community around you, and the years when
// life slows down.

const s = (c: Character) => livingIndex(c.originRegion) * inflation(c);
const parentOf = (c: Character) => c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father"));
const friendOf = (c: Character) => c.relationships.find((r) => r.alive && r.type === "friend");
const married = (c: Character) => !!partner(c)?.married;
const pfirst = (c: Character) => partner(c)?.name.split(" ")[0] ?? "your partner";

export const FAMILY_EXTRA_EVENTS: LifeEvent[] = [
  { id: "in-laws-visit", minAge: 22, maxAge: 80, weight: 1.6, condition: married, text: (c) => `${pfirst(c)}'s parents are coming to stay for a week. The spare room has never been so clean.`,
    choices: [
      { label: "Be the perfect host", effect: (c) => { const p = partner(c); if (p) p.level = clamp(p.level + 4); c.stress = clamp((c.stress ?? 25) + 5); c.money -= Math.round(120 * s(c)); }, resultText: () => "By Thursday you were all laughing at the same jokes." },
      { label: "Just be yourself", effect: (c) => { const p = partner(c); if (p) p.level = clamp(p.level + (Math.random() < 0.5 ? 2 : -3)); }, resultText: () => "Mostly fine. A comment about your cooking was made." },
    ] },
  { id: "in-law-clash", minAge: 24, maxAge: 75, weight: 1.4, condition: married, text: (c) => `Your mother-in-law has opinions about how you and ${pfirst(c)} run your home, and she's sharing them.`,
    choices: [
      { label: "Ask your partner to talk to her", effect: (c) => { const p = partner(c); if (p) p.level = clamp(p.level - 3); }, resultText: () => "It's never a fun conversation to start." },
      { label: "Smile and nod", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "Your jaw hurts from smiling." },
      { label: "Politely set a boundary", effect: (c) => { changeStat(c, "happiness", 3, "Standing your ground"); const p = partner(c); if (p) p.level = clamp(p.level + (Math.random() < 0.6 ? 2 : -2)); }, resultText: () => "You said it kindly, and firmly." },
    ] },
  { id: "family-reunion", minAge: 12, maxAge: 90, weight: 1.6, text: () => "The extended family is getting together for the first time in years. Aunts, uncles, cousins you barely remember.",
    choices: [
      { label: "Go and enjoy it", effect: (c) => { changeStat(c, "happiness", 5, "Family"); const p = parentOf(c); if (p) p.level = clamp(p.level + 4); c.money -= Math.round(60 * s(c)); }, resultText: () => "Three generations, one very long table." },
      { label: "Make an excuse", effect: (c) => { const p = parentOf(c); if (p) p.level = clamp(p.level - 3); }, resultText: () => "You sent a card." },
    ] },
  { id: "cousin-wedding", minAge: 14, maxAge: 80, weight: 1.3, text: () => "A cousin is getting married and you've been invited.",
    choices: [
      { label: "Go, and dance all night", effect: (c) => { c.money -= Math.round(150 * s(c)); changeStat(c, "happiness", 5, "A wedding"); }, resultText: () => "The speeches made you cry, the dancing made your feet cry." },
      { label: "Send a gift and your apologies", effect: (c) => { c.money -= Math.round(60 * s(c)); }, resultText: () => "They understood." },
    ] },
  { id: "cousin-needs-help", minAge: 20, maxAge: 80, weight: 1.2, condition: (c) => c.money > 1500 * s(c), text: () => "A cousin you haven't heard from in a while calls: they're in trouble and need money.",
    choices: [
      { label: "Help them out", effect: (c) => { c.money -= Math.round(800 * s(c)); changeStat(c, "happiness", 2, "Being family"); }, resultText: () => "They swore they'd pay you back." },
      { label: "Say you can't", effect: (c) => { changeStat(c, "happiness", -1, "Guilt"); }, resultText: () => "It wasn't an easy call to end." },
    ] },
  { id: "sibling-rivalry-adult", minAge: 22, maxAge: 70, weight: 1.3, condition: (c) => !!sibling(c), text: () => "Your sibling is doing very well, and somehow every family occasion has become a comparison.",
    choices: [
      { label: "Be happy for them", effect: (c) => { const sb = sibling(c); if (sb) sb.level = clamp(sb.level + 5); changeStat(c, "happiness", 2, "Generosity"); }, resultText: () => "It cost you something to say it, and you meant it." },
      { label: "Quietly resent it", effect: (c) => { const sb = sibling(c); if (sb) sb.level = clamp(sb.level - 4); changeStat(c, "happiness", -2, "Resentment"); }, resultText: () => "You smiled at dinner. You seethed in the car." },
    ] },
  { id: "parent-moves-in", minAge: 35, maxAge: 70, weight: 1.3, condition: (c) => { const p = parentOf(c); return !!p && (p.health ?? 80) < 70; }, text: () => "Your parent's health is failing and living alone isn't safe any more. They could move in with you.",
    choices: [
      { label: "Welcome them in", effect: (c) => { const p = parentOf(c); if (p) { p.level = clamp(p.level + 10); p.health = clamp((p.health ?? 60) + 5); } c.stress = clamp((c.stress ?? 25) + 8); c.money -= Math.round(600 * s(c)); }, resultText: () => "The house is fuller, and so are you." },
      { label: "Help them find good care", effect: (c) => { const p = parentOf(c); if (p) p.level = clamp(p.level + 3); c.money -= Math.round(2200 * s(c)); }, resultText: () => "Somewhere kind, with a garden." },
    ] },
  { id: "sick-parent-care", minAge: 30, maxAge: 75, weight: 1.6, condition: (c) => { const p = parentOf(c); return !!p && (p.conditions ?? []).length > 0; }, text: (c) => `${parentOf(c)?.name.split(" ")[0] ?? "Your parent"} needs a lot of help with appointments, shopping and just being there.`,
    choices: [
      { label: "Take it on yourself", effect: (c) => { const p = parentOf(c); if (p) p.level = clamp(p.level + 8); c.stress = clamp((c.stress ?? 25) + 10); changeStat(c, "happiness", -2, "Caring"); }, resultText: () => "You're exhausted, and you'd do it again." },
      { label: "Hire a carer", effect: (c) => { c.money -= Math.round(3000 * s(c)); const p = parentOf(c); if (p) p.level = clamp(p.level + 2); }, resultText: () => "Someone kind, and not cheap." },
    ] },
  { id: "family-feud", minAge: 25, maxAge: 85, weight: 0.8, text: () => "A family disagreement over an old debt has turned into a feud. Everyone wants you on their side.",
    choices: [
      { label: "Play peacemaker", effect: (c) => { changeStat(c, "happiness", -1, "Middle of a feud"); c.sanity = clamp((c.sanity ?? 75) - 1); const p = parentOf(c); if (p) p.level = clamp(p.level + 3); }, resultText: () => "You were thanked by no one and needed by everyone." },
      { label: "Stay out of it", effect: () => {}, resultText: () => "You kept your phone on silent for a month." },
    ] },
  { id: "family-holiday-tradition", minAge: 6, maxAge: 95, weight: 1.6, autoEffect: (c) => { changeStat(c, "happiness", 3, "A family tradition"); const p = parentOf(c); if (p) p.level = clamp(p.level + 3); }, text: () => "Every year it's the same: the same food, the same stories, the same chair. You wouldn't change any of it." },
  { id: "grandparent-stories", minAge: 5, maxAge: 16, weight: 1.6, condition: (c) => !!parentOf(c), autoEffect: (c) => { changeStat(c, "happiness", 2, "Family stories"); changeStat(c, "smarts", 1, "Hearing history"); }, text: () => "An older relative told you stories about when they were young, and the world they described sounded impossibly different." },
  { id: "baby-shower", minAge: 22, maxAge: 50, weight: 1.2, text: () => "A friend is having a baby, and you're helping to organise the shower.",
    choices: [
      { label: "Go all out", effect: (c) => { c.money -= Math.round(140 * s(c)); const f = friendOf(c); if (f) f.level = clamp(f.level + 6); changeStat(c, "happiness", 3, "A party for a friend"); }, resultText: () => "There was so much bunting." },
      { label: "Keep it simple", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 3); }, resultText: () => "Cake, tea and terrible baby-name suggestions." },
    ] },
  { id: "parent-remarries", minAge: 20, maxAge: 60, weight: 0.5, once: true, condition: (c) => !!parentOf(c), text: () => "Your parent announces they're getting remarried.",
    choices: [
      { label: "Celebrate with them", effect: (c) => { const p = parentOf(c); if (p) p.level = clamp(p.level + 6); addPerson(c, { type: "friend", age: randomInt(35, 60), level: 40 }); }, resultText: () => "You've gained a stepfamily, and a new person to argue with about holidays." },
      { label: "Struggle with it", effect: (c) => { const p = parentOf(c); if (p) p.level = clamp(p.level - 5); changeStat(c, "happiness", -3, "Mixed feelings"); }, resultText: () => "You wanted to be happier for them than you were." },
    ] },
  { id: "kids-recital", minAge: 25, maxAge: 60, weight: 1.6, condition: (c) => children(c).some((k) => k.alive), autoEffect: (c) => { changeStat(c, "happiness", 4, "Watching your child"); const k = children(c).find((x) => x.alive); if (k) k.level = clamp(k.level + 4); }, text: () => "You sat in a hot school hall and watched your child do something wonderful, slightly out of tune." },
];

export const COMMUNITY_EVENTS: LifeEvent[] = [
  { id: "block-party", minAge: 10, maxAge: 90, weight: 1.6, text: () => "The street is holding a block party. Someone's dragged a barbecue onto the road.",
    choices: [
      { label: "Bring a dish and mingle", effect: (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-10, 10), 10, 90), level: randomInt(35, 55) }); changeStat(c, "happiness", 3, "A good neighbourhood"); c.money -= Math.round(25 * s(c)); }, resultText: () => "You left with leftovers and three new phone numbers." },
      { label: "Wave from the window", effect: () => {}, resultText: () => "The music carried on until midnight." },
    ] },
  { id: "book-club", minAge: 20, maxAge: 90, weight: 1.2, text: () => "A colleague invites you to a book club. There's wine, and, occasionally, books.",
    choices: [
      { label: "Join", effect: (c) => { changeStat(c, "smarts", 1, "Reading"); addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-8, 12), 20, 90), level: 50 }); }, resultText: () => "You've read more this year than the last five." },
      { label: "No, thanks", effect: () => {}, resultText: () => "Your to-read pile said thank you." },
    ] },
  { id: "school-reunion", minAge: 28, maxAge: 60, weight: 1.4, once: true, text: () => "It's the school reunion. Everyone will be there, and everyone will have opinions about how everyone else turned out.",
    choices: [
      { label: "Go", effect: (c) => { changeStat(c, "happiness", c.stats.happiness > 55 ? 4 : -2, "Old faces"); const f = friendOf(c); if (f) f.level = clamp(f.level + 5); c.money -= Math.round(80 * s(c)); }, resultText: (c) => (c.stats.happiness > 55 ? "You spent the whole night laughing." : "Everyone seemed to be doing better than you.") },
      { label: "Skip it", effect: () => {}, resultText: () => "You looked at the photos online instead." },
    ] },
  { id: "godparent-asked", minAge: 25, maxAge: 65, weight: 1, once: true, text: () => "A close friend asks you to be their child's godparent.",
    choices: [
      { label: "Say yes, and mean it", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 12); changeStat(c, "happiness", 4, "Being trusted"); }, resultText: () => "You cried a little. So did they." },
      { label: "Decline gently", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 6); }, resultText: () => "It was an honour you didn't feel ready for." },
    ] },
  { id: "friend-in-crisis", minAge: 15, maxAge: 85, weight: 1.6, condition: (c) => !!friendOf(c), text: (c) => `${friendOf(c)?.name.split(" ")[0] ?? "A friend"} calls late at night. Something has gone badly wrong.`,
    choices: [
      { label: "Drop everything", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 14); c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "You drove over in your pyjamas. They'll never forget it." },
      { label: "Text back in the morning", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 8); changeStat(c, "happiness", -2, "Guilt"); }, resultText: () => "By morning the moment had passed." },
    ] },
  { id: "friend-ghosted", minAge: 14, maxAge: 60, weight: 1.2, condition: (c) => !!friendOf(c), autoEffect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 10); changeStat(c, "happiness", -3, "Losing touch"); }, text: () => "Someone you thought of as a close friend stopped replying. There was no fight. It just faded." },
  { id: "political-argument", minAge: 16, maxAge: 85, weight: 1.2, text: () => "A dinner conversation turned to politics and became very heated, very fast.",
    choices: [
      { label: "Change the subject", effect: (c) => { changeStat(c, "happiness", 1, "Keeping the peace"); }, resultText: () => "Dessert saved the evening." },
      { label: "Argue your corner", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 6); changeStat(c, "happiness", -2, "A row"); }, resultText: () => "You were right, and you were alone about it." },
    ] },
  { id: "wallet-found", minAge: 8, maxAge: 90, weight: 1.2, text: () => "You found a wallet on the pavement, stuffed with cash and an ID.",
    choices: [
      { label: "Hand it in", effect: (c) => { changeStat(c, "happiness", 4, "Doing the right thing"); }, resultText: () => "The owner turned up in tears and thanked you three times." },
      { label: "Keep the money", tone: "danger", effect: (c) => { c.money += Math.round(200 * s(c)); changeStat(c, "happiness", -3, "A guilty conscience"); }, resultText: () => "The cash didn't feel like yours." },
    ] },
  { id: "jury-duty", minAge: 21, maxAge: 70, weight: 1, text: () => "A summons arrives: jury duty.",
    choices: [
      { label: "Serve", effect: (c) => { changeStat(c, "smarts", 1, "Civic duty"); c.stress = clamp((c.stress ?? 25) + 3); }, resultText: () => "Three days of testimony taught you more than you expected." },
      { label: "Try to get out of it", effect: (c) => { if (Math.random() < 0.4) { c.money -= Math.round(200 * s(c)); } }, resultText: () => "You wrote a very convincing letter." },
    ] },
  { id: "community-garden", minAge: 12, maxAge: 90, weight: 1.1, text: () => "A community garden is starting on the empty lot down the road.",
    choices: [
      { label: "Grab a plot", effect: (c) => { changeStat(c, "happiness", 3, "Growing things"); c.stress = clamp((c.stress ?? 25) - 4); addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-15, 20), 12, 90), level: 50 }); }, resultText: () => "Your first courgette was the size of a baseball bat." },
      { label: "Not for you", effect: () => {}, resultText: () => "You watched it fill with tomatoes from your window." },
    ] },
  { id: "stuck-viral", minAge: 14, maxAge: 60, weight: 0.8, autoEffect: (c) => { changeStat(c, "happiness", 2, "A moment of fame"); }, text: () => "A video of you doing something ridiculous in public went mildly viral. Strangers now recognise you at the shops." },
  { id: "lost-phone", minAge: 12, maxAge: 85, weight: 1.2, autoEffect: (c) => { c.money -= Math.round(220 * s(c)); c.stress = clamp((c.stress ?? 25) + 3); }, text: () => "You left your phone in a taxi. You spent two days feeling like a limb was missing, and a lot of money replacing it." },
  { id: "local-hero", minAge: 15, maxAge: 85, weight: 0.7, autoEffect: (c) => { changeStat(c, "happiness", 5, "Helping"); c.network = clamp((c.network ?? 0) + 2); }, text: () => "You did something small but timely for a stranger, and it made the local paper. Your gran cut it out and stuck it on the fridge." },
  { id: "pet-adopt-dream", minAge: 8, maxAge: 85, weight: 1.2, text: () => "A rescue centre has a scruffy dog that keeps looking straight at you.",
    choices: [
      { label: "Adopt", effect: (c) => { c.money -= Math.round(250 * s(c)); changeStat(c, "happiness", 6, "A dog"); c.fitness = clamp((c.fitness ?? 50) + 3); c.stress = clamp((c.stress ?? 25) - 5); }, resultText: () => "He was on your bed within the hour." },
      { label: "Just visit", effect: () => {}, resultText: () => "You walked away feeling very guilty." },
    ] },
];

export const SENIOR_EXTRA_EVENTS: LifeEvent[] = [
  { id: "memoir", minAge: 62, maxAge: 92, weight: 1.6, once: true, text: () => "Your family keep asking you to write down your stories before they're forgotten.",
    choices: [
      { label: "Start writing", effect: (c) => { changeStat(c, "happiness", 5, "Telling your story"); changeStat(c, "smarts", 1, "Remembering"); c.fullLog.push({ age: c.age, text: "You wrote down the story of your life." }); }, resultText: () => "The first chapter took a year. The rest poured out." },
      { label: "Tell them out loud instead", effect: (c) => { changeStat(c, "happiness", 3, "Storytelling"); const k = children(c).find((x) => x.alive); if (k) k.level = clamp(k.level + 5); }, resultText: () => "Every Sunday, a new story." },
    ] },
  { id: "grandchild-graduation", minAge: 55, maxAge: 95, weight: 1.4, condition: (c) => c.relationships.some((r) => r.type === "grandchild" && r.alive), autoEffect: (c) => { changeStat(c, "happiness", 6, "Watching a grandchild graduate"); }, text: () => "You sat in the front row and watched your grandchild walk across the stage. Nothing has ever made you prouder." },
  { id: "late-love", minAge: 60, maxAge: 90, weight: 1.2, condition: (c) => !partner(c), text: () => "Someone at the community centre keeps saving you a seat at lunch, and you find you're looking forward to it.",
    choices: [
      { label: "Let it grow", effect: (c) => { const p = addPerson(c, { type: "partner", age: clamp(c.age + randomInt(-6, 6), 58, 92), level: 55 }); p.dates = 2; changeStat(c, "happiness", 6, "Late love"); }, resultText: () => "It's a different kind of love, and no less real." },
      { label: "Stay independent", effect: (c) => { changeStat(c, "happiness", 1, "Contentment"); }, resultText: () => "You've got a good life exactly as it is." },
    ] },
  { id: "old-friends-pass", minAge: 65, maxAge: 95, weight: 2, condition: (c) => !!friendOf(c), autoEffect: (c) => { changeStat(c, "happiness", -5, "Losing friends"); const f = friendOf(c); if (f) f.level = clamp(f.level - 15); }, text: () => "Another funeral. The circle of people who remember your youth keeps getting smaller." },
  { id: "downsize", minAge: 62, maxAge: 90, weight: 1.4, condition: (c) => !!c.home && c.home.value > 100000, text: () => "The house is too big for one or two people, and the stairs are getting harder.",
    choices: [
      { label: "Stay put", effect: (c) => { changeStat(c, "happiness", 2, "Home"); }, resultText: () => "Forty years of memories in every room." },
      { label: "Move somewhere smaller", effect: (c) => { if (c.home) { const gain = Math.round(c.home.value * 0.25); c.money += gain; c.home.value = Math.round(c.home.value * 0.7); c.home.mortgageBalance = Math.min(c.home.mortgageBalance, c.home.value); } changeStat(c, "happiness", 1, "A fresh start"); }, resultText: () => "You released some equity and gained a bit of peace of mind." },
    ] },
  { id: "senior-centre", minAge: 65, maxAge: 95, weight: 1.6, text: () => "The senior centre runs cards, bingo, choirs and gossip. Someone insists you'd love it.",
    choices: [
      { label: "Give it a go", effect: (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-8, 8), 62, 95), level: 55 }); changeStat(c, "happiness", 4, "Company"); }, resultText: () => "You lost at bingo, and made three friends." },
      { label: "Not your scene", effect: () => {}, resultText: () => "You've got your crossword." },
    ] },
  { id: "driving-test-senior", minAge: 75, maxAge: 92, weight: 1.6, condition: (c) => !!c.car, text: () => "Your family are worried about your driving, and you've been asked to take a test.",
    choices: [
      { label: "Take the test", effect: (c) => { if (Math.random() < 0.65) changeStat(c, "happiness", 3, "Passing"); else { c.car = null; changeStat(c, "happiness", -5, "Giving up the keys"); c.yearLog.push("You failed, and handed in the keys."); } }, resultText: () => "You sat behind the wheel like it was your first day." },
      { label: "Give up the keys yourself", effect: (c) => { if (c.car) { c.money += Math.round(c.car.value * 0.6); c.car = null; } changeStat(c, "happiness", -2, "Losing independence"); }, resultText: () => "It was your decision, and it stung." },
    ] },
  { id: "old-hobby-joy", minAge: 60, maxAge: 95, weight: 1.6, condition: (c) => activeHobbies(c).length > 0, autoEffect: (c) => { changeStat(c, "happiness", 4, "Time for what you love"); }, text: (c) => `Retirement gave you time for ${hobbyDef(activeHobbies(c)[0] ?? "")?.label.toLowerCase() ?? "your hobby"}, and it's been the best part of the year.` },
  { id: "sharp-mind", minAge: 70, maxAge: 95, weight: 1.4, condition: (c) => c.stats.smarts > 60, autoEffect: (c) => { changeStat(c, "happiness", 3, "A sharp mind"); }, text: () => "You beat everyone at the quiz night, again. They've started asking you to be on the other team." },
];

export const TEEN_EXTRA_EVENTS: LifeEvent[] = [
  { id: "first-concert", minAge: 12, maxAge: 19, weight: 1.6, once: true, text: () => "Your favourite band is coming to town. Tickets are expensive, and everyone's going.",
    choices: [
      { label: "Save up and go", effect: (c) => { c.money -= Math.round(110 * s(c)); changeStat(c, "happiness", 8, "Your first concert"); }, resultText: () => "You screamed every word. You couldn't hear for two days." },
      { label: "Give it a miss", effect: (c) => { changeStat(c, "happiness", -2, "Missing out"); }, resultText: () => "You watched the clips online instead." },
    ] },
  { id: "learner-driver", minAge: 16, maxAge: 19, weight: 1.6, once: true, text: () => "You're finally old enough for driving lessons.",
    choices: [
      { label: "Book them", effect: (c) => { c.money -= Math.round(600 * s(c)); if (Math.random() < 0.7) changeStat(c, "happiness", 5, "Passing your test"); else changeStat(c, "happiness", -2, "Failing your test"); }, resultText: () => "The instructor's foot hovered over the second brake the whole time." },
      { label: "Put it off", effect: () => {}, resultText: () => "There's always the bus." },
    ] },
  { id: "group-project-drama", minAge: 12, maxAge: 20, weight: 1.6, text: () => "In your group project, one person does nothing and takes credit for everything.",
    choices: [
      { label: "Confront them", effect: (c) => { changeStat(c, "happiness", 2, "Speaking up"); c.conduct = clamp((c.conduct ?? 80) - 1); }, resultText: () => "It got awkward, then better." },
      { label: "Do their part too", effect: (c) => { c.stress = clamp((c.stress ?? 25) + 5); changeStat(c, "smarts", 1, "Extra work"); }, resultText: () => "You got the grade. You also got a headache." },
      { label: "Tell the teacher", effect: (c) => { const t = c.relationships.find((r) => r.type === "teacher" && r.alive); if (t) t.level = clamp(t.level + 4); }, resultText: () => "It was dealt with quietly." },
    ] },
  { id: "school-trip-abroad", minAge: 12, maxAge: 18, weight: 1.2, once: true, condition: (c) => c.money > 100 * s(c), text: () => "The school is organising a trip abroad. Your parents say you can go if you pay part of it.",
    choices: [
      { label: "Go", effect: (c) => { c.money -= Math.round(250 * s(c)); changeStat(c, "happiness", 8, "A school trip"); changeStat(c, "smarts", 1, "Seeing the world"); }, resultText: () => "You came back with a suitcase full of memories and one very expensive souvenir." },
      { label: "Stay home", effect: () => {}, resultText: () => "You saw the photos afterwards." },
    ] },
  { id: "social-media-drama", minAge: 12, maxAge: 20, weight: 1.6, text: () => "Someone posted something about you online, and now half the school has seen it.",
    choices: [
      { label: "Ignore it", effect: (c) => { changeStat(c, "happiness", -3, "Online drama"); c.popularity = clamp((c.popularity ?? 50) - 3); }, resultText: () => "It blew over in a week. It felt like a year." },
      { label: "Report it", effect: (c) => { changeStat(c, "happiness", 1, "Standing up"); }, resultText: () => "The post was taken down." },
      { label: "Post back", effect: (c) => { c.popularity = clamp((c.popularity ?? 50) + (Math.random() < 0.5 ? 4 : -6)); c.conduct = clamp((c.conduct ?? 80) - 3); }, resultText: () => "That escalated." },
    ] },
  { id: "crush-nerves", minAge: 12, maxAge: 17, weight: 1.6, text: () => "There's someone in your class whose smile makes your brain stop working.",
    choices: [
      { label: "Say hello", effect: (c) => { changeStat(c, "happiness", Math.random() < 0.5 ? 4 : 0, "A brave hello"); }, resultText: () => "You said 'hi'. They said 'hi'. It was a start." },
      { label: "Admire from a distance", effect: (c) => { changeStat(c, "happiness", -1, "Wondering"); }, resultText: () => "You wrote their name in your notebook and scribbled it out." },
    ] },
  { id: "teen-first-job-pride", minAge: 15, maxAge: 19, weight: 1.4, condition: (c) => !!c.partTime, autoEffect: (c) => { changeStat(c, "happiness", 3, "Your first pay"); }, text: () => "Your first pay packet arrived. Looking at it, it didn't seem like much. Holding it, it felt like everything." },
  { id: "skipping-class", minAge: 13, maxAge: 18, weight: 1.4, text: () => "A group of friends are going to skip afternoon lessons and go to the park.",
    choices: [
      { label: "Go with them", effect: (c) => { c.conduct = clamp((c.conduct ?? 80) - 5); changeStat(c, "happiness", 3, "A stolen afternoon"); if (Math.random() < 0.3) { c.suspensions = (c.suspensions ?? 0) + 1; c.yearLog.push("You were caught and given a detention."); } }, resultText: () => "The sun was out. The guilt arrived later." },
      { label: "Go to class", effect: (c) => { changeStat(c, "smarts", 1, "Staying put"); }, resultText: () => "You were the only one in the room who knew the answer." },
    ] },
];
