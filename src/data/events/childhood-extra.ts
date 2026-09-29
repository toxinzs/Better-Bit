import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { gainFitness } from "../../engine/health";
import { CLASSES } from "../../data/traits";
import { mother, father, sibling } from "./helpers";

// Growing up, from the first steps to the last year of primary school: the
// small milestones (ages 0-4, where things happen *to* you), then the choices
// a child actually gets to make - birthdays, camps, screen time, family trips.

const first = (r?: { name: string }) => (r ? r.name.split(" ")[0] : "Your parent");
const parent = (c: Character) => mother(c) ?? father(c);
const bump = (c: Character, key: "mother" | "father" | "both", n: number) => {
  for (const r of c.relationships) if (r.alive && ((key === "both" && (r.type === "mother" || r.type === "father")) || r.type === key)) r.level = clamp(r.level + n);
};
const classRank = (c: Character) => ["struggling", "working", "middle", "comfortable", "wealthy"].indexOf(c.background?.wealthClass ?? "middle");

const milestone = (id: string, minAge: number, maxAge: number, text: (c: Character) => string, effect: (c: Character) => void, weight = 1.4): LifeEvent => ({
  id,
  minAge,
  maxAge,
  once: true,
  weight,
  text,
  autoEffect: effect,
});

export const CHILDHOOD_EXTRA_EVENTS: LifeEvent[] = [
  // ------------------------------------------------ 0-4: things happen to you
  milestone("teething", 0, 1, () => "Your first teeth came in. It was a loud few weeks for everyone.", (c) => {
    changeStat(c, "happiness", -2, "Teething");
    bump(c, "both", 2);
  }, 2),
  milestone("first-words", 1, 2, (c) => `You said your first real word today. ${first(parent(c))} swears it was their name.`, (c) => {
    changeStat(c, "smarts", 3, "Learning to talk");
    changeStat(c, "happiness", 3, "A big milestone");
    bump(c, "both", 3);
  }, 3),
  milestone("first-haircut", 1, 3, () => "You had your first haircut. There's a photo and a lock of hair in a box somewhere.", (c) => {
    changeStat(c, "looks", 2, "A fresh haircut");
  }),
  milestone("potty-training", 2, 3, () => "Potty training was a long, messy adventure. But you got there.", (c) => {
    changeStat(c, "smarts", 2, "Growing up");
    bump(c, "both", 3);
  }, 3),
  milestone("separation-anxiety", 1, 3, (c) => `You screamed the whole way down the road when ${first(parent(c))} dropped you at ${classRank(c) >= 3 ? "nursery" : "your neighbour's"}.`, (c) => {
    changeStat(c, "happiness", -2, "Being left with strangers");
    if (c.personality) c.personality.n = clamp(c.personality.n + 1);
  }),
  milestone("imaginary-friend", 3, 5, () => "You had an imaginary friend this year. They had opinions about everything, and you took their side in every argument.", (c) => {
    changeStat(c, "happiness", 4, "A very loyal friend");
    if (c.personality) c.personality.o = clamp(c.personality.o + 2);
  }),
  milestone("favourite-toy", 2, 5, () => "You found a stuffed toy you refused to be parted from. It went everywhere with you and now looks like it's been through a war.", (c) => {
    changeStat(c, "happiness", 3, "A favourite toy");
  }),
  milestone("bedtime-stories", 2, 5, (c) => `${first(parent(c))} read to you every night this year. You could recite the whole book.`, (c) => {
    changeStat(c, "smarts", 3, "Bedtime stories");
    bump(c, "both", 4);
  }),
  milestone("first-swim", 3, 5, () => "You learned to swim this summer - first with armbands, then without them.", (c) => {
    gainFitness(c, 5);
    changeStat(c, "health", 2, "Learning to swim");
  }),
  milestone("kindergarten-ready", 4, 5, (c) => `You're ready for school. ${first(parent(c))} walked you to the gate and pretended not to cry.`, (c) => {
    changeStat(c, "smarts", 2, "Getting ready for school");
    bump(c, "both", 2);
  }, 4),
  {
    id: "picky-eater",
    minAge: 2,
    maxAge: 6,
    once: true,
    text: () => "You've decided you only eat pasta and one specific brand of yoghurt. Everything green is the enemy.",
    choices: [
      { label: "Hold out", effect: (c) => { changeStat(c, "health", -1, "Not eating well"); bump(c, "both", -2); }, resultText: () => "A stand-off at every dinner. Nobody wins." },
      { label: "Try one bite", effect: (c) => { changeStat(c, "health", 2, "Eating something green"); bump(c, "both", 2); }, resultText: () => "It was fine. You'll never admit it." },
    ],
  },
  {
    id: "toddler-explorer",
    minAge: 2,
    maxAge: 4,
    weight: 1.2,
    text: () => "You discovered you could climb onto the kitchen counter.",
    choices: [
      { label: "Climb higher", effect: (c) => { if (Math.random() < 0.35) { changeStat(c, "health", -5, "A tumble"); } else changeStat(c, "happiness", 3, "Being brave"); }, resultText: () => "You definitely went higher." },
      { label: "Stay on the floor", effect: (c) => { bump(c, "both", 1); } },
    ],
  },
  // ------------------------------------------------ 3-12: birthdays
  {
    id: "birthday-party-kid",
    minAge: 3,
    maxAge: 12,
    weight: 2.5,
    text: (c) => `Your ${c.age}${c.age === 3 ? "rd" : "th"} birthday is coming up. ${first(parent(c))} asks how you want to celebrate.`,
    choices: [
      {
        label: "A big party with the whole class",
        sublabel: "Depends on what your family can afford",
        disabled: false,
        effect: (c) => {
          if (classRank(c) >= 2) {
            changeStat(c, "happiness", 8, "A big birthday party");
            c.popularity = clamp((c.popularity ?? 50) + 5);
            bump(c, "both", 3);
            c.yearLog.push("Your party was the talk of the class.");
          } else {
            changeStat(c, "happiness", 3, "A small birthday");
            c.yearLog.push("Money was tight, so it was a smaller party than you'd hoped - but a good one.");
          }
        },
      },
      {
        label: "A quiet family dinner",
        effect: (c) => {
          changeStat(c, "happiness", 4, "A family birthday");
          bump(c, "both", 4);
        },
        resultText: () => "Cake, candles and a very loud rendition of the song.",
      },
      {
        label: "A sleepover with your best friends",
        effect: (c) => {
          changeStat(c, "happiness", 6, "A sleepover");
          for (const r of c.relationships) if (r.alive && (r.type === "friend" || r.type === "classmate")) r.level = clamp(r.level + 6);
        },
        resultText: () => "Nobody slept. It was perfect.",
      },
    ],
  },
  // ------------------------------------------------ 6-12: choices of your own
  {
    id: "summer-camp",
    minAge: 6,
    maxAge: 13,
    weight: 1.6,
    text: () => "Summer is coming and your parents mention summer camp.",
    choices: [
      { label: "Sports camp", effect: (c) => { gainFitness(c, 8); const s = (c.skills ??= {}); s.athletics = clamp((s.athletics ?? 0) + randomInt(4, 9)); changeStat(c, "happiness", 4, "Sports camp"); }, resultText: () => "You came home tanned, sore and a little faster." },
      { label: "Art & music camp", effect: (c) => { const s = (c.skills ??= {}); s.art = clamp((s.art ?? 0) + randomInt(4, 8)); s.music = clamp((s.music ?? 0) + randomInt(2, 6)); changeStat(c, "happiness", 4, "Art camp"); }, resultText: () => "You made a lot of paint-splattered friendship bracelets." },
      { label: "Science & coding camp", effect: (c) => { const s = (c.skills ??= {}); s.coding = clamp((s.coding ?? 0) + randomInt(4, 9)); changeStat(c, "smarts", 3, "Science camp"); }, resultText: () => "You built something that (sort of) worked." },
      { label: "Stay home all summer", effect: (c) => { changeStat(c, "happiness", 2, "A lazy summer"); gainFitness(c, -3); }, resultText: () => "A lot of cartoons and a lot of snacks." },
    ],
  },
  {
    id: "screen-time",
    minAge: 6,
    maxAge: 13,
    weight: 1.6,
    text: (c) => `${first(parent(c))} has put a limit on your screen time. You disagree strongly.`,
    choices: [
      { label: "Sneak extra time", effect: (c) => { if (Math.random() < 0.5) { bump(c, "both", -6); c.conduct = clamp((c.conduct ?? 80) - 4); c.yearLog.push("You got caught with the tablet under the covers."); } else changeStat(c, "happiness", 4, "Extra screen time"); changeStat(c, "smarts", -1, "Too much screen time"); }, resultText: () => "The glow of a screen at 1 a.m. is a thrill." },
      { label: "Follow the rules", effect: (c) => { bump(c, "both", 3); gainFitness(c, 4); changeStat(c, "smarts", 1, "Reading instead"); }, resultText: () => "You read a book. Somehow it was fine." },
      { label: "Negotiate a deal", effect: (c) => { const win = Math.random() < 0.4 + ((c.talents?.verbal ?? 50) - 50) / 200; if (win) { bump(c, "both", 2); changeStat(c, "happiness", 3, "Winning the negotiation"); } else changeStat(c, "happiness", -1, "Losing the negotiation"); }, resultText: () => "You made an argument. They listened, at least." },
    ],
  },
  {
    id: "lemonade-stand",
    minAge: 6,
    maxAge: 11,
    once: true,
    weight: 1.5,
    text: () => "It's a hot day. You and a friend set up a lemonade stand on the pavement.",
    choices: [
      { label: "Charge a fair price", effect: (c) => { const earn = Math.round(randomInt(8, 28) * (0.7 + (c.talents?.business ?? 50) / 100)); c.money += earn; changeStat(c, "happiness", 3, "Your first business"); c.yearLog.push(`You made $${earn}.`); }, resultText: () => "The neighbours were generous." },
      { label: "Charge way too much", effect: (c) => { const good = (c.talents?.business ?? 50) > 65 && Math.random() < 0.5; const earn = good ? randomInt(30, 60) : randomInt(0, 6); c.money += earn; c.yearLog.push(good ? `Somehow it worked - $${earn}.` : `Nobody paid that much. You made $${earn}.`); }, resultText: () => "A bold pricing strategy." },
      { label: "Give it away", effect: (c) => { for (const r of c.relationships) if (r.alive && r.type === "friend") r.level = clamp(r.level + 5); changeStat(c, "happiness", 4, "Being generous"); }, resultText: () => "You made a lot of friends and no money." },
    ],
  },
  {
    id: "family-road-trip",
    minAge: 5,
    maxAge: 13,
    weight: 1.5,
    text: () => "Your family is off on a road trip. It's a long drive.",
    choices: [
      { label: "Sing along to everything", effect: (c) => { bump(c, "both", 4); changeStat(c, "happiness", 4, "A family road trip"); }, resultText: () => "You sang off-key for four hours. They love you anyway." },
      { label: "Ask 'are we there yet?' constantly", effect: (c) => { bump(c, "both", -3); changeStat(c, "happiness", -1, "A very long drive"); }, resultText: () => "Somebody threatened to turn the car around." },
      { label: "Sleep in the back", effect: (c) => { changeStat(c, "health", 1, "A nap"); }, resultText: () => "You woke up at the seaside." },
    ],
  },
  {
    id: "new-neighbour",
    minAge: 5,
    maxAge: 11,
    weight: 1.2,
    text: () => "A new family moves in next door. There's a kid about your age.",
    choices: [
      { label: "Go and say hi", effect: (c) => { c.popularity = clamp((c.popularity ?? 50) + 2); changeStat(c, "happiness", 4, "A new friend"); c.yearLog.push("You made friends with the kid next door."); }, resultText: () => "By dinner time you were best friends." },
      { label: "Watch from the window", effect: (c) => { if (c.personality) c.personality.e = clamp(c.personality.e - 1); }, resultText: () => "Maybe tomorrow." },
    ],
  },
  {
    id: "holiday-present",
    minAge: 5,
    maxAge: 12,
    weight: 1.6,
    text: (c) => `It's nearly the holidays. ${first(parent(c))} asks what you want most.`,
    choices: [
      { label: "A games console", effect: (c) => { if (classRank(c) >= 2) { changeStat(c, "happiness", 8, "The best present"); gainFitness(c, -3); } else { changeStat(c, "happiness", 2, "A smaller present"); c.yearLog.push("Money was tight, so you got something smaller."); } }, resultText: () => "Wrapped in shiny paper. You didn't sleep." },
      { label: "A bike", effect: (c) => { gainFitness(c, 6); changeStat(c, "happiness", 6, "A new bike"); }, resultText: () => "You were up and down the street until it got dark." },
      { label: "A stack of books", effect: (c) => { changeStat(c, "smarts", 3, "Reading"); changeStat(c, "happiness", 3, "New books"); }, resultText: () => "You read the first one before breakfast." },
      { label: "An art set", effect: (c) => { const s = (c.skills ??= {}); s.art = clamp((s.art ?? 0) + randomInt(3, 7)); changeStat(c, "happiness", 4, "An art set"); }, resultText: () => "The living room wall now has a mural." },
    ],
  },
  {
    id: "music-lessons-offer",
    minAge: 6,
    maxAge: 11,
    once: true,
    weight: 1.6,
    text: (c) => `${first(parent(c))} asks whether you'd like to learn an instrument.`,
    choices: [
      { label: "Piano", effect: (c) => { const s = (c.skills ??= {}); s.music = clamp((s.music ?? 0) + Math.round(randomInt(6, 12) * (0.6 + (c.talents?.musical ?? 50) / 100))); changeStat(c, "happiness", 2, "Learning piano"); }, resultText: () => "You practised scales until the neighbours complained." },
      { label: "Guitar", effect: (c) => { const s = (c.skills ??= {}); s.music = clamp((s.music ?? 0) + Math.round(randomInt(6, 12) * (0.6 + (c.talents?.musical ?? 50) / 100))); changeStat(c, "happiness", 3, "Learning guitar"); }, resultText: () => "Your fingertips hurt. You loved it." },
      { label: "Singing lessons", effect: (c) => { const s = (c.skills ??= {}); s.singing = clamp((s.singing ?? 0) + Math.round(randomInt(6, 12) * (0.6 + (c.talents?.musical ?? 50) / 100))); }, resultText: () => "You sang in the shower for a year." },
      { label: "No thanks", effect: () => {}, resultText: () => "Your parents shrug and let it go." },
    ],
  },
  {
    id: "sports-day",
    minAge: 6,
    maxAge: 12,
    weight: 1.5,
    text: () => "It's sports day. Parents are lining the field.",
    choices: [
      { label: "Give it everything", effect: (c) => { const p = 0.3 + ((c.talents?.athletic ?? 50) - 50) / 150 + (c.fitness ?? 50) / 400; if (Math.random() < p) { changeStat(c, "happiness", 6, "Winning a race"); c.popularity = clamp((c.popularity ?? 50) + 4); c.yearLog.push("You won your race!"); } else { changeStat(c, "happiness", 1, "Trying your best"); } gainFitness(c, 3); }, resultText: () => "Muddy, breathless and proud." },
      { label: "Fake a stomach ache", effect: (c) => { changeStat(c, "happiness", -1, "Skipping sports day"); c.conduct = clamp((c.conduct ?? 80) - 2); }, resultText: () => "You spent it on a bench in the nurse's office." },
    ],
  },
  {
    id: "class-clown",
    minAge: 7,
    maxAge: 12,
    weight: 1.3,
    condition: (c) => (c.personality?.e ?? 50) > 45,
    text: () => "You do an impression of your teacher. The class explodes with laughter - and the teacher is standing right behind you.",
    choices: [
      { label: "Bow", effect: (c) => { c.popularity = clamp((c.popularity ?? 50) + 6); c.conduct = clamp((c.conduct ?? 80) - 6); const t = c.relationships.find((r) => r.type === "teacher" && r.alive); if (t) t.level = clamp(t.level - 10); }, resultText: () => "Standing ovation. Then detention." },
      { label: "Apologise at once", effect: (c) => { const t = c.relationships.find((r) => r.type === "teacher" && r.alive); if (t) t.level = clamp(t.level + 4); c.popularity = clamp((c.popularity ?? 50) - 2); }, resultText: () => "You apologised, they smiled, everyone forgot." },
    ],
  },
  {
    id: "spelling-maths-contest",
    minAge: 8,
    maxAge: 12,
    weight: 1.3,
    condition: (c) => (c.talents?.academic ?? 50) > 55,
    text: () => "The school is running a maths and spelling contest. Your teacher thinks you should enter.",
    choices: [
      { label: "Enter and practise", effect: (c) => { const win = Math.random() < 0.3 + c.stats.smarts / 200; changeStat(c, "smarts", 2, "Competition practice"); if (win) { changeStat(c, "happiness", 6, "Winning the contest"); c.popularity = clamp((c.popularity ?? 50) + 3); c.yearLog.push("You came first in the contest."); } else changeStat(c, "happiness", 1, "Trying your best"); c.stress = clamp((c.stress ?? 25) + 4); }, resultText: () => "Hours of flash cards. It felt worth it." },
      { label: "Pass", effect: () => {}, resultText: () => "Not this time." },
    ],
  },
  {
    id: "school-recital",
    minAge: 6,
    maxAge: 12,
    weight: 1.3,
    text: () => "The class is putting on a show and you've been given a speaking part.",
    choices: [
      { label: "Throw yourself into it", effect: (c) => { const s = (c.skills ??= {}); s.acting = clamp((s.acting ?? 0) + randomInt(3, 7)); const ok = Math.random() < 0.7 + ((c.talents?.verbal ?? 50) - 50) / 250; changeStat(c, "happiness", ok ? 5 : -2, ok ? "A great performance" : "Stage fright"); }, resultText: () => "The lights came up and the words came out." },
      { label: "Beg to be a tree", effect: (c) => { changeStat(c, "happiness", 1, "Being a great tree"); }, resultText: () => "You were an excellent tree." },
    ],
  },
  {
    id: "bike-crash",
    minAge: 5,
    maxAge: 11,
    weight: 1,
    text: () => "You were racing your friends downhill on your bike when the ground suddenly came up to meet you.",
    choices: [
      { label: "Get straight back on", effect: (c) => { changeStat(c, "health", -3, "A grazed knee"); gainFitness(c, 3); if (c.personality) c.personality.n = clamp(c.personality.n - 1); }, resultText: () => "Bleeding knee, big grin." },
      { label: "Go home crying", effect: (c) => { changeStat(c, "health", -3, "A grazed knee"); bump(c, "both", 3); }, resultText: () => "A plaster, a hug and an ice lolly." },
    ],
  },
  {
    id: "sibling-fort",
    minAge: 4,
    maxAge: 11,
    weight: 1.4,
    condition: (c) => !!sibling(c),
    text: (c) => `You and ${first(sibling(c))} spend a whole rainy weekend building a fort out of every cushion in the house.`,
    choices: [
      { label: "Let them be the boss", effect: (c) => { const s = sibling(c); if (s) s.level = clamp(s.level + 8); }, resultText: () => "A generous king and an even happier one." },
      { label: "You're in charge", effect: (c) => { const s = sibling(c); if (s) s.level = clamp(s.level - 4); changeStat(c, "happiness", 2, "Being in charge"); if (c.personality) c.personality.a = clamp(c.personality.a - 1); }, resultText: () => "The fort collapsed during the argument." },
    ],
  },
  {
    id: "parents-argue",
    minAge: 5,
    maxAge: 12,
    weight: 1,
    condition: (c) => !!mother(c) && !!father(c),
    text: () => "Through the wall you hear your parents arguing - about money, or something you don't quite catch.",
    choices: [
      { label: "Put a pillow over your head", effect: (c) => { changeStat(c, "happiness", -3, "Hearing your parents argue"); c.stress = clamp((c.stress ?? 25) + 5); }, resultText: () => "It stopped eventually." },
      { label: "Go and sit with them", effect: (c) => { bump(c, "both", 3); changeStat(c, "happiness", -1, "Hearing your parents argue"); }, resultText: () => "They stopped when they saw you. Nobody said anything, but they both hugged you." },
    ],
  },
  {
    id: "growth-spurt",
    minAge: 9,
    maxAge: 12,
    once: true,
    weight: 1.6,
    text: () => "You've shot up. Half your clothes don't fit, and your knees ache at night.",
    autoEffect: (c) => {
      changeStat(c, "health", -1, "Growing pains");
      changeStat(c, "looks", -2, "An awkward phase");
      if (c.age >= 12) c.yearLog.push("You've suddenly become a lot more aware of how you look.");
    },
  },
  {
    id: "library-card",
    minAge: 5,
    maxAge: 10,
    once: true,
    weight: 1.4,
    text: () => "You got your own library card and it may be the best thing you've ever owned.",
    autoEffect: (c) => {
      changeStat(c, "smarts", 4, "Reading for fun");
      c.stress = clamp((c.stress ?? 25) - 2);
    },
  },
  {
    id: "school-uniform-drama",
    minAge: 9,
    maxAge: 12,
    weight: 1,
    text: (c) => `${classRank(c) < 2 ? "You're wearing a hand-me-down uniform and someone says something about it." : "You've got the coolest trainers in the year and somebody wants them."}`,
    choices: [
      { label: "Shrug it off", effect: (c) => { if (c.personality) c.personality.n = clamp(c.personality.n - 1); c.stress = clamp((c.stress ?? 25) - 1); }, resultText: () => "Nobody remembered by lunch." },
      { label: "Get upset", effect: (c) => { changeStat(c, "happiness", -3, "A nasty comment"); bump(c, "both", 2); }, resultText: () => "You told your parents, who told you that you're perfect." },
    ],
  },
  {
    id: "first-real-friend-fallout",
    minAge: 8,
    maxAge: 12,
    weight: 1.1,
    text: () => "Your best friend has been hanging out with someone else and hasn't saved you a seat at lunch.",
    choices: [
      { label: "Talk to them about it", effect: (c) => { const f = c.relationships.find((r) => r.type === "friend" || r.type === "classmate"); if (f) f.level = clamp(f.level + 8); changeStat(c, "happiness", 2, "Sorting it out"); }, resultText: () => "It turned out to be a misunderstanding." },
      { label: "Give them the silent treatment", effect: (c) => { const f = c.relationships.find((r) => r.type === "friend" || r.type === "classmate"); if (f) f.level = clamp(f.level - 10); changeStat(c, "happiness", -3, "A friendship on ice"); }, resultText: () => "You didn't speak for three weeks." },
    ],
  },
  {
    id: "pocket-money-saving",
    minAge: 6,
    maxAge: 12,
    once: true,
    weight: 1.4,
    condition: (c) => c.money > 30 && (c.background ? CLASSES[c.background.wealthClass].allowance > 0 : true),
    text: () => "You've got a bit of money in your piggy bank. There's a toy in the window you really want.",
    choices: [
      { label: "Spend it now", effect: (c) => { const cost = Math.min(c.money, 35); c.money -= cost; changeStat(c, "happiness", 5, "A new toy"); }, resultText: () => "Instant happiness. And an empty piggy bank." },
      { label: "Save up for something bigger", effect: (c) => { c.money += 15; if (c.personality) c.personality.c = clamp(c.personality.c + 2); changeStat(c, "happiness", 1, "Being patient"); }, resultText: () => "Patience pays. A little interest from Grandma helps." },
    ],
  },
];
