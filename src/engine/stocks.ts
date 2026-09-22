import { Character, PortfolioHolding, StockState, WorldState } from "../types";
import { STOCK_DEFS, stockDef } from "../data/stocks";
import { hasActiveCondition } from "./worldState";

// The market is shared, world-level state (like macro conditions) rather
// than per-character - everyone in a save sees the same prices, and a
// future generation (Legacy DLC) inherits the same ongoing market instead
// of a fresh one, same reasoning WorldState already survives restart().
export function ensureMarket(world: WorldState): StockState[] {
  if (!world.stocks || world.stocks.length === 0) {
    world.stocks = STOCK_DEFS.map((d) => ({ ticker: d.ticker, price: d.basePrice, prevPrice: d.basePrice }));
  }
  return world.stocks;
}

const BASELINE_DRIFT = 0.02; // modest long-run growth, like a real index

export function tickMarket(world: WorldState): void {
  const stocks = ensureMarket(world);
  const driftBias = hasActiveCondition(world, "boom") ? 0.06 : hasActiveCondition(world, "recession") ? -0.08 : BASELINE_DRIFT;
  for (const s of stocks) {
    const def = stockDef(s.ticker);
    const volatility = def?.volatility ?? 0.15;
    const shock = (Math.random() * 2 - 1) * volatility;
    s.prevPrice = s.price;
    s.price = Math.max(1, Math.round(s.price * (1 + driftBias + shock) * 100) / 100);
  }
}

function ensurePortfolio(c: Character): PortfolioHolding[] {
  if (!c.portfolio) c.portfolio = [];
  return c.portfolio;
}

export function buyStock(c: Character, world: WorldState, ticker: string, shares: number): boolean {
  const stocks = ensureMarket(world);
  const stock = stocks.find((s) => s.ticker === ticker);
  if (!stock || shares <= 0) return false;
  const cost = Math.round(stock.price * shares);
  if (c.money < cost) return false;
  c.money -= cost;
  const portfolio = ensurePortfolio(c);
  const holding = portfolio.find((h) => h.ticker === ticker);
  if (holding) {
    holding.shares += shares;
    holding.costBasis += cost;
  } else {
    portfolio.push({ ticker, shares, costBasis: cost });
  }
  c.yearLog.push(`You bought ${shares} share${shares === 1 ? "" : "s"} of ${ticker} for $${cost.toLocaleString()}.`);
  return true;
}

export function sellStock(c: Character, world: WorldState, ticker: string, shares: number): boolean {
  const stocks = ensureMarket(world);
  const stock = stocks.find((s) => s.ticker === ticker);
  const portfolio = ensurePortfolio(c);
  const holding = portfolio.find((h) => h.ticker === ticker);
  if (!stock || !holding || shares <= 0 || shares > holding.shares) return false;
  const proceeds = Math.round(stock.price * shares);
  c.money += proceeds;
  const costPerShare = holding.costBasis / holding.shares;
  holding.costBasis -= costPerShare * shares;
  holding.shares -= shares;
  if (holding.shares <= 0) {
    c.portfolio = portfolio.filter((h) => h.ticker !== ticker);
  }
  c.yearLog.push(`You sold ${shares} share${shares === 1 ? "" : "s"} of ${ticker} for $${proceeds.toLocaleString()}.`);
  return true;
}

// Rounded to whole dollars, like every other money value in the game -
// stock.price carries cents (realistic per-share pricing), but nothing
// else here ever shows a fractional dollar.
export function portfolioValue(c: Character, world: WorldState): number {
  const stocks = ensureMarket(world);
  const portfolio = c.portfolio ?? [];
  return Math.round(
    portfolio.reduce((sum, h) => {
      const stock = stocks.find((s) => s.ticker === h.ticker);
      return sum + (stock ? stock.price * h.shares : 0);
    }, 0),
  );
}
