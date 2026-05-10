import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PriceChart from "../components/PriceChart";
import PriceHistoryModal from "../components/PriceHistoryModal";
import {
  addToWishlist, removeFromWishlist, isInWishlist,
  addToCart, removeFromCart, isInCart,
  addToSearchHistory
} from "../Utils/userStore";
import "../App.css";
import "./Category.css";

const CATEGORY_CONFIG = {
  fashion: {
    label: "👕 Fashion",
    description: "Trending clothing, shirts, dresses & more",
    queries: [
      { label: "Shirts",   q: "shirts for men" },
      { label: "T-Shirts", q: "t-shirts" },
      { label: "Dresses",  q: "women dresses" },
      { label: "Jeans",    q: "jeans" },
      { label: "Kurta",    q: "kurta" },
      { label: "Saree",    q: "saree" },
      { label: "Jackets",  q: "jackets" },
      { label: "Hoodies",  q: "hoodies" },
    ]
  },
  electronics: {
    label: "📱 Electronics",
    description: "Mobiles, laptops, gadgets & accessories",
    queries: [
      { label: "Smartphones",  q: "smartphone" },
      { label: "Laptops",      q: "laptop" },
      { label: "Earphones",    q: "earphones" },
      { label: "Smartwatch",   q: "smartwatch" },
      { label: "Tablets",      q: "tablet" },
      { label: "Cameras",      q: "digital camera" },
      { label: "BT Speakers",  q: "bluetooth speaker" },
    ]
  },
  footwear: {
    label: "👟 Footwear",
    description: "Shoes, sneakers, sandals & more",
    queries: [
      { label: "Sneakers",     q: "sneakers" },
      { label: "Sports Shoes", q: "sports shoes" },
      { label: "Sandals",      q: "sandals" },
      { label: "Formal Shoes", q: "formal shoes" },
      { label: "Boots",        q: "boots" },
      { label: "Loafers",      q: "loafers" },
      { label: "Heels",        q: "heels" },
    ]
  },
  accessories: {
    label: "🛍️ Accessories",
    description: "Bags, wallets, belts & more",
    queries: [
      { label: "Handbags",   q: "handbag" },
      { label: "Backpacks",  q: "backpack" },
      { label: "Wallets",    q: "wallet" },
      { label: "Sunglasses", q: "sunglasses" },
      { label: "Watches",    q: "watch" },
      { label: "Belts",      q: "leather belt" },
    ]
  },
  home: {
    label: "🏠 Home & Living",
    description: "Furniture, décor, kitchen & more",
    queries: [
      { label: "Bedsheets",  q: "bedsheet" },
      { label: "Cushions",   q: "cushion covers" },
      { label: "Lamps",      q: "table lamp" },
      { label: "Curtains",   q: "curtains" },
      { label: "Wall Decor", q: "wall decor" },
      { label: "Kitchen",    q: "kitchen organizer" },
    ]
  },
  beauty: {
    label: "💄 Beauty",
    description: "Skincare, makeup, haircare & more",
    queries: [
      { label: "Moisturizer", q: "moisturizer" },
      { label: "Lipstick",    q: "lipstick" },
      { label: "Face Wash",   q: "face wash" },
      { label: "Shampoo",     q: "shampoo" },
      { label: "Perfume",     q: "perfume" },
      { label: "Serum",       q: "face serum" },
    ]
  }
};

const parseP = s => parseInt(String(s || "0").replace(/[^\d]/g, "")) || 0;
const parseR = r => {
  if (!r || r === "N/A" || r === "No rating") return 0;
  const m = String(r).match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const SORT_OPTIONS = [
  { key: "default",    label: "Default" },
  { key: "popular",    label: "⭐ Popular" },
  { key: "price_asc",  label: "₹ Low → High" },
  { key: "price_desc", label: "₹ High → Low" },
  { key: "rating",     label: "Top Rated" },
];

export default function Category() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const config     = CATEGORY_CONFIG[slug];

  const [activeTab, setActiveTab]         = useState(null);
  const [data, setData]                   = useState(null);
  const [filteredData, setFilteredData]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [wishState, setWishState]         = useState({});
  const [cartState, setCartState]         = useState({});
  const [expandedDesc, setExpandedDesc]   = useState({});
  const [historyModal, setHistoryModal]   = useState(null);

  // Filters
  const [minPrice, setMinPrice]           = useState("");
  const [maxPrice, setMaxPrice]           = useState("");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [sortBy, setSortBy]               = useState("default");

  // Reset when category slug changes
  useEffect(() => {
    setActiveTab(null); setData(null); setFilteredData(null);
    setError(""); setMinPrice(""); setMaxPrice(""); setSortBy("default");
  }, [slug]);

  // Only fetch when user clicks a tab
  useEffect(() => {
    if (activeTab === null) return;
    fetchProducts(config.queries[activeTab].q);
  }, [activeTab]); // eslint-disable-line

  // Re-apply filter whenever data/price/sort changes
  useEffect(() => {
    if (!data) return;
    applyFilter(data);
  }, [data, minPrice, maxPrice, sortBy]); // eslint-disable-line

  const applyFilter = (rawData) => {
    const min = minPrice ? parseInt(minPrice) : null;
    const max = maxPrice ? parseInt(maxPrice) : null;

    const process = (items) => {
      let r = [...items];
      if (min) r = r.filter(i => parseP(i.price) >= min);
      if (max) r = r.filter(i => parseP(i.price) <= max);
      if (sortBy === "price_asc")  r.sort((a,b) => parseP(a.price) - parseP(b.price));
      if (sortBy === "price_desc") r.sort((a,b) => parseP(b.price) - parseP(a.price));
      if (sortBy === "rating")     r.sort((a,b) => parseR(b.rating) - parseR(a.rating));
      if (sortBy === "popular") {
        r.sort((a,b) => {
          const sc = x => parseR(x.rating) * 20 + (x.reviewCount && x.reviewCount !== "N/A" ? 10 : 0);
          return sc(b) - sc(a);
        });
      }
      return r;
    };
    setFilteredData({ amazon: process(rawData.amazon || []), myntra: process(rawData.myntra || []) });
  };

  const fetchProducts = async (q) => {
    setLoading(true); setData(null); setFilteredData(null); setError("");
    try {
      const res    = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(q)}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Search failed");
      setData(result.data);
      addToSearchHistory(q);
      const all = [...(result.data?.amazon || []), ...(result.data?.myntra || [])];
      const ws = {}, cs = {};
      all.forEach(item => {
        const k = `${item.name}_${item.platform}`;
        ws[k] = isInWishlist(item.name, item.platform);
        cs[k] = isInCart(item.name, item.platform);
      });
      setWishState(ws); setCartState(cs);
    } catch (e) {
      setError(e.message || "Failed to fetch. Is your backend running?");
    } finally { setLoading(false); }
  };

  const doWishlist = (item) => {
    const k = `${item.name}_${item.platform}`;
    if (wishState[k]) { removeFromWishlist(item.name, item.platform); setWishState(p => ({...p, [k]:false})); }
    else { addToWishlist(item); setWishState(p => ({...p, [k]:true})); }
    window.dispatchEvent(new Event("wishlistChanged"));
  };

  const doCart = (item) => {
    const k = `${item.name}_${item.platform}`;
    const q = activeTab !== null ? config.queries[activeTab].q : "";
    if (cartState[k]) { removeFromCart(item.name, item.platform); setCartState(p => ({...p, [k]:false})); }
    else { addToCart(item, q); setCartState(p => ({...p, [k]:true})); }
    window.dispatchEvent(new Event("cartChanged"));
  };

  const clearFilter = () => { setMinPrice(""); setMaxPrice(""); setSortBy("default"); };
  const hasFilter = minPrice || maxPrice || sortBy !== "default";

  const displayData = filteredData || data;
  const hasProducts = displayData && (displayData.amazon?.length > 0 || displayData.myntra?.length > 0);
  const totalCount  = (displayData?.amazon?.length || 0) + (displayData?.myntra?.length || 0);

  // Best deal from displayed data
  let bestPrice = null;
  if (hasProducts) {
    const all = [...(displayData.amazon || []), ...(displayData.myntra || [])];
    if (all.length) bestPrice = all.reduce((min, item) =>
      parseP(item.price) < parseP(min.price) ? item : min, all[0]);
  }

  const renderCard = (item, i, isBest = false) => {
    const k   = `${item.name}_${item.platform}`;
    const inW = wishState[k];
    const inC = cartState[k];
    const exp = expandedDesc[k];
    return (
      <div className={`card ${isBest ? "best" : ""}`} key={k + i}
        style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
        <div className="card-action-row">
          <button className={`action-icon-btn wishlist-btn ${inW ? "active" : ""}`}
            onClick={() => doWishlist(item)}>{inW ? "♥" : "♡"}</button>
          <button className={`action-icon-btn cart-btn ${inC ? "active" : ""}`}
            onClick={() => doCart(item)}>{inC ? "✓ Cart" : "+ Cart"}</button>
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
          {item.description && (
            <div className="product-desc">
              <p className={`desc-text ${exp ? "expanded" : ""}`}>{item.description}</p>
              {item.description.length > 80 && (
                <button className="desc-toggle"
                  onClick={() => setExpandedDesc(p => ({...p, [k]: !p[k]}))}>
                  {exp ? "Show less ▲" : "Show more ▼"}
                </button>
              )}
            </div>
          )}
          <button className="history-link-btn"
            onClick={() => setHistoryModal({ name: item.name, platform: item.platform })}>
            📈 Price history
          </button>
        </div>
        <button className="buy" onClick={() => item.link && window.open(item.link, "_blank")}>
          View on {item.platform?.charAt(0).toUpperCase() + item.platform?.slice(1)} →
        </button>
      </div>
    );
  };

  if (!config) {
    return (
      <div className="cat-page">
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <h3>Category not found</h3>
          <button className="wl-back-btn" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cat-page">
      {/* HEADER */}
      <div className="cat-header">
        <h1>{config.label}</h1>
        <p>{config.description}</p>
      </div>

      {/* TABS + FILTER CONTROLS */}
      <div className="cat-tabs-bar">
        <div className="cat-tabs">
          {config.queries.map((item, i) => (
            <button key={i}
              className={`cat-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}>
              {item.label}
            </button>
          ))}
        </div>

        {activeTab !== null && (
          <div className="cat-filter-controls">
            <button className={`cat-filter-btn ${showPriceFilter ? "active" : ""}`}
              onClick={() => setShowPriceFilter(v => !v)}>
              ₹ Filter {hasFilter ? "•" : ""}
            </button>
            <select className="cat-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            {hasFilter && <button className="cat-clear-btn" onClick={clearFilter}>✕ Clear</button>}
          </div>
        )}
      </div>

      {/* PRICE FILTER PANEL */}
      {showPriceFilter && activeTab !== null && (
        <div className="cat-price-panel">
          <span className="cat-price-label">Filter by price (₹)</span>
          <input type="number" placeholder="Min" value={minPrice}
            onChange={e => setMinPrice(e.target.value)} className="cat-price-input" />
          <span className="cat-price-sep">to</span>
          <input type="number" placeholder="Max" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)} className="cat-price-input" />
          {totalCount > 0 && (
            <span className="cat-result-count">{totalCount} result{totalCount !== 1 ? "s" : ""}{hasFilter ? " (filtered)" : ""}</span>
          )}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Fetching {activeTab !== null ? config.queries[activeTab].label : ""} from Amazon & Myntra…</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="cat-error">
          <span>⚠️ {error}</span>
          <button onClick={() => activeTab !== null && fetchProducts(config.queries[activeTab].q)}>Retry</button>
        </div>
      )}

      {/* PROMPT */}
      {!loading && !data && !error && activeTab === null && (
        <div className="cat-prompt">
          <div className="cat-prompt-icon">{config.label.split(" ")[0]}</div>
          <h3>Choose a subcategory above</h3>
          <p>Click any tab to compare prices from Amazon & Myntra</p>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && data && !hasProducts && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>{hasFilter ? "No results match your filter" : "No products found"}</h3>
          <p>{hasFilter ? "Try adjusting your price range or sort" : "Try another subcategory"}</p>
          {hasFilter && (
            <button className="wl-back-btn" style={{ marginTop: 16 }} onClick={clearFilter}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {!loading && hasProducts && (
        <>
          {/* BEST DEAL in category */}
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
                  {bestPrice.rating && bestPrice.rating !== "N/A" && bestPrice.rating !== "No rating" && (
                    <div className="best-rating">⭐ {bestPrice.rating}</div>
                  )}
                  {bestPrice.description && <p className="best-description">{bestPrice.description}</p>}
                  <div className="best-actions">
                    <button className={`action-icon-btn wishlist-btn ${wishState[`${bestPrice.name}_${bestPrice.platform}`] ? "active" : ""}`}
                      onClick={() => doWishlist(bestPrice)}>♥ Wishlist</button>
                    <button className={`action-icon-btn cart-btn ${cartState[`${bestPrice.name}_${bestPrice.platform}`] ? "active" : ""}`}
                      onClick={() => doCart(bestPrice)}>
                      🛒 {cartState[`${bestPrice.name}_${bestPrice.platform}`] ? "In cart" : "Add to cart"}
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

          {/* PRODUCT GRIDS */}
          <div className="products" style={{ paddingTop: 14 }}>
            {["amazon", "myntra"].map(platform =>
              displayData[platform]?.length > 0 && (
                <div className="platform-section" key={platform}>
                  <div className="platform-header">
                    <div className={`platform-badge ${platform}`}>{platform.toUpperCase()}</div>
                    <div className="platform-divider" />
                    <span className="platform-count">{displayData[platform].length} results</span>
                  </div>
                  <div className="grid">
                    {displayData[platform].map((item, i) =>
                      renderCard(item, i, item.name === bestPrice?.name)
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* DASHBOARD — shows after every category search */}
          <PriceChart data={data} />
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