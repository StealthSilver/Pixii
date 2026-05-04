# Pixii — Technical Documentation

Pixii is a **Next.js** workspace for marketplace and creative operations: listing intelligence (Amazon-oriented tools), content generation, image and packaging workflows, and optional **Shopify** integration. This document describes **architecture**, **controls**, **integrations**, and **how work flows through the system**.

---

## Table of contents

1. [Application overview](#1-application-overview)
2. [Technology stack](#2-technology-stack)
3. [Repository layout](#3-repository-layout)
4. [Runtime architecture](#4-runtime-architecture)
5. [User interface and controls](#5-user-interface-and-controls)
6. [Feature modules](#6-feature-modules)
7. [HTTP API surface](#7-http-api-surface)
8. [Data layer (MongoDB)](#8-data-layer-mongodb)
9. [Configuration and secrets](#9-configuration-and-secrets)
10. [Local development](#10-local-development)
11. [Deployment notes](#11-deployment-notes)

---

## 1. Application overview

### 1.1 Purpose

Pixii groups multiple **tools** behind one shell: a persistent **sidebar** for navigation, a **navbar** for global actions, and **dashboard pages** under `src/app/dashboard/*` where each product area implements its UI and calls **Route Handlers** under `src/app/api/*`.

Short marketing routes (for example `/hook`, `/aeo`, `/roaster`) often **redirect** to their dashboard equivalents so bookmarks and nav stay stable.

### 1.2 Product areas (high level)

| Area | User-facing entry | Dashboard (typical) | Role |
|------|-------------------|---------------------|------|
| Hooks | `/hook` → `/dashboard/hooks` | Hooks library, drafts, Claude-generated posts | Messaging patterns and reusable copy |
| AEO | `/aeo` → `/dashboard/aeo` | Answer-engine style diagnostics | How “answer engines” might surface a brand or SKU |
| Rufus Twin | `/rufus` → `/dashboard/rufus-twin` | Listing analysis + shopper simulation | Stress-test listing copy against Q&A-style prompts |
| Roaster | `/roaster` | `/dashboard/roaster` | Amazon listing critique, script, voice, avatar (beta) |
| Review Analytics | `/reviews` | `/dashboard/review-analytics` | Themes, purchase criteria, action plans from reviews |
| Market Estimator | `/market` | `/dashboard/market-estimator` | Category sizing and demand-style insights |
| AI Creator | `/creator` | `/dashboard/ai-creator` | Campaign-style scripts and assets (beta) |
| UGC Video | `/ugc` | `/dashboard/ugc-video` | Persona-driven UGC-style ads (beta) |
| Clipper | `/clipper` | Same | YouTube/long-form → clips, chapters, blog draft (beta) |
| Photo Upgrader (Studio) | `/studio` | `/dashboard/photo-upgrader` | Upscale, background, relight via external APIs |
| Packaging Renderer | `/renderer` | `/dashboard/packaging-renderer` | PDF/label → consistent mockup scenes |
| Shopify | `/shopify` | Same | Connect store, lifestyle photo pipeline, push (beta) |

Public **share** views (minimal chrome) live under `/share/*` and are rendered **without** the main sidebar/navbar shell.

---

## 2. Technology stack

### 2.1 Core platform

- **Next.js** (App Router) — `src/app` for pages and `route.ts` API handlers.
- **React** — Client components where interactivity is required (`"use client"`).
- **TypeScript** — Strict typing across UI and `src/lib`.
- **Tailwind CSS v4** — Styling via `@tailwindcss/postcss` and `globals.css`.

### 2.2 UI libraries

- **Material UI (MUI) v9** — Icons (`@mui/icons-material`) and some components.
- **Emotion** — Styled engine used by MUI.
- **React Icons** — Supplementary icons.
- **Fontshare** (Cabinet Grotesk, Switzer) — Loaded in root `layout.tsx`.

### 2.3 Data and async work

- **MongoDB** via **Mongoose** — Job documents, drafts, hook patterns, Shopify tokens, AEO/Rufus history, etc.
- **SWR** — Client data fetching and revalidation where used.
- **Next.js `after()`** — Deferred server work after HTTP response (for example Roaster job pipeline) so the client receives `jobId` quickly while processing continues.

### 2.4 External services (by concern)

- **Anthropic (Claude)** — Primary LLM for analysis, JSON extraction, copy, simulation, vision paths (see `.env.example` for per-feature model overrides).
- **`openai` (npm)** — Present in `package.json`; documented tool pipelines use Anthropic for LLM work unless you add separate OpenAI callers.
- **ElevenLabs** — Text-to-speech for Roaster, AI Creator, UGC flows.
- **Cloudinary** — Image and video hosting, uploads, transformations (`src/lib/cloudinary.ts`).
- **Fal.ai** — Image/video models (upscale, product photo, relighting, optional avatar/lip-sync paths).
- **Replicate** — Fallback upscale, Whisper transcription for Clipper, optional video trim model.
- **Runware** — Roaster avatar / video when Fal is unavailable or over quota.
- **Remove.bg** — Background removal in Photo Upgrader.
- **ScraperAPI** (optional) — Real Amazon HTML/reviews when keys are set; otherwise LLM-assisted placeholders.
- **YouTube Data API v3** + **@distube/ytdl-core** (+ optional **yt-dlp** / **ffmpeg**) — Clipper preview and audio download.
- **Shopify OAuth** — Store connection and Admin API usage for product images.

### 2.5 Media and document processing (server)

- **sharp** — Image resizing and processing.
- **pdf2pic** — PDF page rasterization for packaging workflows (requires a local **GraphicsMagick** / **ImageMagick** stack as expected by `pdf2pic`).
- **JSZip** — Packaging downloads/bundles where applicable.
- **cheerio** — HTML parsing for scrapers.
- **marked** — Markdown rendering where used in UI or exports.

---

## 3. Repository layout

```
src/
  app/                    # Next.js App Router: pages + API routes
    api/                  # Route handlers: POST/GET per feature
    dashboard/            # Primary tool UIs
    share/                # Public share pages (no AppShell chrome)
    *.tsx                 # Short routes, redirects, landing
  components/             # Shell: AppShell, Navbar, Sidebar, Theme, icons
  lib/
    models/               # Mongoose schemas
    mongodb.ts            # connectDB() with global connection cache
    anthropic/            # Shared Claude helpers
    */pipeline.ts         # Per-feature orchestration (often long-running)
```

**Important files**

- `src/components/AppShell.tsx` — Layout wrapper: sidebar + navbar + main; **skipped** for `/share/*`.
- `src/components/Sidebar.tsx` — Product navigation and beta badges.
- `src/lib/navSearchIndex.ts` — Canonical list of tools for **Cmd/Ctrl+K-style** fuzzy search (`NavbarSearch` + Fuse.js).
- `.env.example` — Documented environment variables and feature requirements.

---

## 4. Runtime architecture

### 4.1 Request path

1. Browser loads a **page** (`page.tsx`) or **layout**.
2. Client components call **`/api/...`** Route Handlers with `fetch` (JSON or `multipart/form-data`).
3. Handlers call **`connectDB()`** when persistence is required, validate input, create or update **Mongoose** documents, optionally schedule **`after()`** work or return a **job id** for the client to poll.

### 4.2 Long-running jobs

Most heavy tools follow a **job** pattern:

1. **Submit** or **upload** — Creates a document with `status: "queued"` (or similar) and returns **`jobId`** (MongoDB `ObjectId` string).
2. **Process** — Either triggered in the same request via `after()`, or by a dedicated **`/api/<feature>/process`** (or equivalent) invoked from the client after upload.
3. **Status** — Client polls **`/api/<feature>/status/[jobId]`** until `completed` or `failed`.
4. **History** — **`/api/<feature>/history`** and **`/api/<feature>/history/[jobId]`** load past runs.

Exact field names and step indices live in each model under `src/lib/models/`.

### 4.3 Server runtime

API routes that touch native binaries, sharp, pdf2pic, or long LLM chains declare **`export const runtime = "nodejs"`** where needed. Some routes set **`maxDuration`** (for example 300s) for platform limits on Vercel.

---

## 5. User interface and controls

### 5.1 Shell and navigation

- **Sidebar** (desktop, `lg+`): grouped sections — Intelligence, Amazon, Content, Visuals, Store. Items link to short URLs (`/hook`, `/studio`, …); **active state** uses `usePathname()` and optional `activePathPrefixes` so `/dashboard/roaster` stays tied to “Roaster”.
- **Collapse** (desktop): Navbar control toggles **narrow rail** (icons + tooltips via `title` on links).
- **Mobile drawer**: Hamburger in navbar opens a **fixed overlay** and full-width drawer; tapping a link or the close control dismisses it.
- **Home**: `/` lists all tools from `NAV_SEARCH_INDEX` (excluding `home`).

### 5.2 Navbar

- **Open menu** (small screens only) — Reveals sidebar drawer.
- **Collapse / expand sidebar** (large screens).
- **Search** (`sm+`) — Fuse.js fuzzy match over `NAV_SEARCH_INDEX` (title, section, keywords); keyboard navigation and Enter to open.
- **Theme toggle** — Light/dark; preference stored in **`localStorage`** key `theme`; inline script in `layout.tsx` prevents flash on first paint.
- **Notifications** — Presentational control (no backend wiring in template).

### 5.3 Theme system

- `ThemeProvider` exposes `useTheme()` with `theme`, `setTheme`, `toggleTheme`.
- `document.documentElement` toggles class **`dark`** for Tailwind dark mode.

### 5.4 Share pages

- Routes under **`/share/...`** render without `AppShell` so shared Roaster/Creator links are distraction-free (see `AppShell` pathname guard).

### 5.5 In-tool controls

Each dashboard owns its forms, tabs, and processing views (for example URL inputs, file uploads, regenerate buttons). Patterns repeat: **submit → show processing state → poll status → render results**. Refer to the specific `page.tsx` and `components/` under that dashboard.

---

## 6. Feature modules

Below: **UI path**, **main API prefixes**, and **primary `src/lib` orchestration**. This is a map for engineers, not an exhaustive list of every export.

### 6.1 Hooks

- **UI**: `/dashboard/hooks`
- **API**: `/api/hooks/generate`, `/api/hooks/drafts`, `/api/hooks/drafts/[id]`, `/api/hooks/patterns`, `/api/hooks/patterns/seed`
- **Data**: `HookPattern`, `Draft`, `RawPost`
- **Requires**: `MONGODB_URI`, `ANTHROPIC_API_KEY`

### 6.2 AEO (Answer Engine Optimization)

- **UI**: `/dashboard/aeo`
- **API**: `/api/aeo/run`, `/api/aeo/history`, `/api/aeo/history/[id]`, `/api/aeo/config`
- **Data**: `AEOQuery`, `AEOConfig`
- **Requires**: MongoDB, Anthropic

### 6.3 Rufus Twin

- **UI**: `/dashboard/rufus-twin`
- **API**: `/api/rufus-twin/analyze-listing`, `/api/rufus-twin/simulate`, `/api/rufus-twin/save`, `/api/rufus-twin/history`, `/api/rufus-twin/history/[id]`
- **Data**: `RufusProduct`, `RufusQuery`
- **Requires**: MongoDB, Anthropic (`RUFUS_ANTHROPIC_MODEL` optional)

### 6.4 Roaster

- **UI**: `/dashboard/roaster`, entry `/roaster`
- **API**: `/api/roaster/submit`, `/api/roaster/status/[jobId]`, `/api/roaster/history`, `/api/roaster/history/[jobId]`, `/api/roaster/share/[jobId]`
- **Pipeline**: `src/lib/roaster/pipeline.ts` (listing, Claude, ElevenLabs, Fal/Runware avatar)
- **Data**: `RoasterJob`
- **Requires**: MongoDB, Cloudinary, ElevenLabs, Anthropic; optional Fal, Runware, ScraperAPI

### 6.5 Review Analytics

- **UI**: `/dashboard/review-analytics`
- **API**: `/api/review-analytics/submit`, `status`, `history`, `history/[jobId]`, `reviews/[jobId]`
- **Pipeline**: `src/lib/reviewAnalytics/pipeline.ts`
- **Data**: `ReviewAnalysis`

### 6.6 Market Estimator

- **UI**: `/dashboard/market-estimator`
- **API**: `/api/market-estimator/submit`, `status`, `history`, `history/[jobId]`
- **Data**: `MarketEstimate`

### 6.7 AI Creator

- **UI**: `/dashboard/ai-creator`
- **API**: `/api/ai-creator/submit`, `status`, `history`, `regenerate-script`, `share/[jobId]`, …
- **Data**: `CreatorJob`

### 6.8 UGC Video

- **UI**: `/dashboard/ugc-video`
- **API**: `/api/ugc-video/submit`, `upload`, `status`, `regenerate-script`, `regenerate-frames`, …
- **Data**: `UGCJob`

### 6.9 Clipper (Video Chopper)

- **UI**: `/clipper`
- **API**: `/api/video-chopper/submit`, `preview`, `status`, `blog`, `history`, …
- **Data**: `VideoChopperJob`
- **Requires**: MongoDB, Anthropic, Replicate, Cloudinary; YouTube key and optional yt-dlp per `.env.example`

### 6.10 Photo Upgrader (Studio)

- **UI**: `/dashboard/photo-upgrader`, entry `/studio`
- **API**: `/api/photo-upgrader/upload`, `process`, `status`, `history`, …
- **Pipeline**: `src/lib/photoUpgrader/pipeline.ts`
- **Data**: `PhotoJob`

### 6.11 Packaging Renderer

- **UI**: `/dashboard/packaging-renderer`, entry `/renderer`
- **API**: `/api/packaging-renderer/upload`, `process`, `regenerate`, `status`, `history`, …
- **Pipeline**: `src/lib/packagingRenderer/pipeline.ts`, `pdfProcessor.ts`
- **Data**: `PackagingJob`

### 6.12 Shopify

- **UI**: `/shopify`
- **API**: `/api/shopify/auth`, `callback`, `connection`, `products`, `generate`, `push`, `status`, `history`, …
- **Data**: `ShopifyConnection`, `ShopifyPhotoJob`

---

## 7. HTTP API surface

All APIs are **relative to the deployment origin** (for example `http://localhost:3000` in development).

Convention:

- **`POST`** — Create jobs, trigger generation, upload files.
- **`GET`** — History, status, config, share payloads.

**Share URLs** for multi-step creators often rely on **`NEXTAUTH_URL` or app origin** (see `.env.example` Roaster section) so links resolve correctly in production.

For a full list of endpoints, see `src/app/api/**/route.ts` (67 route files at time of writing).

---

## 8. Data layer (MongoDB)

Connection helper: **`src/lib/mongodb.ts`**

- Reads **`MONGODB_URI`** or **`DATABASE_URL`**.
- Uses a **global singleton cache** for `mongoose.connect` so serverless invocations reuse one connection where possible.

**Models** (`src/lib/models/`):

| Model | Typical use |
|-------|-------------|
| `HookPattern`, `Draft`, `RawPost` | Hooks library |
| `AEOConfig`, `AEOQuery` | AEO runs |
| `RufusProduct`, `RufusQuery` | Rufus Twin |
| `RoasterJob` | Roaster pipeline |
| `ReviewAnalysis` | Review Analytics |
| `MarketEstimate` | Market Estimator |
| `CreatorJob` | AI Creator |
| `UGCJob` | UGC Video |
| `VideoChopperJob` | Clipper |
| `PhotoJob` | Photo Upgrader |
| `PackagingJob` | Packaging Renderer |
| `ShopifyConnection`, `ShopifyPhotoJob` | Shopify |

---

## 9. Configuration and secrets

1. Copy **`.env.example`** to **`.env.local`** (never commit secrets).
2. Next.js loads `.env.local` automatically in dev and production builds on supported hosts.

**Authoritative variable list and comments** live in **`.env.example`**. Minimum sets differ per tool:

- Almost all persisted jobs: **`MONGODB_URI`**
- Claude features: **`ANTHROPIC_API_KEY`** (+ optional model overrides)
- Media-heavy tools: **Cloudinary**, **Fal**, **Replicate**, **Remove.bg** as documented per section in `.env.example`

---

## 10. Local development

**Prerequisites**

- **Node.js** compatible with Next.js 16 (see Next.js release notes for version range).
- **MongoDB Atlas** (or compatible URI) for features that persist jobs.
- Optional per tool: API keys from `.env.example`; for Clipper, local **ffmpeg** / **yt-dlp** if using those backends; for packaging PDF rasterization, satisfy **pdf2pic** native dependencies.

**Commands**

```bash
npm install
npm run dev
```

Application default: **http://localhost:3000**

```bash
npm run build   # production bundle
npm run start   # run production server after build
```

---

## 11. Deployment notes

- Set the same environment variables on the host (Vercel, Docker, etc.) as in `.env.local`.
- Respect **platform timeouts**; routes that set `maxDuration` align with long LLM or video steps.
- **Serverless** and **binary** dependencies: verify `sharp`, `pdf2pic`, and any forked child processes (`yt-dlp`) are supported on your target environment or move those workloads to a **Node** service or **container** with full OS tooling.
- **Share links** and OAuth redirects (Shopify) require correct **public URL** and allowed callback URLs in partner dashboards.

---

## License and third parties

This application integrates multiple third-party APIs; usage is subject to each provider’s terms and pricing. Refer to their documentation when scaling traffic or storing customer data.
