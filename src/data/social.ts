import { Cadence, PlatformKey, PostStyle, QualityTier, TalentKey } from "../types";

// Fame & social media (v2.9): the platforms, what people make on them, who pays
// for it and what the comment section says. The rules live in engine/creator.ts.

// ---------------------------------------------------------------- platforms

export type PlatformDef = {
  key: PlatformKey;
  label: string;
  short: string;
  icon: string; // Ionicons name
  color: string;
  minAge: number;
  form: "video" | "short" | "photo" | "text" | "live" | "audio";
  post: string; // what one piece of content is called
  people: string; // what your audience is called
  scale: number; // how big a niche can get here (1 = the baseline)
  viral: number; // how easily things take off
  retention: number; // how sticky followers are (0-1)
  adYield: number; // baseline dollars per follower per year from ads, at weekly posting
  sponsor: number; // baseline dollars per follower per sponsored post
  subRate: number; // share of followers who pay a monthly subscription
  subPrice: number; // baseline dollars per year for a paying member
  monetise: number; // followers needed to earn from the platform itself
  monetiseName: string;
  verify: number; // followers before you're offered the tick
  bestFor: string;
};

export const PLATFORMS: PlatformDef[] = [
  { key: "youtube", label: "YouTube", short: "YT", icon: "logo-youtube", color: "#ff2d3d", minAge: 13, form: "video", post: "video", people: "subscribers", scale: 1, viral: 0.7, retention: 0.9, adYield: 0.07, sponsor: 0.03, subRate: 0.002, subPrice: 60, monetise: 1000, monetiseName: "the Partner Programme", verify: 100000, bestFor: "Long videos, tutorials, stories and anything people search for. Slow to build, sticky once you have it." },
  { key: "tiktok", label: "TikTok", short: "TT", icon: "logo-tiktok", color: "#25d8d0", minAge: 13, form: "short", post: "clip", people: "followers", scale: 1.25, viral: 1.55, retention: 0.5, adYield: 0.012, sponsor: 0.012, subRate: 0.001, subPrice: 30, monetise: 10000, monetiseName: "the Creator Fund", verify: 50000, bestFor: "Short clips and trends. The fastest way to blow up, and the fastest way to be forgotten." },
  { key: "instagram", label: "Instagram", short: "IG", icon: "logo-instagram", color: "#e1306c", minAge: 13, form: "photo", post: "post", people: "followers", scale: 1, viral: 1, retention: 0.8, adYield: 0.008, sponsor: 0.04, subRate: 0.002, subPrice: 40, monetise: 10000, monetiseName: "creator bonuses", verify: 30000, bestFor: "Photos, reels and looking good. Brands pay best here." },
  { key: "x", label: "X (Twitter)", short: "X", icon: "logo-x", color: "#9aa5b1", minAge: 13, form: "text", post: "post", people: "followers", scale: 0.8, viral: 1.35, retention: 0.6, adYield: 0.006, sponsor: 0.015, subRate: 0.0015, subPrice: 30, monetise: 5000, monetiseName: "Premium payouts", verify: 10000, bestFor: "Hot takes, threads and timing. Wit wins, and pile-ons are always one post away." },
  { key: "twitch", label: "Twitch", short: "TW", icon: "logo-twitch", color: "#9146ff", minAge: 13, form: "live", post: "stream", people: "followers", scale: 0.25, viral: 0.5, retention: 0.85, adYield: 0.03, sponsor: 0.05, subRate: 0.012, subPrice: 45, monetise: 100, monetiseName: "Affiliate", verify: 25000, bestFor: "Live streaming. Smaller numbers, but a loyal crowd who pay to be there." },
  { key: "podcast", label: "Podcast", short: "PC", icon: "mic", color: "#2dd47a", minAge: 14, form: "audio", post: "episode", people: "listeners", scale: 0.3, viral: 0.35, retention: 0.95, adYield: 0.09, sponsor: 0.08, subRate: 0.005, subPrice: 60, monetise: 500, monetiseName: "an ad network", verify: 50000, bestFor: "Long conversations and expertise. The slowest growth and the most loyal audience of all." },
];

export const platformDef = (k: PlatformKey | string | undefined): PlatformDef => PLATFORMS.find((p) => p.key === k) ?? PLATFORMS[0];

// ---------------------------------------------------------------- niches

export type NicheDef = {
  key: string;
  label: string;
  icon: string;
  cat: "Entertainment" | "Look & lifestyle" | "Knowledge" | "Craft & hobby";
  ceiling: number; // the most followers this niche can hold at platform scale 1
  viral: number; // how likely a post is to take off
  loyalty: number; // how much the audience sticks around and buys
  cpm: number; // how much advertisers pay to reach this crowd
  brand: number; // how much brands want to be near it
  risk: number; // how often it drags you into trouble
  talent: TalentKey;
  hobbies: string[]; // hobbies that make you better at it
  minAge: number;
  fit: Partial<Record<PlatformKey, number>>; // how well it does on each platform
  blurb: string;
};

const F = (s: string): Partial<Record<PlatformKey, number>> => {
  const m: Record<string, PlatformKey> = { y: "youtube", t: "tiktok", i: "instagram", x: "x", w: "twitch", p: "podcast" };
  const out: Partial<Record<PlatformKey, number>> = {};
  for (const part of s.split(" ")) {
    const [k, v] = part.split(":");
    out[m[k]] = Number(v);
  }
  return out;
};
const N = (key: string, label: string, icon: string, cat: NicheDef["cat"], ceilingM: number, viral: number, loyalty: number, cpm: number, brand: number, risk: number, talent: TalentKey, hobbies: string[], minAge: number, fit: string, blurb: string): NicheDef => ({
  key, label, icon, cat, ceiling: Math.round(ceilingM * 1_000_000), viral, loyalty, cpm, brand, risk, talent, hobbies, minAge, fit: F(fit), blurb,
});

export const NICHES: NicheDef[] = [
  // ---- entertainment: huge ceilings, crowded, hits and misses
  N("comedy", "Comedy & sketches", "happy", "Entertainment", 80, 1.3, 0.8, 1, 0.9, 0.12, "social", [], 13, "y:1 t:1.3 i:0.8 x:1.3 w:0.6 p:0.9", "Make people laugh. Everyone's trying, and a few break through."),
  N("gaming", "Gaming", "game-controller", "Entertainment", 120, 1.1, 1.1, 0.8, 1, 0.08, "technical", ["gaming"], 13, "y:1.2 t:0.9 i:0.3 x:0.5 w:1.5 p:0.3", "Playthroughs, guides and streams. The biggest crowd and the most competition."),
  N("pranks", "Pranks & stunts", "flash", "Entertainment", 60, 1.6, 0.5, 0.7, 0.5, 0.35, "social", [], 13, "y:1.1 t:1.4 i:0.6 x:0.7 w:0.4 p:0.1", "Big reactions, big views, big trouble."),
  N("drama", "Commentary & drama", "chatbubbles", "Entertainment", 40, 1.3, 0.7, 0.9, 0.6, 0.3, "verbal", [], 15, "y:1.2 t:1 i:0.4 x:1.4 w:0.7 p:0.9", "Weigh in on whatever everyone's arguing about."),
  N("music", "Music & covers", "musical-notes", "Entertainment", 50, 1.2, 1, 1, 0.9, 0.05, "musical", ["guitar", "piano"], 13, "y:1 t:1.3 i:0.8 x:0.4 w:0.7 p:0.5", "Covers, originals and playing for whoever will listen."),
  N("dance", "Dance", "body", "Entertainment", 70, 1.5, 0.7, 0.8, 1.1, 0.04, "musical", ["dancing"], 13, "y:0.5 t:1.6 i:1.2 x:0.1 w:0.3 p:0", "Choreography and trends. Made for the short clip."),
  N("memes", "Memes & shitposts", "sparkles", "Entertainment", 40, 1.5, 0.5, 0.5, 0.5, 0.2, "social", [], 13, "y:0.4 t:1.4 i:1 x:1.6 w:0.2 p:0", "Be online enough to know what's funny by breakfast."),
  N("vlogs", "Daily vlogs", "videocam", "Entertainment", 60, 1, 1.2, 1, 1.1, 0.14, "social", [], 13, "y:1.3 t:1 i:1 x:0.4 w:0.7 p:0.3", "Just your life, filmed. It works if people like being around you."),
  // ---- look & lifestyle
  N("beauty", "Beauty & makeup", "color-wand", "Look & lifestyle", 50, 1.1, 1, 1.6, 1.4, 0.07, "artistic", [], 13, "y:1.2 t:1.2 i:1.4 x:0.3 w:0.3 p:0", "Tutorials, reviews and transformations."),
  N("fashion", "Fashion & style", "shirt", "Look & lifestyle", 40, 1.1, 0.9, 1.3, 1.4, 0.06, "artistic", [], 13, "y:0.7 t:1.2 i:1.5 x:0.3 w:0.1 p:0", "Outfits, hauls and knowing what's next."),
  N("fitness", "Fitness & training", "barbell", "Look & lifestyle", 40, 1, 1, 1.4, 1.3, 0.08, "athletic", ["running", "boxing", "yoga", "climbing", "swimming", "cycling"], 14, "y:1.2 t:1.2 i:1.3 x:0.3 w:0.4 p:0.3", "Workouts, plans and before-and-afters."),
  N("travel", "Travel", "airplane", "Look & lifestyle", 30, 1, 0.9, 1.5, 1.3, 0.06, "social", ["hiking"], 15, "y:1.2 t:1.1 i:1.4 x:0.3 w:0.3 p:0.2", "See the world and take everyone with you. It's expensive to fake."),
  N("food", "Cooking & food", "restaurant", "Look & lifestyle", 30, 1.1, 1, 1.3, 1.3, 0.04, "artistic", ["cooking"], 13, "y:1.2 t:1.4 i:1.3 x:0.3 w:0.3 p:0.3", "Recipes, restaurants and things that look delicious."),
  N("pets", "Pets & animals", "paw", "Look & lifestyle", 40, 1.4, 1, 1, 1.2, 0.03, "social", [], 13, "y:1 t:1.5 i:1.3 x:0.5 w:0.2 p:0", "Cute, funny and impossible to be mean about."),
  N("family", "Family & parenting", "people", "Look & lifestyle", 20, 0.9, 1.2, 1.3, 1.4, 0.18, "social", [], 18, "y:1 t:0.9 i:1.4 x:0.4 w:0.1 p:0.7", "Life with kids. Brands love it and the kids never signed up for it."),
  N("wellness", "Wellness & mindfulness", "flower", "Look & lifestyle", 15, 0.8, 1.2, 1.2, 1.2, 0.08, "social", ["yoga"], 15, "y:0.9 t:1 i:1.3 x:0.3 w:0.2 p:0.9", "Calm, sleep and being kind to yourself."),
  N("vanlife", "Van life & minimalism", "bus", "Look & lifestyle", 6, 0.7, 1.4, 1.1, 1, 0.04, "social", ["hiking"], 18, "y:1.3 t:0.8 i:1.1 x:0.2 w:0.1 p:0.3", "Less stuff, more road."),
  // ---- knowledge
  N("education", "Explainers & education", "school", "Knowledge", 20, 0.8, 1.2, 1.6, 1, 0.05, "academic", ["reading"], 14, "y:1.4 t:1.1 i:0.4 x:0.7 w:0.2 p:0.9", "Explain something well and people will thank you for it."),
  N("science", "Science & space", "planet", "Knowledge", 15, 0.75, 1.3, 1.3, 1, 0.04, "academic", [], 14, "y:1.4 t:1 i:0.3 x:0.5 w:0.2 p:0.8", "Experiments, big questions and things that are further away than you think."),
  N("finance", "Money & investing", "cash", "Knowledge", 12, 0.7, 1, 2.5, 1.3, 0.14, "business", [], 16, "y:1.4 t:1 i:0.5 x:1.3 w:0.2 p:1.1", "Budgets, stocks and financial advice. Advertisers pay the most for this crowd."),
  N("tech", "Tech reviews", "hardware-chip", "Knowledge", 20, 0.8, 1, 2, 1.4, 0.06, "technical", ["coding"], 14, "y:1.5 t:1 i:0.4 x:0.9 w:0.3 p:0.4", "Gadgets, unboxings and honest verdicts."),
  N("coding", "Coding & software", "code-slash", "Knowledge", 6, 0.6, 1.3, 2, 1.2, 0.03, "technical", ["coding"], 14, "y:1.4 t:0.8 i:0.2 x:0.9 w:0.9 p:0.5", "Build things on screen. Small, smart and well paid."),
  N("history", "History & documentaries", "library", "Knowledge", 12, 0.7, 1.3, 1.1, 0.9, 0.06, "verbal", ["reading"], 14, "y:1.4 t:0.8 i:0.2 x:0.6 w:0.2 p:1.3", "The past, told well."),
  N("truecrime", "True crime & mysteries", "search", "Knowledge", 15, 1.1, 1.3, 1.2, 0.8, 0.15, "verbal", [], 16, "y:1.2 t:0.9 i:0.2 x:0.5 w:0.3 p:1.6", "Cases, theories and a lot of loyal listeners."),
  N("news", "News & politics", "newspaper", "Knowledge", 25, 1, 0.9, 1.2, 0.4, 0.4, "verbal", [], 16, "y:1 t:0.9 i:0.3 x:1.6 w:0.5 p:1.3", "Take a side. Half the internet will love you and half will not."),
  N("language", "Language learning", "language", "Knowledge", 6, 0.6, 1.3, 1.6, 1.2, 0.02, "verbal", [], 14, "y:1.3 t:1.1 i:0.5 x:0.3 w:0.1 p:1.2", "Teach people to speak."),
  N("cars", "Cars & motorbikes", "car", "Knowledge", 15, 0.9, 1.1, 1.7, 1.3, 0.1, "technical", [], 14, "y:1.4 t:1.2 i:0.9 x:0.4 w:0.2 p:0.4", "Builds, reviews and burnouts."),
  N("sports", "Sports takes", "football", "Knowledge", 30, 1, 1, 1.3, 1.2, 0.15, "athletic", ["football", "basketball", "tennis"], 14, "y:1.1 t:1.2 i:0.6 x:1.5 w:0.6 p:1.2", "Highlights, hot takes and arguing about the weekend's games."),
  N("books", "Books & writing", "book", "Knowledge", 4, 0.5, 1.4, 1, 0.9, 0.03, "verbal", ["reading", "writing"], 13, "y:1 t:1.3 i:0.9 x:0.8 w:0.1 p:1.2", "Reviews, recommendations and reading out loud."),
  // ---- craft & hobby: small ceilings, sticky audiences, slow and steady
  N("art", "Drawing & painting", "brush", "Craft & hobby", 15, 0.9, 1.2, 1, 1.1, 0.03, "artistic", ["painting"], 13, "y:1.2 t:1.2 i:1.4 x:0.4 w:0.5 p:0.1", "Time-lapses, tutorials and finished pieces."),
  N("photography", "Photography", "camera", "Craft & hobby", 10, 0.8, 1.1, 1.3, 1.2, 0.02, "artistic", ["photography"], 13, "y:0.9 t:0.8 i:1.6 x:0.4 w:0.1 p:0", "Light, place and patience."),
  N("crafts", "Crafts & knitting", "cut", "Craft & hobby", 2.5, 0.5, 1.7, 1, 1.1, 0.02, "artistic", ["knitting"], 13, "y:1.3 t:1 i:1.2 x:0.2 w:0.4 p:0.2", "Small crowd, big hearts. They'll buy anything you make."),
  N("gardening", "Gardening & plants", "leaf", "Craft & hobby", 3, 0.5, 1.6, 1.2, 1.2, 0.02, "artistic", ["gardening"], 13, "y:1.3 t:1 i:1.2 x:0.2 w:0.2 p:0.6", "Seeds, soil and a slow, loyal following."),
  N("woodwork", "Woodwork & DIY", "hammer", "Craft & hobby", 4, 0.6, 1.5, 1.4, 1.2, 0.03, "technical", ["woodwork"], 13, "y:1.4 t:1.1 i:0.9 x:0.2 w:0.3 p:0.3", "Build something, film it, repeat."),
  N("fishing", "Fishing & outdoors", "fish", "Craft & hobby", 3, 0.5, 1.5, 1.2, 1.1, 0.03, "athletic", ["fishing", "hiking"], 13, "y:1.4 t:0.9 i:0.7 x:0.2 w:0.5 p:0.4", "Quiet water and patient viewers."),
  N("chess", "Chess & board games", "extension-puzzle", "Craft & hobby", 8, 0.7, 1.3, 1, 1, 0.03, "academic", ["chess"], 13, "y:1.3 t:0.9 i:0.2 x:0.5 w:1.3 p:0.4", "Openings, blunders and live games."),
  N("asmr", "ASMR & relaxation", "moon", "Craft & hobby", 12, 0.8, 1.5, 0.9, 0.9, 0.03, "social", [], 15, "y:1.3 t:1 i:0.2 x:0 w:0.6 p:0.7", "Quiet sounds for people who can't sleep. Devoted fans."),
  N("retro", "Retro tech & collecting", "tv", "Craft & hobby", 1.2, 0.4, 1.7, 1.1, 0.9, 0.02, "technical", ["coding"], 13, "y:1.4 t:0.8 i:0.6 x:0.4 w:0.5 p:0.5", "Old computers, old games, a tiny and obsessed audience."),
  N("nature", "Nature & birdwatching", "eye", "Craft & hobby", 0.9, 0.3, 1.8, 1, 1, 0.02, "athletic", ["hiking"], 13, "y:1.4 t:0.8 i:0.9 x:0.3 w:0.1 p:0.6", "A very small, very kind community."),
  N("local", "Your town & local history", "map", "Craft & hobby", 0.4, 0.3, 1.8, 0.8, 0.8, 0.03, "social", [], 13, "y:1.3 t:0.8 i:0.8 x:0.8 w:0.1 p:1", "Everyone in your town will know you, and hardly anyone else will."),
  N("poetry", "Poetry & short stories", "create", "Craft & hobby", 2, 0.5, 1.5, 0.8, 0.8, 0.02, "verbal", ["writing"], 13, "y:0.6 t:1 i:1.2 x:1.3 w:0.1 p:0.9", "Words that stop the scroll."),
];

export const nicheDef = (k: string | undefined): NicheDef => NICHES.find((n) => n.key === k) ?? NICHES[0];

// ---------------------------------------------------------------- plan choices

export type CadenceDef = { key: Cadence; label: string; posts: number; effort: number; burnout: number; stress: number; blurb: string };
export const CADENCES: CadenceDef[] = [
  { key: "off", label: "On a break", posts: 0, effort: 0, burnout: -14, stress: -4, blurb: "Nothing new. Your audience drifts, but you get to rest." },
  { key: "casual", label: "Now and then", posts: 12, effort: 0.55, burnout: -3, stress: 0, blurb: "About once a month. Fine as a hobby." },
  { key: "steady", label: "Every week", posts: 52, effort: 1, burnout: 3, stress: 2, blurb: "A proper schedule. Fits alongside school or a job." },
  { key: "daily", label: "Every day", posts: 250, effort: 1.55, burnout: 12, stress: 6, blurb: "The algorithm loves it. You'll need real time, or a team." },
  { key: "grind", label: "Nonstop", posts: 600, effort: 1.95, burnout: 24, stress: 11, blurb: "Several a day. It works, until it doesn't." },
];
export const cadenceDef = (k: Cadence | undefined): CadenceDef => CADENCES.find((c) => c.key === k) ?? CADENCES[1];

export type GearDef = { key: QualityTier; label: string; cost: number; bonus: number; blurb: string };
export const GEAR: GearDef[] = [
  { key: "phone", label: "Just a phone", cost: 0, bonus: 0, blurb: "Free, and it shows." },
  { key: "home", label: "Home setup", cost: 700, bonus: 9, blurb: "A decent mic, a light and a good camera." },
  { key: "studio", label: "Proper studio", cost: 6000, bonus: 18, blurb: "A dedicated space and professional kit." },
  { key: "pro", label: "Pro production", cost: 45000, bonus: 28, blurb: "A crew, lighting, sets and post-production." },
];
export const gearDef = (k: QualityTier | undefined): GearDef => GEAR.find((g) => g.key === k) ?? GEAR[0];

export type StyleDef = { key: PostStyle; label: string; viral: number; image: number; risk: number; brand: number; blurb: string };
export const STYLES: StyleDef[] = [
  { key: "wholesome", label: "Wholesome", viral: 0.78, image: 2, risk: 0.02, brand: 1.25, blurb: "Kind, safe and brand-friendly. Rarely goes off like a bomb." },
  { key: "standard", label: "Straight down the middle", viral: 1, image: 0, risk: 0.06, brand: 1, blurb: "Just make good content." },
  { key: "edgy", label: "Edgy", viral: 1.3, image: -1, risk: 0.16, brand: 0.8, blurb: "Spicy takes and pushing your luck. More reach, more trouble." },
  { key: "bait", label: "Outrage bait", viral: 1.9, image: -5, risk: 0.34, brand: 0.5, blurb: "Say the thing that makes them furious. It works, right up until it doesn't." },
];
export const styleDef = (k: PostStyle | undefined): StyleDef => STYLES.find((s) => s.key === k) ?? STYLES[1];

// ---------------------------------------------------------------- one-off actions

export type ActionDef = {
  key: string;
  label: string;
  icon: string;
  cap: number; // times a year
  minFollowers?: number;
  platforms?: PlatformKey[];
  blurb: string;
};
export const ACTIONS: ActionDef[] = [
  { key: "post", label: "Post something now", icon: "add-circle", cap: 3, blurb: "Put something out. Might land, might not." },
  { key: "hottake", label: "Hot take", icon: "flame", cap: 2, platforms: ["x", "tiktok", "youtube", "podcast"], blurb: "Say what you actually think. Reach and risk go up together." },
  { key: "challenge", label: "Jump on a trend", icon: "trending-up", cap: 2, platforms: ["tiktok", "instagram", "youtube", "x"], blurb: "Ride what's hot this year. Reliable, and never original." },
  { key: "live", label: "Go live", icon: "radio", cap: 3, blurb: "Talk to your audience in real time. Builds a bond." },
  { key: "collab", label: "Collab with another creator", icon: "people", cap: 2, minFollowers: 500, blurb: "Trade audiences with someone your size (or bigger, if they say yes)." },
  { key: "stunt", label: "Do something huge", icon: "rocket", cap: 1, blurb: "A big, expensive, risky production. Could be the one that takes off." },
  { key: "giveaway", label: "Run a giveaway", icon: "gift", cap: 1, minFollowers: 1000, blurb: "Free stuff for followers. Costs money and gets you a bump." },
  { key: "reply", label: "Reply to your comments", icon: "chatbubbles", cap: 2, minFollowers: 200, blurb: "Answer people. It keeps them loyal." },
  { key: "promo", label: "Pay for promotion", icon: "megaphone", cap: 1, blurb: "Buy some reach. Works better the better your content is." },
];

// ---------------------------------------------------------------- what to post

export type PostType = {
  key: string;
  label: string;
  icon: string;
  blurb: string;
  reliable: number; // how dependable the payoff is
  viral: number; // how much it helps a post take off
  image: number; // what it does for how people see you
  risk: number; // chance it lands badly
  burn: number; // how tiring it is
  cost: number; // baseline dollars
  minFollowers?: number;
  fit: Record<"Entertainment" | "Look & lifestyle" | "Knowledge" | "Craft & hobby", number>;
  titles: string[];
};
export const POST_TYPES: PostType[] = [
  { key: "tutorial", label: "A tutorial", icon: "school", blurb: "Teach something useful. Dependable, and it keeps paying off.", reliable: 1.25, viral: 0.6, image: 1, risk: 0, burn: 1, cost: 0, fit: { Entertainment: 0.7, "Look & lifestyle": 1.1, Knowledge: 1.4, "Craft & hobby": 1.4 }, titles: ["How to get started with {n}", "The beginner's guide to {n}", "{n}: everything I wish I'd known"] },
  { key: "story", label: "Story time", icon: "chatbubble-ellipses", blurb: "Tell a real story. People share good stories.", reliable: 1, viral: 1.25, image: 0, risk: 0.04, burn: 1, cost: 0, fit: { Entertainment: 1.3, "Look & lifestyle": 1.1, Knowledge: 0.9, "Craft & hobby": 0.9 }, titles: ["Storytime: the {n} thing that went wrong", "You won't believe what happened this week", "The strangest day I've ever had"] },
  { key: "challenge", label: "A challenge", icon: "flash", blurb: "Something ambitious. Big swings, big misses.", reliable: 0.9, viral: 1.7, image: 0, risk: 0.06, burn: 2, cost: 100, fit: { Entertainment: 1.4, "Look & lifestyle": 1, Knowledge: 0.6, "Craft & hobby": 0.8 }, titles: ["I tried {n} for 30 days", "24 hours doing nothing but {n}", "Can I really do this? ({n} challenge)"] },
  { key: "behind", label: "Behind the scenes", icon: "film", blurb: "Show what it's really like. Your fans love it.", reliable: 0.9, viral: 0.5, image: 3, risk: 0, burn: 0, cost: 0, fit: { Entertainment: 1.1, "Look & lifestyle": 1.2, Knowledge: 1, "Craft & hobby": 1.2 }, titles: ["What making this is actually like", "The mess you never see", "A day in the life, unedited"] },
  { key: "qa", label: "Q&A", icon: "help-circle", blurb: "Answer your audience. Builds a loyal crowd.", reliable: 1, viral: 0.5, image: 2, risk: 0, burn: 1, cost: 0, minFollowers: 300, fit: { Entertainment: 1, "Look & lifestyle": 1.1, Knowledge: 1.1, "Craft & hobby": 1.1 }, titles: ["Answering your questions", "Ask me anything", "You asked, I answered"] },
  { key: "reaction", label: "React to something", icon: "eye", blurb: "Quick and topical. It borrows someone else's audience, and some people resent that.", reliable: 1.1, viral: 1, image: -1, risk: 0.08, burn: 0, cost: 0, fit: { Entertainment: 1.3, "Look & lifestyle": 0.9, Knowledge: 0.9, "Craft & hobby": 0.7 }, titles: ["Reacting to the internet's latest obsession", "I can't believe this exists", "Watching this so you don't have to"] },
  { key: "deepdive", label: "A big deep dive", icon: "library", blurb: "A long, researched piece. A lot of work, and it's the one people remember.", reliable: 1.5, viral: 0.8, image: 1, risk: 0.01, burn: 3, cost: 200, fit: { Entertainment: 0.6, "Look & lifestyle": 0.8, Knowledge: 1.5, "Craft & hobby": 1.2 }, titles: ["The full story of {n}, explained", "I spent a month researching {n}", "The {n} deep dive"] },
  { key: "review", label: "A review", icon: "star-half", blurb: "Give an honest verdict. Trusted reviewers get noticed by brands.", reliable: 1.1, viral: 0.7, image: 0, risk: 0.02, burn: 1, cost: 0, fit: { Entertainment: 0.8, "Look & lifestyle": 1.3, Knowledge: 1.2, "Craft & hobby": 1.1 }, titles: ["My honest review", "Is it worth it? A proper look", "I tested everything so you don't have to"] },
];
export const postType = (k: string | undefined): PostType => POST_TYPES.find((p) => p.key === k) ?? POST_TYPES[1];
export const TREND_NAMES = ["The Mirror Challenge", "Blindfold Week", "The Ten-Second Rule", "Reverse Day", "The Silent Treatment", "Two Truths and a Lie", "The Cold Open", "Glow-Up Friday", "The Slow-Mo Trend", "The Whisper Game"];

// ---------------------------------------------------------------- milestones

export const MILESTONES = [100, 1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];

export const PLAY_BUTTONS: { at: number; label: string }[] = [
  { at: 100_000, label: "Silver Play Button" },
  { at: 1_000_000, label: "Gold Play Button" },
  { at: 10_000_000, label: "Diamond Play Button" },
];

// ---------------------------------------------------------------- brands

export type BrandDef = { key: string; name: string; cat: string; niches: string[]; sketchy?: boolean; minAge?: number; pay: number; blurb: string };
const B = (key: string, name: string, cat: string, niches: string[], pay: number, blurb: string, sketchy = false, minAge = 13): BrandDef => ({ key, name, cat, niches, pay, blurb, sketchy, minAge });

export const BRANDS: BrandDef[] = [
  B("voltra", "Voltra Mobile", "Tech", ["tech", "gaming", "vlogs", "coding"], 1.2, "a phone maker that wants you in every shot"),
  B("pixelforge", "PixelForge", "Tech", ["tech", "gaming", "coding", "art"], 1, "a laptop and tablet brand"),
  B("nimbus", "Nimbus Cloud", "Tech", ["tech", "coding", "finance", "education"], 1.1, "a cloud storage company"),
  B("byteguard", "ByteGuard VPN", "Tech", ["tech", "gaming", "news", "drama", "truecrime"], 1, "a VPN that sponsors half the internet"),
  B("levelup", "LevelUp Energy", "Drinks", ["gaming", "fitness", "pranks", "sports"], 0.9, "an energy drink with a lot of neon"),
  B("brewhouse", "Brewhouse Coffee", "Food & drink", ["vlogs", "books", "education", "coding", "poetry"], 0.8, "a coffee subscription"),
  B("crumb", "Crumb & Co", "Food & drink", ["food", "vlogs", "family", "travel"], 0.8, "a meal-kit company"),
  B("greenfork", "GreenFork Meals", "Food & drink", ["food", "fitness", "wellness"], 0.9, "plant-based ready meals"),
  B("sprout", "Sprout Kitchen", "Food & drink", ["food", "family", "gardening"], 0.8, "kitchen gadgets that actually work"),
  B("luma", "Luma Skin", "Beauty", ["beauty", "fashion", "wellness", "vlogs"], 1.3, "a skincare line"),
  B("velvet", "Velvet Rose Cosmetics", "Beauty", ["beauty", "fashion", "dance"], 1.2, "makeup for every occasion"),
  B("thread", "Thread & Needle", "Fashion", ["fashion", "vlogs", "dance", "crafts"], 1.1, "a sustainable clothing label"),
  B("kickflip", "Kickflip Footwear", "Fashion", ["fashion", "sports", "dance", "fitness", "pranks"], 1.1, "streetwear and sneakers"),
  B("stridepro", "StridePro Athletics", "Fitness", ["fitness", "sports", "wellness"], 1.2, "sportswear"),
  B("ironclad", "Ironclad Gym Kit", "Fitness", ["fitness", "sports"], 1, "home gym equipment"),
  B("zenbox", "ZenBox Meditation", "Apps", ["wellness", "asmr", "education", "vlogs"], 0.9, "a mindfulness app"),
  B("lingua", "LinguaLoop", "Apps", ["language", "education", "travel"], 1, "a language-learning app"),
  B("budgetly", "Budgetly", "Finance", ["finance", "education", "vlogs"], 1.3, "a budgeting app"),
  B("coinbay", "CoinBay", "Finance", ["finance", "tech", "news"], 1.8, "a crypto exchange with big promises", true, 18),
  B("stackr", "Stackr Investing", "Finance", ["finance", "education"], 1.4, "a beginner investing platform"),
  B("betnova", "BetNova", "Betting", ["sports", "gaming", "pranks"], 2, "an online betting site with very big offers", true, 21),
  B("jetaway", "JetAway Travel", "Travel", ["travel", "vlogs", "vanlife", "photography"], 1.2, "a flight and hotel deals app"),
  B("nomad", "Nomad Backpacks", "Travel", ["travel", "vanlife", "photography", "nature", "fishing"], 1, "backpacks built for anywhere"),
  B("stayhaven", "StayHaven", "Travel", ["travel", "vlogs", "family"], 1.1, "a holiday rental platform"),
  B("wheelhouse", "Wheelhouse Auto", "Cars", ["cars", "vlogs", "tech"], 1.3, "a car marketplace"),
  B("torque", "Torque Oil & Parts", "Cars", ["cars", "woodwork"], 0.9, "parts and tools"),
  B("homestead", "Homestead Living", "Home", ["family", "woodwork", "gardening", "vlogs", "crafts"], 1, "home goods and furniture"),
  B("brightbox", "BrightBox Toys", "Kids", ["family", "vlogs", "pets"], 1.1, "toys with a lot of packaging", false, 18),
  B("fetch", "Fetch Pet Foods", "Pets", ["pets", "vlogs", "family"], 1, "premium pet food"),
  B("leafy", "Leafy Seeds & Soil", "Home", ["gardening", "crafts", "food"], 0.8, "a gardening subscription box"),
  B("inkwell", "Inkwell Stationery", "Craft", ["art", "crafts", "books", "poetry", "education"], 0.8, "pens, paper and sketchbooks"),
  B("canvasco", "CanvasCo Art Supplies", "Craft", ["art", "photography", "crafts"], 0.9, "paint and brushes"),
  B("woolly", "Woolly Yarn Co", "Craft", ["crafts"], 0.8, "hand-dyed yarn"),
  B("joyplay", "JoyPlay Games", "Games", ["gaming", "chess", "pranks", "memes"], 1, "a mobile game with endless ads"),
  B("headstart", "HeadStart Courses", "Education", ["education", "coding", "science", "language", "finance"], 1.1, "online courses"),
  B("shelf", "Shelf Audiobooks", "Media", ["books", "history", "truecrime", "education", "poetry"], 1, "an audiobook service"),
  B("streamline", "Streamline+", "Media", ["comedy", "drama", "memes", "truecrime", "vlogs"], 1.2, "a streaming service"),
  B("supplex", "SupplEx Boost", "Health", ["fitness", "wellness", "sports"], 1.7, "a miracle supplement that hasn't been tested much", true, 18),
  B("slimfast", "SlimTea Detox", "Health", ["fitness", "wellness", "beauty", "fashion"], 1.6, "a detox tea with wild claims", true, 18),
  B("clearview", "ClearView Eyewear", "Fashion", ["fashion", "tech", "vlogs"], 0.9, "glasses and blue-light lenses"),
  B("solace", "Solace Sleep", "Health", ["wellness", "asmr", "vlogs", "family"], 1, "mattresses and sleep aids"),
  B("northwind", "Northwind Outdoors", "Outdoors", ["nature", "fishing", "vanlife", "travel", "fitness"], 1, "camping and hiking gear"),
  B("streamdeck", "StreamRig Hardware", "Tech", ["gaming", "coding", "music", "asmr"], 1, "cameras, mics and capture cards"),
  B("chordsmith", "Chordsmith Instruments", "Music", ["music", "dance"], 1, "guitars, keys and lessons"),
  B("quickcash", "QuickCash Loans", "Finance", ["finance", "news", "drama"], 1.9, "high-interest loans with friendly branding", true, 18),
];
export const brandDef = (k: string): BrandDef | undefined => BRANDS.find((b) => b.key === k);

// ---------------------------------------------------------------- titles for the feed

const T_GENERIC = ["I tried something new this week", "The honest truth about {n}", "Ranking everything in {n}", "24 hours of {n}", "Beginners vs experts in {n}", "Things nobody tells you about {n}", "My biggest {n} mistake", "Answering your questions", "A day in the life", "Behind the scenes", "Reacting to your comments", "What I learned this year"];
const T_KIND: Record<NicheDef["cat"], string[]> = {
  Entertainment: ["This went horribly wrong", "We can't believe this worked", "Do NOT try this at home", "The funniest thing that's happened all year", "Trying the trend everyone's doing", "Part 2 (you asked for it)"],
  "Look & lifestyle": ["Get ready with me", "The full routine", "I stuck with it for 30 days", "What I actually spend in a week", "Honest review, no filter", "Your questions, answered"],
  Knowledge: ["Explained in ten minutes", "Everything you've been told is wrong", "A beginner's guide", "Why nobody talks about this", "I read the fine print so you don't have to", "The full story"],
  "Craft & hobby": ["Start to finish, no cuts", "A quiet afternoon of making", "The first one I'm actually proud of", "Slow, cosy and satisfying", "Ask me anything about the craft", "Every mistake I made so you don't have to"],
};
export function postTitle(nicheKey: string, viral: boolean): string {
  const n = nicheDef(nicheKey);
  const pool = [...T_GENERIC, ...T_KIND[n.cat], ...T_KIND[n.cat]];
  const t = pool[Math.floor(Math.random() * pool.length)].replace("{n}", n.label.toLowerCase().split(" & ")[0]);
  return viral ? t + "!!" : t;
}

// ---------------------------------------------------------------- handles and names

const HANDLE_A = ["real", "just", "its", "the", "hey", "mr", "ms", "big", "tiny", "captain", "doctor", "not", "old", "young", "lil", "sir", "dj", "ok", "papa", "queen"];
const HANDLE_B = ["fox", "moon", "cactus", "toast", "wolf", "vibes", "panda", "comet", "pixel", "waffle", "storm", "biscuit", "maple", "rocket", "otter", "ghost", "noodle", "cloud", "gecko", "ember", "sparrow", "marble", "tango", "jelly"];
export const handleFor = (first: string, last: string): string => {
  const r = Math.random();
  const f = first.toLowerCase().replace(/[^a-z]/g, "");
  const l = last.toLowerCase().replace(/[^a-z]/g, "");
  if (r < 0.3) return `${f}${l}`.slice(0, 16);
  if (r < 0.55) return `${f}.${l}`.slice(0, 16);
  if (r < 0.8) return `${f}${Math.floor(Math.random() * 99)}`;
  return `${HANDLE_A[Math.floor(Math.random() * HANDLE_A.length)]}${HANDLE_B[Math.floor(Math.random() * HANDLE_B.length)]}`;
};
export const randomHandle = (): string => `${HANDLE_A[Math.floor(Math.random() * HANDLE_A.length)]}_${HANDLE_B[Math.floor(Math.random() * HANDLE_B.length)]}${Math.random() < 0.5 ? Math.floor(Math.random() * 999) : ""}`;

export const STAR_FIRST = ["Zed", "Mila", "Jax", "Nadia", "Kofi", "Ren", "Dahlia", "Tomás", "Priya", "Odin", "Luz", "Kai", "Imani", "Silas", "Yuki", "Marcus", "Ines", "Bram", "Sana", "Theo", "Ayo", "Freya", "Dev", "Colette", "Rocco", "Amara", "Hugo", "Leila", "Cass", "Nico"];
export const STAR_LAST = ["Marlowe", "Okafor", "Vance", "Castell", "Ito", "Rhodes", "Bellamy", "Sorensen", "Achebe", "Quinn", "Delacroix", "Hart", "Novak", "Ferreira", "Kwon", "Bishop", "Laurent", "Adeyemi", "Sterling", "Moreau", "Duarte", "Blake", "Kaur", "Lindqvist", "Ruiz"];
export const starName = () => `${STAR_FIRST[Math.floor(Math.random() * STAR_FIRST.length)]} ${STAR_LAST[Math.floor(Math.random() * STAR_LAST.length)]}`;

// ---------------------------------------------------------------- the comment section

export type CommentTone = "love" | "praise" | "neutral" | "joke" | "question" | "hate" | "troll";
export const COMMENTS: Record<CommentTone, string[]> = {
  love: ["I've watched this five times and I still smile", "You have no idea how much this helped me today", "this is the only channel I actually look forward to", "my whole family watches you, honestly", "you're the reason I started my own", "not me tearing up at a video about {n}", "you deserve a million more people watching this", "been here since the start. so proud of you"],
  praise: ["this is so well made", "the editing is unreal", "okay you're actually really good at this", "subscribed. no notes", "how is this not more popular", "quality content as always", "the algorithm finally did something right", "actually learned something, thank you"],
  neutral: ["first", "who's watching in {y}?", "came here from the recommended", "this popped up at 3am, no regrets", "seen worse, seen better", "commenting for the algorithm", "okay, that was a lot to take in", "I'll be honest, I wasn't expecting that"],
  joke: ["my roommate walked in during this and now we're not speaking", "the audacity, the nerve, the gall", "who let you cook like this", "I've been staring at the thumbnail for ten minutes", "this comment section is the real content", "I came for {n} and stayed for the chaos", "sir this is a Wendy's", "I'd die for the guy in the background"],
  question: ["what's the setup you use?", "can you do a part two?", "where's that from??", "how long did this take?", "what would you tell a beginner?", "do you ever get tired of this?", "any chance of a meet-up?", "what's the song at the start?"],
  hate: ["unsubscribed", "this used to be good", "you've changed and not in a good way", "cringe. actually painful to watch", "you sold out the second the sponsors came", "same thing every time, honestly", "there are people who do this a hundred times better", "nobody asked for this"],
  troll: ["ratio + you fell off", "delete your account, please", "my dog has better taste than you", "you're doing it all wrong and everyone knows it", "imagine thinking this was good", "your voice makes me want to go outside", "this is what's wrong with the internet", "bots liked this, obviously"],
};
export const commentUser = (): string => randomHandle();

// ---------------------------------------------------------------- inbox flavour

export const FAN_MESSAGES = [
  "I just wanted to say your videos got me through a really hard year. Thank you.",
  "My little brother wants to be just like you. He's practising every day.",
  "You replied to me once, two years ago. I still think about it.",
  "Do you ever meet fans? I'd travel a long way for it.",
  "I'm learning so much from you. I got my first job in the field because of it.",
  "Your last one made me laugh so loud my neighbours knocked. Worth it.",
  "I drew you a picture! Can I send it?",
  "My whole class watched your last one at lunch. We're a fan club now.",
];
export const HATE_MESSAGES = [
  "You're a fraud and everyone can see it.",
  "Nobody watches you. You just think they do.",
  "Honestly? Quit. Save us all the trouble.",
  "I found your old posts. Wow. Just wow.",
  "You don't deserve any of this.",
  "I know where you live, you know. (Just kidding. Or am I?)",
];
export const SCAM_MESSAGES = [
  "Congratulations! You've been picked for an exclusive sponsorship. Just pay the small verification fee first.",
  "We can get you 100k followers by Friday. Guaranteed. Send the payment and your password.",
  "Your account has violated our policies. Click here to appeal in the next 24 hours or be removed.",
  "A famous brand wants you. To activate the deal we need you to buy the starter kit.",
  "Get verified instantly. We just need a small processing charge.",
];
export const PRESS_LINES = [
  "a lifestyle magazine wants to profile you",
  "a local newspaper is running a piece on the new wave of creators",
  "a podcast host wants you as a guest",
  "a TV segment wants a young creator's view on the internet",
  "a documentary team is following creators for a year",
];
export const FRIEND_ASKS = [
  "asks for a shoutout to help their own account take off",
  "wants you to teach them how to do what you do",
  "asks you to feature them in your next post",
  "wants to start a channel together",
];

export const fmt = (n: number): string => {
  const a = Math.abs(Math.round(n));
  if (a >= 1_000_000_000) return `${(a / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (a >= 1_000_000) return `${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (a >= 10_000) return `${Math.round(a / 1000)}K`;
  if (a >= 1000) return `${(a / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${a}`;
};
