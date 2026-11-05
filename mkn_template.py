#!/usr/bin/env python3
"""MKN-06-Vorlagen (Al Muntakhab): Feed-Bild 4:5 und Video-Abschnitte 9:16 (verbindlich seit 02.11.2026).

Feed (Facebook-/Instagram-Feed, 1080x1350):
  /tmp/venv/bin/python mkn_template.py feed --photo F --out images/x.jpg --title T --sub S --page fb|ig --tag "<Thema>" [--date TT.MM.JJJJ]
Video (Reel, Facebook-Story, Instagram-Story, 1080x1920): transparente Abschnitts-PNGs + fertiges Video
  /tmp/venv/bin/python mkn_template.py video --photo F --track MP3 --start 8 --sections sections.json \
      --page fb|ig --out video.mp4 [--date TT.MM.JJJJ]
sections.json: [["Abschnittstext", Sekunden], ...]; erster Abschnitt ab 0,5 s, Ende des letzten = Videoende.
Seitenname rechts im Footer: fb = كرة القدم المغربية, ig = @moroccanfootballandfutsal; links das Datum.
"""
import argparse, json, os, subprocess, sys, datetime
sys.dont_write_bytecode = True
from PIL import Image, ImageDraw, ImageFont, ImageOps
import feed_template as ft

HERE = os.path.dirname(os.path.abspath(__file__))
OV = {"4x5": os.path.join(HERE, "vorlagen", "MKN_06_AlMuntakhab_4x5_Overlay.png"),
      "9x16": os.path.join(HERE, "vorlagen", "MKN_06_AlMuntakhab_9x16_Overlay.png")}
GREEN = (11, 61, 46, 255); CREAM = (244, 237, 225); GREY = (190, 185, 178); TAGCOL = (10, 60, 45, 255)
PAGE = {"fb": "كرة القدم المغربية", "ig": "@moroccanfootballandfutsal"}
# Geometrie: Fensterhöhe, Linie y, Text-Start y (Feed), Footer-Versatz
GEO = {"4x5": dict(win=760, line=1224, ty=905, foff=61), "9x16": dict(win=900, line=1567, ty=1190, foff=243)}
# Kleinerer Textblock (Nutzerwunsch 04.11.2026, dauerhaft, nochmals kleiner am selben Tag): Foto-Fenster waechst um GROW px, gruener Block schrumpft von oben.
GROW = {"4x5": 160, "9x16": 200}
for _k in GEO:
    GEO[_k]["orig"] = GEO[_k]["win"]; GEO[_k]["win"] += GROW[_k]; GEO[_k]["ty"] += 60 if _k == "4x5" else 0


def patched(key, tag=None):
    """Endstand 03.11.2026: Etikett 48 px nach rechts; Logo bleibt oben links auf dem Foto.
    Vorlagendatei bleibt unveraendert."""
    o = Image.open(OV[key]).convert("RGBA"); g = GEO[key]
    o.paste(Image.new("RGBA", (o.width, GROW[key]), (0, 0, 0, 0)), (0, g["orig"]))
    tag_img = o.crop((717, 82, 1008, 140))
    o.paste(Image.new("RGBA", (300, 80), (0, 0, 0, 0)), (717, 70))
    if not tag:
        o.paste(tag_img, (717 + 48, 82))
        return o
    # Generisches Themen-Etikett (Nutzerwunsch 03.11.2026): Thema der Meldung, rechtsbündig bei x=1056
    d = ImageDraw.Draw(o); f = ImageFont.truetype(ft.FONT, 34)
    w = int(d.textlength(tag, font=f, direction="rtl", language="ar")) + 48
    box = Image.new("RGBA", (w, 58), (244, 239, 230, 255)); o.paste(box, (1056 - w, 82))
    ImageDraw.Draw(o).text((1056 - 24 - (w - 48), 82 + 8), tag, font=f, fill=TAGCOL, direction="rtl", language="ar")
    return o


def today():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).strftime("%d.%m.%Y")


def footer(d, geo, page, date):
    ff = ImageFont.truetype(ft.FONT, 34); fy = geo["line"] + geo["foff"]
    if page.startswith("@"):
        d.text((1008 - d.textlength(page, font=ff), fy), page, font=ff, fill=CREAM)
    else:
        ft.right_text(d, 1008, fy, page, ff, CREAM)
    d.text((72, fy), date, font=ff, fill=GREY)


def feed(photo, out, title, sub, page, date, tag=None):
    o = patched("4x5", tag); g = GEO["4x5"]
    c = Image.new("RGBA", o.size, GREEN)
    c.paste(ImageOps.fit(Image.open(photo).convert("RGB"), (1080, g["win"]), Image.LANCZOS), (0, 0))
    c.alpha_composite(o); d = ImageDraw.Draw(c)
    f = ImageFont.truetype(ft.FONT, 70); fs = ImageFont.truetype(ft.FONT_REG, 38); y = g["ty"]
    for l in ft.wrap(d, title, f, 936)[:2]:
        ft.right_text(d, 1008, y, l, f, CREAM); y += 92
    if sub:
        ft.right_text(d, 1008, y + 20, sub, fs, GREY)
    footer(d, g, PAGE[page], date)
    c.convert("RGB").save(out, quality=92)


def section_png(text, out, page, date, tag=None, idx=None, total=None):
    """Transparentes 1080x1920-PNG: Vorlage (Fenster durchsichtig) + Abschnittstext + Footer."""
    c = patched("9x16", tag); g = GEO["9x16"]; d = ImageDraw.Draw(c)
    f = ImageFont.truetype(ft.FONT, 64); lines = ft.wrap(d, text, f, 936)[:5]
    area_top, area_bot = g["win"] + 40, g["line"] - 40
    h = len(lines) * 86; y = area_top + (area_bot - area_top - h) // 2
    for l in lines:
        ft.right_text(d, 1008, y, l, f, CREAM); y += 86
    footer(d, g, PAGE[page], date)
    if idx and total and total > 1:  # Abschnitts-Anzeige (Nutzerwunsch 05.11.2026): Zaehler "k/n" + Punktreihe
        yy = g["win"] + 14; cf = ImageFont.truetype(ft.FONT, 30)
        d.text((72, yy - 6), f"{idx}/{total}", font=cf, fill=GREY)
        r = 9; gap = 34; x0 = 1008 - (total - 1) * gap - r
        for k in range(total):
            cx = x0 + k * gap; cy = yy + 14
            if k == idx - 1: d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(193, 39, 45, 255))
            else: d.ellipse((cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2), fill=GREY)
    c.save(out)


def video(photo, track, start, sections, page, date, out, tag=None):
    D = 0.5 + sum(s[1] for s in sections); tmp = os.path.splitext(out)[0]
    pngs = []
    for i, (t, _) in enumerate(sections, 1):
        p = f"{tmp}-s{i}.png"; section_png(t, p, page, date, tag, i, len(sections)); pngs.append(p)
    W = GEO["9x16"]["win"]
    ins = []; fc = [
        f"[0:v]scale=1080:{W}:force_original_aspect_ratio=increase,crop=1080:{W},scale=2160:{2*W},"
        f"zoompan=z='1+0.35*exp(-7*on/25)+0.045*lt(on,50)*pow(abs(sin(PI*on/25*2)),12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x{W}:fps=25[ph]",
        f"[1:v][ph]overlay=0:0[b0]"]
    prev = "b0"; t0 = 0.5
    for i, (_, d_) in enumerate(sections):
        st, en = t0, t0 + d_; t0 = en; n = 4 + i
        ins += ["-loop", "1", "-framerate", "25", "-t", str(D), "-i", pngs[i]]
        fc.append(f"[{n}:v]format=rgba,fade=t=in:st={st}:d=0.4:alpha=1[a{i}]")
        fc.append(f"[{prev}][a{i}]overlay=0:0:enable='between(t,{st},{en})'[o{i}]"); prev = f"o{i}"
    fc.append(f"[{prev}][3:v]overlay=x='-1080+1080*t/{D}':y=1896,rgbashift=rh=-14:bh=14:enable='lt(t,0.5)',"
              f"fade=t=in:st=0:d=0.35:color=white,format=yuv420p[v]")
    fc.append(f"[2:a]atrim=0:{D},afade=t=in:d=0.8,afade=t=out:st={D-2}:d=2,loudnorm=I=-14:TP=-1.5:LRA=7[a]")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "25", "-t", str(D), "-i", photo,
           "-f", "lavfi", "-i", f"color=c=0x0B3D2E:s=1080x1920:r=25:d={D}",
           "-ss", str(start), "-i", track,
           "-f", "lavfi", "-i", f"color=c=0xC1272D:s=1080x24:r=25:d={D}"] + ins + \
          ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]", "-t", str(D), "-c:v", "libx264",
           "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    for p in pngs: os.remove(p)


if __name__ == "__main__":
    a = argparse.ArgumentParser(); a.add_argument("mode", choices=["feed", "video"])
    a.add_argument("--photo", required=True); a.add_argument("--out", required=True)
    a.add_argument("--page", choices=["fb", "ig"], required=True); a.add_argument("--date", default=today())
    a.add_argument("--tag", default=None); a.add_argument("--title", default=""); a.add_argument("--sub", default="")
    a.add_argument("--track"); a.add_argument("--start", type=float, default=0); a.add_argument("--sections")
    r = a.parse_args()
    if r.mode == "feed":
        feed(r.photo, r.out, r.title, r.sub, r.page, r.date, r.tag)
    else:
        video(r.photo, r.track, r.start, json.load(open(r.sections)), r.page, r.date, r.out, r.tag)
