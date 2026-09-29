import { Job } from "../types";

// The job catalogue. Salaries are US-baseline dollars per year (part-time
// jobs: what the hours add up to over a year); a region's jobMultiplier scales
// them (engine/worldState.ts effectiveSalary). Listings (engine/jobs.ts) pair
// each of these with a generated company.

// ---------------------------------------------------------------- part-time

export const PARTTIME_JOBS: Job[] = [
  { title: "Fast Food Crew Member", kind: "parttime", field: "Food & Hospitality", salary: 7800, hours: 15, minAge: 15,
    day: "Take orders, work the fryer, keep the line moving and the floor clean.", growth: "Shift lead, then assistant manager." },
  { title: "Grocery Bagger & Stocker", kind: "parttime", field: "Retail & Service", salary: 7200, hours: 14, minAge: 15,
    day: "Bag groceries, restock shelves, help customers find things.", growth: "Cashier, then department lead." },
  { title: "Retail Associate", kind: "parttime", field: "Retail & Service", salary: 8400, hours: 15, minAge: 16,
    day: "Greet customers, fold clothes, run the till and close up.", growth: "Sales lead, then store supervisor." },
  { title: "Cinema Usher", kind: "parttime", field: "Food & Hospitality", salary: 6000, hours: 12, minAge: 15,
    day: "Tear tickets, sweep between screenings, sell popcorn.", growth: "Projectionist or duty manager." },
  { title: "Barista", kind: "parttime", field: "Food & Hospitality", salary: 9000, hours: 16, minAge: 16,
    day: "Pull espresso, learn the regulars' orders, keep the queue calm.", growth: "Shift supervisor or roaster." },
  { title: "Farm Hand", kind: "parttime", field: "Outdoors & Trades", salary: 7000, hours: 15, minAge: 14,
    day: "Feed animals, pick produce, and get very familiar with early mornings.", growth: "Farm crew lead." },
  { title: "Lifeguard", kind: "parttime", field: "Outdoors & Trades", salary: 8800, hours: 16, minAge: 16, minSmarts: 35,
    day: "Watch the water, run safety checks, and stay sharp for hours at a time.", growth: "Head guard or swim instructor." },
  { title: "Camp Counselor", kind: "parttime", field: "Education & Care", salary: 6500, hours: 18, minAge: 16, minSmarts: 35,
    day: "Run activities, keep a cabin of kids safe and (mostly) happy.", growth: "Program director." },
  { title: "Library Page", kind: "parttime", field: "Education & Care", salary: 5600, hours: 10, minAge: 15, minSmarts: 45,
    day: "Shelve returns, tidy the stacks, help people find books.", growth: "Library assistant." },
  { title: "Tutor's Aide", kind: "parttime", field: "Education & Care", salary: 7600, hours: 10, minAge: 16, minSmarts: 60,
    day: "Help younger students with homework and keep the sessions running.", growth: "Tutor, then teaching assistant." },
  { title: "Dog Groomer's Assistant", kind: "parttime", field: "Outdoors & Trades", salary: 6800, hours: 12, minAge: 15,
    day: "Bathe, dry, brush and calm very wiggly customers.", growth: "Groomer." },
  { title: "Bakery Counter Assistant", kind: "parttime", field: "Food & Hospitality", salary: 8200, hours: 15, minAge: 15,
    day: "Box pastries, ring up sales and start very early.", growth: "Baker's apprentice." },
  { title: "Warehouse Packer", kind: "parttime", field: "Logistics", salary: 11000, hours: 20, minAge: 17,
    day: "Pick, pack and label orders against the clock.", growth: "Forklift operator, then team lead." },
  { title: "Food Delivery Rider", kind: "parttime", field: "Logistics", salary: 10500, hours: 18, minAge: 18,
    day: "Ride or drive orders across town, rain or shine.", growth: "Fleet coordinator." },
  { title: "Receptionist (Evenings)", kind: "parttime", field: "Office & Admin", salary: 12000, hours: 20, minAge: 18, minSmarts: 40,
    day: "Answer phones, greet visitors, sort the post.", growth: "Office administrator." },
  { title: "Music Store Clerk", kind: "parttime", field: "Retail & Service", salary: 8000, hours: 14, minAge: 16, minSkill: { skill: "music", level: 15 },
    day: "Restring guitars, recommend gear and argue about bands.", growth: "Store lead or lessons teacher." },
];

// ---------------------------------------------------------------- full-time

export const FULLTIME_JOBS: Job[] = [
  // Retail & Service
  { title: "Retail Associate (Full-time)", kind: "fulltime", field: "Retail & Service", salary: 24000, hours: 40, minAge: 18,
    day: "Sales floor, stockroom and a lot of standing.", growth: "Supervisor, then store manager." },
  { title: "Customer Service Rep", kind: "fulltime", field: "Retail & Service", salary: 30000, hours: 40, minAge: 18, minSmarts: 35,
    day: "Calm people down and fix their problems over the phone.", growth: "Team lead, then support manager." },
  { title: "Warehouse Worker", kind: "fulltime", field: "Logistics", salary: 27000, hours: 40, minAge: 18,
    day: "Load, unload, scan, repeat - a steady physical grind.", growth: "Forklift operator, then shift lead." },
  { title: "Delivery Driver", kind: "fulltime", field: "Logistics", salary: 32000, hours: 42, minAge: 18,
    day: "Route, wheel, doorstep, signature - all day.", growth: "Dispatcher or fleet manager." },
  { title: "Truck Driver", kind: "fulltime", field: "Logistics", salary: 52000, hours: 50, minAge: 21, minSmarts: 35, requiresCleanRecord: true,
    day: "Long hauls, lonely radios and good coffee at odd hours.", growth: "Owner-operator." },
  // Trades
  { title: "Landscaper", kind: "fulltime", field: "Outdoors & Trades", salary: 29000, hours: 40, minAge: 18,
    day: "Mow, trim, plant and haul in whatever the weather is doing.", growth: "Crew lead, then your own business." },
  { title: "Electrician", kind: "fulltime", field: "Outdoors & Trades", salary: 52000, hours: 40, minAge: 20, minSmarts: 55,
    day: "Run wire, fix faults, and never trust an unlabelled breaker.", growth: "Master electrician or contractor." },
  { title: "Plumber", kind: "fulltime", field: "Outdoors & Trades", salary: 50000, hours: 40, minAge: 20, minSmarts: 45,
    day: "Burst pipes at 2 a.m. and honest, essential work.", growth: "Master plumber or your own van." },
  { title: "Carpenter", kind: "fulltime", field: "Outdoors & Trades", salary: 46000, hours: 40, minAge: 19, minSmarts: 40,
    day: "Measure twice, cut once, build things that last.", growth: "Foreman or custom furniture maker." },
  { title: "Auto Mechanic", kind: "fulltime", field: "Outdoors & Trades", salary: 44000, hours: 40, minAge: 19, minSmarts: 45,
    day: "Diagnose the noise, fix the car, wipe your hands, repeat.", growth: "Shop foreman or garage owner." },
  { title: "Welder", kind: "fulltime", field: "Outdoors & Trades", salary: 47000, hours: 40, minAge: 19, minSmarts: 40,
    day: "Sparks, steel and steady hands.", growth: "Pipe welder or inspector." },
  // Office & Business
  { title: "Office Assistant", kind: "fulltime", field: "Office & Admin", salary: 34000, hours: 40, minAge: 18, minSmarts: 40,
    day: "Filing, scheduling, and keeping the office quietly running.", growth: "Administrator, then office manager." },
  { title: "Bank Teller", kind: "fulltime", field: "Finance & Business", salary: 38000, hours: 40, minAge: 18, minSmarts: 50, requiresCleanRecord: true,
    day: "Cash, accuracy and a great many polite smiles.", growth: "Personal banker or branch manager." },
  { title: "Accountant", kind: "fulltime", field: "Finance & Business", salary: 62000, hours: 42, minAge: 21, minSmarts: 65, requiresCollege: true, requiresCleanRecord: true,
    day: "Numbers, deadlines and the calm of a balanced sheet.", growth: "Senior accountant, then finance director." },
  { title: "Marketing Manager", kind: "fulltime", field: "Finance & Business", salary: 74000, hours: 42, minAge: 23, minSmarts: 60, requiresCollege: true,
    day: "Campaigns, budgets and a lot of meetings about the brand.", growth: "Director of marketing." },
  { title: "Real Estate Agent", kind: "fulltime", field: "Finance & Business", salary: 56000, hours: 45, minAge: 21, minSmarts: 45,
    day: "Showings, paperwork and the smell of fresh paint.", growth: "Broker with your own agency." },
  { title: "Human Resources Officer", kind: "fulltime", field: "Finance & Business", salary: 60000, hours: 40, minAge: 22, minSmarts: 55, requiresCollege: true,
    day: "Hiring, policies and the occasional tricky conversation.", growth: "HR manager." },
  // Tech
  { title: "IT Support Technician", kind: "fulltime", field: "Tech", salary: 46000, hours: 40, minAge: 19, minSmarts: 55,
    day: "Have you tried turning it off and on again - but properly.", growth: "Sysadmin or security analyst." },
  { title: "Software Engineer", kind: "fulltime", field: "Tech", salary: 95000, hours: 42, minAge: 21, minSmarts: 75, requiresCollege: true,
    day: "Ship code, review code, argue about naming.", growth: "Senior engineer, then staff or manager." },
  { title: "Data Analyst", kind: "fulltime", field: "Tech", salary: 72000, hours: 40, minAge: 21, minSmarts: 70, requiresCollege: true,
    day: "Wrangle spreadsheets into answers people can act on.", growth: "Data scientist." },
  { title: "Web Designer", kind: "fulltime", field: "Creative & Media", salary: 58000, hours: 40, minAge: 19, minSmarts: 50, minSkill: { skill: "art", level: 20 },
    day: "Layouts, colours and clients who want the logo bigger.", growth: "Art director." },
  // Healthcare & care
  { title: "Nursing Assistant", kind: "fulltime", field: "Healthcare", salary: 31000, hours: 40, minAge: 18, minSmarts: 40, requiresCleanRecord: true,
    day: "Hands-on care, long shifts and quiet heroism.", growth: "Nursing school, then nurse." },
  { title: "Nurse", kind: "fulltime", field: "Healthcare", salary: 68000, hours: 40, minAge: 22, minSmarts: 65, requiresCollege: true, requiresCleanRecord: true,
    day: "Twelve-hour shifts, hard conversations and real difference.", growth: "Charge nurse, nurse practitioner." },
  { title: "Pharmacist", kind: "fulltime", field: "Healthcare", salary: 110000, hours: 40, minAge: 25, minSmarts: 80, requiresCollege: true, requiresCleanRecord: true,
    day: "Check scripts twice, counsel patients, keep everyone safe.", growth: "Pharmacy manager." },
  { title: "Doctor", kind: "fulltime", field: "Healthcare", salary: 180000, hours: 55, minAge: 26, minSmarts: 90, requiresCollege: true, requiresCleanRecord: true,
    day: "Diagnose, decide, and carry other people's worst days.", growth: "Specialist or department head." },
  // Education & public service
  { title: "Teaching Assistant", kind: "fulltime", field: "Education & Care", salary: 28000, hours: 35, minAge: 18, minSmarts: 50, requiresCleanRecord: true,
    day: "Support the class, the teacher and the kid at the back.", growth: "Teacher." },
  { title: "Teacher", kind: "fulltime", field: "Education & Care", salary: 48000, hours: 42, minAge: 22, minSmarts: 60, requiresCollege: true, requiresCleanRecord: true,
    day: "Lesson plans, marking and the moment something finally clicks.", growth: "Head of department, principal." },
  { title: "Police Officer", kind: "fulltime", field: "Public Service", salary: 58000, hours: 45, minAge: 21, minSmarts: 45, requiresCleanRecord: true,
    day: "Patrol, paperwork and the occasional very bad night.", growth: "Detective or sergeant." },
  { title: "Firefighter", kind: "fulltime", field: "Public Service", salary: 54000, hours: 48, minAge: 21, minSmarts: 45, requiresCleanRecord: true,
    day: "Drills, calls and a firehouse kitchen full of stories.", growth: "Lieutenant, then captain." },
  { title: "Social Worker", kind: "fulltime", field: "Public Service", salary: 47000, hours: 42, minAge: 22, minSmarts: 60, requiresCollege: true, requiresCleanRecord: true,
    day: "Case files, home visits and holding a lot of hard stories.", growth: "Clinical lead." },
  { title: "Lawyer", kind: "fulltime", field: "Public Service", salary: 120000, hours: 55, minAge: 24, minSmarts: 85, requiresCollege: true, requiresCleanRecord: true,
    day: "Research, negotiate, argue - and bill by the hour.", growth: "Partner or judge." },
  // Food & Hospitality
  { title: "Line Cook", kind: "fulltime", field: "Food & Hospitality", salary: 33000, hours: 44, minAge: 18,
    day: "Prep, sear, plate, hear 'yes chef' a lot.", growth: "Sous chef, then head chef." },
  { title: "Chef", kind: "fulltime", field: "Food & Hospitality", salary: 52000, hours: 50, minAge: 22, minSmarts: 45,
    day: "Run the kitchen, taste everything, sleep sometimes.", growth: "Executive chef or restaurant owner." },
  { title: "Hotel Front Desk Agent", kind: "fulltime", field: "Food & Hospitality", salary: 31000, hours: 40, minAge: 18, minSmarts: 40,
    day: "Check-ins, complaints and unexpected celebrity.", growth: "Duty manager." },
  // Creative
  { title: "Photographer", kind: "fulltime", field: "Creative & Media", salary: 42000, hours: 40, minAge: 19, minSmarts: 40, minSkill: { skill: "art", level: 25 },
    day: "Chase the light, edit late, deliver on Fridays.", growth: "Studio owner." },
  { title: "Session Musician", kind: "fulltime", field: "Creative & Media", salary: 40000, hours: 35, minAge: 19, minSkill: { skill: "music", level: 45 },
    day: "Learn the chart, nail the take, go home late.", growth: "Touring player or producer." },
  { title: "Actor", kind: "fulltime", field: "Creative & Media", salary: 36000, hours: 40, minAge: 18, minSkill: { skill: "acting", level: 45 },
    day: "Auditions, rehearsals and waiting for the phone to ring.", growth: "Leads - if the phone rings." },
  { title: "Journalist", kind: "fulltime", field: "Creative & Media", salary: 45000, hours: 45, minAge: 21, minSmarts: 60, requiresCollege: true,
    day: "Chase the story, check the facts, file by five.", growth: "Editor or columnist." },
];

export const ALL_JOBS: Job[] = [...PARTTIME_JOBS, ...FULLTIME_JOBS];

// kept for older code paths: the legacy flat list
export const JOBS = ALL_JOBS;
