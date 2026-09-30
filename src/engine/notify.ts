import { Character, Notice } from "../types";

// Some things you shouldn't have to dig through the life log to find out: a
// layoff, a promotion, a visa decision, a bankruptcy. Anything the engine
// writes to the year's log that matches one of these becomes a headline popup.

type Rule = { re: RegExp; title: string; icon: string; tone: Notice["tone"] };

const RULES: Rule[] = [
  // work
  { re: /^Promoted!/, title: "You got promoted", icon: "trending-up", tone: "good" },
  { re: /redundancies and your role/, title: "You've been laid off", icon: "briefcase", tone: "bad" },
  { re: /You were dismissed/, title: "You've been fired", icon: "close-circle", tone: "bad" },
  { re: /pushed out for it/, title: "You've been pushed out", icon: "close-circle", tone: "bad" },
  { re: /performance improvement plan/, title: "Performance warning", icon: "warning", tone: "warn" },
  { re: /You got off the performance plan/, title: "Back in good standing", icon: "checkmark-circle", tone: "good" },
  { re: /^Your annual review: (outstanding|exceeds expectations|needs improvement|unsatisfactory)/, title: "Your annual review", icon: "clipboard", tone: "info" },
  { re: /^You started as a /, title: "New job", icon: "briefcase", tone: "good" },
  { re: /^You retired/, title: "You retired", icon: "sunny", tone: "info" },
  { re: /Your employer sponsored you|became a work visa/, title: "Visa upgraded", icon: "id-card", tone: "good" },
  // business and money
  { re: /^You opened /, title: "You opened a business", icon: "storefront", tone: "good" },
  { re: /went bankrupt|You declared bankruptcy/, title: "Bankruptcy", icon: "warning", tone: "bad" },
  { re: /breakout year/, title: "A breakout year", icon: "rocket", tone: "good" },
  { re: /^You sold .* for \$/, title: "Sold", icon: "cash", tone: "good" },
  { re: /won the lottery/, title: "You won the lottery!", icon: "ticket", tone: "good" },
  { re: /Scammers took/, title: "You were scammed", icon: "alert-circle", tone: "bad" },
  { re: /You were evicted/, title: "You've been evicted", icon: "home", tone: "bad" },
  { re: /You have nowhere of your own to live/, title: "You're homeless", icon: "home", tone: "bad" },
  { re: /fell behind on the .* rent/, title: "Behind on rent", icon: "home", tone: "warn" },
  { re: /had to downsize to a shared room/, title: "Downsized", icon: "home", tone: "warn" },
  { re: /took you in\. It's not much/, title: "Someone took you in", icon: "heart", tone: "good" },
  { re: /Money got tight, so the gym/, title: "Cutbacks", icon: "wallet", tone: "warn" },
  // across borders
  { re: /^Approved! /, title: "Visa approved", icon: "airplane", tone: "good" },
  { re: /was refused\./, title: "Application refused", icon: "close-circle", tone: "bad" },
  { re: /You were deported/, title: "You've been deported", icon: "airplane", tone: "bad" },
  { re: /Your visa expired/, title: "Your visa has expired", icon: "id-card", tone: "bad" },
  { re: /runs out next year/, title: "Visa running out", icon: "id-card", tone: "warn" },
  { re: /You passed the test and took the oath/, title: "You're a citizen", icon: "ribbon", tone: "good" },
  { re: /didn't pass\. You can try again/, title: "Citizenship test failed", icon: "close-circle", tone: "bad" },
  { re: /You moved from .* to .*\./, title: "You've moved", icon: "swap-horizontal", tone: "info" },
  { re: /^Your family (moved|emigrated)/, title: "Your family is moving", icon: "swap-horizontal", tone: "info" },
  { re: /^You moved back from /, title: "Back home", icon: "home", tone: "info" },
  // body and mind
  { re: /overdosed/, title: "An overdose", icon: "medkit", tone: "bad" },
  { re: /You realise you can't stop/, title: "You're hooked", icon: "warning", tone: "bad" },
  { re: /relapsed on/, title: "A relapse", icon: "refresh", tone: "bad" },
  { re: /Three years clear|A year clean|completed rehab and quit/, title: "Getting clean", icon: "shield-checkmark", tone: "good" },
  { re: /hurt yourself training/, title: "An injury", icon: "bandage", tone: "warn" },
  { re: /You were diagnosed with|You came down with a serious|rushed to hospital/, title: "A health scare", icon: "medkit", tone: "bad" },
  { re: /caught with drugs/, title: "Caught with drugs", icon: "alert-circle", tone: "bad" },
  { re: /Your check-up caught/, title: "Caught early", icon: "medkit", tone: "good" },
  // love and family
  { re: /^You (got|are now) (engaged|married)|got married/, title: "Wedding bells", icon: "heart-circle", tone: "good" },
  { re: /You and .* divorced/, title: "Divorce", icon: "heart-dislike", tone: "bad" },
];

const MAX_PER_YEAR = 6;

function idFor(c: Character, n: number) {
  return `n${c.age}-${n}-${Math.random().toString(36).slice(2, 6)}`;
}

export function notify(c: Character, title: string, text: string, icon: string, tone: Notice["tone"]): void {
  const list = (c.notices ??= []);
  if (list.some((n) => n.text === text)) return;
  list.push({ id: idFor(c, list.length), title, text, icon, tone });
}

// Scan lines the engine just wrote and queue headlines for the important ones.
// Returns the lines that became headlines so callers can skip repeating them.
export function harvestNotices(c: Character, from = 0): string[] {
  const lines = c.yearLog.slice(from);
  const used: string[] = [];
  const achievements: string[] = [];
  let count = 0;
  for (const line of lines) {
    const ach = /^Achievement unlocked: (.*)\.$/.exec(line);
    if (ach) {
      achievements.push(ach[1]);
      used.push(line);
      continue;
    }
    if (count >= MAX_PER_YEAR) continue;
    const rule = RULES.find((r) => r.re.test(line));
    if (!rule) continue;
    notify(c, rule.title, line, rule.icon, rule.tone);
    used.push(line);
    count++;
  }
  if (achievements.length > 0) {
    notify(c, achievements.length === 1 ? "Achievement unlocked" : `${achievements.length} achievements unlocked`, achievements.join(", ") + ".", "trophy", "good");
  }
  return used;
}

export function dismissNotice(c: Character, id: string): void {
  c.notices = (c.notices ?? []).filter((n) => n.id !== id);
}
