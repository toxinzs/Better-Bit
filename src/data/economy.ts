import { RegionKey } from "../types";

// How each country taxes work, cushions job loss and pays people who stop.
// Brackets are in baseline (US-shaped) dollars: gross pay is divided by the
// country's jobMultiplier before the brackets apply and multiplied back after,
// so a typical worker sits in the same bracket everywhere. These are gameplay
// approximations, not tax advice.

export type Bracket = { upTo: number; rate: number };

export type TaxModel = {
  brackets: Bracket[];
  social: number; // employee social-security / pension / health contributions
  socialCap: number; // baseline dollars the social rate stops applying at
  childCredit: number; // baseline dollars off the tax bill per child under 18
  note: string;
};

export type WelfareModel = {
  unemployRate: number; // share of your last pay, per year
  unemployYears: number;
  severanceWeeks: number; // weeks of pay per year worked (capped at a year of pay)
  retireAge: number;
  pension: number; // share of your best pay, at full career
  pensionName: string;
};

export const TAX: Record<RegionKey, TaxModel> = {
  us: {
    brackets: [{ upTo: 11000, rate: 0.1 }, { upTo: 44725, rate: 0.12 }, { upTo: 95375, rate: 0.22 }, { upTo: 182100, rate: 0.24 }, { upTo: 231250, rate: 0.32 }, { upTo: 578125, rate: 0.35 }, { upTo: Infinity, rate: 0.37 }],
    social: 0.0765, socialCap: 160000, childCredit: 2000, note: "Federal income tax plus Social Security and Medicare, and a state layer on top.",
  },
  uk: {
    brackets: [{ upTo: 12500, rate: 0 }, { upTo: 50000, rate: 0.2 }, { upTo: 150000, rate: 0.4 }, { upTo: Infinity, rate: 0.45 }],
    social: 0.07, socialCap: 120000, childCredit: 900, note: "Income tax with a tax-free allowance, plus National Insurance.",
  },
  nigeria: {
    brackets: [{ upTo: 6000, rate: 0.07 }, { upTo: 20000, rate: 0.15 }, { upTo: 50000, rate: 0.19 }, { upTo: 120000, rate: 0.21 }, { upTo: Infinity, rate: 0.24 }],
    social: 0.08, socialCap: Infinity, childCredit: 300, note: "PAYE income tax plus a pension contribution.",
  },
  japan: {
    brackets: [{ upTo: 20000, rate: 0.05 }, { upTo: 40000, rate: 0.1 }, { upTo: 70000, rate: 0.2 }, { upTo: 110000, rate: 0.23 }, { upTo: 190000, rate: 0.33 }, { upTo: Infinity, rate: 0.4 }],
    social: 0.14, socialCap: 110000, childCredit: 350, note: "National income tax, social insurance, and a local inhabitant tax.",
  },
  brazil: {
    brackets: [{ upTo: 10000, rate: 0 }, { upTo: 28000, rate: 0.075 }, { upTo: 40000, rate: 0.15 }, { upTo: 55000, rate: 0.225 }, { upTo: Infinity, rate: 0.275 }],
    social: 0.09, socialCap: 90000, childCredit: 250, note: "Progressive income tax plus INSS social security.",
  },
  canada: {
    brackets: [{ upTo: 15000, rate: 0 }, { upTo: 55000, rate: 0.15 }, { upTo: 110000, rate: 0.205 }, { upTo: 175000, rate: 0.26 }, { upTo: Infinity, rate: 0.29 }],
    social: 0.06, socialCap: 65000, childCredit: 1500, note: "Federal tax plus a provincial layer, CPP and EI.",
  },
  australia: {
    brackets: [{ upTo: 18000, rate: 0 }, { upTo: 45000, rate: 0.19 }, { upTo: 120000, rate: 0.325 }, { upTo: 180000, rate: 0.37 }, { upTo: Infinity, rate: 0.45 }],
    social: 0.02, socialCap: Infinity, childCredit: 800, note: "Income tax with a tax-free threshold, plus the Medicare levy.",
  },
  germany: {
    brackets: [{ upTo: 11000, rate: 0 }, { upTo: 20000, rate: 0.14 }, { upTo: 45000, rate: 0.28 }, { upTo: 100000, rate: 0.38 }, { upTo: Infinity, rate: 0.45 }],
    social: 0.2, socialCap: 90000, childCredit: 1800, note: "Income tax plus pension, health, unemployment and care insurance.",
  },
  france: {
    brackets: [{ upTo: 11000, rate: 0 }, { upTo: 29000, rate: 0.11 }, { upTo: 83000, rate: 0.3 }, { upTo: 180000, rate: 0.41 }, { upTo: Infinity, rate: 0.45 }],
    social: 0.17, socialCap: Infinity, childCredit: 1500, note: "Income tax plus heavy social charges.",
  },
  india: {
    brackets: [{ upTo: 4000, rate: 0 }, { upTo: 8000, rate: 0.05 }, { upTo: 16000, rate: 0.1 }, { upTo: 24000, rate: 0.15 }, { upTo: 32000, rate: 0.2 }, { upTo: Infinity, rate: 0.3 }],
    social: 0.12, socialCap: 25000, childCredit: 150, note: "Slab-based income tax plus provident fund contributions.",
  },
  mexico: {
    brackets: [{ upTo: 4000, rate: 0.02 }, { upTo: 18000, rate: 0.11 }, { upTo: 40000, rate: 0.21 }, { upTo: 80000, rate: 0.3 }, { upTo: Infinity, rate: 0.35 }],
    social: 0.03, socialCap: Infinity, childCredit: 200, note: "ISR income tax plus IMSS contributions.",
  },
  southkorea: {
    brackets: [{ upTo: 15000, rate: 0.06 }, { upTo: 45000, rate: 0.15 }, { upTo: 90000, rate: 0.24 }, { upTo: 150000, rate: 0.35 }, { upTo: Infinity, rate: 0.42 }],
    social: 0.09, socialCap: 100000, childCredit: 900, note: "Progressive income tax plus national pension and health insurance.",
  },
};

export const WELFARE: Record<RegionKey, WelfareModel> = {
  us: { unemployRate: 0.3, unemployYears: 1, severanceWeeks: 0.5, retireAge: 67, pension: 0.35, pensionName: "Social Security" },
  uk: { unemployRate: 0.2, unemployYears: 1, severanceWeeks: 1, retireAge: 67, pension: 0.28, pensionName: "State Pension" },
  nigeria: { unemployRate: 0, unemployYears: 0, severanceWeeks: 1, retireAge: 60, pension: 0.15, pensionName: "Contributory Pension" },
  japan: { unemployRate: 0.5, unemployYears: 1, severanceWeeks: 1, retireAge: 65, pension: 0.35, pensionName: "National Pension" },
  brazil: { unemployRate: 0.4, unemployYears: 1, severanceWeeks: 3, retireAge: 62, pension: 0.5, pensionName: "INSS Pension" },
  canada: { unemployRate: 0.5, unemployYears: 1, severanceWeeks: 1.5, retireAge: 65, pension: 0.3, pensionName: "CPP and Old Age Security" },
  australia: { unemployRate: 0.35, unemployYears: 1, severanceWeeks: 1.5, retireAge: 67, pension: 0.25, pensionName: "Age Pension" },
  germany: { unemployRate: 0.6, unemployYears: 1, severanceWeeks: 2, retireAge: 67, pension: 0.48, pensionName: "Rente" },
  france: { unemployRate: 0.55, unemployYears: 2, severanceWeeks: 3, retireAge: 64, pension: 0.55, pensionName: "Retraite" },
  india: { unemployRate: 0, unemployYears: 0, severanceWeeks: 2, retireAge: 60, pension: 0.12, pensionName: "EPF Pension" },
  mexico: { unemployRate: 0, unemployYears: 0, severanceWeeks: 3, retireAge: 65, pension: 0.25, pensionName: "IMSS Pension" },
  southkorea: { unemployRate: 0.5, unemployYears: 1, severanceWeeks: 4, retireAge: 65, pension: 0.25, pensionName: "National Pension" },
};
