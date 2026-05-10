const puppeteer = require("puppeteer");

const scrapeMyntra = async (query, minPrice = null, maxPrice = null) => {
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

    // Build URL with optional price filter
    let url = `https://www.myntra.com/${encodeURIComponent(query)}`;
    if (minPrice || maxPrice) {
        url += `?f=Price%3A${minPrice || 0}%20TO%20${maxPrice || 999999}`;
    }

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await new Promise(resolve => setTimeout(resolve, 5000));

    const products = await page.evaluate(() => {
        let items = [];
        let cards = document.querySelectorAll(".product-base");

        cards.forEach((card) => {
            let name = card.querySelector(".product-product")?.innerText;
            let price = card.querySelector(".product-discountedPrice")?.innerText;
            let brand = card.querySelector(".product-brand")?.innerText;
            let originalPrice = card.querySelector(".product-strike")?.innerText || "";
            let discount = card.querySelector(".product-discountPercentage")?.innerText || "";

            const imgTag = card.querySelector("img");
            let image = imgTag?.currentSrc || imgTag?.src || imgTag?.getAttribute("src") || imgTag?.getAttribute("data-src") || "";

            let link = card.querySelector("a")?.getAttribute("href");
            if (link) link = "https://www.myntra.com/" + link;

            // Build description from available info
            let description = "";
            if (originalPrice) description += `Original: ${originalPrice}`;
            if (discount) description += description ? ` | ${discount} off` : `${discount} off`;
            if (!description) description = "Visit Myntra for full product details.";

            if (name && price) {
                items.push({
                    name: brand + " " + name,
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
    return products;
};

module.exports = scrapeMyntra;