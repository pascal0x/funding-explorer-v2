# Funding Explorer V2

Explorer-first rewrite of the original prototype. This repo is structured for:

- `Explorer` as the main screener
- `Trend`, `Compare`, `Spread`, and `Hedge` on a shared funding data model
- backend ingestion and database storage instead of direct client-only API reads

## Current state

- Next.js + TypeScript app shell
- Explorer screen with backend-ready metrics and mock domain data
- Product blueprints for Trend / Compare / Spread / Hedge
- SQL schema draft in [`db/schema.sql`](./db/schema.sql)

## Next implementation steps

1. Add a database layer and migrations.
2. Implement venue adapters for Hyperliquid, Binance, Bybit, OKX, dYdX, Lighter, Asterdex, and Boros.
3. Create ingestion jobs for raw funding snapshots.
4. Materialize `7d`, `30d`, `90d` aggregates and spread snapshots.
5. Replace mock data in `lib/mock-data.ts` with real queries.
