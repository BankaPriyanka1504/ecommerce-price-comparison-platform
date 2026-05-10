const scrapeAmazon = require("../scrapers/amazonScraper");
const scrapeMyntra = require("../scrapers/myntraScraper");
const db = require("../config/db");

const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    return parseInt(String(priceStr).replace(/[^\d]/g, "")) || 0;
};

// Extract numeric rating safely, truncate to fit VARCHAR(100)
const sanitizeRating = (rating) => {
    if (!rating) return "N/A";
    return String(rating).slice(0, 50); // never exceed column width
};

const sanitizeStr = (val, max = 490) => {
    if (!val) return "";
    return String(val).slice(0, max);
};

// ─────────────────────────────────────────
// SEARCH — DB cache (30 min) then scrape
// ─────────────────────────────────────────
const searchProducts = async (req, res) => {
    const query    = req.query.q ? req.query.q.toLowerCase().trim() : "";
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null;

    if (!query) return res.status(400).json({ success: false, message: "Query is required" });

    const filterByPrice = (items) => {
        if (!minPrice && !maxPrice) return items;
        return items.filter(item => {
            const p = parsePrice(item.price);
            if (minPrice && p < minPrice) return false;
            if (maxPrice && p > maxPrice) return false;
            return true;
        });
    };

    db.query(
        `SELECT * FROM products WHERE search_query = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) ORDER BY created_at DESC`,
        [query],
        async (err, cached) => {
            if (!err && cached && cached.length > 0) {
                console.log(`📦 Cache hit: "${query}" (${cached.length} rows)`);
                const grouped = { amazon: [], myntra: [] };
                cached.forEach(row => {
                    if (grouped[row.platform]) grouped[row.platform].push(rowToItem(row));
                });
                return res.json({ success: true, source: "database", data: { amazon: filterByPrice(grouped.amazon), myntra: filterByPrice(grouped.myntra) } });
            }

            console.log(`🌐 Scraping "${query}"...`);
            try {
                const [amazonData, myntraData] = await Promise.all([
                    scrapeAmazon(query, minPrice, maxPrice),
                    scrapeMyntra(query, minPrice, maxPrice)
                ]);

                saveToDb([
                    ...amazonData.map(i => ({ ...i, platform: "amazon" })),
                    ...myntraData.map(i => ({ ...i, platform: "myntra" }))
                ], query);

                return res.json({ success: true, source: "scraped", data: { amazon: filterByPrice(amazonData), myntra: filterByPrice(myntraData) } });
            } catch (e) {
                return res.status(500).json({ success: false, message: "Scraping failed", error: e.message });
            }
        }
    );
};

function rowToItem(row) {
    return {
        name: row.name, price: row.price, rating: row.rating,
        image: row.image, link: row.link, platform: row.platform,
        description: row.description || "",
        originalPrice: row.original_price || "",
        discount: row.discount || "",
        reviewCount: row.review_count || "",
        badge: row.badge || ""
    };
}

function saveToDb(items, query) {
    if (!items.length) return;
    const values = items.map(item => [
        sanitizeStr(item.name, 490),
        sanitizeStr(item.price, 90),
        sanitizeRating(item.rating),
        sanitizeStr(item.image, 2000),
        sanitizeStr(item.link, 2000),
        sanitizeStr(item.platform, 40),
        sanitizeStr(query, 240),
        sanitizeStr(item.description, 2000),
        sanitizeStr(item.originalPrice, 90),
        sanitizeStr(item.discount, 90),
        sanitizeStr(item.reviewCount, 90),
        sanitizeStr(item.badge, 190),
    ]);
    db.query(
        `INSERT INTO products (name,price,rating,image,link,platform,search_query,description,original_price,discount,review_count,badge) VALUES ?`,
        [values],
        (err) => {
            if (err) console.error("DB insert error:", err.message);
            else console.log(`✅ Saved ${values.length} rows to DB`);
        }
    );
}

// ─────────────────────────────────────────
// PRICE HISTORY
// ─────────────────────────────────────────
const getPriceHistory = (req, res) => {
    const { name, platform } = req.query;
    if (!name || !platform) return res.status(400).json({ success: false, message: "name and platform required" });
    db.query(
        `SELECT price, rating, created_at FROM products WHERE name = ? AND platform = ? ORDER BY created_at ASC LIMIT 50`,
        [name, platform],
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            return res.json({
                success: true,
                history: rows.map(r => ({ price: parsePrice(r.price), priceStr: r.price, rating: r.rating, date: r.created_at }))
            });
        }
    );
};

// ─────────────────────────────────────────
// TRENDING — most searched queries with avg price
// ─────────────────────────────────────────
const getTrending = (req, res) => {
    db.query(
        `SELECT search_query, COUNT(*) as searches,
         MIN(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as min_price,
         MAX(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as max_price,
         AVG(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as avg_price
         FROM products
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY search_query ORDER BY searches DESC LIMIT 10`,
        (err, rows) => {
            if (err) return res.json({ success: true, trending: [] });
            return res.json({ success: true, trending: rows });
        }
    );
};

// ─────────────────────────────────────────
// PLATFORM STATS — overall stats for dashboard
// ─────────────────────────────────────────
const getPlatformStats = (req, res) => {
    db.query(
        `SELECT platform,
         COUNT(*) as total_products,
         MIN(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as lowest_price,
         MAX(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as highest_price,
         AVG(CAST(REGEXP_REPLACE(price,'[^0-9]','') AS UNSIGNED)) as avg_price
         FROM products GROUP BY platform`,
        (err, rows) => {
            if (err) return res.json({ success: true, stats: [] });
            return res.json({ success: true, stats: rows });
        }
    );
};

// ─────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────
const getRecommendations = (req, res) => {
    const { searchHistory } = req.body;
    if (!searchHistory || !searchHistory.length) return res.json({ success: true, recommendations: [] });

    const recent = [...new Set(searchHistory)].slice(0, 5);
    const likes  = recent.map(() => "search_query LIKE ?").join(" OR ");
    const params = recent.map(q => `%${q}%`);

    db.query(
        `SELECT name,price,rating,image,link,platform,search_query,description FROM products WHERE (${likes}) ORDER BY created_at DESC LIMIT 30`,
        params,
        (err, rows) => {
            if (err) { console.error("Rec error:", err.message); return res.json({ success: true, recommendations: [] }); }
            const seen = new Set();
            const unique = rows.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; }).slice(0, 12);
            return res.json({ success: true, recommendations: unique.map(r => ({ ...rowToItem(r), searchQuery: r.search_query })) });
        }
    );
};

// ─────────────────────────────────────────
// PRICE DROP CHECK
// ─────────────────────────────────────────
const checkPriceDrops = async (req, res) => {
    const { cartItems } = req.body;
    if (!cartItems || !cartItems.length) return res.json({ success: true, drops: [] });
    try {
        const drops = [];
        const queries = [...new Set(cartItems.map(i => i.searchQuery).filter(Boolean))];
        for (const q of queries) {
            const [a, m] = await Promise.all([scrapeAmazon(q), scrapeMyntra(q)]);
            const current = [...a, ...m];
            cartItems.filter(ci => ci.searchQuery === q).forEach(ci => {
                const match = current.find(p => p.name === ci.name);
                if (match) {
                    const now = parsePrice(match.price), was = parsePrice(ci.price);
                    if (now < was && was > 0) drops.push({ name: ci.name, oldPrice: ci.price, newPrice: match.price, saved: was - now, link: match.link, platform: match.platform });
                }
            });
        }
        return res.json({ success: true, drops });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};


// ── RECENT from DB (no scraping) ──────────────────────
const getRecentFromDB = (req, res) => {
    const raw = req.query.queries ? req.query.queries : "";
    const queries = raw.split(",").map(q => q.trim()).filter(Boolean);
    if (!queries.length) return res.json({ success: true, data: {} });

    const placeholders = queries.map(() => "?").join(",");
    db.query(
        `SELECT name, price, rating, image, link, platform, search_query,
                description, original_price, discount, review_count, badge
         FROM products
         WHERE search_query IN (${placeholders})
         ORDER BY created_at DESC LIMIT 120`,
        queries,
        (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            const grouped = {};
            rows.forEach(row => {
                const q = row.search_query;
                if (!grouped[q]) grouped[q] = [];
                if (grouped[q].length < 8) grouped[q].push({
                    name: row.name, price: row.price, rating: row.rating,
                    image: row.image, link: row.link, platform: row.platform,
                    description: row.description || "",
                    originalPrice: row.original_price || "",
                    discount: row.discount || "",
                    reviewCount: row.review_count || "",
                    badge: row.badge || ""
                });
            });
            return res.json({ success: true, data: grouped });
        }
    );
};

// ── AUTOCOMPLETE SUGGESTIONS ──────────────────────────
const getSuggestions = (req, res) => {
    const q = req.query.q ? req.query.q.toLowerCase().trim() : "";
    if (q.length < 1) return res.json({ success: true, suggestions: [] });

    db.query(
        `SELECT DISTINCT search_query as text, 'search' as type FROM products WHERE LOWER(search_query) LIKE ? LIMIT 5`,
        [`${q}%`],
        (err, qRows) => {
            db.query(
                `SELECT DISTINCT name as text, 'product' as type FROM products WHERE LOWER(name) LIKE ? LIMIT 5`,
                [`%${q}%`],
                (err2, nRows) => {
                    const seen = new Set();
                    const all = [...(qRows || []), ...(nRows || [])].filter(s => {
                        const k = s.text.toLowerCase();
                        if (seen.has(k)) return false;
                        seen.add(k); return true;
                    }).slice(0, 8);
                    return res.json({ success: true, suggestions: all });
                }
            );
        }
    );
};


module.exports = { searchProducts, getPriceHistory, getTrending, getPlatformStats, getRecommendations, checkPriceDrops, getRecentFromDB, getSuggestions };