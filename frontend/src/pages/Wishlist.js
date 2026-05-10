import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist, addToCart, isInCart } from "../Utils/userStore";
import "../App.css";
import "./Wishlist.css";

function Wishlist() {
  const [items, setItems] = useState([]);
  const [cartState, setCartState] = useState({});

  const load = () => {
    const list = getWishlist();
    setItems(list);
    const cs = {};
    list.forEach(item => {
      cs[`${item.name}_${item.platform}`] = isInCart(item.name, item.platform);
    });
    setCartState(cs);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = (name, platform) => {
    removeFromWishlist(name, platform);
    window.dispatchEvent(new Event("wishlistChanged"));
    load();
  };

  const handleAddToCart = (item) => {
    const key = `${item.name}_${item.platform}`;
    addToCart(item, item.searchQuery || "");
    setCartState(prev => ({ ...prev, [key]: true }));
    window.dispatchEvent(new Event("cartChanged"));
  };

  return (
    <div className="wl-page">
      <div className="wl-header">
        <h1>♥ My Wishlist</h1>
        <p>{items.length} saved {items.length === 1 ? "item" : "items"}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <h3>Your wishlist is empty</h3>
          <p>Save items you love and track their prices</p>
          <Link to="/" className="wl-back-btn">Start Browsing →</Link>
        </div>
      ) : (
        <div className="wl-grid">
          {items.map((item, i) => {
            const key = `${item.name}_${item.platform}`;
            return (
              <div className="wl-card" key={i}>
                <button className="wl-remove-btn" onClick={() => handleRemove(item.name, item.platform)}>✕</button>

                <div className="wl-img-wrap" onClick={() => item.link && window.open(item.link, "_blank")}>
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="wl-info">
                  <div className={`wl-platform-tag ${item.platform}`}>{item.platform?.toUpperCase()}</div>
                  <h4>{item.name}</h4>
                  <p className="wl-price">{item.price}</p>
                  {item.rating && item.rating !== "N/A" && item.rating !== "No rating" && (
                    <div className="wl-rating">⭐ {item.rating}</div>
                  )}
                  {item.description && (
                    <p className="wl-desc">{item.description}</p>
                  )}
                  <div className="wl-actions">
                    <button
                      className={`wl-cart-btn ${cartState[key] ? "in-cart" : ""}`}
                      onClick={() => handleAddToCart(item)}
                      disabled={cartState[key]}
                    >
                      {cartState[key] ? "✓ In Cart" : "🛒 Add to Cart"}
                    </button>
                    <button
                      className="wl-view-btn"
                      onClick={() => item.link && window.open(item.link, "_blank")}
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;