export type VenueId =
  | "hyperliquid"
  | "binance"
  | "bybit"
  | "okx"
  | "dydx"
  | "lighter"
  | "asterdex"
  | "boros";

export type MarketGroup = "crypto" | "stocks" | "commodities" | "fx-etf";

export type AssetProfile = {
  symbol: string;
  name: string;
  market: MarketGroup;
  tags?: string[];
};

export type FundingPoint = {
  timestamp: string;
  rateHourly: number;
};

export type InstrumentSnapshot = {
  venue: VenueId;
  symbol: string;
  liveHourlyRate: number;
  avg7d: number;
  avg30d: number;
  avg90d: number;
  positiveShare7d: number;
  percentile90d: number;
  updatedAt: string;
  history: FundingPoint[];
};

export type ExplorerRow = InstrumentSnapshot & {
  asset: AssetProfile;
  annualizedLive: number;
  annualizedAvg30d: number;
  edgeVsAvg30d: number;
};

export type ExplorerResponse = {
  rows: ExplorerRow[];
  source: "live" | "mock";
  venue: VenueId;
  generatedAt: string;
  warning?: string;
};

export type SpreadOpportunity = {
  symbol: string;
  longVenue: VenueId;
  shortVenue: VenueId;
  spread30d: number;
  grossApr: number;
  leveragedApr: {
    leverage: number;
    apr: number;
  }[];
};

export type HedgeOpportunity = {
  symbol: string;
  borosImpliedApr: number;
  fundingMa7dApr: number;
  fundingMa30dApr: number;
  fundingTrend: "cheap" | "neutral" | "rich";
};

export type ProductPageId =
  | "explorer"
  | "trend"
  | "compare"
  | "spread"
  | "hedge";

export const VENUES: { id: VenueId; label: string; type: "dex" | "cex" | "rates" }[] = [
  { id: "hyperliquid", label: "Hyperliquid", type: "dex" },
  { id: "binance", label: "Binance", type: "cex" },
  { id: "bybit", label: "Bybit", type: "cex" },
  { id: "okx", label: "OKX", type: "cex" },
  { id: "dydx", label: "dYdX", type: "dex" },
  { id: "lighter", label: "Lighter", type: "dex" },
  { id: "asterdex", label: "Asterdex", type: "dex" },
  { id: "boros", label: "Boros", type: "rates" },
];

export const ASSETS: AssetProfile[] = [
  { symbol: "BTC", name: "Bitcoin", market: "crypto" },
  { symbol: "ETH", name: "Ethereum", market: "crypto" },
  { symbol: "SOL", name: "Solana", market: "crypto" },
  { symbol: "HYPE", name: "Hyperliquid", market: "crypto" },
  { symbol: "NVDA", name: "NVIDIA", market: "stocks", tags: ["xyz"] },
  { symbol: "TSLA", name: "Tesla", market: "stocks", tags: ["xyz"] },
  { symbol: "GOLD", name: "Gold", market: "commodities", tags: ["xyz"] },
  { symbol: "EUR", name: "Euro", market: "fx-etf", tags: ["xyz"] },
];
