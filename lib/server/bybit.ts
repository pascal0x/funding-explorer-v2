import { ASSETS, ExplorerRow } from "../domain";
import { buildExplorerRow, RawFundingPoint } from "./shared";

type BybitTickerResponse = {
  retCode: number;
  result: {
    list: {
      symbol: string;
      fundingRate: string;
      fundingIntervalHour?: string;
    }[];
  };
};

type BybitFundingHistoryResponse = {
  retCode: number;
  result: {
    list: {
      fundingRate: string;
      fundingRateTimestamp: string;
    }[];
  };
};

const BYBIT_API_URL = "https://api.bybit.com";
const DEFAULT_FUNDING_INTERVAL_HOURS = 8;
const SUPPORTED_SYMBOLS = ASSETS
  .map((asset) => asset.symbol)
  .filter((symbol) => ["BTC", "ETH", "SOL"].includes(symbol));

function bybitSymbol(symbol: string) {
  return `${symbol}USDT`;
}

function toHourlyPercent(rate: string, fundingIntervalHours: number) {
  return (Number.parseFloat(rate) * 100) / fundingIntervalHours;
}

async function fetchBybit<T>(path: string) {
  const response = await fetch(`${BYBIT_API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Bybit request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchLiveFunding(symbol: string) {
  const response = await fetchBybit<BybitTickerResponse>(
    `/v5/market/tickers?category=linear&symbol=${bybitSymbol(symbol)}`,
  );
  const row = response.result.list[0];
  const fundingRate = row?.fundingRate;
  const fundingIntervalHours = Number.parseInt(row?.fundingIntervalHour ?? "", 10) || DEFAULT_FUNDING_INTERVAL_HOURS;

  return fundingRate
    ? {
        liveHourlyRate: toHourlyPercent(fundingRate, fundingIntervalHours),
        fundingIntervalHours,
      }
    : null;
}

async function fetchFundingHistory(symbol: string, fundingIntervalHours: number): Promise<RawFundingPoint[]> {
  const response = await fetchBybit<BybitFundingHistoryResponse>(
    `/v5/market/funding/history?category=linear&symbol=${bybitSymbol(symbol)}&limit=200`,
  );

  return response.result.list
    .map((row) => ({
      time: Number.parseInt(row.fundingRateTimestamp, 10),
      rate: toHourlyPercent(row.fundingRate, fundingIntervalHours),
    }))
    .sort((left, right) => left.time - right.time);
}

export async function fetchBybitExplorerRows(): Promise<ExplorerRow[]> {
  const rows = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      try {
        const liveFunding = await fetchLiveFunding(symbol);

        if (liveFunding === null) {
          return null;
        }

        const history90d = await fetchFundingHistory(symbol, liveFunding.fundingIntervalHours);

        return buildExplorerRow({
          venue: "bybit",
          symbol,
          liveHourlyRate: liveFunding.liveHourlyRate,
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
