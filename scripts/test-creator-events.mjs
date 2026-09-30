import { createCharacter } from "./../src/engine/lifeEngine.ts";
import { createInitialWorldState } from "./../src/engine/worldState.ts";
import * as CR from "./../src/engine/creator.ts";
import { ensureSocial, computeFame } from "./../src/engine/creatorCore.ts";
import { CREATOR_EVENTS } from "./../src/data/events/creator.ts";
import { newPerson } from "./../src/engine/people.ts";

function base(age, region = "us") {
  const c = createCharacter("Ev", "Test", "female", region);
  c.age = age; c.money = 200000; c.yearLog = [];
  return c;
}
function addPeople(c) {
  for (const t of ["mother", "father", "partner", "friend", "ex", "child", "sibling", "grandchild"]) {
    if (!c.relationships.some((r) => r.type === t)) c.relationships.push(newPerson(c, { type: t, age: t === "child" || t === "grandchild" ? 6 : t === "friend" ? c.age : c.age + 25 }));
  }
}
function creatorize(c, world) {
  c.job = null;
  CR.openChannel(c, world, "youtube", "comedy", "evtest");
  CR.openChannel(c, world, "tiktok", "dance");
  if (c.age >= 13) CR.openChannel(c, world, "twitch", "gaming");
  const s = ensureSocial(c, true);
  const yt = s.channels[0];
  yt.followers = 60000; yt.peak = 60000; yt.monetised = true; yt.verified = true; yt.merch = true; yt.members = true; yt.years = 5; yt.momentum = 1.5; yt.gain = 0; yt.history = [50000, 60000];
  s.channels[1].followers = 3000; s.channels[2].followers = 2500;
  s.channels.forEach((ch) => (ch.fake = 25));
  s.team = { editor: true, assistant: true, manager: true };
  s.deals = [{ id: "d1", brand: "coinbay", kind: "ambassador", platform: "youtube", pay: 5000, yearsLeft: 2, started: c.age, sketchy: true }];
  s.lastEarned = 90000; s.topFollowers = 65000; s.burnout = 70; s.image = -20; s.leak = 30; s.startAge = c.age - 8;
  CR.refresh(c);
  s.privacy = 30; s.fame = Math.max(s.fame, 45);
  return c;
}
const world = createInitialWorldState();
const variants = [];
{ const c = base(30); addPeople(c); creatorize(c, world); c.job = { title: "Clerk", salary: 40000, kind: "fulltime", minAge: 18, field: "Office" }; c.residence = { ...(c.residence ?? {}), housing: "rent", city: c.residence?.city ?? "nyc" }; variants.push(["adult-creator-job", c]); }
{ const c = base(30); addPeople(c); creatorize(c, world); c.social.crisis = "backlash@30"; c.residence = { ...(c.residence ?? {}), housing: "own", city: c.residence?.city ?? "nyc" }; for (const ch of c.social.channels) ch.cadence = "daily"; variants.push(["adult-crisis", c]); }
{ const c = base(15); addPeople(c); c.educationStage = "high"; variants.push(["teen-noncreator", c]); }
{ const c = base(15); addPeople(c); c.educationStage = "high"; creatorize(c, world); variants.push(["teen-creator", c]); }
{ const c = base(70); addPeople(c); variants.push(["senior-noncreator", c]); }
{ const c = base(45); addPeople(c); creatorize(c, world); for (const ch of c.social.channels) ch.cadence = "off"; variants.push(["off-creator", c]); }
{ const c = base(22); addPeople(c); variants.push(["young-noncreator", c]); }
let tested = 0, choicesRun = 0, fails = 0;
const never = new Set(CREATOR_EVENTS.map((e) => e.id));
const chk = (o, path, out) => { if (typeof o === "number" && !Number.isFinite(o)) out.push(path); else if (o && typeof o === "object") for (const k of Object.keys(o)) chk(o[k], path + "." + k, out); };
for (const ev of CREATOR_EVENTS) {
  for (const [vn, v] of variants) {
    if (v.age < ev.minAge || v.age > ev.maxAge) continue;
    let ok = false; try { ok = !ev.condition || ev.condition(v, world); } catch (e) { console.log("COND THROW", ev.id, vn, e.message); fails++; continue; }
    if (!ok) continue;
    never.delete(ev.id); tested++;
    try { ev.text(v, world); } catch (e) { console.log("TEXT THROW", ev.id, e.message); fails++; }
    const n = ev.choices?.length ?? 0;
    if (ev.autoEffect) { const c2 = structuredClone(v); try { ev.autoEffect(c2, world); const bad = []; chk(c2, "c", bad); if (bad.length) { console.log("NaN", ev.id, bad.slice(0,3)); fails++; } } catch (e) { console.log("AUTO THROW", ev.id, e.message, e.stack.split("\n")[1]); fails++; } }
    for (let i = 0; i < n; i++) {
      for (let rep = 0; rep < 6; rep++) {
        const c2 = structuredClone(v);
        try { const r = ev.choices[i].effect(c2, world); ev.choices[i].resultText?.(c2, world); choicesRun++; const bad = []; chk(c2, "c", bad); if (bad.length) { console.log("NaN", ev.id, i, bad.slice(0,3)); fails++; } if (r && typeof r === "object") r.text?.(c2, world); } catch (e) { console.log("CHOICE THROW", ev.id, vn, i, e.message, e.stack.split("\n")[1]); fails++; }
      }
    }
  }
}
console.log(`events ${CREATOR_EVENTS.length}, tested ${tested}, choices run ${choicesRun}, fails ${fails}`);
console.log("never eligible in any variant:", [...never].join(", "));
