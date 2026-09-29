import { Scene } from "./types";

// Parents (mother/father), siblings, children and grandchildren.
export const FAMILY_SCENES: Scene[] = [
  // ---------- parents ----------
  {
    id: "par-day", who: ["parent"], age: [5, 12],
    text: "{n} asks how school was today and actually waits for the answer.",
    choices: [
      { label: "Tell {him} everything", lvl: 7, hap: 3, favor: 2, result: "You talked the whole way through dinner. {He} laughed in all the right places." },
      { label: "\"Fine.\"", lvl: -1, result: "{n} nodded and let it go, though {he} looked a little disappointed." },
      { label: "Ask for help with homework", lvl: 5, smarts: 2, result: "{n} sat with you until the math finally clicked." },
    ],
  },
  {
    id: "par-rules", who: ["parent"], age: [13, 17],
    text: "{n} wants to talk about your curfew, and {he} doesn't look like {he}'s going to negotiate.",
    choices: [
      { label: "Argue your case calmly", lvl: 4, smarts: 1, favor: 3, result: "You laid out your reasons. {n} didn't budge much, but respected how you handled it." },
      { label: "Storm off to your room", lvl: -7, hap: -2, result: "The door slam echoed through the house. Dinner was quiet." },
      { label: "Agree to it", lvl: 5, hap: -1, result: "\"Fine.\" {n} looked relieved and a little surprised." },
    ],
  },
  {
    id: "par-worry", who: ["parent"], age: [13, 17],
    text: "{n} says {he}'s been worried about you lately. \"You seem stressed.\"",
    choices: [
      { label: "Open up", lvl: 9, hap: 4, favor: 3, result: "It all came out. {n} listened, hugged you, and made your favorite food." },
      { label: "Deflect with a joke", lvl: 1, result: "{n} smiled but you could tell {he} wasn't fooled." },
      { label: "\"I'm fine, leave it.\"", lvl: -5, result: "{n} pressed {his} lips together and stopped asking." },
    ],
  },
  {
    id: "par-college", who: ["parent"], age: [16, 19],
    text: "{n} brings up what you want to do after school. \"I just want you to be happy,\" {he} says.",
    choices: [
      { label: "Share your real plans", lvl: 8, smarts: 1, hap: 2, result: "{n} asked a hundred questions, then said {he} was proud." },
      { label: "Say you have no idea", lvl: 2, hap: -1, result: "\"That's okay,\" {n} said. \"Nobody does at your age.\"" },
      { label: "Say it's your life", lvl: -6, result: "{n} went quiet. \"You're right. I just care.\"" },
    ],
  },
  {
    id: "par-tips", who: ["parent"], age: [18, 30],
    text: "{n} slips you a folded note with a recipe on it. \"For when you're living alone,\" {he} says.",
    choices: [
      { label: "Hug {him}", lvl: 8, hap: 4, result: "You made the recipe that weekend. It was almost as good as {his}." },
      { label: "Tease {him} about it", lvl: 4, hap: 2, result: "{n} laughed and swatted your arm." },
      { label: "Leave it on the counter", lvl: -2, result: "It was still there weeks later." },
    ],
  },
  {
    id: "par-advice", who: ["parent"], age: [20, 45],
    text: "{n} gives you unsolicited advice about your career. Again.",
    choices: [
      { label: "Listen properly", lvl: 6, smarts: 1, favor: 2, result: "{n} was right about one thing, at least. You told {him} so." },
      { label: "Nod and change the subject", lvl: 1, result: "The subject changed. {n} sighed." },
      { label: "Snap at {him}", lvl: -8, hap: -2, tone: "danger", result: "You regretted it as soon as it left your mouth. {n} said nothing." },
    ],
  },
  {
    id: "par-memory", who: ["parent"], age: [18, 80],
    text: "{n} pulls out an old photo album and starts telling stories about when you were little.",
    choices: [
      { label: "Ask for more stories", lvl: 8, hap: 5, result: "You laughed until you cried at the one about the bathtub incident." },
      { label: "Get embarrassed and stop {him}", lvl: 3, hap: 1, result: "{n} put the album away, grinning." },
    ],
  },
  {
    id: "par-health", who: ["parent"], age: [30, 80], theirAge: [55, 100],
    text: "{n} mentions a doctor's appointment like it's nothing. It sounds like it's something.",
    choices: [
      { label: "Insist on going with {him}", lvl: 9, hap: -1, favor: 4, result: "{n} pretended to be annoyed. {He} held your hand in the waiting room." },
      { label: "Ask {him} to keep you updated", lvl: 3, result: "{n} promised {he} would. You believed {him}, mostly." },
      { label: "Change the subject", lvl: -4, result: "You both pretended it hadn't come up." },
    ],
  },
  {
    id: "par-help", who: ["parent"], age: [25, 80], theirAge: [55, 100],
    text: "{n} can't work the new phone {he} bought and calls you, exasperated.",
    choices: [
      { label: "Walk {him} through it patiently", lvl: 7, hap: 2, result: "It took an hour. {n} said it was the best call of {his} week." },
      { label: "Do it for {him} the next visit", lvl: 4, result: "{n} was grateful and made you stay for dinner." },
      { label: "Send a link to a tutorial", lvl: -3, result: "\"Thanks,\" {n} said, in the tone that meant it wasn't." },
    ],
  },
  {
    id: "par-tradition", who: ["parent"], age: [10, 70],
    text: "{n} wants to carry on a family tradition and needs you there.",
    choices: [
      { label: "Show up early to help", lvl: 8, hap: 4, favor: 2, result: "The whole day smelled like your childhood." },
      { label: "Show up late", lvl: 1, result: "{n} saved you a plate anyway." },
      { label: "Skip it", lvl: -7, hap: -2, result: "{n} said it was fine. It didn't sound fine." },
    ],
  },
  {
    id: "par-money-talk", who: ["parent"], age: [24, 60],
    text: "{n} asks, gently, whether you're managing okay with money.",
    choices: [
      { label: "Be honest about it", lvl: 6, hap: 1, favor: 3, result: "{n} gave you a few practical tips and didn't lecture once." },
      { label: "Say you're doing great", lvl: 1, result: "{n} raised an eyebrow but let it be." },
      { label: "Get defensive", lvl: -5, result: "The conversation ended a bit colder than it started." },
    ],
  },
  {
    id: "par-birthday", who: ["parent"], age: [6, 90],
    text: "{n} calls just to say {he}'s proud of the person you're becoming.",
    choices: [
      { label: "Say it back", lvl: 9, hap: 6, result: "You both went a little quiet after that. Good quiet." },
      { label: "Laugh it off", lvl: 3, hap: 2, result: "\"I mean it,\" {n} said." },
    ],
  },
  {
    id: "par-embarrass", who: ["parent"], age: [11, 16],
    text: "{n} shows up at school in the most embarrassing outfit imaginable.",
    choices: [
      { label: "Own it and wave", lvl: 6, hap: 3, looks: 1, result: "Your friends thought it was hilarious, in a nice way." },
      { label: "Pretend you don't know {him}", lvl: -6, result: "{n} saw. Neither of you mentioned it." },
      { label: "Ask {him} to please never do that again", lvl: 0, result: "{n} promised. {He} lied." },
    ],
  },
  {
    id: "par-tv", who: ["parent"], age: [4, 14],
    text: "{n} sits next to you and offers to watch your favorite show together.",
    choices: [
      { label: "Squish in close", lvl: 7, hap: 4, result: "{n} knew all the characters' names by the end." },
      { label: "Say you'd rather watch alone", lvl: -3, result: "{n} smiled tightly and left." },
    ],
  },
  {
    id: "par-story", who: ["parent"], age: [30, 85],
    text: "{n} tells you a story about your grandparents you've never heard before.",
    choices: [
      { label: "Ask what {he} learned from it", lvl: 8, smarts: 1, hap: 3, result: "{n} thought about it for a while, and you both learned something." },
      { label: "Just listen", lvl: 6, hap: 3, result: "You let the story wash over you. It was a good one." },
    ],
  },
  {
    id: "par-apology", who: ["parent"], age: [22, 80],
    text: "{n} says something you didn't expect: \"I'm sorry for how I handled things when you were younger.\"",
    choices: [
      { label: "Forgive {him}", lvl: 12, hap: 5, favor: 4, result: "Something old and heavy eased between you." },
      { label: "Say it still hurts", lvl: 4, hap: -1, result: "{n} nodded. \"That's fair.\" It wasn't a fix, but it was something." },
      { label: "Say it's too late", lvl: -10, hap: -3, tone: "danger", result: "{n} looked like {he} expected it. Neither of you said any more." },
    ],
  },
  {
    id: "par-visit-cook", who: ["parent"], age: [18, 60],
    text: "{n} insists on cooking you a huge meal when you visit.",
    choices: [
      { label: "Eat everything", lvl: 6, hap: 3, health: -1, result: "You left with leftovers for the week." },
      { label: "Help in the kitchen", lvl: 8, hap: 3, result: "{n} taught you the trick you'd been missing for years." },
    ],
  },
  {
    id: "par-driving", who: ["parent"], age: [15, 18],
    text: "{n} offers to teach you to drive in an empty parking lot.",
    choices: [
      { label: "Take the wheel", lvl: 7, smarts: 1, hap: 3, result: "You stalled twice, then got it. {n} clapped." },
      { label: "Wait until you're older", lvl: 0, result: "{n} shrugged. \"Whenever you're ready.\"" },
    ],
  },
  {
    id: "par-holiday", who: ["parent"], age: [10, 85],
    text: "It's a busy season, and {n} asks you where you're spending the holidays.",
    choices: [
      { label: "Invite {him} to yours", lvl: 8, hap: 3, result: "{n} arrived with more food than any table could hold." },
      { label: "Say you're going to visit", lvl: 6, hap: 2, result: "You made plans. It's good to have plans." },
      { label: "Say you're busy", lvl: -5, result: "\"Of course,\" {n} said. \"Whenever.\"" },
    ],
  },

  // ---------- siblings ----------
  {
    id: "sib-game", who: ["sibling"], age: [4, 12],
    text: "{n} wants to play a game and won't take no for an answer.",
    choices: [
      { label: "Play it", lvl: 7, hap: 3, result: "You played until it got dark. {n} won. Barely." },
      { label: "Let {him} win", lvl: 5, hap: 1, result: "{n} was thrilled. You pretended not to notice {him} cheating." },
      { label: "Say no and go read", lvl: -4, result: "{n} sulked in the doorway for a good five minutes." },
    ],
  },
  {
    id: "sib-secret", who: ["sibling"], age: [8, 17],
    text: "{n} tells you a secret and makes you promise not to tell anyone.",
    choices: [
      { label: "Promise", lvl: 8, favor: 4, result: "You both kept it. It's bonded you." },
      { label: "Tease {him} about it", lvl: -3, hap: 1, result: "{n} turned red and threw a pillow." },
      { label: "Threaten to tell", lvl: -8, tone: "danger", result: "{n} hasn't fully trusted you since." },
    ],
  },
  {
    id: "sib-borrow", who: ["sibling"], age: [10, 30],
    text: "{n} borrowed something of yours without asking. It came back... changed.",
    choices: [
      { label: "Let it go", lvl: 4, result: "{n} owed you one and both of you knew it." },
      { label: "Confront {him}", lvl: -3, hap: 1, result: "You argued for ten minutes and ended up laughing." },
      { label: "Take something of {his} in return", lvl: -1, hap: 2, result: "It became a whole thing. Eventually it got funny." },
    ],
  },
  {
    id: "sib-late-night", who: ["sibling"], age: [12, 40],
    text: "{n} texts you at midnight: \"you awake?\"",
    choices: [
      { label: "Call {him} right away", lvl: 9, hap: 2, favor: 3, result: "You talked until you both fell asleep on the phone." },
      { label: "Reply in the morning", lvl: 2, result: "\"lol nvm,\" {n} wrote back." },
    ],
  },
  {
    id: "sib-competition", who: ["sibling"], age: [10, 30],
    text: "{n} beat you at something you were supposed to be better at, and is being insufferable about it.",
    choices: [
      { label: "Congratulate {him} honestly", lvl: 5, hap: 1, result: "{n} was so surprised, {he} stopped gloating." },
      { label: "Demand a rematch", lvl: 4, hap: 3, result: "The rematch went on all afternoon." },
      { label: "Sulk", lvl: -4, hap: -2, result: "You sulked. {n} got worse. It was a whole thing." },
    ],
  },
  {
    id: "sib-advice", who: ["sibling"], age: [18, 60],
    text: "{n} asks for your honest opinion on a big life decision.",
    choices: [
      { label: "Tell the truth", lvl: 7, smarts: 1, favor: 3, result: "It wasn't what {he} hoped to hear, but {he} thanked you for it." },
      { label: "Just support whatever {he} picks", lvl: 6, hap: 2, result: "{n} needed that more than advice." },
      { label: "Tell {him} what {he} wants to hear", lvl: 2, result: "{n} left happy. You hope it works out." },
    ],
  },
  {
    id: "sib-memory", who: ["sibling"], age: [15, 80],
    text: "You and {n} end up laughing about a childhood memory only the two of you remember.",
    choices: [
      { label: "Dig up more memories", lvl: 8, hap: 5, result: "Nobody else gets those jokes. That's the point." },
      { label: "Say you should do this more often", lvl: 6, hap: 3, favor: 2, result: "You both meant it. You're going to have to actually do it." },
    ],
  },
  {
    id: "sib-move", who: ["sibling"], age: [20, 60],
    text: "{n} needs help moving apartments this weekend.",
    choices: [
      { label: "Show up with a truck", lvl: 9, hap: 2, health: -1, favor: 4, result: "Your back hurt for days. {n} owes you dinner, at least." },
      { label: "Offer to pay for movers", lvl: 4, money: -200, result: "{n} was relieved. Movers are underrated." },
      { label: "Say you're busy", lvl: -6, result: "{n} did it alone with a friend. You heard about it later." },
    ],
  },
  {
    id: "sib-teasing", who: ["sibling"], age: [6, 16],
    text: "{n} is teasing you in front of {his} friends.",
    choices: [
      { label: "Give it right back", lvl: 2, hap: 2, result: "It turned into a roast battle. The friends were on your side." },
      { label: "Tell a parent", lvl: -4, result: "{n} got in trouble and was extremely annoyed." },
      { label: "Ignore {him}", lvl: 0, result: "{n} eventually got bored." },
    ],
  },
  {
    id: "sib-wedding-talk", who: ["sibling"], age: [22, 60],
    text: "{n} has big news and asks if you'll help with the planning.",
    choices: [
      { label: "Say yes, of course", lvl: 8, hap: 4, favor: 3, result: "You were in the spreadsheet by morning." },
      { label: "Say you'll be there but can't help", lvl: 3, result: "{n} understood. Mostly." },
    ],
  },
  {
    id: "sib-cheer", who: ["sibling"], age: [7, 30],
    text: "{n} looks down and won't say why.",
    choices: [
      { label: "Sit with {him} until {he} talks", lvl: 8, hap: 2, favor: 3, result: "It took a while, but {he} told you. You made it a little lighter." },
      { label: "Try to cheer {him} up with a joke", lvl: 4, hap: 2, result: "It half worked." },
      { label: "Give {him} space", lvl: 1, result: "{n} said thanks the next day." },
    ],
  },
  {
    id: "sib-newborn", who: ["sibling"], age: [22, 50],
    text: "{n} hands you the baby. \"Just hold {him} for a second.\"",
    choices: [
      { label: "Hold the baby", lvl: 6, hap: 6, result: "You did not want to hand the baby back." },
      { label: "Panic slightly", lvl: 4, hap: 2, result: "You held the baby like a delicate Ming vase. {n} took a photo." },
    ],
  },

  // ---------- children ----------
  {
    id: "kid-toddler", who: ["child"], theirAge: [1, 4],
    text: "{n} has decided today is the day to insist on doing everything by {himself}.",
    choices: [
      { label: "Let {him} try", lvl: 6, hap: 2, result: "It took forty-five minutes to put on one shoe. {He} was so proud." },
      { label: "Do it quickly for {him}", lvl: 1, result: "You made it on time. {n} was furious." },
      { label: "Make it a game", lvl: 8, hap: 3, result: "{n} shrieked with laughter the whole way out the door." },
    ],
  },
  {
    id: "kid-why", who: ["child"], theirAge: [3, 7],
    text: "{n} asks \"why\" fourteen times in a row.",
    choices: [
      { label: "Answer every one", lvl: 7, smarts: 1, result: "By the end you'd invented a new theory of thunder." },
      { label: "Say \"because I said so\"", lvl: -3, result: "{n} sulked. You felt like a cliché." },
      { label: "Ask {him} what {he} thinks", lvl: 8, hap: 2, result: "{n}'s theory about clouds was surprisingly good." },
    ],
  },
  {
    id: "kid-drawing", who: ["child"], theirAge: [3, 10],
    text: "{n} proudly presents a drawing. It could be a horse or a cloud.",
    choices: [
      { label: "Ask {him} to tell you about it", lvl: 8, hap: 3, result: "It was you. And a dragon. {He} said you were friends." },
      { label: "Put it on the fridge", lvl: 7, hap: 2, result: "It's been there for months. {n} checks it daily." },
      { label: "Praise it vaguely", lvl: 2, result: "{n} could tell you weren't looking. {He} said nothing." },
    ],
  },
  {
    id: "kid-bedtime", who: ["child"], theirAge: [2, 9],
    text: "{n} won't go to sleep and wants you to read one more story.",
    choices: [
      { label: "One more, then lights out", lvl: 6, hap: 2, result: "It was three more. Nobody's counting." },
      { label: "Stick to the routine", lvl: 2, result: "{n} was grumpy about it, but slept fine." },
      { label: "Make up a story on the spot", lvl: 8, hap: 3, result: "It had a dragon and a very brave dog." },
    ],
  },
  {
    id: "kid-school", who: ["child"], theirAge: [6, 12],
    text: "{n} came home upset after a rough day at school.",
    choices: [
      { label: "Listen and hug {him}", lvl: 9, hap: 2, favor: 3, result: "{n} cried for a minute and felt better afterwards." },
      { label: "Offer to talk to the teacher", lvl: 5, result: "It ended up not being necessary, but {he} appreciated the offer." },
      { label: "Tell {him} to toughen up", lvl: -8, hap: -2, tone: "danger", result: "{n} stopped telling you things for a while." },
    ],
  },
  {
    id: "kid-project", who: ["child"], theirAge: [6, 13],
    text: "{n} has a school project due tomorrow and hasn't started.",
    choices: [
      { label: "Help {him} through the night", lvl: 8, smarts: 1, hap: -1, result: "It got done at 11pm. {n} got a B+." },
      { label: "Let {him} deal with the consequences", lvl: 2, result: "{n} learned an important lesson about deadlines." },
      { label: "Do most of it yourself", lvl: 3, hap: -1, result: "It looked professionally done. That was a mistake." },
    ],
  },
  {
    id: "kid-first-day", who: ["child"], theirAge: [5, 7],
    text: "{n} is nervous about a big first: first day of school, first sleepover, first anything.",
    choices: [
      { label: "Reassure {him}", lvl: 8, hap: 3, result: "{n} went in with a shaky smile and came out with a big one." },
      { label: "Tell {him} about your first time", lvl: 7, hap: 2, result: "{n} was fascinated you'd ever been nervous." },
    ],
  },
  {
    id: "kid-teen-talk", who: ["child"], theirAge: [13, 17],
    text: "{n} says: \"I need to tell you something and I need you not to freak out.\"",
    choices: [
      { label: "Promise to stay calm and listen", lvl: 9, hap: 2, favor: 4, result: "It wasn't as bad as you'd braced for. You handled it well." },
      { label: "Say you'll always support {him}", lvl: 8, hap: 3, result: "{n} let out a huge breath. \"Okay. Thanks.\"" },
      { label: "Demand to know right now", lvl: -5, result: "{n} said \"never mind\" and left the room." },
    ],
  },
  {
    id: "kid-music", who: ["child"], theirAge: [10, 17],
    text: "{n} wants you to listen to a song they love. It's loud.",
    choices: [
      { label: "Listen properly", lvl: 8, hap: 3, result: "You didn't get it, but you got {him}." },
      { label: "Ask {him} to turn it down", lvl: -2, result: "\"You never get anything,\" {n} sighed." },
      { label: "Show {him} one of yours", lvl: 6, hap: 2, result: "{n} rolled {his} eyes. And then asked for the name of the band." },
    ],
  },
  {
    id: "kid-adult", who: ["child"], theirAge: [18, 60],
    text: "{n} calls to catch up. {He}'s busy, but wanted to hear your voice.",
    choices: [
      { label: "Tell {him} you're proud of {him}", lvl: 9, hap: 5, result: "{n} was quiet for a second. \"Thanks. I needed that.\"" },
      { label: "Ask about {his} life properly", lvl: 7, hap: 3, result: "It was the longest call you've had in ages." },
      { label: "Give {him} advice", lvl: 2, result: "{n} said \"I know, I know\" three times." },
    ],
  },
  {
    id: "kid-scraped-knee", who: ["child"], theirAge: [3, 9],
    text: "{n} tumbles off a bike and shows you a scraped knee with great drama.",
    choices: [
      { label: "Kiss it better and add a bandage", lvl: 7, hap: 2, result: "{n} recovered instantly and rode off." },
      { label: "Make {him} check how bad it really is", lvl: 3, smarts: 0, result: "Barely a scratch. {n} pretended not to be relieved." },
    ],
  },
  {
    id: "kid-thanks", who: ["child"], theirAge: [12, 40],
    text: "{n} thanks you for something you did years ago, something you'd forgotten.",
    choices: [
      { label: "Say you're glad it helped", lvl: 8, hap: 5, result: "You didn't realize you'd mattered that much." },
      { label: "Say you don't remember", lvl: 3, hap: 1, result: "\"That's the best part,\" {n} said. \"It was just who you are.\"" },
    ],
  },

  // ---------- grandchildren ----------
  {
    id: "gk-visit", who: ["grandchild"],
    text: "{n} runs in with a fistful of dandelions and calls them a bouquet.",
    choices: [
      { label: "Put them in a jar of water", lvl: 8, hap: 5, result: "They lasted two days. The memory will last longer." },
      { label: "Ask {him} to teach you a game", lvl: 8, hap: 4, result: "You lost badly. {n} made you play again." },
    ],
  },
  {
    id: "gk-story", who: ["grandchild"],
    text: "{n} climbs into your lap and asks for a story from when you were little.",
    choices: [
      { label: "Tell a favorite childhood story", lvl: 9, hap: 5, result: "{n} was fascinated you were ever small." },
      { label: "Make up a tall tale", lvl: 8, hap: 4, result: "By the end {n} was sure you'd fought a bear." },
    ],
  },
];
