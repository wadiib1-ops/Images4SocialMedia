#!/usr/bin/env python3
"""Erzeugt ein Feed-Bild aus einer der 4 Vorlagen in vorlagen/ (Geometrie der Vorlagen, Foto und Texte neu gesetzt).

  /tmp/venv/bin/python feed_template.py --template 4 --photo foto.jpg --out images/<name>.jpg \
      --title "<arabische Schlagzeile>" [--sub "<Unterzeile>"] [--tag "الدوري المغربي"]

Vorlagen: 1 = Titel oben 1080x1920, 2 = nur Foto 1080x1920, 3 = Diagonale 1080x1920, 4 = Diagonale 4:5 1080x1350.
Das Foto wird mit Zuschnitt (cover) eingesetzt, nie verzerrt. Das Logo kommt aus images/logo-neu.png,
der Schriftzug MoroccanFootballAndFutsal wird aus der Vorlage übernommen. Ausgabe JPG (q=92) oder PNG.
"""
import argparse
import os

from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Tajawal-Bold.ttf")
FONT_REG = os.path.join(HERE, "fonts", "Tajawal-Regular.ttf")
LOGO = os.path.join(HERE, "images", "logo-neu.png")
RED = (193, 39, 45)
DARK = (20, 20, 20)
CREAM = (244, 237, 225)
SUB = (190, 185, 178)

VORLAGEN = {
    1: "vorlage-1-titel-oben-1080x1920.png",
    2: "vorlage-2-nur-foto-1080x1920.png",
    3: "vorlage-3-diagonale-1080x1920.png",
    4: "vorlage-4-diagonale-1080x1350.png",
}

# size = Leinwand, bar = Höhe des roten Balkens unten, logo = (Größe, x, y), handle = Ausschnitt der Vorlage (x0,y0,x1,y1)
# title = (rechter Rand, oberste y, Schriftgröße, Zeilenabstand, max. Zeilen), sub = (rechter Rand, y, Schriftgröße)
SPEC = {
    1: dict(size=(1080, 1920), bar=14, logo=(125, 74, 1762), handle=(600, 1800, 1012, 1850),
            head=760, photo=(72, 820, 1008, 1700), title=(1008, 150, 96, 114, 3)),
    2: dict(size=(1080, 1920), bar=14, logo=(192, 60, 1660), handle=None, photo=(0, 0, 1080, 1906)),
    3: dict(size=(1080, 1920), bar=14, logo=(174, 75, 1593), handle=(545, 1655, 1018, 1705),
            line=(1100, 968), photo=(0, 0, 1080, 1100), tag=(1007, 1000, 99, 38),
            title=(1008, 1131, 100, 118, 3), sub=(1007, 1484, 38)),
    4: dict(size=(1080, 1350), bar=14, logo=(146, 58, 1154), handle=(625, 1205, 1032, 1245),
            line=(860, 740), photo=(0, 0, 1080, 860), tag=(1023, 56, 88, 34),
            title=(1024, 906, 84, 98, 2), sub=(1022, 1114, 34)),
}


def tlen(draw, text, font):
    return draw.textlength(text, font=font, direction="rtl", language="ar")


def wrap(draw, text, font, max_w):
    lines, cur = [], ""
    for word in text.split():
        cand = f"{cur} {word}".strip()
        if tlen(draw, cand, font) <= max_w:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def fit_photo(photo, box_w, box_h):
    return ImageOps.fit(photo, (box_w, box_h), Image.LANCZOS, centering=(0.5, 0.4))


def right_text(draw, x_right, y, text, font, fill):
    draw.text((x_right - tlen(draw, text, font), y), text, font=font, fill=fill,
              direction="rtl", language="ar")


def build(n, photo_path, title, sub="", tag="الدوري المغربي"):
    sp = SPEC[n]
    W, H = sp["size"]
    img = Image.new("RGB", (W, H), DARK)
    d = ImageDraw.Draw(img)
    photo = Image.open(photo_path).convert("RGB")

    if n == 1:
        d.rectangle([0, 0, W, sp["head"]], fill=RED)
        x0, y0, x1, y1 = sp["photo"]
        img.paste(fit_photo(photo, x1 - x0, y1 - y0), (x0, y0))
    elif n == 2:
        img.paste(fit_photo(photo, W, sp["photo"][3]), (0, 0))
    else:
        yl, yr = sp["line"]
        ph = fit_photo(photo, W, sp["photo"][3] + 40)
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon([(0, 0), (W, 0), (W, yr), (0, yl)], fill=255)
        full = Image.new("RGB", (W, H), DARK)
        full.paste(ph, (0, 0))
        img.paste(full, (0, 0), mask)

    d = ImageDraw.Draw(img)
    d.rectangle([0, H - sp["bar"], W, H], fill=RED)

    # Titel
    if "title" in sp:
        xr, ty, size, pitch, max_lines = sp["title"]
        max_w = 936 if n == 1 else 880
        while True:
            font = ImageFont.truetype(FONT, size)
            lines = wrap(d, title, font, max_w)
            if len(lines) <= max_lines or size <= 48:
                break
            size -= 4
        pitch = int(pitch * size / sp["title"][2])
        y = ty
        for line in lines[:max_lines]:
            right_text(d, xr, y, line, font, CREAM)
            y += pitch
    # Etikett und Unterzeile
    if "tag" in sp and tag:
        xr, ty, th, tsize = sp["tag"]
        tf = ImageFont.truetype(FONT, tsize)
        tw = int(tlen(d, tag, tf)) + 60
        d.rectangle([xr - tw, ty, xr, ty + th], fill=RED)
        d.text((xr - tw / 2, ty + th / 2), tag, font=tf, fill=CREAM, anchor="mm",
               direction="rtl", language="ar")
    if "sub" in sp and sub:
        xr, sy, ssize = sp["sub"]
        sf = ImageFont.truetype(FONT_REG, ssize)
        right_text(d, xr, sy, sub, sf, SUB)

    # Schriftzug aus der Vorlage
    if sp["handle"]:
        tmpl = Image.open(os.path.join(HERE, "vorlagen", VORLAGEN[n])).convert("RGB")
        box = sp["handle"]
        img.paste(tmpl.crop(box), (box[0], box[1]))
    # Logo
    size, lx, ly = sp["logo"]
    logo = Image.open(LOGO).convert("RGBA")
    bbox = logo.getbbox()
    logo = logo.crop(bbox).resize((size, size), Image.LANCZOS)
    img.paste(logo, (lx, ly), logo)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", type=int, required=True, choices=[1, 2, 3, 4])
    ap.add_argument("--photo", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--sub", default="")
    ap.add_argument("--tag", default="الدوري المغربي")
    a = ap.parse_args()
    if a.template != 2 and not a.title:
        raise SystemExit("--title fehlt")
    img = build(a.template, a.photo, a.title, a.sub, a.tag)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    if a.out.lower().endswith(".png"):
        img.save(a.out)
    else:
        img.save(a.out, quality=92)
    print(a.out)


if __name__ == "__main__":
    main()
