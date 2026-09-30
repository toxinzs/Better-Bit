import { RegionKey } from "../types";

// What a country asks of newcomers and what its passport is worth. These are
// gameplay dials, not legal advice: `open` (0-1) is how welcoming its
// immigration system is, `passport` (0-100) is how many doors its passport
// opens, `entry` is the passport strength you need to visit without a visa.

export type LanguageKey = "english" | "spanish" | "portuguese" | "french" | "german" | "japanese" | "korean" | "hindi";

export const LANGUAGE_LABEL: Record<LanguageKey, string> = {
  english: "English", spanish: "Spanish", portuguese: "Portuguese", french: "French", german: "German", japanese: "Japanese", korean: "Korean", hindi: "Hindi",
};

export type CountryDef = {
  key: RegionKey;
  flag: string;
  demonym: string;
  language: LanguageKey;
  open: number;
  passport: number;
  entry: number;
  prYears: number; // years of legal residence before you can ask for permanent residence
  naturalizeYears: number; // years before citizenship
  langReq: number; // language level you need for citizenship
  dual: boolean; // does it let you keep another citizenship?
  holiday: boolean; // has a working-holiday scheme
  blurb: string;
};

export const COUNTRIES: Record<RegionKey, CountryDef> = {
  us: { key: "us", flag: "🇺🇸", demonym: "American", language: "english", open: 0.42, passport: 88, entry: 55, prYears: 3, naturalizeYears: 5, langReq: 60, dual: true, holiday: false, blurb: "Big opportunity, big paperwork. Work visas are a lottery and green cards take patience." },
  uk: { key: "uk", flag: "🇬🇧", demonym: "British", language: "english", open: 0.5, passport: 87, entry: 55, prYears: 5, naturalizeYears: 6, langReq: 60, dual: true, holiday: true, blurb: "Skilled-worker routes, expensive fees and a hard-won settled status." },
  nigeria: { key: "nigeria", flag: "🇳🇬", demonym: "Nigerian", language: "english", open: 0.3, passport: 30, entry: 20, prYears: 5, naturalizeYears: 15, langReq: 50, dual: true, holiday: false, blurb: "Lots of energy and opportunity; citizenship by residence takes a very long time." },
  japan: { key: "japan", flag: "🇯🇵", demonym: "Japanese", language: "japanese", open: 0.3, passport: 92, entry: 60, prYears: 10, naturalizeYears: 5, langReq: 75, dual: false, holiday: true, blurb: "Safe, orderly and demanding: the language matters and dual citizenship isn't allowed." },
  brazil: { key: "brazil", flag: "🇧🇷", demonym: "Brazilian", language: "portuguese", open: 0.65, passport: 74, entry: 40, prYears: 2, naturalizeYears: 4, langReq: 50, dual: true, holiday: false, blurb: "One of the easier places to settle, with a warm welcome for newcomers." },
  canada: { key: "canada", flag: "🇨🇦", demonym: "Canadian", language: "english", open: 0.82, passport: 86, entry: 52, prYears: 2, naturalizeYears: 3, langReq: 60, dual: true, holiday: true, blurb: "Points-based and welcoming. Study, work, then settle - the classic route." },
  australia: { key: "australia", flag: "🇦🇺", demonym: "Australian", language: "english", open: 0.72, passport: 85, entry: 52, prYears: 3, naturalizeYears: 4, langReq: 60, dual: true, holiday: true, blurb: "Skilled-worker demand, working holidays and long distances from everywhere." },
  germany: { key: "germany", flag: "🇩🇪", demonym: "German", language: "german", open: 0.62, passport: 93, entry: 55, prYears: 4, naturalizeYears: 6, langReq: 65, dual: true, holiday: true, blurb: "Engineers and nurses wanted. Bureaucracy is legendary, the language is the gate." },
  france: { key: "france", flag: "🇫🇷", demonym: "French", language: "french", open: 0.5, passport: 92, entry: 55, prYears: 5, naturalizeYears: 5, langReq: 65, dual: true, holiday: true, blurb: "Art, food and a great deal of paperwork, in French." },
  india: { key: "india", flag: "🇮🇳", demonym: "Indian", language: "hindi", open: 0.2, passport: 58, entry: 30, prYears: 8, naturalizeYears: 12, langReq: 55, dual: false, holiday: false, blurb: "Vast and fast-moving. Foreigners rarely become citizens; visas are for work and study." },
  mexico: { key: "mexico", flag: "🇲🇽", demonym: "Mexican", language: "spanish", open: 0.55, passport: 68, entry: 35, prYears: 4, naturalizeYears: 5, langReq: 55, dual: true, holiday: false, blurb: "Warm, affordable and friendly to remote workers and retirees." },
  southkorea: { key: "southkorea", flag: "🇰🇷", demonym: "Korean", language: "korean", open: 0.32, passport: 89, entry: 55, prYears: 5, naturalizeYears: 5, langReq: 70, dual: false, holiday: true, blurb: "Fast, competitive and connected. Korean is essential and dual citizenship is limited." },
};

export const country = (r: RegionKey | undefined): CountryDef => COUNTRIES[r ?? "us"];

// how much English (or the local language) a person picks up in school there
export const SCHOOL_ENGLISH: Record<RegionKey, number> = {
  us: 100, uk: 100, nigeria: 92, japan: 32, brazil: 32, canada: 100, australia: 100, germany: 62, france: 42, india: 85, mexico: 34, southkorea: 42,
};

export const openWord = (x: number) => (x >= 0.75 ? "Very welcoming" : x >= 0.55 ? "Welcoming" : x >= 0.4 ? "Selective" : x >= 0.28 ? "Strict" : "Very strict");
