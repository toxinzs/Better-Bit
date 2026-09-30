import { WorldState } from "../types";
import { NICHES, PLATFORMS, nicheDef, platformDef, starName } from "../data/social";
import { ensureWorldSocial } from "./creatorCore";
import { clamp } from "./util";

// The internet moves on without you: platforms rise and fade, niches have their moments, and a handful
// of big names come and go. It lives on the world state, so it's the same internet in every life.

export function tickSocialWorld(world: WorldState): void {
  const w = ensureWorldSocial(world);
  // platform popularity drifts back toward normal and jostles
  for (const p of PLATFORMS) {
    const cur = w.pop[p.key] ?? 1;
    w.pop[p.key] = clamp(cur + (1 - cur) * 0.2 + (Math.random() - 0.5) * 0.1, 0.35, 1.5);
  }
  let mood = "";
  // now and then a platform falls out of fashion
  if (Math.random() < 0.02) {
    const p = PLATFORMS[1 + Math.floor(Math.random() * (PLATFORMS.length - 1))];
    w.pop[p.key] = 0.45;
    mood = `${p.label} is losing people fast. Everyone's talking about where they'll go next.`;
  }
  // niches heat up and cool down
  w.hot = w.hot.map((h) => ({ ...h, years: h.years - 1 })).filter((h) => h.years > 0);
  if (w.hot.length < 3 && Math.random() < 0.4) {
    const n = NICHES[Math.floor(Math.random() * NICHES.length)];
    if (!w.hot.some((h) => h.niche === n.key)) {
      const cold = Math.random() < 0.25;
      w.hot.push({ niche: n.key, mult: cold ? 0.65 : 1.4 + Math.random() * 1.2, years: 2 + Math.floor(Math.random() * 3) });
      if (!mood) mood = cold ? `Interest in ${n.label.toLowerCase()} has fallen off a cliff.` : `${n.label} is having a moment. Everyone's suddenly into it.`;
    }
  }
  // the big names
  for (const s of w.stars) {
    s.followers = Math.round(s.followers * (0.93 + Math.random() * 0.3));
    const cap = nicheDef(s.niche).ceiling * platformDef(s.platform).scale * 0.6;
    if (s.followers > cap) s.followers = Math.round(cap);
  }
  if (Math.random() < 0.15 && w.stars.length > 0) {
    const i = Math.floor(Math.random() * w.stars.length);
    const old = w.stars[i];
    const nk = NICHES[Math.floor(Math.random() * NICHES.length)];
    w.stars[i] = { name: starName(), platform: old.platform, niche: nk.key, followers: Math.round(Math.max(30000, old.followers * (0.3 + Math.random() * 0.5))) };
    if (!mood) mood = `A new name, ${w.stars[i].name}, has come out of nowhere and is everywhere.`;
  }
  w.mood = mood || w.mood;
}
