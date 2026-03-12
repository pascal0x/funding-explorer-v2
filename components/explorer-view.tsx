import { ASSETS, MarketGroup, VENUES, VenueId } from "../lib/domain";
import { formatApr, formatHourlyRate, formatMinutesAgo, titleCase } from "../lib/format";
import { getExplorerRows, getVenueCoverage } from "../lib/mock-data";

function Sparkline({ points }: { points: { rateHourly: number }[] }) {
  const width = 180;
  const height = 56;
  const values = points.map((point) => point.rateHourly);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
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

export function ExplorerView({
  venue = "hyperliquid",
  market = "all",
}: {
  venue?: VenueId;
  market?: MarketGroup | "all";
}) {
  const rows = getExplorerRows({ venue, market });
  const bestLive = rows[0];
  const mostExtreme = [...rows].sort((left, right) => right.percentile90d - left.percentile90d)[0];
  const bestMean = [...rows].sort((left, right) => right.avg30d - left.avg30d)[0];
  const coverage = getVenueCoverage();

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Funding intelligence</p>
          <h2>Explorer is the home screen.</h2>
          <p className="hero-copy">
            Screen assets by current funding, multi-window averages, percentile vs 90d history,
            and edge versus the rolling baseline. This is the page to optimize first because it
            drives the rest of the decision flow.
          </p>
        </div>

        <div className="hero-card-grid">
          <article className="metric-card accent-cyan">
            <span>Top live APR</span>
            <strong>{bestLive.symbol}</strong>
            <em>{formatApr(bestLive.annualizedLive)}</em>
          </article>
          <article className="metric-card accent-amber">
            <span>Top 30d mean</span>
            <strong>{bestMean.symbol}</strong>
            <em>{formatApr(bestMean.annualizedAvg30d)}</em>
          </article>
          <article className="metric-card accent-pink">
            <span>Most extreme vs 90d</span>
            <strong>{mostExtreme.symbol}</strong>
            <em>{mostExtreme.percentile90d}th percentile</em>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Coverage</p>
            <h3>Venue rollout and ingestion scope</h3>
          </div>
        </div>

        <div className="chip-row">
          {VENUES.filter((item) => item.id !== "boros").map((item) => {
            const count = coverage.find((entry) => entry.venue === item.id)?.instruments ?? 0;
            return (
              <div key={item.id} className="coverage-chip">
                <strong>{item.label}</strong>
                <span>{count} mapped instruments</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Screen</p>
            <h3>{VENUES.find((item) => item.id === venue)?.label} funding screener</h3>
          </div>
          <p className="panel-caption">
            Ready to swap from mock rows to DB-backed aggregates for `7d`, `30d`, `90d`, and ranking endpoints.
          </p>
        </div>

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
                <th>Trend</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                  <td>
                    <Sparkline points={row.history} />
                  </td>
                  <td>{formatMinutesAgo(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
