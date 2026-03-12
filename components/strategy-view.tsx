import { hedgeOpportunities, snapshots, spreadOpportunities } from "../lib/mock-data";
import { formatApr, formatHourlyRate } from "../lib/format";
import { ProductPageId, VENUES } from "../lib/domain";

const COPY: Record<
  Exclude<ProductPageId, "explorer">,
  { title: string; subtitle: string; bullets: string[] }
> = {
  trend: {
    title: "Trend normalizes the current print",
    subtitle: "This page should answer whether current funding is stretched, reverting, or confirming momentum.",
    bullets: [
      "Daily and intraday moving averages from the same canonical snapshots table.",
      "Percentile, z-score, and distance versus MA 7d / 30d / 90d.",
      "Single-asset deep dive after Explorer identifies a candidate.",
    ],
  },
  compare: {
    title: "Compare ranks venues for the same instrument",
    subtitle: "Shared calculations with Spread, but optimized for venue selection before entering a trade.",
    bullets: [
      "Same asset, multiple venues, sorted by live or rolling annualized funding.",
      "One normalized mapping layer per instrument per venue.",
      "Designed to expose best venue now and best venue on average.",
    ],
  },
  spread: {
    title: "Spread turns funding differentials into tradeable setups",
    subtitle: "This is the arb view: short the rich venue, long the cheap venue, then annualize the carry.",
    bullets: [
      "Spread table sourced from pairwise venue aggregates.",
      "Gross APR and leveraged APR by preset risk buckets.",
      "Execution hooks later for borrow costs, fees, and margin impact.",
    ],
  },
  hedge: {
    title: "Hedge compares Boros implied rates to funding carry",
    subtitle: "This page becomes useful when implied borrow is directly benchmarked against rolling funding averages.",
    bullets: [
      "Boros implied APR versus funding MA 7d and MA 30d.",
      "Simple decision state: cheap, neutral, rich.",
      "Later extension: net hedge carry after fees and borrow basis.",
    ],
  },
};

export function StrategyView({ page }: { page: Exclude<ProductPageId, "explorer"> }) {
  const copy = COPY[page];

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <p className="eyebrow">Page blueprint</p>
          <h2>{copy.title}</h2>
          <p className="hero-copy">{copy.subtitle}</p>
        </div>
        <div className="hero-callout">
          <span>Why this exists</span>
          <strong>{page === "spread" ? "Trade construction" : "Decision support"}</strong>
          <em>Built on the same normalized funding history backend.</em>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Requirements</p>
            <h3>What the backend has to provide</h3>
          </div>
        </div>
        <ul className="bullet-list">
          {copy.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      {page === "trend" && (
        <section className="panel split-grid">
          {snapshots
            .filter((snapshot) => snapshot.venue === "hyperliquid")
            .slice(0, 4)
            .map((snapshot) => (
              <article key={`${snapshot.venue}-${snapshot.symbol}`} className="mini-panel">
                <span>{snapshot.symbol}</span>
                <strong>{formatHourlyRate(snapshot.liveHourlyRate)}</strong>
                <p>MA 7d {formatHourlyRate(snapshot.avg7d)} | MA 30d {formatHourlyRate(snapshot.avg30d)}</p>
              </article>
            ))}
        </section>
      )}

      {page === "compare" && (
        <section className="panel">
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
                {snapshots
                  .filter((snapshot) => ["BTC", "ETH", "SOL"].includes(snapshot.symbol))
                  .map((snapshot) => (
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
        </section>
      )}

      {page === "spread" && (
        <section className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Long</th>
                  <th>Short</th>
                  <th>30d spread</th>
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
        </section>
      )}

      {page === "hedge" && (
        <section className="panel">
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
        </section>
      )}
    </div>
  );
}
