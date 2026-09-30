import { Personality } from "../types";

// The interview question bank. Every question has 3-4 answers with a hidden
// base score (-3 .. +3). An answer can also lean on a personality trait (its
// score moves with how strong that trait is in *you*), be a joke ("f" - it
// lands or dies depending on the interviewer's sense of humour) or a lie
// ("l" - risky: it may be seen through).
//
//   cat: genuine   - real questions any interviewer would ask
//        situational - "what would you do if..."
//        curveball - the strange ones ("how many golf balls...")
//        bs        - straight nonsense, delivered with a straight face
//        first     - simpler questions for first jobs and teens

export type Cat = "genuine" | "situational" | "curveball" | "bs" | "first";
export type Flag = "f" | "l";
export type Ans = [text: string, score: number, traits?: Partial<Record<keyof Personality, number>>, flag?: Flag];
export type Question = {
  id: string;
  cat: Cat;
  text: string;
  answers: Ans[];
  minAge?: number;
  maxAge?: number; // teen-only questions
  fields?: string[]; // only asked for jobs in these fields
};

const q = (id: string, cat: Cat, text: string, answers: Ans[], extra: Partial<Question> = {}): Question => ({ id, cat, text, answers, ...extra });

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- genuine
  q("g-tell-me", "genuine", "So - tell me a little about yourself.", [
    ["Give a short, honest summary: where you're from, what you've done, what you want next.", 3, { c: 1 }],
    ["Ramble through your whole life story, including primary school.", -1, { e: 0.5 }],
    ["\"Well... what would you like to know?\"", -2, { n: -1 }],
    ["Focus on what you can do for them, with one real example.", 3, { c: 1 }],
  ]),
  q("g-why-here", "genuine", "Why do you want to work here?", [
    ["You researched them and can name what you like about the place.", 3, { c: 1 }],
    ["\"It's close to my house.\"", -1],
    ["\"I need the money.\" - honestly.", 0, { a: 0.5 }],
    ["Say you admire the work and how it fits where you're headed.", 2],
  ]),
  q("g-strength", "genuine", "What would you say is your biggest strength?", [
    ["Name a real strength and back it up with a quick example.", 3, { c: 1 }],
    ["\"I'm a perfectionist.\"", -1],
    ["\"Honestly? Everything.\"", -2, { a: -1 }],
    ["Say you learn fast and give an example of picking something up quickly.", 2, { o: 1 }],
  ]),
  q("g-weakness", "genuine", "And your biggest weakness?", [
    ["Name a real one and explain what you do about it.", 3, { a: 1 }],
    ["\"I work too hard.\"", -1],
    ["\"I don't really have any.\"", -3],
    ["Admit you get nervous speaking up, and what you're doing to fix it.", 2, { n: 1 }],
  ]),
  q("g-five-years", "genuine", "Where do you see yourself in five years?", [
    ["A realistic path: growing here and learning skills that matter.", 3, { c: 1 }],
    ["\"Running this place, obviously.\"", -1, { a: -0.5 }, "f"],
    ["\"Honestly, I have no idea.\"", -1, { o: 0.5 }],
    ["\"Doing what I'm good at, somewhere I'm valued - hopefully here.\"", 2],
  ]),
  q("g-conflict", "genuine", "Tell me about a time you had a disagreement with someone. How did you handle it?", [
    ["Describe listening to their side and finding a middle ground.", 3, { a: 1 }],
    ["Say you've never really had a disagreement.", -2],
    ["Describe how you won the argument.", -2, { a: -1 }],
    ["Say you stayed calm and asked someone neutral to help settle it.", 2, { c: 0.5 }],
  ]),
  q("g-proud", "genuine", "What's something you're really proud of?", [
    ["Talk about something you worked hard on and stuck with.", 3, { c: 1 }],
    ["Talk about something you did for someone else.", 3, { a: 1 }],
    ["\"Nothing really comes to mind.\"", -2, { n: 1 }],
    ["Brag about something that mostly involved luck.", -1],
  ]),
  q("g-fail", "genuine", "Tell me about a time you failed.", [
    ["Describe a real failure, what you learned and what you'd do differently.", 3, { c: 0.5 }],
    ["\"I don't fail.\"", -3, { a: -1 }],
    ["Blame the team you were on.", -2],
    ["Describe a small mistake and how you fixed it fast.", 2],
  ]),
  q("g-pressure", "genuine", "How do you handle pressure?", [
    ["Say you prioritise, breathe, and take one thing at a time - and give an example.", 3, { n: -1 }],
    ["\"I thrive under pressure!\" (You've never really tested it.)", -1, { n: 1 }, "l"],
    ["Admit you feel it, but push through with a list.", 2, { c: 1 }],
    ["\"I panic, but quietly.\"", -1, { n: 1 }, "f"],
  ]),
  q("g-team", "genuine", "Do you prefer working alone or in a team?", [
    ["Say both have a place and you adapt to what the task needs.", 3],
    ["\"Alone. People slow me down.\"", -2, { e: -0.5, a: -1 }],
    ["\"Team, always - I'm terrible alone.\"", 0, { e: 1 }],
    ["Say you like teams but need quiet time to focus.", 2],
  ]),
  q("g-leave-last", "genuine", "Why did you leave your last job (or, if you're new to this, what have you been up to)?", [
    ["Keep it honest and positive: ready for a new challenge.", 3],
    ["Complain about your last boss.", -3, { a: -1 }],
    ["Say you were bored and things weren't working out.", -1],
    ["Explain that circumstances changed and you learned a lot.", 2],
  ]),
  q("g-salary", "genuine", "What kind of salary are you looking for?", [
    ["Give a reasonable range based on what you've researched.", 3, { c: 1 }],
    ["\"Whatever you're offering!\"", -1, { a: 1 }],
    ["Name a number far above what this job pays.", -2],
    ["Ask what the range is first, then respond.", 2],
  ]),
  q("g-feedback", "genuine", "How do you take criticism?", [
    ["Say you listen, ask questions, and use it.", 3, { a: 1 }],
    ["\"I don't take it personally... much.\"", 0, { n: 1 }, "f"],
    ["\"It depends who's saying it.\"", -1, { a: -0.5 }],
    ["Give an example where feedback made you better.", 3],
  ]),
  q("g-motivate", "genuine", "What motivates you to do good work?", [
    ["Say solving problems and being trusted with something that matters.", 3],
    ["Say you like doing a job well and going home proud of it.", 2, { c: 1 }],
    ["\"Money, mostly.\"", 0],
    ["\"Fear of my manager.\"", -2, {}, "f"],
  ]),
  q("g-hobby", "genuine", "What do you do outside of work or school?", [
    ["Share a real hobby and what it taught you.", 3, { o: 1 }],
    ["Mention volunteering or helping out.", 3, { a: 1 }],
    ["\"Mostly scrolling my phone.\"", -1, { c: -1 }],
    ["\"I keep busy.\"", -1],
  ]),
  q("g-schedule", "genuine", "Can you be flexible with your hours?", [
    ["Say yes within reason, and explain your availability clearly.", 3, { c: 1 }],
    ["\"I can do anything, anytime.\" (You cannot.)", -1, {}, "l"],
    ["\"Only weekdays, and no mornings.\"", -2],
    ["Ask about the shift pattern, then commit to what works.", 2],
  ]),
  q("g-initiative", "genuine", "Tell me about a time you took the initiative.", [
    ["Describe spotting a problem and fixing it without being asked.", 3, { c: 1, o: 0.5 }],
    ["Say you usually wait to be told.", -2],
    ["Describe a project you started and finished.", 3, { c: 1 }],
    ["\"I once reorganised the fridge.\"", 0, {}, "f"],
  ]),
  q("g-deadline", "genuine", "Describe a time you had to meet a tight deadline.", [
    ["Describe planning backwards, asking for help early, and delivering.", 3, { c: 1 }],
    ["Say you pulled an all-nighter and barely made it.", 0, { n: 0.5 }],
    ["Say you missed it but had a great excuse.", -2],
    ["Say you negotiated a sensible extension and delivered quality.", 2, { a: 1 }],
  ]),
  q("g-lead", "genuine", "Have you ever led a group? What was that like?", [
    ["Describe leading a project or team and what you learned about people.", 3, { e: 1, a: 1 }],
    ["Say you'd rather not lead.", -1, { e: -0.5 }],
    ["Say you 'naturally' take charge.", -1, { a: -1 }],
    ["Describe stepping in when nobody else would.", 2],
  ]),
  q("g-learn", "genuine", "How do you go about learning something new?", [
    ["Say you break it down, practise, and ask people who know more.", 3, { o: 1 }],
    ["\"I watch videos until I know enough to be dangerous.\"", 1, {}, "f"],
    ["Say you just dive in and figure it out.", 1, { o: 1 }],
    ["\"I usually don't.\"", -3],
  ]),
  q("g-customer", "genuine", "What does good customer service mean to you?", [
    ["Listening first, then fixing the problem or finding someone who can.", 3, { a: 1 }],
    ["\"The customer is always right.\"", 1],
    ["\"Avoiding customers.\"", -2, {}, "f"],
    ["Being patient and making people feel heard.", 3, { a: 1 }],
  ]),
  q("g-integrity", "genuine", "Tell me about a time you had to do the right thing when it was hard.", [
    ["Describe owning up to a mistake even though nobody would have found out.", 3, { a: 1 }],
    ["Say you can't think of a time.", -2],
    ["Describe reporting something that wasn't right.", 3],
    ["Describe a time you kept a promise that cost you.", 2],
  ]),
  q("g-why-you", "genuine", "Why should we hire you over the other candidates?", [
    ["Connect your strengths directly to what the job needs.", 3, { c: 1 }],
    ["\"Because I'm better than them.\"", -2, { a: -1 }],
    ["Say you'll work hard, be reliable and never stop learning.", 2],
    ["\"I don't know the other candidates.\"", 0, {}, "f"],
  ]),
  q("g-questions", "genuine", "Do you have any questions for us?", [
    ["Ask something thoughtful about the team and how success is measured.", 3, { o: 1 }],
    ["\"When do I get paid?\"", -1],
    ["\"No, I think that's everything.\"", -1],
    ["Ask what a great first month would look like.", 3],
  ]),
  q("g-prioritise", "genuine", "How do you decide what to do first when everything feels urgent?", [
    ["Say you sort by deadline and impact, then check in if you're unsure.", 3, { c: 1 }],
    ["Say you do the easy things first to build momentum.", 1],
    ["\"I freeze, then panic-clean.\"", -1, { n: 1 }, "f"],
    ["Say you ask your manager what matters most.", 2],
  ]),
  q("g-mistake-boss", "genuine", "What would you do if you found out your boss was wrong about something?", [
    ["Bring it up privately and respectfully, with evidence.", 3, { a: 1 }],
    ["Correct them in the middle of a meeting.", -2, { a: -1 }],
    ["Say nothing and let it play out.", -1],
    ["Ask a question that helps them notice it themselves.", 3, { o: 1 }],
  ]),
  q("g-team-weak", "genuine", "What do you do when a teammate isn't pulling their weight?", [
    ["Talk to them first, offer help, and only escalate if it continues.", 3, { a: 1 }],
    ["Do their work and quietly resent them.", -1],
    ["Report them immediately.", -1],
    ["Bring it to the group in a way that isn't blaming.", 2],
  ]),
  q("g-change", "genuine", "How do you handle change at work?", [
    ["Say you ask why it's happening and look for what you can control.", 3, { o: 1 }],
    ["\"Not well, honestly.\"", -1, { n: 1 }],
    ["Say you enjoy the shake-up.", 2, { o: 1 }],
    ["\"I complain about it for about a week, then adapt.\"", 1, {}, "f"],
  ]),
  q("g-remote", "genuine", "Is there anything that might stop you from coming in reliably?", [
    ["Give a clear, honest answer about transport, school or family commitments.", 3, { c: 1 }],
    ["\"Nope, I'm never sick.\"", -1, {}, "l"],
    ["Mention you sometimes oversleep.", -2, { c: -1 }],
    ["Explain how you plan around unexpected problems.", 2],
  ]),
  q("g-worst-boss", "genuine", "Describe your ideal manager.", [
    ["Someone clear about expectations who gives honest feedback.", 3],
    ["Someone who leaves you completely alone.", -1],
    ["Someone who buys lunch.", 0, {}, "f"],
    ["Someone who teaches and trusts you.", 2],
  ]),
  q("g-gap", "genuine", "There's a gap in your history. What were you doing?", [
    ["Explain honestly and describe what you learned in the time.", 3],
    ["Get defensive.", -2, { n: 1 }],
    ["Make up something impressive.", -2, {}, "l"],
    ["Say you needed a break and you're ready now.", 1],
  ]),
  q("g-relocate", "genuine", "How would your friends describe you?", [
    ["\"Reliable, a bit stubborn, always the one who remembers birthdays.\"", 3, { a: 1 }],
    ["\"Fun, mostly.\"", 1, { e: 1 }],
    ["\"I don't think they'd describe me.\"", -1, { e: -1 }],
    ["\"The one who's always on time and slightly annoyingly organised.\"", 2, { c: 1 }],
  ]),

  // ---------------------------------------------------------------- situational
  q("s-angry-customer", "situational", "A customer is shouting at you over something that wasn't your fault. What do you do?", [
    ["Stay calm, let them finish, apologise for the experience and find a fix.", 3, { a: 1, n: -1 }],
    ["Shout back - respect goes both ways.", -3, { a: -1 }],
    ["Hand them to a manager immediately.", 0],
    ["Explain calmly that it wasn't your fault.", -1],
  ]),
  q("s-late", "situational", "You realise you're going to be late to a shift. What do you do?", [
    ["Call ahead as soon as you know and give an honest reason.", 3, { c: 1 }],
    ["Hope nobody notices.", -2],
    ["Text a friend to cover for you.", 0],
    ["Arrive as fast as you can and apologise properly.", 2],
  ]),
  q("s-mistake", "situational", "You made a mistake that cost the company money. What now?", [
    ["Tell your manager straight away, with a plan to fix it.", 3, { a: 1 }],
    ["Quietly fix it and hope nobody asks.", -1],
    ["Blame the system.", -3],
    ["Own it, learn from it, and set up a check so it can't repeat.", 3, { c: 1 }],
  ]),
  q("s-coworker-cry", "situational", "A coworker is crying in the break room. What do you do?", [
    ["Check in gently and offer to listen or get them some space.", 3, { a: 1 }],
    ["Pretend you didn't see.", -1],
    ["Tell the manager.", 0],
    ["Offer a tissue and ask if they want to talk.", 3, { a: 1 }],
  ]),
  q("s-stolen", "situational", "You see a coworker taking something that isn't theirs. What do you do?", [
    ["Speak to them or report it - stealing isn't okay.", 3, { a: 0.5 }],
    ["Mind your own business.", -1],
    ["Ask for a cut.", -3, {}, "f"],
    ["Note it down and tell a manager privately.", 2, { c: 1 }],
  ]),
  q("s-short-staffed", "situational", "The team is short-staffed and it's near closing. A customer walks in with a big request. What do you do?", [
    ["Greet them, be honest about the wait, and do what you can.", 3, { a: 1 }],
    ["Say we're closed.", -2],
    ["Pull in a colleague and share the load.", 2],
    ["Rush and hope for the best.", -1],
  ]),
  q("s-unclear", "situational", "Your instructions aren't clear. What do you do?", [
    ["Ask questions until you're sure, and write it down.", 3, { c: 1 }],
    ["Guess and see what happens.", -2],
    ["Wait until someone notices.", -2],
    ["Check with a coworker who's done it before.", 2],
  ]),
  q("s-two-bosses", "situational", "Two managers give you opposite instructions. What do you do?", [
    ["Explain the clash to both and ask them to agree what matters most.", 3, { a: 1 }],
    ["Do what the louder one says.", -1],
    ["Do neither and wait.", -2],
    ["Pick the one you like better.", -2],
  ]),
  q("s-birthday", "situational", "It's your friend's birthday party tonight but they need you to cover a shift. What do you do?", [
    ["Say you'll work if you're really needed, and let your friend know why.", 3, { c: 1 }],
    ["Skip the shift and don't tell anyone.", -3],
    ["Call in sick.", -3, {}, "l"],
    ["Ask if someone else can swap, offering to take theirs later.", 3, { a: 1 }],
  ]),
  q("s-rumour", "situational", "You hear a rumour about a coworker. What do you do?", [
    ["Ignore it - if you have a concern, talk to them.", 3, { a: 1 }],
    ["Pass it on. Gently.", -2, { a: -1 }],
    ["Ask them directly whether it's true.", 0],
    ["Tell nobody but think about it all day.", -1, { n: 1 }],
  ]),
  q("s-lost-wallet", "situational", "You find a wallet stuffed with cash on the shop floor. What do you do?", [
    ["Hand it to a manager and note what was in it.", 3, { a: 1 }],
    ["Keep the cash and hand in the wallet.", -3],
    ["Leave it where it is.", -1],
    ["Try to find the owner, then turn it in.", 3],
  ]),
  q("s-overtime", "situational", "A big order is due and the team needs to stay late. You'd planned to see your family. What do you do?", [
    ["Stay for the crunch and agree time back afterwards.", 3, { c: 1 }],
    ["Leave right on time - not your problem.", -2],
    ["Say yes, then look miserable.", -1, {}, "f"],
    ["Explain your commitment and offer to help another way.", 2],
  ]),
  q("s-new-tool", "situational", "You're handed software you've never used and told to have a report done by tomorrow. What do you do?", [
    ["Learn the essentials, ask a colleague, and deliver something solid.", 3, { o: 1 }],
    ["Say it's impossible.", -2],
    ["Stay up all night and hope.", 0, { n: 0.5 }],
    ["Ask what can be simplified.", 2],
  ]),
  q("s-mean-coworker", "situational", "A coworker keeps making sarcastic comments about you. What do you do?", [
    ["Speak to them privately and calmly.", 3, { a: 1 }],
    ["Get revenge quietly.", -3, { a: -1 }],
    ["Ignore it and hope it stops.", 0],
    ["Laugh it off and change the subject.", 1, { e: 1 }],
  ]),
  q("s-hurt", "situational", "A coworker gets hurt on the job. What do you do?", [
    ["Get help, keep them calm, and follow the safety procedure.", 3, { c: 1 }],
    ["Panic.", -2, { n: 1 }],
    ["Film it.", -3],
    ["Call the manager and stay with them.", 3],
  ]),
  q("s-refund", "situational", "A customer wants a refund without a receipt. What do you do?", [
    ["Explain the policy kindly and ask a manager if there's flexibility.", 3, { a: 1 }],
    ["Refuse flatly.", -1],
    ["Just give it to them.", -2],
    ["Look up the purchase another way.", 2, { c: 1 }],
  ]),
  q("s-quiet", "situational", "It's a really slow day and there's nothing to do. What do you do?", [
    ["Find something useful: restock, clean, prep for later.", 3, { c: 1 }],
    ["Scroll on your phone.", -2],
    ["Ask your manager if there's anything to learn.", 3, { o: 1 }],
    ["Take a long break.", -1],
  ]),
  q("s-bad-review", "situational", "Someone writes a nasty online review of your team. What do you do?", [
    ["Show your manager, and help think of a calm, helpful reply.", 3],
    ["Reply and roast them.", -3],
    ["Ignore it completely.", 0],
    ["Comment from a fake account defending the team.", -2, {}, "l"],
  ]),
  q("s-friend-hire", "situational", "Your friend asks you to put in a good word for them, but you know they're unreliable. What do you do?", [
    ["Be honest with your friend and only recommend what you can vouch for.", 3, { a: 1 }],
    ["Recommend them anyway.", -1],
    ["Tell them it's not possible.", 0],
    ["Offer to help them prepare to make a good impression.", 2],
  ]),
  q("s-team-behind", "situational", "Your team is behind on a project. What do you do?", [
    ["Suggest re-planning the work and volunteer for a piece.", 3, { c: 1 }],
    ["Point out who's to blame.", -2],
    ["Keep your head down and do your bit.", 1],
    ["Ask the lead what they need most from you.", 2],
  ]),
  q("s-promotion", "situational", "A coworker gets a promotion you wanted. How do you react?", [
    ["Congratulate them, then ask what you can work on.", 3, { a: 1 }],
    ["Sulk for a month.", -2, { n: 1 }],
    ["Quietly start applying elsewhere.", 0],
    ["Ask your manager for honest feedback.", 3, { o: 1 }],
  ]),
  q("s-sunday", "situational", "You're asked to work a holiday. What do you say?", [
    ["Say yes if it's fair and ask about extra pay or time off in lieu.", 3, { c: 1 }],
    ["Flatly refuse.", -1],
    ["Say yes, then call in sick.", -3, {}, "l"],
    ["Ask if there's a rota so it's shared fairly.", 2],
  ]),
  q("s-lie-cover", "situational", "Your manager asks you to tell a customer something that isn't quite true. What do you do?", [
    ["Politely decline to mislead them and suggest an honest alternative.", 3, { a: 1 }],
    ["Say it - you're just doing your job.", -2],
    ["Tell the customer the truth and hope you don't get fired.", 1],
    ["Ask your manager to clarify what's actually true.", 2],
  ]),
  q("s-noisy", "situational", "Your workplace is loud and busy and you find it hard to concentrate. What do you do?", [
    ["Find a workable routine: headphones, quiet slots, ask to move desk.", 3],
    ["Complain constantly.", -2],
    ["Struggle in silence.", -1],
    ["Ask if there's a quieter time for deep work.", 2],
  ]),

  // ---------------------------------------------------------------- curveball
  q("c-golf", "curveball", "How many golf balls do you think would fit inside a school bus?", [
    ["Work it out aloud with rough volumes and give a sensible estimate.", 3, { o: 1 }],
    ["\"Too many.\"", -1],
    ["\"I'd ask why we're putting golf balls in a bus.\"", 1, { o: 1 }, "f"],
    ["Refuse to guess.", -2],
  ]),
  q("c-animal", "curveball", "If you were an animal, what would you be?", [
    ["Pick something and give a reason that links to the job.", 3, { o: 1 }],
    ["\"A sloth.\"", -1, {}, "f"],
    ["\"A shark - I never stop moving.\"", 0],
    ["\"I'm not comfortable answering that.\"", -1],
  ]),
  q("c-desert", "curveball", "You're stranded on a desert island. You can bring three things. What are they?", [
    ["Water purifier, a knife and a way to signal for rescue.", 3, { c: 1 }],
    ["A phone, a charger and Wi-Fi.", -1, {}, "f"],
    ["Your best friend, a guitar and a hammock.", 1, { e: 1 }],
    ["You wouldn't go to a desert island.", -2],
  ]),
  q("c-superpower", "curveball", "If you could have any superpower, what would it be?", [
    ["Pick one and tie it to something useful you'd do with it.", 3, { o: 1 }],
    ["Invisibility. For obvious reasons.", -1, {}, "f"],
    ["Mind reading - you'd ace every interview.", -1, {}, "f"],
    ["Flying, to skip the commute.", 1, {}, "f"],
  ]),
  q("c-piano", "curveball", "How would you move Mount Fuji, one bucket at a time?", [
    ["Say it's impossible, then break down how you'd approach a giant job.", 3, { c: 1 }],
    ["\"Very slowly.\"", 0, {}, "f"],
    ["Refuse to answer.", -2],
    ["Ask what the deadline is.", 2, { c: 1 }],
  ]),
  q("c-color", "curveball", "What colour is Wednesday?", [
    ["Give a colour and a quick, imaginative reason.", 3, { o: 1 }],
    ["\"Wednesday isn't a colour.\"", -1],
    ["\"Beige. It's the day nothing happens.\"", 1, {}, "f"],
    ["Laugh nervously and say nothing.", -1, { n: 1 }],
  ]),
  q("c-clone", "curveball", "If you could have dinner with anyone, living or dead, who would it be?", [
    ["Name someone you'd genuinely learn from and say why.", 3, { o: 1 }],
    ["A celebrity - and get their autograph.", -1],
    ["Your grandmother.", 2, { a: 1 }],
    ["Yourself, from the future.", 2, { o: 1 }],
  ]),
  q("c-manhole", "curveball", "Why are manhole covers round?", [
    ["So they can't fall through the hole. Say it with a smile.", 3],
    ["\"Because squares would be silly?\"", 0],
    ["\"I've never thought about it.\"", -1],
    ["\"So they can roll away in an emergency.\"", 1, {}, "f"],
  ]),
  q("c-penguin", "curveball", "You've been shrunk to the size of a pencil and dropped in a blender. What do you do?", [
    ["Keep calm, look for the lid, and shout for help.", 3, { n: -1 }],
    ["Check whether the blender is plugged in.", 3, { c: 1 }],
    ["Panic.", -1, { n: 1 }],
    ["Say this is a very strange question.", 0, {}, "f"],
  ]),
  q("c-airplane", "curveball", "If you were the CEO of a company for a day, what would you change?", [
    ["Something practical that would help staff and customers.", 3, { a: 1 }],
    ["Add a nap room.", 1, {}, "f"],
    ["Fire everyone.", -3],
    ["Ask employees what they'd change.", 3, { a: 1, o: 1 }],
  ]),
  q("c-time", "curveball", "If you could travel to any point in time for an hour, when would you go?", [
    ["Pick a time, tell a short story about why.", 3, { o: 1 }],
    ["Tomorrow - to see how this goes.", 1, {}, "f"],
    ["Yesterday, to fix a mistake.", 0, { n: 1 }],
    ["The dinosaur age, for the photos.", 1, {}, "f"],
  ]),
  q("c-tabs", "curveball", "Do you think a hot dog is a sandwich?", [
    ["Give a reasoned answer and accept that people disagree.", 3],
    ["\"Absolutely not. And I'll fight about it.\"", -1, { a: -1 }],
    ["\"I'd need a legal definition.\"", 1, {}, "f"],
    ["\"That's not what I'm here to discuss.\"", -2],
  ]),
  q("c-elevator", "curveball", "You're stuck in an elevator with the CEO. What do you say?", [
    ["A polite hello and a brief, sincere comment about the company.", 3, { e: 1 }],
    ["Hand them your CV.", -1],
    ["Stare at your shoes.", -1, { e: -1 }],
    ["Ask what they'd do differently if they were starting over.", 2, { o: 1 }],
  ]),
  q("c-google", "curveball", "How would you explain the internet to someone from 1850?", [
    ["Use simple comparisons and check they're following.", 3, { o: 1 }],
    ["\"Magic.\"", -1, {}, "f"],
    ["Show them a phone.", 1],
    ["Say it can't be explained.", -2],
  ]),
  q("c-dice", "curveball", "You have to make a decision between two good options. You flip a coin and it lands on the one you didn't want. What now?", [
    ["Notice that you're disappointed - that's your answer.", 3],
    ["Do what the coin says, no questions.", 0, { c: 1 }],
    ["Flip again.", -1, {}, "f"],
    ["Ask for more information before deciding.", 2, { o: 1 }],
  ]),
  q("c-taxi", "curveball", "You have $100 to double in a day. What do you do?", [
    ["Try something legal and creative, like buying supplies and selling a service.", 3, { o: 1 }],
    ["Go to the casino.", -3],
    ["Ask a friend for the other $100.", -1, {}, "f"],
    ["Say you wouldn't take that bet.", 0, { c: 1 }],
  ]),
  q("c-bench", "curveball", "What would you do with an extra hour every day?", [
    ["Learn something, exercise, or see people you care about.", 3],
    ["Sleep.", 0, {}, "f"],
    ["Work more.", 1, { c: 1 }],
    ["Argue online.", -2, {}, "f"],
  ]),
  q("c-dragon", "curveball", "You have to choose: fight one horse-sized duck, or a hundred duck-sized horses. What do you pick?", [
    ["Pick one and explain your reasoning like a strategy question.", 3, { o: 1 }],
    ["\"Neither. I'm a lover.\"", 0, {}, "f"],
    ["Take the horse-sized duck and go all in.", 1, {}, "f"],
    ["Say you'd negotiate with the ducks.", 2, { a: 1 }],
  ]),
  q("c-remember", "curveball", "What was the last thing you Googled?", [
    ["Tell the truth - it's fine if it's normal.", 2, { a: 1 }],
    ["Say something impressive that isn't true.", -2, {}, "l"],
    ["\"How to answer this question.\"", 1, {}, "f"],
    ["Say you don't remember.", -1],
  ]),
  q("c-typo", "curveball", "Sell me this pen.", [
    ["Ask what they need a pen for, then explain how this one helps.", 3, { e: 1 }],
    ["\"It's a pen. It writes.\"", -1],
    ["Talk endlessly about its features.", 0],
    ["Say you wouldn't sell it - you'd give it to them.", 1, {}, "f"],
  ]),
  q("c-worst", "curveball", "What's the worst pizza topping?", [
    ["Pick one and smile - it's an ice-breaker.", 2, { e: 1 }],
    ["\"Pineapple.\" (They love pineapple.)", -1, {}, "f"],
    ["\"I don't judge pizza.\"", 2, { a: 1 }],
    ["\"That's not a work question.\"", -2],
  ]),
  q("c-fired-team", "curveball", "You have to fire one of three coworkers: your best friend, the top performer, or someone who's been here 30 years. Who?", [
    ["Say you'd want to look for another solution and get more information.", 3, { a: 1 }],
    ["Pick one and justify it coldly.", -1],
    ["Refuse to answer.", -1],
    ["Talk through fair criteria you'd use.", 2, { c: 1 }],
  ]),
  q("c-balloon", "curveball", "Describe yourself using only three words.", [
    ["Pick three that are honest and fit the job.", 3],
    ["\"Tired. Hungry. Hired?\"", 1, {}, "f"],
    ["\"Loyal, curious, stubborn.\"", 3, { o: 1 }],
    ["\"I'm sorry, only three?\"", -1],
  ]),

  // ---------------------------------------------------------------- bs (straight nonsense)
  q("b-sandwich", "bs", "What's your spirit sandwich?", [
    ["\"Something with layers, plenty of substance, and a little heat.\"", 3, {}, "f"],
    ["\"I'm not sure what that means.\"", 0],
    ["\"Honestly? Cheese. Just cheese.\"", 1, {}, "f"],
    ["\"Ham. I'm a simple soul.\"", 0],
  ]),
  q("b-thursday", "bs", "How do you feel about Thursdays as a concept?", [
    ["\"Thursday is Friday's nervous assistant.\"", 2, {}, "f"],
    ["\"Fine.\"", 0],
    ["Ask them to define the concept first.", 1, { o: 1 }],
    ["\"Thursdays are a construct.\"", -1, {}, "f"],
  ]),
  q("b-fog", "bs", "If our company were a type of weather, what would it be?", [
    ["\"A bright, changeable spring day - always something coming.\"", 3, { o: 1 }],
    ["\"Fog. No offence.\"", -2, {}, "f"],
    ["\"Sunny with a chance of promotions.\"", 1, {}, "f"],
    ["\"I don't do weather metaphors.\"", -1],
  ]),
  q("b-teapot", "bs", "On a scale of one to a teapot, how ready are you?", [
    ["\"About a seven and a half. Two spouts short of a full pour.\"", 2, {}, "f"],
    ["\"...I'm a nine.\"", 1],
    ["\"That is not a scale.\"", -1],
    ["\"Teapot.\"", 2, {}, "f"],
  ]),
  q("b-moon", "bs", "Can you tell me how you'd synergise a moon?", [
    ["\"Gently. Then circle back at the next tide.\"", 2, {}, "f"],
    ["Politely ask what they mean.", 2],
    ["\"I'd form a working group.\"", 1, {}, "f"],
    ["Stare, then say nothing.", -2],
  ]),
  q("b-lint", "bs", "What is your relationship with lint?", [
    ["\"Complicated. It follows me everywhere.\"", 2, {}, "f"],
    ["\"Neutral. We coexist.\"", 1],
    ["\"I have questions of my own now.\"", 1, {}, "f"],
    ["\"I refuse to answer.\"", -2],
  ]),
  q("b-mirror", "bs", "If you were a font, which font and why?", [
    ["Pick a font and give a reason with personality.", 3, { o: 1 }],
    ["\"Comic Sans. It's honest.\"", 0, {}, "f"],
    ["\"I'd be Arial - reliable, nobody complains.\"", 2],
    ["\"I don't understand the question.\"", -1],
  ]),
  q("b-cactus", "bs", "How would your houseplant describe your work ethic?", [
    ["\"Attentive, if occasionally forgetful about watering.\"", 3, {}, "f"],
    ["\"It's dead.\"", -1, {}, "f"],
    ["\"I don't own a plant.\"", 0],
    ["\"Supportive of growth.\"", 2],
  ]),
  q("b-clock", "bs", "Tell me about a time you were the second hand of a clock.", [
    ["\"Constantly moving, rarely thanked, and precise to the second.\"", 3, {}, "f"],
    ["\"I've never been a clock.\"", -1],
    ["Say you were more of a minute hand.", 1, {}, "f"],
    ["Talk about a time you were always on time.", 2, { c: 1 }],
  ]),
  q("b-shoe", "bs", "Which of your shoes has the most leadership potential?", [
    ["\"The left one. Reliable, rarely forgotten, always ready.\"", 2, {}, "f"],
    ["\"I only wear one pair.\"", 0],
    ["Point at the shoes and consider them seriously.", 2, {}, "f"],
    ["\"Is this a real interview?\"", -1],
  ]),
  q("b-cheese", "bs", "Would you rather manage a hundred cheeses, or be managed by one?", [
    ["\"Managing them - cheese needs patience and good timing.\"", 3, {}, "f"],
    ["\"Managed by one. Delegation, you know.\"", 1, {}, "f"],
    ["\"Neither.\"", -1],
    ["\"Which cheese?\"", 2, { o: 1 }],
  ]),
  q("b-echo", "bs", "What noise does your ambition make?", [
    ["\"A steady hum, like a well-run fridge.\"", 3, {}, "f"],
    ["\"Whoosh.\"", 1, {}, "f"],
    ["\"I don't hear it.\"", -1],
    ["\"A quiet click, like a good idea landing.\"", 3],
  ]),
  q("b-bridge", "bs", "How many bridges have you personally emotionally crossed?", [
    ["\"Plenty. Some were burned, most were repaired.\"", 3, { a: 1 }, "f"],
    ["\"Zero. I'm a strong swimmer.\"", 1, {}, "f"],
    ["\"That's not a number.\"", -1],
    ["\"Twelve. It was a long week.\"", 1, {}, "f"],
  ]),
  q("b-jazz", "bs", "If this job were a jazz song, which key would it be in?", [
    ["\"Something flexible - probably B-flat, for a bit of blues on the busy days.\"", 3, { o: 1 }, "f"],
    ["\"I don't know jazz.\"", 0],
    ["\"The key of Monday.\"", 1, {}, "f"],
    ["\"...C?\"", 0],
  ]),
  q("b-spoon", "bs", "Spoon: tool, weapon, or friend?", [
    ["\"Friend. It's there for you at every meal.\"", 3, {}, "f"],
    ["\"Tool. Obviously.\"", 0],
    ["\"Weapon, if it comes to it.\"", -1, { a: -1 }, "f"],
    ["Stare in silence.", -2],
  ]),
  q("b-quiz", "bs", "Please rate your enthusiasm for reversible jackets.", [
    ["\"Very high. Two coats for the price of one.\"", 3, {}, "f"],
    ["\"I own one, so, moderate.\"", 1],
    ["\"I don't care about jackets.\"", -1],
    ["\"Which side is the good side?\"", 1, {}, "f"],
  ]),
  q("b-vowel", "bs", "What's your favourite vowel and what has it done for you?", [
    ["\"O. It's always open and surprised, and it never lets me down.\"", 3, {}, "f"],
    ["\"E. It shows up everywhere.\"", 2, {}, "f"],
    ["\"I've never chosen one.\"", 0],
    ["\"Y, sometimes.\"", 2, {}, "f"],
  ]),
  q("b-turtle", "bs", "If you could be any kind of turtle, which would you be?", [
    ["\"A sea turtle - long-haul, quietly determined.\"", 3, {}, "f"],
    ["\"A snapping turtle.\"", -1, { a: -1 }],
    ["\"The one with the fastest shell.\"", 0, {}, "f"],
    ["\"I'd rather not be a turtle.\"", -1],
  ]),
  q("b-boat", "bs", "Is a cup half full, half empty, or currently on fire?", [
    ["\"Half full, and I'll help put out the fire.\"", 3, {}, "f"],
    ["\"On fire, definitely.\"", 0, {}, "f"],
    ["\"That's a spill waiting to happen.\"", 1, {}, "f"],
    ["Ask who's holding the cup.", 2, { o: 1 }],
  ]),
  q("b-sock", "bs", "How would you handle a sock that's lost its partner?", [
    ["\"With patience, hope and a good drawer.\"", 3, {}, "f"],
    ["\"Bin it.\"", -1],
    ["\"Find it a new partner.\"", 2, {}, "f"],
    ["\"That's my whole personality.\"", 0, {}, "f"],
  ]),
  q("b-goose", "bs", "Are you now, or have you ever been, a goose?", [
    ["\"Not officially. But I've been honked at in traffic.\"", 3, {}, "f"],
    ["\"No.\"", 0],
    ["\"...Honk.\"", 1, {}, "f"],
    ["\"Please don't ask me that.\"", -1],
  ]),
  q("b-mud", "bs", "Describe the smell of a great idea.", [
    ["\"Fresh coffee and a page nobody's written on yet.\"", 3, { o: 1 }, "f"],
    ["\"Ozone.\"", 1, {}, "f"],
    ["\"I can't smell ideas.\"", -1],
    ["\"Rain on warm pavement.\"", 2, { o: 1 }],
  ]),
  q("b-plank", "bs", "How much wood would a woodchuck chuck if a woodchuck could plan projects?", [
    ["\"Enough to hit the deadline, and not a splinter more.\"", 3, {}, "f"],
    ["\"Twelve.\"", 0, {}, "f"],
    ["\"Woodchucks don't plan.\"", -1],
    ["\"It depends on their sprint velocity.\"", 2, {}, "f"],
  ]),

  // ---------------------------------------------------------------- first jobs / teens
  q("t-why", "first", "Have you had a job before?", [
    ["Say no, but mention chores, babysitting or school projects you took seriously.", 3, { c: 1 }],
    ["Say no and shrug.", -1],
    ["Lie and say you've worked at three places.", -3, {}, "l"],
    ["Say no, and that you're keen to learn.", 2],
  ], { maxAge: 24 }),
  q("t-late", "first", "This job needs you to show up on time. Can you do that?", [
    ["Say yes and explain how you'll get here.", 3, { c: 1 }],
    ["\"Mostly.\"", -2],
    ["\"I'm always late but I'm fun.\"", -1, {}, "f"],
    ["Say yes and offer a reference from school.", 3],
  ], { maxAge: 24 }),
  q("t-school", "first", "How will you balance this job with school?", [
    ["Explain your timetable and that school comes first.", 3, { c: 1 }],
    ["\"I'll skip school if needed.\"", -3],
    ["\"I'm not sure yet.\"", -1],
    ["Say you'll ask your parents and teachers for help planning.", 2],
  ], { maxAge: 19 }),
  q("t-parents", "first", "Do your parents know you're applying?", [
    ["Say yes and they're supportive.", 3],
    ["\"They will after I get the job.\"", -2, {}, "f"],
    ["\"It's my decision.\"", -1],
    ["Say yes and offer to bring a parent's permission form.", 3, { c: 1 }],
  ], { maxAge: 17 }),
  q("t-uniform", "first", "You'll have to wear a uniform and be neat. How do you feel about that?", [
    ["\"No problem - I like knowing what to wear.\"", 3],
    ["\"As long as it isn't itchy.\"", 1, {}, "f"],
    ["\"I'd rather not.\"", -2],
    ["Say you take pride in looking sharp.", 2, { c: 1 }],
  ], { maxAge: 24 }),
  q("t-tired", "first", "Some shifts can be boring and repetitive. How do you keep going?", [
    ["Say you make small goals, chat with coworkers, and keep busy.", 3],
    ["\"I don't.\"", -3],
    ["Play music in your head.", 1],
    ["Say you remind yourself what the money is for.", 2],
  ], { maxAge: 24 }),
  q("t-money", "first", "What will you do with the money you earn here?", [
    ["Save some, spend some, and put a part towards something you want.", 3, { c: 1 }],
    ["\"Games.\"", 0, {}, "f"],
    ["\"Give it to my family.\"", 2, { a: 1 }],
    ["\"A car, eventually.\"", 2],
  ], { maxAge: 24 }),
  q("t-friends", "first", "Your friends come in while you're on shift and try to get freebies. What do you do?", [
    ["Politely say you can't - it's part of the job.", 3, { c: 1 }],
    ["Give them a freebie.", -3],
    ["Ignore them.", -1],
    ["Chat quickly and ask them to wait until your break.", 2],
  ], { maxAge: 24 }),
  q("t-phone", "first", "What's your view on using your phone at work?", [
    ["Only on breaks, and it stays in my pocket.", 3, { c: 1 }],
    ["\"Whenever nobody's looking.\"", -2],
    ["\"I can go hours without it. Probably.\"", 0, {}, "f"],
    ["\"I'd leave it in my locker.\"", 3],
  ], { maxAge: 24 }),
  q("t-strength", "first", "What are you good at that would help here?", [
    ["Name something real: being reliable, friendly, quick to learn.", 3],
    ["\"Nothing really.\"", -3, { n: 1 }],
    ["Talk about being good at video games.", 0, {}, "f"],
    ["Say you're good with people.", 2, { e: 1 }],
  ], { maxAge: 24 }),
];

export const questionsByCat = (cat: Cat) => QUESTIONS.filter((x) => x.cat === cat);

// ---------------------------------------------------------------- field-specific
// Asked in addition to the general questions when the job is in one of these
// fields: the questions a hiring manager in that world actually cares about.
export const FIELD_QUESTIONS: Question[] = [
  q("f-tech-bug", "situational", "A live system is down and customers are angry. You've got a guess about the cause. What do you do?", [
    ["Tell the team, check logs to confirm the guess, roll back the last change, write it up afterwards.", 3, { c: 1 }],
    ["Change things until it works.", -2],
    ["Wait for someone senior to tell you what to do.", -1, { n: 0.5 }],
    ["Fix it quickly and quietly and hope nobody asks.", -1, { a: -0.5 }, "l"],
  ], { fields: ["Tech"] }),
  q("f-tech-learn", "genuine", "Our stack changes every couple of years. How do you keep up?", [
    ["Side projects, docs and a habit of reading other people's code.", 3, { o: 1 }],
    ["I learn it when a task forces me to.", 0],
    ["I mostly stick with what I know.", -2, { o: -1 }],
  ], { fields: ["Tech"] }),
  q("f-tech-explain", "situational", "Explain what a database index is to someone who has never programmed.", [
    ["A book's index: it lets you jump to the page instead of reading every one.", 3, { o: 0.5 }],
    ["Cross-referencing data structures for query optimisation.", -1],
    ["I'd rather show them than explain it.", 0],
  ], { fields: ["Tech"] }),
  q("f-fin-risk", "situational", "A client wants to put all their savings into one hot investment. What do you tell them?", [
    ["Explain diversification and risk plainly, then respect their decision in writing.", 3, { a: 0.5, c: 1 }],
    ["Tell them to go for it.", -3],
    ["Refuse to talk about it.", -1],
  ], { fields: ["Finance & Business"] }),
  q("f-fin-error", "situational", "You spot a mistake in a report that's already gone to the client. Nobody has noticed. What now?", [
    ["Tell your manager immediately and offer a corrected version.", 3, { c: 1, a: 0.5 }],
    ["Wait to see if anyone notices.", -3, undefined, "l"],
    ["Quietly fix it in the next report.", -1],
  ], { fields: ["Finance & Business", "Office & Admin"] }),
  q("f-fin-numbers", "genuine", "Talk me through how you'd sanity-check a budget with a suspiciously round total.", [
    ["Look at the biggest lines, ask where the round numbers came from, and compare with last year.", 3, { c: 1 }],
    ["Assume it's fine.", -2],
    ["Ask someone else to check it.", -1],
  ], { fields: ["Finance & Business"] }),
  q("f-health-calm", "situational", "A patient's family is panicking and demanding answers you can't give yet. What do you do?", [
    ["Stay calm, say what you do know, what you're doing next and when they'll hear more.", 3, { a: 1, n: -1 }],
    ["Tell them to wait outside.", -2],
    ["Promise everything will be fine.", -2, undefined, "l"],
  ], { fields: ["Healthcare"] }),
  q("f-health-shift", "genuine", "Healthcare means nights, weekends and long shifts. How do you cope?", [
    ["Routines, good sleep habits, and people I can talk to after hard days.", 3, { c: 1 }],
    ["I'll just push through it.", -1, { n: 0.5 }],
    ["I'd rather avoid nights.", -1],
  ], { fields: ["Healthcare"] }),
  q("f-health-mistake", "situational", "You realise you've given a patient the wrong form to sign. What do you do?", [
    ["Tell your supervisor straight away and put it right before it goes any further.", 3, { c: 1 }],
    ["Swap it quietly.", -3, undefined, "l"],
    ["Ask a colleague what they'd do.", 0],
  ], { fields: ["Healthcare"] }),
  q("f-edu-behaviour", "situational", "A student is disrupting the class for the third time this week. What do you do?", [
    ["Talk to them privately to find out what's behind it, and agree a plan with them.", 3, { a: 1 }],
    ["Send them out of the room.", -1],
    ["Raise your voice until they stop.", -2, { a: -1 }],
  ], { fields: ["Education & Care"] }),
  q("f-edu-diff", "genuine", "How would you teach the same idea to a quick learner and a struggling one?", [
    ["Different examples, different pace, same expectations.", 3, { o: 0.5, a: 0.5 }],
    ["The same way; that's fair.", -1],
    ["Focus on the quick ones.", -2],
  ], { fields: ["Education & Care"] }),
  q("f-pub-conflict", "situational", "Two members of the public are arguing and it's getting heated. You arrive first. What do you do?", [
    ["Stay calm, separate them, listen to each and keep it safe.", 3, { a: 0.5, n: -1 }],
    ["Take a side quickly.", -2],
    ["Wait for backup and stay out of it.", -1],
  ], { fields: ["Public Service"] }),
  q("f-pub-rules", "genuine", "What do you do when the rules seem to work against the person in front of you?", [
    ["Follow them, explain honestly, and point them to whoever can actually help.", 3, { c: 1, a: 0.5 }],
    ["Bend the rules quietly.", -2],
    ["Hide behind the rulebook.", -1],
  ], { fields: ["Public Service"] }),
  q("f-trade-safety", "situational", "You're on site and someone's cutting a corner on safety to save time. What do you do?", [
    ["Stop the job, say why, and won't restart until it's done right.", 3, { c: 1 }],
    ["Say nothing; it's their call.", -3],
    ["Do it their way to keep the peace.", -2],
  ], { fields: ["Outdoors & Trades", "Logistics"] }),
  q("f-trade-measure", "genuine", "What's your rule about measuring and checking your work?", [
    ["Measure twice, cut once, and check when I'm done.", 3, { c: 1 }],
    ["I trust my eye.", -1],
    ["Whatever's quickest.", -2],
  ], { fields: ["Outdoors & Trades"] }),
  q("f-trade-early", "genuine", "This job means early starts and physical days. How does that sit with you?", [
    ["I'm happy with it. I like being out and doing something real.", 3, { c: 1 }],
    ["I'd rather have a desk.", -2],
    ["I'll manage, I suppose.", 0],
  ], { fields: ["Outdoors & Trades", "Logistics"] }),
  q("f-log-deadline", "situational", "A delivery is going to be late through no fault of yours. The customer hasn't called yet. What do you do?", [
    ["Call them first, explain, and offer a new time you can actually keep.", 3, { a: 0.5, c: 1 }],
    ["Wait to see if they call.", -2],
    ["Say it's on its way.", -3, undefined, "l"],
  ], { fields: ["Logistics", "Retail & Service"] }),
  q("f-ret-upsell", "situational", "A customer is clearly unsure. Your target says sell them the expensive one. What do you do?", [
    ["Ask about what they need and recommend what genuinely fits, even if it's cheaper.", 3, { a: 1, c: 1 }],
    ["Push the expensive one.", -2],
    ["Let them work it out alone.", -1],
  ], { fields: ["Retail & Service"] }),
  q("f-ret-queue", "situational", "It's the busiest hour, the queue's out the door and the till freezes. What do you do?", [
    ["Stay calm, tell the queue, switch to the backup and keep people moving.", 3, { n: -1, c: 1 }],
    ["Panic quietly.", -2, { n: 1 }],
    ["Go and find the manager.", -1],
  ], { fields: ["Retail & Service", "Food & Hospitality"] }),
  q("f-food-rush", "situational", "It's Saturday night and three tables are complaining at once. How do you handle it?", [
    ["Take a breath, triage by who's waited longest, keep everyone informed.", 3, { n: -1, c: 1 }],
    ["Hide in the kitchen.", -2],
    ["Blame the kitchen.", -2, { a: -1 }],
  ], { fields: ["Food & Hospitality"] }),
  q("f-food-hygiene", "genuine", "What does good food hygiene look like to you, day to day?", [
    ["Clean as you go, correct temperatures, labelled and dated, wash your hands constantly.", 3, { c: 1 }],
    ["Clean at the end of the shift.", -2],
    ["Nobody has died yet.", -3],
  ], { fields: ["Food & Hospitality"] }),
  q("f-creative-crit", "genuine", "A client hates the first version of something you're proud of. How do you respond?", [
    ["Ask what isn't working, separate taste from the brief, and offer options.", 3, { a: 0.5, o: 0.5 }],
    ["Defend it.", -1, { a: -0.5 }],
    ["Redo it from scratch without asking.", -1],
  ], { fields: ["Creative & Media"] }),
  q("f-creative-deadline", "genuine", "Creative work is hard to hurry. How do you meet a deadline when the ideas won't come?", [
    ["Set constraints, show a rough version early and iterate.", 3, { c: 1 }],
    ["Wait for inspiration.", -2],
    ["Copy something that already works.", -2, undefined, "l"],
  ], { fields: ["Creative & Media"] }),
  q("f-creative-portfolio", "genuine", "Which piece in your portfolio are you proudest of, and what would you change?", [
    ["Name one, explain the thinking, and say honestly what you'd do differently.", 3, { o: 1 }],
    ["They're all perfect.", -2],
    ["I haven't got a portfolio.", -3],
  ], { fields: ["Creative & Media"] }),
  q("f-office-priorities", "situational", "Three people each need something urgent from you by five. How do you decide what comes first?", [
    ["Ask what each really needs by when, then be upfront about what I can deliver.", 3, { c: 1 }],
    ["Do the loudest one first.", -1],
    ["Try to do all three at once.", -2, { n: 0.5 }],
  ], { fields: ["Office & Admin", "Finance & Business"] }),
  q("f-office-detail", "genuine", "Tell me about a time your attention to detail saved the day.", [
    ["Give a specific example: what you noticed, what would have gone wrong, what you did.", 3, { c: 1 }],
    ["I'm always very detail-oriented.", -1],
    ["I can't think of one.", -2],
  ], { fields: ["Office & Admin"] }),
];
