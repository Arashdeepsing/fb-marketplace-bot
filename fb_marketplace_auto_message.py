import re
import asyncio
import json
import os
from playwright.async_api import async_playwright

SEEN_FILE = "seen_urls.json"

async def find_listings(city: str, query: str, max_price: int):
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state="auth.json")
        page = await context.new_page()

        url = (
            f"https://www.facebook.com/marketplace/{city.replace(' ', '').lower()}/search"
            f"/?query={query}&maxPrice={max_price}&sortBy=creation_time_descend"
        )
        await page.goto(url)
        await page.wait_for_timeout(5000)
        for _ in range(10):
            await page.mouse.wheel(0, 3000)
            await page.wait_for_timeout(1500)

        anchors = await page.query_selector_all('a[href*="/marketplace/item"]')
        seen = set()
        for a in anchors:
            href = await a.get_attribute("href")
            if not href or href in seen:
                continue
            seen.add(href)

            text = await a.inner_text()
            price_match = re.search(r"\$[\d,]+", text)
            price = int(price_match.group().replace("$","").replace(",","")) if price_match else 0
            if price > max_price:
                continue

            img_el = await a.query_selector("img")
            img_url = await img_el.get_attribute("src") if img_el else ""

            results.append({
                "title": text.split("\n")[0],
                "price": price,
                "location": city,
                "image": img_url,
                "link": href.split("?")[0]
            })
        await browser.close()
    return results

async def send_messages(city: str, query: str, max_price: int, message_text: str):
    seen = set(json.load(open(SEEN_FILE, 'r'))) if os.path.exists(SEEN_FILE) else set()
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state="auth.json")
        page = await context.new_page()

        url = (
            f"https://www.facebook.com/marketplace/{city.replace(' ', '').lower()}/search"
            f"/?query={query}&maxPrice={max_price}&sortBy=creation_time_descend"
        )
        await page.goto(url)
        await page.wait_for_timeout(5000)
        anchors = await page.query_selector_all('a[href*="/marketplace/item"]')

        total = 0
        messaged = 0
        for a in anchors:
            href = await a.get_attribute("href")
            if not href or href in seen:
                continue
            total += 1

            text = await a.inner_text()
            price_match = re.search(r"\$[\d,]+", text)
            price = int(price_match.group().replace("$","").replace(",","")) if price_match else 0
            if price > max_price:
                continue

            listing_url = href.split('?')[0]
            msg_page = await context.new_page()
            await msg_page.goto(listing_url)
            await msg_page.wait_for_timeout(5000)
            try:
                await msg_page.click('text="Message"')
                await msg_page.wait_for_selector('textarea')
                await msg_page.fill('textarea', message_text)
                await msg_page.keyboard.press('Enter')
                messaged += 1
                seen.add(href)
                json.dump(list(seen), open(SEEN_FILE, 'w'))
                await msg_page.wait_for_timeout(1000)
            except Exception:
                pass
            await msg_page.close()

        await browser.close()
    return {"total": total, "messaged": messaged}

if __name__ == '__main__':
    import sys
    city, query, mx, msg = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
    print(asyncio.run(send_messages(city, query, mx, msg)))