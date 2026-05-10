import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  addPriceDropNotification,
  getPriceDropNotifications
} from "../Utils/userStore";
import "../App.css";
import "./Cart.css";

function Cart() {
  const [items, setItems] = useState([]);
  const [checking, setChecking] = useState(false);
  const [drops, setDrops] = useState([]);
  const [lastChecked, setLastChecked] = useState(null);

  const load = () => setItems(getCart());

  useEffect(() => {
    load();
    // Auto check price drops on mount
    const cart = getCart();
    if (cart.length > 0) checkPriceDrops(cart);
  }, []);

  const handleRemove = (name, platform) => {
    removeFromCart(name, platform);
    window.dispatchEvent(new Event("cartChanged"));
    load();
  };

  const checkPriceDrops = async (cartItems) => {
    if (!cartItems || cartItems.length === 0) return;
    setChecking(true);
    setDrops([]);
    try {
      const res = await fetch("http://localhost:5000/api/check-price-drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems })
      });
      const result = await res.json();
      if (result.success && result.drops.length > 0) {
        setDrops(result.drops);
        result.drops.forEach(drop => addPriceDropNotification(drop));
        window.dispatchEvent(new Event("notificationsChanged"));
      } else {
        setDrops([]);
      }
      setLastChecked(new Date());
    } catch (err) {
      console.error("Price drop check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  const totalSavings = drops.reduce((sum, d) => sum + (d.saved || 0), 0);

  return (
    <div className="cart-page">
      <div className="cart-header">
        <div>
          <h1>🛒 My Cart</h1>
          <p>{items.length} {items.length === 1 ? "item" : "items"} saved for price tracking</p>
        </div>
        {items.length > 0 && (
          <button
            className="check-drops-btn"
            onClick={() => checkPriceDrops(items)}
            disabled={checking}
          >
            {checking ? "⏳ Checking..." : "🔔 Check Price Drops"}
          </button>
        )}
      </div>

      {/* PRICE DROP ALERT */}
      {drops.length > 0 && (
        <div className="drops-alert">
          <div className="drops-alert-header">
            🎉 Price drops found on {drops.length} {drops.length === 1 ? "item" : "items"}!
            {totalSavings > 0 && <span className="total-savings">Save ₹{totalSavings.toLocaleString()} total</span>}
          </div>
          {drops.map((drop, i) => (
            <div className="drop-item" key={i}>
              <div className="drop-name">{drop.name?.slice(0, 60)}{drop.name?.length > 60 ? "..." : ""}</div>
              <div className="drop-prices">
                <span className="drop-old">{drop.oldPrice}</span>
                <span className="drop-arrow">→</span>
                <span className="drop-new">{drop.newPrice}</span>
                <span className="drop-save">Save ₹{drop.saved?.toLocaleString()}</span>
              </div>
              <button className="drop-view-btn" onClick={() => drop.link && window.open(drop.link, "_blank")}>
                View Deal →
              </button>
            </div>
          ))}
        </div>
      )}

      {checking && (
        <div className="checking-banner">
          <div className="loading-spinner small" />
          Scraping current prices for your cart items...
        </div>
      )}

      {lastChecked && !checking && drops.length === 0 && (
        <div className="no-drops-banner">
          ✓ No price drops found. Checked at {lastChecked.toLocaleTimeString()}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add items to track price drops and get notified when prices fall</p>
          <Link to="/" className="wl-back-btn">Browse Products →</Link>
        </div>
      ) : (
        <div className="cart-grid">
          {items.map((item, i) => (
            <div className="cart-card" key={i}>
              <button className="cart-remove-btn" onClick={() => handleRemove(item.name, item.platform)}>✕</button>

              <div className="cart-img-wrap" onClick={() => item.link && window.open(item.link, "_blank")}>
                <img src={item.image} alt={item.name} />
              </div>

              <div className="cart-info">
                <div className={`wl-platform-tag ${item.platform}`}>{item.platform?.toUpperCase()}</div>
                <h4>{item.name}</h4>

                <div className="cart-price-row">
                  <span className="cart-price">{item.price}</span>
                  <span className="cart-price-label">when added</span>
                </div>

                {item.rating && item.rating !== "N/A" && item.rating !== "No rating" && (
                  <div className="wl-rating">⭐ {item.rating}</div>
                )}

                {item.description && (
                  <p className="wl-desc">{item.description}</p>
                )}

                <div className="cart-added">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </div>

                <div className="wl-actions" style={{ marginTop: "10px" }}>
                  <button
                    className="wl-view-btn"
                    style={{ flex: 1 }}
                    onClick={() => item.link && window.open(item.link, "_blank")}
                  >
                    View Product →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cart;