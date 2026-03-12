import { ASSETS, ExplorerRow, VenueId } from "../domain";

type HyperliquidFundingHistoryEntry = {
  time: number;
  fundingRate: string;
};

type HyperliquidUniverseAsset = {
  name: string;
};

type HyperliquidAssetCtx = {
  funding?: string;
};

type RawPoint = {
  time: number;
  rate: number;
};

const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/info";
const HISTORY_WINDOWS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

const SUPPORTED_SYMBOLS = ASSETS.map((asset) => asset.symbol);

function isXyzSymbol(symbol: string) {
  return ASSETS.find((asset) => asset.symbol === symbol)?.tags?.includes("xyz") ?? false;
}

function apiCoin(symbol: string) {
  return isXyzSymbol(symbol) ? `xyz:${symbol}` : symbol;
}

async function postHyperliquid<T>(body: object): Promise<T> {
  const response = await fetch(HYPERLIQUID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchLiveFunding(symbol: string): Promise<number | null> {
  const dex = isXyzSymbol(symbol) ? "xyz" : undefined;
  const payload = dex ? { type: "metaAndAssetCtxs", dex } : { type: "metaAndAssetCtxs" };
  const data = await postHyperliquid<[ { universe: HyperliquidUniverseAsset[] }, HyperliquidAssetCtx[] ]>(payload);
  const universe = data[0].universe;
  const assetContexts = data[1];
  const target = apiCoin(symbol);
  const index = universe.findIndex((asset) => asset.name === target);

  if (index === -1) {
    return null;
  }

  const funding = assetContexts[index]?.funding;
  return typeof funding === "string" ? Number.parseFloat(funding) * 100 : null;
}

async function fetchFundingHistory(symbol: string, days: number): Promise<RawPoint[]> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const points: RawPoint[] = [];
  const seen = new Set<number>();
  let cursor = startTime;

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const batch = await postHyperliquid<HyperliquidFundingHistoryEntry[]>({
      type: "fundingHistory",
      coin: apiCoin(symbol),
      startTime: cursor,
    });

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    for (const entry of batch) {
      if (seen.has(entry.time)) {
        continue;
      }

      seen.add(entry.time);
      points.push({
        time: entry.time,
        rate: Number.parseFloat(entry.fundingRate) * 100,
      });
    }

    if (batch.length < 500) {
      break;
    }

    cursor = batch[batch.length - 1].time + 1;
  }

  return points.sort((left, right) => left.time - right.time);
}

function average(points: RawPoint[]) {
  if (points.length === 0) {
    return 0;
  }

  return points.reduce((sum, point) => sum + point.rate, 0) / points.length;
}

function percentileRank(points: RawPoint[], currentRate: number) {
  if (points.length === 0) {
    return 0;
  }

  const below = points.filter((point) => point.rate <= currentRate).length;
  return Math.round((below / points.length) * 100);
}

function positiveShare(points: RawPoint[]) {
  if (points.length === 0) {
    return 0;
  }

  const positive = points.filter((point) => point.rate >= 0).length;
  return Math.round((positive / points.length) * 100);
}

function pickWindow(points: RawPoint[], days: number) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return points.filter((point) => point.time >= threshold);
}

export async function fetchHyperliquidExplorerRows(): Promise<ExplorerRow[]> {
  const rows = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      const asset = ASSETS.find((entry) => entry.symbol === symbol);
      if (!asset) {
        return null;
      }

      try {
        const [liveHourlyRate, history90d] = await Promise.all([
          fetchLiveFunding(symbol),
          fetchFundingHistory(symbol, HISTORY_WINDOWS["90d"]),
        ]);

        if (liveHourlyRate === null || history90d.length === 0) {
          return null;
        }

        const history30d = pickWindow(history90d, HISTORY_WINDOWS["30d"]);
        const history7d = pickWindow(history90d, HISTORY_WINDOWS["7d"]);
        const avg30d = average(history30d);
        const annualizedLive = liveHourlyRate * 24 * 365;
        const annualizedAvg30d = avg30d * 24 * 365;

        return {
          venue: "hyperliquid" satisfies VenueId,
          symbol,
          asset,
          liveHourlyRate,
          avg7d: average(history7d),
          avg30d,
          avg90d: average(history90d),
          positiveShare7d: positiveShare(history7d),
          percentile90d: percentileRank(history90d, liveHourlyRate),
          updatedAt: new Date().toISOString(),
          history: history30d.slice(-18).map((point) => ({
            timestamp: new Date(point.time).toISOString(),
            rateHourly: Number(point.rate.toFixed(4)),
          })),
          annualizedLive,
          annualizedAvg30d,
          edgeVsAvg30d: annualizedLive - annualizedAvg30d,
        };
      } catch {
        return null;
      }
    }),
  );

  return rows
    .filter((row): row is ExplorerRow => row !== null)
    .sort((left, right) => right.annualizedLive - left.annualizedLive);
}
