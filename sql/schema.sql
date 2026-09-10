-- ============================================================================
-- Goldary — مخطط قاعدة البيانات المرجعي (Reference Schema)
-- ============================================================================
-- مُستخرَج آلياً من مخطط PostgREST/OpenAPI للقاعدة الحيّة (Supabase).
-- الغرض: توثيق البنية في version control (حوكمة + نسخ احتياطي + مراجعة).
--
-- ✅ يشمل: الجداول، الأعمدة، الأنواع، NOT NULL، الافتراضيات، المفاتيح
--    الأساسية، والمفاتيح الأجنبية المكتشفة.
-- ⚠️ لا يُلتقط عبر REST (خذيه من pg_dump --schema-only): سياسات RLS،
--    الفهارس، قيود UNIQUE/CHECK، سلوك ON DELETE، والمشغّلات. راجعي sql/README.md.
--
-- الأعمدة المعلّقة بـ /* → auth.users(id) */ تشير منطقياً لمستخدم Supabase
--    (بدون قيد FK فعلي). آمن للتشغيل: كل العبارات create table if not exists.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admins
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid not null primary key /* → auth.users(id) */,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid not null primary key /* → auth.users(id) */,
  account_type text not null,
  name text,
  email text,
  phone text,
  shop_name text,
  location text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- shops
-- ----------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  province text not null,
  phone text,
  whatsapp text,
  address text,
  logo_url text,
  created_at timestamptz not null default now(),
  owner_id uuid /* → auth.users(id) */,
  status text not null default 'pending',
  karats text[] not null
);

-- ----------------------------------------------------------------------------
-- shop_prices
-- ----------------------------------------------------------------------------
create table if not exists public.shop_prices (
  id uuid not null default gen_random_uuid() primary key,
  shop_id uuid not null references public.shops(id),
  karat text not null,
  price numeric not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- shop_items
-- ----------------------------------------------------------------------------
create table if not exists public.shop_items (
  id uuid not null default gen_random_uuid() primary key,
  shop_id uuid not null /* → auth.users(id) */,
  name text not null,
  image_url text,
  weight numeric,
  karat text,
  price numeric,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  image_urls text[] not null,
  description text,
  tags text[] not null
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null /* → auth.users(id) */,
  name text not null,
  description text,
  weight numeric,
  shop_item_id uuid references public.shop_items(id),
  status text default 'draft',
  tags text,
  created_at timestamp default now()
);

-- ----------------------------------------------------------------------------
-- aurum_goals
-- ----------------------------------------------------------------------------
create table if not exists public.aurum_goals (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null /* → auth.users(id) */,
  goal_name text not null,
  goal_type text,
  target_amount numeric not null,
  monthly_saving numeric,
  duration_months integer,
  current_amount numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- aurum_transactions
-- ----------------------------------------------------------------------------
create table if not exists public.aurum_transactions (
  id uuid not null default gen_random_uuid() primary key,
  goal_id uuid not null references public.aurum_goals(id),
  amount numeric not null,
  date timestamptz not null default now(),
  notes text
);

-- ----------------------------------------------------------------------------
-- aurum_targets
-- ----------------------------------------------------------------------------
create table if not exists public.aurum_targets (
  user_id uuid not null primary key /* → auth.users(id) */,
  item_id uuid not null references public.shop_items(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- articles
-- ----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  excerpt text,
  content text,
  category text not null,
  affects text,
  price_snapshot_iqd numeric,
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  status text not null default 'draft',
  author_id uuid /* → auth.users(id) */,
  author_name text
);

-- ----------------------------------------------------------------------------
-- dollar_rate
-- ----------------------------------------------------------------------------
create table if not exists public.dollar_rate (
  id uuid not null default gen_random_uuid() primary key,
  usd_to_iqd numeric not null,
  source text,
  recorded_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- gram_prices
-- ----------------------------------------------------------------------------
create table if not exists public.gram_prices (
  id uuid not null default gen_random_uuid() primary key,
  karat text not null default '21',
  buy_gram_iqd numeric not null,
  sell_gram_iqd numeric not null,
  usd_to_iqd numeric not null,
  numra numeric not null,
  recorded_at timestamptz not null default now(),
  ounce_usd numeric
);

-- ----------------------------------------------------------------------------
-- numra_rate
-- ----------------------------------------------------------------------------
create table if not exists public.numra_rate (
  id uuid not null default gen_random_uuid() primary key,
  numra numeric not null,
  source text default 'manual',
  recorded_at timestamptz not null default now(),
  sell_spread_iqd numeric default 5000
);

-- ----------------------------------------------------------------------------
-- price_observations
-- ----------------------------------------------------------------------------
create table if not exists public.price_observations (
  id uuid not null default gen_random_uuid() primary key,
  recorded_at timestamptz not null default now(),
  province text,
  shop_name text,
  karat smallint not null,
  gold_type text,
  unit text not null default 'gram',
  buy_price_iqd numeric,
  sell_price_iqd numeric,
  ounce_usd numeric,
  usd_to_iqd numeric,
  nomra numeric,
  source text,
  notes text
);

-- ----------------------------------------------------------------------------
-- province_market_factors
-- ----------------------------------------------------------------------------
create table if not exists public.province_market_factors (
  id uuid not null default gen_random_uuid() primary key,
  province_key text not null,
  province_name text not null,
  buy_factor double precision default 0.97,
  sell_new_factor double precision default 1.031,
  sell_used_factor double precision default 1.01,
  updated_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- user_calculations
-- ----------------------------------------------------------------------------
create table if not exists public.user_calculations (
  id uuid not null default gen_random_uuid() primary key,
  province text,
  karat text,
  operation_type text,
  item_condition text,
  weight double precision,
  manufacturing_fee double precision,
  profit_percent double precision,
  market_factor double precision,
  calculated_price double precision,
  currency text,
  user_modified boolean default true,
  session_id text,
  created_at timestamptz default now(),
  event_type text default 'calculation'
);

