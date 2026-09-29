// Places to go with somebody. Costs are for the pair (the player pays).

export type Venue = {
  name: string;
  cost: number;
  blurb: string; // shown when it goes well
  meh: string; // shown when it doesn't quite land
  lvl: [number, number];
  hap: [number, number];
  health?: number;
  partnerOnly?: boolean;
};

export const MINOR_VENUES: Venue[] = [
  { name: "Walk to the park", cost: 0, blurb: "You wandered around and talked about everything and nothing.", meh: "It started drizzling. You went home damp but smiling.", lvl: [3, 6], hap: [2, 4] },
  { name: "Movie at the cinema", cost: 24, blurb: "You shared a popcorn and argued about the ending the whole way home.", meh: "The movie was awful. You had fun roasting it anyway.", lvl: [4, 8], hap: [3, 6] },
  { name: "Arcade", cost: 30, blurb: "You spent every token and swore you'd beat each other's scores next time.", meh: "The claw machine ate five dollars. Rude.", lvl: [4, 8], hap: [3, 6] },
  { name: "Mini golf", cost: 28, blurb: "Someone got a hole-in-one. It wasn't you, but you took credit anyway.", meh: "It was too crowded and you barely got to play.", lvl: [4, 8], hap: [3, 6] },
  { name: "Ice cream", cost: 12, blurb: "Two scoops, no regrets.", meh: "The place was out of your favorite flavor.", lvl: [3, 5], hap: [2, 4] },
  { name: "Pizza and a bike ride", cost: 22, blurb: "You rode until the streetlights came on.", meh: "A flat tire cut the ride short.", lvl: [4, 7], hap: [3, 5], health: 1 },
  { name: "Mall trip", cost: 20, blurb: "You tried on ridiculous hats and bought nothing. Perfect.", meh: "It was packed. You left with a headache.", lvl: [3, 6], hap: [2, 4] },
  { name: "Bowling", cost: 34, blurb: "Gutter balls all around. It was glorious.", meh: "Somebody else's birthday party took over the lanes.", lvl: [4, 8], hap: [3, 6] },
  { name: "School football game", cost: 10, blurb: "You cheered until you lost your voice.", meh: "Your team got trounced. You still had fun.", lvl: [3, 6], hap: [2, 5] },
  { name: "Study date at the library", cost: 0, blurb: "You actually got your work done. Mostly.", meh: "Neither of you could focus.", lvl: [2, 5], hap: [1, 3] },
];

export const ADULT_VENUES: Venue[] = [
  { name: "Coffee and a long walk", cost: 15, blurb: "It was the kind of unhurried afternoon you don't get often enough.", meh: "It rained, but the coffee was good.", lvl: [3, 6], hap: [2, 4] },
  { name: "Movie night", cost: 35, blurb: "Popcorn, a decent movie and good company.", meh: "The movie was a dud. You made the most of it.", lvl: [4, 8], hap: [3, 5] },
  { name: "Dinner at a nice restaurant", cost: 95, blurb: "The food was excellent and the conversation was better.", meh: "The service was slow, but you enjoyed each other's company.", lvl: [6, 10], hap: [4, 6] },
  { name: "Concert", cost: 160, blurb: "You sang along to every word. Your ears rang the whole way home.", meh: "The sound was muddy and the crowd was rowdy, but you had a laugh.", lvl: [6, 11], hap: [5, 8] },
  { name: "Museum", cost: 30, blurb: "You lingered longer than you meant to in the gift shop.", meh: "Half of it was closed for renovations.", lvl: [4, 7], hap: [2, 4] },
  { name: "Hike", cost: 0, blurb: "The view at the top made the aching legs worth it.", meh: "You got a little lost, but found a better path.", lvl: [5, 9], hap: [3, 6], health: 2 },
  { name: "Sports game", cost: 120, blurb: "Overpriced beer, a nail-biter of a game, no regrets.", meh: "Your team lost. You still stayed until the end.", lvl: [5, 9], hap: [4, 7] },
  { name: "Amusement park", cost: 170, blurb: "You screamed on the big ride, then went again.", meh: "The lines were brutal. You did get a good funnel cake though.", lvl: [6, 11], hap: [5, 8] },
  { name: "Karaoke", cost: 60, blurb: "Someone did a truly unhinged rendition of a power ballad.", meh: "You picked the wrong song. Never again.", lvl: [5, 9], hap: [4, 7] },
  { name: "Spa day", cost: 220, blurb: "You both came out floating.", meh: "The place was booked solid, so you made do with a shorter package.", lvl: [6, 10], hap: [4, 7], health: 1 },
  { name: "Candlelit dinner", cost: 140, blurb: "Candlelight, a great table and a long, easy conversation.", meh: "The candle kept going out, but it became the running joke.", lvl: [7, 12], hap: [5, 8], partnerOnly: true },
  { name: "Weekend getaway", cost: 480, blurb: "Two days away from everything. You came back a little more in sync.", meh: "The weather turned. You made a cozy weekend of it indoors.", lvl: [8, 14], hap: [6, 10], partnerOnly: true },
  { name: "Picnic and stargazing", cost: 40, blurb: "You lay on the blanket until the stars came out.", meh: "Ants. So many ants. You still laughed about it.", lvl: [6, 10], hap: [4, 7], partnerOnly: true },
];

// teen-safe things only a couple would do
export const MINOR_DATE_VENUES: Venue[] = [
  { name: "Get milkshakes after school", cost: 14, blurb: "You split a milkshake with two straws. Cheesy, and you loved it.", meh: "It was busy and you barely got to talk.", lvl: [5, 9], hap: [4, 7], partnerOnly: true },
  { name: "Movie date", cost: 32, blurb: "You barely watched the movie. You were both too busy trying not to look at each other.", meh: "The movie was terrible, but you laughed through it.", lvl: [5, 10], hap: [4, 8], partnerOnly: true },
  { name: "Walk home together", cost: 0, blurb: "You took the long way home on purpose.", meh: "Your little sibling followed you the whole way. Mortifying.", lvl: [4, 8], hap: [3, 6], partnerOnly: true },
  { name: "Picnic in the park", cost: 18, blurb: "Sandwiches, sunshine and a whole afternoon.", meh: "It rained, so you ate in the car.", lvl: [5, 9], hap: [4, 7], partnerOnly: true },
  { name: "Ice-skating", cost: 28, blurb: "You held on to each other for dear life and fell over laughing.", meh: "The rink was closed. You went for hot chocolate instead.", lvl: [5, 9], hap: [4, 7], partnerOnly: true },
];

export const PARTY_VENUES: Venue[] = [
  { name: "House party", cost: 30, blurb: "Loud music, good people, and a story you'll tell for years.", meh: "It got too crowded, and someone spilled something on the couch.", lvl: [4, 8], hap: [3, 6], health: -1 },
  { name: "Club night", cost: 90, blurb: "You danced until your feet ached and stayed until close.", meh: "The line took an hour and the music was too loud to talk.", lvl: [4, 9], hap: [4, 7], health: -1 },
  { name: "Birthday dinner", cost: 120, blurb: "Cake, candles and a table of people you love.", meh: "The waiter dropped the cake. You ate it anyway.", lvl: [6, 10], hap: [5, 8] },
  { name: "Music festival", cost: 220, blurb: "Three days of music, mud and memories.", meh: "It rained the whole weekend and your tent leaked. It was still epic.", lvl: [7, 12], hap: [6, 10], health: -2 },
  { name: "Game night at yours", cost: 40, blurb: "Snacks, board games and the usual argument over the rules.", meh: "Somebody flipped the board. It wasn't entirely a joke.", lvl: [4, 8], hap: [3, 6] },
];

export const SLEEPOVER_MINOR: Venue[] = [
  { name: "Movie marathon and pizza", cost: 18, blurb: "You stayed up way past midnight arguing over which movie to watch next.", meh: "Somebody fell asleep in the first ten minutes.", lvl: [5, 9], hap: [4, 7] },
  { name: "Video game all-nighter", cost: 10, blurb: "You finally beat the level you'd been stuck on for weeks.", meh: "The controller died halfway through, so you switched to cards.", lvl: [5, 9], hap: [4, 7] },
  { name: "Build a blanket fort", cost: 0, blurb: "It was the best fort ever made and you slept in it.", meh: "It collapsed at 2am. You slept in the wreckage.", lvl: [4, 8], hap: [3, 6] },
  { name: "Scary stories in the dark", cost: 0, blurb: "Everyone slept with the light on.", meh: "Somebody's story was so bad that everyone fell asleep.", lvl: [4, 8], hap: [3, 6] },
  { name: "Midnight baking", cost: 12, blurb: "The cookies were a disaster. The night wasn't.", meh: "You burned the first batch and the second and third.", lvl: [4, 8], hap: [3, 6] },
];

export const SLEEPOVER_ADULT: Venue[] = [
  { name: "Catch up on the couch", cost: 0, blurb: "You talked until the small hours, feet up.", meh: "You both fell asleep mid-sentence, which counts.", lvl: [5, 9], hap: [4, 7] },
  { name: "Board games and wine", cost: 40, blurb: "It got competitive. It was the best kind of night.", meh: "Somebody lost badly and sulked. It was hilarious.", lvl: [5, 9], hap: [4, 7] },
  { name: "Brunch the next morning", cost: 30, blurb: "Pancakes, coffee and more talking.", meh: "The place had a two-hour wait, so you made eggs at home.", lvl: [4, 8], hap: [3, 6] },
];
