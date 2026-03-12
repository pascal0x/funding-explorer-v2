import { ASSETS, ExplorerRow } from "../domain";

export type RawFundingPoint = {
  time: number;
  rate: number;
};

export type VenueExplorerBuildInput = {
  symbol: string;
  liveHourlyRate: number;
  history90d: RawFundingPoint[];
};

export function average(points: RawFundingPoint[]) {
  if (points.length === 0) {
    return 0;
  }

  return points.reduce((sum, point) => sum + point.rate, 0) / points.length;
}

export function percentileRank(points: RawFundingPoint[], currentRate: number) {
  if (points.length === 0) {
    return 0;
  }

  const below = points.filter((point) => point.rate <= currentRate).length;
  return Math.round((below / points.length) * 100);
}

export function positiveShare(points: RawFundingPoint[]) {
  if (points.length === 0) {
    return 0;
  }

  const positive = points.filter((point) => point.rate >= 0).length;
  return Math.round((positive / points.length) * 100);
}

export function pickWindow(points: RawFundingPoint[], days: number) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return points.filter((point) => point.time >= threshold);
}

export function buildExplorerRow({
  venue,
  symbol,
  liveHourlyRate,
  history90d,
}: VenueExplorerBuildInput & { venue: ExplorerRow["venue"] }): ExplorerRow | null {
  const asset = ASSETS.find((entry) => entry.symbol === symbol);
  if (!asset || history90d.length === 0) {
    return null;
  }

  const history30d = pickWindow(history90d, 30);
  const history7d = pickWindow(history90d, 7);
  const avg30d = average(history30d);
  const annualizedLive = liveHourlyRate * 24 * 365;
  const annualizedAvg30d = avg30d * 24 * 365;

  return {
    venue,
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
}
