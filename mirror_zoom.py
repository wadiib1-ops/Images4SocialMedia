#!/usr/bin/env python3
"""Spiegelt ein Foto horizontal, zoomt 15 % in die Mitte und erzeugt die Formate.

Aufruf:
  python3 mirror_zoom.py --in foto.jpg --prefix images/<JJJJMMTT-HHMM>-<n> [--zoom 1.15]
Ausgabe: <prefix>-feed.jpg (Originalformat, Logo), <prefix>-ig.jpg (1080x1350, Logo),
         <prefix>-story.jpg (1080x1920, Logo). Reihenfolge: spiegeln, zoomen, Format, Logo.
Voraussetzung: pip install pillow
"""
import argparse
from PIL import Image, ImageOps, ImageFilter
import add_logo


def mirror_zoom(im, zoom=1.15):
    im = ImageOps.mirror(im)
    w, h = im.size
    cw, ch = round(w / zoom), round(h / zoom)
    l, t = (w - cw) // 2, (h - ch) // 2
    return im.crop((l, t, l + cw, t + ch)).resize((w, h), Image.LANCZOS)


def fit(im, tw, th):
    """Foto zentriert auf unscharfem Hintergrund desselben Fotos."""
    bg = ImageOps.fit(im, (tw, th), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    r = min(tw / im.width, th / im.height)
    fg = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    bg.paste(fg, ((tw - fg.width) // 2, (th - fg.height) // 2))
    return bg


def logo(im, frac, x, y):
    d = round(im.width * frac)
    em = add_logo.emblem().resize((d, d), Image.LANCZOS)
    out = im.convert("RGBA")
    out.alpha_composite(em, (round(im.width * x), round(im.height * y)))
    return out.convert("RGB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--prefix", required=True)
    ap.add_argument("--zoom", type=float, default=1.15)
    a = ap.parse_args()
    src = ImageOps.exif_transpose(Image.open(a.inp)).convert("RGB")
    mz = mirror_zoom(src, a.zoom)
    logo(mz, 0.14, 0.025, 0.025).save(a.prefix + "-feed.jpg", quality=92)
    logo(fit(mz, 1080, 1350), 0.14, 0.03, 0.03).save(a.prefix + "-ig.jpg", quality=92)
    logo(fit(mz, 1080, 1920), 0.14, 0.04, 0.13).save(a.prefix + "-story.jpg", quality=92)
    print("ok")
