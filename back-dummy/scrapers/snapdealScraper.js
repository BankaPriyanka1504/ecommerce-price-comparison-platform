const puppeteer = require("puppeteer");

const scrapeSnapdeal = async (query) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(`https://www.snapdeal.com/search?keyword=${query}`, {
        waitUntil: "domcontentloaded"
    });

    await new Promise(resolve => setTimeout(resolve, 4000));

    const products = await page.evaluate(() => {
        let items = [];

        let cards = document.querySelectorAll(".product-tuple-listing");

        cards.forEach((card) => {
            let name = card.querySelector(".product-title")?.innerText;
            let price = card.querySelector(".product-price")?.innerText;
            let rating = card.querySelector(".filled-stars")?.getAttribute("style");

            if (
    name &&
    price &&
    name.toLowerCase().includes("iphone") &&
    !name.toLowerCase().includes("case") &&
    !name.toLowerCase().includes("cover") &&
    !name.toLowerCase().includes("charger") &&
    !name.toLowerCase().includes("cable") &&
    !name.toLowerCase().includes("stand") &&
    !name.toLowerCase().includes("tripod")
) {
                items.push({
                    name,
                    price,
                    rating: rating || "No rating"
                });
            }
        });

        return items.slice(0, 5);
    });

    await browser.close();

    return products;
};

module.exports = scrapeSnapdeal;