const puppeteer = require("puppeteer");

const scrapeMyntra = async (query, minPrice = null, maxPrice = null) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--window-position=0,0",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
            "--disable-web-security"
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // ── Anti-detection ───────────────────────────────────────
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins",   { get: () => [1, 2, 3] });
        Object.defineProperty(navigator, "languages", { get: () => ["en-IN", "en"] });
    });

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
        "Accept-Language":         "en-IN,en;q=0.9",
        "Accept":                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding":         "gzip, deflate, br",
        "Connection":              "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest":          "document",
        "Sec-Fetch-Mode":          "navigate",
        "Sec-Fetch-Site":          "none",
    });

    // ── Build correct Myntra URL ──────────────────────────────
    // Myntra format: https://www.myntra.com/t-shirts
    // "shirts for men"  →  "shirts-for-men"
    // NEVER use encodeURIComponent — %20 breaks Myntra routing
    const slug = query
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

    let url = `https://www.myntra.com/${slug}`;
    if (minPrice || maxPrice) {
        url += `?f=Price%3A${minPrice || 0}%20TO%20${maxPrice || 999999}`;
    }

    console.log(`[Myntra] Navigating to: ${url}`);

    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
    } catch (e) {
        console.warn(`[Myntra] Navigation warning: ${e.message} — continuing...`);
    }

    // Wait for React hydration — try selector first, then fixed delay
    try {
        await page.waitForSelector(
            ".product-base, [class*='results-base'] li, [class*='product-productMetaInfo']",
            { timeout: 8000 }
        );
    } catch {
        await new Promise(r => setTimeout(r, 6000));
    }

    // Debug log — helps understand what page loaded
    const debug = await page.evaluate(() => ({
        title:      document.title,
        href:       window.location.href,
        pbCount:    document.querySelectorAll(".product-base").length,
        liCount:    document.querySelectorAll("[class*='results-base'] li").length,
        metaCount:  document.querySelectorAll("[class*='product-productMetaInfo']").length,
        bodySnip:   document.body?.innerText?.slice(0, 200),
    }));
    console.log("[Myntra] Debug info:", JSON.stringify(debug));

    const products = await page.evaluate(() => {
        let cards = [];

        // Try selectors in priority order
        cards = Array.from(document.querySelectorAll(".product-base"));

        if (!cards.length)
            cards = Array.from(document.querySelectorAll("[class*='results-base'] li"));

        if (!cards.length)
            cards = Array.from(document.querySelectorAll("[class*='product-productMetaInfo']"));

        if (!cards.length)
            cards = Array.from(document.querySelectorAll("li.product-base"));

        // Last resort — any <li> containing a price
        if (!cards.length) {
            cards = Array.from(document.querySelectorAll("main li, section li"))
                .filter(li => {
                    const t = li.innerText || "";
                    return t.includes("₹") || t.includes("Rs.") || /\d{3,}/.test(t);
                });
        }

        const items = [];

        cards.forEach(card => {
            // Brand
            const brand = (
                card.querySelector(".product-brand")?.innerText ||
                card.querySelector("[class*='product-brand']")?.innerText ||
                card.querySelector("[class*='productBrand']")?.innerText ||
                ""
            ).trim();

            // Product name
            const productName = (
                card.querySelector(".product-product")?.innerText ||
                card.querySelector("[class*='product-product']")?.innerText ||
                card.querySelector("[class*='productName']")?.innerText ||
                card.querySelector("h3")?.innerText ||
                card.querySelector("h4")?.innerText ||
                ""
            ).trim();

            const fullName = [brand, productName].filter(Boolean).join(" ");

            // Price
            let price = (
                card.querySelector(".product-discountedPrice")?.innerText ||
                card.querySelector("[class*='discountedPrice']")?.innerText ||
                card.querySelector("[class*='price-discounted']")?.innerText ||
                card.querySelector("[class*='Price']")?.innerText ||
                card.querySelector("strong")?.innerText ||
                ""
            ).trim().replace("Rs.", "₹").replace("MRP", "").trim();

            // Original price and discount
            const originalPrice = (
                card.querySelector(".product-strike")?.innerText ||
                card.querySelector("[class*='product-strike']")?.innerText ||
                card.querySelector("[class*='strikethrough']")?.innerText ||
                ""
            ).trim();

            const discount = (
                card.querySelector(".product-discountPercentage")?.innerText ||
                card.querySelector("[class*='discountPercentage']")?.innerText ||
                card.querySelector("[class*='Discount']")?.innerText ||
                ""
            ).trim();

            // Image
            const imgEl = card.querySelector("img");
            const image = (
                imgEl?.currentSrc ||
                imgEl?.src ||
                imgEl?.getAttribute("src") ||
                imgEl?.getAttribute("data-src") ||
                imgEl?.getAttribute("data-lazy-src") ||
                ""
            );

            // Link
            const linkEl = card.querySelector("a");
            let link = linkEl?.getAttribute("href") || "";
            if (link && !link.startsWith("http")) {
                link = "https://www.myntra.com/" + link.replace(/^\/+/, "");
            }

            // Description
            let description = "";
            if (originalPrice) description += `MRP: ${originalPrice}`;
            if (discount)       description += description ? ` | ${discount} off` : `${discount} off`;
            if (!description)   description = "Visit Myntra for full product details.";

            // Only push valid items
            const hasPrice = price && (price.includes("₹") || /\d{3,}/.test(price));
            const hasName  = fullName.length > 0;

            if (hasName && hasPrice) {
                items.push({
                    name: fullName,
                    price,
                    rating: "N/A",
                    reviewCount: "N/A",
                    image,
                    link,
                    description,
                    originalPrice,
                    discount,
                    badge: discount || "",
                    platform: "myntra"
                });
            }
        });

        return items.slice(0, 8);
    });

    await browser.close();

    if (products.length === 0) {
        console.warn(`[Myntra] ⚠️  0 products found for query: "${query}"`);
        console.warn(`[Myntra] ⚠️  URL used: ${url}`);
        console.warn(`[Myntra] ⚠️  Myntra may be showing a login prompt or has changed page structure.`);
    } else {
        console.log(`[Myntra] ✅ ${products.length} products found for "${query}"`);
    }

    return products;
};

module.exports = scrapeMyntra;