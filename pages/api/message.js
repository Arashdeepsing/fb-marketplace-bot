import { chromium } from "playwright";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { listings, messageText } = req.body;

  if (!Array.isArray(listings) || !messageText) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  let successCount = 0;

  for (const item of listings) {
    try {
      await page.goto(item.link, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);

      // Try clicking "Message" button if visible
      const messageButton = await page.$('text="Message"');
      if (messageButton) {
        await messageButton.click();
        await page.waitForTimeout(2000);
      }

      // Wait for and focus on message input
      await page.waitForSelector('[contenteditable="true"]', {
        timeout: 10000,
      });

      await page.evaluate((text) => {
        const input = document.querySelector('[contenteditable="true"]');
        if (input) {
          input.focus();
          input.textContent = text;
          const inputEvent = new InputEvent("input", { bubbles: true });
          input.dispatchEvent(inputEvent);
        }
      }, messageText);

      // Press Enter to send
      await page.keyboard.press("Enter");

      successCount++;
      await page.waitForTimeout(2000);
    } catch (err) {
      console.error(`❌ Failed to message ${item.link}:`, err.message);
    }
  }

  await browser.close();

  return res.status(200).json({
    messaged: successCount,
    total: listings.length,
  });
}
