// Utility functions for managing user-specific data in localStorage

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser")) || null;
  } catch { return null; }
};

// ── SEARCH HISTORY ──
export const getSearchHistory = () => {
  const user = getUser();
  if (!user) return [];
  try {
    return JSON.parse(localStorage.getItem(`history_${user.email}`)) || [];
  } catch { return []; }
};

export const addToSearchHistory = (query) => {
  const user = getUser();
  if (!user || !query.trim()) return;
  const key = `history_${user.email}`;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  // Remove duplicate, add to front
  history = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(history));
};

export const clearSearchHistory = () => {
  const user = getUser();
  if (!user) return;
  localStorage.removeItem(`history_${user.email}`);
};

// ── WISHLIST ──
export const getWishlist = () => {
  const user = getUser();
  if (!user) return [];
  try {
    return JSON.parse(localStorage.getItem(`wishlist_${user.email}`)) || [];
  } catch { return []; }
};

export const addToWishlist = (item) => {
  const user = getUser();
  if (!user) return false;
  const key = `wishlist_${user.email}`;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const exists = list.find(i => i.name === item.name && i.platform === item.platform);
  if (!exists) {
    list.unshift({ ...item, savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
  }
  return !exists;
};

export const removeFromWishlist = (itemName, platform) => {
  const user = getUser();
  if (!user) return;
  const key = `wishlist_${user.email}`;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  list = list.filter(i => !(i.name === itemName && i.platform === platform));
  localStorage.setItem(key, JSON.stringify(list));
};

export const isInWishlist = (itemName, platform) => {
  const list = getWishlist();
  return list.some(i => i.name === itemName && i.platform === platform);
};

// ── CART ──
export const getCart = () => {
  const user = getUser();
  if (!user) return [];
  try {
    return JSON.parse(localStorage.getItem(`cart_${user.email}`)) || [];
  } catch { return []; }
};

export const addToCart = (item, searchQuery) => {
  const user = getUser();
  if (!user) return false;
  const key = `cart_${user.email}`;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const exists = cart.find(i => i.name === item.name && i.platform === item.platform);
  if (!exists) {
    cart.unshift({
      ...item,
      searchQuery: searchQuery || "",
      addedAt: new Date().toISOString(),
      priceAtAdd: item.price
    });
    localStorage.setItem(key, JSON.stringify(cart));
  }
  return !exists;
};

export const removeFromCart = (itemName, platform) => {
  const user = getUser();
  if (!user) return;
  const key = `cart_${user.email}`;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  cart = cart.filter(i => !(i.name === itemName && i.platform === platform));
  localStorage.setItem(key, JSON.stringify(cart));
};

export const isInCart = (itemName, platform) => {
  const cart = getCart();
  return cart.some(i => i.name === itemName && i.platform === platform);
};

// ── PRICE DROP NOTIFICATIONS ──
export const getPriceDropNotifications = () => {
  const user = getUser();
  if (!user) return [];
  try {
    return JSON.parse(localStorage.getItem(`notifications_${user.email}`)) || [];
  } catch { return []; }
};

export const addPriceDropNotification = (drop) => {
  const user = getUser();
  if (!user) return;
  const key = `notifications_${user.email}`;
  let notes = [];
  try { notes = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  notes.unshift({ ...drop, id: Date.now(), read: false, at: new Date().toISOString() });
  notes = notes.slice(0, 50);
  localStorage.setItem(key, JSON.stringify(notes));
};

export const markNotificationsRead = () => {
  const user = getUser();
  if (!user) return;
  const key = `notifications_${user.email}`;
  let notes = [];
  try { notes = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  notes = notes.map(n => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(notes));
};