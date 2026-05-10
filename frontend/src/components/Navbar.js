import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getSearchHistory, clearSearchHistory,
  getCart, getWishlist,
  getPriceDropNotifications, markNotificationsRead
} from "../Utils/userStore";

const CATEGORIES = [
  { label: "👕 Fashion",       route: "/category/fashion" },
  { label: "📱 Electronics",   route: "/category/electronics" },
  { label: "👟 Footwear",      route: "/category/footwear" },
  { label: "🛍️ Accessories",   route: "/category/accessories" },
  { label: "🏠 Home & Living", route: "/category/home" },
  { label: "💄 Beauty",        route: "/category/beauty" },
];

export default function Navbar() {
  const [user, setUser]               = useState(null);
  const [query, setQuery]             = useState("");
  const [minPrice, setMinPrice]       = useState("");
  const [maxPrice, setMaxPrice]       = useState("");
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [history, setHistory]         = useState([]);
  const [cartCount, setCartCount]     = useState(0);
  const [wishCount, setWishCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]           = useState(0);

  const catTimer    = useRef(null);
  const suggestTimer= useRef(null);
  const searchRef   = useRef(null);
  const notifRef    = useRef(null);
  const navigate    = useNavigate();

  // ── Load & validate user ──────────────────────────
  const loadUser = () => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) { setUser(null); return; }
      const p = JSON.parse(raw);
      if (p && p.email && p.name) setUser(p);
      else { localStorage.removeItem("loggedInUser"); setUser(null); }
    } catch { localStorage.removeItem("loggedInUser"); setUser(null); }
  };

  const refreshCounts = () => {
    setCartCount(getCart().length);
    setWishCount(getWishlist().length);
    const n = getPriceDropNotifications();
    setNotifications(n);
    setUnread(n.filter(x => !x.read).length);
    setHistory(getSearchHistory());
  };

  useEffect(() => {
    loadUser(); refreshCounts();
    const evts = ["userChanged","cartChanged","wishlistChanged","notificationsChanged"];
    evts.forEach(e => {
      window.addEventListener(e, loadUser);
      window.addEventListener(e, refreshCounts);
    });
    return () => evts.forEach(e => {
      window.removeEventListener(e, loadUser);
      window.removeEventListener(e, refreshCounts);
    });
  }, []);

  // Close panels on outside click
  useEffect(() => {
    const fn = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowHistory(false);
        setShowSuggestions(false);
        setShowPriceFilter(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Autocomplete from DB ──────────────────────────
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    try {
      const res    = await fetch(`http://localhost:5000/api/suggestions?q=${encodeURIComponent(q.trim())}`);
      const result = await res.json();
      if (result.success && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
        setShowHistory(false);
      } else {
        setSuggestions([]); setShowSuggestions(false);
        if (history.length > 0) { setShowHistory(true); }
      }
    } catch { setSuggestions([]); }
  }, [history]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(suggestTimer.current);
    if (val.trim().length >= 1) {
      suggestTimer.current = setTimeout(() => fetchSuggestions(val), 200);
    } else {
      setSuggestions([]); setShowSuggestions(false);
      if (history.length > 0) setShowHistory(true);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length >= 1) fetchSuggestions(query);
    else if (history.length > 0) { setShowHistory(true); setShowSuggestions(false); }
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    setSuggestions([]); setShowSuggestions(false); setShowHistory(false);
    navigate(`/?q=${encodeURIComponent(text)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    let url = `/?q=${encodeURIComponent(query.trim())}`;
    if (minPrice) url += `&minPrice=${minPrice}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;
    navigate(url);
    setShowHistory(false); setShowSuggestions(false); setShowPriceFilter(false);
    setSuggestions([]);
  };

  const handleHistoryClick = (q) => {
    setQuery(q); navigate(`/?q=${encodeURIComponent(q)}`);
    setShowHistory(false); setShowSuggestions(false);
  };

  // Dropdown: delay close so mouse can enter menu
  const openCat  = () => { clearTimeout(catTimer.current); setShowCatDrop(true); };
  const closeCat = () => { catTimer.current = setTimeout(() => setShowCatDrop(false), 250); };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
    window.dispatchEvent(new Event("userChanged"));
    navigate("/");
  };

  const handleOpenNotifs = (e) => {
    e.stopPropagation();
    setShowNotifs(v => !v);
    markNotificationsRead(); setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "U";

  return (
    <nav className="navbar">

      {/* LEFT — LOGO */}
      <div className="nav-left">
        <Link to="/" className="logo">
          <div className="logo-mark">SC</div>
          Smart<em>Compare</em>
        </Link>
      </div>

      {/* CENTER — SEARCH (centered by CSS grid) */}
      <div className="nav-center" ref={searchRef}>
        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products, brands…"
            value={query}
            onChange={handleQueryChange}
            onFocus={handleInputFocus}
            autoComplete="off"
          />
          <button type="button" className="price-filter-btn"
            onClick={() => { setShowPriceFilter(v => !v); setShowHistory(false); setShowSuggestions(false); }}
            title="Price range">₹</button>
          <button type="submit" title="Search">⌕</button>
        </form>

        {/* Price filter */}
        {showPriceFilter && (
          <div className="price-filter-panel">
            <span className="price-filter-label">Price range</span>
            <input type="number" placeholder="Min ₹" value={minPrice}
              onChange={e => setMinPrice(e.target.value)} className="price-input" />
            <span className="price-sep">–</span>
            <input type="number" placeholder="Max ₹" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)} className="price-input" />
            <button className="price-clear-btn"
              onClick={() => { setMinPrice(""); setMaxPrice(""); setShowPriceFilter(false); }}>
              Clear
            </button>
          </div>
        )}

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions-panel">
            {suggestions.map((s, i) => (
              <div key={i} className="suggestion-item"
                onMouseDown={() => handleSuggestionClick(s.text)}>
                <span className={`suggestion-type ${s.type}`}>
                  {s.type === "product" ? "item" : "search"}
                </span>
                <span>{s.text.length > 55 ? s.text.slice(0, 55) + "…" : s.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* History (when no suggestions) */}
        {showHistory && !showSuggestions && history.length > 0 && (
          <div className="search-history-panel">
            <div className="history-header">
              <span>Recent searches</span>
              <button onMouseDown={() => { clearSearchHistory(); setHistory([]); setShowHistory(false); }}>
                Clear all
              </button>
            </div>
            {history.slice(0, 7).map((h, i) => (
              <div key={i} className="history-item"
                onMouseDown={() => handleHistoryClick(h)}>
                <span className="history-icon">↺</span><span>{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="nav-right">
        <Link to="/" className="nav-link">Home</Link>

        {/* Category dropdown — delayed close */}
        <div className="dropdown" onMouseEnter={openCat} onMouseLeave={closeCat}>
          <div className="dropdown-trigger">
            Browse <span className="dropdown-chevron">▾</span>
          </div>
          {showCatDrop && (
            <div className="dropdown-menu" onMouseEnter={openCat} onMouseLeave={closeCat}>
              {CATEGORIES.map((c, i) => (
                <div key={i} onClick={() => { navigate(c.route); setShowCatDrop(false); }}>
                  {c.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-divider" />

        {user ? (
          <>
            <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
              ♥{wishCount > 0 && <span className="nav-badge">{wishCount}</span>}
            </Link>
            <Link to="/cart" className="nav-icon-btn" title="Cart">
              🛒{cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </Link>
            <div className="nav-icon-btn notif-btn" ref={notifRef}
              onClick={handleOpenNotifs} title="Price alerts">
              🔔{unread > 0 && <span className="nav-badge notif-badge">{unread}</span>}
              {showNotifs && (
                <div className="notif-panel" onClick={e => e.stopPropagation()}>
                  <div className="notif-header">Price drop alerts</div>
                  {notifications.length === 0
                    ? <div className="notif-empty">No alerts yet. Cart items are monitored for price drops.</div>
                    : notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
                        <div className="notif-name">{n.name?.slice(0, 44)}…</div>
                        <div className="notif-prices">
                          <span className="notif-old">{n.oldPrice}</span>
                          <span className="notif-arrow">→</span>
                          <span className="notif-new">{n.newPrice}</span>
                          <span className="notif-save">−₹{n.saved?.toLocaleString()}</span>
                        </div>
                        <div className="notif-time">{n.platform?.toUpperCase()} · {new Date(n.at).toLocaleDateString("en-IN")}</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            <div className="nav-divider" />
            <div className="user-chip">
              <div className="user-avatar">{getInitial(user.name)}</div>
              {user.name}
            </div>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="login-btn">Sign in</Link>
        )}
      </div>
    </nav>
  );
}