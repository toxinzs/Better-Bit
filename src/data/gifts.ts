// Every gift the game can put in front of you. Each year a person is offered
// a different ten of these (see engine/gifts.ts) and reacts according to
// their own hidden tastes, so the "right" present changes with the person
// and the year.

export type TasteTag =
  | "tech" | "fashion" | "food" | "books" | "games" | "music" | "outdoors" | "home" | "beauty"
  | "sports" | "art" | "toys" | "jewelry" | "wellness" | "travel" | "pets" | "tools" | "hobby";

export const TASTE_TAGS: TasteTag[] = [
  "tech", "fashion", "food", "books", "games", "music", "outdoors", "home", "beauty",
  "sports", "art", "toys", "jewelry", "wellness", "travel", "pets", "tools", "hobby",
];

export const TASTE_LABEL: Record<TasteTag, string> = {
  tech: "gadgets", fashion: "fashion", food: "food", books: "books", games: "games", music: "music",
  outdoors: "the outdoors", home: "home comforts", beauty: "self-care", sports: "sports", art: "art",
  toys: "toys", jewelry: "jewelry", wellness: "wellness", travel: "travel", pets: "animals",
  tools: "tools & DIY", hobby: "hobbies",
};

export type Audience = "kid" | "teen" | "adult" | "senior";

export type GiftDef = {
  name: string;
  price: number;
  tags: TasteTag[];
  aud: Audience[]; // who it suits by age
  romantic?: boolean; // only for a partner (or an ex you're wooing)
};

const K: Audience[] = ["kid"];
const KT: Audience[] = ["kid", "teen"];
const T: Audience[] = ["teen"];
const TA: Audience[] = ["teen", "adult"];
const A: Audience[] = ["adult"];
const AS: Audience[] = ["adult", "senior"];
const S: Audience[] = ["senior"];
const ALL: Audience[] = ["kid", "teen", "adult", "senior"];
const NK: Audience[] = ["teen", "adult", "senior"];

export const GIFTS: GiftDef[] = [
  // ---- budget ----
  { name: "A handwritten card", price: 5, tags: ["art"], aud: ALL },
  { name: "Homemade cookies", price: 12, tags: ["food"], aud: ALL },
  { name: "A paperback novel", price: 14, tags: ["books"], aud: NK },
  { name: "A picture book", price: 10, tags: ["books"], aud: K },
  { name: "A box of chocolates", price: 18, tags: ["food"], aud: ALL },
  { name: "Scented candle", price: 20, tags: ["home", "beauty"], aud: NK },
  { name: "Sticker pack", price: 6, tags: ["art", "toys"], aud: KT },
  { name: "Trading cards", price: 12, tags: ["games", "hobby"], aud: KT },
  { name: "A mixtape playlist on a USB stick", price: 15, tags: ["music"], aud: TA },
  { name: "Potted succulent", price: 16, tags: ["home", "outdoors"], aud: NK },
  { name: "Bubble tea vouchers", price: 15, tags: ["food"], aud: TA },
  { name: "Fluffy socks", price: 12, tags: ["home", "fashion"], aud: ALL },
  { name: "Coffee mug with a joke on it", price: 14, tags: ["home", "food"], aud: NK },
  { name: "Jigsaw puzzle", price: 22, tags: ["games", "hobby"], aud: ALL },
  { name: "Colouring book & pencils", price: 15, tags: ["art", "toys"], aud: K },
  { name: "Bath bombs", price: 18, tags: ["beauty", "wellness"], aud: NK },
  { name: "Hand cream set", price: 20, tags: ["beauty"], aud: AS },
  { name: "Pack of gourmet teas", price: 19, tags: ["food", "wellness"], aud: AS },
  { name: "Keychain flashlight", price: 9, tags: ["tools", "outdoors"], aud: NK },
  { name: "Fidget cube", price: 10, tags: ["toys", "tech"], aud: KT },
  { name: "Phone case", price: 18, tags: ["tech", "fashion"], aud: TA },
  { name: "Comic book", price: 8, tags: ["books", "hobby"], aud: KT },
  { name: "Bag of birdseed & a feeder", price: 24, tags: ["pets", "outdoors"], aud: AS },
  { name: "Playing cards", price: 8, tags: ["games"], aud: ALL },
  { name: "Notebook & nice pen", price: 16, tags: ["books", "art"], aud: NK },
  { name: "Scratch-off lottery tickets", price: 20, tags: ["games"], aud: A },
  { name: "Seed packets", price: 8, tags: ["outdoors", "hobby"], aud: AS },
  { name: "A framed photo of the two of you", price: 24, tags: ["art", "home"], aud: NK },
  // ---- nice ----
  { name: "Wireless earbuds", price: 79, tags: ["tech", "music"], aud: NK },
  { name: "LEGO set", price: 55, tags: ["toys", "hobby"], aud: KT },
  { name: "Board game", price: 40, tags: ["games"], aud: ALL },
  { name: "Video game", price: 60, tags: ["games", "tech"], aud: KT },
  { name: "Video game for your console", price: 60, tags: ["games", "tech"], aud: A },
  { name: "Hardcover cookbook", price: 35, tags: ["books", "food"], aud: AS },
  { name: "Sneakers", price: 110, tags: ["fashion", "sports"], aud: ALL },
  { name: "A good hoodie", price: 65, tags: ["fashion"], aud: KT },
  { name: "Wool sweater", price: 80, tags: ["fashion", "home"], aud: AS },
  { name: "Basketball", price: 30, tags: ["sports"], aud: KT },
  { name: "Soccer ball", price: 28, tags: ["sports"], aud: KT },
  { name: "Yoga mat & blocks", price: 45, tags: ["wellness", "sports"], aud: NK },
  { name: "Cast-iron pan", price: 50, tags: ["home", "food", "tools"], aud: AS },
  { name: "Blender", price: 70, tags: ["home", "food", "wellness"], aud: AS },
  { name: "Insulated water bottle", price: 35, tags: ["outdoors", "wellness", "sports"], aud: ALL },
  { name: "Ukulele", price: 60, tags: ["music", "hobby"], aud: ALL },
  { name: "Set of acrylic paints", price: 45, tags: ["art", "hobby"], aud: ALL },
  { name: "Portable speaker", price: 85, tags: ["music", "tech"], aud: NK },
  { name: "Skincare set", price: 75, tags: ["beauty", "wellness"], aud: NK },
  { name: "Cologne", price: 90, tags: ["beauty", "fashion"], aud: A },
  { name: "Perfume", price: 90, tags: ["beauty", "fashion"], aud: A },
  { name: "Camping lantern", price: 45, tags: ["outdoors", "tools"], aud: NK },
  { name: "Cordless drill", price: 95, tags: ["tools", "home"], aud: AS },
  { name: "A year of a streaming service", price: 100, tags: ["tech"], aud: NK },
  { name: "Dinner-for-two voucher", price: 85, tags: ["food"], aud: AS },
  { name: "Concert tickets", price: 120, tags: ["music"], aud: NK },
  { name: "Cinema pass", price: 50, tags: ["art"], aud: NK },
  { name: "Weighted blanket", price: 70, tags: ["home", "wellness"], aud: NK },
  { name: "Aquarium starter kit", price: 65, tags: ["pets", "hobby"], aud: ALL },
  { name: "Dog toys & a big treat box", price: 32, tags: ["pets"], aud: ALL },
  { name: "Leather wallet", price: 60, tags: ["fashion"], aud: A },
  { name: "Silk scarf", price: 55, tags: ["fashion"], aud: AS },
  { name: "Binoculars", price: 75, tags: ["outdoors", "hobby"], aud: AS },
  { name: "Art print for the wall", price: 48, tags: ["art", "home"], aud: NK },
  { name: "Bicycle helmet & lights", price: 55, tags: ["sports", "outdoors"], aud: ALL },
  { name: "Skateboard", price: 90, tags: ["sports", "outdoors"], aud: T },
  { name: "Kids' scooter", price: 60, tags: ["sports", "toys"], aud: K },
  { name: "Dress-up costume box", price: 35, tags: ["toys", "art"], aud: K },
  { name: "Remote-control car", price: 45, tags: ["toys", "tech"], aud: K },
  { name: "Doll house", price: 70, tags: ["toys"], aud: K },
  { name: "Stuffed animal the size of a person", price: 50, tags: ["toys"], aud: K },
  // ---- premium ----
  { name: "Tablet", price: 320, tags: ["tech", "games"], aud: ALL },
  { name: "Smartwatch", price: 280, tags: ["tech", "wellness", "sports"], aud: NK },
  { name: "Noise-cancelling headphones", price: 300, tags: ["tech", "music"], aud: NK },
  { name: "Leather jacket", price: 260, tags: ["fashion"], aud: TA },
  { name: "Designer handbag", price: 420, tags: ["fashion"], aud: A },
  { name: "Espresso machine", price: 340, tags: ["home", "food"], aud: AS },
  { name: "Acoustic guitar", price: 300, tags: ["music", "hobby"], aud: ALL },
  { name: "Weekend getaway", price: 480, tags: ["travel"], aud: AS },
  { name: "Spa day", price: 240, tags: ["wellness", "beauty"], aud: AS },
  { name: "Mountain bike", price: 450, tags: ["sports", "outdoors"], aud: KT },
  { name: "Professional camera lens", price: 520, tags: ["tech", "art", "hobby"], aud: A },
  { name: "Hand-knit sweater from a local artisan", price: 180, tags: ["fashion", "art"], aud: AS },
  { name: "Cooking class for two", price: 200, tags: ["food", "hobby"], aud: A },
  { name: "Robotic vacuum", price: 380, tags: ["home", "tech"], aud: AS },
  { name: "Fishing rod & tackle set", price: 190, tags: ["outdoors", "hobby", "sports"], aud: AS },
  { name: "Gaming headset & controller", price: 260, tags: ["games", "tech"], aud: TA },
  { name: "Electric scooter", price: 400, tags: ["tech", "outdoors"], aud: T },
  { name: "Sewing machine", price: 230, tags: ["hobby", "art", "home"], aud: AS },
  { name: "Telescope", price: 350, tags: ["hobby", "tech", "outdoors"], aud: ALL },
  { name: "Ergonomic office chair", price: 360, tags: ["home", "tech", "wellness"], aud: AS },
  { name: "Rain-proof winter coat", price: 220, tags: ["fashion", "outdoors"], aud: ALL },
  { name: "Pair of expensive running shoes", price: 190, tags: ["sports", "fashion", "wellness"], aud: NK },
  // ---- luxe ----
  { name: "Gaming laptop", price: 1400, tags: ["tech", "games"], aud: TA },
  { name: "Laptop", price: 900, tags: ["tech"], aud: NK },
  { name: "Diamond earrings", price: 1600, tags: ["jewelry"], aud: A },
  { name: "Gold chain", price: 1200, tags: ["jewelry", "fashion"], aud: TA },
  { name: "Designer watch", price: 2400, tags: ["jewelry", "fashion"], aud: A },
  { name: "Trip abroad for two", price: 2800, tags: ["travel"], aud: AS },
  { name: "Weekend at a luxury resort", price: 1800, tags: ["travel", "wellness"], aud: AS },
  { name: "Full home-theatre setup", price: 2200, tags: ["tech", "home", "music"], aud: AS },
  { name: "Electric guitar & amp", price: 1100, tags: ["music", "hobby"], aud: TA },
  { name: "Custom-made suit / dress", price: 1500, tags: ["fashion"], aud: A },
  { name: "Puppy from a good breeder", price: 1300, tags: ["pets"], aud: ALL },
  { name: "Season tickets to their team", price: 1700, tags: ["sports"], aud: AS },
  { name: "A first edition of their favourite book", price: 950, tags: ["books", "art"], aud: A },
  { name: "Professional tool chest", price: 1400, tags: ["tools", "hobby"], aud: AS },
  { name: "Grand piano lessons for a year", price: 1250, tags: ["music", "art"], aud: ALL },
  { name: "Round-the-world cruise tickets", price: 3400, tags: ["travel"], aud: S },
  { name: "Motorized recliner", price: 900, tags: ["home", "wellness"], aud: S },
  { name: "Smart-home everything", price: 1600, tags: ["tech", "home"], aud: AS },
  { name: "Commissioned portrait", price: 1100, tags: ["art"], aud: AS },
  // ---- romantic (partners only) ----
  { name: "A dozen roses", price: 45, tags: ["home"], aud: TA, romantic: true },
  { name: "Handwritten love letter", price: 4, tags: ["books", "art"], aud: TA, romantic: true },
  { name: "Matching bracelets", price: 35, tags: ["jewelry"], aud: TA, romantic: true },
  { name: "Heart-shaped locket", price: 140, tags: ["jewelry"], aud: TA, romantic: true },
  { name: "A romantic dinner", price: 130, tags: ["food"], aud: A, romantic: true },
  { name: "Couples massage", price: 220, tags: ["wellness", "beauty"], aud: A, romantic: true },
  { name: "Silver necklace", price: 320, tags: ["jewelry"], aud: A, romantic: true },
  { name: "A stargazing picnic", price: 60, tags: ["outdoors", "food"], aud: TA, romantic: true },
  { name: "Custom star map of the night you met", price: 75, tags: ["art", "home"], aud: TA, romantic: true },
  { name: "Weekend away, just the two of you", price: 640, tags: ["travel"], aud: A, romantic: true },
  { name: "Handmade playlist & a mixed-tape box", price: 25, tags: ["music"], aud: T, romantic: true },
  { name: "Framed ticket stubs from your first date", price: 30, tags: ["art", "home"], aud: TA, romantic: true },
  { name: "Tiny gold ring", price: 900, tags: ["jewelry"], aud: A, romantic: true },
];
