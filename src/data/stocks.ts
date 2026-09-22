// All fictional companies - no real tickers, no real market data. Prices
// are simulated (see engine/stocks.ts), not pulled from anywhere real.
export type StockDef = {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number; // max +/- swing per year, before world-state drift
};

export const STOCK_DEFS: StockDef[] = [
  { ticker: "TCNI", name: "Techni Corp", sector: "Tech", basePrice: 120, volatility: 0.22 },
  { ticker: "GRNE", name: "Greenline Energy", sector: "Energy", basePrice: 60, volatility: 0.15 },
  { ticker: "MEDX", name: "MedixCare", sector: "Healthcare", basePrice: 85, volatility: 0.1 },
  { ticker: "FDLY", name: "Fidelity Bank & Trust", sector: "Finance", basePrice: 45, volatility: 0.08 },
  { ticker: "STRM", name: "Streamloop", sector: "Media", basePrice: 30, volatility: 0.28 },
  { ticker: "BLTS", name: "Bolt Motors", sector: "Auto", basePrice: 95, volatility: 0.2 },
];

export function stockDef(ticker: string): StockDef | undefined {
  return STOCK_DEFS.find((d) => d.ticker === ticker);
}
