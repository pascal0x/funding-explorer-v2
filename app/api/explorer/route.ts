import { NextRequest, NextResponse } from "next/server";
import { MarketGroup, VenueId } from "../../../lib/domain";
import { getExplorerData } from "../../../lib/server/explorer-service";

export const dynamic = "force-dynamic";

function isVenueId(value: string): value is VenueId {
  return [
    "hyperliquid",
    "binance",
    "bybit",
    "okx",
    "dydx",
    "lighter",
    "asterdex",
    "boros",
  ].includes(value);
}

function isMarketGroup(value: string): value is MarketGroup | "all" {
  return ["all", "crypto", "stocks", "commodities", "fx-etf"].includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueParam = searchParams.get("venue") ?? "hyperliquid";
  const marketParam = searchParams.get("market") ?? "all";
  const search = searchParams.get("search") ?? "";

  if (!isVenueId(venueParam) || !isMarketGroup(marketParam)) {
    return NextResponse.json(
      { error: "Invalid venue or market parameter." },
      { status: 400 },
    );
  }

  const payload = await getExplorerData({
    venue: venueParam,
    market: marketParam,
    search,
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
