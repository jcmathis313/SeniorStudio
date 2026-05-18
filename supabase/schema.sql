-- SeniorStudio Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- ─── Communities ───
create table communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    text,
  icon        text,
  units       integer default 0,
  accent      text default '#007aff',
  created_at  timestamptz default now()
);

-- ─── Residents ───
create table residents (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references communities(id) on delete cascade,
  email         text not null,
  first_name    text not null,
  last_name     text not null,
  phone         text,
  unit_number   text,
  created_at    timestamptz default now()
);

create index idx_residents_community on residents(community_id);
create unique index idx_residents_email_community on residents(email, community_id);

-- ─── Collections (saved finish selections) ───
create table collections (
  id            uuid primary key default gen_random_uuid(),
  resident_id   uuid not null references residents(id) on delete cascade,
  community_id  uuid not null references communities(id) on delete cascade,
  name          text not null,
  items         jsonb default '[]'::jsonb,
  saved_at      timestamptz default now(),
  created_at    timestamptz default now()
);

create index idx_collections_resident on collections(resident_id);

-- ─── Welcome Boxes ───
create table welcome_boxes (
  id              uuid primary key default gen_random_uuid(),
  resident_id     uuid not null references residents(id) on delete cascade,
  community_id    uuid not null references communities(id) on delete cascade,
  status          text not null default 'pending'
                    check (status in ('pending', 'requested', 'preparing', 'shipped', 'received')),
  requested_at    timestamptz,
  shipped_at      timestamptz,
  received_at     timestamptz,
  tracking_number text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_welcome_boxes_resident on welcome_boxes(resident_id);

-- ─── Design Samples ───
create table design_samples (
  id              uuid primary key default gen_random_uuid(),
  resident_id     uuid not null references residents(id) on delete cascade,
  community_id    uuid not null references communities(id) on delete cascade,
  collection_id   uuid references collections(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending', 'requested', 'preparing', 'shipped', 'received', 'returned')),
  requested_at    timestamptz,
  shipped_at      timestamptz,
  received_at     timestamptz,
  returned_at     timestamptz,
  tracking_number text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_design_samples_resident on design_samples(resident_id);

-- ─── Auto-update updated_at timestamps ───
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_welcome_boxes_updated
  before update on welcome_boxes
  for each row execute function update_updated_at();

create trigger trg_design_samples_updated
  before update on design_samples
  for each row execute function update_updated_at();

-- ─── Seed: Insert the three hardcoded communities ───
insert into communities (name, location, icon, units, accent) values
  ('Maple Ridge Senior Living', 'Lancaster, PA', '🏡', 120, '#007aff'),
  ('Garden View Estates',       'York, PA',      '🌿', 85,  '#34c759'),
  ('Heritage Commons',          'Harrisburg, PA', '🏛️', 200, '#af52de');

-- ─── Enable Row Level Security (configure policies as needed) ───
alter table communities    enable row level security;
alter table residents      enable row level security;
alter table collections    enable row level security;
alter table welcome_boxes  enable row level security;
alter table design_samples enable row level security;

-- Temporary: allow all reads for authenticated users (tighten per-role later)
create policy "Allow read access" on communities    for select using (true);
create policy "Allow read access" on residents      for select using (true);
create policy "Allow read access" on collections    for select using (true);
create policy "Allow read access" on welcome_boxes  for select using (true);
create policy "Allow read access" on design_samples for select using (true);

-- ─── Shipping Orders ───
create table shipping_orders (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null check (type in ('sample_request','literature','spec_sheet','other')),
  status             text not null default 'new'
                       check (status in ('new','processing','packed','shipped','delivered','cancelled')),
  source_form        text,
  requester          jsonb not null default '{}'::jsonb,
  ship_to            jsonb not null default '{}'::jsonb,
  items              jsonb not null default '[]'::jsonb,
  carrier            text check (carrier in ('ups','fedex','usps','hand_delivery','other') or carrier is null),
  service_level      text,
  tracking_number    text,
  shipped_at         timestamptz,
  estimated_delivery date,
  delivered_at       timestamptz,
  assigned_to        text,
  community_id       uuid references communities(id) on delete set null,
  internal_notes     jsonb not null default '[]'::jsonb,
  history            jsonb not null default '[]'::jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index idx_shipping_orders_status on shipping_orders(status);
create index idx_shipping_orders_type on shipping_orders(type);
create index idx_shipping_orders_community on shipping_orders(community_id);

create trigger trg_shipping_orders_updated
  before update on shipping_orders
  for each row execute function update_updated_at();

alter table shipping_orders enable row level security;
create policy "Allow read access"   on shipping_orders for select using (true);
create policy "Allow write access"  on shipping_orders for insert with check (true);
create policy "Allow update access" on shipping_orders for update using (true);
create policy "Allow delete access" on shipping_orders for delete using (true);

-- ─── Admin Users ───
create table admin_users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  phone          text,
  job_title      text,
  role           text not null default 'user' check (role in ('superadmin', 'admin', 'user')),
  module_access  jsonb not null default '[]'::jsonb,
  avatar_url     text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create trigger trg_admin_users_updated
  before update on admin_users
  for each row execute function update_updated_at();

alter table admin_users enable row level security;
create policy "Allow read access"   on admin_users for select using (true);
create policy "Allow write access"  on admin_users for insert with check (true);
create policy "Allow update access" on admin_users for update using (true);
create policy "Allow delete access" on admin_users for delete using (true);

-- ─── Admin User ↔ Community Assignments ───
create table admin_user_communities (
  admin_user_id  uuid not null references admin_users(id) on delete cascade,
  community_id   uuid not null references communities(id) on delete cascade,
  primary key (admin_user_id, community_id)
);

alter table admin_user_communities enable row level security;
create policy "Allow read access"   on admin_user_communities for select using (true);
create policy "Allow write access"  on admin_user_communities for insert with check (true);
create policy "Allow update access" on admin_user_communities for update using (true);
create policy "Allow delete access" on admin_user_communities for delete using (true);
