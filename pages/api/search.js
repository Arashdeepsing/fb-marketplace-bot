// pages/api/search.js
import { chromium } from "playwright";

let context = null;
async function getContext() {
  if (!context) {
    const browser = await chromium.launch();
    context = await browser.newContext({ storageState: "auth.json" });
  }
  return context;
}

export default async function handler(req, res) {
  const {
    query = "",
    minPrice = "0",
    maxPrice = "999999",
    minYear = "1900",
    maxYear = String(new Date().getFullYear()),
    keywords = "",
    exclude = "",
    sortBy = "creation_time_descend",
    radius = "50",
    scrollCount = "10",
  } = req.query;

  try {
    const ctx = await getContext();
    const page = await ctx.newPage();

    // Navigate to Marketplace with query params
    const base = "https://www.facebook.com/marketplace/search/";
    const params = new URLSearchParams({
      query,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      sortBy,
      radius,
    });
    await page.goto(`${base}?${params.toString()}`);
    await page.waitForTimeout(6000);

    // Scroll to load more results
    const loops = Math.min(100, Math.max(1, parseInt(scrollCount, 10)));
    for (let i = 0; i < loops; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(1200);
    }

    const anchors = await page.$$eval('a[href*="/marketplace/item"]', (els) =>
      els.map((el) => ({
        href: el.getAttribute("href"),
        text: el.innerText,
        img: el.querySelector("img")?.src || "",
      }))
    );

    await page.close();

    // Post-scrape filtering
    const mustInclude = keywords
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const mustExclude = exclude
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const seen = new Set();
    const results = [];

    for (const a of anchors) {
      if (!a.href || seen.has(a.href)) continue;
      seen.add(a.href);

      const text = a.text.toLowerCase();
      if (mustExclude.some((term) => text.includes(term))) continue;
      if (
        mustInclude.length &&
        !mustInclude.some((term) => text.includes(term))
      )
        continue;

      const priceMatch = text.match(/\$[\d,]+/);
      const price = priceMatch
        ? parseInt(priceMatch[0].replace(/[$,]/g, ""), 10)
        : 0;
      if (price < parseInt(minPrice, 10) || price > parseInt(maxPrice, 10))
        continue;

      const yearMatch = text.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
      if (
        year &&
        (year < parseInt(minYear, 10) || year > parseInt(maxYear, 10))
      )
        continue;

      results.push({
        title: a.text.split("\n")[0],
        price,
        year,
        link: "https://www.facebook.com" + a.href.split("?")[0],
        image: a.img,
        description: a.text,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Search error:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
}
