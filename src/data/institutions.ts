import { DegreeLevel, RegionKey } from "../types";

// Where you can study. Costs are yearly tuition in game dollars for that
// country. `bar` is how strong an application must be (0-100): open-access
// places sit low, the elite ones near the top. Trade schools take anyone with
// a school-leaving qualification and teach a specific job.

export type InstTier = "community" | "state" | "private" | "elite" | "tech" | "online" | "trade";

export type Institution = {
  id: string;
  name: string;
  region: RegionKey;
  tier: InstTier;
  cost: number; // per year
  years: number; // length of an undergraduate degree
  bar: number; // 0-100 admissions bar
  prestige: number; // 0-100
  blurb: string;
  online?: boolean;
  trade?: boolean;
  needsExam?: boolean;
  housing: boolean; // campus housing available
  probationGpa: number;
};

const I = (i: Institution) => i;

export const INSTITUTIONS: Institution[] = [
  // ------------------------------------------------------------ United States
  I({ id: "us-riverside", name: "Riverside Community College", region: "us", tier: "community", cost: 3500, years: 2, bar: 12, prestige: 22, blurb: "Open doors, low fees, and a well-trodden path to transfer.", housing: false, probationGpa: 1.2 }),
  I({ id: "us-state", name: "State University", region: "us", tier: "state", cost: 12000, years: 4, bar: 42, prestige: 52, blurb: "Big lecture halls, a big football team and something for everyone.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "us-lakeshore", name: "Lakeshore State University", region: "us", tier: "state", cost: 10500, years: 4, bar: 36, prestige: 46, blurb: "A friendly lakeside campus with a strong nursing and education record.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "us-metro", name: "Metro City University", region: "us", tier: "state", cost: 9500, years: 4, bar: 30, prestige: 40, blurb: "Commuter-friendly, in the middle of the city, full of working students.", housing: false, needsExam: true, probationGpa: 1.7 }),
  I({ id: "us-coastal", name: "Coastal Tech Institute", region: "us", tier: "tech", cost: 27000, years: 4, bar: 70, prestige: 78, blurb: "Engineers, coders and start-ups. Brutal workload, brilliant network.", housing: true, needsExam: true, probationGpa: 2.3 }),
  I({ id: "us-heritage", name: "Heritage Liberal Arts College", region: "us", tier: "private", cost: 34000, years: 4, bar: 55, prestige: 64, blurb: "Small seminars, generous professors and a woodland campus.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "us-ashford", name: "Ashford Private University", region: "us", tier: "private", cost: 32000, years: 4, bar: 58, prestige: 68, blurb: "Old brick, deep pockets and a serious alumni network.", housing: true, needsExam: true, probationGpa: 2.2 }),
  I({ id: "us-northbridge", name: "Northbridge University", region: "us", tier: "elite", cost: 58000, years: 4, bar: 90, prestige: 96, blurb: "One of the most selective universities in the country. Doors open when you say you went here.", housing: true, needsExam: true, probationGpa: 2.8 }),
  I({ id: "us-pacific-online", name: "Pacific Online University", region: "us", tier: "online", cost: 6500, years: 4, bar: 8, prestige: 24, blurb: "Study from your bedroom. Flexible, cheap, and easy to fall behind.", housing: false, online: true, probationGpa: 1.5 }),
  I({ id: "us-ironworks", name: "Ironworks Technical College", region: "us", tier: "trade", cost: 6000, years: 2, bar: 10, prestige: 30, blurb: "Hands-on trade programmes with employer links.", housing: false, trade: true, probationGpa: 1.2 }),
  // ------------------------------------------------------------ United Kingdom
  I({ id: "uk-brookfield", name: "Brookfield College", region: "uk", tier: "community", cost: 3000, years: 2, bar: 12, prestige: 24, blurb: "A further-education college with foundation degrees and a fresh start.", housing: false, probationGpa: 1.2 }),
  I({ id: "uk-marlow", name: "University of Marlow", region: "uk", tier: "state", cost: 9250, years: 3, bar: 44, prestige: 54, blurb: "A solid red-brick university in a lively market town.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "uk-northshire", name: "Northshire University", region: "uk", tier: "state", cost: 9250, years: 3, bar: 38, prestige: 48, blurb: "Big student union, big rugby club, big on nursing and engineering.", housing: true, needsExam: true, probationGpa: 1.7 }),
  I({ id: "uk-thames", name: "Thames Metropolitan University", region: "uk", tier: "state", cost: 9250, years: 3, bar: 30, prestige: 40, blurb: "Diverse, in the capital, and cheaper if you live at home.", housing: false, needsExam: true, probationGpa: 1.7 }),
  I({ id: "uk-castleford", name: "Castleford University", region: "uk", tier: "private", cost: 9250, years: 3, bar: 68, prestige: 76, blurb: "A research-heavy university with a reputation for excellence.", housing: true, needsExam: true, probationGpa: 2.2 }),
  I({ id: "uk-kingsmere", name: "Kingsmere University", region: "uk", tier: "elite", cost: 9250, years: 3, bar: 90, prestige: 97, blurb: "Spires, tutorials and the most competitive interviews in the country.", housing: true, needsExam: true, probationGpa: 2.8 }),
  I({ id: "uk-open", name: "Open Learning UK", region: "uk", tier: "online", cost: 5500, years: 4, bar: 8, prestige: 26, blurb: "Distance learning for people with lives to fit around.", housing: false, online: true, probationGpa: 1.5 }),
  I({ id: "uk-norton", name: "Norton Technical Institute", region: "uk", tier: "trade", cost: 4500, years: 2, bar: 10, prestige: 30, blurb: "Apprenticeship and technical programmes with local employers.", housing: false, trade: true, probationGpa: 1.2 }),
  // ------------------------------------------------------------ Nigeria
  I({ id: "ng-poly", name: "Ogun Federal Polytechnic", region: "nigeria", tier: "community", cost: 400, years: 2, bar: 18, prestige: 28, blurb: "Practical diplomas at a fraction of the cost of a university.", housing: true, probationGpa: 1.2 }),
  I({ id: "ng-kaduna", name: "Kaduna Central University", region: "nigeria", tier: "state", cost: 700, years: 4, bar: 44, prestige: 50, blurb: "A large federal university. Cheap fees, crowded halls, strong alumni.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "ng-southwest", name: "Southwest Federal University", region: "nigeria", tier: "elite", cost: 900, years: 4, bar: 82, prestige: 88, blurb: "One of the most sought-after universities in the country. Cut-off marks are brutal.", housing: true, needsExam: true, probationGpa: 2.4 }),
  I({ id: "ng-unity", name: "Unity State University", region: "nigeria", tier: "state", cost: 600, years: 4, bar: 34, prestige: 42, blurb: "A regional state university with a friendly campus.", housing: true, needsExam: true, probationGpa: 1.7 }),
  I({ id: "ng-lekki", name: "Lekki Private University", region: "nigeria", tier: "private", cost: 4500, years: 4, bar: 46, prestige: 64, blurb: "Modern, expensive and uninterrupted by strikes.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "ng-nou", name: "National Open Learning Institute", region: "nigeria", tier: "online", cost: 350, years: 4, bar: 8, prestige: 22, blurb: "Open and distance learning for those who work.", housing: false, online: true, probationGpa: 1.5 }),
  I({ id: "ng-tech", name: "Federal Technical College", region: "nigeria", tier: "trade", cost: 300, years: 2, bar: 10, prestige: 26, blurb: "Vocational training in trades and technical skills.", housing: false, trade: true, probationGpa: 1.2 }),
  // ------------------------------------------------------------ Japan
  I({ id: "jp-junior", name: "Tokyo Metropolitan Junior College", region: "japan", tier: "community", cost: 6000, years: 2, bar: 20, prestige: 30, blurb: "Two-year courses, particularly popular for design, care and business.", housing: false, probationGpa: 1.3 }),
  I({ id: "jp-kanto", name: "Kanto National University", region: "japan", tier: "state", cost: 5300, years: 4, bar: 62, prestige: 74, blurb: "A national university - low fees, brutal exams, real prestige.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "jp-keiyo", name: "Keiyo University", region: "japan", tier: "private", cost: 13000, years: 4, bar: 56, prestige: 68, blurb: "A famous private university with a legendary alumni network.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "jp-sakura", name: "Sakura Imperial University", region: "japan", tier: "elite", cost: 5300, years: 4, bar: 92, prestige: 98, blurb: "The most prestigious university in the country. Its entrance exam is a national event.", housing: true, needsExam: true, probationGpa: 2.8 }),
  I({ id: "jp-kansai", name: "Kansai Technical Institute", region: "japan", tier: "tech", cost: 10000, years: 4, bar: 58, prestige: 66, blurb: "Robotics, materials and industry links.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "jp-open", name: "Nihon Open University", region: "japan", tier: "online", cost: 3500, years: 4, bar: 8, prestige: 26, blurb: "Broadcast and online study for adult learners.", housing: false, online: true, probationGpa: 1.5 }),
  I({ id: "jp-senmon", name: "Senmon Vocational School", region: "japan", tier: "trade", cost: 8000, years: 2, bar: 10, prestige: 32, blurb: "Two-year specialist schools for chefs, designers, nurses and technicians.", housing: false, trade: true, probationGpa: 1.2 }),
  // ------------------------------------------------------------ Brazil
  I({ id: "br-cerrado", name: "Universidade Federal do Cerrado", region: "brazil", tier: "state", cost: 0, years: 4, bar: 62, prestige: 66, blurb: "Free public university. The competition for a seat is fierce.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "br-litoral", name: "Universidade Estadual do Litoral", region: "brazil", tier: "state", cost: 0, years: 4, bar: 54, prestige: 58, blurb: "State-funded and well regarded. Big waiting lists.", housing: true, needsExam: true, probationGpa: 1.8 }),
  I({ id: "br-aurora", name: "PUC Aurora", region: "brazil", tier: "private", cost: 7500, years: 4, bar: 40, prestige: 58, blurb: "A respected private university with a good campus and generous scholarships.", housing: true, needsExam: true, probationGpa: 2.0 }),
  I({ id: "br-paulista", name: "Universidade Paulista Central", region: "brazil", tier: "elite", cost: 0, years: 4, bar: 88, prestige: 94, blurb: "Free, world-class and almost impossible to get into.", housing: true, needsExam: true, probationGpa: 2.6 }),
  I({ id: "br-aberta", name: "Universidade Aberta", region: "brazil", tier: "online", cost: 1800, years: 4, bar: 8, prestige: 24, blurb: "Distance learning with weekend meetups.", housing: false, online: true, probationGpa: 1.5 }),
  I({ id: "br-tecnico", name: "Instituto Técnico Federal", region: "brazil", tier: "trade", cost: 0, years: 2, bar: 20, prestige: 34, blurb: "Free technical training in trades and technology.", housing: false, trade: true, probationGpa: 1.2 }),
];

export const institutionsFor = (region: RegionKey | undefined) => INSTITUTIONS.filter((i) => i.region === (region ?? "us"));
export const institutionById = (id: string) => INSTITUTIONS.find((i) => i.id === id);
export const institutionByName = (name?: string) => INSTITUTIONS.find((i) => i.name === name);

// housing options, in the order a student would pick them
export const HOUSING = [
  { key: "dorm" as const, label: "Halls / dorm", costPerYear: 9000 },
  { key: "greek" as const, label: "Greek house", costPerYear: 7000 },
  { key: "apartment" as const, label: "Off-campus flat", costPerYear: 11000 },
  { key: "commute" as const, label: "Live at home", costPerYear: 0 },
];

// ---------------------------------------------------------------- trade and grad programmes

export type Programme = {
  key: string;
  label: string;
  level: DegreeLevel;
  years: number;
  cost: number; // tuition per year multiplier on the school's base cost (1 = same)
  minGpa: number;
  fieldNote: string;
  needsMajorField?: string[]; // majors you must hold a bachelor's in
  blurb: string;
  wage?: number; // apprenticeships pay
  jobs?: string[]; // job titles it helps with
};

export const TRADE_PROGRAMMES: Programme[] = [
  { key: "electrical", label: "Electrical Installation", level: "certificate", years: 2, cost: 1, minGpa: 1.5, fieldNote: "Outdoors & Trades", blurb: "Wiring, safety codes and testing.", jobs: ["Electrician"] },
  { key: "plumbing", label: "Plumbing & Heating", level: "certificate", years: 2, cost: 1, minGpa: 1.3, fieldNote: "Outdoors & Trades", blurb: "Pipes, boilers and callouts.", jobs: ["Plumber"] },
  { key: "carpentry", label: "Carpentry & Joinery", level: "certificate", years: 2, cost: 1, minGpa: 1.2, fieldNote: "Outdoors & Trades", blurb: "Timber, tools and craft.", jobs: ["Carpenter"] },
  { key: "welding", label: "Welding & Fabrication", level: "certificate", years: 1, cost: 1, minGpa: 1.2, fieldNote: "Outdoors & Trades", blurb: "Metal, heat and certified joints.", jobs: ["Welder"] },
  { key: "automotive", label: "Automotive Technology", level: "certificate", years: 2, cost: 1, minGpa: 1.3, fieldNote: "Outdoors & Trades", blurb: "Engines, electrics and diagnostics.", jobs: ["Auto Mechanic"] },
  { key: "culinary", label: "Culinary Arts", level: "certificate", years: 2, cost: 1, minGpa: 1.2, fieldNote: "Food & Hospitality", blurb: "Knife skills, stations and service.", jobs: ["Chef", "Line Cook"] },
  { key: "nursing-cert", label: "Nursing Assistant", level: "certificate", years: 1, cost: 0.8, minGpa: 1.8, fieldNote: "Healthcare", blurb: "Patient care and clinical basics.", jobs: ["Nursing Assistant"] },
  { key: "it-support", label: "IT Support & Networking", level: "certificate", years: 1, cost: 0.9, minGpa: 1.5, fieldNote: "Tech", blurb: "Hardware, networks and help desks.", jobs: ["IT Support Technician"] },
  { key: "apprentice-elec", label: "Electrician Apprenticeship", level: "certificate", years: 3, cost: 0, minGpa: 1.5, fieldNote: "Outdoors & Trades", blurb: "Earn while you learn on real job sites.", wage: 14000, jobs: ["Electrician"] },
  { key: "apprentice-plumb", label: "Plumbing Apprenticeship", level: "certificate", years: 3, cost: 0, minGpa: 1.3, fieldNote: "Outdoors & Trades", blurb: "Earn while you learn alongside a master plumber.", wage: 13000, jobs: ["Plumber"] },
];

export const GRAD_PROGRAMMES: Programme[] = [
  { key: "masters", label: "Master's degree", level: "master", years: 2, cost: 1.15, minGpa: 2.8, fieldNote: "in your field", blurb: "Specialise and step up a salary band.", },
  { key: "mba", label: "MBA", level: "master", years: 2, cost: 1.6, minGpa: 3.0, fieldNote: "Business", blurb: "Networks, case studies and access to the boardroom.", },
  { key: "law", label: "Law degree (JD / LLB)", level: "professional", years: 3, cost: 1.5, minGpa: 3.3, fieldNote: "Law", blurb: "Required to practise as a lawyer.", jobs: ["Lawyer"] },
  { key: "medicine", label: "Medical degree", level: "professional", years: 4, cost: 1.9, minGpa: 3.6, fieldNote: "Medicine", needsMajorField: ["Biology", "Medicine", "Nursing", "Psychology", "Pharmacy"], blurb: "The road to becoming a doctor.", jobs: ["Doctor"] },
  { key: "pharmd", label: "Pharmacy doctorate", level: "professional", years: 3, cost: 1.4, minGpa: 3.2, fieldNote: "Pharmacy", needsMajorField: ["Biology", "Pharmacy", "Nursing"], blurb: "Required to practise as a pharmacist.", jobs: ["Pharmacist"] },
  { key: "teaching", label: "Teaching qualification", level: "master", years: 1, cost: 0.8, minGpa: 2.3, fieldNote: "Education", blurb: "Classroom training for career teachers.", jobs: ["Teacher"] },
  { key: "phd", label: "PhD", level: "doctorate", years: 4, cost: 0.4, minGpa: 3.5, fieldNote: "in your field", blurb: "Original research - and it usually pays a small stipend.", wage: 12000 },
];
