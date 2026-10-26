"""Test 2: elbotola.com #matches (Saison 3glrw7hww3oqdyj) vom GitHub-Runner aus lesen. Nur Lesen, schreibt nichts ins Repo."""
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

URL = "https://www.elbotola.com/analytics/season/3glrw7hww3oqdyj#matches"


def zeilen(html):
    soup = BeautifulSoup(html, "html.parser")
    print("Titel:", soup.title.get_text(strip=True) if soup.title else None, "| Länge:", len(html))
    n = 0
    for row in soup.find_all("tr"):
        cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
        if len(cells) >= 3:
            print(" | ".join(cells)); n += 1
    print("Tabellenzeilen:", n)
    return soup


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
    resp = page.goto(URL, timeout=45000)
    print("HTTP-Status (erste Antwort):", resp.status if resp else None)
    for i in range(30):  # bis zu 30 s auf das Ende der Prüfseite warten
        if "Just a moment" not in page.title():
            break
        time.sleep(1)
    print("Titel nach Warten:", page.title(), "| Wartezeit s:", i + 1)
    soup = zeilen(page.content())
    if "Just a moment" in page.title():
        print("BLOCKIERT: Prüfseite bleibt bestehen, Abbruch.")
    else:
        sels = soup.find_all("select")
        print("Dropdowns:", len(sels))
        for s in sels:
            print([o.get_text(strip=True) for o in s.find_all("option")][:60])
    browser.close()
