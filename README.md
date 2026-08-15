# Apex News Aggregator 

A premium, lightweight, self-updating news aggregator application featuring global and Indian feeds. Built with a React + Vite frontend and an Express backend, the app scrapes RSS news feeds on a rolling 3-hour schedule, automatically categorizes stories, prunes old data, and serves articles through a modern, responsive UI.

---

##  Key Features

*   **Automated Feed Synchronization:** Scrapes top news sources on an automated 3-hour interval, with support for on-demand manual triggers.
*   **Intelligent Auto-Categorization:** Automatically parses raw RSS item URLs and metadata to sort articles into *Politics, Sports, Business, Entertainment, International,* and *Top Stories*.
*   **Deduplication & Storage Management:** Prevents article duplication, auto-upgrades categories, and caps database storage (max 150 articles per category/region combo, automatically purging content older than 3 days) to keep database reads ultra-fast.
*   **Fluid, Premium Responsive UI:** Modern dashboard interface designed with premium dark/slate styling, fluid breakpoints, visual indicators, live sync status polling, paginated cards, and custom category placeholders.
*   **Global & Regional Feeds:** Built-in regional toggles for **Global** and **India** news sources.

---

##  Repository Structure

The project is structured as a monorepo, cleanly dividing backend API logic and scraper capabilities from the frontend single-page application:

```text
apex-news-aggregator/
├── backend/
│   ├── data/                 # JSON file database storage
│   │   └── news.json         # Persisted articles and scraper status
│   ├── news-store.js         # DB operations, deduplication, and categorization logic
│   ├── sources.js            # Configuration for curated RSS feeds
│   ├── server.js             # Express API, cron scheduler, and static asset server
│   ├── package.json          # Node dependencies (express, rss-parser, cors)
│   └── test-*.js             # Utility scripts for troubleshooting scrapers
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React Dashboard and UI logic
│   │   ├── App.css           # Custom styles, transitions, and theme
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Reset styles
│   ├── public/               # Static assets
│   ├── index.html            # Entry HTML
│   └── package.json          # React + Vite dependencies and build commands
├── package.json              # Monorepo management scripts
└── README.md                 # Project documentation (this file)
```

---

##  Tech Stack

*   **Frontend:** React (functional components, hooks), Vite, CSS (custom custom HSL/variables theme, fluid grid layout, CSS animations, inline SVGs).
*   **Backend:** Node.js, Express, `rss-parser` (for fetching and parsing XML feeds with custom user-agents).
*   **Storage:** Lightweight local JSON database (`backend/data/news.json`) with file-level persistence, preventing database overhead.

---

##  Curated Sources Configuration

The app scrapes from major Indian and global news organizations configured in [backend/sources.js](file:///d:/News%20App/backend/sources.js):

| Category | India Sources | Global Sources |
| :--- | :--- | :--- |
| **Top Stories** | NDTV, Times of India, Indian Express | BBC News, CNN News, NY Times |
| **International** | NDTV, Times of India, Indian Express | BBC News, CNN News, NY Times, The Guardian |
| **Politics** | Indian Express | BBC News, CNN News, Politico |
| **Business & Finance** | Economic Times, NDTV, Indian Express | CNBC, BBC News, NY Times |
| **Sports** | Times of India, NDTV, Indian Express | CBS Sports, BBC News |
| **Entertainment** | NDTV, Times of India, Indian Express | CNN News, Variety |

---

##  Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher recommended)
*   npm (v9.0.0 or higher)

### 1. Install Dependencies

Install dependencies for the backend and frontend simultaneously using the root installation script:

```bash
npm run install:all
```

### 2. Run in Development Mode

You can run both servers in parallel to facilitate quick development cycles:

#### Start the Backend (API and Scraper Daemon)

Run the backend server on `http://localhost:5000`:

```bash
cd backend
npm run dev
```

*Note: On boot, the backend automatically runs an initial crawl to populate the database.*

#### Start the Frontend (Vite Development Server)

In another terminal window, start the frontend developer server on `http://localhost:5173`:

```bash
cd frontend
npm run dev
```

*The frontend is configured to proxy API requests to `http://localhost:5000` during local dev sessions.*

### 3. Production Build and Execution

To package the application and host the React bundle directly through the Express server:

1.  Build the frontend code:
    ```bash
    npm run build:all
    ```
2.  Start the Express server in production mode:
    ```bash
    npm start
    ```
3.  Open `http://localhost:5000` in your web browser.

---

##  API Reference

The backend exposes the following endpoints:

### `GET /api/news`
Fetches a list of cached articles matching query constraints.
*   **Parameters:**
    *   `category` (string, optional): Filter by category (e.g., `sports`, `politics`, `business`, `entertainment`, `international`, `top-stories`). Defaults to `all`.
    *   `region` (string, optional): Filter by region (`India` or `Global`).
    *   `source` (string, optional): Filter by source name (e.g., `BBC News`).
    *   `search` (string, optional): Fuzzy search string applied against titles and descriptions.
    *   `importantOnly` (boolean, optional): Set to `true` to return only high-importance top stories.
    *   `page` (number, optional): Page number. Defaults to `1`.
    *   `limit` (number, optional): Articles per page. Defaults to `20`.

### `GET /api/sources`
Retrieves a list of all unique news sources currently present in the database.

### `GET /api/status`
Retrieves the scraper's operational status.
*   **Response Payload:**
    *   `lastSync`: Timestamp of last successful RSS crawl.
    *   `nextSync`: Timestamp of scheduled next crawl.
    *   `status`: Operational state (`syncing`, `success`, `error`, `idle`).
    *   `isSyncing`: Live boolean indicating active synchronization.

### `POST /api/trigger-sync`
Manually triggers the scraping cycle on demand. Returns a status conflict (`409`) if sync is already running.

---

##  How to Add a New News Feed

To add a new RSS source, open [backend/sources.js](file:///d:/News%20App/backend/sources.js) and append a configuration object to the `SOURCES` array:

```javascript
{
  id: "source-unique-id",
  name: "Display Name of Source",
  url: "https://example.com/rss-feed-url.xml",
  category: "politics", // default category assignment
  region: "Global",     // 'Global' or 'India'
  isTopStorySource: false
}
```

After updating, trigger a manual sync via the UI's **Sync Now** button or restart the backend to fetch the new articles.

---


