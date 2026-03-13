"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import {
  ExplorerResponse,
  ExplorerRow,
  MarketGroup,
  ProductPageId,
  VENUE_MARKETS,
  VENUES,
  VenueId,
} from "../lib/domain";
import { formatApr, formatHourlyRate, titleCase } from "../lib/format";

const LIVE_VENUES = ["hyperliquid", "binance", "bybit"] satisfies VenueId[];
const APP_VERSION = "v0.1.0";
const NAV_ITEMS: { id: ProductPageId; href: string; label: string; icon: string }[] = [
  { id: "explorer", href: "/", label: "Explorer", icon: "◫" },
  { id: "trend", href: "/trend", label: "Trend", icon: "∿" },
  { id: "compare", href: "/compare", label: "Compare", icon: "≡" },
  { id: "spread", href: "/spread", label: "Spread", icon: "⇄" },
  { id: "hedge", href: "/hedge", label: "Swaps", icon: "◎" },
];
const THEME_OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "light", icon: "◐", label: "Light" },
  { mode: "dark", icon: "☾", label: "Dark" },
  { mode: "auto", icon: "◌", label: "Auto" },
];

type ThemeMode = "light" | "dark" | "auto";

type SortKey =
  | "symbol"
  | "market"
  | "annualizedLive"
  | "avg7dApr"
  | "annualizedAvg30d"
  | "avg90dApr"
  | "positiveShare7d";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type SummaryItem = {
  label: string;
  symbol: string;
  value: string;
};

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.theme = resolved;
}

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

function assetVisual(symbol: string) {
  const visuals: Record<string, { mark: string; tone: string }> = {
    BTC: { mark: "B", tone: "asset-badge-bitcoin" },
    ETH: { mark: "E", tone: "asset-badge-ethereum" },
    SOL: { mark: "S", tone: "asset-badge-solana" },
    HYPE: { mark: "H", tone: "asset-badge-hype" },
    NVDA: { mark: "N", tone: "asset-badge-nvda" },
    TSLA: { mark: "T", tone: "asset-badge-tsla" },
    GOLD: { mark: "G", tone: "asset-badge-gold" },
    EUR: { mark: "€", tone: "asset-badge-eur" },
  };

  return visuals[symbol] ?? { mark: symbol.slice(0, 1), tone: "asset-badge-default" };
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
      case "positiveShare7d":
        return direction * (left.positiveShare7d - right.positiveShare7d);
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  const coordinates = useMemo(
    () =>
      points.map((point, index) => {
        const x = paddingX + (index / Math.max(points.length - 1, 1)) * innerWidth;
        const y = paddingY + innerHeight - ((point.rateHourly - min) / range) * innerHeight;
        return { ...point, x, y };
      }),
    [innerHeight, innerWidth, max, min, paddingX, paddingY, points, range],
  );

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  const hoveredPoint = hoveredIndex === null ? null : coordinates[hoveredIndex];
  const tooltipX = hoveredPoint ? Math.min(Math.max(hoveredPoint.x + 14, 80), width - 120) : 0;
  const tooltipY = hoveredPoint ? Math.max(hoveredPoint.y - 62, 18) : 0;

  function handlePointerMove(event: MouseEvent<SVGSVGElement>) {
    if (compact) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * width;
    const ratio = Math.min(Math.max((relativeX - paddingX) / Math.max(innerWidth, 1), 0), 1);
    const nextIndex = Math.round(ratio * Math.max(points.length - 1, 0));
    setHoveredIndex(nextIndex);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={compact ? "mini-chart" : "detail-chart"}
      role="img"
      aria-label="Funding history"
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setHoveredIndex(null)}
    >
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
        coordinates
          .filter((_, index) => index % Math.max(Math.floor(points.length / 6), 1) === 0)
          .map((point, index) => (
            <text key={`${point.timestamp}-${index}`} x={point.x} y={height - 4} className="detail-chart-label">
              {formatDateLabel(point.timestamp)}
            </text>
          ))}
      {!compact && hoveredPoint ? (
        <>
          <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={paddingY} y2={height - paddingY} className="detail-chart-cursor" />
          <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4.5" className="detail-chart-dot" />
          <g transform={`translate(${tooltipX}, ${tooltipY})`} className="detail-chart-tooltip">
            <rect width="110" height="52" rx="12" ry="12" className="detail-chart-tooltip-box" />
            <text x="10" y="17" className="detail-chart-tooltip-date">{formatDateLabel(hoveredPoint.timestamp)}</text>
            <text x="10" y="31" className="detail-chart-tooltip-rate">{formatHourlyRate(hoveredPoint.rateHourly)}</text>
            <text x="10" y="45" className="detail-chart-tooltip-apr">{formatApr(hoveredPoint.rateHourly * 24 * 365)}</text>
          </g>
        </>
      ) : null}
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

function SummarySkeleton({ subtle = false }: { subtle?: boolean }) {
  return (
    <section className={subtle ? "summary-ribbon summary-ribbon-venue" : "summary-ribbon summary-ribbon-global"}>
      {Array.from({ length: 5 }, (_, index) => (
        <article key={index} className={`summary-tile summary-tile-skeleton${subtle ? " summary-tile-subtle" : ""}`}>
          <span className="skeleton-line skeleton-line-short" />
          <strong className="skeleton-line skeleton-line-medium" />
          <em className="skeleton-line skeleton-line-short" />
        </article>
      ))}
    </section>
  );
}

function TableSkeleton() {
  return (
    <div className="table-skeleton">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="table-skeleton-row">
          <span className="skeleton-line skeleton-line-medium" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line skeleton-line-short" />
        </div>
      ))}
    </div>
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
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const availableMarkets = ["all", ...VENUE_MARKETS[selectedVenue]] as const;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("funding-theme");
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "auto" ? storedTheme : "auto";

    setThemeMode(initialTheme);
    applyTheme(initialTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(initialTheme);
    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, []);

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

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    window.localStorage.setItem("funding-theme", mode);
    applyTheme(mode);
  }

  return (
    <div className="explorer-scene explorer-scene-standalone">
      <section className="explorer-board">
        <div className="explorer-hero-strip" />

        <aside className="explorer-side-rail explorer-side-rail-navfirst">
          <div className="rail-nav-wrap rail-nav-wrap-clean">
            <nav className="rail-nav rail-nav-clean">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={item.id === "explorer" ? "rail-nav-item rail-nav-item-active" : "rail-nav-item"}
                >
                  <span className="rail-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="rail-divider" />

          <div className="rail-filter-stack">
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
          </div>

          <div className="rail-footer">
            <div className="rail-theme-footer">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  className={themeMode === option.mode ? "theme-icon-button theme-icon-button-active" : "theme-icon-button"}
                  onClick={() => handleThemeChange(option.mode)}
                  aria-label={option.label}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>
            <span className="rail-version">{APP_VERSION}</span>
          </div>
        </aside>

        <div className="explorer-content-column">
          {loading && globalSummary.length === 0 ? (
            <div className="explorer-floating-summary">
              <SummarySkeleton />
            </div>
          ) : (
            <section className="summary-cluster explorer-floating-summary">
              <div className="summary-cluster-head">
                <p className="eyebrow">All venues</p>
                <h3>Top five across venues</h3>
              </div>
              <section className="summary-ribbon summary-ribbon-global">
                {globalSummary.map((item) => (
                  <article key={`global-${item.label}`} className="summary-tile summary-tile-tall">
                    <span>{item.label}</span>
                    <div className="summary-symbol">
                      <i className={`asset-badge ${assetVisual(item.symbol).tone}`}>{assetVisual(item.symbol).mark}</i>
                      <strong>{item.symbol}</strong>
                    </div>
                    <em>{item.value}</em>
                  </article>
                ))}
              </section>
            </section>
          )}

          <div className="explorer-main-stage">
          <header className="explorer-main-header">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Explore Funding Rates</h2>
              <p className="hero-copy">
                Historical, Average And Live Funding Rates For All Perps
              </p>
            </div>
          </header>

          {loading && venueSummary.length === 0 ? (
            <SummarySkeleton subtle />
          ) : (
            <section className="summary-cluster">
              <div className="summary-cluster-head">
                <p className="eyebrow">{selectedVenueLabel}</p>
                <h3>Top five on venue</h3>
              </div>
              <section className="summary-ribbon summary-ribbon-venue">
                {venueSummary.map((item) => (
                  <article key={`venue-${item.label}`} className="summary-tile summary-tile-subtle summary-tile-tall">
                    <span>{item.label}</span>
                    <div className="summary-symbol">
                      <i className={`asset-badge ${assetVisual(item.symbol).tone}`}>{assetVisual(item.symbol).mark}</i>
                      <strong>{item.symbol}</strong>
                    </div>
                    <em>{item.value}</em>
                  </article>
                ))}
              </section>
            </section>
          )}

          <section className="explorer-table-card">
            {loading ? (
              <TableSkeleton />
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
                      <th><SortHeader label="% positive" sortKey="positiveShare7d" activeSort={sort} onSort={handleSort} /></th>
                      <th>Trend</th>
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
                              <div className="asset-symbol-row">
                                <i className={`asset-badge ${assetVisual(row.symbol).tone}`}>{assetVisual(row.symbol).mark}</i>
                                <strong>{row.symbol}</strong>
                              </div>
                              <span>{row.asset.name}</span>
                            </div>
                          </td>
                          <td>{titleCase(row.asset.market)}</td>
                          <td className={row.annualizedLive >= 0 ? "positive" : "negative"}>{formatApr(row.annualizedLive)}</td>
                          <td className={row.avg7d >= 0 ? "positive" : "negative"}>{formatApr(row.avg7d * 24 * 365)}</td>
                          <td className={row.annualizedAvg30d >= 0 ? "positive" : "negative"}>{formatApr(row.annualizedAvg30d)}</td>
                          <td className={row.avg90d >= 0 ? "positive" : "negative"}>{formatApr(row.avg90d * 24 * 365)}</td>
                          <td>{row.positiveShare7d}%</td>
                          <td><Chart points={row.history} compact /></td>
                        </tr>,
                        expanded ? (
                          <tr key={`${rowKey}-detail`} className="detail-row">
                            <td colSpan={8}>
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
        </div>
      </section>
    </div>
  );
}
