#!/usr/bin/env python3
"""Setzt das runde Seitenlogo oben links in ein Foto (14 % der Bildbreite).

Aufruf:
  python3 add_logo.py --in foto.jpg --out images/<name>.jpg
Voraussetzung: pip install pillow
Nur fuer Fotos aus externen Quellen verwenden, nicht fuer eigene Bilder
(make_post_image.py) und nicht fuer Videos.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "INSTA_Short_Image_dunkel.jpg")
CX, CY, R = 468, 566, 286   # rundes Wappen im Quellbild (928x1152)


def emblem(logo_path=LOGO):
    src = Image.open(logo_path).convert("RGB")
    crop = src.crop((CX - R, CY - R, CX + R, CY + R))
    s = 4  # Supersampling fuer einen glatten Rand
    mask = Image.new("L", (crop.width * s, crop.height * s), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, mask.width - 1, mask.height - 1), fill=255)
    mask = mask.resize(crop.size, Image.LANCZOS)
    out = crop.convert("RGBA")
    out.putalpha(mask)
    return out


def apply(photo_path, out_path, frac=0.14, margin=0.025):
    im = ImageOps.exif_transpose(Image.open(photo_path)).convert("RGB")
    w, _ = im.size
    d = max(1, round(w * frac))
    em = emblem().resize((d, d), Image.LANCZOS)
    m = round(w * margin)
    im = im.convert("RGBA")
    im.alpha_composite(em, (m, m))
    im.convert("RGB").save(out_path, quality=92)
    return im.size


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(apply(a.inp, a.out))
