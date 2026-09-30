import { Channel, Character, PlatformKey, Post, SocialState, WorldSocial, WorldState } from "../types";
import { NICHES, PLATFORMS, cadenceDef, gearDef, nicheDef, platformDef, styleDef, starName, fmt } from "../data/social";
import { livingIndex, inflation } from "./where";
import { getRegion } from "../data/regions";
import { clamp } from "./util";

// The shared ground of the fame system: the state guard, the numbers every
// other creator module reads (quality, reach, fame, image) and the world's
// yearly mood. No game rules that change things live here - see creator.ts.

// a line for this year's log that also goes into the life story
export const record = (c: Character, text: string, news = false): void => {
  c.yearLog.push(text);
  c.fullLog.push({ age: c.age, text });
  if (news) (c.yearNews ??= []).push({ kind: "milestone", text });
};

export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

const jm = (c: Character) => getRegion(c.originRegion).jobMultiplier;
// what content earns is scaled by the audience's country and by inflation, the same way pay is
export const revScale = (c: Character) => (0.45 + 0.55 * jm(c)) * inflation(c);
// what kit and help cost
export const costScale = (c: Character) => livingIndex(c.originRegion) * inflation(c);

// ---------------------------------------------------------------- state

export function newSocial(c: Character): SocialState {
  return {
    channels: [], fame: 0, image: 0, privacy: 100, burnout: 0, team: {}, deals: [], inbox: [], feed: [], earned: 0, bestYear: 0,
    lastEarned: 0, lastTax: 0, startAge: c.age, actions: { age: c.age, n: {} }, crisis: null, topFollowers: 0, leak: 0, fameSeen: 0,
  };
}

// the creator state if there is any; pass create=true to start one
export function ensureSocial(c: Character, create = false): SocialState | undefined {
  if (!c.social) {
    if (!create) return undefined;
    c.social = newSocial(c);
  }
  const s = c.social;
  s.channels ??= [];
  s.deals ??= [];
  s.inbox ??= [];
  s.feed ??= [];
  s.team ??= {};
  s.actions ??= { age: c.age, n: {} };
  s.leak ??= 0;
  for (const ch of s.channels) {
    ch.history ??= [];
    ch.milestones ??= [];
    ch.fake ??= 0;
    ch.strikes ??= 0;
    ch.hits ??= 0;
    ch.momentum ??= 0;
  }
  return s;
}

export const channelOf = (c: Character, platform: PlatformKey): Channel | undefined => c.social?.channels.find((ch) => ch.platform === platform);
export const isCreator = (c: Character): boolean => (c.social?.channels.length ?? 0) > 0;
export const fameOf = (c: Character): number => c.social?.fame ?? 0;
export const imageOf = (c: Character): number => c.social?.image ?? 0;
export const totalFollowers = (c: Character): number => (c.social?.channels ?? []).reduce((t, ch) => t + ch.followers, 0);
export const biggest = (c: Character): Channel | undefined => [...(c.social?.channels ?? [])].sort((a, b) => b.followers - a.followers)[0];
export const isBanned = (c: Character, ch: Channel): boolean => !!ch.bannedUntil && c.age < ch.bannedUntil;
export const busy = (c: Character): "school" | "job" | null => {
  if (c.job && c.job.kind === "fulltime") return "job";
  if (c.inCollege || c.higher || ["elementary", "middle", "high"].includes(c.educationStage)) return "school";
  return null;
};

// ---------------------------------------------------------------- the world's mood

export function ensureWorldSocial(world: WorldState): WorldSocial {
  if (!world.social) {
    world.social = {
      pop: Object.fromEntries(PLATFORMS.map((p) => [p.key, 1])),
      hot: [],
      stars: [],
      mood: "The internet is quiet for a moment.",
    };
  }
  const w = world.social;
  for (const p of PLATFORMS) if (w.pop[p.key] === undefined) w.pop[p.key] = 1;
  if (w.stars.length === 0) {
    for (const p of PLATFORMS) {
      for (let i = 0; i < 3; i++) {
        const nk = NICHES[Math.floor(Math.random() * NICHES.length)];
        const top = (nk.ceiling * p.scale * 0.4) * (0.5 + Math.random() * 0.5);
        w.stars.push({ name: starName(), platform: p.key, niche: nk.key, followers: Math.round(Math.max(20000, top * (0.25 + 0.75 / (i + 1)))) });
      }
    }
  }
  return w;
}

export const hotMult = (world: WorldState | undefined, niche: string): number => world?.social?.hot.find((h) => h.niche === niche)?.mult ?? 1;
export const popOf = (world: WorldState | undefined, platform: PlatformKey): number => world?.social?.pop[platform] ?? 1;

// ---------------------------------------------------------------- quality and reach

export type QualityPart = { label: string; value: number };

// what makes a piece of content good: aptitude, practice, kit, help and a fit with the platform
export function qualityParts(c: Character, ch: Channel): QualityPart[] {
  const n = nicheDef(ch.niche);
  const p = platformDef(ch.platform);
  const s = c.social;
  const hobbyLevel = Math.max(0, ...n.hobbies.map((h) => c.hobbies?.[h]?.level ?? 0));
  const per = c.personality;
  const looks = c.stats.looks;
  const parts: QualityPart[] = [
    { label: "Starting out", value: 28 },
    { label: `Aptitude for ${n.talent}`, value: ((c.talents?.[n.talent] ?? 50) - 50) * 0.28 },
    { label: "Real experience in the subject", value: hobbyLevel * 0.16 },
    { label: "Kit", value: gearDef(ch.gear).bonus },
    { label: "An editor", value: s?.team.editor && p.form !== "text" && p.form !== "photo" ? 10 : s?.team.editor ? 5 : 0 },
    { label: "Practice", value: Math.min(14, ch.years * 2.2) },
    { label: "Discipline and curiosity", value: ((per?.c ?? 50) - 50) * 0.08 + ((per?.o ?? 50) - 50) * 0.05 },
    { label: "On-camera presence", value: ((per?.e ?? 50) - 50) * (p.form === "live" || p.form === "short" || p.form === "video" ? 0.07 : 0.02) },
    { label: "Looks", value: (looks - 50) * (p.form === "photo" ? 0.16 : p.form === "short" ? 0.1 : p.form === "text" || p.form === "audio" ? 0.01 : 0.04) },
    { label: "Smarts", value: (c.stats.smarts - 50) * (n.cat === "Knowledge" ? 0.1 : 0.03) },
    { label: "Niche fit for the platform", value: ((n.fit[ch.platform] ?? 0.5) - 1) * 10 },
    { label: "Burnout", value: -(s?.burnout ?? 0) * 0.12 },
  ];
  if (c.sanity !== undefined && c.sanity < 55) parts.push({ label: "Frayed nerves", value: (c.sanity - 55) * 0.1 });
  if (ch.pivotAge === c.age) parts.push({ label: "Finding your feet in a new niche", value: -6 });
  return parts;
}
export const qualityOf = (c: Character, ch: Channel): number => clamp(Math.round(qualityParts(c, ch).reduce((t, x) => t + x.value, 0)), 8, 100);

export function qualityWord(q: number): string {
  return q >= 85 ? "Outstanding" : q >= 70 ? "Excellent" : q >= 55 ? "Good" : q >= 40 ? "Decent" : q >= 25 ? "Rough" : "Barely watchable";
}

// the most this channel could ever grow to in its niche, before luck
export function potential(c: Character, world: WorldState, ch: Channel): number {
  const n = nicheDef(ch.niche);
  const p = platformDef(ch.platform);
  const fit = n.fit[ch.platform] ?? 0.5;
  const base = n.ceiling * p.scale * fit * popOf(world, ch.platform) * hotMult(world, ch.niche);
  return Math.max(800, base * (1 + Math.min(0.75, ch.hits * 0.1)));
}
// followers a channel can realistically hold: the biggest names take a large share of a niche, never all of it
export const carrying = (c: Character, world: WorldState, ch: Channel): number => potential(c, world, ch) * 0.4;

export function engagementOf(c: Character, ch: Channel): number {
  const n = nicheDef(ch.niche);
  const q = qualityOf(c, ch);
  return clamp(0.02 + (q / 100) * 0.08 * n.loyalty - (ch.fake / 100) * 0.05, 0.004, 0.2);
}

// how a post normally performs relative to your follower count
export const viewRate = (p: PlatformKey): number => ({ youtube: 0.12, tiktok: 0.2, instagram: 0.1, x: 0.06, twitch: 0.05, podcast: 0.32 }[p]);

// ---------------------------------------------------------------- fame, image, privacy

const FAME_WEIGHT: Record<PlatformKey, number> = { youtube: 1, tiktok: 0.8, instagram: 1, x: 0.85, twitch: 1.5, podcast: 1.4 };

export function computeFame(c: Character): number {
  const s = c.social;
  if (!s) return 0;
  const chans = s.channels.filter((ch) => ch.followers > 0);
  if (chans.length === 0) return 0;
  let eff = 0;
  for (const ch of chans) eff += ch.followers * FAME_WEIGHT[ch.platform] * (1 - (ch.fake / 100) * 0.5) * (1 + Math.max(0, ch.momentum) * 0.05);
  eff *= 1 + 0.08 * (chans.length - 1);
  return clamp(Math.round((Math.log10(Math.max(1, eff)) - 2.3) * 17), 0, 100);
}

export function computePrivacy(c: Character): number {
  const s = c.social;
  if (!s) return 100;
  return clamp(Math.round(100 - s.fame * 0.85 - (s.leak ?? 0)), 0, 100);
}

export const fameWord = (f: number): string =>
  f >= 92 ? "Global icon" : f >= 80 ? "Superstar" : f >= 65 ? "Famous" : f >= 50 ? "Well known" : f >= 35 ? "Internet famous" : f >= 20 ? "Micro-famous" : f >= 8 ? "Local name" : "Unknown";
export const imageWord = (i: number): string =>
  i >= 60 ? "Beloved" : i >= 30 ? "Well liked" : i >= 8 ? "Liked" : i > -10 ? "Mixed" : i > -35 ? "Disliked" : i > -60 ? "Controversial" : "Hated";
export const privacyWord = (p: number): string => (p >= 80 ? "Private" : p >= 55 ? "Somewhat exposed" : p >= 30 ? "Watched" : "No privacy");
export const burnoutWord = (b: number): string => (b >= 85 ? "About to break" : b >= 60 ? "Running on empty" : b >= 35 ? "Tired" : b >= 15 ? "Fine" : "Fresh");

export function phaseOf(c: Character, ch: Channel): string {
  if (isBannedNow(c, ch)) return "Suspended";
  if (ch.cadence === "off") return "On a break";
  if (ch.followers < 50 && ch.years < 1) return "Just starting";
  if (ch.momentum >= 1.5) return "Taking off";
  if (ch.gain < 0) return "Declining";
  const last = ch.history[ch.history.length - 2] ?? 0;
  const rel = last > 0 ? ch.gain / last : 1;
  if (rel >= 0.5) return "Growing fast";
  if (rel >= 0.12) return "Growing";
  return "Plateau";
}
const isBannedNow = (c: Character, ch: Channel) => !!ch.bannedUntil && c.age < ch.bannedUntil;

// how close the channel is to the top of what its niche allows, in words (the exact ceiling stays hidden)
export function roomWord(c: Character, world: WorldState, ch: Channel): string {
  const share = ch.followers / Math.max(1, carrying(c, world, ch));
  const pot = potential(c, world, ch);
  const size = pot >= 30_000_000 ? "A huge crowd" : pot >= 5_000_000 ? "A big crowd" : pot >= 800_000 ? "A modest crowd" : "A small, devoted crowd";
  const fill = share >= 0.8 ? "and you've almost filled it" : share >= 0.3 ? "and you're well established" : share >= 0.05 ? "with plenty of room to grow" : "and you've barely scratched it";
  return `${size} ${fill}.`;
}

// rank against everyone else making the same thing (a made-up but consistent field of creators)
export function percentile(c: Character, world: WorldState, ch: Channel): number {
  const K = carrying(c, world, ch);
  const f0 = 150 * Math.pow(Math.max(K, 1e5) / 2e6, 0.3);
  const share = ch.followers <= f0 ? 1 - ch.followers / (f0 * 4) : Math.pow(f0 / ch.followers, 0.85) * 0.75;
  return clamp(share, 0.00002, 1);
}
export const topWord = (share: number): string => (share <= 0.0002 ? "Top 0.02%" : share <= 0.01 ? `Top ${(share * 100).toFixed(2).replace(/0$/, "")}%` : share <= 0.5 ? `Top ${Math.max(1, Math.round(share * 100))}%` : "Bottom half");

// ---------------------------------------------------------------- posts and comments

export function pushPost(s: SocialState, post: Post): void {
  s.feed.unshift(post);
  if (s.feed.length > 40) s.feed.length = 40;
}

const hash = (str: string): number => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};
export const seeded = (seed: string): (() => number) => {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export { fmt, cadenceDef, styleDef };

// what to call you when you have no job but a following
export const creatorLabel = (c: Character): string | null => {
  const s = c.social;
  if (!s || s.channels.length === 0 || c.job || c.age < 16) return null;
  return s.lastEarned > 0 || s.fame >= 15 ? "Content creator" : null;
};

// who is watching: a rough age mix from the niche and the platform (not exact, but consistent)
export function audienceMix(ch: Channel): { label: string; pct: number }[] {
  const base: Record<string, number[]> = {
    Entertainment: [30, 32, 20, 13, 5],
    "Look & lifestyle": [14, 30, 32, 18, 6],
    Knowledge: [10, 24, 30, 26, 10],
    "Craft & hobby": [5, 14, 26, 32, 23],
  };
  const shift: Record<PlatformKey, number[]> = {
    youtube: [0, 0, 0, 0, 0], tiktok: [10, 6, -6, -6, -4], instagram: [-2, 6, 4, -4, -4], x: [-8, 2, 8, 2, -4], twitch: [6, 12, -2, -10, -6], podcast: [-14, -6, 8, 8, 4],
  };
  const b = base[nicheDef(ch.niche).cat];
  const sh = shift[ch.platform];
  const raw = b.map((v, i) => Math.max(1, v + sh[i]));
  const t = raw.reduce((a, x) => a + x, 0);
  return ["Under 18", "18-24", "25-34", "35-54", "55+"].map((label, i) => ({ label, pct: Math.round((raw[i] / t) * 100) }));
}
