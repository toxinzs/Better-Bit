import { colors } from "../theme";

// Every popup gets a little scene header so a life's moments don't all look alike. The category
// comes from the event's id; anything unmatched is just "Life".

export type Scene = { label: string; icon: string; color: string };

const RULES: { re: RegExp; label: string; icon: string; color: () => string }[] = [
  { re: /creator|viral|hater|brand|sponsor|stream|follower|algorithm|merch|channel|collab|doxx|deepfake|copyright|impersonat|fan-|-fan|influenc|podcast|tv-|award|hit-piece|old-post|paparaz|stalker|giveaway|tired-of-it|read-the-comments|plateau|comeback|reboot/, label: "Fame", icon: "megaphone", color: () => colors.gold },
  { re: /school|class|teacher|prom|exam|college|campus|grad|homework|bully|detention|club|study|dorm|frat|sorority|tuition|scholar/, label: "School", icon: "school", color: () => colors.happiness },
  { re: /crush|date|kiss|romance|wedding|marri|divorce|breakup|propos|affair|love|partner|dating|ex-|-ex|spouse|honeymoon|fertil|pregnan/, label: "Love", icon: "heart", color: () => colors.love },
  { re: /police|arrest|crime|jail|court|steal|robb|trial|lawyer|prison|parole|shoplift|vandal|fight|assault|bail/, label: "Trouble", icon: "shield", color: () => colors.danger },
  { re: /job|work|boss|promot|layoff|office|career|coworker|interview|business|salary|raise|union|retire|shift|manager|colleague|mentor|toxic/, label: "Work", icon: "briefcase", color: () => colors.smarts },
  { re: /money|lottery|invest|crypto|scam|loan|debt|tax|bank|rent|mortgage|inherit|stock|bill|wallet|budget|bankrupt|landlord|phishing|savings|windfall|gambl/, label: "Money", icon: "cash", color: () => colors.primary },
  { re: /sick|illness|health|cancer|doctor|hospital|injur|addict|rehab|diet|gym|therapy|surgery|flu|virus|drink|smok|drug|body|medical|checkup|disease|fever|allerg|vaccin|burnout|panic|anxiety|depress/, label: "Health", icon: "medkit", color: () => colors.health },
  { re: /mother|father|sibling|parent|grand|family|baby|kid|child|funeral|death|reunion|in-law|brother|sister|adopt|nephew|niece|cousin|aunt|uncle|toddler|newborn|birthday/, label: "Family", icon: "people", color: () => colors.looks },
  { re: /move|visa|abroad|immigr|citizen|passport|trip|travel|vacation|holiday|flight|emigrat|deport|expat|homesick/, label: "Travel", icon: "airplane", color: () => colors.teal },
];

export function sceneFor(eventId: string): Scene {
  for (const r of RULES) if (r.re.test(eventId)) return { label: r.label, icon: r.icon, color: r.color() };
  return { label: "Life", icon: "sparkles", color: colors.gold };
}
