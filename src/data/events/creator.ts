import { Character, LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { changeStat } from "../../engine/stats";
import { biggest, channelOf, costScale, fameOf, isCreator, revScale } from "../../engine/creatorCore";
import { openChannel, suggestNiche, hire } from "../../engine/creator";
import { addFollowers, friendOf, leak } from "../../engine/creatorPlay";
import { platformDef } from "../social";
import { partner, mother, father } from "./helpers";

// Life as someone people watch: starting out, the algorithm, the comments, brands, fans,
// trolls, burnout, and the day it all goes wrong. Most need a channel; a few find you first.

const cr = (c: Character) => c.social!;
const creator = (c: Character) => isCreator(c) && !c.inJail;
const fame = (c: Character) => fameOf(c);
const img = (c: Character, n: number) => {
  if (c.social) c.social.image = clamp(c.social.image + n, -100, 100);
};
const gain = (c: Character, pct: number, flat = 0) => {
  const t = biggest(c);
  if (t) addFollowers(t, t.followers * pct + flat);
};
const lose = (c: Character, pct: number) => {
  for (const ch of cr(c).channels) ch.followers = Math.round(ch.followers * (1 - pct));
};
const stress = (c: Character, n: number) => {
  c.stress = clamp((c.stress ?? 25) + n);
};
const pause = (c: Character) => {
  for (const ch of cr(c).channels) ch.cadence = "off";
};
const momentum = (c: Character, n: number) => {
  const t = biggest(c);
  if (t) t.momentum = Math.min(3, Math.max(-1, t.momentum + n));
};
const cash = (c: Character, base: number) => Math.round(base * revScale(c));
const spend = (c: Character, base: number) => Math.round(base * costScale(c));
const topName = (c: Character) => (biggest(c) ? platformDef(biggest(c)!.platform).label : "your channel");
const hasTeam = (c: Character, r: "editor" | "assistant" | "manager") => !!c.social?.team[r];
const employed = (c: Character) => !!c.job && c.job.kind === "fulltime";
const canOpen = (c: Character, p: "youtube" | "tiktok" | "instagram" | "x" | "twitch" | "podcast") => c.age >= platformDef(p).minAge && !channelOf(c, p);

export const CREATOR_EVENTS: LifeEvent[] = [
  // ------------------------------------------------------------ starting out
  {
    id: "friend-says-post",
    minAge: 13,
    maxAge: 34,
    weight: 2,
    once: true,
    condition: (c) => !isCreator(c) && !c.social && !c.inJail,
    text: () => "A friend says you should start posting. \"You're funny/interesting/good at this. Seriously. Everyone would watch.\"",
    choices: [
      { label: "Start on TikTok", effect: (c, w) => { if (canOpen(c, "tiktok")) openChannel(c, w, "tiktok", suggestNiche(c, "tiktok")); }, resultText: (c) => (channelOf(c, "tiktok") ? "You filmed something that night. It got eleven views, and you loved it." : "") },
      { label: "Start on YouTube", effect: (c, w) => { if (canOpen(c, "youtube")) openChannel(c, w, "youtube", suggestNiche(c, "youtube")); }, resultText: (c) => (channelOf(c, "youtube") ? "You set up a channel and stared at the blank upload button for an hour." : "") },
      { label: "Start on Instagram", effect: (c, w) => { if (canOpen(c, "instagram")) openChannel(c, w, "instagram", suggestNiche(c, "instagram")); }, resultText: (c) => (channelOf(c, "instagram") ? "You posted a photo you'd been sitting on for weeks." : "") },
      { label: "Nope, not for me", effect: () => {}, resultText: () => "You laughed it off. (It's in Activities if you change your mind.)" },
    ],
  },
  {
    id: "school-clip-spreads",
    minAge: 13,
    maxAge: 19,
    weight: 1.6,
    once: true,
    condition: (c) => !isCreator(c) && !c.inJail && ["middle", "high"].includes(c.educationStage),
    text: () => "Someone filmed you doing something at school and the clip is spreading. By lunch, half the year has seen it.",
    choices: [
      { label: "Lean into it", effect: (c, w) => { if (canOpen(c, "tiktok")) { openChannel(c, w, "tiktok", suggestNiche(c, "tiktok")); const ch = channelOf(c, "tiktok"); if (ch) { addFollowers(ch, randomInt(800, 4000)); ch.momentum = 1; } } changeStat(c, "happiness", 4, "Sudden attention"); }, resultText: () => "You made an account that night. Strangers were already in the comments.", tone: "good" },
      { label: "Ask them to take it down", effect: (c) => { changeStat(c, "happiness", -2, "Being filmed"); }, resultText: () => "Most of them did. A few didn't." },
      { label: "Pretend it's not you", effect: (c) => { changeStat(c, "happiness", -3, "Being laughed at"); c.popularity = clamp((c.popularity ?? 50) - 3); }, resultText: () => "Everybody knew it was you." },
    ],
  },
  {
    id: "parents-screen-rules",
    minAge: 13,
    maxAge: 17,
    weight: 1.4,
    condition: (c) => creator(c) && cr(c).channels.length > 0,
    text: () => "Your parents have noticed how much time you spend filming and editing, and they want a talk.",
    choices: [
      { label: "Show them the numbers", effect: (c) => { const m = mother(c) ?? father(c); if (m) m.level = clamp(m.level + (fame(c) >= 10 ? 6 : 2)); changeStat(c, "happiness", 1, "Being taken seriously"); }, resultText: (c) => (fame(c) >= 10 ? "They looked at your follower count for a long time. \"Okay. But homework first.\"" : "They weren't convinced, but they let you carry on.") },
      { label: "Promise to keep grades up", effect: (c) => { changeStat(c, "smarts", 1, "A deal with your parents"); stress(c, 2); }, resultText: () => "You shook on it. There's a spreadsheet." },
      { label: "Argue that it's your future", effect: (c) => { const m = mother(c) ?? father(c); if (m) m.level = clamp(m.level - 6); }, resultText: () => "It did not go well. You're grounded from the internet for a week." },
    ],
  },
  {
    id: "first-hater",
    minAge: 13,
    maxAge: 90,
    weight: 2.2,
    once: true,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 150,
    text: () => "Your first proper hate comment. Three sentences, all of them personal, from someone with no profile picture.",
    choices: [
      { label: "Reply with a joke", effect: (c) => { if (Math.random() < 0.5) { img(c, 3); gain(c, 0.02, 20); } else { img(c, -2); stress(c, 3); } }, resultText: () => "It could have gone either way." },
      { label: "Delete and block", effect: () => {}, resultText: () => "Gone. It only took a second." },
      { label: "Screenshot it and dwell on it", effect: (c) => { changeStat(c, "happiness", -4, "A hate comment"); stress(c, 5); }, resultText: () => "You read it forty times. Something small in you dimmed." },
    ],
  },
  {
    id: "first-real-fan",
    minAge: 13,
    maxAge: 90,
    weight: 2,
    once: true,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 300,
    text: () => "Someone you've never met writes to say your content has become the best part of their week. They call themselves your biggest fan.",
    choices: [
      { label: "Write back properly", effect: (c) => { changeStat(c, "happiness", 4, "A loyal fan"); img(c, 2); }, resultText: () => "You wrote three paragraphs. They cried, then so did you." , tone: "good" },
      { label: "Send a quick heart", effect: (c) => { changeStat(c, "happiness", 1, "A fan"); }, resultText: () => "It was the least you could do. It was still a lot to them." },
    ],
  },
  // ------------------------------------------------------------ the platform
  {
    id: "algorithm-shift",
    minAge: 13,
    maxAge: 90,
    weight: 2.4,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 1000,
    text: (c) => `${topName(c)} has changed how it decides what to show people. Creators everywhere are panicking, and your reach has dropped overnight.`,
    choices: [
      { label: "Adapt to the new format", effect: (c) => { stress(c, 6); momentum(c, 0.6); cr(c).burnout = clamp(cr(c).burnout + 5); }, resultText: () => "A month of experiments later, you cracked what it wants now." },
      { label: "Ride it out", effect: (c) => { lose(c, 0.03); momentum(c, -0.3); }, resultText: () => "You kept doing what you do. Numbers dipped, then settled." },
      { label: "Post a rant about it", effect: (c) => { if (Math.random() < 0.4) gain(c, 0.03); else { img(c, -3); lose(c, 0.02); } }, resultText: () => "Everyone was complaining about it. You said it louder." },
    ],
  },
  {
    id: "copyright-strike",
    minAge: 13,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ["youtube", "tiktok", "twitch"].includes(ch.platform) && ch.followers >= 500),
    text: () => "A copyright claim lands on one of your most popular videos. Ten seconds of a song that was playing in the background.",
    choices: [
      { label: "Dispute it", effect: (c) => { if (Math.random() < 0.55) { c.yearLog.push("You won the dispute. The claim was dropped."); } else { const ch = cr(c).channels.find((x) => x.followers >= 500); if (ch) ch.strikes += 1; c.yearLog.push("They rejected your dispute and it counts as a strike."); } }, resultText: () => "You spent a weekend on the paperwork." },
      { label: "Cut the song out", effect: (c) => { stress(c, 3); }, resultText: () => "The video's worse without it, but it's safe." },
      { label: "Take the video down", effect: (c) => { lose(c, 0.01); }, resultText: () => "Gone. So were the views it was still earning." },
    ],
  },
  {
    id: "account-hacked",
    minAge: 13,
    maxAge: 90,
    weight: 1.2,
    once: true,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 2000,
    text: () => "You wake up locked out. Your biggest account is posting crypto links to your whole audience.",
    choices: [
      { label: "Fight the platform to get it back", effect: (c) => { if (Math.random() < 0.7 + (hasTeam(c, "manager") ? 0.15 : 0)) { lose(c, 0.03); c.yearLog.push("Two weeks of emails later, the account was restored."); } else { const t = biggest(c); if (t) { t.followers = Math.round(t.followers * 0.35); c.yearLog.push("You got it back eventually, but the audience never fully returned."); } } stress(c, 6); }, resultText: () => "It was the worst fortnight of your year." },
      { label: "Pay the 'recovery service'", effect: (c) => { c.money -= spend(c, 400); c.yearLog.push("It was a second scam. You lost the money and the account."); const t = biggest(c); if (t) t.followers = Math.round(t.followers * 0.5); changeStat(c, "happiness", -5, "Being scammed"); }, resultText: () => "That was the moment you learned there are always more vultures.", tone: "danger" },
      { label: "Start again from the backup", effect: (c) => { lose(c, 0.4); stress(c, 4); }, resultText: () => "You rebuilt, slowly." },
    ],
  },
  {
    id: "impersonator",
    minAge: 13,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && fame(c) >= 20,
    text: () => "Someone has made an account pretending to be you, asking your fans for money.",
    choices: [
      { label: "Warn your followers publicly", effect: (c) => { img(c, 2); stress(c, 2); }, resultText: () => "Your audience rallied. The fake got reported off the platform within a day." },
      { label: "Report it quietly", effect: () => {}, resultText: () => "It took a week to come down. A few people were fooled in the meantime." },
      { label: "Ignore it", effect: (c) => { img(c, -3); }, resultText: () => "Some of your fans lost money and blamed you." },
    ],
  },
  {
    id: "content-stolen",
    minAge: 13,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 3000,
    text: () => "A bigger account reposted your best work as if it were theirs. Their version has ten times the views.",
    choices: [
      { label: "Call them out", effect: (c) => { if (Math.random() < 0.6) { img(c, 4); gain(c, 0.05); } else { img(c, -3); stress(c, 4); } }, resultText: () => "The comments took your side, mostly." },
      { label: "File a takedown", effect: (c) => { stress(c, 2); }, resultText: () => "It took a while, but they took it down." },
      { label: "Let it go", effect: (c) => { changeStat(c, "happiness", -2, "Being copied"); }, resultText: () => "It stung more than it should." },
    ],
  },
  // ------------------------------------------------------------ growth, and its problems
  {
    id: "second-video-syndrome",
    minAge: 13,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.momentum >= 1.2 && ch.followers >= 5000),
    text: () => "One of your posts blew up. Now everyone wants the next one to do the same, and the pressure is enormous.",
    choices: [
      { label: "Make more of the same", effect: (c) => { if (Math.random() < 0.5) momentum(c, 0.5); else { gain(c, -0.02); changeStat(c, "happiness", -2, "Chasing a hit"); } stress(c, 4); }, resultText: () => "It's hard to bottle lightning." },
      { label: "Stay true to your style", effect: (c) => { img(c, 2); momentum(c, -0.2); }, resultText: () => "Fewer views, more loyal ones." },
      { label: "Take a week off", effect: (c) => { cr(c).burnout = clamp(cr(c).burnout - 15); momentum(c, -0.5); }, resultText: () => "You needed the air." },
    ],
  },
  {
    id: "plateau",
    minAge: 14,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.years >= 3 && ch.gain <= ch.followers * 0.02 && ch.cadence !== "off" && ch.followers >= 500),
    text: () => "Your growth has flatlined. Same numbers for months. You start wondering if this is as big as it gets.",
    choices: [
      { label: "Reinvent your content", effect: (c) => { const t = biggest(c); if (t) { t.momentum = Math.min(3, t.momentum + 0.8); t.followers = Math.round(t.followers * 0.97); } stress(c, 4); }, resultText: () => "You tried something new. A little scary, a little exciting." },
      { label: "Spend on better gear", effect: (c) => { c.money -= spend(c, 800); const t = biggest(c); if (t) { t.gear = t.gear === "phone" ? "home" : t.gear; t.momentum += 0.3; } }, resultText: () => "The picture got sharper. Whether the audience noticed is another matter." },
      { label: "Keep going, it's fine", effect: (c) => { changeStat(c, "happiness", -1, "A stalled channel"); }, resultText: () => "You kept posting. Some years are like that." },
    ],
  },
  {
    id: "fan-meetup",
    minAge: 15,
    maxAge: 90,
    weight: 1.5,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 4000,
    text: () => "Fans are asking for a meetup. A café, a park, a few hundred people you've never met who know all about you.",
    choices: [
      { label: "Do it properly", effect: (c) => { c.money -= spend(c, 500); changeStat(c, "happiness", 6, "Meeting your fans"); img(c, 3); leak(c, 2); gain(c, 0.02); }, resultText: () => "It was one of the best days of your life. Three people cried. One of them was you.", tone: "good" },
      { label: "Keep it small", effect: (c) => { changeStat(c, "happiness", 3, "Meeting a few fans"); img(c, 1); }, resultText: () => "A dozen of your most loyal people and a lot of cake." },
      { label: "No, it's too much", effect: (c) => { changeStat(c, "happiness", -1, "A missed chance"); }, resultText: () => "Some fans were disappointed, but they understood." },
    ],
  },
  {
    id: "recognised-in-shop",
    minAge: 14,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && fame(c) >= 25,
    text: () => "A stranger stops you in the queue. \"Wait. Are you... Oh my god. Can I get a picture?\"",
    choices: [
      { label: "Smile and take the photo", effect: (c) => { img(c, 2); changeStat(c, "happiness", 3, "Being recognised"); leak(c, 1); }, resultText: () => "It was lovely. It'll be online in an hour." },
      { label: "Politely say you're in a rush", effect: (c) => { img(c, -1); }, resultText: () => "They said fine, and then posted about it." },
      { label: "Pretend you're someone else", effect: (c) => { changeStat(c, "happiness", -1, "Hiding"); }, resultText: () => "They looked unconvinced." },
    ],
  },
  // ------------------------------------------------------------ brands and money
  {
    id: "brand-asks-you-to-lie",
    minAge: 16,
    maxAge: 90,
    weight: 1.8,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 5000 && cr(c).channels.some((ch) => ch.monetised),
    text: () => "A brand's brief says to describe their product as \"life-changing\". You tried it twice. It's fine. It's just fine.",
    choices: [
      { label: "Say it anyway (they pay more)", effect: (c) => { const pay = cash(c, 2500) + Math.round((biggest(c)?.followers ?? 0) * 0.05 * revScale(c)); c.money += pay; cr(c).oneOff = (cr(c).oneOff ?? 0) + pay; cr(c).earned += pay; img(c, -5); }, resultText: () => "The cheque cleared. Your audience noticed the enthusiasm didn't sound like you." },
      { label: "Be honest about it", effect: (c) => { const pay = cash(c, 800); c.money += pay; cr(c).oneOff = (cr(c).oneOff ?? 0) + pay; cr(c).earned += pay; img(c, 4); }, resultText: () => "You said it was decent, with caveats. The brand grumbled, and your followers trusted you more." },
      { label: "Turn it down", effect: (c) => { img(c, 3); }, resultText: () => "You lost the money, and kept your credibility." },
    ],
  },
  {
    id: "sponsor-trip",
    minAge: 18,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => creator(c) && fame(c) >= 25,
    text: () => "A brand invites you and a few other creators on an all-expenses-paid trip. Beautiful hotel, sunshine, a lot of filming.",
    choices: [
      { label: "Go, and show the reality", effect: (c) => { changeStat(c, "happiness", 6, "A free trip"); img(c, 2); gain(c, 0.03); }, resultText: () => "Sunshine, and an honest, funny post. People loved it." , tone: "good" },
      { label: "Go, and film it perfectly", effect: (c) => { changeStat(c, "happiness", 3, "A free trip"); img(c, -1); gain(c, 0.04); }, resultText: () => "It looked incredible online. It was mostly rehearsing the same smile." },
      { label: "Stay home", effect: () => {}, resultText: () => "You had a quiet week. Nobody missed you." },
    ],
  },
  {
    id: "giveaway-gone-wrong",
    minAge: 16,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 5000,
    text: () => "A giveaway you ran has turned messy. The winner is disputed, and half the comments are accusing you of rigging it.",
    choices: [
      { label: "Redo it publicly", effect: (c) => { c.money -= spend(c, 300); img(c, 3); }, resultText: () => "A livestream draw, and the drama cooled." },
      { label: "Ignore the noise", effect: (c) => { img(c, -4); }, resultText: () => "It didn't go away as fast as you hoped." },
      { label: "Give both winners a prize", effect: (c) => { c.money -= spend(c, 500); img(c, 4); }, resultText: () => "Generous. It went down well." },
    ],
  },
  {
    id: "merch-hit",
    minAge: 16,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.merch),
    text: () => "One of your merch designs, a running joke from your videos, has completely sold out and been worn in the wild.",
    autoEffect: (c) => { const pay = cash(c, 1200) + Math.round((biggest(c)?.followers ?? 0) * 0.03 * revScale(c)); c.money += pay; cr(c).oneOff = (cr(c).oneOff ?? 0) + pay; cr(c).earned += pay; img(c, 2); },
  },
  {
    id: "merch-flop",
    minAge: 16,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.merch),
    text: () => "A batch of merch didn't sell. You now have a hundred hoodies in your spare room.",
    autoEffect: (c) => { c.money -= spend(c, 900); changeStat(c, "happiness", -2, "A merch flop"); },
  },
  {
    id: "big-tip",
    minAge: 16,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ["twitch", "youtube"].includes(ch.platform) && ch.followers >= 2000),
    text: () => "Mid-stream, a viewer donates an enormous amount and writes a heartfelt message. You can't quite tell if they can afford it.",
    choices: [
      { label: "Thank them and keep it", effect: (c) => { const v = cash(c, 900); c.money += v; cr(c).oneOff = (cr(c).oneOff ?? 0) + v; cr(c).earned += v; }, resultText: () => "You said thank you on camera, and meant it." },
      { label: "Quietly send some back", effect: (c) => { const v = cash(c, 450); c.money += v; cr(c).oneOff = (cr(c).oneOff ?? 0) + v; cr(c).earned += v; img(c, 3); }, resultText: () => "You messaged them privately. They never forgot it." , tone: "good" },
      { label: "Refuse it entirely", effect: (c) => { img(c, 2); }, resultText: () => "Your chat called you a legend." },
    ],
  },
  {
    id: "creator-tax-audit",
    minAge: 20,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && cr(c).lastEarned >= 60000 * revScale(c) * 0.3,
    text: () => "A letter from the tax office. They'd like to look at your creator income, your equipment and a lot of receipts.",
    choices: [
      { label: "Hire an accountant", effect: (c) => { c.money -= spend(c, 1200); }, resultText: () => "It cost a bit. It was sorted in a month." },
      { label: "Do it yourself", effect: (c) => { if (Math.random() < 0.5) { c.money -= spend(c, 400); } else { c.money -= spend(c, 3500); stress(c, 6); } }, resultText: () => "You found some errors, and so did they." },
    ],
  },
  {
    id: "gear-stolen",
    minAge: 16,
    maxAge: 90,
    weight: 1,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.gear !== "phone"),
    text: () => "Someone broke into your car and took a camera bag. Half your kit is gone.",
    choices: [
      { label: "Replace it right away", effect: (c) => { c.money -= spend(c, 1500); }, resultText: () => "Expensive, but you're back in business." },
      { label: "Make do for now", effect: (c) => { const t = biggest(c); if (t) t.gear = "phone"; momentum(c, -0.3); }, resultText: () => "Back to a phone for a while." },
    ],
  },
  // ------------------------------------------------------------ reputation and the crowd
  {
    id: "old-post-resurfaces",
    minAge: 18,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && fame(c) >= 25,
    text: () => "An old post from years ago, back when you were a different person, has been dug up and is going around with a very unflattering caption.",
    choices: [
      { label: "Own it and apologise", effect: (c) => { if (Math.random() < 0.7) { img(c, 3); } else { img(c, -4); } stress(c, 3); }, resultText: () => "You posted a short, sincere response. Most people accepted it." },
      { label: "Delete it and say nothing", effect: (c) => { img(c, -5); }, resultText: () => "It was already screenshotted. Deleting it looked worse." },
      { label: "Explain the context", effect: (c) => { if (Math.random() < 0.45) { img(c, 2); } else { img(c, -6); lose(c, 0.02); } }, resultText: () => "Context rarely wins the internet." },
    ],
  },
  {
    id: "hit-piece",
    minAge: 18,
    maxAge: 90,
    weight: 1.3,
    condition: (c) => creator(c) && fame(c) >= 35,
    text: () => "A journalist has written a long piece about you. It isn't kind. There are quotes from people who used to know you.",
    choices: [
      { label: "Respond in a video", effect: (c) => { if (Math.random() < 0.55) { img(c, 5); gain(c, 0.05); } else { img(c, -5); } stress(c, 4); }, resultText: () => "It did numbers either way." },
      { label: "Say nothing", effect: (c) => { img(c, -3); }, resultText: () => "The story ran its course and faded." },
      { label: "Get a lawyer's letter sent", effect: (c) => { c.money -= spend(c, 2500); img(c, -2); }, resultText: () => "It made the piece look more interesting." },
    ],
  },
  {
    id: "ex-tells-all",
    minAge: 18,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && fame(c) >= 30 && c.relationships.some((r) => r.type === "ex" && r.alive),
    text: () => "An ex has posted a long thread about your relationship. Half of it is true. The other half is worse.",
    choices: [
      { label: "Answer every point", effect: (c) => { if (Math.random() < 0.5) img(c, 3); else img(c, -6); stress(c, 5); leak(c, 3); }, resultText: () => "You drafted the reply at 2am, and it read like it." },
      { label: "Rise above it", effect: (c) => { img(c, 1); }, resultText: () => "You said nothing. Your fans defended you." },
      { label: "Sue for defamation", effect: (c) => { c.money -= spend(c, 4000); img(c, -3); stress(c, 4); }, resultText: () => "It cost a fortune and only made the thread more famous." },
    ],
  },
  {
    id: "partner-jealous",
    minAge: 18,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && fame(c) >= 25 && !!partner(c),
    text: (c) => `${partner(c)!.name} is uneasy about the attention: the messages, the comments, the people who say they'd date you in a heartbeat.`,
    choices: [
      { label: "Talk it through properly", effect: (c) => { const p = partner(c)!; p.level = clamp(p.level + 5); }, resultText: () => "It was a long, honest night. It helped." },
      { label: "Reassure them and move on", effect: (c) => { const p = partner(c)!; p.level = clamp(p.level - 1); }, resultText: () => "It calmed things, for now." },
      { label: "Tell them to get used to it", effect: (c) => { const p = partner(c)!; p.level = clamp(p.level - 9); }, resultText: () => "That went badly.", tone: "danger" },
    ],
  },
  {
    id: "family-content",
    minAge: 20,
    maxAge: 70,
    weight: 1.4,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 3000 && c.relationships.some((r) => r.type === "child" && r.alive && r.status !== "placed"),
    text: () => "Your kids are adorable and your audience keeps asking to see more of them. A brand has even offered good money for a family series.",
    choices: [
      { label: "Keep them off the internet", effect: (c) => { img(c, 2); }, resultText: () => "Privacy is a gift. They'll thank you when they're older." },
      { label: "Feature them, with limits", effect: (c) => { gain(c, 0.05); leak(c, 2); img(c, 0); }, resultText: () => "A few careful posts. Their faces stayed mostly out of it." },
      { label: "Make them the stars", effect: (c) => { gain(c, 0.12); leak(c, 8); const v = cash(c, 3000); c.money += v; cr(c).oneOff = (cr(c).oneOff ?? 0) + v; cr(c).earned += v; c.relationships.filter((r) => r.type === "child").forEach((r) => (r.level = clamp(r.level - 3))); img(c, -3); }, resultText: () => "It made money. It also made the comments section a place you'd rather your kids never saw.", tone: "danger" },
    ],
  },
  {
    id: "parent-embarrassed",
    minAge: 16,
    maxAge: 40,
    weight: 1.3,
    condition: (c) => creator(c) && fame(c) >= 15 && cr(c).image < -5 && !!(mother(c) ?? father(c)),
    text: (c) => `${(mother(c) ?? father(c))!.name} has had people asking about your posts at work, and isn't happy.`,
    choices: [
      { label: "Promise to tone it down", effect: (c) => { const p = mother(c) ?? father(c); if (p) p.level = clamp(p.level + 4); img(c, 2); }, resultText: () => "You softened things a bit." },
      { label: "Tell them it's your career", effect: (c) => { const p = mother(c) ?? father(c); if (p) p.level = clamp(p.level - 5); }, resultText: () => "It wasn't a fun conversation." },
    ],
  },
  {
    id: "boss-finds-channel",
    minAge: 18,
    maxAge: 60,
    weight: 1.6,
    condition: (c) => creator(c) && employed(c) && fame(c) >= 15,
    text: () => "Your manager at work has found your channel. \"Interesting,\" they say. It's not clear whether that was a compliment.",
    choices: [
      { label: "Keep both going", effect: (c) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) - 3); }, resultText: () => "They tolerate it, but you can feel the eyebrow." },
      { label: "Ask permission properly", effect: (c) => { if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) + 4); }, resultText: () => "A signed form, a polite chat, and you're fine." },
      { label: "Quit and go full-time", effect: (c) => { if (c.job && (biggest(c)?.followers ?? 0) < 20000) { changeStat(c, "happiness", -3, "A risky leap"); } c.job = null; }, resultText: () => "You handed in your notice. It's just you and the algorithm now.", tone: "danger" },
    ],
  },
  {
    id: "school-jealousy",
    minAge: 13,
    maxAge: 18,
    weight: 1.5,
    condition: (c) => creator(c) && fame(c) >= 10 && ["middle", "high"].includes(c.educationStage),
    text: () => "Some classmates have started mocking your posts. Others act like you've become a different person now you have followers.",
    choices: [
      { label: "Ignore them", effect: (c) => { changeStat(c, "happiness", -1, "Peer jealousy"); }, resultText: () => "You've got thicker skin than you'd like." },
      { label: "Invite them to help make something", effect: (c) => { c.popularity = clamp((c.popularity ?? 50) + 4); }, resultText: () => "Two of them are now recurring characters." , tone: "good" },
      { label: "Post about them", effect: (c) => { img(c, -6); c.conduct = clamp((c.conduct ?? 70) - 5); }, resultText: () => "That escalated fast. The school heard about it." , tone: "danger" },
    ],
  },
  // ------------------------------------------------------------ the toll
  {
    id: "tired-of-it",
    minAge: 14,
    maxAge: 90,
    weight: 3.5,
    condition: (c) => creator(c) && cr(c).burnout >= 55,
    text: () => "You stare at the screen and can't face making another thing. The numbers stopped feeling like progress a while ago.",
    choices: [
      { label: "Take a proper break", effect: (c) => { pause(c); cr(c).burnout = clamp(cr(c).burnout - 30); changeStat(c, "happiness", 4, "Rest"); }, resultText: () => "You set everything to a break for a year. It felt like a heavy backpack coming off.", tone: "good" },
      { label: "Hire some help", effect: (c) => { if (c.age >= 18 && !hasTeam(c, "editor") && c.money > spend(c, 3000) && hire(c, "editor")) { cr(c).burnout = clamp(cr(c).burnout - 12); } else { cr(c).burnout = clamp(cr(c).burnout - 4); } }, resultText: (c) => (hasTeam(c, "editor") ? "An editor took the worst of the workload off your plate." : "You couldn't afford proper help yet, but asking around helped a little.") },
      { label: "Push through", effect: (c) => { cr(c).burnout = clamp(cr(c).burnout + 8); changeStat(c, "health", -3, "Overwork"); }, resultText: () => "You kept going. Something in you kept going more quietly." , tone: "danger" },
    ],
  },
  {
    id: "read-the-comments",
    minAge: 13,
    maxAge: 90,
    weight: 2.2,
    condition: (c) => creator(c) && fame(c) >= 10 && cr(c).image < 10,
    text: () => "You do the thing you told yourself you'd never do: you read every comment on your latest post, top to bottom.",
    choices: [
      { label: "Keep scrolling", effect: (c) => { changeStat(c, "happiness", -4, "The comment section"); c.sanity = clamp((c.sanity ?? 75) - 2); stress(c, 4); }, resultText: () => "Forty kind ones were drowned out by three cruel ones." },
      { label: "Put the phone down", effect: (c) => { changeStat(c, "happiness", 1, "Restraint"); }, resultText: () => "Good call." },
    ],
  },
  {
    id: "stalker-fan",
    minAge: 14,
    maxAge: 90,
    weight: 2.4,
    condition: (c) => creator(c) && cr(c).privacy < 55,
    text: () => "A follower has worked out where you live from the background of your videos. They're waiting outside, holding a gift.",
    choices: [
      { label: "Go out and be kind, but firm", effect: (c) => { leak(c, 3); img(c, 1); changeStat(c, "happiness", -1, "An uncomfortable encounter"); }, resultText: () => "It was fine. Slightly terrifying, but fine." },
      { label: "Call the police", effect: (c) => { leak(c, -3); stress(c, 4); }, resultText: () => "They were taken away gently. It shook you." },
      { label: "Ignore it and stay in", effect: (c) => { stress(c, 6); leak(c, 3); }, resultText: () => "They stayed for hours. You didn't sleep." },
    ],
  },
  {
    id: "doxxed",
    minAge: 15,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && cr(c).privacy < 45,
    text: () => "Someone has posted your home address, phone number and workplace under a video of yours. It's spreading.",
    choices: [
      { label: "Move somewhere safer", effect: (c) => { c.money -= spend(c, 2500); leak(c, -12); stress(c, 5); }, resultText: () => "Expensive and exhausting, but you feel safer." },
      { label: "Get security and lock things down", effect: (c) => { c.money -= spend(c, 1500); leak(c, -8); }, resultText: () => "Alarms, cameras and a lot of reset passwords." },
      { label: "Tough it out", effect: (c) => { stress(c, 8); changeStat(c, "happiness", -5, "Feeling unsafe"); leak(c, 3); }, resultText: () => "The dread doesn't leave. Every knock at the door is a jolt." , tone: "danger" },
    ],
  },
  {
    id: "deepfake",
    minAge: 18,
    maxAge: 90,
    weight: 1.1,
    condition: (c) => creator(c) && fame(c) >= 40,
    text: () => "A fake video of you saying things you'd never say is doing the rounds. It's convincing.",
    choices: [
      { label: "Post the truth, with proof", effect: (c) => { img(c, 2); stress(c, 4); }, resultText: () => "You showed the original clip. Most believed you." },
      { label: "Hire a lawyer", effect: (c) => { c.money -= spend(c, 5000); img(c, 1); }, resultText: () => "The platforms took it down, eventually." },
      { label: "Ignore it", effect: (c) => { img(c, -6); lose(c, 0.02); }, resultText: () => "People believed what they saw." },
    ],
  },
  {
    id: "marathon-stream",
    minAge: 16,
    maxAge: 50,
    weight: 1.3,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.platform === "twitch" || ch.platform === "youtube"),
    text: () => "Your community wants a 24-hour charity stream. They'll donate for every hour you stay awake.",
    choices: [
      { label: "Do the whole 24 hours", effect: (c) => { changeStat(c, "health", -4, "No sleep"); changeStat(c, "happiness", 5, "A great cause"); img(c, 5); gain(c, 0.06); }, resultText: () => "Twenty-four hours, a lot of energy drinks and a huge total raised. You slept for two days after.", tone: "good" },
      { label: "Do twelve hours", effect: (c) => { changeStat(c, "happiness", 3, "A great cause"); img(c, 3); gain(c, 0.03); }, resultText: () => "It raised a lot, and you kept your sanity." },
      { label: "Skip it", effect: () => {}, resultText: () => "Someone else did it instead." },
    ],
  },
  // ------------------------------------------------------------ the team
  {
    id: "manager-skimming",
    minAge: 20,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && hasTeam(c, "manager") && cr(c).lastEarned >= 20000 * revScale(c) * 0.3,
    text: () => "Your accountant points out that some payments from brands never reached you. The amounts match your manager's fee, plus more.",
    choices: [
      { label: "Confront them", effect: (c) => { if (Math.random() < 0.5) { c.money += cash(c, 4000); c.yearLog.push("They paid it back, and you renegotiated the deal."); } else { delete cr(c).team.manager; c.money += cash(c, 1500); c.yearLog.push("They denied everything. You cut ties."); } }, resultText: () => "A very uncomfortable meeting." },
      { label: "Let it slide", effect: (c) => { c.money -= cash(c, 1200); }, resultText: () => "You told yourself it was the cost of the help." },
      { label: "Fire them and take a lawyer", effect: (c) => { delete cr(c).team.manager; c.money -= spend(c, 2500); }, resultText: () => "It's messy, and it's done." },
    ],
  },
  {
    id: "editor-quits",
    minAge: 18,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && hasTeam(c, "editor"),
    text: () => "Your editor says they've had an offer from a much bigger channel. They'd stay for a raise.",
    choices: [
      { label: "Give them the raise", effect: (c) => { c.money -= spend(c, 1500); }, resultText: () => "They stayed. Loyalty has a price." },
      { label: "Let them go", effect: (c) => { delete cr(c).team.editor; momentum(c, -0.3); }, resultText: () => "You wished them well, and dreaded the next edit." },
    ],
  },
  // ------------------------------------------------------------ the crowd, the industry, luck
  {
    id: "viral-wrong-reason",
    minAge: 13,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.followers >= 500),
    text: () => "A blooper from one of your videos has gone viral for all the wrong reasons. You're now the internet's favourite punchline.",
    choices: [
      { label: "Laugh along with it", effect: (c) => { if (Math.random() < 0.7) { gain(c, 0.12, 200); img(c, 2); } else { img(c, -3); } }, resultText: () => "Owning it worked. You became the joke, and got a bigger audience out of it." },
      { label: "Take it down", effect: (c) => { changeStat(c, "happiness", -2, "Being mocked"); }, resultText: () => "Everyone had already saved it." },
      { label: "Get defensive", effect: (c) => { img(c, -5); gain(c, 0.05); }, resultText: () => "You got a lot of attention. Not the kind you wanted." },
    ],
  },
  {
    id: "big-collab-offer",
    minAge: 16,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 8000,
    text: () => "A creator with ten times your audience wants to make something together. There's a catch: they want it done their way.",
    choices: [
      { label: "Say yes, on their terms", effect: (c) => { gain(c, 0.35, 500); img(c, -1); momentum(c, 0.5); }, resultText: () => "Their audience found you. Some stayed." , tone: "good" },
      { label: "Negotiate for an equal deal", effect: (c) => { if (Math.random() < 0.55) { gain(c, 0.3, 400); img(c, 2); momentum(c, 0.4); } else { c.yearLog.push("They lost interest when you pushed back."); } }, resultText: () => "You held your ground." },
      { label: "Decline", effect: (c) => { img(c, 1); }, resultText: () => "Your loyalty to your own thing didn't go unnoticed." },
    ],
  },
  {
    id: "invited-on-podcast",
    minAge: 18,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && fame(c) >= 30,
    text: () => "A hugely popular podcast has invited you on. Three hours, live, no script.",
    choices: [
      { label: "Prepare properly", effect: (c) => { if (Math.random() < 0.75) { gain(c, 0.1, 300); img(c, 4); momentum(c, 0.6); } else { img(c, -2); } }, resultText: () => "You came across as thoughtful and funny. The clip circulated for weeks." },
      { label: "Wing it", effect: (c) => { if (Math.random() < 0.5) { gain(c, 0.12); img(c, 3); } else { img(c, -5); } }, resultText: () => "You said something you'd been meaning to say for years. Nobody's sure if that was good." },
      { label: "Decline, it's too scary", effect: () => {}, resultText: () => "You told yourself there'd be another chance." },
    ],
  },
  {
    id: "tv-callback",
    minAge: 18,
    maxAge: 60,
    weight: 1.1,
    once: true,
    condition: (c) => creator(c) && fame(c) >= 45,
    text: () => "A TV producer has watched your channel and wants to talk about a screen test. Something in television, maybe. They were vague.",
    choices: [
      { label: "Take the meeting", effect: (c) => { img(c, 3); momentum(c, 0.5); changeStat(c, "happiness", 5, "A new door opening"); c.flags = [...(c.flags ?? []), "tv-meeting"]; }, resultText: () => "You drank three coffees and said yes to everything. It might come to something." },
      { label: "Stick to the internet", effect: (c) => { img(c, 1); }, resultText: () => "You'd rather own your own audience." },
    ],
  },
  {
    id: "creator-award",
    minAge: 16,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && fame(c) >= 40,
    text: () => "You've been nominated for a creator award. The ceremony is a night of fancy suits, nervous laughter and champagne.",
    choices: [
      { label: "Go, and win it", effect: (c) => { if (Math.random() < 0.3 + fame(c) / 300) { img(c, 6); gain(c, 0.08); changeStat(c, "happiness", 8, "Winning an award"); c.yearLog.push("They read your name. You forgot your speech and cried."); } else { changeStat(c, "happiness", 1, "A nomination"); c.yearLog.push("You didn't win, but you did get a good photo."); } }, resultText: () => "A very good night either way." },
      { label: "Skip the ceremony", effect: () => {}, resultText: () => "You watched it in your pyjamas." },
    ],
  },
  {
    id: "brand-boycott",
    minAge: 18,
    maxAge: 90,
    weight: 1.1,
    condition: (c) => creator(c) && cr(c).deals.length > 0,
    text: (c) => `${cr(c).deals.length > 0 ? "A brand you work with" : "A brand"} is caught up in a scandal, and people are demanding creators cut ties.`,
    choices: [
      { label: "Drop the deal immediately", effect: (c) => { const d = cr(c).deals[0]; if (d) { cr(c).deals = cr(c).deals.filter((x) => x.id !== d.id); c.money -= Math.round(d.pay * 0.25); } img(c, 4); }, resultText: () => "It cost you, but people respected it." },
      { label: "Stay quiet and keep the money", effect: (c) => { img(c, -5); }, resultText: () => "Your comments filled up with the word 'hypocrite'." },
    ],
  },
  {
    id: "crypto-guilt",
    minAge: 18,
    maxAge: 90,
    weight: 1.1,
    condition: (c) => creator(c) && cr(c).deals.some((d) => d.sketchy),
    text: () => "A follower messages you: they put their savings into something you promoted, and lost it all. \"I trusted you.\"",
    choices: [
      { label: "Apologise publicly", effect: (c) => { img(c, 2); changeStat(c, "happiness", -4, "Guilt"); const d = cr(c).deals.find((x) => x.sketchy); if (d) cr(c).deals = cr(c).deals.filter((x) => x.id !== d.id); }, resultText: () => "You ended the deal and said it was a mistake. It doesn't fix it, but it's something." },
      { label: "Say you can't be responsible", effect: (c) => { img(c, -6); }, resultText: () => "That came out colder than you meant." },
      { label: "Send them some money quietly", effect: (c) => { c.money -= spend(c, 800); changeStat(c, "happiness", 1, "Making amends"); }, resultText: () => "It doesn't undo it, but you feel a little less awful." },
    ],
  },
  {
    id: "bought-followers-exposed",
    minAge: 14,
    maxAge: 90,
    weight: 2.4,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.fake >= 20),
    text: () => "A creator who makes videos about fake audiences has run the numbers on your account. The engagement doesn't add up.",
    choices: [
      { label: "Admit it", effect: (c) => { img(c, -4); for (const ch of cr(c).channels) ch.fake = 0; lose(c, 0.05); }, resultText: () => "It stung. The apology helped, and you wiped the fake ones out." },
      { label: "Deny everything", effect: (c) => { if (Math.random() < 0.3) { img(c, 1); } else { img(c, -12); lose(c, 0.06); } }, resultText: () => "Screenshots don't lie." , tone: "danger" },
    ],
  },
  // ------------------------------------------------------------ warmth
  {
    id: "young-fan-message",
    minAge: 20,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && fame(c) >= 20,
    text: () => "A message arrives from a teenager: \"I never told anyone I wanted to do this. Then I found your channel. I've started mine.\"",
    choices: [
      { label: "Write back with real advice", effect: (c) => { changeStat(c, "happiness", 5, "Inspiring someone"); img(c, 2); }, resultText: () => "You typed it, deleted it, and typed it again. It was the best thing you wrote all year.", tone: "good" },
      { label: "Send a shout-out", effect: (c) => { changeStat(c, "happiness", 3, "Inspiring someone"); img(c, 1); }, resultText: () => "Their channel gained a few hundred followers overnight." },
    ],
  },
  {
    id: "fan-art",
    minAge: 14,
    maxAge: 90,
    weight: 1.6,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 2000,
    text: () => "Somebody has drawn you. Better than you look, honestly. There's a whole thread of people making art of your characters and jokes.",
    autoEffect: (c) => { changeStat(c, "happiness", 4, "Fan art"); img(c, 1); },
  },
  {
    id: "comment-needs-help",
    minAge: 16,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 1000,
    text: () => "In your comments, someone writes something that sounds like they're not okay. Then they delete it. Then it's back.",
    choices: [
      { label: "Reach out privately", effect: (c) => { changeStat(c, "happiness", 2, "Doing the right thing"); img(c, 2); }, resultText: () => "You spent an evening messaging with a stranger. They were okay, in the end." , tone: "good" },
      { label: "Post a link to support lines", effect: (c) => { img(c, 1); }, resultText: () => "A small thing, but a few people said thank you." },
      { label: "Leave it to the platform", effect: (c) => { changeStat(c, "happiness", -2, "Wondering"); }, resultText: () => "You kept wondering about it." },
    ],
  },
  {
    id: "creator-noise-complaint",
    minAge: 16,
    maxAge: 60,
    weight: 1.2,
    condition: (c) => creator(c) && (c.residence?.housing === "rent" || c.residence?.housing === "own") && cr(c).channels.some((ch) => ch.cadence === "daily" || ch.cadence === "grind"),
    text: () => "The neighbours have complained about the noise: lights, shouting, and a 3am stream schedule.",
    choices: [
      { label: "Apologise and adjust", effect: (c) => { stress(c, 1); }, resultText: () => "You got a bag of cookies out of it." },
      { label: "Soundproof the room", effect: (c) => { c.money -= spend(c, 900); }, resultText: () => "The foam looks ridiculous, but it works." },
    ],
  },
  {
    id: "friend-wants-in",
    minAge: 15,
    maxAge: 60,
    weight: 1.4,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 1500 && !!friendOf(c),
    text: () => "A friend asks if you'll help them start their own channel. \"Just, like, show me how you do it.\"",
    choices: [
      { label: "Give them the full walkthrough", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 8); gain(c, 0.02); }, resultText: () => "You spent a whole weekend on it. They were thrilled." , tone: "good" },
      { label: "Give a few tips", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 3); }, resultText: () => "You were polite, and it stayed polite." },
      { label: "Say you're busy", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 5); }, resultText: () => "They stopped asking." },
    ],
  },
  // ------------------------------------------------------------ the big one
  {
    id: "creator-backlash",
    minAge: 13,
    maxAge: 90,
    weight: 40,
    condition: (c) => !!c.social?.crisis && c.social.crisis.startsWith("backlash"),
    banner: { title: "Controversy", subtitle: "Something you posted is going around", icon: "megaphone" },
    text: (c) => `It's everywhere. Screenshots of something you posted on ${topName(c)}, quote-posted and stripped of context. The comments are ${fame(c) >= 30 ? "in the tens of thousands" : "piling up"}. Your phone hasn't stopped buzzing. What do you do?`,
    choices: [
      { label: "Apologise sincerely", effect: (c) => { cr(c).crisis = null; if (Math.random() < 0.7) { img(c, 2); } else { img(c, -4); lose(c, 0.02); } stress(c, 4); }, resultText: () => "You posted a short, plain apology with no excuses. People are still deciding what they think." },
      { label: "Explain and defend yourself", effect: (c) => { cr(c).crisis = null; if (Math.random() < 0.4) { img(c, 4); } else { img(c, -8); lose(c, 0.03); } stress(c, 5); }, resultText: () => "It was a long post. A long post is rarely what a crisis needs." },
      { label: "Double down", effect: (c) => { cr(c).crisis = null; const loyal = cr(c).image > 10; if (loyal && Math.random() < 0.35) { gain(c, 0.1); img(c, -3); } else { img(c, -12); lose(c, 0.07); cr(c).deals = cr(c).deals.filter(() => Math.random() < 0.5); } stress(c, 6); }, resultText: () => "You didn't back down. Whatever happens next, you chose it.", tone: "danger" },
      { label: "Go quiet for a while", effect: (c) => { cr(c).crisis = null; pause(c); img(c, -3); cr(c).burnout = clamp(cr(c).burnout - 20); }, resultText: () => "You paused everything. It's a statement, in its own way." },
      { label: "Lean on your manager (if you have one)", effect: (c) => { cr(c).crisis = null; if (hasTeam(c, "manager")) { img(c, 1); c.money -= spend(c, 1000); } else { img(c, -5); } }, resultText: (c) => (hasTeam(c, "manager") ? "Your manager wrote the statement, made three phone calls and buried the story." : "You don't have a manager. You panicked and posted nothing.") },
    ],
  },
  // ------------------------------------------------------------ a few more
  {
    id: "trend-hijack",
    minAge: 13,
    maxAge: 90,
    weight: 2.4,
    condition: (c, w) => creator(c) && cr(c).channels.some((ch) => (w.social?.hot ?? []).some((h) => h.niche === ch.niche && h.mult > 1)),
    text: () => "Your niche is suddenly everywhere. Every account in it is getting a boost, and every brand is asking who's making the best content in it.",
    choices: [
      { label: "Go all in while it lasts", effect: (c) => { momentum(c, 1); cr(c).burnout = clamp(cr(c).burnout + 8); stress(c, 4); }, resultText: () => "You posted every day for a month and rode the wave.", tone: "good" },
      { label: "Keep to your normal pace", effect: (c) => { momentum(c, 0.4); }, resultText: () => "You got a decent bump without wrecking yourself." },
      { label: "Ignore the hype", effect: (c) => { img(c, 1); }, resultText: () => "Trends come and go. You stayed yourself." },
    ],
  },
  {
    id: "viewer-drama-chat",
    minAge: 13,
    maxAge: 60,
    weight: 1.6,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.platform === "twitch" && ch.followers >= 400),
    text: () => "Your stream chat has turned nasty. A group of regulars is picking on a newcomer, and it's escalating while you're mid-game.",
    choices: [
      { label: "Step in and ban the bullies", effect: (c) => { img(c, 3); lose(c, 0.01); }, resultText: () => "You lost a few regulars, and the chat became a nicer place." , tone: "good" },
      { label: "Pretend you haven't noticed", effect: (c) => { img(c, -3); }, resultText: () => "The newcomer left and told everyone why." },
      { label: "Get a moderator", effect: (c) => { c.money -= spend(c, 400); img(c, 2); }, resultText: () => "A volunteer mod took over. Chat got calmer." },
    ],
  },
  {
    id: "teacher-found-channel",
    minAge: 13,
    maxAge: 18,
    weight: 1.4,
    condition: (c) => creator(c) && fame(c) >= 8 && ["middle", "high"].includes(c.educationStage),
    text: () => "A teacher has found your channel. They stay behind after class to say... something.",
    choices: [
      { label: "Listen", effect: (c) => { changeStat(c, "smarts", 1, "A teacher's advice"); img(c, 1); }, resultText: () => "\"You're good at this. Keep your grades up and I'll happily watch.\"" },
      { label: "Act embarrassed", effect: () => {}, resultText: () => "They gave you a knowing smile and let you off." },
    ],
  },
  {
    id: "sibling-in-videos",
    minAge: 14,
    maxAge: 50,
    weight: 1.3,
    condition: (c) => creator(c) && (biggest(c)?.followers ?? 0) >= 1000 && c.relationships.some((r) => r.type === "sibling" && r.alive),
    text: () => "Your sibling keeps stealing the show whenever they appear in your videos, and your audience is asking for more of them.",
    choices: [
      { label: "Make them a co-host", effect: (c) => { const r = c.relationships.find((x) => x.type === "sibling" && x.alive); if (r) r.level = clamp(r.level + 8); gain(c, 0.06); }, resultText: () => "The two of you are a team. It's the best thing you've done together." , tone: "good" },
      { label: "Give them the odd cameo", effect: (c) => { const r = c.relationships.find((x) => x.type === "sibling" && x.alive); if (r) r.level = clamp(r.level + 3); gain(c, 0.02); }, resultText: () => "A fun compromise." },
      { label: "Keep it about you", effect: (c) => { const r = c.relationships.find((x) => x.type === "sibling" && x.alive); if (r) r.level = clamp(r.level - 4); }, resultText: () => "They sulked for a week." },
    ],
  },
  {
    id: "milestone-party",
    minAge: 15,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.followers >= 100000 && ch.followers < 400000),
    text: () => "You've passed a hundred thousand followers. Friends are messaging to ask when the party is.",
    choices: [
      { label: "Throw a proper party", effect: (c) => { c.money -= spend(c, 1500); changeStat(c, "happiness", 6, "Celebrating"); img(c, 2); leak(c, 1); }, resultText: () => "Balloons, cake, a five-minute speech and far too many photos.", tone: "good" },
      { label: "Quiet dinner with family", effect: (c) => { changeStat(c, "happiness", 4, "Celebrating"); const p = mother(c) ?? father(c); if (p) p.level = clamp(p.level + 4); }, resultText: () => "Your mum cried, and then made a toast." },
      { label: "Back to work", effect: (c) => { stress(c, 3); }, resultText: () => "There's no time to stop." },
    ],
  },
  {
    id: "comeback-after-ban",
    minAge: 13,
    maxAge: 90,
    weight: 3,
    condition: (c) => creator(c) && cr(c).channels.some((ch) => ch.strikes === 0 && ch.followers >= 1000 && ch.years >= 2) && cr(c).image < -15,
    text: () => "You've been in people's bad books for a while, and it shows. A creator you respect offers to sit down and help you reset.",
    choices: [
      { label: "Take the advice seriously", effect: (c) => { img(c, 8); stress(c, 3); for (const ch of cr(c).channels) if (ch.style === "bait") ch.style = "standard"; }, resultText: () => "You dropped the worst habits and started rebuilding trust.", tone: "good" },
      { label: "Ignore it", effect: (c) => { img(c, -2); }, resultText: () => "You know best. You always have." },
    ],
  },
  {
    id: "charity-collab",
    minAge: 15,
    maxAge: 90,
    weight: 1.4,
    condition: (c) => creator(c) && fame(c) >= 25,
    text: () => "A charity asks creators to make something together for a good cause. The mission is easy to get behind.",
    choices: [
      { label: "Give it your all", effect: (c) => { c.money -= spend(c, 400); img(c, 6); changeStat(c, "happiness", 5, "Doing good"); gain(c, 0.03); }, resultText: () => "You raised more than you'd dared hope.", tone: "good" },
      { label: "Send a small donation", effect: (c) => { c.money -= spend(c, 150); img(c, 1); }, resultText: () => "Every bit helps." },
      { label: "Not this time", effect: () => {}, resultText: () => "You had a lot on." },
    ],
  },
  {
    id: "friend-checks-in",
    minAge: 15,
    maxAge: 90,
    weight: 2,
    condition: (c) => creator(c) && cr(c).burnout >= 45 && !!friendOf(c),
    text: () => "An old friend messages: \"You seem exhausted. Come out for a coffee. No filming. Promise.\"",
    choices: [
      { label: "Go, and leave the phone at home", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level + 6); cr(c).burnout = clamp(cr(c).burnout - 10); changeStat(c, "happiness", 4, "Real friends"); }, resultText: () => "Three hours and a lot of laughing. It was exactly what you needed.", tone: "good" },
      { label: "Say you're too busy", effect: (c) => { const f = friendOf(c); if (f) f.level = clamp(f.level - 5); changeStat(c, "happiness", -2, "Losing touch"); }, resultText: () => "It's always 'next week'." },
    ],
  },
  // ------------------------------------------------------------ older creators
  {
    id: "grandparent-goes-viral",
    minAge: 60,
    maxAge: 95,
    weight: 1.8,
    once: true,
    condition: (c) => !isCreator(c) && c.relationships.some((r) => (r.type === "grandchild" || r.type === "child") && r.alive),
    text: () => "Your grandchild filmed you telling a story at the dinner table and put it online. It has been watched two million times. Strangers call you 'Grandma/Grandpa' in the comments.",
    choices: [
      { label: "Start your own channel", effect: (c, w) => { if (canOpen(c, "youtube")) { openChannel(c, w, "youtube", "vlogs"); const ch = channelOf(c, "youtube"); if (ch) { addFollowers(ch, randomInt(8000, 40000)); ch.momentum = 1.5; } } changeStat(c, "happiness", 6, "A new lease of life"); }, resultText: () => "You're the oldest person on the platform, and your audience adores you.", tone: "good" },
      { label: "Enjoy it and leave it", effect: (c) => { changeStat(c, "happiness", 4, "Late-life fame"); }, resultText: () => "You told the story again at every family gathering for years." },
    ],
  },
  {
    id: "reboot-comeback",
    minAge: 30,
    maxAge: 80,
    weight: 1.4,
    condition: (c) => !!c.social && c.social.channels.every((ch) => ch.cadence === "off") && c.social.topFollowers >= 20000,
    text: () => "You've been off the internet for a while. Someone reposts your old best work, and thousands of new people ask if you're ever coming back.",
    choices: [
      { label: "Come back", effect: (c) => { for (const ch of cr(c).channels) ch.cadence = "steady"; momentum(c, 1); cr(c).burnout = clamp(cr(c).burnout - 5); }, resultText: () => "You posted a nervous 'hello again'. It did numbers.", tone: "good" },
      { label: "Leave it in the past", effect: (c) => { changeStat(c, "happiness", 1, "Peace"); }, resultText: () => "Some things are better left as a memory." },
    ],
  },
];

