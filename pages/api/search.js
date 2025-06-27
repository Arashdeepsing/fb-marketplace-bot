// import { chromium } from "playwright";

// let context = null;
// async function getContext() {
//   if (!context) {
//     const browser = await chromium.launch();
//     context = await browser.newContext({ storageState: "auth.json" });
//   }
//   return context;
// }

// export default async function handler(req, res) {
//   const {
//     query = "",
//     minPrice = "0",
//     maxPrice = "999999",
//     minYear = "1900",
//     maxYear = String(new Date().getFullYear()),
//     keywords = "",
//     exclude = "",
//     sortBy = "creation_time_descend",
//     radius = "50",
//     scrollCount = "10",
//   } = req.query;

//   const ctx = await getContext();
//   const page = await ctx.newPage();

//   // Step 1: Go to Marketplace
//   await page.goto("https://www.facebook.com/marketplace");
//   await page.waitForTimeout(3000);

//   // Step 2: Open Location Filter (location already stored in auth.json)
//   try {
//     await page.click('button[aria-label="Location"]', { timeout: 5000 });
//     await page.waitForSelector('div[role="dialog"]', { timeout: 3000 });
//     await page.keyboard.press("Escape"); // Close it again
//   } catch (e) {
//     console.warn("Location selector not found or skipped");
//   }

//   // Step 3: Apply filters by URL
//   const params = new URLSearchParams({
//     query,
//     minPrice,
//     maxPrice,
//     minYear,
//     maxYear,
//     sortBy,
//     radius,
//   });

//   await page.goto(
//     `https://www.facebook.com/marketplace/search/?${params.toString()}`
//   );
//   await page.waitForTimeout(5000);

//   // Step 4: Scroll to load listings
//   const loops = Math.min(100, Math.max(1, parseInt(scrollCount, 10)));
//   for (let i = 0; i < loops; i++) {
//     await page.mouse.wheel(0, 2500);
//     await page.waitForTimeout(1200);
//   }

//   // Step 5: Scrape anchor tags
//   const anchors = await page.$$eval('a[href*="/marketplace/item"]', (els) =>
//     els.map((el) => ({
//       href: el.getAttribute("href"),
//       text: el.innerText,
//       img: el.querySelector("img")?.src || "",
//     }))
//   );
//   await page.close();

//   // Step 6: Filter results
//   const mustInclude = keywords
//     .split(",")
//     .map((s) => s.trim().toLowerCase())
//     .filter(Boolean);
//   const mustExclude = exclude
//     .split(",")
//     .map((s) => s.trim().toLowerCase())
//     .filter(Boolean);
//   const queryWords = query.toLowerCase().split(" ").filter(Boolean);
//   const seen = new Set();
//   const results = [];

//   for (const item of anchors) {
//     if (!item.href || seen.has(item.href)) continue;
//     seen.add(item.href);

//     const text = item.text.toLowerCase();

//     // Exclude if necessary
//     if (mustExclude.some((term) => text.includes(term))) continue;

//     // Include keywords
//     if (mustInclude.length && !mustInclude.some((term) => text.includes(term)))
//       continue;

//     // Require all query words to be present
//     if (queryWords.length && !queryWords.every((word) => text.includes(word)))
//       continue;

//     // Extract price
//     const priceMatch = text.match(/\$[\d,]+/);
//     const price = priceMatch
//       ? parseInt(priceMatch[0].replace(/[$,]/g, ""), 10)
//       : 0;
//     if (price < parseInt(minPrice, 10) || price > parseInt(maxPrice, 10))
//       continue;

//     // Extract year
//     const yearMatch = text.match(/\b(19|20)\d{2}\b/);
//     const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
//     if (year && (year < parseInt(minYear, 10) || year > parseInt(maxYear, 10)))
//       continue;

//     results.push({
//       title: item.text.split("\n")[0],
//       price,
//       year,
//       link: "https://www.facebook.com" + item.href.split("?")[0],
//       image: item.img,
//       description: item.text,
//     });
//   }

//   return res.status(200).json(results);
// }

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

  const ctx = await getContext();
  const page = await ctx.newPage();

  // Step 1: Go to Marketplace
  await page.goto("https://www.facebook.com/marketplace");
  await page.waitForTimeout(3000);

  // Step 2: Try to trigger location logic to confirm it's loaded from auth
  try {
    await page.click('button[aria-label="Location"]', { timeout: 5000 });
    await page.waitForSelector('div[role="dialog"]', { timeout: 3000 });
    await page.keyboard.press("Escape");
  } catch (e) {
    console.warn("Location selector not found or skipped");
  }

  // Step 3: Apply filters via URL
  const params = new URLSearchParams({
    query,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    sortBy,
    radius,
  });

  await page.goto(
    `https://www.facebook.com/marketplace/search/?${params.toString()}`
  );
  await page.waitForTimeout(5000);

  // Step 4: Scroll to load listings dynamically
  const loops = Math.min(100, Math.max(1, parseInt(scrollCount, 10)));
  for (let i = 0; i < loops; i++) {
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(1200);
  }

  // Step 5: Scrape anchor tags
  const anchors = await page.$$eval('a[href*="/marketplace/item"]', (els) =>
    els.map((el) => ({
      href: el.getAttribute("href"),
      text: el.innerText,
      img: el.querySelector("img")?.src || "",
    }))
  );
  await page.close();

  // Step 6: Filter results
  const mustInclude = keywords
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const mustExclude = exclude
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const queryWords = query.toLowerCase().split(" ").filter(Boolean);
  const seen = new Set();
  const results = [];

  for (const item of anchors) {
    if (!item.href || seen.has(item.href)) continue;
    seen.add(item.href);

    const text = item.text.toLowerCase();

    if (mustExclude.some((term) => text.includes(term))) continue;
    if (mustInclude.length && !mustInclude.some((term) => text.includes(term)))
      continue;
    if (queryWords.length && !queryWords.every((word) => text.includes(word)))
      continue;

    const priceMatch = text.match(/\$[\d,]+/);
    const price = priceMatch
      ? parseInt(priceMatch[0].replace(/[$,]/g, ""), 10)
      : 0;
    if (price < parseInt(minPrice, 10) || price > parseInt(maxPrice, 10))
      continue;

    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
    if (year && (year < parseInt(minYear, 10) || year > parseInt(maxYear, 10)))
      continue;

    results.push({
      title: item.text.split("\n")[0],
      price,
      year,
      link: "https://www.facebook.com" + item.href.split("?")[0],
      image: item.img,
      description: item.text,
    });
  }

  return res.status(200).json(results);
}
