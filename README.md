# VidVault 📼

> **The Early Web Archive — 2005–2009**

VidVault is a retro-styled YouTube archive browser that surfaces videos originally uploaded during the golden era of early YouTube (April 2005 – December 2009). The UI is deliberately styled after Windows XP-era web portals — complete with a ticker tape, nav tabs, a taskbar, and pixel-perfect early-2000s typography.

![VidVault Screenshot](https://imgur.com/TzaZp0M)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | [React 19](https://react.dev/) |
| **Build tool** | [Vite 8](https://vitejs.dev/) |
| **Styling** | Vanilla CSS with CSS custom properties — no UI framework |
| **Video data** | [YouTube Data API v3](https://developers.google.com/youtube/v3) |
| **Random word engine** | [Datamuse API](https://www.datamuse.com/api/) (free, no key required) |
| **Client-side caching** | `localStorage` with a 7-day TTL |
| **Serverless backend** | [Vercel Functions](https://vercel.com/docs/functions) (Node.js) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Features

### 🎬 Era-locked archive
Every search is filtered to videos published between **April 23, 2005** and **December 31, 2009** using the YouTube API's `publishedAfter` / `publishedBefore` parameters. Nothing modern ever bleeds through.

### 🔍 Search & sort
Full-text search against the YouTube archive with three sort modes:
- **Best Match** — relevance ranking
- **Most Recent** — newest-in-era first
- **Most Viewed** — highest view count first

### 📄 Pagination
Results are paginated using YouTube's `nextPageToken` / `prevPageToken` system, with full forward/back navigation and page tracking.

### 🗂️ Browse by category
Ten pre-built category shortcuts in the sidebar (Viral Clips, Music Videos, Comedy, Gaming, Flash Animations, etc.) each trigger a curated era-specific search query.

### 🏷️ Hot tags
A tag cloud of twelve popular early-YouTube tags for instant one-click browsing.

### 🎲 Random video ("Feeling Lucky")
Fetches a random word from the Datamuse API, combines it with a random year (2005–2009), and opens a surprise video. Already-seen video IDs are tracked in a `useRef` set to avoid repeats within a session.

### 🖥️ Retro Windows XP UI
- Inset `#search-bar` with bevelled border
- Teal gradient header with amber accent logo
- Tab navigation with raised/active states
- Animated amber ticker tape (`@keyframes ticker`)
- Sidebar boxes with gradient title bars
- Retro loading bar animation
- Era-appropriate font stack: Verdana → Tahoma → Arial

### 📦 Client-side caching
API responses are stored in `localStorage` under a `vv2_` namespace with a 7-day TTL and automatic quota-exceeded eviction. Duplicate in-flight requests are deduplicated via a `Map` of pending promises.

### 🔑 API key rotation
The serverless function (`api/search.js`) cycles through up to **10 YouTube API keys** (`YOUTUBE_API_KEY_1` … `YOUTUBE_API_KEY_10`) automatically when a key's daily quota is exhausted, returning a `429` only after all keys are spent.

### 📱 Responsive / mobile support
The layout adapts to small screens via CSS media queries:
- Sidebar collapses behind a hamburger toggle (☰) on mobile
- Nav tabs scroll horizontally without wrapping
- Header stacks logo and search bar vertically on narrow viewports
- Video grid collapses from 4 → 2 → 1 column
- Touch-friendly tap targets throughout

---

## Project Structure

```
youtube/
├── api/
│   ├── search.js          # Vercel serverless function — YouTube search with key rotation
│   └── videos.js          # (stub) video detail endpoint
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api.js             # Client fetch layer — caching, deduplication
│   ├── App.jsx            # Root component — routing, header, ticker, nav
│   ├── utils.js           # Helpers — getVideoId, fmtDate, fmtCount, computeStars
│   ├── main.jsx           # React entry point
│   ├── components/
│   │   ├── Sidebar.jsx    # Browse categories, hot tags, random video, about
│   │   ├── HomePage.jsx   # Featured / Most Viewed / Recently Rediscovered grids
│   │   ├── VideoGrid.jsx  # Reusable grid that fetches and renders VideoCards
│   │   ├── VideoCard.jsx  # Grid card + ResultRow (search result list item)
│   │   ├── SearchPage.jsx # Search results list with sort bar and pagination
│   │   └── VideoPage.jsx  # Embedded YouTube player + metadata
│   ├── hooks/
│   │   └── useClock.js    # Live clock hook (used in taskbar tray)
│   └── styles/
│       ├── base.css       # Reset, CSS variables, OS chrome, header, ticker
│       └── components.css # Sidebar, video grid, search results, player, mobile
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- A [YouTube Data API v3](https://console.cloud.google.com/) key (free tier: 10,000 units/day)

### Local development

```bash
# 1. Install dependencies
npm install

# 2. Create a local environment file
echo "YOUTUBE_API_KEY_1=your_key_here" > .env.local

# 3. Start dev server with Vercel (serves both frontend and API routes)
npx vercel dev
```

> **Note:** The `/api/search` route is a Vercel serverless function. `npx vercel dev` is required locally to serve both the Vite frontend and the API routes together.

### Environment variables

| Variable | Description |
|---|---|
| `YOUTUBE_API_KEY_1` | Primary YouTube Data API v3 key |
| `YOUTUBE_API_KEY_2` … `YOUTUBE_API_KEY_10` | Additional keys for quota rotation (optional) |
| `YOUTUBE_API_KEY` | Legacy single-key fallback |

Set these in the **Vercel dashboard** under *Project → Settings → Environment Variables*.

### Deploy to Vercel

```bash
npx vercel --prod
```

Vercel auto-detects the Vite framework. The `vercel.json` specifies `outputDirectory: dist` and `buildCommand: npm run build`.

---

## How quota rotation works

Each YouTube API search costs **100 units**. The free tier gives 10,000 units/day — roughly 100 searches per key. The serverless function in `api/search.js`:

1. Reads all configured keys (`YOUTUBE_API_KEY_1` … `_10` + `YOUTUBE_API_KEY`)
2. Tries each key in order
3. On `quotaExceeded` (HTTP 403), logs the exhaustion and moves to the next key
4. If all keys are exhausted, returns `HTTP 429` with a human-readable message

Client-side caching means repeat searches for the same query/sort/page triple never hit the API at all (within the 7-day TTL window).

---

## License

MIT
