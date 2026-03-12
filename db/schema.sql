create table venues (
  id text primary key,
  label text not null,
  venue_type text not null check (venue_type in ('dex', 'cex', 'rates')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table assets (
  id bigserial primary key,
  symbol text not null unique,
  name text not null,
  market_group text not null check (market_group in ('crypto', 'stocks', 'commodities', 'fx-etf')),
  created_at timestamptz not null default now()
);

create table instrument_mappings (
  id bigserial primary key,
  venue_id text not null references venues(id),
  asset_id bigint not null references assets(id),
  venue_symbol text not null,
  funding_interval_minutes integer not null,
  quote_currency text,
  metadata jsonb not null default '{}'::jsonb,
  unique (venue_id, venue_symbol),
  unique (venue_id, asset_id)
);

create table funding_snapshots (
  id bigserial primary key,
  venue_id text not null references venues(id),
  asset_id bigint not null references assets(id),
  observed_at timestamptz not null,
  funding_rate decimal(16, 10) not null,
  annualized_rate decimal(16, 10) not null,
  premium_index decimal(16, 10),
  source_payload jsonb not null default '{}'::jsonb,
  unique (venue_id, asset_id, observed_at)
);

create index funding_snapshots_lookup_idx
  on funding_snapshots (asset_id, venue_id, observed_at desc);

create table funding_aggregates (
  id bigserial primary key,
  venue_id text not null references venues(id),
  asset_id bigint not null references assets(id),
  bucket text not null check (bucket in ('7d', '30d', '90d')),
  computed_at timestamptz not null,
  avg_hourly_rate decimal(16, 10) not null,
  avg_annualized_rate decimal(16, 10) not null,
  max_hourly_rate decimal(16, 10),
  min_hourly_rate decimal(16, 10),
  positive_share decimal(8, 4),
  percentile_rank decimal(8, 4),
  sample_count integer not null,
  unique (venue_id, asset_id, bucket, computed_at)
);

create table spread_snapshots (
  id bigserial primary key,
  asset_id bigint not null references assets(id),
  long_venue_id text not null references venues(id),
  short_venue_id text not null references venues(id),
  observed_at timestamptz not null,
  spread_hourly_rate decimal(16, 10) not null,
  gross_annualized_rate decimal(16, 10) not null,
  fees_annualized_rate decimal(16, 10),
  net_annualized_rate decimal(16, 10),
  unique (asset_id, long_venue_id, short_venue_id, observed_at)
);

create table implied_rate_snapshots (
  id bigserial primary key,
  asset_id bigint not null references assets(id),
  source text not null,
  observed_at timestamptz not null,
  implied_annualized_rate decimal(16, 10) not null,
  source_payload jsonb not null default '{}'::jsonb,
  unique (asset_id, source, observed_at)
);
