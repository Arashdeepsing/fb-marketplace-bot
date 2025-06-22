from playwright.sync_api import sync_playwright
import os
from dotenv import load_dotenv

load_dotenv()

def save_facebook_auth():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.facebook.com/login")
        page.fill('input[name="email"]', os.getenv("FACEBOOK_EMAIL"))
        page.fill('input[name="pass"]', os.getenv("FACEBOOK_PASSWORD"))
        page.click('button[name="login"]')
        page.wait_for_load_state("networkidle")
        context.storage_state(path="auth.json")
        print("✅ auth.json saved!")
        browser.close()

if __name__ == "__main__":
    save_facebook_auth()
