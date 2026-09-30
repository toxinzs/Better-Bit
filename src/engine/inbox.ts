import { Channel, Character, Deal, DealKind, InboxItem, InboxKind, PlatformKey, WorldState } from "../types";
import { BRANDS, BrandDef, FAN_MESSAGES, FRIEND_ASKS, HATE_MESSAGES, PRESS_LINES, SCAM_MESSAGES, brandDef, fmt, nicheDef, platformDef, randomHandle, starName, styleDef } from "../data/social";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { biggest, channelOf, costScale, engagementOf, ensureSocial, money, record, revScale } from "./creatorCore";
import { addFollowers, friendOf, leak, makePartner, runCollab } from "./creatorPlay";
import { noteIncome } from "./where";

// Everything that lands in your inbox: brand deals, collab requests, fans, haters, the platform, press,
// scams and people who suddenly want something. Items are plain data so they survive a save.

let n = 0;
const iid = (c: Character) => `i${c.age}-${n++}-${Math.random().toString(36).slice(2, 6)}`;

const MAX_INBOX = 10;

function push(c: Character, item: Omit<InboxItem, "id" | "age">): void {
  const s = ensureSocial(c, true)!;
  if (item.kind === "brand") c.yearLog.push(`${item.from} wants to work with you. Check your inbox.`);
  s.inbox.unshift({ ...item, id: iid(c), age: c.age });
  if (s.inbox.length > MAX_INBOX) s.inbox.length = MAX_INBOX;
}

// ---------------------------------------------------------------- deals

const KIND_MULT: Record<DealKind, number> = { post: 1, series: 3, ambassador: 2.6 };
const KIND_WORD: Record<DealKind, string> = { post: "one sponsored post", series: "a series of sponsored posts over the next year", ambassador: "a multi-year ambassador role" };

export function dealPay(c: Character, ch: Channel, brand: BrandDef, kind: DealKind): number {
  const p = platformDef(ch.platform);
  const nd = nicheDef(ch.niche);
  const st = styleDef(ch.style);
  const eng = clamp(engagementOf(c, ch) / 0.05, 0.6, 1.6);
  const base = ch.followers * p.sponsor * nd.brand * st.brand * brand.pay * (ch.verified ? 1.15 : 1) * (1 - (ch.fake / 100) * 0.9) * eng * revScale(c);
  const mgr = c.social?.team.manager ? 1.12 : 1;
  return Math.max(Math.round(60 * revScale(c)), Math.round(base * KIND_MULT[kind] * mgr * (0.85 + Math.random() * 0.3)));
}

export function makeBrandOffer(c: Character, ch: Channel): InboxItem | null {
  const taken = new Set((c.social?.deals ?? []).map((d) => d.brand));
  const pool = BRANDS.filter((b) => b.niches.includes(ch.niche) && (b.minAge ?? 13) <= c.age && !taken.has(b.key));
  if (pool.length === 0) return null;
  // shady brands are more eager when you're small or already on shaky ground
  const sketchyOdds = 0.16 + (c.social!.image < 0 ? 0.12 : 0);
  const choices = pool.filter((b) => (b.sketchy ? Math.random() < sketchyOdds : true));
  const brand = choices[Math.floor(Math.random() * choices.length)] ?? pool[0];
  const kinds: DealKind[] = ch.followers >= 25000 ? ["post", "series", "ambassador"] : ch.followers >= 5000 ? ["post", "series"] : ["post"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const pay = dealPay(c, ch, brand, kind);
  const yearsLeft = kind === "ambassador" ? 2 + Math.floor(Math.random() * 2) : 1;
  const clause = kind === "ambassador" ? "Exclusive: you can't work with rival brands while it lasts." : kind === "series" ? "You'll need to keep posting regularly while it runs." : undefined;
  const deal: Deal = { id: iid(c), brand: brand.key, kind, platform: ch.platform, pay, yearsLeft, started: c.age, clause, sketchy: !!brand.sketchy, upfront: kind === "post" };
  const per = kind === "ambassador" ? `${money(pay)} a year for ${yearsLeft} years` : money(pay);
  return {
    id: "", age: c.age, kind: "brand", from: brand.name, platform: ch.platform,
    subject: `${brand.name} wants to work with you`,
    body: `${brand.name}, ${brand.blurb}, has been watching your ${platformDef(ch.platform).label}. They're offering ${KIND_WORD[kind]}: ${per}.${clause ? " " + clause : ""}${brand.sketchy ? " (Something about it doesn't sit quite right.)" : ""}`,
    options: [{ key: "accept", label: "Accept" }, { key: "negotiate", label: "Ask for more" }, { key: "decline", label: "Decline" }],
    deal,
  };
}

function signDeal(c: Character, deal: Deal): void {
  const s = ensureSocial(c, true)!;
  const b = brandDef(deal.brand);
  const ch = channelOf(c, deal.platform);
  if (deal.kind === "post") {
    // one post: paid now, taxed with the year
    const cut = s.team.manager ? 0.15 : 0;
    const net = Math.round(deal.pay * (1 - cut));
    c.money += net;
    s.oneOff = (s.oneOff ?? 0) + net;
    s.earned += net;
    record(c, `You posted for ${b?.name ?? "a brand"} and were paid ${money(net)}.${cut ? ` Your manager took ${money(deal.pay - net)}.` : ""}`);
  } else {
    s.deals.push(deal);
    record(c, `You signed with ${b?.name ?? "a brand"}: ${money(deal.pay)}${deal.kind === "ambassador" ? " a year" : ""}${deal.kind === "ambassador" ? ` for ${deal.yearsLeft} years` : " over the year"}.`);
  }
  if (deal.sketchy) {
    s.image = clamp(s.image - 2, -100, 100);
    c.yearLog.push("A few followers muttered about the sponsor. You've lost a little trust.");
  }
  if (ch) ch.momentum = Math.min(3, ch.momentum + 0.05);
  s.image = clamp(s.image + (b?.sketchy ? 0 : 0.5), -100, 100);
}

// ---------------------------------------------------------------- generating the year's mail

export function tickInbox(c: Character, world: WorldState): void {
  const s = ensureSocial(c);
  if (!s) return;
  // old mail goes cold
  const before = s.inbox.length;
  s.inbox = s.inbox.filter((i) => c.age - i.age < (i.kind === "brand" ? 2 : 3));
  if (s.inbox.length < before && s.inbox.some((i) => i.kind === "brand") === false && before - s.inbox.length > 0) {
    c.yearLog.push("An offer went cold while it sat in your inbox.");
  }
  const top = biggest(c);
  if (!top) return;
  const active = s.channels.filter((ch) => ch.cadence !== "off");
  if (active.length === 0) return;
  let brandCount = 0;
  for (const ch of active) {
    const p = platformDef(ch.platform);
    if (ch.followers >= Math.max(1000, p.monetise / 2) && brandCount < 3) {
      const chance = clamp(0.07 + Math.log10(ch.followers / 1000 + 1) * 0.13 + s.image / 300 + (s.team.manager ? 0.15 : 0) + s.fame / 400, 0.04, 0.72) * (ch.fake > 40 ? 0.3 : 1);
      if (Math.random() < chance) {
        const o = makeBrandOffer(c, ch);
        if (o) {
          push(c, o);
          brandCount++;
        }
      }
    }
    // the platform notices you
    if (ch.followers >= p.verify && !ch.verified && !isBannedCh(c, ch) && Math.random() < 0.5 && !s.inbox.some((i) => i.kind === "platform" && i.platform === ch.platform)) {
      push(c, {
        kind: "platform", from: p.label, platform: ch.platform, subject: `${p.label} is offering you a verified badge`,
        body: `Your ${p.label} has grown enough to qualify for verification. A tick next to your name means fewer fakes, better deals and a bit more reach.`,
        options: [{ key: "accept", label: "Get verified" }, { key: "decline", label: "Not now" }],
      });
    }
  }
  if (top.followers >= 300 && Math.random() < 0.2) {
    const partner = makePartner(top, top.followers > 20000 && Math.random() < 0.3);
    push(c, {
      kind: "collab", from: partner.name, platform: top.platform, subject: `${partner.name} wants to collab`,
      body: `${partner.name} makes ${nicheDef(top.niche).label.toLowerCase()} content on ${platformDef(top.platform).label} with ${fmt(partner.followers)} ${platformDef(top.platform).people}. They'd like to make something with you.`,
      options: [{ key: "accept", label: "Do it" }, { key: "decline", label: "Pass" }],
      data: { name: partner.name, followers: partner.followers },
    });
  }
  if (top.followers >= 100 && Math.random() < Math.min(0.7, 0.15 + Math.log10(top.followers) / 12)) {
    const meet = top.followers >= 5000 && Math.random() < 0.15;
    push(c, {
      kind: "fan", from: `@${randomHandle()}`, platform: top.platform, subject: meet ? "A fan wants to meet you" : "A message from a fan",
      body: meet ? "A fan who's been with you from the start asks if they could say hello in person, just for five minutes." : FAN_MESSAGES[Math.floor(Math.random() * FAN_MESSAGES.length)],
      options: meet ? [{ key: "meet", label: "Meet them" }, { key: "decline", label: "Politely decline" }] : [{ key: "reply", label: "Reply kindly" }, { key: "ignore", label: "Leave it" }],
      data: { meet },
    });
  }
  const hateChance = clamp(0.05 + s.fame / 220 - s.image / 300 + styleDef(top.style).risk * 0.5, 0, 0.7) * (s.team.assistant ? 0.4 : 1);
  if (top.followers >= 100 && Math.random() < hateChance) {
    push(c, {
      kind: "hate", from: `@${randomHandle()}`, platform: top.platform, subject: "A nasty message",
      body: HATE_MESSAGES[Math.floor(Math.random() * HATE_MESSAGES.length)],
      options: [{ key: "ignore", label: "Ignore it" }, { key: "reply", label: "Reply" }, { key: "block", label: "Block them" }, { key: "report", label: "Report" }],
    });
  }
  if (s.fame >= 30 && Math.random() < 0.15 + s.fame / 500) {
    push(c, {
      kind: "press", from: "A journalist", subject: "A journalist would like to talk",
      body: `A journalist writes that ${PRESS_LINES[Math.floor(Math.random() * PRESS_LINES.length)]}, and they'd like you for it.`,
      options: [{ key: "accept", label: "Do the interview" }, { key: "decline", label: "Decline" }],
    });
  }
  if (top.followers >= 30000 && !s.team.manager && Math.random() < 0.2) {
    push(c, {
      kind: "agency", from: "A talent manager", subject: "A manager wants to represent you",
      body: "An experienced manager offers to handle deals, contracts and the chaos. They take 15% of what you earn, but brands pay more when there's an agent in the room, and they'll steer you away from trouble.",
      options: [{ key: "accept", label: "Sign with them" }, { key: "decline", label: "No thanks" }],
    });
  }
  if (top.followers >= 300 && Math.random() < 0.12) {
    push(c, {
      kind: "scam", from: `@${randomHandle()}`, subject: "An exclusive opportunity",
      body: SCAM_MESSAGES[Math.floor(Math.random() * SCAM_MESSAGES.length)],
      options: [{ key: "pay", label: "Pay the fee" }, { key: "report", label: "Report it" }, { key: "ignore", label: "Delete it" }],
    });
  }
  const fr = friendOf(c);
  if (fr && top.followers >= 200 && Math.random() < 0.1) {
    push(c, {
      kind: "friend", from: fr.name, platform: top.platform, subject: `${fr.name} needs a favour`,
      body: `${fr.name} ${FRIEND_ASKS[Math.floor(Math.random() * FRIEND_ASKS.length)]}.`,
      options: [{ key: "help", label: "Help them out" }, { key: "decline", label: "Not right now" }],
      data: { rel: fr.id },
    });
  }
  const kin = c.relationships.filter((r) => ["mother", "father", "sibling"].includes(r.type) && r.alive);
  if (s.lastEarned > 0 && s.fame >= 25 && kin.length && Math.random() < 0.13) {
    const r = kin[Math.floor(Math.random() * kin.length)];
    const ask = Math.max(100, Math.round(Math.max(s.lastEarned * 0.06, 200 * revScale(c)) / 50) * 50);
    push(c, {
      kind: "family", from: r.name, subject: `${r.name} asks for money`,
      body: `Now that you're doing well online, ${r.name} wonders if you could help with a bill. About ${money(ask)}.`,
      options: [{ key: "give", label: "Give it" }, { key: "half", label: "Give half" }, { key: "decline", label: "Say no" }],
      data: { rel: r.id, ask },
    });
  }
}

const isBannedCh = (c: Character, ch: Channel) => !!ch.bannedUntil && c.age < ch.bannedUntil;

// ---------------------------------------------------------------- answering

export function answerInbox(c: Character, world: WorldState, id: string, key: string): boolean {
  const s = ensureSocial(c);
  const item = s?.inbox.find((i) => i.id === id);
  if (!s || !item) return false;
  const ch = item.platform ? channelOf(c, item.platform) : biggest(c);
  const done = () => {
    s.inbox = s.inbox.filter((i) => i.id !== id);
    return true;
  };
  switch (item.kind as InboxKind) {
    case "brand": {
      const d = item.deal;
      if (!d) return done();
      if (key === "decline") return done();
      if (key === "negotiate") {
        if (item.data?.negotiated) return false;
        const skill = 0.42 + (s.team.manager ? 0.22 : 0) + (c.talents?.business ?? 50) / 400 + s.fame / 400;
        const r = Math.random();
        if (r < skill) {
          d.pay = Math.round(d.pay * (1.2 + Math.random() * 0.3));
          item.data = { ...(item.data ?? {}), negotiated: true };
          item.body = `${brandDef(d.brand)?.name} agreed to a better offer: ${money(d.pay)}${d.kind === "ambassador" ? " a year" : ""}. Take it?`;
          item.options = [{ key: "accept", label: "Accept" }, { key: "decline", label: "Decline" }];
          c.yearLog.push(`${brandDef(d.brand)?.name} agreed to pay more.`);
          return true;
        }
        if (r < skill + 0.3) {
          item.data = { ...(item.data ?? {}), negotiated: true };
          item.body += " They wouldn't budge on the price.";
          item.options = [{ key: "accept", label: "Accept anyway" }, { key: "decline", label: "Decline" }];
          c.yearLog.push(`${brandDef(d.brand)?.name} wouldn't move on the price.`);
          return true;
        }
        c.yearLog.push(`${brandDef(d.brand)?.name} pulled the offer when you pushed.`);
        return done();
      }
      signDeal(c, d);
      return done();
    }
    case "collab": {
      if (key === "decline" || !ch) return done();
      const partner = { name: String(item.data?.name ?? starName()), followers: Number(item.data?.followers ?? 1000) };
      const r = runCollab(c, world, ch, partner);
      c.yearLog.push(r.line);
      return done();
    }
    case "fan": {
      if (key === "ignore" || key === "decline") return done();
      if (key === "meet") {
        changeStat(c, "happiness", 3, "Meeting a fan");
        s.image = clamp(s.image + 2, -100, 100);
        leak(c, 1);
        if (ch) addFollowers(ch, Math.max(5, ch.followers * 0.005));
        c.yearLog.push("You met a fan for five minutes. They cried a little, and so did you.");
        return done();
      }
      changeStat(c, "happiness", 2, "A message from a fan");
      s.image = clamp(s.image + 1.5, -100, 100);
      c.yearLog.push("You wrote back to a fan. It made their week.");
      return done();
    }
    case "hate": {
      if (key === "ignore") {
        if (Math.random() < 0.35) changeStat(c, "happiness", -1, "Online nastiness");
        return done();
      }
      if (key === "block") return done();
      if (key === "report") {
        if (Math.random() < 0.4) c.yearLog.push("The platform removed the account that was harassing you.");
        else c.yearLog.push("You reported them. Nothing happened.");
        return done();
      }
      // replying feeds it
      if (Math.random() < 0.55) {
        s.image = clamp(s.image - 3, -100, 100);
        changeStat(c, "happiness", -3, "Arguing online");
        c.stress = clamp((c.stress ?? 25) + 4);
        c.yearLog.push("You replied. They screenshotted it. It did the rounds.");
      } else {
        c.yearLog.push("You replied calmly and they backed off.");
        s.image = clamp(s.image + 1, -100, 100);
      }
      return done();
    }
    case "platform": {
      if (key === "decline" || !ch) return done();
      ch.verified = true;
      ch.momentum = Math.min(3, ch.momentum + 0.4);
      record(c, `You were verified on ${platformDef(ch.platform).label}.`);
      return done();
    }
    case "press": {
      if (key === "decline") return done();
      const charm = ((c.talents?.social ?? 50) + (c.talents?.verbal ?? 50)) / 2 + ((c.personality?.e ?? 50) - 50) * 0.3 + (c.stats.smarts - 50) * 0.2;
      const good = Math.random() < clamp(0.35 + (charm - 40) / 120 + s.image / 300, 0.15, 0.9);
      const top = biggest(c);
      if (good) {
        s.image = clamp(s.image + 6, -100, 100);
        if (top) {
          addFollowers(top, top.followers * 0.04 + 40);
          top.momentum = Math.min(3, top.momentum + 0.5);
        }
        changeStat(c, "happiness", 3, "Good press");
        c.yearLog.push("The interview ran and people loved it. Your name is out there.");
      } else {
        s.image = clamp(s.image - 6, -100, 100);
        c.yearLog.push("The interview went badly. A clumsy answer became the headline.");
      }
      return done();
    }
    case "agency": {
      if (key === "accept") {
        s.team.manager = true;
        c.yearLog.push("You signed with a manager. They take 15%, and the offers have already got better.");
      }
      return done();
    }
    case "scam": {
      if (key === "pay") {
        const lose = Math.round((150 + Math.random() * 700) * costScale(c));
        c.money -= lose;
        c.yearLog.push(`It was a scam. You lost ${money(lose)} and never heard from them again.`);
        changeStat(c, "happiness", -3, "Being scammed");
      } else if (key === "report") {
        c.yearLog.push("You reported the scam. Someone else won't fall for it.");
      }
      return done();
    }
    case "friend": {
      const r = c.relationships.find((x) => x.id === item.data?.rel);
      if (key === "help") {
        if (r) r.level = clamp(r.level + 8);
        if (ch) addFollowers(ch, ch.followers * 0.008 + 5);
        changeStat(c, "happiness", 2, "Helping a friend");
        c.yearLog.push(`You helped ${r?.name ?? "a friend"} out. They won't forget it.`);
      } else if (r) {
        r.level = clamp(r.level - 4);
        c.yearLog.push(`You put ${r.name} off. They took it a bit personally.`);
      }
      return done();
    }
    case "family": {
      const r = c.relationships.find((x) => x.id === item.data?.rel);
      const ask = Number(item.data?.ask ?? 0);
      if (key === "give" || key === "half") {
        const amt = key === "half" ? Math.round(ask / 2) : ask;
        c.money -= amt;
        if (r) r.level = clamp(r.level + (key === "half" ? 4 : 9));
        c.yearLog.push(`You sent ${r?.name ?? "family"} ${money(amt)}.`);
      } else if (r) {
        r.level = clamp(r.level - 6);
        c.yearLog.push(`You told ${r.name} no. It was awkward at dinner.`);
      }
      return done();
    }
  }
  return done();
}

export { noteIncome };
