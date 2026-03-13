"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { hedgeOpportunities, snapshots, spreadOpportunities } from "../lib/mock-data";
import { formatApr, formatHourlyRate } from "../lib/format";
import { ProductPageId, VENUES } from "../lib/domain";

const COPY: Record<
  Exclude<ProductPageId, "explorer">,
  { title: string; subtitle: string; eyebrow: string; bullets: string[] }
> = {
  trend: {
    eyebrow: "Trend",
    title: "Analyse Funding Rate Momentum",
    subtitle: "Analyse The Trends Using Moving Averages And Standard Deviation Of Funding Rates",
    bullets: [
      "Daily and intraday moving averages from the same canonical snapshots table.",
      "Percentile, z-score, and distance versus MA 7d / 30d / 90d.",
      "Single-asset deep dive after Explorer identifies a candidate.",
    ],
  },
  compare: {
    eyebrow: "Compare",
    title: "Find The Best Funding Rates",
    subtitle: "Find The Best Funding Rates Across All Venues And Markets",
    bullets: [
      "Same asset, multiple venues, sorted by live or rolling annualized funding.",
      "One normalized mapping layer per instrument per venue.",
      "Designed to expose best venue now and best venue on average.",
    ],
  },
  spread: {
    eyebrow: "Spread",
    title: "Find The Highest Spread",
    subtitle: "Spot Cross-Exchange Funding Rate Arbitrage Opportunities",
    bullets: [
      "Spread table sourced from pairwise venue aggregates.",
      "Gross APR and leveraged APR by preset risk buckets.",
      "Execution hooks later for borrow costs, fees, and margin impact.",
    ],
  },
  hedge: {
    eyebrow: "Swaps",
    title: "Funding Rate Swap",
    subtitle: "Compare Boros' Fixed Rate (Implied Rate) To The Variable Funding Rate To Find The Best Swaps",
    bullets: [
      "Boros implied APR versus funding MA 7d and MA 30d.",
      "Simple decision state: cheap, neutral, rich.",
      "Later extension: net hedge carry after fees and borrow basis.",
    ],
  },
};

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

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function StrategyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="strategy-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={entry.name} className="strategy-tooltip-row">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <em>{typeof entry.value === "number" ? `${entry.value.toFixed(2)}%` : entry.value}</em>
        </div>
      ))}
    </div>
  );
}

export function StrategyView({ page }: { page: Exclude<ProductPageId, "explorer"> }) {
  const copy = COPY[page];
  const hyperRows = snapshots.filter((snapshot) => snapshot.venue === "hyperliquid");
  const trendRows = hyperRows.slice(0, 4);
  const trendFocus = trendRows[0];
  const trendChart = trendFocus.history.map((point) => ({
    date: formatShortDate(point.timestamp),
    Funding: point.rateHourly * 24 * 365,
    "MA 7d": trendFocus.avg7d * 24 * 365,
    "MA 30d": trendFocus.avg30d * 24 * 365,
  }));
  const compareRows = snapshots.filter((snapshot) => ["BTC", "ETH", "SOL"].includes(snapshot.symbol));
  const compareBars = compareRows.map((snapshot) => ({
    label: `${snapshot.symbol} ${VENUES.find((venue) => venue.id === snapshot.venue)?.label ?? snapshot.venue}`,
    Live: snapshot.liveHourlyRate * 24 * 365,
    "Avg 30d": snapshot.avg30d * 24 * 365,
  }));
  const spreadBars = spreadOpportunities.map((spread) => ({
    label: spread.symbol,
    APR: spread.grossApr,
    "3x": spread.leveragedApr[1].apr,
    "5x": spread.leveragedApr[2].apr,
  }));
  const swapsBars = hedgeOpportunities.map((row) => ({
    label: row.symbol,
    Boros: row.borosImpliedApr,
    "Funding 7d": row.fundingMa7dApr,
    "Funding 30d": row.fundingMa30dApr,
  }));

  return (
    <div className="strategy-layout">
      <section className="strategy-board">
        <div className="strategy-headline">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p className="hero-copy">{copy.subtitle}</p>
        </div>

        <section className="strategy-kpi-grid">
          {(page === "trend" ? trendRows : compareRows.slice(0, 4)).map((snapshot) => (
            <article key={`${snapshot.venue}-${snapshot.symbol}`} className="strategy-kpi-card">
              <span>{snapshot.symbol}</span>
              <strong>{formatApr(snapshot.liveHourlyRate * 24 * 365)}</strong>
              <em>{VENUES.find((venue) => venue.id === snapshot.venue)?.label ?? snapshot.venue}</em>
            </article>
          ))}
        </section>

        <div className="strategy-grid">
          <section className="strategy-panel strategy-panel-chart">
            <div className="strategy-panel-head">
              <div>
                <p className="eyebrow">Chart</p>
                <h3>
                  {page === "trend"
                    ? `${trendFocus.symbol} funding curve`
                    : page === "compare"
                      ? "Cross-venue ranking"
                      : page === "spread"
                        ? "Spread opportunities"
                        : "Fixed vs variable rate"}
                </h3>
              </div>
            </div>

            <div className="strategy-chart-shell">
              {page === "trend" && (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendChart}>
                    <CartesianGrid stroke="rgba(120,120,130,0.12)" strokeDasharray="4 8" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip content={<StrategyTooltip />} />
                    <Line type="monotone" dataKey="Funding" stroke="#62b6bf" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="MA 7d" stroke="#2f5f6b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="MA 30d" stroke="#c99a1c" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {page === "compare" && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={compareBars}>
                    <CartesianGrid stroke="rgba(120,120,130,0.12)" strokeDasharray="4 8" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={56} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                    <Tooltip content={<StrategyTooltip />} />
                    <Bar dataKey="Live" fill="#62b6bf" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Avg 30d" fill="#2f5f6b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {page === "spread" && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={spreadBars}>
                    <CartesianGrid stroke="rgba(120,120,130,0.12)" strokeDasharray="4 8" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                    <Tooltip content={<StrategyTooltip />} />
                    <Bar dataKey="APR" fill="#62b6bf" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="3x" fill="#2f5f6b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="5x" fill="#c99a1c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {page === "hedge" && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={swapsBars}>
                    <CartesianGrid stroke="rgba(120,120,130,0.12)" strokeDasharray="4 8" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9899a3", fontSize: 11 }} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                    <Tooltip content={<StrategyTooltip />} />
                    <Area type="monotone" dataKey="Boros" stroke="#62b6bf" fill="rgba(98,182,191,0.18)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="Funding 7d" stroke="#2f5f6b" fill="rgba(47,95,107,0.12)" strokeWidth={2.1} />
                    <Area type="monotone" dataKey="Funding 30d" stroke="#c99a1c" fill="rgba(201,154,28,0.12)" strokeWidth={2.1} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="strategy-panel strategy-panel-side">
            <div className="strategy-panel-head">
              <div>
                <p className="eyebrow">Notes</p>
                <h3>Decision frame</h3>
              </div>
            </div>
            <ul className="bullet-list strategy-bullets">
              {copy.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="strategy-panel strategy-panel-table">
          <div className="strategy-panel-head">
            <div>
              <p className="eyebrow">Table</p>
              <h3>
                {page === "trend"
                  ? "Top momentum snapshots"
                  : page === "compare"
                    ? "Venue comparison"
                    : page === "spread"
                      ? "Spread table"
                      : "Swap candidates"}
              </h3>
            </div>
          </div>

          {page === "trend" && (
            <div className="strategy-cards-grid">
              {trendRows.map((snapshot) => (
                <article key={`${snapshot.venue}-${snapshot.symbol}`} className="strategy-signal-card">
                  <div className="asset-symbol-row">
                    <i className={`asset-badge ${assetVisual(snapshot.symbol).tone}`}>{assetVisual(snapshot.symbol).mark}</i>
                    <strong>{snapshot.symbol}</strong>
                  </div>
                  <span>{VENUES.find((venue) => venue.id === snapshot.venue)?.label}</span>
                  <em>Live {formatApr(snapshot.liveHourlyRate * 24 * 365)}</em>
                  <em>MA 7d {formatApr(snapshot.avg7d * 24 * 365)}</em>
                  <em>MA 30d {formatApr(snapshot.avg30d * 24 * 365)}</em>
                </article>
              ))}
            </div>
          )}

          {page === "compare" && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Venue</th>
                    <th>Live APR</th>
                    <th>Avg 30d APR</th>
                    <th>Bias</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((snapshot) => (
                    <tr key={`${snapshot.venue}-${snapshot.symbol}`}>
                      <td>{snapshot.symbol}</td>
                      <td>{VENUES.find((venue) => venue.id === snapshot.venue)?.label}</td>
                      <td>{formatApr(snapshot.liveHourlyRate * 24 * 365)}</td>
                      <td>{formatApr(snapshot.avg30d * 24 * 365)}</td>
                      <td>{snapshot.liveHourlyRate > snapshot.avg30d ? "Above mean" : "Near mean"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {page === "spread" && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Long</th>
                    <th>Short</th>
                    <th>Spread 30d</th>
                    <th>APR</th>
                    <th>3x</th>
                    <th>5x</th>
                  </tr>
                </thead>
                <tbody>
                  {spreadOpportunities.map((spread) => (
                    <tr key={`${spread.symbol}-${spread.longVenue}-${spread.shortVenue}`}>
                      <td>{spread.symbol}</td>
                      <td>{VENUES.find((venue) => venue.id === spread.longVenue)?.label}</td>
                      <td>{VENUES.find((venue) => venue.id === spread.shortVenue)?.label}</td>
                      <td>{formatHourlyRate(spread.spread30d)}</td>
                      <td>{formatApr(spread.grossApr)}</td>
                      <td>{formatApr(spread.leveragedApr[1].apr)}</td>
                      <td>{formatApr(spread.leveragedApr[2].apr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {page === "hedge" && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Boros implied</th>
                    <th>Funding MA 7d</th>
                    <th>Funding MA 30d</th>
                    <th>Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {hedgeOpportunities.map((row) => (
                    <tr key={row.symbol}>
                      <td>{row.symbol}</td>
                      <td>{formatApr(row.borosImpliedApr)}</td>
                      <td>{formatApr(row.fundingMa7dApr)}</td>
                      <td>{formatApr(row.fundingMa30dApr)}</td>
                      <td>{row.fundingTrend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
