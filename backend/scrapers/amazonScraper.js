const puppeteer = require("puppeteer");

const scrapeAmazon = async (query, minPrice = null, maxPrice = null) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-infobars",
            "--window-position=0,0",
            "--ignore-certifcate-errors",
            "--ignore-certifcate-errors-spki-list"
        ],
        defaultViewport: null
    });

    const page = await browser.newPage();
    const pages = await browser.pages();
    await pages[0].evaluate(() => window.blur());

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // Build URL with optional price filters
    let url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    if (minPrice) url += `&low-price=${minPrice}`;
    if (maxPrice) url += `&high-price=${maxPrice}`;

    await page.goto(url, { waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const products = await page.evaluate(() => {
        let items = [];
        let cards = document.querySelectorAll("div.s-main-slot div[data-component-type='s-search-result']");

        cards.forEach((card) => {
            let name = card.querySelector("h2 span")?.innerText;
            let priceWhole = card.querySelector(".a-price-whole")?.innerText;
            let rating = card.querySelector(".a-icon-alt")?.innerText;
            let image = card.querySelector("img")?.src;
            let reviewCount = card.querySelector(".a-size-base.s-underline-text")?.innerText || "0";
            let badge = card.querySelector(".a-badge-text")?.innerText || "";

            // Description / bullet points from listing
            let descriptionParts = [];
            card.querySelectorAll(".a-color-secondary.a-size-base").forEach(el => {
                const t = el.innerText.trim();
                if (t && t.length > 5) descriptionParts.push(t);
            });
            let description = descriptionParts.slice(0, 3).join(" | ") || "See product page for full details.";

            let link = "";
            let linkElement = card.querySelector("h2 a") || card.querySelector("a.a-link-normal.s-no-outline");
            if (linkElement) {
                let href = linkElement.getAttribute("href");
                if (href) {
                    let decoded = decodeURIComponent(href);
                    let match = decoded.match(/\/dp\/([A-Z0-9]+)/);
                    if (match && match[1]) {
                        link = "https://www.amazon.in/dp/" + match[1];
                    } else {
                        link = decoded.startsWith("http") ? decoded : "https://www.amazon.in" + decoded;
                    }
                }
            }

            if (name && priceWhole) {
                items.push({
                    name,
                    price: "₹" + priceWhole.replace(/,/g, ""),
                    rating: rating || "No rating",
                    reviewCount,
                    image,
                    link,
                    description,
                    badge,
                    platform: "amazon"
                });
            }
        });

        return items.slice(0, 8);
    });

    await browser.close();
    return products;
};

module.exports = scrapeAmazon;