import { createCharacter, ageUp, resolveEvent } from "./../src/engine/lifeEngine.ts";
import { createInitialWorldState } from "./../src/engine/worldState.ts";
import * as CR from "./../src/engine/creator.ts";
import { answerInbox } from "./../src/engine/inbox.ts";
import { ACTIONS, NICHES, PLATFORMS } from "./../src/data/social.ts";
import { EVENTS } from "./../src/data/events/index.ts";
import { nextDecisionEvent } from "./../src/engine/decisionQueue.ts";

const REGIONS = ["us","uk","nigeria","japan","brazil","canada","australia","germany","france","india","mexico","southkorea"];
const N = Number(process.argv[2] ?? 200);
let exceptions = 0, nan = 0, creators = 0, lives = 0, popEvents = 0;
const evCount = {};
const stats = { peak: [], earned: [], fame: [], age: [] };
const errs = new Map();
function bad(v) { return typeof v === "number" && !Number.isFinite(v); }
for (let i = 0; i < N; i++) {
  const region = REGIONS[i % REGIONS.length];
  let c, world;
  try {
    c = createCharacter("Test" + i, "Person", ["male","female"][i%2], region);
    world = createInitialWorldState();
  } catch (e) { exceptions++; errs.set("create:" + e.message, 1); continue; }
  lives++;
  const willCreate = Math.random() < 0.75;
  const startAge = 13 + Math.floor(Math.random() * 12);
  const plan = { p: PLATFORMS[Math.floor(Math.random()*PLATFORMS.length)].key };
  try {
    for (let y = 0; y < 100 && c.alive; y++) {
      const res = ageUp(c, world);
      if (!c.alive) break;
      let ev = res.pendingEvent ?? nextDecisionEvent(c, world);
      let guard = 0;
      while (ev && guard++ < 20) {
        evCount[ev.id] = (evCount[ev.id] ?? 0) + 1;
        const opts = (ev.choices ?? []).map((ch, idx) => ({ ch, idx })).filter((x) => !x.ch.disabled);
        if (!opts.length) break;
        const pick = opts[Math.floor(Math.random() * opts.length)];
        ev = resolveEvent(c, world, ev, pick.idx);
      }
      // player behaviour
      if (willCreate && c.age >= startAge && !c.social?.channels.length && c.age < 60 && Math.random() < 0.7) {
        const p = plan.p;
        if (CR.openCheck(c, p, "vlogs").ok) CR.openChannel(c, world, p, CR.suggestNiche(c, p));
      }
      const s = c.social;
      if (s && s.channels.length) {
        // sometimes add a platform
        if (Math.random() < 0.08 && s.channels.length < 6) { const pp = PLATFORMS[Math.floor(Math.random()*6)].key; if (CR.openCheck(c, pp, "vlogs").ok) CR.openChannel(c, world, pp, CR.suggestNiche(c, pp)); }
        for (const ch of [...s.channels]) {
          if (Math.random() < 0.3) CR.setPlan(c, ch.platform, { cadence: ["casual","steady","steady","daily","grind","off"][Math.floor(Math.random()*6)], style: ["standard","standard","wholesome","edgy","bait"][Math.floor(Math.random()*5)], gear: ["phone","home","studio"][Math.floor(Math.random()*3)] });
          if (s.burnout > 75) CR.setPlan(c, ch.platform, { cadence: "casual" });
          for (const a of ACTIONS) if (Math.random() < 0.4) CR.doAction(c, world, ch.platform, a.key);
          if (Math.random() < 0.05) CR.buyFollowers(c, world, ch.platform, 1);
          if (Math.random() < 0.1) CR.launchMembers(c, ch.platform);
          if (Math.random() < 0.1) CR.launchMerch(c, ch.platform);
          if (Math.random() < 0.02) CR.closeChannel(c, ch.platform);
        }
        for (const r of ["editor","assistant","manager"]) if (Math.random() < 0.1) CR.hire(c, r);
        for (const it of [...s.inbox]) { const o = it.options[Math.floor(Math.random()*it.options.length)]; answerInbox(c, world, it.id, o.key); }
      }
      // sanity checks
      if (bad(c.money)) { nan++; errs.set("money NaN age " + c.age, 1); break; }
      if (s) for (const ch of s.channels) if (bad(ch.followers) || bad(ch.momentum) || bad(ch.revenue)) { nan++; errs.set("channel NaN " + ch.platform, 1); }
      if (s && (bad(s.fame) || bad(s.image) || bad(s.privacy) || bad(s.burnout))) { nan++; errs.set("social NaN", 1); }
      c.yearLog = c.yearLog; // no-op
    }
  } catch (e) {
    exceptions++;
    const k = e.message + " @ " + (e.stack.split("\n")[1] ?? "").trim();
    errs.set(k, (errs.get(k) ?? 0) + 1);
  }
  const s = c.social;
  if (s && (s.channels.length || s.earned)) { creators++; stats.peak.push(s.topFollowers); stats.earned.push(s.earned); stats.fame.push(s.fame); stats.age.push(c.age); }
}
const pct = (a, q) => { a = [...a].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * q))]; };
const f = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n ?? 0));
console.log(`lives ${lives}, creators ${creators}, exceptions ${exceptions}, NaN ${nan}`);
console.log(`peak followers med ${f(pct(stats.peak,.5))} p90 ${f(pct(stats.peak,.9))} max ${f(Math.max(...stats.peak))} | earned med $${f(pct(stats.earned,.5))} p90 $${f(pct(stats.earned,.9))} | fame med ${pct(stats.fame,.5)} p90 ${pct(stats.fame,.9)}`);
const cre = Object.entries(evCount).filter(([k]) => EVENTS.find(e => e.id === k) && /creator|hater|fan|algorithm|copyright|hacked|impersonat|stolen|second-video|plateau|meetup|recognised|brand|sponsor|giveaway|merch|tip|audit|gear|old-post|hit-piece|ex-tells|partner-jealous|family-content|parent-embarr|boss-finds|school-jealousy|tired|read-the|stalker|doxxed|deepfake|marathon|manager|editor|viral|collab|podcast|tv-|award|boycott|crypto|bought|young-fan|comment-needs|neighbour|friend-|grandparent|reboot|first-|school-clip|parents-screen/.test(k));
console.log("creator events seen:", cre.length, cre.map(([k,v]) => k+":"+v).join(" "));
for (const [k, v] of errs) console.log("ERR", v, k);
