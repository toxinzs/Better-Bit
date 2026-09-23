import { Gender, RegionKey } from "../types";

export type NamePool = {
  male: string[];
  female: string[];
  neutral: string[];
  last: string[];
};

export const NAME_POOLS: Record<RegionKey, NamePool> = {
  us: {
    male: [
      "James", "Michael", "Daniel", "Marcus", "Andre", "Elijah", "Noah",
      "Malik", "Ethan", "Jayden", "Isaiah", "Omar", "Lucas", "Xavier",
      "Anthony", "David", "Jordan", "Kevin",
    ],
    female: [
      "Amara", "Sophia", "Aaliyah", "Maya", "Zoe", "Destiny", "Jasmine",
      "Nia", "Layla", "Chloe", "Imani", "Serenity", "Camille", "Aria",
      "Jada", "Mia", "Alexis", "Brianna",
    ],
    neutral: ["River", "Quinn", "Sage", "Rowan", "Skyler", "Phoenix", "Ari"],
    last: [
      "Johnson", "Williams", "Brooks", "Carter", "Bennett", "Reyes",
      "Coleman", "Diallo", "Okafor", "Price", "Sinclair", "Harmon",
      "Mercer", "Alston", "Whitfield", "Rodriguez", "Nguyen", "Kim",
    ],
  },
  uk: {
    male: [
      "Oliver", "George", "Harry", "Jack", "Charlie", "Thomas", "Freddie",
      "Alfie", "William", "Archie", "Leo", "Arthur", "Oscar", "Reuben",
      "Finley", "Jamie", "Callum", "Rhys",
    ],
    female: [
      "Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophia", "Grace",
      "Lily", "Freya", "Charlotte", "Poppy", "Evie", "Willow", "Daisy",
      "Ruby", "Phoebe", "Elsie", "Matilda",
    ],
    neutral: ["Alex", "Charlie", "Jordan", "Robin", "Frankie", "Morgan", "Ashley"],
    last: [
      "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson",
      "Johnson", "Davies", "Evans", "Thomas", "Roberts", "Walker",
      "Wright", "Robinson", "Thompson", "White", "Hughes", "Edwards",
    ],
  },
  nigeria: {
    male: [
      "Chinedu", "Oluwaseun", "Emeka", "Babajide", "Ikenna", "Tunde",
      "Chibuike", "Ayodele", "Obinna", "Femi", "Segun", "Uchenna",
      "Kelechi", "Damilare", "Chidi", "Olamide", "Nnamdi", "Gbenga",
    ],
    female: [
      "Chiamaka", "Ngozi", "Adaeze", "Folake", "Amarachi", "Yetunde",
      "Chidinma", "Adaobi", "Ifeoma", "Zainab", "Temitope", "Bukola",
      "Nkechi", "Aisha", "Olamide", "Funmilayo", "Ejiro", "Chinyere",
    ],
    neutral: ["Tobi", "Uche", "Chidi", "Ndidi", "Kemi", "Simi", "Ike"],
    last: [
      "Okafor", "Adeyemi", "Eze", "Balogun", "Nwosu", "Okonkwo",
      "Abubakar", "Chukwu", "Adebayo", "Ibrahim", "Okoro", "Afolabi",
      "Ogunleye", "Nnaji", "Musa", "Oladipo", "Eneh", "Bello",
    ],
  },
  japan: {
    male: [
      "Haruto", "Sota", "Yuto", "Ren", "Riku", "Sora", "Kaito",
      "Yuki", "Hayato", "Tsubasa", "Kenji", "Takumi", "Daiki", "Shota",
      "Ryo", "Kazuki", "Naoki", "Yamato",
    ],
    female: [
      "Yui", "Aoi", "Hina", "Sakura", "Yuna", "Mei", "Rin",
      "Akari", "Koharu", "Himari", "Nanami", "Saki", "Miyu", "Kokoro",
      "Ayaka", "Riko", "Hana", "Yume",
    ],
    neutral: ["Hikaru", "Kaoru", "Makoto", "Tsukasa", "Akira", "Sora", "Yuu"],
    last: [
      "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito",
      "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada",
      "Sasaki", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Saito",
    ],
  },
  brazil: {
    male: [
      "Gabriel", "Miguel", "Arthur", "Heitor", "Davi", "Lorenzo",
      "Theo", "Pedro", "Gustavo", "Rafael", "Bernardo", "Enzo",
      "Matheus", "Bruno", "Caio", "Vinicius", "Thiago", "Felipe",
    ],
    female: [
      "Alice", "Sophia", "Helena", "Valentina", "Laura", "Isabella",
      "Manuela", "Julia", "Heloisa", "Luiza", "Beatriz", "Larissa",
      "Camila", "Fernanda", "Livia", "Marina", "Giovanna", "Yasmin",
    ],
    neutral: ["Ariel", "Noah", "Kauã", "Emanuel", "Guilherme", "Sol", "Ivi"],
    last: [
      "Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira",
      "Almeida", "Rodrigues", "Ferreira", "Carvalho", "Gomes", "Martins",
      "Araujo", "Melo", "Barbosa", "Ribeiro", "Alves", "Monteiro",
    ],
  },
};

export function randomFirstName(gender: Gender, region: RegionKey = "us"): string {
  const pools = NAME_POOLS[region];
  const pool = gender === "male" ? pools.male : gender === "female" ? pools.female : pools.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomLastName(region: RegionKey = "us"): string {
  const pool = NAME_POOLS[region].last;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomFullName(region: RegionKey = "us", lastName?: string): string {
  const genders: Gender[] = ["male", "female", "nonbinary"];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  return `${randomFirstName(gender, region)} ${lastName ?? randomLastName(region)}`;
}
