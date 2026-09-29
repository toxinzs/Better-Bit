import { RegionKey } from "../types";

// Where in a country you live. `cost` scales rent, house prices and day-to-day
// living (1 = the country's average); `wage` scales pay; `safety` and `schools`
// are 0-100 and are read by crime/violence events and by school quality;
// `strengths` are job fields that have more openings here.

export type CityTier = "capital" | "big" | "mid" | "small";

export type City = {
  key: string;
  region: RegionKey;
  name: string;
  tier: CityTier;
  cost: number;
  wage: number;
  safety: number;
  schools: number;
  strengths: string[];
  blurb: string;
};

const C = (c: City) => c;

export const CITIES: City[] = [
  // ------------------------------------------------------------ United States
  C({ key: "us-newyork", region: "us", name: "New York", tier: "capital", cost: 1.55, wage: 1.25, safety: 58, schools: 68, strengths: ["Finance & Business", "Creative & Media"], blurb: "Loud, expensive and never asleep. Everyone is here to become someone." }),
  C({ key: "us-austin", region: "us", name: "Austin", tier: "big", cost: 1.1, wage: 1.1, safety: 64, schools: 70, strengths: ["Tech", "Creative & Media"], blurb: "Live music, start-ups and a growing skyline." }),
  C({ key: "us-chicago", region: "us", name: "Chicago", tier: "big", cost: 1.05, wage: 1.05, safety: 52, schools: 62, strengths: ["Finance & Business", "Logistics"], blurb: "Wind, deep-dish and a thousand corner offices." }),
  C({ key: "us-denver", region: "us", name: "Denver", tier: "mid", cost: 1.05, wage: 1.02, safety: 66, schools: 68, strengths: ["Outdoors & Trades", "Tech"], blurb: "Mountain views and a hiking-boot economy." }),
  C({ key: "us-dayton", region: "us", name: "Dayton", tier: "mid", cost: 0.75, wage: 0.9, safety: 55, schools: 55, strengths: ["Logistics", "Healthcare"], blurb: "Quiet rust-belt streets and rents that don't hurt." }),
  C({ key: "us-mapleton", region: "us", name: "Mapleton", tier: "small", cost: 0.65, wage: 0.8, safety: 84, schools: 72, strengths: ["Education & Care", "Retail & Service"], blurb: "One main street, one diner, everyone knows your name." }),
  // ------------------------------------------------------------ United Kingdom
  C({ key: "uk-london", region: "uk", name: "London", tier: "capital", cost: 1.6, wage: 1.3, safety: 55, schools: 66, strengths: ["Finance & Business", "Creative & Media"], blurb: "Enormous, mixed and eye-wateringly pricey." }),
  C({ key: "uk-manchester", region: "uk", name: "Manchester", tier: "big", cost: 0.95, wage: 1.0, safety: 56, schools: 62, strengths: ["Creative & Media", "Tech"], blurb: "Music, football and rain that builds character." }),
  C({ key: "uk-bristol", region: "uk", name: "Bristol", tier: "mid", cost: 1.05, wage: 1.02, safety: 66, schools: 68, strengths: ["Tech", "Creative & Media"], blurb: "Harbour-side, arty and full of cyclists." }),
  C({ key: "uk-leeds", region: "uk", name: "Leeds", tier: "mid", cost: 0.88, wage: 0.96, safety: 60, schools: 62, strengths: ["Finance & Business", "Retail & Service"], blurb: "A northern hub with a big student population." }),
  C({ key: "uk-cornwall", region: "uk", name: "Penzance", tier: "small", cost: 0.7, wage: 0.78, safety: 82, schools: 60, strengths: ["Food & Hospitality", "Outdoors & Trades"], blurb: "Cliffs, gulls and a summer tourist rush." }),
  // ------------------------------------------------------------ Nigeria
  C({ key: "ng-lagos", region: "nigeria", name: "Lagos", tier: "big", cost: 1.5, wage: 1.4, safety: 40, schools: 55, strengths: ["Finance & Business", "Creative & Media", "Logistics"], blurb: "A megacity of hustlers, traffic and unstoppable energy." }),
  C({ key: "ng-abuja", region: "nigeria", name: "Abuja", tier: "capital", cost: 1.3, wage: 1.25, safety: 62, schools: 66, strengths: ["Public Service", "Office & Admin"], blurb: "The planned capital: wide roads, ministries and calm." }),
  C({ key: "ng-ibadan", region: "nigeria", name: "Ibadan", tier: "mid", cost: 0.8, wage: 0.85, safety: 58, schools: 62, strengths: ["Education & Care", "Healthcare"], blurb: "Sprawling and scholarly, home to a great university." }),
  C({ key: "ng-kano", region: "nigeria", name: "Kano", tier: "big", cost: 0.75, wage: 0.85, safety: 50, schools: 48, strengths: ["Retail & Service", "Logistics"], blurb: "An ancient trading city with a famous market." }),
  C({ key: "ng-enugu", region: "nigeria", name: "Enugu", tier: "mid", cost: 0.7, wage: 0.8, safety: 64, schools: 60, strengths: ["Outdoors & Trades", "Education & Care"], blurb: "Green hills and a slower rhythm." }),
  // ------------------------------------------------------------ Japan
  C({ key: "jp-tokyo", region: "japan", name: "Tokyo", tier: "capital", cost: 1.5, wage: 1.25, safety: 92, schools: 80, strengths: ["Tech", "Finance & Business", "Creative & Media"], blurb: "Neon, trains that run to the second, and a very small flat." }),
  C({ key: "jp-osaka", region: "japan", name: "Osaka", tier: "big", cost: 1.05, wage: 1.05, safety: 88, schools: 76, strengths: ["Food & Hospitality", "Retail & Service"], blurb: "Loud, funny and obsessed with food." }),
  C({ key: "jp-nagoya", region: "japan", name: "Nagoya", tier: "mid", cost: 0.95, wage: 1.02, safety: 90, schools: 74, strengths: ["Outdoors & Trades", "Logistics"], blurb: "Factories, castles and the car industry." }),
  C({ key: "jp-sapporo", region: "japan", name: "Sapporo", tier: "mid", cost: 0.85, wage: 0.95, safety: 92, schools: 72, strengths: ["Food & Hospitality", "Healthcare"], blurb: "Snow, ramen and beer." }),
  C({ key: "jp-kanazawa", region: "japan", name: "Kanazawa", tier: "small", cost: 0.75, wage: 0.85, safety: 95, schools: 74, strengths: ["Creative & Media", "Retail & Service"], blurb: "Preserved streets and craft workshops." }),
  // ------------------------------------------------------------ Brazil
  C({ key: "br-saopaulo", region: "brazil", name: "São Paulo", tier: "big", cost: 1.4, wage: 1.3, safety: 42, schools: 62, strengths: ["Finance & Business", "Tech"], blurb: "Concrete forever, and the country's money." }),
  C({ key: "br-rio", region: "brazil", name: "Rio de Janeiro", tier: "big", cost: 1.3, wage: 1.1, safety: 38, schools: 58, strengths: ["Creative & Media", "Food & Hospitality"], blurb: "Beaches, hills, samba and a very uneven city." }),
  C({ key: "br-brasilia", region: "brazil", name: "Brasília", tier: "capital", cost: 1.2, wage: 1.2, safety: 55, schools: 68, strengths: ["Public Service", "Office & Admin"], blurb: "A modernist capital designed from scratch." }),
  C({ key: "br-curitiba", region: "brazil", name: "Curitiba", tier: "mid", cost: 0.95, wage: 1.0, safety: 56, schools: 66, strengths: ["Tech", "Logistics"], blurb: "Tidy, green and famous for its buses." }),
  C({ key: "br-salvador", region: "brazil", name: "Salvador", tier: "mid", cost: 0.8, wage: 0.85, safety: 45, schools: 52, strengths: ["Food & Hospitality", "Creative & Media"], blurb: "Music, colonial streets and warm nights." }),
  // ------------------------------------------------------------ Canada
  C({ key: "ca-toronto", region: "canada", name: "Toronto", tier: "big", cost: 1.4, wage: 1.15, safety: 72, schools: 74, strengths: ["Finance & Business", "Tech"], blurb: "Glass towers and every language in the world." }),
  C({ key: "ca-vancouver", region: "canada", name: "Vancouver", tier: "big", cost: 1.5, wage: 1.1, safety: 68, schools: 74, strengths: ["Creative & Media", "Tech"], blurb: "Mountains, sea and a housing market from another planet." }),
  C({ key: "ca-ottawa", region: "canada", name: "Ottawa", tier: "capital", cost: 1.05, wage: 1.05, safety: 78, schools: 76, strengths: ["Public Service", "Tech"], blurb: "Government, canals and skating to work in winter." }),
  C({ key: "ca-calgary", region: "canada", name: "Calgary", tier: "mid", cost: 0.98, wage: 1.08, safety: 70, schools: 72, strengths: ["Outdoors & Trades", "Finance & Business"], blurb: "Oil money, Stampede boots and the Rockies on the horizon." }),
  C({ key: "ca-halifax", region: "canada", name: "Halifax", tier: "small", cost: 0.8, wage: 0.85, safety: 76, schools: 68, strengths: ["Healthcare", "Food & Hospitality"], blurb: "Harbour town with friendly pubs and fog." }),
  // ------------------------------------------------------------ Australia
  C({ key: "au-sydney", region: "australia", name: "Sydney", tier: "big", cost: 1.5, wage: 1.2, safety: 74, schools: 74, strengths: ["Finance & Business", "Creative & Media"], blurb: "The Opera House, the harbour and rent you feel in your teeth." }),
  C({ key: "au-melbourne", region: "australia", name: "Melbourne", tier: "big", cost: 1.25, wage: 1.12, safety: 72, schools: 76, strengths: ["Creative & Media", "Education & Care"], blurb: "Laneway cafés, four seasons in a day." }),
  C({ key: "au-canberra", region: "australia", name: "Canberra", tier: "capital", cost: 1.1, wage: 1.15, safety: 82, schools: 78, strengths: ["Public Service", "Office & Admin"], blurb: "Purpose-built capital: roundabouts and departments." }),
  C({ key: "au-perth", region: "australia", name: "Perth", tier: "mid", cost: 1.05, wage: 1.15, safety: 70, schools: 70, strengths: ["Outdoors & Trades", "Logistics"], blurb: "Sunshine and the mining boom, very far from everywhere else." }),
  C({ key: "au-darwin", region: "australia", name: "Darwin", tier: "small", cost: 0.9, wage: 1.05, safety: 58, schools: 58, strengths: ["Outdoors & Trades", "Public Service"], blurb: "Tropical top end: crocs, storms and the wet season." }),
  // ------------------------------------------------------------ Germany
  C({ key: "de-berlin", region: "germany", name: "Berlin", tier: "capital", cost: 1.15, wage: 1.0, safety: 68, schools: 68, strengths: ["Creative & Media", "Tech"], blurb: "Cheap-ish, edgy, arty and up all night." }),
  C({ key: "de-munich", region: "germany", name: "Munich", tier: "big", cost: 1.4, wage: 1.2, safety: 84, schools: 82, strengths: ["Finance & Business", "Tech"], blurb: "Prosperous, tidy and full of car-makers." }),
  C({ key: "de-hamburg", region: "germany", name: "Hamburg", tier: "big", cost: 1.2, wage: 1.1, safety: 76, schools: 74, strengths: ["Logistics", "Creative & Media"], blurb: "Port city with canals and grey skies." }),
  C({ key: "de-leipzig", region: "germany", name: "Leipzig", tier: "mid", cost: 0.85, wage: 0.9, safety: 70, schools: 70, strengths: ["Creative & Media", "Logistics"], blurb: "The affordable up-and-comer." }),
  C({ key: "de-freiburg", region: "germany", name: "Freiburg", tier: "small", cost: 0.95, wage: 0.95, safety: 86, schools: 80, strengths: ["Education & Care", "Outdoors & Trades"], blurb: "Green, cycle-mad university town at the Black Forest." }),
  // ------------------------------------------------------------ France
  C({ key: "fr-paris", region: "france", name: "Paris", tier: "capital", cost: 1.55, wage: 1.25, safety: 60, schools: 72, strengths: ["Finance & Business", "Creative & Media"], blurb: "Cafés, ateliers and studio flats up six flights of stairs." }),
  C({ key: "fr-lyon", region: "france", name: "Lyon", tier: "big", cost: 1.05, wage: 1.05, safety: 66, schools: 72, strengths: ["Food & Hospitality", "Tech"], blurb: "The gastronomic capital, and a rising tech hub." }),
  C({ key: "fr-marseille", region: "france", name: "Marseille", tier: "big", cost: 0.92, wage: 0.95, safety: 48, schools: 58, strengths: ["Logistics", "Food & Hospitality"], blurb: "Port, sun and bouillabaisse; rough at the edges." }),
  C({ key: "fr-toulouse", region: "france", name: "Toulouse", tier: "mid", cost: 0.95, wage: 1.02, safety: 68, schools: 72, strengths: ["Tech", "Outdoors & Trades"], blurb: "The pink city, with the planes built next door." }),
  C({ key: "fr-annecy", region: "france", name: "Annecy", tier: "small", cost: 0.9, wage: 0.95, safety: 88, schools: 74, strengths: ["Food & Hospitality", "Outdoors & Trades"], blurb: "Alpine lake town, postcard-pretty and popular." }),
  // ------------------------------------------------------------ India
  C({ key: "in-mumbai", region: "india", name: "Mumbai", tier: "big", cost: 1.6, wage: 1.4, safety: 62, schools: 66, strengths: ["Finance & Business", "Creative & Media"], blurb: "Dreams, local trains and the priciest square metre in the country." }),
  C({ key: "in-delhi", region: "india", name: "New Delhi", tier: "capital", cost: 1.3, wage: 1.25, safety: 52, schools: 68, strengths: ["Public Service", "Office & Admin"], blurb: "Old streets and new ministries, with smog in winter." }),
  C({ key: "in-bengaluru", region: "india", name: "Bengaluru", tier: "big", cost: 1.25, wage: 1.35, safety: 64, schools: 72, strengths: ["Tech", "Education & Care"], blurb: "The tech capital: start-ups, traffic and good coffee." }),
  C({ key: "in-jaipur", region: "india", name: "Jaipur", tier: "mid", cost: 0.8, wage: 0.85, safety: 62, schools: 60, strengths: ["Retail & Service", "Food & Hospitality"], blurb: "The pink city: forts, crafts and tourists." }),
  C({ key: "in-mysuru", region: "india", name: "Mysuru", tier: "small", cost: 0.65, wage: 0.75, safety: 78, schools: 66, strengths: ["Education & Care", "Healthcare"], blurb: "Palaces, yoga and unhurried streets." }),
  // ------------------------------------------------------------ Mexico
  C({ key: "mx-cdmx", region: "mexico", name: "Mexico City", tier: "capital", cost: 1.4, wage: 1.3, safety: 46, schools: 64, strengths: ["Finance & Business", "Creative & Media"], blurb: "Vast, high-altitude and endlessly alive." }),
  C({ key: "mx-guadalajara", region: "mexico", name: "Guadalajara", tier: "big", cost: 1.05, wage: 1.1, safety: 54, schools: 66, strengths: ["Tech", "Creative & Media"], blurb: "Mariachi, tequila and a growing tech scene." }),
  C({ key: "mx-monterrey", region: "mexico", name: "Monterrey", tier: "big", cost: 1.1, wage: 1.2, safety: 55, schools: 70, strengths: ["Outdoors & Trades", "Finance & Business"], blurb: "Industrial, mountain-ringed and wealthy." }),
  C({ key: "mx-merida", region: "mexico", name: "Mérida", tier: "mid", cost: 0.8, wage: 0.85, safety: 76, schools: 62, strengths: ["Food & Hospitality", "Retail & Service"], blurb: "Colonial and calm, one of the safest big towns." }),
  C({ key: "mx-oaxaca", region: "mexico", name: "Oaxaca", tier: "small", cost: 0.65, wage: 0.7, safety: 66, schools: 52, strengths: ["Food & Hospitality", "Creative & Media"], blurb: "Crafts, mole and mountain villages." }),
  // ------------------------------------------------------------ South Korea
  C({ key: "kr-seoul", region: "southkorea", name: "Seoul", tier: "capital", cost: 1.4, wage: 1.25, safety: 86, schools: 82, strengths: ["Tech", "Creative & Media", "Finance & Business"], blurb: "24-hour, high-speed and fiercely competitive." }),
  C({ key: "kr-busan", region: "southkorea", name: "Busan", tier: "big", cost: 1.0, wage: 1.02, safety: 84, schools: 76, strengths: ["Logistics", "Food & Hospitality"], blurb: "The port city with the beaches and the seafood." }),
  C({ key: "kr-daejeon", region: "southkorea", name: "Daejeon", tier: "mid", cost: 0.88, wage: 1.0, safety: 86, schools: 78, strengths: ["Tech", "Education & Care"], blurb: "Science-park city of research labs." }),
  C({ key: "kr-jeju", region: "southkorea", name: "Jeju", tier: "small", cost: 0.85, wage: 0.85, safety: 90, schools: 68, strengths: ["Food & Hospitality", "Outdoors & Trades"], blurb: "Volcanic island with tangerines and holiday flats." }),
  C({ key: "kr-gwangju", region: "southkorea", name: "Gwangju", tier: "mid", cost: 0.8, wage: 0.9, safety: 86, schools: 74, strengths: ["Creative & Media", "Public Service"], blurb: "A proud, arty southern city." }),
];

export const citiesFor = (region: RegionKey | undefined): City[] => CITIES.filter((c) => c.region === (region ?? "us"));
export const cityByKey = (key?: string): City | undefined => (key ? CITIES.find((c) => c.key === key) : undefined);

// the "default" city for a country when a character has none (old saves): a mid-tier one
export const defaultCityFor = (region: RegionKey | undefined): City => {
  const list = citiesFor(region);
  return list.find((c) => c.tier === "mid") ?? list[0] ?? CITIES[0];
};

// weights for where a newborn is born: big cities are more likely
export const CITY_BIRTH_WEIGHT: Record<CityTier, number> = { capital: 3, big: 3, mid: 2.5, small: 1.5 };

export const TIER_LABEL: Record<CityTier, string> = { capital: "Capital", big: "Big city", mid: "Mid-size city", small: "Small town" };
