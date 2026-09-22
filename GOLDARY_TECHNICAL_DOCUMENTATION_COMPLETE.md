# Goldary — Complete Technical Documentation

> **Independent Iraqi Gold Market Reference-Pricing Platform**
> Prepared as the founder's complete technical record of work completed prior to investor entry.
>
> **Live:** [goldary.vercel.app](https://goldary.vercel.app) · **Status:** Production (Phase 1–3 complete) · **Document date:** 2026-09-22
>
> ⚠️ **Security notice:** All API keys, service-role keys, bot tokens, cron secrets, and other credentials referenced in this document are replaced with `[REDACTED]`. No secret values appear anywhere in this file. Environment-variable *names* are documented for architectural clarity only.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Core Algorithms & Formulas](#3-core-algorithms--formulas)
4. [Completed Features (Phase 1–3)](#4-completed-features-phase-1-3)
5. [Known Issues & Technical Debt](#5-known-issues--technical-debt)
6. [Intellectual Property Inventory](#6-intellectual-property-inventory)
7. [Development Milestones & Timeline](#7-development-milestones--timeline)
8. [Future Roadmap (Pre-Investor)](#8-future-roadmap-pre-investor)
9. [Business Model (Post-Investor)](#9-business-model-post-investor)
10. [Security & Compliance](#10-security--compliance)
11. [Deployment & Operations](#11-deployment--operations)
12. [GitHub Repository Details](#12-github-repository-details)
13. [Contributions & Work Breakdown](#13-contributions--work-breakdown)
14. [Current Metrics & Traction](#14-current-metrics--traction)
15. [What's Required for the Next Phase (Investor Role)](#15-whats-required-for-the-next-phase-investor-role)

---

## 1. EXECUTIVE SUMMARY

**Goldary** is an independent, digital reference-pricing platform for the Iraqi gold market. It exists to close a persistent transparency gap: in Iraq, gold buy/sell pricing has historically been opaque, fragmented across governorates, and negotiated verbally shop-by-shop, leaving ordinary buyers and small goldsmiths without a trustworthy public benchmark.

| Attribute | Value |
|---|---|
| **Platform name** | Goldary |
| **Production URL** | https://goldary.vercel.app |
| **Founded** | 2026 |
| **Status** | Live / Production — Phases 1, 2, and 3 complete |
| **Core mission** | Provide an independent, empirically-grounded reference price for gold (per gram, in IQD) for the Iraqi market, plus operational tooling for goldsmiths and a savings-planning product for consumers |
| **Founder** | Alaa Raheem |
| **Repository** | GitHub — `a369rt-sketch/goldary` (public) |

### What Goldary does today

- **Publishes a live, independent gram price** for Karat 21 gold in Iraqi Dinar (IQD), derived from the global XAU/USD spot price, the Baghdad-market USD/IQD rate, and a field-researched goldsmith margin constant known locally as **النمرة (NUMRA)**.
- **Runs a public shops directory** (`/shops`) where verified goldsmiths maintain a storefront profile.
- **Provides a full operational back-office** for goldsmith shops: invoicing (بيع/شراء/تصليح), inventory with a draft/publish workflow (مخزن/معرض), staff management with role-based access, sales history, receipt printing, and reports.
- **Operates a Telegram bot** (`@Goldary_Bot`) that answers live-price queries on demand and broadcasts a daily price update to subscribers.
- **Publishes a Markdown-based magazine** with an editorial workflow (draft → pending → approved).
- **Offers "Aurum by Goldary"** — a gold-savings goal-planning tool framed as financial *education*, not investment advice.

### Why it matters

Goldary's core intellectual asset is not the code — it is the **empirical pricing methodology**. The NUMRA constant and the derivation of a defensible per-gram buy/sell formula from field-collected goldsmith data (across Baghdad, Diwaniyah/الديوانية, and Hilla/الحلة) is original research that turns an informal, verbal market into a computable one.

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Stack Overview

| Layer | Technology | Version (from `package.json`) |
|---|---|---|
| Framework | **Next.js** (App Router, React Server Components, Route Handlers) | `16.1.5` |
| UI runtime | **React** / React DOM | `19.2.3` |
| Language | **TypeScript** | `^5` |
| Styling | **Tailwind CSS** (v4 via `@tailwindcss/postcss`) + styled-jsx | `^4` |
| Backend / DB | **Supabase** (PostgreSQL + Auth + Storage + PostgREST) | `@supabase/supabase-js ^2.105.4` |
| Icons | **lucide-react** | `^1.16.0` |
| Markdown | **react-markdown** | `^10.1.0` |
| Analytics/data warehouse (optional) | **@google-cloud/bigquery** | `^8.3.0` |
| IDs | **uuid** | `^14.0.0` |
| Hosting / CI-CD | **Vercel** (auto-deploy from `main`) | — |
| Messaging | **Telegram Bot API** | — |
| Repo | **GitHub** — `a369rt-sketch/goldary` | — |

**Authentication:** Passwordless **Email + 6-digit OTP** via Supabase Auth (`signInWithOtp` / `verifyOtp`). No passwords are stored anywhere in the system.

**Real-time / notifications:** Telegram bot integration (webhook + scheduled broadcast).

### 2.2 High-level Architecture Diagram

```
                          ┌──────────────────────────────┐
                          │   External Data Sources       │
                          │  • goldapi.io (XAU/USD)  [$]   │
                          │  • gold-api.com (free backup)  │
                          │  • Baghdad exchange (manual)   │
                          └───────────────┬────────────────┘
                                          │ (fetch, cron-driven)
                                          ▼
┌───────────────┐   HTTPS    ┌──────────────────────────────────────┐
│   Browsers /  │◄──────────►│         Vercel (Next.js 16)           │
│   PWA clients │            │                                       │
└───────────────┘            │  ┌────────────────────────────────┐   │
        ▲                    │  │ App Router pages (RSC + client)│   │
        │                    │  │  /  /shops  /market  /magazine │   │
        │                    │  │  /collection /aurum /dashboard │   │
        │                    │  │  /admin /privacy /terms        │   │
        │                    │  └────────────────────────────────┘   │
        │                    │  ┌────────────────────────────────┐   │
┌───────┴───────┐  webhook   │  │ Route Handlers (/app/api/*)    │   │
│ Telegram Bot  │◄──────────►│  │  /api/gold  /api/cron/gold     │   │
│ @Goldary_Bot  │            │  │  /api/telegram/webhook         │   │
└───────────────┘            │  │  /api/cron/telegram-broadcast  │   │
                             │  │  /api/shop-items/* /api/admin/*│   │
                             │  └───────────────┬────────────────┘   │
                             │  Vercel Cron ────┤ (0 6 * * *,        │
                             │                  │  0 7 * * *)         │
                             └──────────────────┼────────────────────┘
                                                │ service-role / anon JWT
                                                ▼
                             ┌──────────────────────────────────────┐
                             │        Supabase (PostgreSQL)          │
                             │  • Auth (email OTP, JWT)              │
                             │  • Row-Level Security (multi-tenant)  │
                             │  • Storage buckets (shop-images, …)   │
                             │  • Tables (see §2.4)                  │
                             └──────────────────────────────────────┘
```

### 2.3 Client / Server Access Patterns

Goldary uses **three distinct Supabase client identities**, chosen deliberately per security boundary:

1. **Anon client (`app/lib/supabaseClient.ts`)** — used in the browser. Subject to Row-Level Security. Can only read `approved` shops and `published` items, and can only touch the signed-in user's own rows.
2. **Scoped anon client with the caller's JWT (`app/lib/authServer.ts` → `getCaller`)** — server-side. It forwards the user's `Authorization: Bearer <token>` so RLS still applies *as that user*. Used to authenticate API route callers.
3. **Service-role client (`app/lib/supabaseAdmin.ts`)** — server-only, **bypasses RLS**. Used exclusively by trusted server code: the cron price writer, the Telegram bot, image uploads, and admin plan changes. Never shipped to the browser.

```ts
// app/lib/authServer.ts — authenticating an API caller with their own JWT,
// then checking admin status via a service-role lookup.
export async function getCaller(req: NextRequest): Promise<Caller> {
  const authz = req.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return { user: null, isAdmin: false };

  const scoped = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await scoped.auth.getUser();
  if (error || !data.user) return { user: null, isAdmin: false };

  const { data: adminRow } = await service
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    user: { id: data.user.id, email: data.user.email ?? undefined },
    isAdmin: !!adminRow,
  };
}
```

Environment variables consumed by the app (names only — **all values `[REDACTED]`**):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key for RLS-scoped client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server only, bypasses RLS `[REDACTED]` |
| `GOLD_API_KEY` | goldapi.io access token `[REDACTED]` |
| `CRON_SECRET` | Shared bearer secret guarding cron routes `[REDACTED]` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (fallback: `app_secrets` table) `[REDACTED]` |
| `TELEGRAM_WEBHOOK_SECRET` | Optional secret verifying webhook origin `[REDACTED]` |

### 2.4 Database Schema

The canonical schema lives under `sql/` in the repository, split into an auto-generated reference (`sql/schema.sql`) and a set of idempotent migration scripts (`sql/2026-*.sql`). Every migration is safe to re-run (`create table if not exists`, `add column if not exists`, guarded constraint blocks).

#### Entity-relationship overview (ASCII)

```
auth.users (Supabase-managed)
   │  id (uuid)
   ├───────────────< profiles.user_id            (1:1 account profile)
   ├───────────────< shops.owner_id              (goldsmith owns shop)
   ├───────────────< shop_items.shop_id          (shop_id == owner uid)
   ├───────────────< invoices.shop_id            (shop_id == owner uid)
   ├───────────────< aurum_goals.user_id
   ├───────────────< articles.author_id
   └───────────────< admins.user_id              (admin allowlist)

shops (id)
   └──< shop_prices.shop_id

shop_items (id)
   ├──< invoice_items.shop_item_id   (optional link, ON DELETE SET NULL)
   ├──< products.shop_item_id
   └──< aurum_targets.item_id

invoices (id)
   ├──< invoice_items.invoice_id     (ON DELETE CASCADE)
   └──> shop_staff.id                (invoices.staff_id, ON DELETE SET NULL)

shop_staff (id)  [shop_id == owner uid; email-matched to JWT]

aurum_goals (id)
   └──< aurum_transactions.goal_id   (ON DELETE CASCADE)

gram_prices   dollar_rate   numra_rate   price_observations   (pricing lineage)
telegram_subscribers (chat_id)     app_secrets (key)
```

#### Table catalogue

Below, each production table with its columns, types, purpose, and relationships. (Types and defaults taken directly from `sql/schema.sql` and the migration files.)

##### `gram_prices` — live computed gold prices (the public product)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `karat` | `text` | `default '21'` (MVP scope) |
| `buy_gram_iqd` | `numeric` NOT NULL | computed buy price, IQD/gram |
| `sell_gram_iqd` | `numeric` NOT NULL | computed sell price, IQD/gram |
| `usd_to_iqd` | `numeric` NOT NULL | dollar rate used for this row (lineage) |
| `numra` | `numeric` NOT NULL | NUMRA value used for this row (lineage) |
| `ounce_usd` | `numeric` | XAU/USD spot used for this row (lineage) |
| `recorded_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** append-only ledger of every computed price. Each row is self-documenting — it records not just the output but the three inputs (`ounce_usd`, `usd_to_iqd`, `numra`) that produced it, so any historical price can be audited/reproduced. Read by `/api/gold`, the market dashboard, and the Telegram bot via `getGoldSnapshot()`.

##### `dollar_rate` — USD/IQD reference rate

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `usd_to_iqd` | `numeric` NOT NULL | IQD per single USD (e.g. Baghdad market value) |
| `source` | `text` | provenance label |
| `recorded_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** manually-maintained ledger of the Baghdad-market dollar rate. The cron price writer reads the **latest** row each run.

##### `numra_rate` — goldsmith profit margin (النمرة)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `numra` | `numeric` NOT NULL | field-researched margin constant (~88) |
| `source` | `text` | `default 'manual'` |
| `sell_spread_iqd` | `numeric` | `default 5000` (reserved) |
| `recorded_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** stores the empirically-derived NUMRA. Latest row feeds the buy-price formula.

##### `profiles` — unified account profile

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` PK → `auth.users(id)` `on delete cascade` | |
| `account_type` | `text` NOT NULL | `check in ('goldsmith','aurum')` |
| `name`, `email`, `phone` | `text` | |
| `shop_name`, `location` | `text` | goldsmith-specific |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** one profile per authenticated user, discriminated by `account_type` — `goldsmith` (shop owner) or `aurum` (consumer/saver). RLS: each user manages only their own row; admins may read all.

##### `shops` — public shop directory + subscription plan

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `name` | `text` NOT NULL | |
| `province` | `text` NOT NULL | governorate |
| `phone`, `whatsapp`, `address`, `logo_url` | `text` | |
| `owner_id` | `uuid` → `auth.users(id)` | |
| `status` | `text` NOT NULL | `default 'pending'` → `approved`/`rejected` |
| `karats` | `text[]` NOT NULL | supported karats |
| `plan` | `text` NOT NULL | `default 'free'`, `check in ('free','pro')` |
| `plan_expires_at` | `timestamptz` | null = permanent |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** the storefront record and the freemium subscription state. `plan`/`plan_expires_at` are **trigger-protected** against self-upgrade (see §10). Public can only read `status = 'approved'` rows.

##### `shop_items` — inventory (مخزن / معرض)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `shop_id` | `uuid` NOT NULL → `auth.users(id)` `on delete cascade` | **equals owner uid** |
| `name` | `text` NOT NULL | |
| `image_url` | `text` | cover image (first of array) |
| `image_urls` | `text[]` NOT NULL | `default '{}'` — multi-image gallery |
| `weight`, `price` | `numeric` | |
| `karat` | `text` | 24K/22K/21K/18K |
| `description` | `text` | |
| `tags` | `text[]` NOT NULL | `default '{}'` |
| `status` | `text` NOT NULL | `default 'draft'`, `check in ('draft','published','sold')` |
| `created_at`, `updated_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** the goldsmith's inventory. `draft` = مخزن (private stock), `published` = معرض (public showcase). Public reads `published` only.

##### `invoices` — sale / purchase / repair headers

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `shop_id` | `uuid` NOT NULL | equals owner uid |
| `number` | `integer` NOT NULL | per-shop sequential (trigger-assigned) |
| `type` | `text` NOT NULL | `default 'sale'`, `check in ('sale','purchase','repair')` |
| `customer_name`, `customer_phone` | `text` | |
| `subtotal`, `discount`, `total` | `numeric` NOT NULL | `default 0` |
| `notes` | `text` | |
| `status` | `text` NOT NULL | `default 'issued'`, `check in ('issued','void')` |
| `staff_id` | `uuid` → `shop_staff(id)` `on delete set null` | who executed it |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

Indexes: `unique(shop_id, number)`, `(shop_id, created_at desc)`.

**Purpose:** transaction headers. `number` is a stable per-shop counter maintained by a `BEFORE INSERT` trigger.

##### `invoice_items` — invoice line items

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `invoice_id` | `uuid` NOT NULL → `invoices(id)` `on delete cascade` | |
| `shop_item_id` | `uuid` → `shop_items(id)` `on delete set null` | optional inventory link |
| `description` | `text` NOT NULL | `default ''` |
| `weight`, `price_per_gram` | `numeric` | |
| `karat` | `text` | |
| `making_fee` | `numeric` NOT NULL | `default 0` (أجور الصياغة) |
| `quantity` | `integer` NOT NULL | `default 1` |
| `line_total` | `numeric` NOT NULL | `default 0` |

##### `shop_staff` — employees + login/permissions

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `shop_id` | `uuid` NOT NULL | equals owner uid |
| `name` | `text` NOT NULL | |
| `role` | `text` | بائع / مدير / صائغ / محاسب |
| `phone` | `text` | |
| `email` | `text` | matched against JWT email for login |
| `permissions` | `text[]` NOT NULL | `default '{}'` — UI-section gating |
| `active` | `boolean` NOT NULL | `default true` |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

Indexes: `(shop_id)`, `lower(email)`.

**Purpose:** staff roster. Employees authenticate with their own email OTP; the SQL function `staff_shop_ids()` (SECURITY DEFINER) resolves which shops the JWT email may act on. See §3/§10.

##### `articles` — magazine content + editorial workflow

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `title`, `slug` | `text` NOT NULL | |
| `excerpt`, `content` | `text` | Markdown body |
| `category` | `text` NOT NULL | |
| `affects` | `text` | market-impact tag |
| `price_snapshot_iqd` | `numeric` | price at publish time |
| `cover_image_url` | `text` | |
| `published` | `boolean` NOT NULL | `default false` (kept in sync with `status='approved'`) |
| `status` | `text` NOT NULL | `default 'draft'`, `check in ('draft','pending','approved','rejected')` |
| `author_id` | `uuid` → `auth.users(id)` `on delete set null` | |
| `author_name` | `text` | |
| `created_at`, `published_at` | `timestamptz` | |

Index: `(status, created_at desc)`.

##### `telegram_subscribers` — daily broadcast list

| Column | Type | Notes |
|---|---|---|
| `chat_id` | `bigint` PK | Telegram chat id |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** subscriber list for the daily price broadcast. **RLS enabled with no policies** — reachable only via service role (bot/cron).

##### `app_secrets` — server-side secret fallback

| Column | Type | Notes |
|---|---|---|
| `key` | `text` PK | e.g. `telegram_bot_token` |
| `value` | `text` NOT NULL | secret value `[REDACTED]` |
| `updated_at` | `timestamptz` NOT NULL | `default now()` |

**Purpose:** durable fallback store for secrets (like the Telegram bot token) when a Vercel env var is unavailable. **RLS enabled with no policies** — service-role-only.

##### `aurum_goals` / `aurum_transactions` / `aurum_targets` — savings product

- **`aurum_goals`** — `id`, `user_id → auth.users`, `goal_name`, `goal_type` (`marriage|house|travel|emergency|study`), `target_amount`, `monthly_saving`, `duration_months`, `current_amount` (`default 0`), `status` (`active|completed|paused`), `created_at`.
- **`aurum_transactions`** — `id`, `goal_id → aurum_goals on delete cascade`, `amount`, `date`, `notes`. Deposits toward a goal.
- **`aurum_targets`** — `user_id` PK, `item_id → shop_items(id)`, `created_at`. Links a saver to a target gold piece from a partner shop.

##### Supporting / analytical tables

- **`admins`** — `user_id` PK. Admin allowlist consulted by every privileged check.
- **`shop_prices`** — per-shop karat pricing (`shop_id`, `karat`, `price`, `updated_at`).
- **`products`** — legacy/auxiliary product records linked to `shop_items`.
- **`price_observations`** — raw field-research capture: `province`, `shop_name`, `karat`, `gold_type`, `buy_price_iqd`, `sell_price_iqd`, `ounce_usd`, `usd_to_iqd`, `nomra`, `source`, `notes`. **This is the raw dataset behind the NUMRA discovery.**
- **`province_market_factors`** — per-governorate `buy_factor` / `sell_new_factor` / `sell_used_factor` (for future province-specific pricing).
- **`user_calculations`** — analytics capture of calculator sessions (deprioritized feature).

---

## 3. CORE ALGORITHMS & FORMULAS

### 3.1 The Gold Pricing Formula

Goldary's price is derived, not scraped. The two published values for Karat 21 gold are computed as:

```
sell_gram_iqd = (ounceUsd × 0.875 × usd) ÷ 31.1035

buy_gram_iqd  = ((ounceUsd − NUMRA) ÷ 31.1035) × 0.875 × usd
```

Where:

| Symbol | Meaning | Source |
|---|---|---|
| `ounceUsd` | Global spot price of one troy ounce of gold (XAU/USD) | goldapi.io (primary) → gold-api.com (backup) |
| `0.875` | Purity of Karat 21 gold (21 ÷ 24 = 0.875) | Constant `KARAT_21` |
| `31.1035` | Grams per troy ounce | Constant `OUNCE_TO_GRAM` |
| `usd` | IQD per 1 USD | latest `dollar_rate` row |
| `NUMRA` | Field-researched goldsmith margin (~88) | latest `numra_rate` row |

The exact production implementation (from `app/api/cron/gold/route.ts`, logic unchanged):

```ts
const OUNCE_TO_GRAM = 31.1035;
const KARAT_21 = 0.875; // purity of Karat 21

// ounceUsd  — fetched live (XAU/USD)
// usd       — latest dollar_rate.usd_to_iqd
// numra     — latest numra_rate.numra

const sell_gram_iqd = (ounceUsd * KARAT_21 * usd) / OUNCE_TO_GRAM;
const buy_gram_iqd  = ((ounceUsd - numra) / OUNCE_TO_GRAM) * KARAT_21 * usd;
```

**Interpretation.** The *sell* price is the pure market conversion of the spot ounce into a Karat-21 gram in dinars. The *buy* price subtracts NUMRA from the ounce **before** conversion — NUMRA is expressed in USD-per-ounce terms and encodes the goldsmith's margin (the spread between what a shop pays to buy gold from the public and what the pure metal is worth). This is the crux of the original research: NUMRA is the single empirical parameter that makes the informal Iraqi buy price computable.

Karat 24 and 22 sell prices are derived from the Karat-21 sell price by purity ratio (`app/lib/goldServer.ts`):

```ts
price_gram_24k = Math.round(sell21 * (24 / 21));
price_gram_22k = Math.round(sell21 * (22 / 21));
price_gram_21k = Math.round(sell21);
```

### 3.2 The NUMRA (النمرة) Constant — Original Field Research

**NUMRA ≈ 88** (field-verified). It is *not* a textbook value; it was reverse-engineered from real transactions.

**Derivation method / data-collection process:**

1. **Field capture.** Buy and sell quotes were collected in person from working goldsmiths across three governorates — **Baghdad** (incl. shops connected to Haidar Al-Asadi / حيدر الأسدي), **Diwaniyah / الديوانية** (Saif / سيف), and **Hilla / الحلة**. Each observation recorded karat, gold type (new/used), unit, buy price, sell price, and the prevailing ounce and dollar values. These are stored in `price_observations` (`buy_price_iqd`, `sell_price_iqd`, `ounce_usd`, `usd_to_iqd`, `nomra`, `province`, `shop_name`, `source`, `notes`).
2. **Back-solving.** For each observation, the formula was inverted: given the real buy price a shop offered and the concurrent ounce/dollar values, solve for the NUMRA that reproduces it:
   `NUMRA = ounceUsd − (buy_gram_iqd × 31.1035) ÷ (0.875 × usd)`
3. **Convergence.** Across shops and governorates, the back-solved values clustered tightly around **~88 USD/oz**, indicating a consistent, market-wide margin rather than shop-specific noise. That convergence is the finding.
4. **Operationalization.** The agreed value was stored in `numra_rate` and is read live by the price pipeline, so the constant can be re-tuned centrally as the market shifts without code changes.

The novelty is methodological: turning a verbal, negotiated, governorate-fragmented market into a **single reproducible parameter** backed by a captured dataset.

### 3.3 Price-Update Architecture

The price refresh is a scheduled server job (`GET /api/cron/gold`), guarded by a shared secret and orchestrated by Vercel Cron.

**Flow:**

```
Vercel Cron (schedule) ──► GET /api/cron/gold
   1. Authorize: Authorization header must equal `Bearer ${CRON_SECRET}`  → else 401
   2. Fetch XAU/USD:
        a. goldapi.io  (needs GOLD_API_KEY)          → primary   [~$9/mo]
        b. gold-api.com (free, keyless)              → fallback
        c. both fail → 502, write nothing (keep last valid row)
   3. Read latest dollar_rate.usd_to_iqd             → else 502
   4. Read latest numra_rate.numra                   → else 502
   5. Compute sell_gram_iqd & buy_gram_iqd
   6. INSERT into gram_prices (service role, bypasses RLS),
      recording ounce_usd / usd_to_iqd / numra for lineage
```

Authorization + resilient fetch (abridged from source):

```ts
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let ounceUsd = NaN;
  const goldApiKey = process.env.GOLD_API_KEY; // [REDACTED]
  if (goldApiKey) {
    const r = await fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": goldApiKey, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (r.ok) { const v = Number((await r.json())?.price); if (v > 0) ounceUsd = v; }
  }
  if (!Number.isFinite(ounceUsd) || ounceUsd <= 0) {
    const r = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
    if (r.ok) { const v = Number((await r.json())?.price); if (v > 0) ounceUsd = v; }
  }
  // ... read dollar_rate + numra_rate, compute, insert into gram_prices ...
}
```

**Design guarantees:**

- **Fail-safe writes:** if every price source fails, the job returns 502 and writes nothing, leaving the last valid `gram_prices` row live. The public never sees a broken price.
- **Full lineage:** every row records the exact `ounce_usd`, `usd_to_iqd`, and `numra` used, so any historical price is auditable and reproducible.
- **No client trust:** computation and DB writes happen only server-side under the service role.

**Scheduling.** Configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/gold",               "schedule": "0 6 * * *" },
    { "path": "/api/cron/telegram-broadcast", "schedule": "0 7 * * *" }
  ]
}
```

> **Note on cadence.** The current committed `vercel.json` runs the price job **daily at 06:00 UTC** and the Telegram broadcast at 07:00 UTC. A tighter cadence (e.g. every 15 minutes via an external scheduler such as GitHub Actions calling the same authenticated route) is architecturally supported — the route is idempotent and secret-guarded — and is part of the intraday-refresh roadmap.

**External API cost:** the goldapi.io primary feed is ~**$9/month**. The keyless gold-api.com backup means the platform degrades gracefully to a free source rather than going dark. (No credentials included — `GOLD_API_KEY = [REDACTED]`.)

### 3.4 USD/IQD Rate Calculation

- **Manual entry:** the Baghdad-market dollar rate is entered as new rows in `dollar_rate`. The cron reader always takes the **most recent** row (`order by recorded_at desc limit 1`).
- **Storage format:** a single canonical number — IQD per **one** USD — in `usd_to_iqd`. This avoids the "per 100,000 dinars" ambiguity common in Iraqi quoting and is used verbatim in the formula (no in-code conversion).
- **Data cleaning:** the reader rejects any non-finite or non-positive value and returns 502 rather than compute a garbage price; a `source` label records provenance for each entry.

### 3.5 Invoice Numbering — Per-Shop Sequential Counter

A subtle but important correctness requirement: each shop needs its own human-readable invoice sequence (1, 2, 3 …), independent of other shops and stable under concurrency. Goldary solves this with a `BEFORE INSERT` trigger rather than a global sequence, so numbering resets per shop and never leaks cross-tenant volume:

```sql
create or replace function public.set_invoice_number()
returns trigger language plpgsql as $$
begin
  if new.number is null or new.number = 0 then
    select coalesce(max(number), 0) + 1
      into new.number
      from public.invoices
      where shop_id = new.shop_id;
  end if;
  return new;
end $$;

create trigger trg_invoice_number
  before insert on public.invoices
  for each row execute function public.set_invoice_number();
```

A `unique(shop_id, number)` index backs the trigger: if two inserts ever race to the same number, the second fails the unique constraint rather than silently duplicating — the application retries. This is deliberately simpler than an advisory-lock scheme and correct for the platform's current write volume.

### 3.6 Staff Login & Authorization Flow

Staff never receive a separately-provisioned account. Instead, the model reuses the same email-OTP identity and *matches* it to a `shop_staff` row by the email carried in the JWT:

```
1. Owner adds a staff row: { shop_id = owner uid, name, role, email, permissions[] }.
2. Staff member logs in with their own email via OTP (same AuthModal flow).
3. On any protected DB access, RLS calls staff_shop_ids() (SECURITY DEFINER),
   which returns the shop_ids where lower(jwt.email) matches an active staff row.
4. Owner policies (shop_id = auth.uid()) and staff policies
   (shop_id in staff_shop_ids()) are OR-combined by Postgres, so an owner and
   their staff both reach the same shop's rows — with no manual account linking.
5. The permissions[] array gates *UI sections* (invoices, inventory, reports);
   row visibility is shop-scoped. (Per-permission RLS is a planned refinement.)
```

Server-side, the same authorization question ("may this caller act on this shop?") is answered by `canActOnShop`, which accepts owner, admin, **or** active staff-by-email:

```ts
export async function canActOnShop(caller: Caller, shopId: string): Promise<boolean> {
  if (!caller.user) return false;
  if (caller.user.id === shopId) return true;         // owner (shop_id == uid)
  if (caller.isAdmin) return true;                    // admin
  if (!caller.user.email) return false;
  const { data } = await service.from("shop_staff")
    .select("id").eq("shop_id", shopId)
    .ilike("email", caller.user.email).eq("active", true)
    .limit(1).maybeSingle();
  return !!data;                                      // active staff by email
}
```

The design intent: **identity is email; authorization is data.** Removing a staff member is a single `active = false` flip — no credential revocation, no orphaned logins.

---

## 4. COMPLETED FEATURES (Phase 1–3)

### Phase 1 — Core Infrastructure

- **Shop registration & approval workflow** — goldsmiths self-register (`shops.status = 'pending'`); admins approve/reject; only `approved` shops are publicly visible (enforced by RLS, not just UI).
- **Passwordless OTP login** — email + 6-digit code via `supabase.auth.signInWithOtp` / `verifyOtp`. No passwords stored.
- **Karat 21-only public display** — deliberate MVP scope; the schema supports 24/22/21/18 but the public surface shows Karat 21 as the reference.
- **Shops directory** — `/shops` (list) and `/shops/[id]` (detail with a `not-found` fallback).
- **Magazine structure** — five Arabic category tabs, RSC-rendered.
- **SEO** — `app/robots.ts`, `app/sitemap.ts`, Open Graph image (`opengraph-image.png`); Google Search Console integrated.
- **PWA manifest** — `app/manifest.ts` for installability.
- **Global XAU/USD display card** — live ounce + dollar snapshot in the header/ticker (`GoldTicker`).
- **Persistent shop-owner sessions** — `AccountMenu` + `useAuthRole` hook reactive to `onAuthStateChange`.
- **Admin route** — `/admin` for shop/article moderation. *(Security note: authentication hardening pending — see §5.)*

### Phase 2 — Transactions & Management

- **Invoices system** — full CRUD over `invoices` with per-shop sequential numbering (DB trigger), three types (`sale`/`purchase`/`repair`), subtotal/discount/total, and void status.
- **Invoice items** — line-item detail (`invoice_items`) with optional link back to inventory (`shop_item_id`).
- **Inventory management (مخزن / معرض)** — `shop_items` draft→published workflow; draft = private stock, published = public showcase.
- **Sales records & history** — derived from issued invoices.
- **Shop staff management** — `shop_staff` roster with roles, email-based login, and a `permissions[]` array for UI gating.
- **Receipt printing** — printable invoice output.
- **Reports** — sales / inventory / staff reporting (`ShopReports`).
- **Row-Level Security** — multi-tenant isolation across `shops`, `shop_items`, `invoices`, `invoice_items`, `shop_staff` (see §10).
- **Owner actions** — add / edit / delete / publish / unpublish pieces via authenticated API routes (`/api/shop-items/[id]/publish`, `/unpublish`, image `/api/shop-items/upload`).

### Phase 3 — Integration & Scale

- **Telegram bot integration** (`@Goldary_Bot`, 200+ subscribers at Phase 3 completion) — commands `/start`, `/help`, `/price`, `/subscribe`, `/unsubscribe`, plus Arabic natural-language price detection (سعر/أسعار/اسعار).
- **Automated daily price broadcast** — `GET /api/cron/telegram-broadcast` (07:00 UTC), secret-guarded, iterates `telegram_subscribers` and sends the formatted snapshot.
- **Magazine article editor** — Markdown-based (`react-markdown`), draft/pending/approved workflow, per-author attribution.
- **First published article** — *"اسباب ارتفاع سعر الذهب"* (analysis of the gold-price rise).
- **Global Header / Footer** — `SiteHeader` / `SiteFooter` / `SiteChrome`, responsive desktop & mobile.
- **Market dashboard** — `/market` with public insights (`PublicInsights`, `/api/public/insights`).
- **Telegram subscriber tracking** — `telegram_subscribers` keyed by `chat_id`.
- **Webhook** — `POST /api/telegram/webhook`, optionally verified via `TELEGRAM_WEBHOOK_SECRET = [REDACTED]`.

Telegram command handling (from `app/api/telegram/webhook/route.ts`):

```ts
if (cmd === "/start" || cmd === "/help") {
  await sendTelegram(chatId, WELCOME);
} else if (cmd === "/subscribe") {
  await supabaseAdmin.from("telegram_subscribers").upsert({ chat_id: chatId });
  await sendTelegram(chatId, "✅ تم اشتراكك في التحديث اليومي لأسعار الذهب…");
} else if (cmd === "/unsubscribe") {
  await supabaseAdmin.from("telegram_subscribers").delete().eq("chat_id", chatId);
  await sendTelegram(chatId, "تم إلغاء اشتراكك…");
} else if (isPriceQuery(text)) {
  const snap = await getGoldSnapshot();
  await sendTelegram(chatId, snap ? formatPrices(snap) : "لا تتوفر أسعار حالياً…");
}
```

Bot-token resolution has a durable fallback so the bot survives a missing env var (`app/lib/telegram.ts`):

```ts
export async function getBotToken(): Promise<string> {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN; // [REDACTED]
  if (cachedToken) return cachedToken;
  const { data } = await supabaseAdmin
    .from("app_secrets").select("value")
    .eq("key", "telegram_bot_token").maybeSingle();
  cachedToken = (data?.value as string) ?? "";
  return cachedToken;
}
```

---

## 5. KNOWN ISSUES & TECHNICAL DEBT

| # | Issue | Impact | Status / plan |
|---|---|---|---|
| 1 | **Inventory image upload** — icon renders but image does not display in some cases | Cosmetic in dashboard; storefront still works | Supabase Storage bucket (`shop-images`) config/policy; uploads already routed server-side via service role to bypass client 403 |
| 2 | **`/admin` route accessible without authentication** | Security — moderation UI reachable | **Fix needed:** enforce `admins`-table check server-side on the admin pages/routes (the check already exists in `getCaller`/`useAuthRole`; must gate the route) |
| 3 | **Cron dollar source** (historical) | Correctness | **Resolved** — `/api/cron/gold` now reads the latest `dollar_rate` row instead of a hardcoded env value (verified in current source) |
| 4 | **Worktree contamination** | Dev hygiene | Resolved; documented for reference |
| 5 | **Per-permission RLS for staff** | Staff access is shop-level, not action-level | `shop_staff.permissions[]` gates UI sections today; row-level per-permission enforcement is a planned hardening (noted in `2026-staff-logins.sql`) |

> **Priority:** Item 2 (admin auth) is the single most important pre-scale security fix. The building blocks (`admins` allowlist, `getCaller().isAdmin`, `useAuthRole().isAdmin`) already exist; the remaining work is to enforce them as a hard gate on the `/admin` surface.

---

## 6. INTELLECTUAL PROPERTY INVENTORY

### Original Research
- **NUMRA discovery (~88):** field-collected goldsmith margin, verified across Baghdad (Haidar Al-Asadi), Diwaniyah (Saif), and Hilla. Raw dataset persisted in `price_observations`.
- **Pricing-formula derivation** from empirical field data (buy/sell inversion → convergence on a single parameter).
- **Gold-market transparency methodology for Iraq** — a novel, reproducible approach to a verbal, fragmented market.

### Proprietary Code
- Full Next.js/TypeScript codebase (App Router, RSC + client components).
- Database architecture and the complete RLS policy set.
- Admin/moderation dashboard logic.
- Telegram bot integration (webhook, broadcast, token fallback).
- Markdown magazine editor + editorial workflow.
- OTP authentication flow and three-tier Supabase client strategy.
- Price-update automation (`/api/cron/gold`) with multi-source failover.

### Data Assets
- Historical `gram_prices` ledger (with full input lineage).
- `dollar_rate` USD/IQD history.
- `numra_rate` NUMRA history + `price_observations` field dataset (by governorate).
- Shop profiles and metadata; Telegram subscriber base.

### Brand Assets
- **Goldary** brand identity.
- **Ella Jewels** — cinematic jewelry content brand (separate, linked).
- Visual design system: layout, typography, color palette.

---

## 7. DEVELOPMENT MILESTONES & TIMELINE

### Pre-Sept 2026
- Platform conception (response to Iraqi market opacity).
- Initial field research and NUMRA discovery.
- Tech-stack selection; GitHub repo (`a369rt-sketch/goldary`) + Vercel deployment.

### Phase 1 complete (Sept 10–12, 2026)
- Stable architecture; shop registration & profiles; basic marketplace; core DB design; admin panel; gold-price display.

### Phase 2 complete (Sept 12, 2026)
- Invoices (full CRUD); inventory (مخزن/معرض); sales records; staff management with role-based RLS; receipt printing; reports.

### Phase 3 complete (Sept 12, 2026)
- Telegram bot (200+ subscribers); five-category Arabic magazine; automated price updates; first article; market dashboards; API integrations.

### Current status (Sept 22, 2026)
- Live on Vercel (HTTP 200). All public routes functional: `/shops`, `/market`, `/magazine`, `/collection`, `/aurum`, `/privacy`, `/terms`, `/forms`. Production-ready backend. Ready for user scaling and merchant onboarding.

---

## 8. FUTURE ROADMAP (Pre-Investor)

### Planned Features
- **AI integration** for automated field-data collection and predictive analytics.
- **AI price forecasting** for gold trends.
- **Automated marketing-content generation.**
- **"Aurum by Goldary"** — savings/financial-planning tool (schema already present):
  - Goal-setting: marriage, house, travel, education, emergency.
  - Monthly savings tracking (`aurum_transactions`).
  - AI-suggested gold pieces from partner shops at optimal prices (`aurum_targets` → `shop_items`).
  - Framed as **financial education, not investment advice.**
- **Marketplace model:** 3.5% commission on shop sales.
- **Bank partnership (long-term):** formal bank savings-on-gold product.

### Deprioritized (MVP focus)
- Investment calculator (removed — accuracy issues; analytics remnants in `user_calculations`).
- Gold-weight calculator (removed).
- Forecasting analytics (post-MVP).
- Mobile-app optimization (secondary).

---

## 9. BUSINESS MODEL (Post-Investor)

### Revenue Streams
1. **Marketplace commissions** — 3.5% per sale through Goldary.
2. **Featured shop listings** — future paid tier (freemium `plan` column already in place: `free`/`pro`).
3. **3D ad feature** for shops — $TBD/week.
4. **Bank partnership revenue** — long-term.

### Cost Structure
| Item | Cost |
|---|---|
| External XAU/USD API (goldapi.io) | ~$9/mo |
| Vercel hosting | Hobby tier (free for MVP) |
| Supabase | Usage-based |
| GitHub | Free (public repo) |
| Telegram Bot API | Free |

---

## 10. SECURITY & COMPLIANCE

### Authentication
- **Email + OTP passwordless** (`signInWithOtp` → `verifyOtp`); **no password storage**.

```ts
// send code
await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
// verify 6-digit code
await supabase.auth.verifyOtp({ email, token, type: "email" });
```

- **Session persistence** for shop owners via Supabase session + `useAuthRole` reacting to `onAuthStateChange`.
- **Admin authentication** — allowlist table `admins`; server checks via `getCaller().isAdmin`. *(Route-level enforcement on `/admin` still to be applied — §5.)*

### Row-Level Security (RLS)
Multi-tenant isolation is enforced at the database, not just the UI. Representative policies:

**Shops — public sees approved only; owner sees own; admin sees all:**
```sql
create policy shops_select_public on public.shops
  for select to anon, authenticated using (status = 'approved');
create policy shops_select_owner on public.shops
  for select to authenticated using (owner_id = auth.uid());
create policy shops_update_admin on public.shops
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
```

**Inventory — owner manages own; public reads published:**
```sql
create policy "shop_items_own" on public.shop_items
  for all using (shop_id = auth.uid()) with check (shop_id = auth.uid());
create policy "shop_items_public" on public.shop_items
  for select using (status = 'published');
```

**Staff access via SECURITY DEFINER helper** (email-matched to JWT, combined by OR with owner policies):
```sql
create or replace function public.staff_shop_ids()
returns setof uuid language sql security definer stable
set search_path = public as $$
  select shop_id from public.shop_staff
  where active = true and email is not null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create policy shop_items_staff on public.shop_items
  for all to authenticated
  using (shop_id in (select public.staff_shop_ids()))
  with check (shop_id in (select public.staff_shop_ids()));
```

**Subscription-plan self-upgrade prevention (trigger, not column REVOKE).** Column-level REVOKE is a no-op under Supabase's table-level grant, so a trigger rejects plan changes unless the actor is `service_role` (admin path) or `postgres`:
```sql
create or replace function public.guard_shop_plan()
returns trigger language plpgsql as $$
declare jwt_role text := coalesce(
  current_setting('request.jwt.claims', true)::jsonb ->> 'role', current_user);
begin
  if (new.plan is distinct from old.plan
      or new.plan_expires_at is distinct from old.plan_expires_at)
     and jwt_role <> 'service_role' and current_user <> 'postgres' then
    raise exception 'تغيير خطة الاشتراك مسموح للإدارة فقط';
  end if;
  return new;
end $$;
```

- **`telegram_subscribers`** and **`app_secrets`**: RLS enabled with **zero policies** → reachable only via service role.

### Data Privacy
- **No payment processing** — shops handle settlement independently; Goldary stores no card/payment data.
- **Minimal data retention / no third-party trackers** (GDPR-aligned posture).
- **Privacy policy** at `/privacy`; terms at `/terms`.
- `robots.ts` disallows crawling of `/admin`, `/api`, `/owner`, `/dashboard`.

---

## 11. DEPLOYMENT & OPERATIONS

### Deployment
- **Vercel** with CI/CD from GitHub; **auto-deploy on push to `main`**.
- Next.js 16 App Router; server routes as Vercel Functions; cron via `vercel.json`.
- **Environment variables: `[REDACTED]`** — 7 documented by name in §2.3 (Supabase URL/anon/service-role, gold API key, cron secret, Telegram bot token, Telegram webhook secret). All values redacted.

### Monitoring
- Vercel analytics + function logs.
- Supabase logs.
- Telegram subscriber counts (broadcast route returns `subscribers` / `sent`).
- Structured `console.error` at every external-call failure (gold sources, DB reads, uploads, sends).
- Dedicated error tracking (e.g. Sentry) — to be added.

### Scaling
- Vercel auto-scaling for stateless functions.
- Supabase connection pooling (PgBouncer-ready).
- CDN caching for static assets; `force-dynamic` only where liveness is required (price/bot routes).
- Append-only `gram_prices` design keeps reads to a single latest-row lookup.

---

## 12. GITHUB REPOSITORY DETAILS

| Field | Value |
|---|---|
| Repository | `a369rt-sketch/goldary` |
| Visibility | Public |
| Main branch | `main` (production-ready) |
| Workflow | Feature-branch development; PRs into `main` |
| CI/CD | Vercel auto-deploy on `main` |
| History | Full development history available (Phases 1–3) |
| Notable dirs | `app/` (routes, components, `lib/`), `sql/` (schema + idempotent migrations), `public/`, `.github/` |

---

## 13. CONTRIBUTIONS & WORK BREAKDOWN

### Founder — Alaa Raheem
- Platform concept & business model.
- **NUMRA field research** (verified goldsmith data across 3 governorates).
- Pricing-formula derivation.
- Full-stack development (Phases 1–3).
- Database architecture, RLS design, and optimization.
- Brand strategy (Goldary + Ella Jewels).
- Content strategy (Magazine, LinkedIn, Instagram).
- Investor sourcing & partnership strategy.

### Technical Deliverables Completed
- 100% of backend infrastructure.
- 100% of frontend UI/UX.
- 100% of database design & optimization.
- 100% of Telegram bot integration.
- 100% of deployment pipeline.
- 100% of admin management system *(pending the auth-gate hardening in §5)*.
- 100% of the OTP authentication system.
- 100% of price-update automation.

---

## 14. CURRENT METRICS & TRACTION

| Metric | Value |
|---|---|
| Platform status | Live (goldary.vercel.app) |
| Telegram subscribers | 200+ at Phase 3 completion |
| Governorates covered | 3 — Baghdad, Diwaniyah (الديوانية), Hilla (الحلة) |
| Karats supported (public) | Karat 21 (MVP scope; 24/22/18 in schema) |
| Articles published | 1 (with edit capability) |
| API integrations | 1 live (goldapi.io) + 1 free failover + multiple ready |
| Time to completion | 3 phases in a single month |

---

## 15. WHAT'S REQUIRED FOR THE NEXT PHASE (Investor Role)

The incoming investor is entering with:

1. **AI/ML development** — analytics engine, price forecasting, market-analysis models (schema and data lineage already support training on `gram_prices` + `price_observations`).
2. **App-store deployment** — iOS App Store and Google Play (PWA foundation already in place via `manifest.ts`).
3. **Financial coverage** — developer tooling and automation software.
4. **Goldsmith network** — vendor recruitment & onboarding at scale.

This documentation constitutes the founder's complete technical record of work completed prior to investor entry.

---

### Appendix A — Public & Internal Routes (selected)

| Route | Type | Purpose |
|---|---|---|
| `/` | page | Landing (hero, ticker, previews) |
| `/shops`, `/shops/[id]` | page | Directory + shop detail |
| `/products/[id]` | page | Public piece detail |
| `/market` | page | Market dashboard / insights |
| `/magazine`, `/magazine/[slug]`, `/magazine/my-articles` | page | Magazine + editor |
| `/collection` | page | Curated showcase |
| `/aurum` | page | Savings-goal product |
| `/dashboard` | page | Goldsmith back-office (stock, inventory, invoices, staff, reports) |
| `/admin`, `/admin/shops`, `/admin/articles` | page | Moderation (auth-gate pending — §5) |
| `/privacy`, `/terms` | page | Legal |
| `/api/gold` | route | Public latest snapshot |
| `/api/cron/gold` | route | Scheduled price writer (secret-guarded) |
| `/api/cron/telegram-broadcast` | route | Daily broadcast (secret-guarded) |
| `/api/telegram/webhook`, `/api/telegram/setup` | route | Bot webhook / setup |
| `/api/shop-items/upload`, `/api/shop-items/[id]/publish`, `/unpublish` | route | Inventory ops |
| `/api/admin/summary`, `/api/admin/shops/[id]/plan` | route | Admin ops |
| `/api/magazine/articles`, `/api/magazine/upload` | route | Magazine ops |
| `/api/public/insights`, `/api/analytics` | route | Public/analytics |

### Appendix B — Frontend Architecture, i18n & RTL

Goldary's UI is an Arabic-first, right-to-left (RTL) application built on the Next.js App Router. Key conventions:

- **Server Components by default.** Public pages (`/`, `/shops`, `/market`, `/magazine`) render on the server for SEO and first-paint speed; interactivity is opted into with `"use client"` only where needed (`AuthModal`, `AccountMenu`, dashboard tabs, `GoldTicker`).
- **`SiteChrome` composition.** `SiteHeader` and `SiteFooter` wrap page content through a shared `SiteChrome` layout component, giving a consistent global frame across desktop and mobile.
- **Client auth state.** The `useAuthRole` hook centralizes "who am I / am I admin," subscribing to `supabase.auth.onAuthStateChange` so the header, account menu, and dashboard react instantly to login/logout without a page reload.
- **Authenticated fetch helper.** `authFetch` attaches the current session's access token as a Bearer header, so every call into `/api/*` carries the caller's JWT for server-side RLS scoping:
  ```ts
  export async function authFetch(input: string, init: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers(init.headers);
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    return fetch(input, { ...init, headers });
  }
  ```
- **Styling.** Tailwind CSS v4 (via `@tailwindcss/postcss`) for utility styling, complemented by scoped styled-jsx for component-local rules. A known project gotcha — const-element scoping under styled-jsx — is documented in engineering notes to avoid re-introduction.
- **Image handling.** Client-side compression (`app/lib/imageCompress.ts`) shrinks piece photos before they are POSTed to the server upload route, reducing storage and bandwidth; the server (service role) performs the actual bucket write to avoid client Storage 403s.
- **Markdown rendering.** `react-markdown` renders magazine article bodies, keeping content authoring in plain Markdown and storage in the `articles.content` text column.

### Appendix C — Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| **Derive price, don't scrape shop prices** | A single, transparent, reproducible benchmark is more trustworthy than aggregating opaque, inconsistent shop quotes. NUMRA makes derivation defensible. |
| **`shop_id == owner uid` for tenant data** | Collapses the ownership join: `shop_items`, `invoices`, `shop_staff` all key on the owner's `auth.uid()`, so RLS is a direct `shop_id = auth.uid()` check — fast and hard to get wrong. |
| **Three Supabase client identities** | Enforces least privilege: browser (RLS), scoped-JWT (RLS as user), service-role (trusted server only). No path lets the browser bypass RLS. |
| **Trigger-guarded subscription plan** | Column REVOKE is a no-op under Supabase's table-level grant; a trigger is the only reliable way to stop self-upgrade while still allowing admin (`service_role`) changes. |
| **Append-only `gram_prices` with full lineage** | Every price is auditable and reproducible; no destructive updates; latest-row reads are O(1) with an index on `recorded_at`. |
| **Fail-safe price writer** | On total source failure the job writes nothing and 502s, so the public keeps the last valid price instead of seeing a break. |
| **Bot token env → `app_secrets` fallback** | The bot survives a missing/mis-synced Vercel env var by reading a service-role-only DB secret, avoiding an outage during redeploys. |
| **Email-as-identity for staff** | No separate credential provisioning; onboarding/offboarding is a data flip (`active`), not an account lifecycle. |
| **Karat 21-only public surface** | Focused MVP: one reference karat the whole market understands, with 24/22/18 already modeled for later exposure. |

### Appendix D — End-to-End: OTP Sign-Up & Profile Creation

The full passwordless onboarding path, as implemented in `AuthModal.tsx`:

```
Step "email"   → validate address → supabase.auth.signInWithOtp({ email,
                 options: { shouldCreateUser: true } }) → advance to "code"
Step "code"    → user enters 6-digit token → supabase.auth.verifyOtp(
                 { email, token, type: "email" })
                 ├─ existing profile?  → route to dashboardHref(account_type)
                 ├─ existing shop (owner_id match)? → prefill goldsmith + shop name
                 └─ otherwise          → advance to "profile"
Step "profile" → collect name (+ shop_name if goldsmith) →
                 insert into profiles { user_id, account_type, ... } →
                 route to the appropriate dashboard
```

This single flow serves three account journeys — new consumer (`aurum`), new goldsmith (`goldsmith`), and returning user — without ever handling a password, and with account-type selection deferred until *after* identity is proven by OTP.

### Appendix E — Reproducing the Schema

All `CREATE TABLE` statements are versioned under `sql/`. To stand up a fresh database, run the migrations in dependency order (`2026-profiles.sql`, `2026-shops-rls.sql`, `2026-shop-items.sql`, `2026-shop-items-images.sql`, `2026-invoices.sql`, `2026-staff.sql`, `2026-staff-logins.sql`, `2026-subscriptions.sql`, `2026-articles-workflow.sql`, `2026-aurum.sql`, `2026-aurum-target.sql`, `2026-telegram-subscribers.sql`, `2026-app-secrets.sql`). Every script is idempotent and safe to re-run. `sql/schema.sql` is the auto-generated reference snapshot of the live database.

### Appendix F — Operations Runbook

Routine operational procedures for maintaining the live platform. (All secret values are `[REDACTED]`; commands show shape, not credentials.)

**1. Update the USD/IQD rate.** Insert a new row into `dollar_rate` (Supabase SQL editor or admin tooling). The next `/api/cron/gold` run automatically picks up the latest row — no deploy needed:
```sql
insert into public.dollar_rate (usd_to_iqd, source)
values (<latest_baghdad_rate>, 'baghdad-manual');
```

**2. Tune NUMRA.** When field research indicates the goldsmith margin has shifted, append a new `numra_rate` row; the pipeline reads the latest value on the next run:
```sql
insert into public.numra_rate (numra, source) values (<new_numra>, 'field-research');
```

**3. Force a price refresh.** Invoke the secret-guarded cron route manually (the same call Vercel Cron makes). Requires the `CRON_SECRET` bearer:
```
GET https://goldary.vercel.app/api/cron/gold
Authorization: Bearer [REDACTED]
```
A successful response returns `{ ok, source, ounceUsd, buy_gram_iqd, sell_gram_iqd }`. A `502` means all price sources failed and **no** row was written (last valid price stays live) — investigate the upstream feeds before retrying.

**4. Register / re-register the Telegram webhook.** After a token change or domain change:
```
https://api.telegram.org/bot[REDACTED]/setWebhook
  ?url=https://goldary.vercel.app/api/telegram/webhook
  &secret_token=[REDACTED]
```
Verify health with `GET /api/telegram/webhook`, which returns `{ ok, configured, preview }` (`configured` reflects whether a bot token resolved from env or `app_secrets`).

**5. Rotate a secret.** Update the value in Vercel project settings (env var) **and/or** the `app_secrets` table for those with a DB fallback (e.g. `telegram_bot_token`). The in-process token cache is per-instance and clears on redeploy; force a redeploy after rotation to flush cached values.

**6. Approve or reject a shop.** Set `shops.status` to `approved` or `rejected` via the admin surface (service-role path). Only `approved` shops become publicly visible — RLS enforces this regardless of UI state.

**7. Change a shop's subscription plan.** Use the admin route `POST /api/admin/shops/[id]/plan` with `{ action: "month" | "year" | "free" }`. Direct table updates by owners are rejected by the `guard_shop_plan` trigger; only the service-role admin path succeeds.

**8. Verify RLS after any policy change.** Confirm the active policies per table:
```sql
select policyname, cmd, roles, qual
from pg_policies where tablename = 'shops';
```

### Appendix G — Observability & Failure Modes

| Failure | Symptom | Automatic handling | Operator action |
|---|---|---|---|
| Primary gold API down | cron logs `goldapi.io fetch failed` | Falls back to keyless `gold-api.com` | None unless backup also fails |
| All gold sources down | `/api/cron/gold` returns 502 | Writes nothing; last price stays live | Check upstream feeds; manual refresh once restored |
| Empty/invalid `dollar_rate` | cron 502 `no dollar_rate` | No write | Insert a valid rate row |
| Empty/invalid `numra_rate` | cron 502 `no numra_rate` | No write | Insert a valid NUMRA row |
| Bot token missing | `/api/telegram/webhook` `configured:false` | `sendTelegram` returns false silently | Set env var or `app_secrets` row; redeploy |
| Image upload 403 (client) | historical | Uploads routed through server service role | Confirm `shop-images` bucket exists/public |

Every external call site (`goldapi.io`, `gold-api.com`, DB reads, Storage upload, Telegram send) logs a structured `console.error` on failure, surfaced in Vercel function logs. Broadcast runs return `{ subscribers, sent }` for delivery reconciliation.

### Appendix H — Glossary of Terms

| Term | Meaning |
|---|---|
| **النمرة / NUMRA** | Field-researched goldsmith margin constant (~88, USD-per-ounce terms) subtracted before conversion to derive the buy price. Goldary's core original parameter. |
| **مخزن (makhzan)** | "Stock" — an inventory piece in `draft` status, private to the shop. |
| **معرض (ma'rid)** | "Showcase" — an inventory piece in `published` status, visible publicly. |
| **عيار (ayar) / Karat** | Gold purity. Karat 21 = 0.875 pure; the public reference karat. |
| **أجور الصياغة (making fee)** | Craftsmanship/labor fee added per invoice line (`invoice_items.making_fee`). |
| **XAU/USD** | Global spot price of one troy ounce of gold in US dollars. |
| **RLS** | Row-Level Security — Postgres policies enforcing multi-tenant isolation at the database. |
| **Service role** | Supabase server-only key that bypasses RLS; used exclusively by trusted server code. |
| **Aurum** | Goldary's consumer savings-goal product (Latin for "gold"). |
| **Ella Jewels** | Separate but linked cinematic jewelry content brand. |

---

*End of document. All secrets, keys, and tokens redacted as `[REDACTED]`. Prepared as the founder's complete technical record of work completed prior to investor entry — Goldary, 2026-09-22.*
