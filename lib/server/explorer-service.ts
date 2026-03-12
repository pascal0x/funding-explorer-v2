import { ExplorerResponse, ExplorerRow, MarketGroup, VenueId } from "../domain";
import { getExplorerRows } from "../mock-data";
import { fetchHyperliquidExplorerRows } from "./hyperliquid";

function filterRows(rows: ExplorerRow[], market: MarketGroup | "all", search: string) {
  const query = search.trim().toLowerCase();

  return rows.filter((row) => {
    const marketMatch = market === "all" || row.asset.market === market;
    const searchMatch =
      query.length === 0 ||
      row.symbol.toLowerCase().includes(query) ||
      row.asset.name.toLowerCase().includes(query);

    return marketMatch && searchMatch;
  });
}

export async function getExplorerData({
  venue,
  market,
  search,
}: {
  venue: VenueId;
  market: MarketGroup | "all";
  search: string;
}): Promise<ExplorerResponse> {
  if (venue === "hyperliquid") {
    try {
      const liveRows = await fetchHyperliquidExplorerRows();

      return {
        rows: filterRows(liveRows, market, search),
        source: "live",
        venue,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      // Fall through to a controlled mock response when the upstream API is unavailable.
    }
  }

  return {
    rows: getExplorerRows({ venue, market, search }),
    source: "mock",
    venue,
    generatedAt: new Date().toISOString(),
    warning:
      venue === "hyperliquid"
        ? "Live Hyperliquid fetch failed, showing fallback data."
        : "Venue adapter not implemented yet, showing fallback data.",
  };
}
