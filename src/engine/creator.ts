import { Cadence, Channel, Character, PlatformKey, PostStyle, QualityTier, WorldState } from "../types";
import { ACTIONS, ActionDef, NICHES, TREND_NAMES, postType, COMMENTS, CommentTone, MILESTONES, PLAY_BUTTONS, brandDef, cadenceDef, fmt, gearDef, nicheDef, platformDef, randomHandle, styleDef, handleFor } from "../data/social";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { incomeTax, taxCredit } from "./taxes";
import { salaryNow } from "./career";
import { noteIncome } from "./where";
import {
  biggest, busy, carrying, record, channelOf, computeFame, computePrivacy, costScale, engagementOf, ensureSocial, ensureWorldSocial, hotMult, isBanned, money, popOf, pushPost,
  qualityOf, revScale, seeded, viewRate,
} from "./creatorCore";
import { addFollowers, addToFeed, makePartner, makePost, runCollab, viralGain, leak } from "./creatorPlay";
import { tickInbox } from "./inbox";

// Fame and social media: opening channels, planning content, the one-off moves, the team and the
// yearly tick that turns all of it into followers, money and consequences.

const MAX_CHANNELS = 6;

// ---------------------------------------------------------------- opening and planning

export type Check = { ok: boolean; reason?: string };

export function openCheck(c: Character, platform: PlatformKey, niche: string): Check {
  const p = platformDef(platform);
  const n = nicheDef(niche);
  if (c.age < p.minAge) return { ok: false, reason: `You need to be ${p.minAge} for ${p.label}.` };
  if (c.age < n.minAge) return { ok: false, reason: `You need to be ${n.minAge} to make this.` };
  if (c.inJail) return { ok: false, reason: "Not from behind bars." };
  if (channelOf(c, platform)) return { ok: false, reason: "You already have one here." };
  if ((c.social?.channels.length ?? 0) >= MAX_CHANNELS) return { ok: false, reason: "You can't run more than six." };
  return { ok: true };
}

export function openChannel(c: Character, world: WorldState, platform: PlatformKey, niche: string, handle?: string): boolean {
  if (!openCheck(c, platform, niche).ok) return false;
  const s = ensureSocial(c, true)!;
  const p = platformDef(platform);
  const n = nicheDef(niche);
  const carry = Math.max(0, ...s.channels.map((ch) => ch.followers)) * 0.07 * (1 + s.fame / 200);
  const friends = c.age < 18 ? randomInt(30, 130) : randomInt(10, 60);
  const followers = Math.round(friends + carry);
  const h = (handle ?? "").trim().replace(/^@/, "") || handleFor(c.firstName, c.lastName);
  const ch: Channel = {
    platform, handle: h, niche, since: c.age, followers, peak: followers, momentum: 0, years: 0,
    cadence: busy(c) ? "casual" : "steady", gear: "phone", style: "standard", monetised: false, verified: false, members: false, merch: false,
    strikes: 0, history: [], revenue: 0, views: 0, gain: 0, fake: 0, hits: 0, milestones: [],
    appeal: clamp(Math.exp((Math.random() + Math.random() + Math.random() - 1.5) * 0.9), 0.45, 2.2),
  };
  s.channels.push(ch);
  s.startAge = s.channels.length === 1 && s.earned === 0 ? c.age : s.startAge;
  addToFeed(c, makePost(c, ch, "First post", 1, { title: "Hello, world. This is me starting out.", tone: "neutral" }));
  c.yearLog.push(`You started a ${n.label.toLowerCase()} channel on ${p.label} as @${h}.${carry > 50 ? ` Your other channels sent ${fmt(carry)} people over.` : ""}`);
  c.fullLog.push({ age: c.age, text: `Started a ${p.label} channel.` });
  refresh(c);
  return true;
}

export function closeChannel(c: Character, platform: PlatformKey): boolean {
  const s = ensureSocial(c);
  const ch = channelOf(c, platform);
  if (!s || !ch) return false;
  s.channels = s.channels.filter((x) => x !== ch);
  s.deals = s.deals.filter((d) => d.platform !== platform);
  c.yearLog.push(`You deleted your ${platformDef(platform).label} channel.`);
  refresh(c);
  return true;
}

export function maxCadence(c: Character): Cadence {
  return c.age < 16 ? "steady" : "grind";
}
export function maxGear(c: Character): QualityTier {
  return c.age < 18 ? "home" : "pro";
}

export function setPlan(c: Character, platform: PlatformKey, patch: { niche?: string; cadence?: Cadence; gear?: QualityTier; style?: PostStyle }): boolean {
  const ch = channelOf(c, platform);
  if (!ch) return false;
  if (patch.niche && patch.niche !== ch.niche) {
    const n = nicheDef(patch.niche);
    if (c.age < n.minAge) return false;
    const lost = Math.round(ch.followers * 0.35);
    ch.followers -= lost;
    ch.niche = patch.niche;
    ch.momentum = 0;
    ch.pivotAge = c.age;
    c.yearLog.push(`You switched to ${n.label.toLowerCase()}. About ${fmt(lost)} of your audience didn't come with you.`);
  }
  if (patch.cadence) ch.cadence = patch.cadence;
  if (patch.gear) ch.gear = patch.gear;
  if (patch.style) ch.style = patch.style;
  refresh(c);
  return true;
}

export function gearCost(c: Character, ch: Channel): number {
  return c.age < 18 ? 0 : Math.round(gearDef(ch.gear).cost * costScale(c));
}
export const gearPrice = (c: Character, tier: QualityTier): number => (c.age < 18 ? 0 : Math.round(gearDef(tier).cost * costScale(c)));

// ---------------------------------------------------------------- money-related switches

export const canMembers = (ch: Channel): Check => {
  const need = ch.platform === "twitch" ? 100 : 5000;
  if (ch.members) return { ok: false, reason: "Already on." };
  if (!ch.monetised) return { ok: false, reason: "Get monetised first." };
  if (ch.followers < need) return { ok: false, reason: `Needs ${fmt(need)} ${platformDef(ch.platform).people}.` };
  return { ok: true };
};
export function launchMembers(c: Character, platform: PlatformKey): boolean {
  const ch = channelOf(c, platform);
  if (!ch || !canMembers(ch).ok) return false;
  ch.members = true;
  c.yearLog.push(`You launched ${ch.platform === "twitch" ? "subscriptions" : "paid memberships"} on ${platformDef(platform).label}.`);
  return true;
}
export const merchCost = (c: Character): number => Math.round(2500 * costScale(c));
export const canMerch = (c: Character, ch: Channel): Check => {
  if (ch.merch) return { ok: false, reason: "Already selling." };
  if (c.age < 16) return { ok: false, reason: "You need to be 16." };
  if (ch.followers < 15000) return { ok: false, reason: `Needs ${fmt(15000)} ${platformDef(ch.platform).people}.` };
  if (c.money < merchCost(c)) return { ok: false, reason: `You need ${money(merchCost(c))}.` };
  return { ok: true };
};
export function launchMerch(c: Character, platform: PlatformKey): boolean {
  const ch = channelOf(c, platform);
  if (!ch || !canMerch(c, ch).ok) return false;
  c.money -= merchCost(c);
  ch.merch = true;
  c.yearLog.push(`You launched a merch line. -${money(merchCost(c))}`);
  return true;
}

// ---------------------------------------------------------------- the team

export type Role = "editor" | "assistant" | "manager";
export const ROLES: { key: Role; label: string; icon: string; need: number; blurb: string }[] = [
  { key: "editor", label: "Editor", icon: "film", need: 5000, blurb: "Cuts, polishes and posts. Better quality and less burnout, and it costs about 10% of what you make (never less than a few thousand)." },
  { key: "assistant", label: "Community manager", icon: "chatbubbles", need: 20000, blurb: "Handles comments and DMs. Fewer haters reach you, and fans feel heard. About 6% of what you make." },
  { key: "manager", label: "Manager", icon: "briefcase", need: 15000, blurb: "Finds and negotiates deals and steers you clear of trouble. Takes 15% of what you make." },
];
export const roleCheck = (c: Character, role: Role): Check => {
  const s = c.social;
  if (!s) return { ok: false, reason: "Start a channel first." };
  if (s.team[role]) return { ok: false, reason: "Already on the team." };
  const def = ROLES.find((r) => r.key === role)!;
  const top = biggest(c);
  if (!top || top.followers < def.need) return { ok: false, reason: `Needs a channel with ${fmt(def.need)} followers.` };
  if (c.age < 18) return { ok: false, reason: "You need to be an adult to hire." };
  return { ok: true };
};
export function hire(c: Character, role: Role): boolean {
  if (!roleCheck(c, role).ok) return false;
  c.social!.team[role] = true;
  c.yearLog.push(`You hired a ${ROLES.find((r) => r.key === role)!.label.toLowerCase()}.`);
  return true;
}
export function fire(c: Character, role: Role): boolean {
  if (!c.social?.team[role]) return false;
  delete c.social.team[role];
  c.yearLog.push(`You let your ${ROLES.find((r) => r.key === role)!.label.toLowerCase()} go.`);
  return true;
}

// ---------------------------------------------------------------- reach

function trendOf(world: WorldState, ch: Channel): number {
  return popOf(world, ch.platform) * hotMult(world, ch.niche);
}

export function hitChance(c: Character, world: WorldState, ch: Channel, eff: number): number {
  const p = platformDef(ch.platform);
  const n = nicheDef(ch.niche);
  const st = styleDef(ch.style);
  const qf = qualityOf(c, ch) / 100;
  const v = 0.045 * p.viral * n.viral * st.viral * trendOf(world, ch) * Math.pow(Math.max(0.3, eff), 0.6) * Math.pow(Math.max(0.3, qf) / 0.6, 1.1) * (1 + Math.max(0, ch.momentum) * 0.15) * Math.pow(ch.appeal ?? 1, 0.8);
  return clamp(v, 0, 0.5);
}

// the followers a decent new piece brings even to a small account
function seedOf(c: Character, world: WorldState, ch: Channel, eff: number): number {
  const p = platformDef(ch.platform);
  const qf = qualityOf(c, ch) / 100;
  const fit = nicheDef(ch.niche).fit[ch.platform] ?? 0.5;
  const reach = clamp(Math.pow((nicheDef(ch.niche).ceiling * p.scale * fit) / 10_000_000, 0.14), 0.7, 1.4);
  return 215 * eff * (0.2 + Math.pow(qf, 1.4) * 1.5) * (0.6 + 0.5 * p.viral) * fit * trendOf(world, ch) * (1 + Math.log10(1 + ch.followers / 1000) * 0.45) * (0.5 + p.scale * 0.5) * reach * (ch.appeal ?? 1);
}

// ---------------------------------------------------------------- one-off moves

const countKey = (c: Character, key: string) => (c.social && c.social.actions.age === c.age ? c.social.actions.n[key] ?? 0 : 0);
export const actionsLeft = (c: Character, def: ActionDef): number => Math.max(0, def.cap - countKey(c, def.key));

export function actionCost(c: Character, ch: Channel, key: string): number {
  const bump = 1 + Math.log10(1 + ch.followers / 1000);
  if (key === "stunt") return Math.round(800 * costScale(c) * bump);
  if (key === "giveaway") return Math.round(Math.max(100 * costScale(c), Math.min(ch.followers * 0.12 * revScale(c), 25000 * revScale(c))));
  if (key === "promo") return Math.round(300 * costScale(c) * (1 + Math.log10(1 + ch.followers / 1000) * 0.8));
  return 0;
}

export function actionCheck(c: Character, ch: Channel, def: ActionDef): Check {
  if (c.inJail) return { ok: false, reason: "Not from behind bars." };
  if (isBanned(c, ch)) return { ok: false, reason: "This account is suspended." };
  if (ch.cadence === "off" && def.key !== "reply") return { ok: false, reason: "You're on a break. Change your plan first." };
  if (def.platforms && !def.platforms.includes(ch.platform)) return { ok: false, reason: `Not really a ${platformDef(ch.platform).label} thing.` };
  if (def.minFollowers && ch.followers < def.minFollowers) return { ok: false, reason: `Needs ${fmt(def.minFollowers)} ${platformDef(ch.platform).people}.` };
  if (actionsLeft(c, def) <= 0) return { ok: false, reason: "You've done this as much as you can this year." };
  const cost = actionCost(c, ch, def.key);
  if (cost > 0 && c.age >= 18 && c.money < cost) return { ok: false, reason: `You need ${money(cost)}.` };
  if ((def.key === "stunt" || def.key === "challenge") && (c.social?.burnout ?? 0) >= 95) return { ok: false, reason: "You're too burnt out." };
  return { ok: true };
}

export function doAction(c: Character, world: WorldState, platform: PlatformKey, key: string, arg?: string): boolean {
  const s = ensureSocial(c);
  const ch = channelOf(c, platform);
  const def = ACTIONS.find((a) => a.key === key);
  if (!s || !ch || !def || !actionCheck(c, ch, def).ok) return false;
  const pt = key === "post" ? postType(arg || "story") : null;
  const postCost = pt ? Math.round(pt.cost * costScale(c)) : 0;
  if (pt) {
    if (pt.minFollowers && ch.followers < pt.minFollowers) return false;
    if (postCost > 0 && c.age >= 18 && c.money < postCost) return false;
    if (postCost > 0 && c.age >= 18) c.money -= postCost;
  }
  if (s.actions.age !== c.age) s.actions = { age: c.age, n: {} };
  s.actions.n[key] = (s.actions.n[key] ?? 0) + 1;
  const p = platformDef(platform);
  const n = nicheDef(ch.niche);
  const st = styleDef(ch.style);
  const qf = qualityOf(c, ch) / 100;
  const seed = seedOf(c, world, ch, 1) * 0.15;
  const f = ch.followers;
  const hb = hitChance(c, world, ch, 1);
  const cost = actionCost(c, ch, key);
  if (cost > 0 && c.age >= 18) c.money -= cost;
  // a one-off move matters less the bigger you already are, exactly like ordinary growth
  const damp = Math.pow(f / clamp(carrying(c, world, ch) * 0.0008, 500, 40000) + 1, -0.36) * (0.6 + qf);
  const pct = (lo: number, hi: number) => f * (lo + Math.random() * (hi - lo)) * damp;
  const word = p.post;
  const line = (t: string) => c.yearLog.push(t);
  const viral = (boost: number, kind: string, label: string) => {
    const g = addFollowers(ch, viralGain(c, world, ch, boost));
    ch.hits += 1;
    ch.momentum = Math.min(3, ch.momentum + 1);
    addToFeed(c, makePost(c, ch, kind, 12 + Math.random() * 20, { viral: true, tone: "good" }));
    record(c, `${label} A ${word} on your ${p.label} went viral, bringing in ${fmt(g)} new ${p.people}.`);
  };
  switch (key) {
    case "post": {
      const t = pt!;
      const fit = t.fit[n.cat];
      s.burnout = clamp(s.burnout + t.burn);
      const title = t.titles[Math.floor(Math.random() * t.titles.length)].replace("{n}", n.label.toLowerCase().split(" & ")[0]);
      if (Math.random() < t.risk * (1 + st.risk * 2) * (fit < 1 ? 1.4 : 1)) {
        const lost = Math.round(f * (0.003 + Math.random() * 0.01));
        ch.followers = Math.max(0, ch.followers - lost);
        s.image = clamp(s.image - randomInt(2, 5), -100, 100);
        addToFeed(c, makePost(c, ch, t.label, 1.1, { title, tone: "bad" }));
        line(`Your ${t.label.toLowerCase()} on ${p.label} landed badly. People said it felt off, and ${fmt(lost)} of them left.`);
      } else if (Math.random() < hb * 0.25 * t.viral * Math.sqrt(fit)) {
        viral(0.35 * t.reliable, t.label, "It took off.");
      } else {
        const g = addFollowers(ch, (seed * (0.6 + Math.random() * 0.8) * 3 + pct(0.002, 0.006)) * t.reliable * fit);
        s.image = clamp(s.image + t.image * 0.5, -100, 100);
        addToFeed(c, makePost(c, ch, t.label, 1 * fit, { title }));
        line(`You put out ${t.label.toLowerCase().replace(/^a /, "a ")} on ${p.label}${fit >= 1.2 ? ", which suits your niche perfectly" : fit < 0.8 ? ", which isn't really your niche's style" : ""}. ${g > 0 ? `It brought in ${fmt(g)} new ${p.people}.` : "It got a few likes."}`);
      }
      break;
    }
    case "hottake": {
      const blow = clamp(0.2 + st.risk * 0.6 + n.risk * 0.5 - c.stats.smarts / 500, 0.1, 0.7);
      if (Math.random() < blow) {
        const lost = Math.round(f * (0.01 + Math.random() * 0.03));
        ch.followers = Math.max(0, ch.followers - lost);
        s.image = clamp(s.image - randomInt(4, 9), -100, 100);
        c.stress = clamp((c.stress ?? 25) + 5);
        changeStat(c, "happiness", -3, "A hot take that backfired");
        addToFeed(c, makePost(c, ch, "Hot take", 1.8, { tone: "bad" }));
        line(`Your hot take on ${p.label} went down badly. ${fmt(lost)} people unfollowed and the replies were brutal.`);
        if (s.fame >= 10 && !s.crisis && Math.random() < 0.3 + n.risk) {
          s.crisis = `backlash@${c.age}`;
          line("It's snowballing. You're going to have to say something.");
        }
      } else if (Math.random() < clamp(hb * 1.2, 0.03, 0.3)) viral(0.6, "Hot take", "Everyone was talking about it.");
      else {
        const g = addFollowers(ch, seed * 4 + pct(0.006, 0.02));
        addToFeed(c, makePost(c, ch, "Hot take", 2, { tone: "good" }));
        line(`Your hot take got people talking. You gained ${fmt(g)} ${p.people}.`);
      }
      break;
    }
    case "challenge": {
      const g = addFollowers(ch, seed * 4 + pct(0.008, 0.02) * (hotMult(world, ch.niche) > 1 ? 1.3 : 1));
      ch.momentum = Math.min(3, ch.momentum + 0.2);
      addToFeed(c, makePost(c, ch, "Trend", 1.6));
      line(`You jumped on ${TREND_NAMES[Math.floor(Math.random() * TREND_NAMES.length)]} on ${p.label}: ${fmt(g)} new ${p.people}. Reliable, if not original.`);
      if (Math.random() < hb * 0.35) viral(0.4, "Trend", "It hit the sweet spot.");
      break;
    }
    case "live": {
      const tips = Math.round(f * (0.002 + Math.random() * 0.004) * revScale(c) * (p.form === "live" ? 4 : 1));
      const g = addFollowers(ch, seed * 2 + pct(0.003, 0.01));
      if (tips > 0) {
        c.money += tips;
        s.oneOff = (s.oneOff ?? 0) + tips;
        s.earned += tips;
      }
      c.stress = clamp((c.stress ?? 25) + 2);
      changeStat(c, "happiness", 2, "Talking with your audience");
      addToFeed(c, makePost(c, ch, "Live", 1.2, { title: "Live: come hang out" }));
      line(`You went live on ${p.label}${g > 0 ? ` and gained ${fmt(g)} ${p.people}` : ""}${tips > 0 ? `, and viewers tipped ${money(tips)}` : ""}.`);
      break;
    }
    case "collab": {
      const partner = makePartner(ch, false);
      const ok = Math.random() < clamp(0.55 + (qf - 0.5) * 0.4 + s.image / 400 - (partner.followers > f * 3 ? 0.25 : 0), 0.15, 0.9);
      if (!ok) {
        line(`You pitched ${partner.name} a collab. They never replied.`);
      } else {
        line(runCollab(c, world, ch, partner).line);
      }
      break;
    }
    case "stunt": {
      const chance = clamp(hb * 2.2, 0.06, 0.4);
      changeStat(c, "happiness", 3, "A big project");
      s.burnout = clamp(s.burnout + 3);
      if (Math.random() < 0.12) {
        changeStat(c, "health", -randomInt(4, 12), "A stunt that went wrong");
        line("The stunt ended with a trip to the emergency room. (You got the footage, though.)");
      }
      if (Math.random() < chance) viral(1.4, "Stunt", "Months of planning paid off.");
      else {
        const g = addFollowers(ch, seed * 6 + pct(0.015, 0.04));
        addToFeed(c, makePost(c, ch, "Stunt", 2.4));
        line(`You pulled off a huge production for ${p.label}. It brought in ${fmt(g)} new ${p.people}${g < cost / 20 ? ", which wasn't quite worth the money" : ""}.`);
      }
      break;
    }
    case "giveaway": {
      const g = addFollowers(ch, seed * 6 + pct(0.02, 0.06));
      ch.fake = clamp(ch.fake + 3);
      ch.momentum = Math.min(3, ch.momentum + 0.2);
      s.image = clamp(s.image + 2, -100, 100);
      addToFeed(c, makePost(c, ch, "Giveaway", 3, { title: "GIVEAWAY: ends tonight" }));
      line(`You ran a giveaway: -${money(cost)} and ${fmt(g)} new ${p.people}. Some are only there for the prize.`);
      break;
    }
    case "reply": {
      s.replied = c.age;
      s.image = clamp(s.image + 2, -100, 100);
      changeStat(c, "happiness", 1, "Chatting with fans");
      line(`You spent a few evenings answering comments on ${p.label}. People noticed.`);
      break;
    }
    case "promo": {
      const g = addFollowers(ch, seed * (7 + Math.random() * 8) * (0.5 + qf) + pct(0.003, 0.006));
      addToFeed(c, makePost(c, ch, "Promoted", 2, { title: "Promoted: try this" }));
      line(`You paid for promotion on ${p.label}: -${money(cost)}. It brought in ${fmt(g)} ${p.people}.`);
      break;
    }
  }
  refresh(c);
  return true;
}

// ---------------------------------------------------------------- buying followers

export const followerPrice = (c: Character): number => Math.round(80 * costScale(c));
export function buyFollowers(c: Character, world: WorldState, platform: PlatformKey, thousands: number): boolean {
  const s = ensureSocial(c);
  const ch = channelOf(c, platform);
  if (!s || !ch || thousands <= 0 || c.age < 16) return false;
  const cost = followerPrice(c) * thousands;
  if (c.money < cost || countKey(c, "buy") >= 3) return false;
  if (s.actions.age !== c.age) s.actions = { age: c.age, n: {} };
  s.actions.n.buy = (s.actions.n.buy ?? 0) + 1;
  c.money -= cost;
  const bought = thousands * 1000;
  const cap = Math.max(1000, carrying(c, world, ch) * 1.2);
  const real = Math.min(bought, Math.max(0, cap - ch.followers));
  const oldFake = (ch.fake / 100) * ch.followers;
  addFollowers(ch, real);
  ch.fake = clamp(((oldFake + real) / Math.max(1, ch.followers)) * 100);
  c.yearLog.push(`You bought ${fmt(real)} followers on ${platformDef(platform).label} for ${money(cost)}. They don't do anything, but the number looks nice.`);
  if (Math.random() < clamp(0.2 + ch.fake / 200, 0.2, 0.6)) {
    s.image = clamp(s.image - 10, -100, 100);
    ch.strikes += 1;
    record(c, "You were caught buying followers. Screenshots are circulating.");
  }
  refresh(c);
  return true;
}

// ---------------------------------------------------------------- comment section

export type Comment = { user: string; text: string; tone: CommentTone };
export function commentsFor(c: Character, post: { id: string; platform: PlatformKey; viral?: boolean; tone?: string }, count = 7): Comment[] {
  const s = c.social;
  const ch = channelOf(c, post.platform);
  const rng = seeded(post.id);
  const image = s?.image ?? 0;
  const risk = ch ? styleDef(ch.style).risk : 0.06;
  const pHate = clamp(0.08 + -image / 250 + risk * 0.6 + (post.tone === "bad" ? 0.35 : 0) + (post.viral ? 0.06 : 0), 0.03, 0.75);
  const pLove = clamp(0.16 + image / 250 - (post.tone === "bad" ? 0.1 : 0), 0.04, 0.6);
  const nicheWord = ch ? nicheDef(ch.niche).label.toLowerCase().split(" & ")[0] : "this";
  const out: Comment[] = [];
  const user = () => {
    const r = seeded(post.id + out.length);
    return `@${["real", "just", "its", "the", "hey", "big", "lil", "not"][Math.floor(r() * 8)]}_${["fox", "moon", "toast", "wolf", "pixel", "waffle", "storm", "otter", "ghost", "noodle", "cloud", "gecko"][Math.floor(r() * 12)]}${Math.floor(r() * 99)}`;
  };
  for (let i = 0; i < count; i++) {
    const r = rng();
    let tone: CommentTone;
    if (r < pHate * 0.5) tone = "hate";
    else if (r < pHate) tone = "troll";
    else if (r < pHate + pLove) tone = rng() < 0.5 ? "love" : "praise";
    else {
      const q = rng();
      tone = q < 0.28 ? "neutral" : q < 0.62 ? "joke" : "question";
    }
    const pool = COMMENTS[tone];
    const text = pool[Math.floor(rng() * pool.length)].replace("{n}", nicheWord).replace("{y}", String(new Date().getFullYear()));
    out.push({ user: user(), text, tone });
  }
  return out;
}

// ---------------------------------------------------------------- what a year is worth

export type Earnings = { ads: number; members: number; merch: number };
export function earningsOf(c: Character, ch: Channel, eff: number, fAvg: number): Earnings {
  const p = platformDef(ch.platform);
  const n = nicheDef(ch.niche);
  const rev = revScale(c);
  const under = c.age < 18 ? 0.6 : 1;
  const ads = ch.monetised ? fAvg * p.adYield * n.cpm * Math.pow(Math.max(eff, 0.2), 0.7) * (1 - (ch.fake / 100) * 0.8) * (1 + ch.momentum * 0.1) * rev : 0;
  const members = ch.members ? fAvg * p.subRate * n.loyalty * p.subPrice * rev * (eff > 0 ? 1 : 0.5) : 0;
  const merch = ch.merch ? fAvg * 0.004 * n.loyalty * 14 * rev * (eff > 0 ? 1 : 0.4) : 0;
  return { ads: Math.round(ads * under), members: Math.round(members * under), merch: Math.round(merch * under) };
}

export function expectedIncome(c: Character): number {
  const s = c.social;
  if (!s) return 0;
  let t = 0;
  for (const ch of s.channels) {
    const e = earningsOf(c, ch, cadenceDef(ch.cadence).effort, ch.followers);
    t += e.ads + e.members + e.merch;
  }
  return Math.round(t + s.deals.reduce((a, d) => a + d.pay, 0));
}

// ---------------------------------------------------------------- refresh

export function refresh(c: Character): void {
  const s = c.social;
  if (!s) return;
  s.fame = computeFame(c);
  s.privacy = computePrivacy(c);
  s.topFollowers = Math.max(s.topFollowers, s.channels.reduce((t, ch) => t + ch.followers, 0));
}

// ---------------------------------------------------------------- the yearly tick

export function crisisKind(c: Character): { kind: string; age: number } | null {
  const raw = c.social?.crisis;
  if (!raw) return null;
  const [kind, age] = raw.split("@");
  return { kind, age: Number(age) };
}

export function tickCreator(c: Character, world: WorldState): void {
  const s = ensureSocial(c);
  if (!s) return;
  ensureWorldSocial(world);
  const log = (t: string) => c.yearLog.push(t);
  const chans = s.channels;

  // forced break
  if (s.burnout >= 100 && chans.some((ch) => ch.cadence !== "off")) {
    for (const ch of chans) ch.cadence = "off";
    s.burnout = 60;
    changeStat(c, "health", -6, "Burning out");
    changeStat(c, "happiness", -8, "Burning out");
    record(c, "You burned out. You couldn't face posting another thing, and your channels went quiet while you recovered.");
  }

  let recurring = 0;
  let sponsor = 0;
  let costs = 0;
  const overloaded: string[] = [];
  let loadBurn = 0;
  let loadStress = 0;
  let anyGrowth = 0;
  let anyDecline = 0;
  const lineHead: string[] = [];

  for (const ch of chans) {
    const p = platformDef(ch.platform);
    const n = nicheDef(ch.niche);
    const st = styleDef(ch.style);
    const cad = cadenceDef(ch.cadence);
    if (ch.bannedUntil && c.age >= ch.bannedUntil) {
      ch.bannedUntil = undefined;
      log(`Your ${p.label} account was reinstated.`);
    }
    const banned = isBanned(c, ch);
    const eff = banned || c.inJail ? 0 : cad.effort;
    const posts = banned || c.inJail ? 0 : cad.posts;
    const before = ch.followers;
    const q = qualityOf(c, ch);
    const qf = q / 100;
    const K = carrying(c, world, ch);
    const trend = trendOf(world, ch);
    const fit = n.fit[ch.platform] ?? 0.5;

    // steady, compounding growth from good, regular work
    const seed = eff > 0 ? seedOf(c, world, ch, eff) : 0;
    const consistency = Math.min(1, ch.years / 5);
    const luck = Math.exp((Math.random() - 0.5) * 0.9);
    // growth slows as an account gets big: doubling at a thousand is easy, at a million it isn't
    const sizeDecay = Math.pow(before / clamp(K * 0.0008, 500, 40000) + 1, -0.42);
    const rate = eff > 0 ? (0.09 + 0.62 * Math.pow(qf, 1.4) * (0.6 + 0.4 * n.loyalty) * (0.7 + 0.3 * consistency)) * sizeDecay * (1 + Math.max(-0.5, ch.momentum) * 0.35) * Math.pow(eff, 0.85) * trend * Math.pow(ch.appeal ?? 1, 0.7) * luck : 0;
    const room = Math.max(0, 1 - before / Math.max(1, K));
    const organic = before * rate * room + seed;

    // luck: a viral moment, heavy-tailed and scaled by the niche
    let viral = 0;
    let hits = 0;
    const rolls = eff > 1.8 ? 2 : eff > 0 ? 1 : 0;
    for (let i = 0; i < rolls; i++) {
      if (Math.random() < hitChance(c, world, ch, eff)) {
        viral += viralGain(c, world, ch);
        hits += 1;
      }
    }

    // people drift away, fast if you go quiet
    const inactive = eff < 0.5;
    let churn = before * ((1 - p.retention) * 0.12 + (inactive ? 0.12 + (1 - p.retention) * 0.35 : 0)) * (ch.fake > 30 ? 1.2 : 1);
    churn *= clamp(1.5 - n.loyalty * 0.4, 0.6, 1.3);
    if (s.replied === c.age - 1 || s.replied === c.age) churn *= 0.85;
    if (s.team.assistant) churn *= 0.9;
    // you can't sit above what the niche can hold
    const over = Math.max(0, before - K * 1.3);
    churn += over * 0.25;

    ch.followers = Math.max(0, Math.round(before + organic + viral - churn));
    ch.peak = Math.max(ch.peak, ch.followers);
    ch.momentum = Math.max(-1, ch.momentum * 0.55 + (hits > 0 ? 1.4 : 0) + (eff === 0 ? -0.3 : 0));
    ch.momentum = Math.min(3, ch.momentum);
    if (hits > 0) {
      ch.hits += hits;
      addToFeed(c, makePost(c, ch, "Viral", 14 + Math.random() * 22, { viral: true, tone: "good" }));
      record(c, `${hits > 1 ? "Two" : "A"} ${p.post}${hits > 1 ? "s" : ""} on your ${p.label} went viral, bringing in ${fmt(viral)} new ${p.people}.`);
    }
    if (eff > 0) {
      ch.years += 1;
      // a highlight of the year, and now and then a flop
      addToFeed(c, makePost(c, ch, cad.posts >= 250 ? "Best of the year" : "Top of the year", 1.4 + Math.random() * 1.5, { tone: "neutral" }));
      if (Math.random() < 0.22 + (0.5 - qf) * 0.3) addToFeed(c, makePost(c, ch, "Flop", 0.15 + Math.random() * 0.3, { flop: true, tone: "bad", title: "Nobody saw this one" }));
    }
    ch.fake = clamp(ch.fake * 0.85);
    const fAvg = (before + ch.followers) / 2;
    ch.views = Math.round(fAvg * viewRate(ch.platform) * Math.pow(Math.max(0, posts), 0.85) * (1 + Math.max(0, ch.momentum) * 0.3) + viral * 12);
    ch.gain = ch.followers - (ch.history[ch.history.length - 1] ?? 0);
    ch.history.push(ch.followers);
    if (ch.history.length > 45) ch.history.shift();
    if (ch.gain > 0) anyGrowth += 1;
    else if (ch.gain < 0) anyDecline += 1;

    // rules, strikes and suspensions
    if (eff > 0) {
      const strikeP = st.risk * n.risk * 0.9 * Math.min(1.5, eff);
      if (Math.random() < strikeP) {
        ch.strikes += 1;
        log(`Your ${p.label} got a strike for content that broke the rules.`);
        s.image = clamp(s.image - 3, -100, 100);
        if (ch.strikes >= 3) {
          ch.strikes = 0;
          ch.bannedUntil = c.age + 1 + randomInt(0, 1);
          ch.followers = Math.round(ch.followers * 0.85);
          log(`${p.label} suspended your account after repeated strikes. You can't post until ${ch.bannedUntil}.`);
        }
      } else if (ch.strikes > 0 && Math.random() < 0.25) ch.strikes -= 1;
    }

    // milestones and awards
    const crossed = MILESTONES.filter((m) => ch.followers >= m && !ch.milestones.includes(m));
    if (crossed.length) {
      ch.milestones.push(...crossed);
      const top = crossed[crossed.length - 1];
      if (top >= 1000) record(c, `Your ${p.label} reached ${fmt(top)} ${p.people}.`, top >= 100_000);
      if (ch.platform === "youtube") {
        const btn = [...PLAY_BUTTONS].reverse().find((b) => crossed.includes(b.at));
        if (btn) record(c, `YouTube sent you a ${btn.label}. It's on the wall behind you.`, true);
      }
    }
    if (!ch.monetised && ch.followers >= p.monetise && eff > 0 && c.age >= 13) {
      ch.monetised = true;
      record(c, `You're now monetised on ${p.label}: you qualify for ${p.monetiseName}.`);
    }

    // what it earned
    const e = earningsOf(c, ch, eff, fAvg);
    ch.revenue = e.ads + e.members + e.merch;
    recurring += ch.revenue;
    // the kit, paid whether or not you posted much
    costs += gearCost(c, ch) * (eff === 0 ? 0.4 : 1);
    if (cad.posts >= 250 || ch.cadence === "grind") {
      const b = busy(c);
      if (b) overloaded.push(`${p.label}`);
    }
    loadBurn = Math.max(loadBurn, cad.burnout) + (loadBurn > 0 ? cad.burnout * 0.35 : 0);
    loadStress += cad.stress;
    lineHead.push(`${p.label} ${before === ch.followers ? "held at" : ch.followers > before ? "grew from" : "fell from"} ${before === ch.followers ? fmt(ch.followers) : `${fmt(before)} to ${fmt(ch.followers)}`}`);
  }

  // deals you signed
  for (const d of [...s.deals]) {
    const ch = channelOf(c, d.platform);
    const b = brandDef(d.brand);
    if (!ch || isBanned(c, ch) || ch.cadence === "off") {
      const pen = Math.round(d.pay * 0.4);
      c.money -= pen;
      s.image = clamp(s.image - 5, -100, 100);
      s.deals = s.deals.filter((x) => x.id !== d.id);
      log(`You didn't hold up your end of the deal with ${b?.name ?? "a brand"}. They pulled out and took back ${money(pen)}.`);
      continue;
    }
    sponsor += d.pay;
    d.yearsLeft -= 1;
    if (d.yearsLeft <= 0) {
      s.deals = s.deals.filter((x) => x.id !== d.id);
      log(`Your deal with ${b?.name ?? "a brand"} came to an end.`);
    }
    if (d.sketchy && Math.random() < 0.14) {
      s.image = clamp(s.image - randomInt(6, 12), -100, 100);
      ch.followers = Math.round(ch.followers * 0.94);
      log(`${b?.name ?? "A sponsor"} turned out to be selling something dodgy, and your audience noticed you'd promoted it.`);
    }
  }

  // team wages
  const gross = recurring + sponsor;
  if (s.team.editor) costs += Math.max(2500 * costScale(c), gross * 0.1);
  if (s.team.assistant) costs += Math.max(4000 * costScale(c), gross * 0.06);
  if (s.team.manager) costs += gross * 0.15;
  costs = Math.round(costs);

  // the books
  const oneOff = s.oneOff ?? 0;
  const recNet = Math.round(gross * (c.age < 18 ? 0.6 : 1)) - costs;
  let tax = 0;
  if (recNet + oneOff > 0 && c.age >= 18) {
    const base = c.job ? salaryNow(c, world) : 0;
    tax = Math.max(0, incomeTax(base + recNet + oneOff, c.originRegion, taxCredit(c)) - (c.job ? incomeTax(base, c.originRegion, taxCredit(c)) : 0));
  }
  c.money += recNet - tax;
  s.earned += gross;
  const total = recNet + oneOff;
  s.lastEarned = Math.max(0, total);
  s.lastTax = tax;
  s.bestYear = Math.max(s.bestYear, total);
  s.oneOff = 0;
  if (recNet + oneOff !== 0 || gross > 0) noteIncome(c, recNet + oneOff - tax, tax);
  if (chans.length > 0) {
    log(`${lineHead.join("; ")}.`);
  }
  if (gross > 0 || costs > 0) {
    log(
      `Your content brought in ${money(gross)}${sponsor > 0 ? ` (${money(sponsor)} from sponsors)` : ""}${costs > 0 ? `, cost ${money(costs)} to make` : ""}${tax > 0 ? `, and ${money(tax)} went in tax` : ""}${c.age < 18 && gross > 0 ? ". Your parents keep 40% in a trust for you" : ""}.`,
    );
  }
  // money trouble: cut back the kit
  if (c.money < 0 && c.age >= 18) {
    for (const ch of chans) {
      if (ch.gear !== "phone") {
        ch.gear = "phone";
        log(`Money got tight, so your ${platformDef(ch.platform).label} setup went back to a phone.`);
      }
    }
    for (const r of ["editor", "assistant"] as const) if (s.team[r]) delete s.team[r];
  }

  // time, stress and the toll
  const idle = chans.length === 0 || chans.every((ch) => ch.cadence === "off");
  const teamEase = (s.team.editor ? 0.7 : 1) * (s.team.assistant ? 0.85 : 1);
  s.burnout = clamp(s.burnout + (idle ? -14 : loadBurn * teamEase) + (s.image < -20 ? 3 : 0));
  c.stress = clamp((c.stress ?? 25) + loadStress * teamEase * 0.5 + (s.privacy < 45 ? (45 - s.privacy) / 12 : 0));
  if (s.burnout > 60 && !idle) changeStat(c, "happiness", -Math.round((s.burnout - 60) / 10), "Burnout");
  if (anyGrowth > 0 && anyGrowth >= anyDecline) changeStat(c, "happiness", 2, "Growing an audience");
  else if (anyDecline > 0) changeStat(c, "happiness", -2, "Losing an audience");
  if (overloaded.length) {
    const b = busy(c);
    if (b === "job" && c.job) {
      c.job.perf = clamp((c.job.perf ?? 55) - 4);
      log("Posting every day on top of a full-time job is showing in your work.");
    } else if (b === "school") {
      changeStat(c, "smarts", -1, "Posting instead of studying");
      log("Your grades slipped while you were busy posting.");
    }
  }

  // reputation: your style, what people say, and a slow pull back to neutral
  const styles = chans.filter((ch) => ch.cadence !== "off");
  const drift = styles.length ? styles.reduce((t, ch) => t + styleDef(ch.style).image, 0) / styles.length : 0;
  s.image = clamp(s.image * 0.9 + drift + (Math.random() - 0.5) * 2, -100, 100);
  s.leak = Math.max(0, (s.leak ?? 0) * 0.85);

  // a controversy that never got answered fades, but not for free
  const cr = crisisKind(c);
  if (cr && c.age - cr.age >= 2) {
    s.crisis = null;
    s.image = clamp(s.image - 4, -100, 100);
    log("You never answered the controversy. It blew over, but people haven't forgotten.");
  }
  // trouble finds big, edgy accounts
  if (!s.crisis && styles.length) {
    const risk = Math.max(...styles.map((ch) => styleDef(ch.style).risk * nicheDef(ch.niche).risk));
    if (s.fame >= 8 && Math.random() < risk * (1 + s.fame / 100) * 0.55 * (s.team.manager ? 0.75 : 1)) {
      s.crisis = `backlash@${c.age}`;
      log("Something you posted is going around for all the wrong reasons.");
    }
  }

  refresh(c);
  // famous enough to be noticed
  const marks = [20, 40, 60, 80];
  const hit = marks.filter((m) => s.fame >= m && (s.fameSeen ?? 0) < m);
  if (hit.length) {
    s.fameSeen = Math.max(...hit);
    const m = s.fameSeen;
    log(m >= 80 ? "You can't go anywhere without being recognised. People cross the road to get a photo." : m >= 60 ? "Strangers recognise you in the street now, and most of them are kind about it." : m >= 40 ? "A stranger recognised you in a shop today. You're actually a little bit famous." : "Someone recognised you from your channel for the first time.");
    if (m >= 60) leak(c, 4);
  }
  tickInbox(c, world);
}

// ---------------------------------------------------------------- a life's summary

export function creatorSummary(c: Character) {
  const s = c.social;
  if (!s || (s.channels.length === 0 && s.earned === 0)) return null;
  const peak = s.topFollowers;
  return {
    peak,
    earned: s.earned,
    bestYear: s.bestYear,
    hits: s.channels.reduce((t, ch) => t + ch.hits, 0),
    fame: s.fame,
    channels: s.channels.length,
    top: biggest(c),
  };
}

export { randomHandle, engagementOf, pushPost };

// the niche that would suit you best on a platform, from what you're good at and what you already do
export function suggestNiche(c: Character, platform: PlatformKey): string {
  let best = "vlogs";
  let bestScore = -1e9;
  for (const n of NICHES) {
    if (c.age < n.minAge) continue;
    const hobby = Math.max(0, ...n.hobbies.map((h) => c.hobbies?.[h]?.level ?? 0));
    const score = ((c.talents?.[n.talent] ?? 50) - 50) * 0.5 + hobby * 0.6 + (n.fit[platform] ?? 0.4) * 22 + Math.random() * 8;
    if (score > bestScore) {
      bestScore = score;
      best = n.key;
    }
  }
  return best;
}
