import { Scene } from "./types";

// Friends, classmates, coworkers, partners and exes.
export const SOCIAL_SCENES: Scene[] = [
  // ---------- friends ----------
  {
    id: "fr-drama", who: ["friend", "classmate"], age: [10, 18],
    text: "{n} pulls you aside. \"Okay, you HAVE to hear what happened at lunch.\"",
    choices: [
      { label: "Lean in and listen", lvl: 7, hap: 3, result: "It was the most dramatic thing you've heard all semester." },
      { label: "Say you don't want to gossip", lvl: 2, smarts: 1, result: "{n} shrugged. \"Fair. You're the only one who never talks about people.\"" },
      { label: "Spread it around", lvl: -6, hap: 1, tone: "danger", result: "It got back to {n}. Awkward." },
    ],
  },
  {
    id: "fr-study", who: ["friend", "classmate"], age: [10, 22],
    text: "{n} asks if you want to study together for the next test.",
    choices: [
      { label: "Say yes", lvl: 6, smarts: 2, result: "You mostly talked, but you also actually learned something." },
      { label: "Say you study better alone", lvl: 0, smarts: 1, result: "{n} understood. Mostly." },
      { label: "Ask to copy {his} notes", lvl: -3, result: "{n} handed them over with a look." },
    ],
  },
  {
    id: "fr-crush", who: ["friend", "classmate"], age: [12, 18],
    text: "{n} confides that {he} has a crush on someone and wants your opinion.",
    choices: [
      { label: "Hype {him} up", lvl: 8, hap: 3, favor: 3, result: "{n} practiced what to say on you for twenty minutes." },
      { label: "Give an honest take", lvl: 5, smarts: 1, result: "It wasn't what {n} wanted to hear, but it was probably right." },
      { label: "Tease {him} mercilessly", lvl: -2, hap: 2, result: "{n} turned as red as a tomato." },
    ],
  },
  {
    id: "fr-lunch", who: ["friend", "classmate"], age: [6, 18],
    text: "{n} forgot lunch money today.",
    choices: [
      { label: "Share your lunch", lvl: 9, hap: 2, favor: 3, result: "Half a sandwich and a bond forever." },
      { label: "Lend {him} a few bucks", lvl: 6, money: -5, result: "{n} promised to pay you back. They mostly did." },
      { label: "Tell {him} to ask someone else", lvl: -5, result: "{n} didn't ask you for anything after that." },
    ],
  },
  {
    id: "fr-adventure", who: ["friend"], age: [16, 40],
    text: "{n} has a spontaneous idea: \"Let's just drive somewhere. Anywhere.\"",
    choices: [
      { label: "Grab your keys", lvl: 9, hap: 6, health: 1, result: "You ended up somewhere neither of you had heard of. Best day of the month." },
      { label: "Suggest doing it next weekend", lvl: 3, result: "Next weekend never came. It's still a good idea." },
      { label: "Say you can't", lvl: -3, result: "{n} went alone and sent you photos." },
    ],
  },
  {
    id: "fr-venting", who: ["friend"], age: [18, 80],
    text: "{n} calls and just needs to vent about {his} week.",
    choices: [
      { label: "Listen, no fixing", lvl: 8, hap: 1, favor: 3, result: "{n} said it was exactly what {he} needed." },
      { label: "Give {him} practical advice", lvl: 4, smarts: 1, result: "{n} was quiet, then said \"...that's actually useful.\"" },
      { label: "Steer it back to yourself", lvl: -4, result: "{n} got off the phone quicker than usual." },
    ],
  },
  {
    id: "fr-old-times", who: ["friend"], age: [20, 90],
    text: "{n} brings up the old days. You both start laughing.",
    choices: [
      { label: "Reminisce for hours", lvl: 8, hap: 5, result: "You lost track of time. Good sign." },
      { label: "Suggest making new memories", lvl: 7, hap: 3, result: "\"Yes,\" {n} said. \"Let's do that.\"" },
    ],
  },
  {
    id: "fr-hard-truth", who: ["friend"], age: [16, 70],
    text: "{n} is about to make what looks like a big mistake, and hasn't asked what you think.",
    choices: [
      { label: "Speak up honestly", lvl: 3, smarts: 1, favor: 2, result: "{n} was angry for a day. Then thanked you." },
      { label: "Stay out of it", lvl: 0, result: "It went about as expected." },
      { label: "Cheer {him} on anyway", lvl: 2, hap: 1, result: "It was a mistake. You picked up the pieces together." },
    ],
  },
  {
    id: "fr-group-chat", who: ["friend"], age: [12, 45],
    text: "{n} adds you to a group chat with three people you barely know. It's chaos.",
    choices: [
      { label: "Join in the chaos", lvl: 6, hap: 4, result: "Your phone hasn't stopped buzzing since. You love it." },
      { label: "Mute it", lvl: 0, result: "You'll get to it eventually." },
    ],
  },
  {
    id: "fr-fight", who: ["friend"], age: [12, 60],
    text: "You and {n} had a tense moment last week, and it's still hanging in the air.",
    choices: [
      { label: "Apologize first", lvl: 9, hap: 3, favor: 4, result: "It took thirty seconds and lifted a week of tension." },
      { label: "Wait for {him} to reach out", lvl: -3, result: "The silence stretched on. Eventually you both moved on." },
      { label: "Act like nothing happened", lvl: 2, result: "It kind of worked. Kind of." },
    ],
  },
  {
    id: "fr-cooking", who: ["friend"], age: [17, 70],
    text: "{n} invites you over to try a recipe {he}'s been obsessed with.",
    choices: [
      { label: "Bring dessert", lvl: 7, hap: 4, money: -12, result: "The recipe was a disaster. The dessert saved the night." },
      { label: "Show up hungry", lvl: 6, hap: 3, health: -1, result: "It was surprisingly good. You had thirds." },
    ],
  },
  {
    id: "fr-workout", who: ["friend"], age: [15, 60],
    text: "{n} says you two should start working out together.",
    choices: [
      { label: "Go the next morning", lvl: 6, health: 3, hap: 2, result: "You could barely walk after. Worth it." },
      { label: "Say maybe next month", lvl: 0, result: "You both know maybe means no." },
      { label: "Make it a hike instead", lvl: 8, health: 2, hap: 4, result: "The view at the top was ridiculous." },
    ],
  },
  {
    id: "fr-moving-away", who: ["friend"], age: [18, 60],
    text: "{n} tells you {he}'s moving away.",
    choices: [
      { label: "Promise to visit", lvl: 8, hap: -1, result: "You meant it. You'll try." },
      { label: "Throw {him} a goodbye night", lvl: 9, hap: 3, money: -40, result: "It was the kind of night you don't forget." },
      { label: "Say you're happy for {him}", lvl: 5, result: "You were, mostly. You'll miss {him}." },
    ],
  },
  {
    id: "fr-secret-talent", who: ["friend", "classmate"], age: [8, 60],
    text: "{n} shows you something {he}'s been secretly practicing, and it's actually impressive.",
    choices: [
      { label: "Tell {him} how good it is", lvl: 8, hap: 3, result: "{n} was flustered and happy. Then asked you to keep it quiet." },
      { label: "Ask to be taught", lvl: 7, smarts: 1, result: "The first lesson was a disaster. You want a second one." },
    ],
  },
  {
    id: "fr-borrow-ride", who: ["friend"], age: [16, 60],
    text: "{n} needs a ride to the airport at an awful hour.",
    choices: [
      { label: "Do it", lvl: 9, hap: -1, favor: 5, result: "You got home at 5am. {n} would take a bullet for you now." },
      { label: "Book {him} a cab instead", lvl: 3, money: -30, result: "{n} was grateful but noted the absence of your face." },
      { label: "Say no", lvl: -6, result: "{n} found another way. It stuck with {him}." },
    ],
  },
  {
    id: "fr-new-friend", who: ["friend"], age: [12, 60],
    text: "{n} brings a new friend along and the two of them keep sharing inside jokes.",
    choices: [
      { label: "Warm up to the newcomer", lvl: 6, hap: 3, result: "You ended up having a great time. Three's a party." },
      { label: "Feel left out and say so", lvl: 3, hap: -1, result: "{n} apologized right away. It was a good talk." },
      { label: "Sulk", lvl: -5, hap: -2, result: "The night ended early." },
    ],
  },
  {
    id: "fr-gaming", who: ["friend", "classmate"], age: [8, 40],
    text: "{n} challenges you to an all-night gaming session.",
    choices: [
      { label: "You're in", lvl: 7, hap: 5, health: -2, result: "You lost, badly, and you'd do it again." },
      { label: "Play for an hour", lvl: 4, hap: 2, result: "You got exactly one round in before {n} accused you of being boring." },
    ],
  },
  {
    id: "fr-senior-coffee", who: ["friend"], age: [60, 100],
    text: "{n} shows up with two coffees and a crossword. \"Thought you might want company.\"",
    choices: [
      { label: "Take the crossword", lvl: 7, smarts: 1, hap: 4, result: "You got stuck on 14 across for an hour. {n} was no help at all." },
      { label: "Just talk", lvl: 8, hap: 5, result: "The best part of the day, honestly." },
    ],
  },

  // ---------- classmates ----------
  {
    id: "cl-project", who: ["classmate"], age: [8, 22],
    text: "You and {n} got paired up for a group project.",
    choices: [
      { label: "Split the work evenly", lvl: 5, smarts: 2, result: "You both pulled your weight. Rare." },
      { label: "Do most of it yourself", lvl: 2, smarts: 3, hap: -1, result: "It came out great, and {n} owes you." },
      { label: "Slack off", lvl: -6, smarts: -1, result: "{n} noticed. Everyone noticed." },
    ],
  },
  {
    id: "cl-seat", who: ["classmate"], age: [6, 22],
    text: "{n} asks if they can sit with you at lunch.",
    choices: [
      { label: "Make room", lvl: 8, hap: 3, result: "Turns out you had more in common than you'd guessed." },
      { label: "Say the seat's taken", lvl: -7, result: "{n} nodded and found somewhere else. It stung." },
    ],
  },
  {
    id: "cl-notes", who: ["classmate"], age: [12, 22],
    text: "{n} missed class and asks to borrow your notes.",
    choices: [
      { label: "Share them happily", lvl: 6, smarts: 1, favor: 2, result: "{n} brought you snacks as thanks." },
      { label: "Charge a snack", lvl: 3, result: "{n} paid up, grudgingly." },
      { label: "Say no", lvl: -5, result: "{n} won't forget that." },
    ],
  },
  {
    id: "cl-team", who: ["classmate"], age: [8, 18],
    text: "{n} tells you {he}'s trying out for a team or club and asks you to come cheer.",
    choices: [
      { label: "Be the loudest fan", lvl: 8, hap: 4, result: "{n} spotted you in the crowd and grinned the whole game." },
      { label: "Say you'll try to make it", lvl: 2, result: "You didn't make it. {n} didn't say anything." },
    ],
  },
  {
    id: "cl-bully", who: ["classmate"], age: [8, 17],
    text: "You spot {n} getting picked on by someone bigger.",
    choices: [
      { label: "Stand up for {him}", lvl: 12, hap: 2, favor: 5, result: "Nobody bothered {him} again. You have a friend for life." },
      { label: "Get a teacher", lvl: 7, smarts: 1, result: "It stopped. {n} said thanks quietly." },
      { label: "Walk by", lvl: -6, hap: -3, result: "You couldn't shake the feeling for days." },
    ],
  },
  {
    id: "cl-college", who: ["classmate"], age: [18, 30],
    text: "{n} invites you to a study group that's half studying and half snacks.",
    choices: [
      { label: "Join in", lvl: 6, smarts: 2, hap: 2, result: "You passed the exam, and made two new friends." },
      { label: "Bring the good snacks", lvl: 8, hap: 3, money: -10, result: "You're the group's favorite now." },
    ],
  },

  // ---------- coworkers ----------
  {
    id: "co-lunch", who: ["coworker"], age: [18, 70],
    text: "{n} asks if you want to grab lunch instead of eating at your desk again.",
    choices: [
      { label: "Go", lvl: 7, hap: 3, money: -14, result: "You learned more about the office in an hour than in a year." },
      { label: "Say you have too much to do", lvl: -2, result: "{n} nodded. You did have too much to do." },
    ],
  },
  {
    id: "co-gossip", who: ["coworker"], age: [18, 70],
    text: "{n} whispers some office gossip about the boss.",
    choices: [
      { label: "Listen", lvl: 5, hap: 2, result: "It was juicy. You felt slightly guilty." },
      { label: "Shut it down politely", lvl: 2, smarts: 1, result: "{n} respected that, in a way." },
    ],
  },
  {
    id: "co-cover", who: ["coworker"], age: [18, 70],
    text: "{n} asks you to cover a shift so {he} can attend a family thing.",
    choices: [
      { label: "Cover it", lvl: 9, favor: 5, hap: -1, result: "{n} promised to return the favor. You'll hold {him} to it." },
      { label: "Say no", lvl: -4, result: "{n} found someone else, eventually." },
    ],
  },
  {
    id: "co-mentor", who: ["coworker"], age: [18, 70],
    text: "{n} offers to show you a shortcut that'll save you hours a week.",
    choices: [
      { label: "Learn it", lvl: 6, smarts: 2, result: "It saved you more than a few afternoons." },
      { label: "Say you've got a system", lvl: 0, result: "You did not, in fact, have a system." },
    ],
  },

  // ---------- partners (kept sweet and non-explicit; teen-safe) ----------
  {
    id: "pa-teen-note", who: ["partner"], age: [13, 17],
    text: "{n} passes you a folded note in the hallway. It has a doodle of you two on it.",
    choices: [
      { label: "Write one back", lvl: 8, hap: 5, result: "The notes went back and forth all week." },
      { label: "Keep it forever", lvl: 6, hap: 4, result: "It's tucked in your desk drawer already." },
      { label: "Show your friends", lvl: -4, hap: 1, result: "{n} found out. Not your best move." },
    ],
  },
  {
    id: "pa-teen-friends", who: ["partner"], age: [13, 17],
    text: "{n} wants you to meet {his} friends. It feels like a big deal.",
    choices: [
      { label: "Go and be yourself", lvl: 8, hap: 3, result: "They liked you. {n} was so relieved." },
      { label: "Say you're nervous", lvl: 6, hap: 1, result: "{n} said it was okay. They were nervous too." },
      { label: "Make an excuse", lvl: -5, result: "{n} noticed." },
    ],
  },
  {
    id: "pa-teen-phone", who: ["partner"], age: [13, 17],
    text: "{n} texts you goodnight every night. Tonight the message is late.",
    choices: [
      { label: "Text first", lvl: 6, hap: 3, result: "{n} replied instantly. \"I was just about to!\"" },
      { label: "Wait it out", lvl: -1, result: "It came in eventually. {He} had fallen asleep with the phone on {his} face." },
    ],
  },
  {
    id: "pa-argue-small", who: ["partner"], age: [13, 90],
    text: "You and {n} have a small argument about something completely trivial.",
    choices: [
      { label: "Let it go and laugh", lvl: 6, hap: 3, result: "Whatever it was about, neither of you can remember it now." },
      { label: "Dig in and win", lvl: -6, hap: -2, result: "You won. It cost you the whole evening." },
      { label: "Say sorry and mean it", lvl: 8, hap: 2, favor: 3, result: "{n} softened right away." },
    ],
  },
  {
    id: "pa-support", who: ["partner"], age: [16, 90],
    text: "{n} is nervous about something big coming up and it shows.",
    choices: [
      { label: "Hype {him} up", lvl: 8, hap: 3, favor: 3, result: "{n} walked in with their head up." },
      { label: "Practice with {him}", lvl: 9, smarts: 1, result: "You rehearsed until {he} could do it in {his} sleep." },
      { label: "Tell {him} it's no big deal", lvl: -4, result: "It was a big deal to {him}. {n} went quiet." },
    ],
  },
  {
    id: "pa-adult-future", who: ["partner"], age: [20, 80],
    text: "{n} starts a conversation about where you both see yourselves in five years.",
    choices: [
      { label: "Share your honest picture", lvl: 8, hap: 2, favor: 3, result: "It turned out you want a lot of the same things." },
      { label: "Keep it light", lvl: 2, result: "The conversation stayed pleasant and vague." },
      { label: "Say you'd rather not plan that far", lvl: -5, result: "{n} nodded slowly. It stayed in the air for days." },
    ],
  },
  {
    id: "pa-chores", who: ["partner"], age: [20, 80],
    text: "{n} points out, gently, that the chores haven't been very evenly split lately.",
    choices: [
      { label: "Apologize and take on more", lvl: 7, hap: 1, favor: 3, result: "The dishes are done. {n} noticed." },
      { label: "Make a chart together", lvl: 8, smarts: 1, result: "The chart lasted three weeks. That's a record." },
      { label: "Get defensive", lvl: -7, hap: -2, result: "It took a full day to come back from that." },
    ],
  },
  {
    id: "pa-surprise", who: ["partner"], age: [17, 80],
    text: "{n} has been acting mysterious all week. Tonight, {he} finally reveals a surprise.",
    choices: [
      { label: "Act as surprised as you can", lvl: 8, hap: 5, result: "{n} was beaming. You genuinely were surprised, actually." },
      { label: "Say you'd guessed", lvl: 3, hap: 2, result: "{n} deflated. \"You always know.\"" },
    ],
  },
  {
    id: "pa-hard-day", who: ["partner"], age: [16, 90],
    text: "{n} comes home wiped out after a rough day.",
    choices: [
      { label: "Make {him} tea and listen", lvl: 9, hap: 2, favor: 3, result: "{n} melted a little. \"I don't know what I'd do without you.\"" },
      { label: "Order takeout and put on a movie", lvl: 7, hap: 3, money: -30, result: "The couch, the blanket, and nothing to say. Perfect." },
      { label: "Ask what you can do", lvl: 5, result: "\"Just be here,\" {n} said." },
    ],
  },
  {
    id: "pa-remember", who: ["partner"], age: [17, 90],
    text: "{n} remembers something small you mentioned weeks ago and acts on it.",
    choices: [
      { label: "Tell {him} how much it means", lvl: 8, hap: 5, result: "{n} shrugged, but was clearly glowing." },
      { label: "Return the favor", lvl: 9, hap: 4, money: -20, result: "You kept the streak of small kindnesses going." },
    ],
  },
  {
    id: "pa-jealous", who: ["partner"], age: [15, 90],
    text: "You catch {n} looking at your phone when you get a message from someone else.",
    choices: [
      { label: "Show {him} it's nothing", lvl: 4, result: "{n} apologized right away. Trust is a work in progress." },
      { label: "Ask why {he}'s checking", lvl: 2, smarts: 1, result: "It opened up a good conversation about trust." },
      { label: "Blow up about it", lvl: -9, hap: -3, tone: "danger", result: "It escalated fast. Neither of you slept well." },
    ],
  },
  {
    id: "pa-family-meet", who: ["partner"], age: [18, 60],
    text: "{n} says it's time you both met each other's families properly.",
    choices: [
      { label: "Say yes and plan a dinner", lvl: 9, hap: 3, result: "Your mum loved {him}. Your dad loved {him} more. That was worrying." },
      { label: "Say you need more time", lvl: -3, result: "{n} said {he} understood. {He} was hurt." },
    ],
  },
  {
    id: "pa-anniversary", who: ["partner"], age: [17, 90],
    text: "{n} brings up your anniversary. You'd almost forgotten.",
    choices: [
      { label: "Plan something last-minute and sweet", lvl: 8, hap: 4, money: -50, result: "You got away with it. Narrowly." },
      { label: "Admit you forgot", lvl: 3, result: "{n} let you off. Barely." },
      { label: "Pretend you didn't", lvl: -6, hap: -1, result: "{n} could tell." },
    ],
  },
  {
    id: "pa-cozy", who: ["partner"], age: [14, 90],
    text: "It's raining, you've got nowhere to be, and {n} wants to do absolutely nothing with you.",
    choices: [
      { label: "Blanket fort, obviously", lvl: 8, hap: 6, result: "Best afternoon in weeks." },
      { label: "Movie marathon", lvl: 7, hap: 4, result: "You fell asleep during the second one." },
    ],
  },
  {
    id: "pa-old-love", who: ["partner"], age: [55, 100],
    text: "{n} squeezes your hand while you're watching TV. \"Still glad it was you,\" {he} says.",
    choices: [
      { label: "Say it back", lvl: 8, hap: 6, result: "Decades in, and it still lands." },
      { label: "Squeeze {his} hand", lvl: 6, hap: 4, result: "Some things don't need saying." },
    ],
  },

  // ---------- exes (chit-chat: non-romantic, any age) ----------
  {
    id: "ex-run-in", who: ["ex"],
    text: "You run into {n} at the store. It's a little awkward.",
    choices: [
      { label: "Say hi warmly", lvl: 6, hap: 1, result: "It was awkward for a moment, then surprisingly easy." },
      { label: "Keep it brief and polite", lvl: 1, result: "Neither of you lingered." },
      { label: "Pretend you didn't see {him}", lvl: -3, result: "{n} definitely noticed." },
    ],
  },
  {
    id: "ex-old-memory", who: ["ex"],
    text: "{n} texts a photo from your old favorite place. \"Remember this?\"",
    choices: [
      { label: "Reply with a fond memory", lvl: 7, hap: 2, result: "You both laughed and pretended it wasn't loaded." },
      { label: "Reply \"lol yeah\"", lvl: 1, result: "The conversation fizzled out politely." },
      { label: "Leave it on read", lvl: -4, result: "You could tell it landed." },
    ],
  },
  {
    id: "ex-closure", who: ["ex"],
    text: "{n} says {he}'s been thinking about how things ended. \"I don't want it to stay bad between us.\"",
    choices: [
      { label: "Talk it through", lvl: 8, hap: 3, favor: 3, result: "It was a hard conversation, and a good one." },
      { label: "Say you've moved on", lvl: 1, result: "\"Good,\" {n} said. It sounded like both relief and hurt." },
      { label: "Bring up old grievances", lvl: -8, hap: -2, tone: "danger", result: "It turned into the old argument. Again." },
    ],
  },
  {
    id: "ex-news", who: ["ex"],
    text: "{n} shares some good news about {his} life.",
    choices: [
      { label: "Congratulate {him} sincerely", lvl: 6, hap: 2, result: "{n} thanked you. It meant something." },
      { label: "Say congrats, feel weird", lvl: 2, hap: -1, result: "You meant it. Mostly." },
    ],
  },
  {
    id: "ex-mutual", who: ["ex"],
    text: "A mutual friend brings up {n} and asks if you two are still on good terms.",
    choices: [
      { label: "Say yes, honestly", lvl: 4, result: "It's nice being able to say that." },
      { label: "Say it's complicated", lvl: 0, result: "It always is." },
      { label: "Trash-talk {him}", lvl: -6, hap: 1, tone: "danger", result: "It got back to {n}. Of course it did." },
    ],
  },
  {
    id: "ex-sorry", who: ["ex"],
    text: "{n} apologizes for something from the past. It's out of the blue.",
    choices: [
      { label: "Accept the apology", lvl: 9, hap: 3, favor: 3, result: "A weight lifted off both of you." },
      { label: "Say thank you and leave it there", lvl: 3, result: "Enough was said." },
      { label: "Say it doesn't change anything", lvl: -6, result: "Fair, maybe. But it landed hard." },
    ],
  },
  {
    id: "ex-checkin", who: ["ex"],
    text: "{n} sends a simple message: \"Hey. Just checking you're okay.\"",
    choices: [
      { label: "Say you're doing well", lvl: 5, hap: 2, result: "It ended kindly." },
      { label: "Tell {him} the truth about how you are", lvl: 7, hap: 1, favor: 2, result: "It was the most honest you'd been in months." },
    ],
  },
];
