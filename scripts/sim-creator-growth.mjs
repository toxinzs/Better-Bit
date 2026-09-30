import { createCharacter } from "./../src/engine/lifeEngine.ts";
import { createInitialWorldState } from "./../src/engine/worldState.ts";
import { openChannel, setPlan, tickCreator, refresh } from "./../src/engine/creator.ts";
import { tickSocialWorld } from "./../src/engine/socialWorld.ts";
import { answerInbox } from "./../src/engine/inbox.ts";
import { ensureSocial, qualityOf } from "./../src/engine/creatorCore.ts";

const arche = {
  "YT comedy weekly/home": { p: "youtube", n: "comedy", cad: "steady", gear: "home", style: "standard" },
  "TikTok dance daily/edgy": { p: "tiktok", n: "dance", cad: "daily", gear: "phone", style: "edgy" },
  "YT crafts weekly/wholesome": { p: "youtube", n: "crafts", cad: "steady", gear: "home", style: "wholesome" },
  "Podcast finance weekly": { p: "podcast", n: "finance", cad: "steady", gear: "home", style: "standard" },
  "Twitch gaming daily/studio": { p: "twitch", n: "gaming", cad: "daily", gear: "studio", style: "standard" },
  "IG photo casual": { p: "instagram", n: "photography", cad: "casual", gear: "home", style: "standard" },
  "YT gaming weekly/phone": { p: "youtube", n: "gaming", cad: "steady", gear: "phone", style: "standard" },
  "X news bait daily": { p: "x", n: "news", cad: "daily", gear: "phone", style: "bait" },
};
const N = Number(process.argv[2] ?? 300), YEARS = Number(process.argv[3] ?? 20);
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(a.length * q))];
const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n));
for (const [name, a] of Object.entries(arche)) {
  const y10 = [], finals = [], earned = [], fames = [], time100k = [];
  let r1k = 0, r10k = 0, r100k = 0, r1m = 0, r10m = 0, bans = 0;
  for (let i = 0; i < N; i++) {
    const c = createCharacter("Test", "Person", "male", "us");
    const world = createInitialWorldState();
    c.age = 18; c.money = 1e7; c.job = null; c.educationStage = "graduated";
    openChannel(c, world, a.p, a.n);
    setPlan(c, a.p, { cadence: a.cad, gear: a.gear, style: a.style });
    let t100 = null;
    for (let y = 0; y < YEARS; y++) {
      c.age += 1; c.yearLog = [];
      tickSocialWorld(world);
      tickCreator(c, world);
      for (const it of [...c.social.inbox]) if (it.kind === 'brand') answerInbox(c, world, it.id, 'accept'); else if (it.kind==='agency'||it.kind==='platform'||it.kind==='collab') answerInbox(c, world, it.id, 'accept'); else answerInbox(c, world, it.id, 'ignore');
      c.money = Math.max(c.money, 1e6);
      const ch = c.social.channels[0];
      // a sensible player rests when burnt out
      if (c.social.burnout > 70) setPlan(c, a.p, { cadence: "casual" }); else if (c.social.burnout < 30 && ch.cadence !== a.cad) setPlan(c, a.p, { cadence: a.cad });
      if (y === 9) y10.push(ch.followers);
      if (ch.followers >= 100000 && t100 === null) t100 = y + 1;
    }
    const ch = c.social.channels[0];
    finals.push(ch.followers); earned.push(c.social.earned); fames.push(c.social.fame); if (t100) time100k.push(t100);
    if (ch.followers >= 1000) r1k++; if (ch.followers >= 10000) r10k++; if (ch.followers >= 100000) r100k++; if (ch.followers >= 1e6) r1m++; if (ch.followers >= 1e7) r10m++;
  }
  y10.sort((x, y) => x - y); finals.sort((x, y) => x - y); earned.sort((x, y) => x - y); fames.sort((x, y) => x - y);
  console.log(`${name.padEnd(28)} y10 med ${fmt(pct(y10, .5)).padStart(6)} p90 ${fmt(pct(y10, .9)).padStart(6)} | y20 med ${fmt(pct(finals, .5)).padStart(6)} p10 ${fmt(pct(finals, .1)).padStart(6)} p90 ${fmt(pct(finals, .9)).padStart(6)} p99 ${fmt(pct(finals, .99)).padStart(7)} | >=1k ${(100*r1k/N).toFixed(0)}% 10k ${(100*r10k/N).toFixed(0)}% 100k ${(100*r100k/N).toFixed(0)}% 1M ${(100*r1m/N).toFixed(1)}% 10M ${(100*r10m/N).toFixed(1)}% | earned med $${fmt(pct(earned,.5))} p90 $${fmt(pct(earned,.9))} | fame med ${pct(fames,.5)} p90 ${pct(fames,.9)}`);
}
