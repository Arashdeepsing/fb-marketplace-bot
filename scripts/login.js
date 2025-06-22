// Run: npm run login
const { chromium } = require("playwright");
require("dotenv").config();

(async () => {
  const browser = await chromium.launch({ headless: false }); // Allow UI for manual interaction
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Go to Facebook login
  await page.goto("https://www.facebook.com/login");

  // 2. Log in using credentials
  await page.fill('input[name="email"]', process.env.FACEBOOK_EMAIL);
  await page.fill('input[name="pass"]', process.env.FACEBOOK_PASSWORD);
  await page.click('button[name="login"]');
  await page.waitForNavigation();

  // 3. Now let the user set location manually in Marketplace
  await page.goto("https://www.facebook.com/marketplace/");
  console.log(
    "👉 Set your Marketplace location manually. Then close this browser tab."
  );

  // 4. Give the user time to interact
  await page.waitForTimeout(60000); // 60 seconds to change location manually

  // 5. Save session
  await context.storageState({ path: "auth.json" });
  console.log("✅ auth.json saved (with location)");

  await browser.close();
})();
