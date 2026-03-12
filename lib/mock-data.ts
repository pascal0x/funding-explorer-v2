import {
  ASSETS,
  ExplorerRow,
  HedgeOpportunity,
  InstrumentSnapshot,
  MarketGroup,
  SpreadOpportunity,
  VenueId,
} from "./domain";

const now = Date.now();

function buildHistory(seed: number, base: number, drift = 0): InstrumentSnapshot["history"] {
  return Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin((index + seed) / 2.8) * 0.004;
    const noise = Math.cos((index + seed) / 1.9) * 0.0016;
    const rateHourly = Number((base + drift * (index / 18) + wave + noise).toFixed(4));

    return {
      timestamp: new Date(now - (17 - index) * 12 * 60 * 60 * 1000).toISOString(),
      rateHourly,
    };
  });
}

export const snapshots: InstrumentSnapshot[] = [
  {
    venue: "hyperliquid",
    symbol: "BTC",
    liveHourlyRate: 0.0112,
    avg7d: 0.0087,
    avg30d: 0.0061,
    avg90d: 0.0045,
    positiveShare7d: 71,
    percentile90d: 82,
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    history: buildHistory(1, 0.0071, 0.002),
  },
  {
    venue: "hyperliquid",
    symbol: "ETH",
    liveHourlyRate: 0.0059,
    avg7d: 0.0048,
    avg30d: 0.0037,
    avg90d: 0.0031,
    positiveShare7d: 68,
    percentile90d: 64,
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    history: buildHistory(2, 0.0036, 0.001),
  },
  {
    venue: "hyperliquid",
    symbol: "SOL",
    liveHourlyRate: 0.0174,
    avg7d: 0.0122,
    avg30d: 0.0094,
    avg90d: 0.0068,
    positiveShare7d: 74,
    percentile90d: 91,
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    history: buildHistory(3, 0.0102, 0.004),
  },
  {
    venue: "hyperliquid",
    symbol: "HYPE",
    liveHourlyRate: 0.0231,
    avg7d: 0.0195,
    avg30d: 0.0154,
    avg90d: 0.0117,
    positiveShare7d: 80,
    percentile90d: 96,
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    history: buildHistory(4, 0.015, 0.005),
  },
  {
    venue: "hyperliquid",
    symbol: "NVDA",
    liveHourlyRate: -0.0068,
    avg7d: -0.0039,
    avg30d: -0.0017,
    avg90d: 0.0004,
    positiveShare7d: 34,
    percentile90d: 18,
    updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    history: buildHistory(5, -0.0025, -0.0022),
  },
  {
    venue: "binance",
    symbol: "BTC",
    liveHourlyRate: 0.0093,
    avg7d: 0.0065,
    avg30d: 0.0054,
    avg90d: 0.0042,
    positiveShare7d: 66,
    percentile90d: 70,
    updatedAt: new Date(now - 4 * 60 * 1000).toISOString(),
    history: buildHistory(6, 0.006, 0.001),
  },
  {
    venue: "binance",
    symbol: "ETH",
    liveHourlyRate: 0.0047,
    avg7d: 0.0038,
    avg30d: 0.0031,
    avg90d: 0.0024,
    positiveShare7d: 64,
    percentile90d: 59,
    updatedAt: new Date(now - 4 * 60 * 1000).toISOString(),
    history: buildHistory(7, 0.0032),
  },
  {
    venue: "binance",
    symbol: "SOL",
    liveHourlyRate: 0.0121,
    avg7d: 0.0103,
    avg30d: 0.0079,
    avg90d: 0.0051,
    positiveShare7d: 72,
    percentile90d: 84,
    updatedAt: new Date(now - 4 * 60 * 1000).toISOString(),
    history: buildHistory(8, 0.0088, 0.002),
  },
  {
    venue: "bybit",
    symbol: "BTC",
    liveHourlyRate: 0.0071,
    avg7d: 0.0052,
    avg30d: 0.0048,
    avg90d: 0.0039,
    positiveShare7d: 61,
    percentile90d: 58,
    updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
    history: buildHistory(9, 0.0046, 0.0015),
  },
  {
    venue: "bybit",
    symbol: "ETH",
    liveHourlyRate: 0.0031,
    avg7d: 0.0028,
    avg30d: 0.0029,
    avg90d: 0.0027,
    positiveShare7d: 53,
    percentile90d: 46,
    updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
    history: buildHistory(10, 0.0026, 0.0002),
  },
  {
    venue: "okx",
    symbol: "BTC",
    liveHourlyRate: 0.0082,
    avg7d: 0.0054,
    avg30d: 0.0041,
    avg90d: 0.0036,
    positiveShare7d: 63,
    percentile90d: 61,
    updatedAt: new Date(now - 6 * 60 * 1000).toISOString(),
    history: buildHistory(11, 0.0048, 0.0011),
  },
  {
    venue: "dydx",
    symbol: "ETH",
    liveHourlyRate: 0.0065,
    avg7d: 0.0044,
    avg30d: 0.0032,
    avg90d: 0.0028,
    positiveShare7d: 67,
    percentile90d: 72,
    updatedAt: new Date(now - 8 * 60 * 1000).toISOString(),
    history: buildHistory(12, 0.0039, 0.0017),
  },
];

export const hedgeOpportunities: HedgeOpportunity[] = [
  {
    symbol: "BTC",
    borosImpliedApr: 12.8,
    fundingMa7dApr: 7.6,
    fundingMa30dApr: 5.3,
    fundingTrend: "rich",
  },
  {
    symbol: "ETH",
    borosImpliedApr: 5.9,
    fundingMa7dApr: 4.2,
    fundingMa30dApr: 3.4,
    fundingTrend: "neutral",
  },
  {
    symbol: "SOL",
    borosImpliedApr: 7.1,
    fundingMa7dApr: 10.7,
    fundingMa30dApr: 8.2,
    fundingTrend: "cheap",
  },
];

export const spreadOpportunities: SpreadOpportunity[] = [
  {
    symbol: "BTC",
    longVenue: "bybit",
    shortVenue: "hyperliquid",
    spread30d: 0.12,
    grossApr: 10.51,
    leveragedApr: [
      { leverage: 1, apr: 10.51 },
      { leverage: 3, apr: 31.53 },
      { leverage: 5, apr: 52.55 },
    ],
  },
  {
    symbol: "SOL",
    longVenue: "binance",
    shortVenue: "hyperliquid",
    spread30d: 0.15,
    grossApr: 13.14,
    leveragedApr: [
      { leverage: 1, apr: 13.14 },
      { leverage: 3, apr: 39.42 },
      { leverage: 5, apr: 65.7 },
    ],
  },
  {
    symbol: "ETH",
    longVenue: "binance",
    shortVenue: "dydx",
    spread30d: 0.02,
    grossApr: 1.31,
    leveragedApr: [
      { leverage: 1, apr: 1.31 },
      { leverage: 3, apr: 3.93 },
      { leverage: 5, apr: 6.55 },
    ],
  },
];

export function getExplorerRows(filters?: {
  venue?: VenueId;
  market?: MarketGroup | "all";
  search?: string;
}): ExplorerRow[] {
  const venue = filters?.venue ?? "hyperliquid";
  const market = filters?.market ?? "all";
  const search = filters?.search?.toLowerCase() ?? "";

  return snapshots
    .filter((snapshot) => snapshot.venue === venue)
    .filter((snapshot) => {
      const asset = ASSETS.find((item) => item.symbol === snapshot.symbol);
      if (!asset) return false;
      const marketMatch = market === "all" || asset.market === market;
      const searchMatch =
        search.length === 0 ||
        snapshot.symbol.toLowerCase().includes(search) ||
        asset.name.toLowerCase().includes(search);

      return marketMatch && searchMatch;
    })
    .map((snapshot) => {
      const asset = ASSETS.find((item) => item.symbol === snapshot.symbol)!;
      const annualizedLive = snapshot.liveHourlyRate * 24 * 365;
      const annualizedAvg30d = snapshot.avg30d * 24 * 365;
      const edgeVsAvg30d = annualizedLive - annualizedAvg30d;

      return {
        ...snapshot,
        asset,
        annualizedLive,
        annualizedAvg30d,
        edgeVsAvg30d,
      };
    })
    .sort((left, right) => right.annualizedLive - left.annualizedLive);
}

export function getVenueCoverage() {
  const byVenue = new Map<VenueId, number>();

  for (const snapshot of snapshots) {
    byVenue.set(snapshot.venue, (byVenue.get(snapshot.venue) ?? 0) + 1);
  }

  return Array.from(byVenue.entries()).map(([venue, instruments]) => ({
    venue,
    instruments,
  }));
}
