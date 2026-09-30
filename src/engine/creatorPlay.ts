import { Channel, Character, Post, WorldState } from "../types";
import { fmt, nicheDef, platformDef, postTitle, starName, styleDef } from "../data/social";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { carrying, channelOf, engagementOf, money, pushPost, qualityOf, viewRate } from "./creatorCore";

// Small moves the actions, the inbox and the yearly tick all share.

let counter = 0;
export const postId = (c: Character) => `p${c.age}-${counter++}-${Math.random().toString(36).slice(2, 6)}`;

export function addFollowers(ch: Channel, n: number): number {
  const before = ch.followers;
  ch.followers = Math.max(0, Math.round(ch.followers + n));
  ch.peak = Math.max(ch.peak, ch.followers);
  return ch.followers - before;
}

// a viral moment: heavy-tailed, and scaled by how big the niche can get, so a craft channel's big day is
// tens of thousands and a comedy channel's can be millions
export function viralGain(c: Character, world: WorldState, ch: Channel, boost = 1): number {
  const K = carrying(c, world, ch);
  const qf = qualityOf(c, ch) / 100;
  const U = Math.max(0.002, Math.random());
  const raw = (K * 0.0003 + ch.followers * 0.22) * Math.pow(U, -0.9) * (0.6 + qf) * boost;
  return Math.round(Math.min(raw, Math.max(0, K * 1.5 - ch.followers)));
}

export function makePost(c: Character, ch: Channel, kind: string, mult: number, opts: Partial<Post> = {}): Post {
  const p = platformDef(ch.platform);
  const eng = engagementOf(c, ch);
  const views = Math.max(20, Math.round(Math.max(60, ch.followers) * viewRate(ch.platform) * (0.5 + Math.random()) * mult));
  const likes = Math.round(views * eng * (0.7 + Math.random() * 0.6) * 1.6);
  return {
    id: postId(c), age: c.age, platform: ch.platform, kind, title: postTitle(ch.niche, !!opts.viral), views, likes,
    comments: Math.round(likes * (0.04 + Math.random() * 0.05)), shares: Math.round(likes * (0.05 + Math.random() * 0.08)), ...opts,
  };
}

export function addToFeed(c: Character, post: Post): void {
  if (c.social) pushPost(c.social, post);
}

// the platform-side result of a collab: both audiences see each other
export function runCollab(c: Character, world: WorldState, ch: Channel, partner: { name: string; followers: number }): { gain: number; line: string } {
  const qf = qualityOf(c, ch) / 100;
  const share = clamp(0.012 + Math.random() * 0.03, 0, 0.06) * (0.5 + qf);
  const fromPartner = partner.followers * share * (partner.followers > ch.followers * 4 ? 0.7 : 1);
  const gain = addFollowers(ch, clamp(Math.max(15, fromPartner + ch.followers * 0.01), 15, ch.followers * 0.12 + 60));
  const post = makePost(c, ch, "Collab", 2.2 + Math.random(), { title: `Collab with ${partner.name}`, tone: "good" });
  addToFeed(c, post);
  ch.momentum = Math.min(3, ch.momentum + 0.3);
  changeStat(c, "happiness", 3, "A collab");
  return { gain, line: `You made something with ${partner.name} (${fmt(partner.followers)} followers) and picked up ${fmt(gain)} new ${platformDef(ch.platform).people}.` };
}

export function makePartner(ch: Channel, wantBigger = false): { name: string; followers: number } {
  const f = Math.max(300, ch.followers);
  const mult = wantBigger ? 1.5 + Math.random() * 4 : 0.4 + Math.random() * 1.8;
  return { name: starName(), followers: Math.round(f * mult) };
}

export function friendOf(c: Character) {
  const list = c.relationships.filter((r) => r.type === "friend" && r.alive && r.status !== "estranged");
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

export const leak = (c: Character, n: number) => {
  if (c.social) c.social.leak = clamp((c.social.leak ?? 0) + n, 0, 60);
};

export { channelOf, nicheDef, styleDef, money };
