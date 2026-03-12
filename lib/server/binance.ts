import { ASSETS, ExplorerRow } from "../domain";
import { buildExplorerRow, RawFundingPoint } from "./shared";

type BinancePremiumIndexEntry = {
  symbol: string;
  lastFundingRate: string;
};

type BinanceFundingHistoryEntry = {
  fundingTime: number;
  fundingRate: string;
};

const BINANCE_API_URL = "https://fapi.binance.com";
const SUPPORTED_SYMBOLS = ASSETS
  .map((asset) => asset.symbol)
  .filter((symbol) => ["BTC", "ETH", "SOL"].includes(symbol));

function binanceSymbol(symbol: string) {
  return `${symbol}USDT`;
}

async function fetchBinance<T>(path: string) {
  const response = await fetch(`${BINANCE_API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Binance request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchLiveFundingMap() {
  const rows = await fetchBinance<BinancePremiumIndexEntry[]>("/fapi/v1/premiumIndex");

  return new Map(
    rows.map((row) => [row.symbol, Number.parseFloat(row.lastFundingRate) * 100]),
  );
}

async function fetchFundingHistory(symbol: string): Promise<RawFundingPoint[]> {
  const rows = await fetchBinance<BinanceFundingHistoryEntry[]>(
    `/fapi/v1/fundingRate?symbol=${binanceSymbol(symbol)}&limit=1000`,
  );

  return rows.map((row) => ({
    time: row.fundingTime,
    rate: Number.parseFloat(row.fundingRate) * 100,
  }));
}

export async function fetchBinanceExplorerRows(): Promise<ExplorerRow[]> {
  const liveFundingMap = await fetchLiveFundingMap();

  const rows = await Promise.all(
    SUPPORTED_SYMBOLS.map(async (symbol) => {
      const liveHourlyRate = liveFundingMap.get(binanceSymbol(symbol));
      if (liveHourlyRate === undefined) {
        return null;
      }

      try {
        const history90d = await fetchFundingHistory(symbol);

        return buildExplorerRow({
          venue: "binance",
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
