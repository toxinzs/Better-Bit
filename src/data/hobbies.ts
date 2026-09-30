import { TalentKey } from "../types";

// Things to do with your free time. Each has a level that grows while it's
// active, milestones along the way, and a showcase (a race, a gig, a show)
// that turns practice into something real.

export type HobbyCat = "sport" | "creative" | "mind" | "outdoor" | "tech" | "craft";

export type Reward = { money?: number; happy?: number; looks?: number; smarts?: number; network?: number };

export type HobbyDef = {
  key: string;
  label: string;
  icon: string; // Ionicons name
  cat: HobbyCat;
  minAge: number;
  cost: number; // baseline dollars a year
  talent: TalentKey;
  blurb: string;
  fitness?: number; // yearly fitness gain while active
  stress: number; // yearly stress eased
  happy: number; // yearly mood
  smarts?: number;
  looks?: number;
  milestones: { level: number; id: string; text: string; reward?: Reward }[];
  showcase?: { label: string; minLevel: number; cost: number; money: [number, number]; happy: number; win: string; lose: string; network?: number };
};

const m = (level: number, id: string, text: string, reward?: Reward) => ({ level, id, text, reward });

export const HOBBIES: HobbyDef[] = [
  { key: "running", label: "Running", icon: "walk", cat: "sport", minAge: 8, cost: 120, talent: "athletic", blurb: "Just you, your shoes and the road.", fitness: 4, stress: 6, happy: 1,
    milestones: [m(20, "run-5k", "You ran your first 5k without stopping.", { happy: 3 }), m(50, "run-10k", "You finished a 10k race.", { happy: 4, looks: 1 }), m(80, "run-marathon", "You ran a full marathon. Twenty-six miles you will never forget.", { happy: 10, network: 3 })],
    showcase: { label: "Enter a race", minLevel: 25, cost: 60, money: [0, 200], happy: 6, win: "You crossed the line with a personal best.", lose: "You blew up at mile eight and walked the rest.", network: 1 } },
  { key: "swimming", label: "Swimming", icon: "water", cat: "sport", minAge: 5, cost: 260, talent: "athletic", blurb: "Lengths, breathing and a clear head.", fitness: 5, stress: 5, happy: 1,
    milestones: [m(20, "swim-lengths", "You can swim a mile without stopping.", { happy: 3 }), m(60, "swim-club", "You joined the masters swimming club.", { happy: 3, network: 3 })],
    showcase: { label: "Swim a gala", minLevel: 30, cost: 50, money: [0, 100], happy: 5, win: "You touched the wall first.", lose: "You were nowhere near the front. Still, you finished." } },
  { key: "football", label: "Football", icon: "football", cat: "sport", minAge: 6, cost: 300, talent: "athletic", blurb: "Five-a-side, Sunday league or the real thing.", fitness: 5, stress: 4, happy: 2,
    milestones: [m(25, "fb-team", "You made the team.", { happy: 4, network: 3 }), m(60, "fb-captain", "They made you captain.", { happy: 5, network: 4 })],
    showcase: { label: "Play a big match", minLevel: 30, cost: 40, money: [0, 150], happy: 6, win: "You scored, and the whole touchline went wild.", lose: "A heavy defeat and a long, quiet bus ride home.", network: 2 } },
  { key: "basketball", label: "Basketball", icon: "basketball", cat: "sport", minAge: 8, cost: 250, talent: "athletic", blurb: "Pick-up games and a rim at the end of the street.", fitness: 5, stress: 4, happy: 2,
    milestones: [m(25, "bb-team", "You started every game at the rec league.", { happy: 3, network: 2 })],
    showcase: { label: "Play in a tournament", minLevel: 30, cost: 40, money: [0, 150], happy: 6, win: "You hit the shot at the buzzer.", lose: "You went out in the first round." } },
  { key: "tennis", label: "Tennis", icon: "tennisball", cat: "sport", minAge: 6, cost: 600, talent: "athletic", blurb: "Lessons, courts and a very good backhand.", fitness: 4, stress: 4, happy: 1,
    milestones: [m(30, "tn-club", "You joined the tennis club.", { happy: 3, network: 4 })],
    showcase: { label: "Enter a club tournament", minLevel: 30, cost: 80, money: [0, 250], happy: 5, win: "You won the final in three sets.", lose: "You lost in the quarter-finals." } },
  { key: "boxing", label: "Boxing", icon: "fitness", cat: "sport", minAge: 12, cost: 500, talent: "athletic", blurb: "Bags, pads and learning not to flinch.", fitness: 7, stress: 8, happy: 1,
    milestones: [m(35, "bx-spar", "You survived your first sparring match.", { happy: 3 })],
    showcase: { label: "Take an amateur bout", minLevel: 40, cost: 100, money: [0, 300], happy: 7, win: "You won on points.", lose: "You took some hard shots and lost the decision." } },
  { key: "cycling", label: "Cycling", icon: "bicycle", cat: "sport", minAge: 6, cost: 250, talent: "athletic", blurb: "Hills, headwinds and cake at the halfway stop.", fitness: 5, stress: 5, happy: 1,
    milestones: [m(35, "cy-century", "You rode a hundred miles in a day.", { happy: 5 })],
    showcase: { label: "Ride a sportive", minLevel: 30, cost: 70, money: [0, 100], happy: 5, win: "You beat your target time.", lose: "You struggled on the climbs and cramped up." } },
  { key: "yoga", label: "Yoga", icon: "body", cat: "sport", minAge: 10, cost: 300, talent: "athletic", blurb: "Balance, breath and being kind to your knees.", fitness: 3, stress: 8, happy: 2,
    milestones: [m(30, "yg-headstand", "You held a headstand.", { happy: 3 }), m(70, "yg-teach", "You were asked to teach a class.", { money: 600, network: 3 })] },
  { key: "hiking", label: "Hiking", icon: "trail-sign", cat: "outdoor", minAge: 5, cost: 200, talent: "athletic", blurb: "Boots, maps and a view worth the climb.", fitness: 4, stress: 7, happy: 2,
    milestones: [m(35, "hk-summit", "You reached the summit of a serious mountain.", { happy: 6 })],
    showcase: { label: "Take on a big trek", minLevel: 35, cost: 400, money: [0, 0], happy: 9, win: "Three days, no phone signal and the best view of your life.", lose: "The weather turned and you had to turn back." } },
  { key: "climbing", label: "Climbing", icon: "trending-up", cat: "sport", minAge: 10, cost: 500, talent: "athletic", blurb: "Problem-solving with your fingertips.", fitness: 6, stress: 6, happy: 2,
    milestones: [m(40, "cl-outdoor", "You led your first route outdoors.", { happy: 5 })],
    showcase: { label: "Enter a bouldering comp", minLevel: 35, cost: 40, money: [0, 100], happy: 6, win: "You topped every problem.", lose: "You fell on the last move." } },
  { key: "painting", label: "Painting", icon: "brush", cat: "creative", minAge: 5, cost: 300, talent: "artistic", blurb: "Colour, mess and finding out what you see.", stress: 6, happy: 2, looks: 0,
    milestones: [m(30, "pt-first", "You finished a painting you were proud of.", { happy: 4 }), m(60, "pt-show", "A café hung your work on its wall.", { happy: 5, network: 3 })],
    showcase: { label: "Exhibit and sell your work", minLevel: 45, cost: 150, money: [200, 4000], happy: 6, win: "You sold pieces and a stranger asked to commission you.", lose: "Nobody bought anything, but people stopped to look.", network: 3 } },
  { key: "photography", label: "Photography", icon: "camera", cat: "creative", minAge: 8, cost: 400, talent: "artistic", blurb: "Learning to see light.", stress: 5, happy: 2,
    milestones: [m(30, "ph-good", "You took a photo that made people stop scrolling.", { happy: 4 })],
    showcase: { label: "Sell prints or shoot an event", minLevel: 40, cost: 100, money: [150, 3000], happy: 5, win: "Clients loved the shoot and paid on the spot.", lose: "The light was awful and the client wasn't impressed.", network: 3 } },
  { key: "writing", label: "Writing", icon: "create", cat: "creative", minAge: 8, cost: 60, talent: "verbal", blurb: "Notebooks, drafts and a lot of deleting.", stress: 6, happy: 1, smarts: 1,
    milestones: [m(35, "wr-story", "You finished a short story.", { happy: 4, smarts: 1 }), m(65, "wr-novel", "You finished a whole novel.", { happy: 8, smarts: 1 })],
    showcase: { label: "Submit or publish your writing", minLevel: 50, cost: 40, money: [50, 6000], happy: 7, win: "A publisher said yes. Your name is on a cover.", lose: "A polite rejection, and a note to try again.", network: 2 } },
  { key: "guitar", label: "Guitar", icon: "musical-notes", cat: "creative", minAge: 7, cost: 300, talent: "musical", blurb: "Sore fingertips and three chords.", stress: 6, happy: 2,
    milestones: [m(25, "gt-song", "You played a whole song start to finish.", { happy: 4 }), m(55, "gt-band", "You joined a band.", { happy: 5, network: 4 })],
    showcase: { label: "Play a gig", minLevel: 40, cost: 50, money: [50, 1500], happy: 7, win: "The room sang along.", lose: "You forgot the second verse and laughed it off.", network: 3 } },
  { key: "piano", label: "Piano", icon: "musical-note", cat: "creative", minAge: 6, cost: 500, talent: "musical", blurb: "Scales, patience and one day, Chopin.", stress: 6, happy: 2, smarts: 1,
    milestones: [m(35, "pn-recital", "You played a recital.", { happy: 5 })],
    showcase: { label: "Perform a concert", minLevel: 45, cost: 60, money: [100, 2000], happy: 7, win: "The applause went on and on.", lose: "You lost your place, but recovered.", network: 3 } },
  { key: "dancing", label: "Dancing", icon: "musical-notes", cat: "creative", minAge: 5, cost: 500, talent: "musical", blurb: "Class, rhythm and a floor to yourself.", fitness: 4, stress: 6, happy: 2, looks: 1,
    milestones: [m(35, "dn-perform", "You danced in your first show.", { happy: 5 })],
    showcase: { label: "Enter a competition", minLevel: 35, cost: 90, money: [0, 800], happy: 6, win: "You won your category.", lose: "You didn't place, but you loved every second." } },
  { key: "cooking", label: "Cooking", icon: "restaurant", cat: "craft", minAge: 8, cost: 400, talent: "artistic", blurb: "Recipes, knives and dinner for people you love.", stress: 5, happy: 2,
    milestones: [m(30, "ck-dinner", "You cooked a dinner party for eight and nobody was ill.", { happy: 4, network: 2 })],
    showcase: { label: "Run a supper club", minLevel: 45, cost: 200, money: [200, 3000], happy: 6, win: "A full house and a waiting list.", lose: "The soufflé fell, but the wine saved the night.", network: 3 } },
  { key: "woodwork", label: "Woodworking & DIY", icon: "hammer", cat: "craft", minAge: 10, cost: 300, talent: "technical", blurb: "Sawdust, measuring twice and a very good shelf.", stress: 6, happy: 1,
    milestones: [m(30, "wd-shelf", "You built furniture that stands up.", { happy: 4 })],
    showcase: { label: "Sell at a craft fair", minLevel: 40, cost: 80, money: [100, 2500], happy: 5, win: "You sold out of everything.", lose: "A wet day and very few visitors.", network: 2 } },
  { key: "knitting", label: "Crafts & knitting", icon: "color-fill", cat: "craft", minAge: 7, cost: 100, talent: "artistic", blurb: "Yarn, glue guns and giving things away.", stress: 8, happy: 1,
    milestones: [m(30, "kn-gift", "You made presents for the whole family.", { happy: 4 })],
    showcase: { label: "Sell online or at a market", minLevel: 40, cost: 30, money: [50, 1500], happy: 5, win: "Orders came flooding in.", lose: "A quiet month.", network: 2 } },
  { key: "gardening", label: "Gardening", icon: "flower", cat: "outdoor", minAge: 6, cost: 150, talent: "technical", blurb: "Soil, seeds and unreasonable pride in a tomato.", fitness: 2, stress: 8, happy: 2,
    milestones: [m(30, "gd-harvest", "Your first proper harvest.", { happy: 4 })],
    showcase: { label: "Enter the flower show", minLevel: 40, cost: 20, money: [0, 100], happy: 5, win: "You took first prize in your class.", lose: "The slugs beat you to it." } },
  { key: "fishing", label: "Fishing", icon: "fish", cat: "outdoor", minAge: 5, cost: 150, talent: "technical", blurb: "Patience, flasks of tea and the one that got away.", stress: 9, happy: 2,
    milestones: [m(30, "fs-big", "You landed a monster.", { happy: 5 })],
    showcase: { label: "Enter a fishing contest", minLevel: 35, cost: 40, money: [0, 400], happy: 5, win: "Your catch topped the leaderboard.", lose: "Not a bite all day." } },
  { key: "chess", label: "Chess", icon: "extension-puzzle", cat: "mind", minAge: 6, cost: 40, talent: "academic", blurb: "Sixty-four squares and no luck involved.", stress: 4, happy: 1, smarts: 1,
    milestones: [m(35, "ch-club", "You beat the club champion.", { happy: 4, smarts: 1 })],
    showcase: { label: "Enter a tournament", minLevel: 35, cost: 40, money: [0, 500], happy: 6, win: "You went unbeaten across the weekend.", lose: "You blundered a queen in a won position.", network: 1 } },
  { key: "reading", label: "Reading", icon: "book", cat: "mind", minAge: 5, cost: 100, talent: "academic", blurb: "One more chapter, then you'll sleep.", stress: 7, happy: 1, smarts: 1,
    milestones: [m(40, "rd-hundred", "You finished your hundredth book.", { happy: 4, smarts: 2 })] },
  { key: "coding", label: "Coding projects", icon: "code-slash", cat: "tech", minAge: 10, cost: 100, talent: "technical", blurb: "Small programs, big ideas, a lot of bugs.", stress: 4, happy: 1, smarts: 1,
    milestones: [m(30, "cd-app", "You built something people actually use.", { happy: 4, smarts: 1 })],
    showcase: { label: "Launch your app or enter a hackathon", minLevel: 40, cost: 50, money: [0, 5000], happy: 6, win: "It took off, and money followed.", lose: "It crashed on stage. You fixed it by morning.", network: 4 } },
  { key: "gaming", label: "Gaming", icon: "game-controller", cat: "tech", minAge: 6, cost: 250, talent: "technical", blurb: "Consoles, controllers and just one more match.", stress: 6, happy: 2,
    milestones: [m(40, "gm-rank", "You hit the top ranks.", { happy: 4 })],
    showcase: { label: "Enter a tournament", minLevel: 45, cost: 60, money: [0, 3000], happy: 6, win: "You took the prize pool.", lose: "Knocked out in the first round.", network: 2 } },
];

export const hobbyDef = (k: string) => HOBBIES.find((h) => h.key === k);
export const MAX_ACTIVE = 3;
