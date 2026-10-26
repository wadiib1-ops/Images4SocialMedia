"""Test: ist elbotola.com (Saison 3glrw7hww3oqdyj) von einem GitHub-Runner aus lesbar? Nur Lesen, schreibt nichts ins Repo."""
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

SEASON = "3glrw7hww3oqdyj"
URLS = [f"https://www.elbotola.com/analytics/season/{SEASON}", "https://elbotola.com"]


def zeilen(html):
    soup = BeautifulSoup(html, "html.parser")
    print("Titel:", soup.title.get_text(strip=True) if soup.title else None, "| Länge:", len(html))
    n = 0
    for row in soup.find_all("tr"):
        cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
        if len(cells) >= 3:
            print(" | ".join(cells)); n += 1
    print("Tabellenzeilen:", n)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
    for url in URLS:
        print("\n==", url)
        try:
            resp = page.goto(url, timeout=45000)
            print("HTTP-Status:", resp.status if resp else None)
            time.sleep(5)
            zeilen(page.content())
        except Exception as e:
            print("FEHLER:", str(e)[:300])
    browser.close()
