"use client";

import { useEffect, useState } from "react";
import {
  ASSETS,
  ExplorerResponse,
  ExplorerRow,
  MarketGroup,
  VENUES,
  VenueId,
} from "../lib/domain";
import { formatApr, formatHourlyRate, formatMinutesAgo, titleCase } from "../lib/format";

const LIVE_VENUES = new Set<VenueId>(["hyperliquid", "binance", "bybit"]);

function Sparkline({ points }: { points: { rateHourly: number }[] }) {
  const width = 180;
  const height = 56;
  const values = points.map((point) => point.rateHourly);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point.rateHourly - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" role="img" aria-label="Funding history">
      <path d={path} />
    </svg>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "filter-button filter-button-active" : "filter-button"}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <strong>No rows</strong>
      <span>{message}</span>
    </div>
  );
}

export function ExplorerView({
  venue = "hyperliquid",
  market = "all",
}: {
  venue?: VenueId;
  market?: MarketGroup | "all";
}) {
  const [selectedVenue, setSelectedVenue] = useState<VenueId>(venue);
  const [selectedMarket, setSelectedMarket] = useState<MarketGroup | "all">(market);
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState<ExplorerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          venue: selectedVenue,
          market: selectedMarket,
        });

        if (search.trim().length > 0) {
          params.set("search", search.trim());
        }

        const result = await fetch(`/api/explorer?${params.toString()}`, {
          cache: "no-store",
        });

        if (!result.ok) {
          throw new Error(`Explorer request failed with ${result.status}`);
        }

        const payload = (await result.json()) as ExplorerResponse;

        if (!cancelled) {
          setResponse(payload);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unknown explorer error");
          setResponse(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [search, selectedMarket, selectedVenue]);

  const rows = response?.rows ?? [];
  const bestLive = rows[0];
  const mostExtreme =
    rows.length > 0 ? [...rows].sort((left, right) => right.percentile90d - left.percentile90d)[0] : null;
  const bestMean =
    rows.length > 0 ? [...rows].sort((left, right) => right.annualizedAvg30d - left.annualizedAvg30d)[0] : null;
  const venueCoverage = VENUES.filter((item) => item.id !== "boros").map((item) => ({
    ...item,
    count:
      item.id === selectedVenue
        ? rows.length
        : LIVE_VENUES.has(item.id)
          ? "live"
          : "soon",
  }));

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Funding intelligence</p>
          <h2>Explorer is the home screen.</h2>
          <p className="hero-copy">
            Screen assets by current funding, multi-window averages, percentile vs 90d history,
            and edge versus the rolling baseline. Hyperliquid is wired live first through the app
            backend so the client no longer talks directly to venue APIs.
          </p>
        </div>

        <div className="hero-card-grid">
          <article className="metric-card accent-cyan">
            <span>Top live APR</span>
            <strong>{bestLive?.symbol ?? "—"}</strong>
            <em>{bestLive ? formatApr(bestLive.annualizedLive) : "Loading..."}</em>
          </article>
          <article className="metric-card accent-amber">
            <span>Top 30d mean</span>
            <strong>{bestMean?.symbol ?? "—"}</strong>
            <em>{bestMean ? formatApr(bestMean.annualizedAvg30d) : "Loading..."}</em>
          </article>
          <article className="metric-card accent-pink">
            <span>Most extreme vs 90d</span>
            <strong>{mostExtreme?.symbol ?? "—"}</strong>
            <em>{mostExtreme ? `${mostExtreme.percentile90d}th percentile` : "Loading..."}</em>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Coverage</p>
            <h3>Venue rollout and ingestion scope</h3>
          </div>
          <div className="status-pill-row">
            <span className={response?.source === "live" ? "status-pill status-live" : "status-pill"}>
              Source: {response?.source ?? "loading"}
            </span>
            {response?.warning ? <span className="status-pill">{response.warning}</span> : null}
          </div>
        </div>

        <div className="chip-row">
          {venueCoverage.map((item) => (
            <div key={item.id} className="coverage-chip">
              <strong>{item.label}</strong>
              <span>
                {typeof item.count === "number"
                  ? `${item.count} visible instruments`
                  : item.count === "live"
                    ? "live adapter ready"
                    : "adapter pending"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Controls</p>
            <h3>Venue, market, and search</h3>
          </div>
          <p className="panel-caption">
            Hyperliquid, Binance, and Bybit use live server data. The other venues still route through the same API contract, but return fallback rows until their adapters are added.
          </p>
        </div>

        <div className="control-grid">
          <div className="control-block">
            <span className="control-label">Venue</span>
            <div className="filter-row">
              {VENUES.filter((item) => item.id !== "boros").map((item) => (
                <FilterButton
                  key={item.id}
                  active={selectedVenue === item.id}
                  onClick={() => setSelectedVenue(item.id)}
                >
                  {item.label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="control-block">
            <span className="control-label">Market</span>
            <div className="filter-row">
              {(["all", "crypto", "stocks", "commodities", "fx-etf"] as const).map((group) => (
                <FilterButton
                  key={group}
                  active={selectedMarket === group}
                  onClick={() => setSelectedMarket(group)}
                >
                  {titleCase(group)}
                </FilterButton>
              ))}
            </div>
          </div>

          <label className="search-box">
            <span className="control-label">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="BTC, ETH, NVDA..."
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Screen</p>
            <h3>{VENUES.find((item) => item.id === selectedVenue)?.label} funding screener</h3>
          </div>
          <p className="panel-caption">
            {response?.generatedAt
              ? `Generated ${formatMinutesAgo(response.generatedAt)}`
              : "Waiting for first response"}
          </p>
        </div>

        {loading ? (
          <EmptyState message="Loading funding data from the app API." />
        ) : error ? (
          <EmptyState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState message="No instruments matched the current filters." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Market</th>
                  <th>Live</th>
                  <th>Avg 7d</th>
                  <th>Avg 30d</th>
                  <th>Avg 90d</th>
                  <th>Live APR</th>
                  <th>Edge vs 30d</th>
                  <th>90d %ile</th>
                  <th>% positive 7d</th>
                  <th>Trend</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: ExplorerRow) => (
                  <tr key={`${row.venue}-${row.symbol}`}>
                    <td>
                      <div className="asset-cell">
                        <strong>{row.symbol}</strong>
                        <span>{ASSETS.find((item) => item.symbol === row.symbol)?.name}</span>
                      </div>
                    </td>
                    <td>{titleCase(row.asset.market)}</td>
                    <td className={row.liveHourlyRate >= 0 ? "positive" : "negative"}>
                      {formatHourlyRate(row.liveHourlyRate)}
                    </td>
                    <td>{formatHourlyRate(row.avg7d)}</td>
                    <td>{formatHourlyRate(row.avg30d)}</td>
                    <td>{formatHourlyRate(row.avg90d)}</td>
                    <td className={row.annualizedLive >= 0 ? "positive" : "negative"}>
                      {formatApr(row.annualizedLive)}
                    </td>
                    <td className={row.edgeVsAvg30d >= 0 ? "positive" : "negative"}>
                      {formatApr(row.edgeVsAvg30d)}
                    </td>
                    <td>{row.percentile90d}</td>
                    <td>{row.positiveShare7d}%</td>
                    <td>
                      <Sparkline points={row.history} />
                    </td>
                    <td>{formatMinutesAgo(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
