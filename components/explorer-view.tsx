"use client";

import { useEffect, useState } from "react";
import { ExplorerResponse, ExplorerRow, MarketGroup, VENUE_MARKETS, VENUES, VenueId } from "../lib/domain";
import { formatApr, formatHourlyRate, formatMinutesAgo, titleCase } from "../lib/format";

const LIVE_VENUES = ["hyperliquid", "binance", "bybit"] satisfies VenueId[];

type SortKey =
  | "symbol"
  | "market"
  | "annualizedLive"
  | "avg7dApr"
  | "annualizedAvg30d"
  | "avg90dApr"
  | "edgeVsAvg30d"
  | "percentile90d"
  | "positiveShare7d"
  | "updatedAt";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type SummaryItem = {
  label: string;
  symbol: string;
  value: string;
};

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateTime(iso: string) {
  const value = new Date(iso);
  return {
    date: value.toLocaleDateString("en-GB"),
    time: value.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function buildSummary(rows: ExplorerRow[]): SummaryItem[] {
  if (rows.length === 0) {
    return [];
  }

  const topLive = [...rows].sort((left, right) => right.annualizedLive - left.annualizedLive)[0];
  const top7d = [...rows].sort((left, right) => right.avg7d - left.avg7d)[0];
  const top30d = [...rows].sort((left, right) => right.annualizedAvg30d - left.annualizedAvg30d)[0];
  const topExtreme = [...rows].sort((left, right) => right.percentile90d - left.percentile90d)[0];
  const topPositive = [...rows].sort((left, right) => right.positiveShare7d - left.positiveShare7d)[0];

  return [
    { label: "Top live", symbol: topLive.symbol, value: formatApr(topLive.annualizedLive) },
    { label: "Top 7d", symbol: top7d.symbol, value: formatApr(top7d.avg7d * 24 * 365) },
    { label: "Top 30d", symbol: top30d.symbol, value: formatApr(top30d.annualizedAvg30d) },
    { label: "Extreme 90d", symbol: topExtreme.symbol, value: `${topExtreme.percentile90d}th pct` },
    { label: "% positive", symbol: topPositive.symbol, value: `${topPositive.positiveShare7d}%` },
  ];
}

function sortRows(rows: ExplorerRow[], sort: SortState) {
  const copy = [...rows];

  copy.sort((left, right) => {
    const direction = sort.direction === "asc" ? 1 : -1;

    switch (sort.key) {
      case "symbol":
        return direction * left.symbol.localeCompare(right.symbol);
      case "market":
        return direction * left.asset.market.localeCompare(right.asset.market);
      case "annualizedLive":
        return direction * (left.annualizedLive - right.annualizedLive);
      case "avg7dApr":
        return direction * (left.avg7d - right.avg7d);
      case "annualizedAvg30d":
        return direction * (left.annualizedAvg30d - right.annualizedAvg30d);
      case "avg90dApr":
        return direction * (left.avg90d - right.avg90d);
      case "edgeVsAvg30d":
        return direction * (left.edgeVsAvg30d - right.edgeVsAvg30d);
      case "percentile90d":
        return direction * (left.percentile90d - right.percentile90d);
      case "positiveShare7d":
        return direction * (left.positiveShare7d - right.positiveShare7d);
      case "updatedAt":
        return direction * (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime());
      default:
        return 0;
    }
  });

  return copy;
}

function Chart({
  points,
  compact = false,
}: {
  points: { timestamp: string; rateHourly: number }[];
  compact?: boolean;
}) {
  const width = compact ? 168 : 960;
  const height = compact ? 54 : 270;
  const paddingX = compact ? 0 : 20;
  const paddingY = compact ? 0 : 18;
  const values = points.map((point) => point.rateHourly);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const zeroY = paddingY + innerHeight - ((0 - min) / range) * innerHeight;

  const path = points
    .map((point, index) => {
      const x = paddingX + (index / Math.max(points.length - 1, 1)) * innerWidth;
      const y = paddingY + innerHeight - ((point.rateHourly - min) / range) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? "mini-chart" : "detail-chart"} role="img" aria-label="Funding history">
      {!compact &&
        Array.from({ length: 6 }, (_, index) => {
          const y = paddingY + (index / 5) * innerHeight;
          return (
            <line
              key={`row-${index}`}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              className="detail-chart-grid"
            />
          );
        })}
      <line x1={paddingX} x2={width - paddingX} y1={zeroY} y2={zeroY} className="detail-chart-zero" />
      <path d={path} className={compact ? "mini-chart-path" : "detail-chart-path"} />
      {!compact &&
        points
          .filter((_, index) => index % Math.max(Math.floor(points.length / 6), 1) === 0)
          .map((point, index) => {
            const x =
              paddingX +
              (points.findIndex((entry) => entry.timestamp === point.timestamp) /
                Math.max(points.length - 1, 1)) *
                innerWidth;
            return (
              <text key={`${point.timestamp}-${index}`} x={x} y={height - 4} className="detail-chart-label">
                {formatDateLabel(point.timestamp)}
              </text>
            );
          })}
    </svg>
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

function SortHeader({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSort.key === sortKey;
  const glyph = active ? (activeSort.direction === "desc" ? "↓" : "↑") : "↕";

  return (
    <button type="button" className={active ? "sort-button sort-button-active" : "sort-button"} onClick={() => onSort(sortKey)}>
      <span>{label}</span>
      <span>{glyph}</span>
    </button>
  );
}

async function fetchExplorerPayload(venue: VenueId, market: MarketGroup | "all", search = "") {
  const params = new URLSearchParams({ venue, market });
  if (search.trim().length > 0) {
    params.set("search", search.trim());
  }

  const result = await fetch(`/api/explorer?${params.toString()}`, { cache: "no-store" });
  if (!result.ok) {
    throw new Error(`Explorer request failed with ${result.status}`);
  }

  return (await result.json()) as ExplorerResponse;
}

export function ExplorerView({
  venue = "hyperliquid",
  market = "all",
}: {
  venue?: VenueId;
  market?: MarketGroup | "all";
}) {
  const [selectedVenue, setSelectedVenue] = useState<VenueId>(venue);
  const initialMarket = market === "all" || VENUE_MARKETS[venue].includes(market) ? market : "all";
  const [selectedMarket, setSelectedMarket] = useState<MarketGroup | "all">(initialMarket);
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState<ExplorerResponse | null>(null);
  const [allVenueRows, setAllVenueRows] = useState<ExplorerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: "annualizedLive", direction: "desc" });
  const availableMarkets = ["all", ...VENUE_MARKETS[selectedVenue]] as const;

  useEffect(() => {
    if (selectedMarket !== "all" && !VENUE_MARKETS[selectedVenue].includes(selectedMarket)) {
      setSelectedMarket("all");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchExplorerPayload(selectedVenue, selectedMarket, search);
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

  useEffect(() => {
    let cancelled = false;

    async function loadAllVenues() {
      try {
        const payloads = await Promise.all(LIVE_VENUES.map((entry) => fetchExplorerPayload(entry, "all")));
        if (!cancelled) {
          setAllVenueRows(payloads.flatMap((payload) => payload.rows));
        }
      } catch {
        if (!cancelled) {
          setAllVenueRows([]);
        }
      }
    }

    void loadAllVenues();

    return () => {
      cancelled = true;
    };
  }, []);

  const baseRows = response?.rows ?? [];
  const rows = sortRows(baseRows, sort);
  const globalSummary = buildSummary(allVenueRows);
  const venueSummary = buildSummary(baseRows);
  const selectedVenueLabel = VENUES.find((item) => item.id === selectedVenue)?.label ?? selectedVenue;

  function handleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "desc" ? "asc" : "desc" }
        : { key, direction: key === "symbol" || key === "market" ? "asc" : "desc" },
    );
  }

  return (
    <div className="explorer-scene">
      <section className="explorer-board">
        <div className="explorer-hero-strip" />

        <aside className="explorer-side-rail">
          <div className="rail-brand">
            <span className="rail-mark" />
            <div>
              <p>Funding Desk</p>
              <strong>Explorer</strong>
            </div>
          </div>

          <div className="rail-profile">
            <div className="rail-avatar">F</div>
            <strong>{selectedVenueLabel}</strong>
            <span>{response?.source === "live" ? "Live venue feed" : "Fallback / pending adapter"}</span>
          </div>

          <div className="rail-block">
            <span className="rail-label">Venue</span>
            <div className="rail-pill-grid">
              {VENUES.filter((item) => item.id !== "boros").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedVenue === item.id ? "rail-pill rail-pill-active" : "rail-pill"}
                  onClick={() => setSelectedVenue(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rail-block">
            <span className="rail-label">Market</span>
            <div className="rail-pill-grid">
              {availableMarkets.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={selectedMarket === group ? "rail-pill rail-pill-active" : "rail-pill"}
                  onClick={() => setSelectedMarket(group)}
                >
                  {titleCase(group)}
                </button>
              ))}
            </div>
          </div>

          <label className="rail-search">
            <span className="rail-label">Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="BTC, ETH, NVDA" />
          </label>

          <div className="rail-status">
            <span>{response?.source === "live" ? "Live" : "Mock"}</span>
            <strong>{baseRows.length}</strong>
            <em>{response?.generatedAt ? `Updated ${formatMinutesAgo(response.generatedAt)}` : "Waiting for data"}</em>
          </div>
        </aside>

        <div className="explorer-main-stage">
          <header className="explorer-main-header">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>{selectedVenueLabel} funding dashboard</h2>
              <p className="hero-copy">
                A calmer market board for ranking live carry, comparing rolling averages, and opening detailed time-series only when needed.
              </p>
            </div>
          </header>

          <section className="summary-ribbon summary-ribbon-global">
            {globalSummary.map((item) => (
              <article key={`global-${item.label}`} className="summary-tile">
                <span>{item.label}</span>
                <strong>{item.symbol}</strong>
                <em>{item.value}</em>
              </article>
            ))}
          </section>

          <section className="summary-ribbon summary-ribbon-venue">
            {venueSummary.map((item) => (
              <article key={`venue-${item.label}`} className="summary-tile summary-tile-subtle">
                <span>{item.label}</span>
                <strong>{item.symbol}</strong>
                <em>{item.value}</em>
              </article>
            ))}
          </section>

          <section className="explorer-table-card">
            <div className="explorer-table-head">
              <div>
                <p className="eyebrow">Screen</p>
                <h3>Sortable funding table</h3>
              </div>
              <p className="panel-caption">
                Click any row to open the full chart and raw history.
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
                      <th><SortHeader label="Asset" sortKey="symbol" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Market" sortKey="market" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Live APR" sortKey="annualizedLive" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Avg 7d APR" sortKey="avg7dApr" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Avg 30d APR" sortKey="annualizedAvg30d" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Avg 90d APR" sortKey="avg90dApr" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="Delta vs 30d" sortKey="edgeVsAvg30d" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="90d pct" sortKey="percentile90d" activeSort={sort} onSort={handleSort} /></th>
                      <th><SortHeader label="% positive" sortKey="positiveShare7d" activeSort={sort} onSort={handleSort} /></th>
                      <th>Trend</th>
                      <th><SortHeader label="Updated" sortKey="updatedAt" activeSort={sort} onSort={handleSort} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.flatMap((row) => {
                      const rowKey = `${row.venue}-${row.symbol}`;
                      const expanded = rowKey === expandedRowKey;

                      return [
                        <tr
                          key={rowKey}
                          className={expanded ? "data-row data-row-active" : "data-row"}
                          onClick={() => setExpandedRowKey(expanded ? null : rowKey)}
                        >
                          <td>
                            <div className="asset-cell">
                              <strong>{row.symbol}</strong>
                              <span>{row.asset.name}</span>
                            </div>
                          </td>
                          <td>{titleCase(row.asset.market)}</td>
                          <td className={row.annualizedLive >= 0 ? "positive" : "negative"}>{formatApr(row.annualizedLive)}</td>
                          <td className={row.avg7d >= 0 ? "positive" : "negative"}>{formatApr(row.avg7d * 24 * 365)}</td>
                          <td className={row.annualizedAvg30d >= 0 ? "positive" : "negative"}>{formatApr(row.annualizedAvg30d)}</td>
                          <td className={row.avg90d >= 0 ? "positive" : "negative"}>{formatApr(row.avg90d * 24 * 365)}</td>
                          <td className={row.edgeVsAvg30d >= 0 ? "positive" : "negative"}>{formatApr(row.edgeVsAvg30d)}</td>
                          <td>{row.percentile90d}</td>
                          <td>{row.positiveShare7d}%</td>
                          <td><Chart points={row.history} compact /></td>
                          <td>{formatMinutesAgo(row.updatedAt)}</td>
                        </tr>,
                        expanded ? (
                          <tr key={`${rowKey}-detail`} className="detail-row">
                            <td colSpan={11}>
                              <div className="detail-panel detail-panel-board">
                                <div className="detail-summary detail-summary-clean">
                                  <article className="detail-stat"><span>Live APR</span><strong>{formatApr(row.annualizedLive)}</strong></article>
                                  <article className="detail-stat"><span>Avg 30d APR</span><strong>{formatApr(row.annualizedAvg30d)}</strong></article>
                                  <article className="detail-stat"><span>90d percentile</span><strong>{row.percentile90d}th</strong></article>
                                  <article className="detail-stat"><span>% positive 7d</span><strong>{row.positiveShare7d}%</strong></article>
                                </div>

                                <div className="detail-chart-shell">
                                  <Chart points={row.history} />
                                </div>

                                <div className="raw-table-wrap">
                                  <table className="raw-data-table">
                                    <thead>
                                      <tr>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Rate</th>
                                        <th>APR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...row.history].reverse().map((point) => {
                                        const stamp = formatDateTime(point.timestamp);
                                        return (
                                          <tr key={point.timestamp}>
                                            <td>{stamp.date}</td>
                                            <td>{stamp.time}</td>
                                            <td className={point.rateHourly >= 0 ? "positive" : "negative"}>{formatHourlyRate(point.rateHourly)}</td>
                                            <td className={point.rateHourly >= 0 ? "positive" : "negative"}>{formatApr(point.rateHourly * 24 * 365)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null,
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
