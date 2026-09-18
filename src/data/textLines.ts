export type ExchangePair = { them: string; you: string };

export function randomLine(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomExchange(pool: ExchangePair[]): ExchangePair {
  return pool[Math.floor(Math.random() * pool.length)];
}

export const EX_TEXT_OPENERS: string[] = [
  "hey stranger",
  "yo you up",
  "thinking about you today, don't read into it",
  "ok don't be weird about this but hi",
  "lol I saw something today that reminded me of you",
  "not gonna lie I miss the chaos a little",
  "so are we pretending we don't know each other or",
  "hey. just hey.",
];

export const EX_TEXT_REPLIES_WARM: string[] = [
  "omg hi. I was literally just thinking about you",
  "wait I actually miss talking to you",
  "lol you're lucky I still have this number saved",
  "took you long enough 🙄",
  "hi. I'm not mad you texted",
  "ok this made my whole day weirdly",
];

export const EX_TEXT_REPLIES_COLD: string[] = [
  "who is this",
  "we're not doing this again",
  "lol ok",
  "...why are you texting me",
  "new phone who dis (I know it's you)",
  "I saw this and put my phone down and walked away",
];

export const EX_CALL_GOOD: string[] = [
  "You two ended up on the phone for two hours like no time had passed at all.",
  "It was actually really nice hearing their voice again.",
  "You caught up, laughed about old stuff, hung up smiling.",
  "They admitted they'd been meaning to call you too.",
];

export const EX_CALL_BAD: string[] = [
  "It got tense fast. Old arguments have long memories.",
  "They hung up on you halfway through.",
  "It was awkward the entire time. Neither of you knew why you called.",
  "You brought up something you shouldn't have. It went badly.",
];

export const EX_BOOTYCALL_YES: string[] = [
  "say less",
  "omw",
  "you're lucky I wasn't busy",
  "this is a terrible idea and I'm doing it anyway",
];

export const EX_BOOTYCALL_MESSY: string[] = [
  "we need to stop doing this",
  "that was a mistake and I regret nothing",
  "ok that was fun but we are NOT talking about this",
  "why do we keep doing this to ourselves",
];

export const GIFT_THANKS: string[] = [
  "omg you didn't have to do that. thank you",
  "wow ok. this was really sweet actually",
  "you're buying your way back into my life and it's working",
  "I wasn't expecting this. thank you, seriously",
  "ok this was unnecessary but I'll take it",
];

export const EX_AMBIENT_EXCHANGES: ExchangePair[] = [
  { them: "did you hear who [redacted] is dating now", you: "NO. tell me everything" },
  { them: "I'm not saying I still think about us but I'm also not NOT saying that", you: "..." },
  { them: "your mom still asks about you lol", you: "tell her I said hi I guess" },
  { them: "I deleted our photos. finally.", you: "good for you" },
  { them: "I saw someone that looked like you and my whole body panicked", you: "same energy honestly" },
  { them: "we should NOT be friends and yet", you: "yet here we are" },
  { them: "I'm doing so much better without you btw", you: "cool. love that for you" },
  { them: "remember when you said we'd never talk again", you: "I remember that being your line actually" },
];

export const FRIEND_AMBIENT_EXCHANGES: ExchangePair[] = [
  { them: "bro you would NOT believe what happened at work today", you: "tell me right now" },
  { them: "I need you to talk me out of texting my ex", you: "put the phone down. I mean it" },
  { them: "we're still doing this weekend right", you: "wouldn't miss it" },
  { them: "I did something questionable last night", you: "why does this not surprise me" },
  { them: "ok but you're my ride or die right", you: "obviously. what happened" },
  { them: "I think I'm in trouble", you: "define trouble" },
];

export const FAMILY_AMBIENT_EXCHANGES: ExchangePair[] = [
  { them: "call me when you get a chance", you: "everything ok?" },
  { them: "did you eat today", you: "yes mom" },
  { them: "your cousin is getting married, did you hear", you: "wait WHAT" },
  { them: "we miss you around here", you: "miss you too, I'll come by soon" },
  { them: "don't forget about the thing this weekend", you: "I didn't forget I promise" },
  { them: "just checking in on you", you: "I'm good, promise. love you" },
];
