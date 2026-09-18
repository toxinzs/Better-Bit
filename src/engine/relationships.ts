import { Character, Relationship, TextMessage } from "../types";
import { clamp } from "./util";
import {
  ExchangePair,
  randomLine,
  randomExchange,
  EX_TEXT_OPENERS,
  EX_TEXT_REPLIES_WARM,
  EX_TEXT_REPLIES_COLD,
  EX_CALL_GOOD,
  EX_CALL_BAD,
  EX_BOOTYCALL_YES,
  EX_BOOTYCALL_MESSY,
  GIFT_THANKS,
  EX_AMBIENT_EXCHANGES,
  FRIEND_AMBIENT_EXCHANGES,
  FAMILY_AMBIENT_EXCHANGES,
} from "../data/textLines";

const MAX_MESSAGES = 40;
const RECONCILE_THRESHOLD = 75;
const AMBIENT_CHANCE = 0.12;

function findRelationship(c: Character, relationshipId: string): Relationship | undefined {
  return c.relationships.find((r) => r.id === relationshipId && r.alive);
}

function pushMessage(r: Relationship, msg: TextMessage) {
  const messages = r.messages ?? [];
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) messages.shift();
  r.messages = messages;
}

function hasPartner(c: Character): boolean {
  return c.relationships.some((r) => r.type === "partner" && r.alive);
}

function maybeReconcile(c: Character, r: Relationship) {
  if (r.type === "ex" && r.level >= RECONCILE_THRESHOLD && !hasPartner(c)) {
    r.type = "partner";
    r.engaged = false;
    r.married = false;
    c.yearLog.push(`You and ${r.name} are back together.`);
  }
}

export function textRelationship(c: Character, relationshipId: string) {
  const r = findRelationship(c, relationshipId);
  if (!r) return;

  if (r.type === "ex") {
    pushMessage(r, { text: randomLine(EX_TEXT_OPENERS), fromPlayer: true, age: c.age });
    const warm = Math.random() < 0.4 + r.level / 200;
    pushMessage(r, { text: randomLine(warm ? EX_TEXT_REPLIES_WARM : EX_TEXT_REPLIES_COLD), fromPlayer: false, age: c.age });
    r.level = clamp(r.level + (warm ? 6 : -3));
    c.stats.happiness = clamp(c.stats.happiness + (warm ? 3 : -1));
    c.yearLog.push(`You texted ${r.name}.`);
    maybeReconcile(c, r);
  } else {
    pushMessage(r, { text: "Hey, thinking about you!", fromPlayer: true, age: c.age });
    r.level = clamp(r.level + 3);
    c.stats.happiness = clamp(c.stats.happiness + 1);
    c.yearLog.push(`You texted ${r.name}.`);
  }
}

export function callRelationship(c: Character, relationshipId: string) {
  const r = findRelationship(c, relationshipId);
  if (!r) return;

  const goesWell = Math.random() < 0.35 + r.level / 150;
  const line = r.type === "ex" ? randomLine(goesWell ? EX_CALL_GOOD : EX_CALL_BAD) : goesWell ? "It was a great catch-up call." : "The call felt a little off.";
  pushMessage(r, { text: `📞 ${line}`, fromPlayer: false, age: c.age });
  r.level = clamp(r.level + (goesWell ? 10 : -8));
  c.stats.happiness = clamp(c.stats.happiness + (goesWell ? 5 : -4));
  c.yearLog.push(`You called ${r.name}. ${line}`);
  maybeReconcile(c, r);
}

export function bootyCall(c: Character, relationshipId: string) {
  const r = findRelationship(c, relationshipId);
  if (!r || r.type !== "ex") return;

  const messy = Math.random() < 0.4;
  pushMessage(r, { text: randomLine(messy ? EX_BOOTYCALL_MESSY : EX_BOOTYCALL_YES), fromPlayer: false, age: c.age });
  r.level = clamp(r.level + (messy ? 8 : 14));
  c.stats.happiness = clamp(c.stats.happiness + (messy ? -2 : 10));
  c.yearLog.push(`You and ${r.name} hooked up again. ${messy ? "It's complicated." : "No regrets... yet."}`);
  maybeReconcile(c, r);
}

export function sendGift(c: Character, relationshipId: string, amount: number) {
  const r = findRelationship(c, relationshipId);
  if (!r) return;

  if (c.money < amount) {
    c.yearLog.push(`You couldn't afford to send ${r.name} anything.`);
    return;
  }
  c.money -= amount;
  r.level = clamp(r.level + Math.round(amount / 20));
  pushMessage(r, { text: randomLine(GIFT_THANKS), fromPlayer: false, age: c.age });
  c.stats.happiness = clamp(c.stats.happiness + 4);
  c.yearLog.push(`You sent ${r.name} a gift. -$${amount.toLocaleString()}`);
  maybeReconcile(c, r);
}

export function ambientMessageTick(c: Character) {
  for (const r of c.relationships) {
    if (!r.alive) continue;
    if (Math.random() > AMBIENT_CHANCE) continue;

    let pool: ExchangePair[] | null = null;
    if (r.type === "ex") pool = EX_AMBIENT_EXCHANGES;
    else if (r.type === "friend" || r.type === "partner") pool = FRIEND_AMBIENT_EXCHANGES;
    else if (r.type === "mother" || r.type === "father" || r.type === "sibling" || r.type === "child") pool = FAMILY_AMBIENT_EXCHANGES;
    if (!pool) continue;

    const exchange = randomExchange(pool);
    pushMessage(r, { text: exchange.them, fromPlayer: false, age: c.age });
    pushMessage(r, { text: exchange.you, fromPlayer: true, age: c.age });
  }
}
