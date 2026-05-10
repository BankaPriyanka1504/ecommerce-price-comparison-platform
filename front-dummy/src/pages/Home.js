import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PriceChart from "../components/PriceChart";
import PriceHistoryModal from "../components/PriceHistoryModal";
import {
  addToSearchHistory, getSearchHistory,
  addToWishlist, removeFromWishlist, isInWishlist,
  addToCart, removeFromCart, isInCart
} from "../Utils/userStore";
import "../App.css";

const parseP = s => parseInt(String(s || "0").replace(/[^\d]/g, "")) || 0;
const parseR = r => {
  if (!r || r === "N/A" || r === "No rating") return 0;
  const m = String(r).match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const SORT_OPTIONS = [
  { key: "default",    label: "Default" },
  { key: "popular",    label: "⭐ Most Popular" },
  { key: "price_asc",  label: "₹ Low → High" },
  { key: "price_desc", label: "₹ High → Low" },
  { key: "rating",     label: "Top Rated" },
];

export default function Home() {
  const [data, setData]                 = useState(null);
  const [query, setQuery]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [sortBy, setSortBy]             = useState("default");
  const [wishState, setWishState]       = useState({});
  const [cartState, setCartState]       = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});
  const [historyModal, setHistoryModal] = useState(null);
  // Landing — products from DB grouped by query
  const [recentGroups, setRecentGroups] = useState({});
  const [recLoading, setRecLoading]     = useState(false);

  const location = useLocation();

  // ── Search (scrape via backend) ───────────────────
  const doSearch = async (q, minP = null, maxP = null) => {
    if (!q?.trim()) return;
    setLoading(true); setData(null); setSortBy("default");
    try {
      let url = `http://localhost:5000/api/search?q=${encodeURIComponent(q.trim())}`;
      if (minP) url += `&minPrice=${minP}`;
      if (maxP) url += `&maxPrice=${maxP}`;
      const r   = await fetch(url);
      const res = await r.json();
      if (res.success) {
        setData(res.data);
        addToSearchHistory(q.trim());
        window.dispatchEvent(new Event("userChanged"));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Recent products from DB — NO scraping ─────────
  const fetchRecentFromDB = async () => {
    const history = getSearchHistory();
    if (!history.length) return;
    setRecLoading(true);
    const queries = [...new Set(history)].slice(0, 4).join(",");
    try {
      const res    = await fetch(`http://localhost:5000/api/recent?queries=${encodeURIComponent(queries)}`);
      const result = await res.json();
      if (result.success) setRecentGroups(result.data);
    } catch (e) { console.error(e); }
    finally { setRecLoading(false); }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      doSearch(q, params.get("minPrice"), params.get("maxPrice"));
    } else {
      setData(null); setQuery(""); setRecentGroups({});
      fetchRecentFromDB();
    }
  }, [location.search]); // eslint-disable-line

  // Sync wishlist/cart badges
  useEffect(() => {
    const landing = Object.values(recentGroups).flat();
    const all = [...(data?.amazon || []), ...(data?.myntra || []), ...landing];
    if (!all.length) return;
    const ws = {}, cs = {};
    all.forEach(item => {
      const k = `${item.name}_${item.platform}`;
      ws[k] = isInWishlist(item.name, item.platform);
      cs[k] = isInCart(item.name, item.platform);
    });
    setWishState(ws); setCartState(cs);
  }, [data, recentGroups]);

  const doWishlist = (item) => {
    const k = `${item.name}_${item.platform}`;
    if (wishState[k]) { removeFromWishlist(item.name, item.platform); setWishState(p => ({ ...p, [k]: false })); }
    else { addToWishlist(item); setWishState(p => ({ ...p, [k]: true })); }
    window.dispatchEvent(new Event("wishlistChanged"));
  };

  const doCart = (item, sq = "") => {
    const k = `${item.name}_${item.platform}`;
    const params = new URLSearchParams(location.search);
    const searchQ = sq || item._sq || params.get("q") || query;
    if (cartState[k]) { removeFromCart(item.name, item.platform); setCartState(p => ({ ...p, [k]: false })); }
    else { addToCart(item, searchQ); setCartState(p => ({ ...p, [k]: true })); }
    window.dispatchEvent(new Event("cartChanged"));
  };

  // ── Sort ─────────────────────────────────────────
  const sortItems = (items) => {
    if (!items?.length) return [];
    if (sortBy === "price_asc")  return [...items].sort((a, b) => parseP(a.price) - parseP(b.price));
    if (sortBy === "price_desc") return [...items].sort((a, b) => parseP(b.price) - parseP(a.price));
    if (sortBy === "rating")     return [...items].sort((a, b) => parseR(b.rating) - parseR(a.rating));
    if (sortBy === "popular") {
      return [...items].sort((a, b) => {
        const sc = item => parseR(item.rating) * 20 + (item.reviewCount && item.reviewCount !== "N/A" ? 10 : 0);
        return sc(b) - sc(a);
      });
    }
    return items;
  };

  // ── Card ─────────────────────────────────────────
  const renderCard = (item, i, isBest = false, sq = "") => {
    const k   = `${item.name}_${item.platform}`;
    const inW = wishState[k] || isInWishlist(item.name, item.platform);
    const inC = cartState[k] || isInCart(item.name, item.platform);
    const exp = expandedDesc[k];

    return (
      <div className={`card ${isBest ? "best" : ""}`} key={k + i}
        style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>

        <div className="card-action-row">
          <button className={`action-icon-btn wishlist-btn ${inW ? "active" : ""}`}
            onClick={() => doWishlist(item)} title={inW ? "Remove from wishlist" : "Add to wishlist"}>
            {inW ? "♥" : "♡"}
          </button>
          <button className={`action-icon-btn cart-btn ${inC ? "active" : ""}`}
            onClick={() => doCart(item, sq)} title={inC ? "In cart" : "Add to cart"}>
            {inC ? "✓ Cart" : "+ Cart"}
          </button>
        </div>

        <div className="card-body">
          <div className="product-img-wrap">
            <img src={item.image} alt={item.name} className="product-img"
              onError={e => { e.target.src = "https://placehold.co/200x200/181818/666?text=No+Image"; }} />
          </div>
          {item.badge && <div className="product-badge">{item.badge}</div>}
          <h4>{item.name}</h4>
          <p className="price">{item.price}</p>
          {item.originalPrice && item.originalPrice !== item.price && (
            <p className="original-price">{item.originalPrice}</p>
          )}
          {item.discount && <span className="discount-tag">{item.discount}</span>}
          {item.rating && item.rating !== "N/A" && item.rating !== "No rating" && (
            <div className="card-rating">
              ⭐ {item.rating}
              {item.reviewCount && item.reviewCount !== "N/A" && (
                <span className="review-count"> ({item.reviewCount})</span>
              )}
            </div>
          )}
          {/* Description — clearly visible */}
          {item.description && (
            <div className="product-desc">
              <p className={`desc-text ${exp ? "expanded" : ""}`}>{item.description}</p>
              {item.description.length > 80 && (
                <button className="desc-toggle"
                  onClick={() => setExpandedDesc(p => ({ ...p, [k]: !p[k] }))}>
                  {exp ? "Show less ▲" : "Show more ▼"}
                </button>
              )}
            </div>
          )}
          {/* Price history — styled amber button, always visible */}
          <button className="history-link-btn"
            onClick={() => setHistoryModal({ name: item.name, platform: item.platform })}>
            📈 Price history
          </button>
        </div>

        <button className="buy"
          onClick={() => item.link ? window.open(item.link, "_blank") : null}>
          View on {(item.platform || "").charAt(0).toUpperCase() + (item.platform || "").slice(1)} →
        </button>
      </div>
    );
  };

  // Best deal
  let bestPrice = null;
  if (data) {
    const all = [...(data.amazon || []), ...(data.myntra || [])];
    if (all.length) bestPrice = all.reduce((min, item) =>
      parseP(item.price) < parseP(min.price) ? item : min, all[0]);
  }

  const hasRecent = Object.keys(recentGroups).length > 0;

  return (
    <div className="home">

      {/* HERO */}
      <div className="hero-banner">
        <div className="hero-eyebrow">
          <span className="dot" /> Live price comparison
        </div>
        <h1>Compare prices.<br /><em>Shop smarter.</em></h1>
        <p>Real-time prices scraped from Amazon &amp; Myntra, ranked and compared for you.</p>
        <div className="hero-platforms">
          <div className="platform-chip amazon"><span className="dot" />Amazon</div>
          <div className="platform-chip myntra"><span className="dot" />Myntra</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Scraping live prices…</p>
        </div>
      )}

      {/* ── SEARCH RESULTS ── */}
      {data && !loading && (
        <>
          {/* BEST DEAL */}
          {bestPrice && (
            <div className="best-deal">
              <div className="section-label"><h2>Best deal found</h2></div>
              <div className="best-card">
                <span className="best-deal-tag">LOWEST PRICE</span>
                <div className="best-img-wrap" onClick={() => bestPrice.link && window.open(bestPrice.link, "_blank")}>
                  <img src={bestPrice.image} alt="best" className="best-img"
                    onError={e => { e.target.src = "https://placehold.co/200x200/181818/666?text=No+Image"; }} />
                </div>
                <div className="best-info">
                  <div className="best-platform-tag">{bestPrice.platform?.toUpperCase()}</div>
                  <h3>{bestPrice.name}</h3>
                  <div className="best-price">{bestPrice.price}</div>
                  {bestPrice.originalPrice && bestPrice.originalPrice !== bestPrice.price && (
                    <p className="original-price">{bestPrice.originalPrice}</p>
                  )}
                  {bestPrice.rating && bestPrice.rating !== "N/A" && bestPrice.rating !== "No rating" && (
                    <div className="best-rating">⭐ {bestPrice.rating}</div>
                  )}
                  {bestPrice.description && <p className="best-description">{bestPrice.description}</p>}
                  <div className="best-actions">
                    <button className={`action-icon-btn wishlist-btn ${isInWishlist(bestPrice.name, bestPrice.platform) ? "active" : ""}`}
                      onClick={() => doWishlist(bestPrice)}>♥ Wishlist</button>
                    <button className={`action-icon-btn cart-btn ${isInCart(bestPrice.name, bestPrice.platform) ? "active" : ""}`}
                      onClick={() => doCart(bestPrice)}>
                      🛒 {isInCart(bestPrice.name, bestPrice.platform) ? "In cart" : "Add to cart"}
                    </button>
                    <button className="history-link-btn"
                      onClick={() => setHistoryModal({ name: bestPrice.name, platform: bestPrice.platform })}>
                      📈 Price history
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SORT BAR */}
          <div className="sort-bar">
            <span className="sort-label">Sort by</span>
            {SORT_OPTIONS.map(s => (
              <button key={s.key}
                className={`sort-btn ${sortBy === s.key ? "active" : ""}`}
                onClick={() => setSortBy(s.key)}>{s.label}</button>
            ))}
          </div>

          {/* PRODUCT GRIDS */}
          <div className="products">
            {["amazon", "myntra"].map(platform => {
              const items = sortItems(data[platform] || []);
              if (!items.length) return null;
              return (
                <div className="platform-section" key={platform}>
                  <div className="platform-header">
                    <div className={`platform-badge ${platform}`}>{platform.toUpperCase()}</div>
                    <div className="platform-divider" />
                    <span className="platform-count">{items.length} results</span>
                  </div>
                  <div className="grid">
                    {items.map((item, i) => renderCard(item, i, item.name === bestPrice?.name, query))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DASHBOARD — always shows after search */}
          <PriceChart data={data} />
        </>
      )}

      {/* ── LANDING — DB products, no scraping ── */}
      {!data && !loading && (
        <>
          {recLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading recent products from database…</p>
            </div>
          )}

          {!recLoading && hasRecent && (
            <div className="products" style={{ paddingTop: 30 }}>
              {Object.entries(recentGroups).map(([q, items]) => (
                <div className="platform-section" key={q}>
                  <div className="section-label" style={{ marginBottom: 0, flex: 1 }}>
                    <h2>Recently viewed · {q}</h2>
                  </div>
                  <div style={{ height: 18 }} />
                  <div className="grid">
                    {items.map((item, i) => renderCard(item, i, false, q))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!recLoading && !hasRecent && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Start comparing</h3>
              <p>Search for any product to compare prices across Amazon &amp; Myntra</p>
            </div>
          )}
        </>
      )}

      {/* Price History Modal */}
      {historyModal && (
        <PriceHistoryModal
          name={historyModal.name}
          platform={historyModal.platform}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}