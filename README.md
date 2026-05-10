# SmartCompare — Real-Time Multi-Platform Price Comparison

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Puppeteer-21.x-40B5A4?style=for-the-badge&logo=googlechrome&logoColor=white" />
</p>

<p align="center">
  A full-stack web application that <strong>scrapes live prices</strong> from Amazon and Myntra simultaneously,
  compares them side by side, and helps users make smarter purchasing decisions through real-time analytics,
  price history tracking, and intelligent recommendations.
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Database Schema](#database-schema)
- [Key Algorithms](#key-algorithms)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)

---


## Features

### Core
- **Real-time scraping** — Puppeteer scrapes Amazon.in and Myntra simultaneously using `Promise.all()` for parallel execution
- **30-minute DB cache** — same query served from MySQL instantly on repeat searches; no redundant browser launches
- **Best deal detection** — automatically identifies and highlights the lowest-priced item across both platforms
- **Price range filter** — filter results by minimum and maximum price before or after scraping
- **Sort options** — Default, Most Popular, Price Low→High, Price High→Low, Top Rated

### Analytics Dashboard
- **Price Range Chart** — grouped bar chart showing lowest, average, and highest prices per platform
- **Value Score** — composite score (price 60% + rating 40%) rendered as a doughnut chart with breakdown bars
- **Full Comparison** — side-by-side bar chart scoring each platform on price competitiveness, rating quality, and result count
- **Insight cards** — best platform, cheapest single item, lowest average price, highest rated platform

### User Features
- **User authentication** — register/login stored in MySQL `users` table
- **Wishlist** — save favourite products, stored per user in `localStorage`
- **Cart** — add products, stored per user in `localStorage`
- **Price drop notifications** — re-scrape cart items on demand and alert user when prices fall
- **Price history modal** — line chart showing how a product's price has changed over time (accumulates with each search)
- **Autocomplete** — debounced (220ms) suggestions from the MySQL `products` table as you type
- **Search history** — recent searches shown when focusing the empty search bar

### Browse
- **Category pages** — 6 categories (Fashion, Electronics, Footwear, Accessories, Home, Beauty) with 6–8 sub-tabs each
- **Smart Myntra routing** — queries mapped to correct Myntra slug URLs (`shirts-for-men` not `shirts%20for%20men`)
- **Blocked-terms list** — electronics and appliance searches skip Myntra entirely (Myntra doesn't sell them), preventing irrelevant results like cooler bags when searching "cooler"

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6, Chart.js, react-chartjs-2 |
| Backend | Node.js 18, Express.js 4 |
| Scraping | Puppeteer 21 (headless Chromium) |
| Database | MySQL 8.0, mysql2 driver |
| Styling | Custom CSS (dark theme, CSS variables, Google Fonts) |
| Fonts | Instrument Serif, Geist, Geist Mono |

---

## Project Structure

```
price_comparison_platform/
│
├── backend/                        # Node.js + Express server
│   ├── server.js                   # Entry point — starts Express on port 5000
│   ├── config/
│   │   └── db.js                   # MySQL connection + auto schema migration
│   ├── routes/
│   │   ├── searchRoutes.js         # All /api/* route definitions
│   │   └── authRoutes.js           # /api/auth/register and /api/auth/login
│   ├── controllers/
│   │   └── searchController.js     # All business logic — 8 exported functions
│   └── scrapers/
│       ├── amazonScraper.js        # Puppeteer scraper for Amazon.in
│       └── myntraScraper.js        # Puppeteer scraper for Myntra.com
│
└── src/                            # React frontend
    ├── App.js                      # BrowserRouter + 7 route definitions
    ├── App.css                     # Complete design system + dark theme
    ├── components/
    │   ├── Navbar.js               # Search bar, autocomplete, auth state, Browse menu
    │   ├── PriceChart.js           # 3-tab analytics dashboard
    │   ├── PriceHistoryModal.js    # Line chart popup for price trends
    │   └── AuthPage.js             # Flip-card login/register UI
    ├── pages/
    │   ├── Home.js                 # Search results, best deal, sort, recent products
    │   ├── Category.js             # Category browse with sub-tabs, filters, dashboard
    │   ├── Wishlist.js             # Saved items page
    │   ├── Cart.js                 # Cart page with price drop check
    │   ├── Login.js
    │   └── Register.js
    └── Utils/
        └── userStore.js            # All localStorage utility functions
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0
- [Google Chrome](https://www.google.com/chrome/) (Puppeteer uses your system's Chrome)
- npm v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smartcompare.git
cd smartcompare
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ..
npm install
```

### 4. Set up MySQL

Open MySQL Workbench or your MySQL client and run:

```sql
CREATE DATABASE price_comparison;
```

> The application automatically creates the `products` and `users` tables when the server first starts. You do not need to run any additional SQL.

### 5. Configure database credentials

Open `backend/config/db.js` and update:

```js
const db = mysql.createConnection({
    host: "localhost",
    user: "root",           // your MySQL username
    password: "your_password",  // your MySQL password
    database: "price_comparison"
});
```

### 6. Start the backend server

```bash
cd backend
node server.js
```

You should see:
```
✅ MySQL connected successfully
✅ Users table ready
✅ DB migrations running
Server running on port 5000
```

### 7. Start the frontend

Open a new terminal:

```bash
# from the project root
npm start
```

The app opens at **http://localhost:3000**

---

## Environment Setup

| Variable | Default | Description |
|----------|---------|-------------|
| Backend port | `5000` | Set in `server.js` |
| Frontend port | `3000` | Set by Create React App |
| DB host | `localhost` | Set in `config/db.js` |
| DB name | `price_comparison` | Set in `config/db.js` |
| Cache window | `30 minutes` | Set in `searchController.js` |

---

## API Endpoints

### Search & Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=jeans&minPrice=500&maxPrice=2000` | Cache-first search (scrapes if no fresh cache) |
| `GET` | `/api/recent?queries=jeans,shirts` | Fetch recent products from DB (no scraping) |
| `GET` | `/api/suggestions?q=sh` | Autocomplete suggestions from DB |
| `GET` | `/api/price-history?name=Nike shoes&platform=amazon` | Price trend data for a product |
| `GET` | `/api/trending` | Most searched queries in the last 7 days |
| `GET` | `/api/platform-stats` | Overall stats per platform |
| `POST` | `/api/recommendations` | Products based on user's search history |
| `POST` | `/api/check-price-drops` | Re-scrape cart items and compare prices |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Authenticate user |

---

## How It Works

### Search Flow

```
User searches "jeans"
        │
        ▼
GET /api/search?q=jeans
        │
        ▼
Check MySQL cache
(search_query = 'jeans' AND created_at > NOW() - 30 MIN)
        │
   ┌────┴────┐
Cache HIT   Cache MISS
   │              │
   ▼              ▼
Return DB     Promise.all([
rows           scrapeAmazon("jeans"),
instantly      scrapeMyntra("jeans")
             ])    ← both run simultaneously
                   │
                   ▼
             Sanitize + INSERT to MySQL
                   │
                   ▼
             Return JSON to frontend
```

### Myntra URL Strategy

Myntra uses category-based routing, not query strings:

```
✅ Correct:   myntra.com/shirts-for-men
❌ Wrong:     myntra.com/shirts%20for%20men  (encodeURIComponent breaks routing)

Code:
const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
```

For queries like `cooler`, `fridge`, `laptop` — which are not Myntra products — the scraper returns `[]` immediately without launching a browser, preventing irrelevant results like "cooler bags" or "fridge covers".

### Price History

Every scrape **inserts new rows** rather than updating existing ones. The same product searched on 5 different days creates 5 rows with 5 different `created_at` timestamps. Querying all rows `ORDER BY created_at ASC` gives the full price timeline for that product.

---

## Database Schema

```sql
CREATE TABLE products (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(500),
    price         VARCHAR(100),
    rating        VARCHAR(100),
    image         TEXT,
    link          TEXT,
    platform      VARCHAR(50),        -- 'amazon' or 'myntra'
    search_query  VARCHAR(255),
    description   TEXT,
    original_price VARCHAR(100),
    discount      VARCHAR(100),
    review_count  VARCHAR(100),
    badge         VARCHAR(200),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Algorithms

### Value Score Formula
```
score = (1 - platform_avg_price / max_avg_price) × 60
      + (avg_rating / 5) × 40

Where:
  - 60% weight on price   (lower price = higher score)
  - 40% weight on rating  (higher rating = higher score)
  - Both components normalized to 0–100
  - If no ratings available, equal rating score given to both platforms
```

### Price Parsing
```js
const parsePrice = (priceStr) =>
    parseInt(String(priceStr).replace(/[^\d]/g, "")) || 0;

// "₹1,499"  →  strip non-digits  →  parseInt("1499")  →  1499
```

### Debounced Autocomplete
```
User keystroke
     │
     ▼
clearTimeout(previous timer)
set new timer (220ms)
     │
  220ms passes
  without keystroke
     │
     ▼
GET /api/suggestions?q=<typed>
```

### Cache-First Strategy
```
Before every scrape:
  SELECT * FROM products
  WHERE search_query = ?
  AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)

HIT  → return grouped rows (< 200ms)
MISS → launch Puppeteer (~8–12 seconds)
```

---

## Known Limitations

- **Scraping speed** — each search takes 8–12 seconds on cache miss due to launching real browser instances. Caching reduces this significantly for repeat searches.
- **Myntra ratings** — Myntra's product listing pages do not display star ratings. All Myntra results show `N/A` for ratings.
- **Platform coverage** — currently supports Amazon.in and Myntra only. Flipkart, Meesho, and Nykaa are not yet supported.
- **Pagination** — only the first 8 results per platform are fetched. No pagination support.
- **Password security** — passwords are stored as plain text for this academic prototype. Production deployments should use bcrypt hashing.
- **Selector fragility** — web scrapers can break when Amazon or Myntra update their HTML class names. Multiple fallback selectors are in place to reduce breakage.

---

## Future Enhancements

- [ ] Add Flipkart and Meesho scrapers
- [ ] Password hashing with bcrypt + JWT authentication
- [ ] Email/SMS price drop alerts via NodeMailer or Twilio
- [ ] Price prediction using time-series forecasting (ARIMA/LSTM)
- [ ] Browser extension to compare prices while browsing Amazon or Myntra directly
- [ ] Product similarity matching across platforms using fuzzy string matching
- [ ] React Native mobile app with push notifications
- [ ] Admin dashboard for scraping health monitoring

---

## Academic Context

This project was developed as a Mini Project at **CVR College of Engineering**, Department of CSE (Cyber Security), Academic Year 2025–26.

---

## License

This project is for educational purposes. Feel free to fork and adapt it for your own learning.

---

<p align="center">Built with React · Node.js · Puppeteer · MySQL</p>