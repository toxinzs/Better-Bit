import { Character, WorldState } from "../types";

// Things a life can add up to. Each is checked once a year. `progress`, when
// given, returns [have, goal] so the list can show how close you are.

export type AchCat = "Life" | "Learning" | "Career" | "Money" | "Love & family" | "World" | "Body & mind" | "Wild cards";

export type Achievement = {
  key: string;
  label: string;
  hint: string;
  cat: AchCat;
  icon: string;
  points: number;
  test: (c: Character, w?: WorldState) => boolean;
  progress?: (c: Character) => [number, number];
};

const partner = (c: Character) => c.relationships.find((r) => r.type === "partner" && r.alive);
const kids = (c: Character) => c.relationships.filter((r) => r.type === "child").length;
const hobbyLevel = (c: Character) => Math.max(0, ...Object.values(c.hobbies ?? {}).map((h) => h.level));
const skilledHobbies = (c: Character) => Object.values(c.hobbies ?? {}).filter((h) => h.level >= 40).length;
const wealth = (c: Character) => c.money + (c.home ? c.home.value - c.home.mortgageBalance : 0) + (c.car?.value ?? 0) + (c.rentals ?? []).reduce((s, r) => s + r.value, 0) + (c.retirement?.balance ?? 0) - (c.loans ?? []).reduce((s, l) => s + l.balance, 0);
const logged = (c: Character, re: RegExp) => c.fullLog.some((l) => re.test(l.text));
const languages = (c: Character) => Object.values(c.languages ?? {}).filter((v) => (v ?? 0) >= 50).length;
const A = (key: string, label: string, hint: string, cat: AchCat, icon: string, points: number, test: Achievement["test"], progress?: Achievement["progress"]): Achievement => ({ key, label, hint, cat, icon, points, test, progress });

export const ACHIEVEMENTS: Achievement[] = [
  // ---------------------------------------------------------------- Life
  A("age-18", "Grown up", "Turn 18", "Life", "sparkles", 5, (c) => c.age >= 18),
  A("age-30", "Thirty, flirty and thriving", "Turn 30", "Life", "sparkles", 5, (c) => c.age >= 30),
  A("age-50", "Half a century", "Turn 50", "Life", "sparkles", 8, (c) => c.age >= 50),
  A("age-70", "Seventy and still going", "Turn 70", "Life", "sparkles", 10, (c) => c.age >= 70),
  A("age-90", "Nonagenarian", "Turn 90", "Life", "sparkles", 20, (c) => c.age >= 90),
  A("age-100", "A hundred years", "Turn 100", "Life", "trophy", 40, (c) => c.age >= 100),
  A("moved-3", "Wanderer", "Move home three times", "Life", "swap-horizontal", 6, (c) => (c.moves ?? 0) >= 3, (c) => [c.moves ?? 0, 3]),
  A("homeowner", "Keys in your hand", "Own your own home", "Life", "home", 8, (c) => !!c.home),
  A("landlord", "Landlord", "Own a rental property", "Life", "business", 8, (c) => (c.rentals ?? []).length > 0),
  A("car", "On the road", "Own a car", "Life", "car", 3, (c) => !!c.car),
  // ---------------------------------------------------------------- Learning
  A("diploma", "Diploma", "Finish school", "Learning", "school", 6, (c) => c.educationStage === "graduated" || c.hasCollegeDegree || (c.degrees ?? []).length > 0),
  A("degree", "Graduate", "Earn a university degree", "Learning", "ribbon", 12, (c) => c.hasCollegeDegree || (c.degrees ?? []).length > 0),
  A("postgrad", "Higher still", "Earn a master's, professional degree or doctorate", "Learning", "medal", 18, (c) => (c.degrees ?? []).some((d) => ["master", "professional", "doctorate"].includes(String(d.level)))),
  A("honour", "Honour roll", "Make the honour roll at school", "Learning", "star", 6, (c) => (c.reportCards ?? []).some((r) => r.honor)),
  A("smart-90", "Big brain", "Reach 90 smarts", "Learning", "bulb", 8, (c) => c.stats.smarts >= 90),
  A("polyglot", "Polyglot", "Reach conversational level in three languages", "Learning", "language", 12, (c) => languages(c) >= 3, (c) => [languages(c), 3]),
  A("trade", "A trade in your hands", "Earn a trade certificate", "Learning", "hammer", 8, (c) => (c.degrees ?? []).some((d) => d.level === "certificate")),
  // ---------------------------------------------------------------- Career
  A("first-job", "Pay cheque", "Get your first job", "Career", "briefcase", 4, (c) => (c.jobHistory ?? []).length > 0 || !!c.job),
  A("promoted", "Moving up", "Get promoted", "Career", "trending-up", 8, (c) => (c.promotions ?? 0) >= 1),
  A("manager", "The boss", "Reach manager level", "Career", "people", 12, (c) => (c.job?.rung ?? 0) >= 3 || (c.promotions ?? 0) >= 3),
  A("executive", "Corner office", "Reach the top of a career ladder", "Career", "diamond", 25, (c) => (c.job?.rung ?? 0) >= 5),
  A("veteran", "Old hand", "Ten years in one field", "Career", "hourglass", 10, (c) => Math.max(0, ...Object.values(c.fieldYears ?? {})) >= 10, (c) => [Math.max(0, ...Object.values(c.fieldYears ?? {})), 10]),
  A("founder", "Founder", "Start a business", "Career", "storefront", 10, (c) => !!c.business || logged(c, /You started a business/)),
  A("profit-100k", "In the black", "Make $100,000 of lifetime profit in a business", "Career", "cash", 15, (c) => (c.business?.totalProfit ?? 0) >= 100000, (c) => [Math.max(0, c.business?.totalProfit ?? 0), 100000]),
  A("exit", "The exit", "Sell a business", "Career", "swap-vertical", 15, (c) => logged(c, /You sold .* for/) && !c.business),
  A("retired", "Well earned", "Retire", "Career", "sunny", 10, (c) => !!c.retired),
  A("networker", "Well connected", "Reach a professional network of 70", "Career", "share-social", 6, (c) => (c.network ?? 0) >= 70, (c) => [Math.round(c.network ?? 0), 70]),
  // ---------------------------------------------------------------- Money
  A("nw-10k", "Rainy-day fund", "Be worth $10,000", "Money", "wallet", 4, (c) => wealth(c) >= 10000, (c) => [Math.max(0, Math.round(wealth(c))), 10000]),
  A("nw-100k", "Six figures", "Be worth $100,000", "Money", "wallet", 8, (c) => wealth(c) >= 100000, (c) => [Math.max(0, Math.round(wealth(c))), 100000]),
  A("nw-1m", "Millionaire", "Be worth $1,000,000", "Money", "diamond", 20, (c) => wealth(c) >= 1000000, (c) => [Math.max(0, Math.round(wealth(c))), 1000000]),
  A("nw-10m", "Ten million", "Be worth $10,000,000", "Money", "diamond", 35, (c) => wealth(c) >= 10000000, (c) => [Math.max(0, Math.round(wealth(c))), 10000000]),
  A("investor", "Investor", "Own investments", "Money", "stats-chart", 5, (c) => (c.portfolio ?? []).length > 0),
  A("debt-free", "Debt-free", "Clear all your loans", "Money", "checkmark-circle", 8, (c) => c.age >= 22 && (c.loans ?? []).length === 0 && (c.fullLog.some((l) => /paid off/i.test(l.text)) || logged(c, /You paid off/))),
  A("rock-bottom", "Rock bottom", "Go bankrupt", "Money", "warning", 2, (c) => c.bankruptAge !== undefined),
  A("comeback", "The comeback", "Recover from bankruptcy and be worth $50,000", "Money", "refresh", 20, (c) => c.bankruptAge !== undefined && wealth(c) >= 50000),
  // ---------------------------------------------------------------- Love & family
  A("first-love", "First love", "Have a partner", "Love & family", "heart", 5, (c) => !!partner(c) || logged(c, /partner|dating|boyfriend|girlfriend/i)),
  A("married", "Just married", "Get married", "Love & family", "heart-circle", 12, (c) => c.relationships.some((r) => r.type === "partner" && r.married)),
  A("first-child", "Parent", "Have a child", "Love & family", "happy", 12, (c) => kids(c) >= 1),
  A("big-family", "Full house", "Have three children", "Love & family", "people", 15, (c) => kids(c) >= 3, (c) => [kids(c), 3]),
  A("grandparent", "Grandparent", "Have a grandchild", "Love & family", "flower", 15, (c) => c.relationships.some((r) => r.type === "grandchild")),
  A("close-friends", "A full address book", "Have five close friends", "Love & family", "chatbubbles", 8, (c) => c.relationships.filter((r) => r.alive && r.type === "friend" && r.level >= 60).length >= 5, (c) => [c.relationships.filter((r) => r.alive && r.type === "friend" && r.level >= 60).length, 5]),
  A("popular", "Everyone's friend", "Reach 85 popularity at school", "Love & family", "megaphone", 5, (c) => (c.popularity ?? 0) >= 85),
  // ---------------------------------------------------------------- World
  A("abroad", "Emigrant", "Live in another country", "World", "airplane", 12, (c) => (c.abroadYears ?? 0) >= 1 || logged(c, /emigrated/)),
  A("citizen", "Two passports", "Hold a second citizenship", "World", "id-card", 20, (c) => (c.citizenships ?? []).length >= 2),
  A("globetrotter", "Globetrotter", "Visit three other countries", "World", "earth", 8, (c) => (c.visited ?? []).length >= 3, (c) => [(c.visited ?? []).length, 3]),
  A("world-tour", "World tour", "Get stamps from eight countries", "World", "map", 20, (c) => (c.visited ?? []).length >= 8, (c) => [(c.visited ?? []).length, 8]),
  A("home-again", "Home again", "Return to your birth country after years abroad", "World", "home", 10, (c) => (c.abroadYears ?? 0) >= 3 && c.originRegion === c.birthRegion),
  // ---------------------------------------------------------------- Body & mind
  A("fit", "In great shape", "Reach 80 fitness", "Body & mind", "barbell", 8, (c) => (c.fitness ?? 0) >= 80, (c) => [Math.round(c.fitness ?? 0), 80]),
  A("marathon", "Marathoner", "Run a marathon", "Body & mind", "walk", 15, (c) => !!c.hobbies?.running?.done?.includes("run-marathon")),
  A("master", "Master of something", "Reach master level in a hobby", "Body & mind", "medal", 15, (c) => hobbyLevel(c) >= 85, (c) => [hobbyLevel(c), 85]),
  A("renaissance", "Renaissance", "Reach skilled level in three hobbies", "Body & mind", "color-palette", 12, (c) => skilledHobbies(c) >= 3, (c) => [skilledHobbies(c), 3]),
  A("clean", "Clean and proud", "Stay clean for three years after an addiction", "Body & mind", "shield-checkmark", 20, (c) => (c.addictions ?? []).some((a) => a.quitting && (a.clean ?? 0) >= 3) || logged(c, /Three years clear/)),
  A("giver", "Giver", "Volunteer for five years", "Body & mind", "hand-left", 10, (c) => (c.volunteerYears ?? 0) >= 5, (c) => [c.volunteerYears ?? 0, 5]),
  A("looker", "Head-turner", "Reach 85 looks", "Body & mind", "eye", 5, (c) => c.stats.looks >= 85),
  A("healthy-old", "Healthy and old", "Reach 75 with health above 70", "Body & mind", "pulse", 15, (c) => c.age >= 75 && c.stats.health >= 70),
  A("happy", "Genuinely happy", "Reach happiness 95", "Body & mind", "happy", 8, (c) => c.stats.happiness >= 95),
  // ---------------------------------------------------------------- Wild cards
  A("lottery", "Jackpot", "Win the lottery", "Wild cards", "ticket", 30, (c) => logged(c, /won the lottery/i)),
  A("overdose", "Second chance", "Survive an overdose", "Wild cards", "medkit", 2, (c) => logged(c, /survived an overdose/i)),
  A("record", "On the wrong side", "Get a criminal record", "Wild cards", "hand-right", 1, (c) => !!c.criminalRecord || (c.jailYearsTotal ?? 0) > 0),
  A("whistle", "Whistleblower", "Speak up when it costs you", "Wild cards", "megaphone", 5, (c) => logged(c, /pushed out for it|Doing the right thing/i)),
  A("long-haul", "The long haul", "Work for twenty years", "Wild cards", "hourglass", 10, (c) => (c.workYears ?? 0) >= 20, (c) => [c.workYears ?? 0, 20]),
];

export const achievementDef = (k: string) => ACHIEVEMENTS.find((a) => a.key === k);
export const ACH_CATS: AchCat[] = ["Life", "Learning", "Career", "Money", "Love & family", "World", "Body & mind", "Wild cards"];
