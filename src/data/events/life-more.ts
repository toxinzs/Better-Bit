import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { addPerson } from "../../engine/people";
import { livingIndex, inflation } from "../../engine/where";
import { partner } from "./helpers";

// A big batch of everyday moments: small joys and small disasters, and a run of
// little dilemmas that say something about who you are.

const s = (c: Character) => livingIndex(c.originRegion) * inflation(c);
const $ = (c: Character, n: number) => Math.round(n * s(c));
const friend = (c: Character) => c.relationships.find((r) => r.alive && r.type === "friend");
const kin = (c: Character) => c.relationships.find((r) => r.alive && (r.type === "mother" || r.type === "father" || r.type === "sibling"));
const mood = (c: Character, n: number, why: string) => changeStat(c, "happiness", n, why);

type Eff = (c: Character) => void;
type Cond = (c: Character) => boolean;

const auto = (id: string, min: number, max: number, text: string, effect: Eff, weight = 1, condition?: Cond, once = false): LifeEvent => ({ id, minAge: min, maxAge: max, weight, once, condition, text: () => text, autoEffect: effect });

type Opt = [label: string, effect: Eff, result: string, tone?: "good" | "danger"];
const ask = (id: string, min: number, max: number, text: string, opts: Opt[], weight = 1, condition?: Cond, once = false): LifeEvent => ({
  id, minAge: min, maxAge: max, weight, once, condition, text: () => text,
  choices: opts.map(([label, effect, result, tone]) => ({ label, effect, resultText: () => result, tone })),
});

export const EVERYDAY_EVENTS: LifeEvent[] = [
  // ------------------------------------------------------------ small joys
  auto("first-snow", 3, 90, "The first snow of the year fell overnight, and for one morning everything looked new.", (c) => mood(c, 3, "First snow"), 1.2),
  auto("great-meal", 12, 95, "You had a meal so good you talked about it for a week.", (c) => { mood(c, 3, "A great meal"); c.money -= $(c, 40); }, 1.2),
  auto("good-hair-day", 12, 80, "Your hair did exactly what you wanted for once, and the whole day went better for it.", (c) => { mood(c, 2, "A good hair day"); }, 1),
  auto("street-musician", 10, 95, "A busker outside the station played something that made you stop and stay for three songs.", (c) => mood(c, 3, "Live music"), 1),
  auto("bookshop-find", 10, 95, "You wandered into a bookshop with no plan and left with the best book you'd read in years.", (c) => { c.money -= $(c, 15); changeStat(c, "smarts", 1, "A good book"); mood(c, 2, "A good book"); }, 1),
  auto("sunrise-walk", 10, 95, "You woke up early, went for a walk and watched the sun come up over the rooftops.", (c) => { mood(c, 3, "A sunrise"); c.stress = clamp((c.stress ?? 25) - 4); }, 1),
  auto("karaoke-night", 16, 70, "Karaoke night. You sang like nobody was listening, and everybody was.", (c) => { mood(c, 4, "Karaoke"); }, 1),
  auto("pub-quiz-win", 18, 80, "Your team won the pub quiz thanks to one obscure fact only you knew.", (c) => { mood(c, 3, "A quiz win"); c.money += $(c, 30); }, 1),
  auto("surprise-birthday", 8, 90, "Your friends turned up with a cake, a banner and a very bad singing voice.", (c) => { mood(c, 6, "A surprise party"); const f = friend(c); if (f) f.level = clamp(f.level + 4); }, 1.2, (c) => !!friend(c)),
  auto("quiet-weekend", 16, 90, "A weekend with nothing planned, and you used it exactly the way you wanted.", (c) => { c.stress = clamp((c.stress ?? 25) - 6); mood(c, 2, "A quiet weekend"); }, 1.1),
  auto("compliment-stranger", 12, 90, "A stranger told you they loved your coat. It made your whole week.", (c) => { mood(c, 3, "A compliment"); }, 0.9),
  auto("found-old-photo", 12, 95, "You found a photo you'd forgotten about, from a day you didn't know you'd remember so clearly.", (c) => { mood(c, 2, "A memory"); }, 0.9),
  auto("road-trip-spontaneous", 17, 65, "Someone said 'let's just drive' and, astonishingly, you did.", (c) => { c.money -= $(c, 120); mood(c, 5, "A spontaneous trip"); c.stress = clamp((c.stress ?? 25) - 6); }, 1, (c) => c.money > $(c, 300)),
  auto("festival-tickets", 15, 60, "You got tickets to the summer festival: three days, one tent and zero sleep.", (c) => { c.money -= $(c, 200); mood(c, 7, "A festival"); c.fitness = clamp((c.fitness ?? 50) + 1); }, 1, (c) => c.money > $(c, 400)),
  auto("garden-bloom", 20, 95, "The flowers you planted in spring came into bloom all at once, and you stood there admiring them like a proud parent.", (c) => mood(c, 3, "Flowers"), 0.9),
  auto("perfect-parking", 17, 90, "You parallel-parked first time, with an audience.", (c) => mood(c, 1, "Small victories"), 0.5, (c) => !!c.car),
  auto("teacher-letter", 18, 60, "You got a letter from a former teacher saying you were one of the students they remember most.", (c) => { mood(c, 5, "Being remembered"); }, 0.8),
  auto("lucky-day", 10, 90, "Everything went right today: the green lights, the last seat on the train, the parking space right outside.", (c) => { mood(c, 2, "A lucky day"); }, 0.9),
  auto("new-cafe", 16, 90, "A new café opened on your street and, against all odds, it's good.", (c) => { mood(c, 2, "A new local"); c.money -= $(c, 30); }, 0.9),
  auto("bike-ride-joy", 8, 80, "You cycled home the long way and felt about ten years old.", (c) => { mood(c, 3, "Cycling"); c.fitness = clamp((c.fitness ?? 50) + 1); }, 0.9),
  // ------------------------------------------------------------ small disasters
  auto("power-cut", 5, 95, "The power went out for six hours, and the whole street ended up on doorsteps with torches, comparing candles.", (c) => { c.stress = clamp((c.stress ?? 25) + 2); mood(c, 1, "Neighbours"); }, 0.9),
  auto("bad-haircut", 12, 70, "You asked for a trim. You got something else.", (c) => { changeStat(c, "looks", -2, "A bad haircut"); mood(c, -2, "A bad haircut"); }, 0.9),
  auto("bike-stolen", 8, 70, "You came out and your bike wasn't there. Just the lock, cut cleanly.", (c) => { c.money -= $(c, 200); mood(c, -3, "Theft"); }, 0.8, (c) => c.age >= 10),
  auto("rail-strike", 18, 70, "A rail strike turned your commute into an hour-long odyssey each way.", (c) => { c.stress = clamp((c.stress ?? 25) + 5); mood(c, -2, "A strike"); }, 0.9, (c) => !!c.job),
  auto("heatwave", 5, 95, "A heatwave made everything miserable for two weeks. Nobody slept.", (c) => { changeStat(c, "health", -1, "The heat"); mood(c, -2, "The heat"); }, 0.9),
  auto("burst-pipe", 20, 90, "A pipe burst in the night. You woke up to a small lake in the kitchen.", (c) => { c.money -= $(c, 600); c.stress = clamp((c.stress ?? 25) + 5); }, 0.9, (c) => c.residence?.housing === "own" || c.residence?.housing === "rent"),
  auto("lost-keys", 10, 90, "You lost your keys, found them in your pocket and then lost them again.", (c) => { c.stress = clamp((c.stress ?? 25) + 2); }, 0.7),
  auto("embarrassing-typo", 14, 80, "You accidentally sent a message to the wrong person, and it was, of course, about them.", (c) => { mood(c, -2, "Embarrassment"); }, 0.9),
  auto("cold-and-flu-season", 4, 90, "Every person you met that winter seemed to have the same cold. You caught it last.", (c) => { changeStat(c, "health", -2, "A winter cold"); }, 1),
  auto("phone-dies", 12, 80, "Your phone died on the day you needed it most.", (c) => { c.money -= $(c, 120); mood(c, -2, "A dead phone"); }, 0.8),
  auto("dentist-drama", 8, 90, "The dentist frowned, sighed and said the word 'root canal'.", (c) => { c.money -= $(c, 500); mood(c, -3, "The dentist"); }, 0.9),
  auto("stuck-lift", 10, 90, "You got stuck in a lift for forty minutes with a stranger. By the end you knew each other's life stories.", (c) => { mood(c, 1, "A shared experience"); }, 0.6),
  auto("wet-commute", 12, 90, "You were caught in a downpour without an umbrella and arrived looking like you'd swum there.", (c) => { mood(c, -1, "Soaked"); }, 0.7),
  auto("noisy-upstairs", 18, 90, "The people above you learned to play the drums. Yes, in the flat.", (c) => { c.stress = clamp((c.stress ?? 25) + 4); }, 0.8),
  // ------------------------------------------------------------ dilemmas
  ask("friend-loan", 18, 80, "A friend asks to borrow money, 'just for a few weeks'.", [
    ["Lend it", (c) => { c.money -= $(c, 400); const f = friend(c); if (f) f.level = clamp(f.level + (Math.random() < 0.6 ? 6 : -8)); }, "You handed it over and tried not to think about it."],
    ["Say no, kindly", (c) => { const f = friend(c); if (f) f.level = clamp(f.level - 4); }, "It was awkward. It was also sensible."],
  ], 1.2, (c) => !!friend(c) && c.money > $(c, 800)),
  ask("roommate-wants-in", 20, 60, "A friend has been evicted and asks if they can sleep on your couch 'for a week'.", [
    ["Say yes", (c) => { const f = friend(c); if (f) f.level = clamp(f.level + 8); c.stress = clamp((c.stress ?? 25) + 6); c.money -= $(c, 150); }, "The week became a month, and you learned a lot about each other."],
    ["Help them find somewhere else", (c) => { const f = friend(c); if (f) f.level = clamp(f.level + 2); }, "You spent a weekend on listings together."],
  ], 1, (c) => !!friend(c) && (c.residence?.housing === "rent" || c.residence?.housing === "own")),
  ask("cv-lie-temptation", 18, 55, "Your CV has a gap, and a small lie would cover it perfectly.", [
    ["Tell the truth", (c) => { changeStat(c, "smarts", 1, "Honesty"); }, "You wrote it plainly and moved on."],
    ["Fudge the dates", (c) => { if (Math.random() < 0.25) { c.network = clamp((c.network ?? 0) - 6); c.yearLog.push("Someone checked, and it went badly."); } else mood(c, 1, "Getting away with it"); }, "Your palms were damp the whole interview.", "danger"],
  ], 1, (c) => !c.job && c.age >= 21),
  ask("bill-error", 18, 90, "The shop gave you far too much change.", [
    ["Give it back", (c) => mood(c, 2, "Honesty"), "The cashier looked at you like you'd grown a second head, then smiled."],
    ["Pocket it", (c) => { c.money += $(c, 40); mood(c, -1, "A guilty conscience"); }, "It felt like less than you'd hoped."],
  ], 1),
  ask("timeshare-scam", 30, 85, "A cheerful voice on the phone says you've won a free holiday. There's a 'short presentation' first.", [
    ["Go along", (c) => { c.money -= $(c, 1800); mood(c, -4, "Being conned"); }, "Three hours of pressure later, you'd signed something."],
    ["Hang up", (c) => changeStat(c, "smarts", 1, "Common sense"), "If it's free, it isn't."],
  ], 1),
  ask("blood-donation", 17, 70, "There's a blood-donation van on your street.", [
    ["Donate", (c) => { mood(c, 3, "Giving blood"); changeStat(c, "health", -1, "A pint lighter"); }, "A biscuit, a cup of tea and a very good feeling."],
    ["Walk past", () => {}, "Needles."],
  ], 1),
  ask("organ-donor", 18, 80, "You're asked, at the counter, whether you'd like to register as an organ donor.", [
    ["Register", (c) => mood(c, 2, "A generous choice"), "It took ten seconds and it might mean a great deal to someone."],
    ["Not sure", () => {}, "You said you'd think about it."],
  ], 0.7, undefined, true),
  ask("surprise-party-plan", 22, 70, "Your partner's birthday is coming up. You could do something big.", [
    ["Plan a surprise party", (c) => { c.money -= $(c, 250); const p = partner(c); if (p) p.level = clamp(p.level + 8); mood(c, 3, "Making someone happy"); }, "They cried. The good kind."],
    ["A quiet dinner for two", (c) => { c.money -= $(c, 90); const p = partner(c); if (p) p.level = clamp(p.level + 5); }, "It was perfect."],
  ], 1.3, (c) => !!partner(c)),
  ask("moving-in-together", 20, 45, "You and your partner have been together a while. Do you move in together?", [
    ["Move in", (c) => { const p = partner(c); if (p) p.level = clamp(p.level + 6); c.stress = clamp((c.stress ?? 25) + 3); }, "Two toothbrushes, one very small bathroom shelf."],
    ["Not yet", (c) => { const p = partner(c); if (p) p.level = clamp(p.level - 3); }, "You weren't ready, and they noticed."],
  ], 1.3, (c) => !!partner(c) && !partner(c)!.married, true),
  ask("borrow-car", 20, 70, "A cousin asks to borrow your car for the weekend.", [
    ["Lend it", (c) => { if (Math.random() < 0.2) { c.money -= $(c, 500); c.yearLog.push("It came back with a dent."); } else mood(c, 1, "Being generous"); }, "You held your breath until it came back."],
    ["Say no", (c) => { const k = kin(c); if (k) k.level = clamp(k.level - 3); }, "It's your car. Still, the silence was long."],
  ], 1, (c) => !!c.car),
  ask("startup-invite", 22, 45, "A friend invites you to join their start-up. No salary, lots of equity, plenty of enthusiasm.", [
    ["Jump in", (c) => { c.money -= $(c, 1500); c.stress = clamp((c.stress ?? 25) + 8); c.network = clamp((c.network ?? 0) + 8); if (Math.random() < 0.08) { c.money += $(c, 60000); c.yearLog.push("The company sold. Your stake paid off."); } }, "A year of late nights, pizza and hope."],
    ["Stay where you are", (c) => mood(c, 1, "Security"), "You sleep well, and you wonder."],
  ], 0.9, (c) => !!c.job),
  ask("dog-sitting", 14, 80, "A neighbour asks you to look after their dog for a fortnight.", [
    ["Say yes", (c) => { mood(c, 4, "A dog in the house"); c.fitness = clamp((c.fitness ?? 50) + 2); addPerson(c, { type: "friend", age: randomInt(25, 65), level: 45 }); }, "You've never walked so much in your life."],
    ["Sorry, no", () => {}, "The neighbour found someone else."],
  ], 1),
  ask("cheating-temptation-test", 15, 20, "Everyone in your class is passing around the answers to tomorrow's exam.", [
    ["Say no", (c) => { changeStat(c, "smarts", 1, "Doing it yourself"); }, "You studied alone until midnight."],
    ["Have a look", (c) => { c.conduct = clamp((c.conduct ?? 80) - 6); if (Math.random() < 0.3) { c.suspensions = (c.suspensions ?? 0) + 1; c.yearLog.push("You were caught and it went on your record."); } }, "Your stomach hurt all day.", "danger"],
  ], 1, (c) => c.age >= 14 && c.age <= 20),
  ask("stranger-needs-help", 12, 90, "A stranger on the street looks lost and a bit frightened.", [
    ["Stop and help", (c) => { mood(c, 3, "Helping"); }, "You walked them to the right bus stop."],
    ["Walk on", () => {}, "You looked back once."],
  ], 1),
  ask("gym-membership-guilt", 18, 65, "You've been paying for a gym membership you haven't used in months.", [
    ["Finally start going", (c) => { c.fitness = clamp((c.fitness ?? 50) + 4); mood(c, 1, "Following through"); }, "Week one: heroic. Week three: ask again."],
    ["Cancel it", (c) => { c.money += $(c, 300); }, "The relief of an honest decision."],
  ], 1, (c) => c.routine === "none" || c.routine === "light"),
  ask("ex-messages-you", 18, 70, "An ex out of the blue: 'hey, been thinking about you.'", [
    ["Reply", (c) => { const ex = c.relationships.find((r) => r.type === "ex" && r.alive); if (ex) ex.level = clamp(ex.level + 6); mood(c, 2, "A message"); c.sanity = clamp((c.sanity ?? 75) - 1); }, "You typed and deleted five replies."],
    ["Leave it on read", (c) => mood(c, 1, "Moving on"), "You put the phone in a drawer."],
  ], 1, (c) => c.relationships.some((r) => r.type === "ex" && r.alive)),
  ask("neighbour-complaint", 18, 90, "A neighbour leaves a note about your noise. You didn't think you'd been noisy.", [
    ["Apologise and be more careful", (c) => { changeStat(c, "happiness", 1, "Being considerate"); }, "A plate of biscuits sealed the peace."],
    ["Ignore it", (c) => { c.stress = clamp((c.stress ?? 25) + 3); }, "A second note followed."],
  ], 0.9, (c) => c.residence?.housing === "rent" || c.residence?.housing === "own"),
  ask("work-lunch-invite", 20, 65, "Your colleagues invite you to lunch, and you were planning to eat at your desk.", [
    ["Go along", (c) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) + 3); c.money -= $(c, 25); }, "You learned more about the office in an hour than in a month."],
    ["Stick with your plan", () => {}, "Salad, alone, spreadsheet."],
  ], 1, (c) => !!c.job),
  ask("late-night-call", 16, 90, "The phone rings at 2 a.m. It's someone you haven't spoken to in years.", [
    ["Answer", (c) => { mood(c, 2, "Reconnecting"); const f = friend(c); if (f) f.level = clamp(f.level + 8); }, "You talked until the sky went grey."],
    ["Let it ring", () => {}, "Whoever it was didn't call back."],
  ], 0.8),
  ask("cinema-trailer-hype", 10, 60, "The biggest film of the year opens tonight. Everybody's going.", [
    ["Go with friends", (c) => { c.money -= $(c, 30); mood(c, 4, "A night out"); }, "You cheered at the end, with strangers."],
    ["Wait for streaming", (c) => { c.money += $(c, 10); }, "Spoilers found you anyway."],
  ], 1),
  ask("secondhand-bargain", 14, 85, "A charity shop has the exact jacket you've wanted, for almost nothing.", [
    ["Buy it", (c) => { c.money -= $(c, 25); changeStat(c, "looks", 1, "A great find"); mood(c, 2, "A bargain"); }, "Compliments for a week."],
    ["Leave it", () => {}, "You thought about it all the way home."],
  ], 1),
  ask("volunteer-shift", 15, 90, "A local shelter is short of volunteers this weekend.", [
    ["Give a day", (c) => { mood(c, 4, "Helping"); c.network = clamp((c.network ?? 0) + 1); }, "Tired feet, full heart."],
    ["Donate instead", (c) => { c.money -= $(c, 40); mood(c, 1, "Helping"); }, "A small cheque, a clear conscience."],
  ], 1),
  ask("new-language-app", 14, 80, "You've been meaning to learn another language, and the app is very persuasive.", [
    ["Start today", (c) => { changeStat(c, "smarts", 1, "Learning"); }, "Day one: 'Hello'. Day thirty: a whole sentence."],
    ["Maybe later", () => {}, "The owl is disappointed."],
  ], 0.9),
  ask("home-improvement-bug", 22, 80, "You've decided to redo a room yourself. How hard can it be?", [
    ["Do it yourself", (c) => { const ok = Math.random() < 0.4 + ((c.talents?.technical ?? 50) - 50) / 150; c.money -= $(c, 250); if (ok) mood(c, 5, "A job well done"); else { c.money -= $(c, 600); mood(c, -2, "A DIY disaster"); } }, "Paint got everywhere, including the ceiling."],
    ["Hire someone", (c) => { c.money -= $(c, 900); mood(c, 2, "A nice room"); }, "It looked perfect. It cost accordingly."],
  ], 1, (c) => c.residence?.housing === "own"),
  ask("teen-curfew", 13, 17, "You're an hour past curfew and your phone is full of missed calls.", [
    ["Go home now and face it", (c) => { const p = kin(c); if (p) p.level = clamp(p.level - 2); c.conduct = clamp((c.conduct ?? 80) - 1); }, "A lecture, a grounding and, underneath it, relief."],
    ["Stay out even later", (c) => { const p = kin(c); if (p) p.level = clamp(p.level - 8); c.conduct = clamp((c.conduct ?? 80) - 5); mood(c, 2, "Freedom"); }, "It was fun until you got home.", "danger"],
  ], 1),
  ask("kid-lost-tooth", 5, 9, "Your tooth finally came out at dinner. Tooth fairy time.", [
    ["Put it under the pillow", (c) => { c.money += $(c, 2); mood(c, 3, "The tooth fairy"); }, "In the morning: a coin and glitter on the carpet."],
    ["Keep it in a box", (c) => mood(c, 1, "A souvenir"), "You have quite the collection."],
  ], 1.2),
  ask("kid-imaginary-friend", 3, 7, "You've been talking a lot to a friend nobody else can see.", [
    ["Keep them at the table", (c) => { mood(c, 3, "Imagination"); changeStat(c, "smarts", 1, "Imagination"); }, "They have very strong opinions about sausages."],
    ["Say goodbye kindly", () => {}, "One day they just weren't there any more."],
  ], 1),
  ask("kid-first-bike", 4, 8, "You've been given a bike with stabilisers, and a slightly nervous audience.", [
    ["Ride straight down the hill", (c) => { const ok = Math.random() < 0.6; mood(c, ok ? 5 : -1, ok ? "Riding" : "A tumble"); if (!ok) changeStat(c, "health", -1, "A scraped knee"); c.fitness = clamp((c.fitness ?? 50) + 1); }, "You lived to tell the tale."],
    ["Take it slowly", (c) => mood(c, 3, "Learning"), "By evening you'd worked it out."],
  ], 1.3),
  ask("teen-part-of-group", 12, 17, "A group of older kids invites you to hang out with them after school.", [
    ["Go", (c) => { c.popularity = clamp((c.popularity ?? 50) + 4); c.conduct = clamp((c.conduct ?? 80) - 2); }, "They were cooler than you. You tried to keep up."],
    ["Stay with your friends", (c) => { const f = friend(c); if (f) f.level = clamp(f.level + 4); }, "Your friends were glad you did."],
  ], 1),
  ask("uni-society-fair", 18, 22, "The societies fair is a wall of noise, banners and free pizza.", [
    ["Join a few", (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-2, 4), 18, 30), level: 50 }); c.network = clamp((c.network ?? 0) + 2); mood(c, 3, "Society life"); c.money -= $(c, 40); }, "You signed up for six. You go to two."],
    ["Skip it", () => {}, "The pizza looked good, though."],
  ], 1.2, (c) => !!c.higher),
  ask("graduation-speech-nerves", 21, 26, "You've been asked to say a few words at graduation.", [
    ["Do it", (c) => { mood(c, 4, "Speaking up"); c.network = clamp((c.network ?? 0) + 2); }, "Your voice wobbled and the room clapped anyway."],
    ["Decline", () => {}, "You watched a friend do it wonderfully."],
  ], 0.8, (c) => c.hasCollegeDegree || !!c.higher),
  ask("wine-tasting", 21, 80, "A friend gives you a voucher for a tasting evening.", [
    ["Go and enjoy", (c) => { mood(c, 3, "A tasting"); c.money -= $(c, 30); }, "You learned three words and forgot them by the second glass."],
    ["Regift it", () => {}, "Someone else had a lovely evening."],
  ], 0.9, (c) => c.age >= 21),
  ask("hospital-visit-friend", 18, 90, "A friend is in hospital and visiting hours are short.", [
    ["Go and sit with them", (c) => { const f = friend(c); if (f) f.level = clamp(f.level + 10); mood(c, 1, "Being there"); }, "You brought grapes, out of tradition."],
    ["Send a card", (c) => { const f = friend(c); if (f) f.level = clamp(f.level + 3); }, "It sat on their windowsill."],
  ], 1, (c) => !!friend(c)),
  ask("new-neighbour", 18, 90, "Someone has moved in next door. They're standing amid boxes, looking a bit overwhelmed.", [
    ["Welcome them", (c) => { addPerson(c, { type: "friend", age: clamp(c.age + randomInt(-10, 15), 18, 90), level: 45 }); mood(c, 2, "A new neighbour"); }, "You brought over tea and a folding chair."],
    ["Nod politely", () => {}, "You'll say hello another day."],
  ], 1, (c) => c.residence?.housing === "own" || c.residence?.housing === "rent"),
  ask("fitness-tracker", 16, 70, "You're given a fitness tracker for your birthday. It has feelings about your step count.", [
    ["Try to hit the goals", (c) => { c.fitness = clamp((c.fitness ?? 50) + 3); mood(c, 1, "Small wins"); }, "Ten thousand steps, on the dot, at 11:58pm."],
    ["Put it in a drawer", () => {}, "It buzzes reproachfully, somewhere."],
  ], 1),
  ask("cooking-fail-guests", 18, 70, "You promised to cook for people you want to impress. The recipe was ambitious.", [
    ["Soldier on", (c) => { const ok = Math.random() < 0.5 + ((c.talents?.artistic ?? 50) - 50) / 200; mood(c, ok ? 5 : -1, ok ? "A triumph" : "A disaster"); c.money -= $(c, 60); }, "The smoke alarm was involved."],
    ["Order takeaway", (c) => { c.money -= $(c, 90); mood(c, 1, "A saved evening"); }, "Nobody will ever know. (Everybody knows.)"],
  ], 1),
  ask("sabbatical-idea", 28, 55, "You've saved a bit, and you're daydreaming about taking six months out to travel.", [
    ["Do it", (c) => { c.money -= $(c, 6000); mood(c, 10, "A sabbatical"); c.stress = clamp((c.stress ?? 25) - 15); c.visited = c.visited ?? []; }, "The best half-year of your life. The return flight was hard."],
    ["Stay sensible", (c) => mood(c, -1, "Restlessness"), "Maybe when things calm down."],
  ], 0.9, (c) => c.money > $(c, 9000) && !!c.job),
  ask("moral-dilemma-boss-bill", 22, 65, "You notice your boss expensing something personal. It isn't your business. It's also not right.", [
    ["Raise it quietly", (c) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) - 6); mood(c, 2, "Integrity"); }, "It got very icy for a while."],
    ["Say nothing", (c) => mood(c, -2, "Looking away"), "You're not being paid to police the accounts."],
  ], 0.9, (c) => !!c.job),
  ask("mid-year-holiday", 20, 80, "A cheap flight deal has popped up for somewhere you've always wanted to see.", [
    ["Book it", (c) => { c.money -= $(c, 700); mood(c, 7, "A holiday"); c.stress = clamp((c.stress ?? 25) - 10); }, "You landed with a suitcase and no plan."],
    ["Save the money", (c) => { c.money += $(c, 50); }, "The tab stayed open for a week."],
  ], 1.2, (c) => c.money > $(c, 1500)),
  ask("holiday-gift-choice", 8, 85, "It's nearly the holidays and you can't decide on presents.", [
    ["Spend big", (c) => { c.money -= $(c, 400); const k = kin(c); if (k) k.level = clamp(k.level + 6); mood(c, 2, "Giving"); }, "The smiles were worth it, mostly."],
    ["Make something", (c) => { const k = kin(c); if (k) k.level = clamp(k.level + 8); mood(c, 3, "A handmade gift"); }, "They kept it on the mantelpiece."],
  ], 1, (c) => c.age >= 12),
];
