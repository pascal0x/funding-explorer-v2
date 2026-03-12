import { ASSETS, ExplorerRow, VenueId } from "../domain";
import { buildExplorerRow, RawFundingPoint } from "./shared";

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

type HyperliquidPredictedFundingEntry = [
  string,
  [string, { fundingRate: string; nextFundingTime: number; fundingIntervalHours: number } | null][],
];

const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/info";
const HISTORY_WINDOWS = {
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

async function fetchPredictedFundingMap() {
  const rows = await postHyperliquid<HyperliquidPredictedFundingEntry[]>({
    type: "predictedFundings",
  });

  const fundingMap = new Map<string, number>();

  for (const [coin, venues] of rows) {
    const hlPerp = venues.find(([source]) => source === "HlPerp")?.[1];
    if (!hlPerp) {
      continue;
    }

    const intervalHours = hlPerp.fundingIntervalHours || 1;
    fundingMap.set(coin, (Number.parseFloat(hlPerp.fundingRate) * 100) / intervalHours);
  }

  return fundingMap;
}

async function fetchFundingHistory(symbol: string, days: number): Promise<RawFundingPoint[]> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const points: RawFundingPoint[] = [];
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

export async function fetchHyperliquidExplorerRows(): Promise<ExplorerRow[]> {
  const predictedFundingMap = await fetchPredictedFundingMap();

  const rows = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      const asset = ASSETS.find((entry) => entry.symbol === symbol);
      if (!asset) {
        return null;
      }

      try {
        const [liveFundingFromContext, history90d] = await Promise.all([
          fetchLiveFunding(symbol),
          fetchFundingHistory(symbol, HISTORY_WINDOWS["90d"]),
        ]);

        const liveHourlyRate =
          predictedFundingMap.get(apiCoin(symbol)) ??
          predictedFundingMap.get(symbol) ??
          liveFundingFromContext;

        if (liveHourlyRate === null || history90d.length === 0) {
          return null;
        }

        return buildExplorerRow({
          venue: "hyperliquid" satisfies VenueId,
          symbol,
          liveHourlyRate,
          history90d,
        });
      } catch {
        return null;
      }
    }),
  );

  return rows
    .filter((row): row is ExplorerRow => row !== null)
    .sort((left, right) => right.annualizedLive - left.annualizedLive);
}
