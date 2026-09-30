// All fictional companies - no real tickers, no real market data. Prices
// are simulated (see engine/stocks.ts), not pulled from anywhere real.
export type StockDef = {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number; // max +/- swing per year, before world-state drift
  kind?: "stock" | "fund" | "bond" | "crypto";
  drift?: number; // fixed yearly drift (bonds), ignoring the macro mood
  blurb?: string;
};

export const STOCK_DEFS: StockDef[] = [
  { ticker: "TCNI", name: "Techni Corp", sector: "Tech", basePrice: 120, volatility: 0.22 },
  { ticker: "GRNE", name: "Greenline Energy", sector: "Energy", basePrice: 60, volatility: 0.15 },
  { ticker: "MEDX", name: "MedixCare", sector: "Healthcare", basePrice: 85, volatility: 0.1 },
  { ticker: "FDLY", name: "Fidelity Bank & Trust", sector: "Finance", basePrice: 45, volatility: 0.08 },
  { ticker: "STRM", name: "Streamloop", sector: "Media", basePrice: 30, volatility: 0.28 },
  { ticker: "BLTS", name: "Bolt Motors", sector: "Auto", basePrice: 95, volatility: 0.2 },
  { ticker: "INDX", name: "Zenith Global Index Fund", sector: "Fund", basePrice: 100, volatility: 0.07, kind: "fund", blurb: "A bit of everything. Steady, boring, hard to beat." },
  { ticker: "BOND", name: "Steady Treasury Bond", sector: "Bond", basePrice: 100, volatility: 0.012, kind: "bond", drift: 0.038, blurb: "Small, reliable returns whatever the market does." },
  { ticker: "BTNV", name: "BitNova", sector: "Crypto", basePrice: 50, volatility: 0.65, kind: "crypto", blurb: "A digital coin. Fortunes and heartbreaks in equal measure." },
];

export function stockDef(ticker: string): StockDef | undefined {
  return STOCK_DEFS.find((d) => d.ticker === ticker);
}
