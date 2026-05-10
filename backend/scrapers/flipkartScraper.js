const puppeteer = require("puppeteer");

const scrapeFlipkart = async (query) => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(`https://www.flipkart.com/search?q=${query}`, {
        waitUntil: "networkidle2"
    });

    // Wait extra (VERY IMPORTANT)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Close login popup
    try {
        await page.click("button._2KpZ6l._2doB4z");
    } catch (err) {}

    // Wait again after popup close
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 🔥 NEW APPROACH: directly grab visible product cards
    const products = await page.evaluate(() => {
        let items = [];

        let cards = document.querySelectorAll("div[data-id]");

        cards.forEach((card) => {
            let name = card.querySelector("a")?.innerText;
            let price = card.querySelector("div._30jeq3")?.innerText;
            let rating = card.querySelector("div._3LWZlK")?.innerText;

            if (name && price) {
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

module.exports = scrapeFlipkart;