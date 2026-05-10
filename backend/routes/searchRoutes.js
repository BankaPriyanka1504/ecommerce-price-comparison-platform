const express = require("express");
const router  = express.Router();
const {
    searchProducts, getPriceHistory,
    getTrending, getPlatformStats,
    getRecommendations, checkPriceDrops,
    getRecentFromDB, getSuggestions
} = require("../controllers/searchController");

router.get("/search",               searchProducts);
router.get("/price-history",        getPriceHistory);
router.get("/trending",             getTrending);
router.get("/platform-stats",       getPlatformStats);
router.get("/recent",               getRecentFromDB);
router.get("/suggestions",          getSuggestions);
router.post("/recommendations",     getRecommendations);
router.post("/check-price-drops",   checkPriceDrops);

module.exports = router;