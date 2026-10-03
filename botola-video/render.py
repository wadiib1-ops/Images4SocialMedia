#!/usr/bin/env python3
"""Botola Pro Spieltag-Video-Renderer (1080x1920, 30 fps, MP4).

Aufruf:  python3 render.py data.json out.mp4
Arabischer Text wird von Pillow (libraqm) korrekt verbunden und von rechts nach links gesetzt.
Optional: logo.png im selben Ordner wird oben links eingeblendet.
"""
import json, os, subprocess, sys, math, glob, hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
BASE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(BASE)                      # Repo-Wurzel (Images4SocialMedia)
def _first(*cands):
    return next((c for c in cands if os.path.exists(c)), cands[-1])
LOGO_DIR = _first(os.path.join(REPO, "Wappen"), os.path.join(BASE, "logos"))      # Vereinswappen
MUSIC_DIR = _first(os.path.join(REPO, "Video"), os.path.join(BASE, "music"))      # Hintergrundmusik
BRAND_IMG = _first(os.path.join(REPO, "INSTA_Short_Image_dunkel.jpg"), os.path.join(BASE, "brand", "INSTA_Short_Image_dunkel.jpg"))
LOGO_FILE = _first(os.path.join(BASE, "assets", "logo.png"), os.path.join(BASE, "logo.png"))
MAP_FILE = _first(os.path.join(BASE, "wappen_map.json"), os.path.join(BASE, "logos", "map.json"))
F = lambda w, s: ImageFont.truetype(os.path.join(BASE, "fonts", f"Cairo_{w}.ttf"), s)

GREEN_D = (6, 44, 32)
GREEN = (0, 98, 51)
RED = (193, 39, 45)
GOLD = (232, 182, 66)
WHITE = (255, 255, 255)
MUTED = (190, 210, 200)
CARD = (12, 64, 46)

# ---------- Hilfsfunktionen ----------
def ease(t):  # easeOutCubic
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def text(d, xy, s, font, fill, anchor="mm"):
    d.text(xy, s, font=font, fill=fill, anchor=anchor, direction="rtl", language="ar")

def num(d, xy, s, font, fill, anchor="mm"):
    """Zahlen/Vorzeichen immer links-nach-rechts setzen (z. B. +2, -6)."""
    d.text(xy, s, font=font, fill=fill, anchor=anchor, direction="ltr")

def fit_font(weight, size, s, max_w):
    while size > 20:
        f = F(weight, size)
        if f.getlength(s, direction="rtl", language="ar") <= max_w:
            return f
        size -= 2
    return F(weight, size)

def initials_badge(name, size, color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, size - 1, size - 1), fill=color + (255,), outline=GOLD + (255,), width=5)
    letter = name.replace("ال", "", 1).strip()[:1] or name[:1]
    text(d, (size // 2, size // 2 - 6), letter, F("900Black", int(size * 0.5)), WHITE)
    return img

_LOGO_MAP = None
def find_logo(name):
    global _LOGO_MAP
    if _LOGO_MAP is None:
        _LOGO_MAP = {}
        if os.path.exists(MAP_FILE):
            for fn, aliases in json.load(open(MAP_FILE, encoding="utf-8")).items():
                for a in aliases:
                    _LOGO_MAP[a.strip().lower()] = os.path.join(LOGO_DIR, fn)
    direct = os.path.join(LOGO_DIR, f"{name}.png")
    return direct if os.path.exists(direct) else _LOGO_MAP.get(name.strip().lower())

_BADGES = {}
def club_badge(name, size):
    key = (name, size)
    if key not in _BADGES:
        _BADGES[key] = _club_badge(name, size)
    return _BADGES[key]

def _club_badge(name, size):
    p = find_logo(name)
    if p and os.path.exists(p):
        ss = 3  # Supersampling für saubere Kreiskanten
        S = size * ss
        lg = Image.open(p).convert("RGBA")
        # weißen Rand des Wappens wegschneiden
        bg = Image.new("RGBA", lg.size, (255, 255, 255, 255))
        diff = Image.eval(Image.alpha_composite(bg, lg).convert("L"), lambda v: 255 if v < 245 else 0)
        box = diff.getbbox()
        if box:
            lg = lg.crop(box)
        inner = int(S * 0.70)
        k = inner / max(lg.width, lg.height)
        lg = lg.resize((max(1, int(lg.width * k)), max(1, int(lg.height * k))), Image.LANCZOS)
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.ellipse((0, 0, S - 1, S - 1), fill=GOLD + (255,))
        bw = 6 * ss
        d.ellipse((bw, bw, S - 1 - bw, S - 1 - bw), fill=WHITE + (255,))
        crest = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        crest.paste(lg, ((S - lg.width) // 2, (S - lg.height) // 2), lg)
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).ellipse((bw, bw, S - 1 - bw, S - 1 - bw), fill=255)
        crest.putalpha(Image.composite(crest.getchannel("A"), Image.new("L", (S, S), 0), mask))
        img.alpha_composite(crest)
        return img.resize((size, size), Image.LANCZOS)
    return initials_badge(name, size, team_color(name))

def team_color(name):
    palette = [(150, 30, 40), (20, 80, 150), (30, 120, 70), (120, 60, 140), (170, 110, 20), (40, 40, 40)]
    return palette[sum(map(ord, name)) % len(palette)]

def background():
    bg = Image.new("RGB", (W, H), GREEN_D)
    d = ImageDraw.Draw(bg)
    for y in range(H):  # vertikaler Verlauf
        k = y / H
        c = tuple(int(GREEN_D[i] * (1 - k) + (2, 24, 18)[i] * k) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)
    # dezentes Sternmuster (marokkanisches Motiv, eigenes Design)
    pat = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pat)
    for cy in range(-60, H + 120, 180):
        for cx in range(-60 + (90 if (cy // 180) % 2 else 0), W + 120, 180):
            pts = []
            for i in range(16):
                r = 46 if i % 2 == 0 else 22
                a = math.pi * 2 * i / 16
                pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
            pd.polygon(pts, outline=(255, 255, 255, 14), width=2)
    bg.paste(pat, (0, 0), pat)
    # rote und goldene Akzentstreifen
    d.rectangle((0, 0, W, 14), fill=RED)
    d.rectangle((0, 14, W, 20), fill=GOLD)
    d.rectangle((0, H - 20, W, H - 14), fill=GOLD)
    d.rectangle((0, H - 14, W, H), fill=RED)
    return bg

def header_layer(data):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    logo = LOGO_FILE
    if os.path.exists(logo):
        lg = Image.open(logo).convert("RGBA")
        lw = int(W * 0.28)
        lg = lg.resize((lw, int(lg.height * lw / lg.width)))
        lay.paste(lg, (40, 40), lg)
    text(d, (W - 50, 95), data.get("page_name", "كرة القدم المغربية"), F("700Bold", 38), GOLD, "rm")
    if data.get("demo"):
        d.rounded_rectangle((W // 2 - 150, H - 120, W // 2 + 150, H - 60), 14, fill=RED)
        text(d, (W // 2, H - 92), "بيانات تجريبية", F("700Bold", 34), WHITE)
    return lay

# ---------- Szenen ----------
STATUS = {
    "live": ("لم تنتهِ بعد", "النتيجة النهائية لم تُحسم بعد"),
    "postponed": ("مؤجلة", "المباراة مؤجلة إلى موعد لاحق"),
    "not_played": ("لم تُلعب بعد", "لم تُجرَ المباراة بعد"),
}

def scene_intro(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = ease(t / 0.6)
    y = int(820 + (1 - a) * 120)
    alpha = int(255 * a)
    text(d, (W // 2, y - 170), "البطولة الاحترافية", F("900Black", 104), WHITE + (alpha,))
    d.rounded_rectangle((W // 2 - 300, y - 40, W // 2 + 300, y + 70), 30, fill=RED + (alpha,))
    text(d, (W // 2, y + 12), f"الجولة {data['round']}", F("900Black", 72), WHITE + (alpha,))
    text(d, (W // 2, y + 170), data.get("date_label", ""), F("700Bold", 46), MUTED + (alpha,))
    b = ease((t - 0.5) / 0.6)
    text(d, (W // 2, y + 300), "النتائج الكاملة", F("700Bold", 56), GOLD + (int(255 * b),))
    return lay

def scene_match(m, idx, total, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = ease(t / 0.5)
    out = ease((t - (dur - 0.35)) / 0.35)
    off = int((1 - a) * W * 0.6 - out * W * 0.6)
    al = int(255 * a * (1 - out))
    cx = W // 2 + off
    # Kartenrahmen
    card = Image.new("RGBA", (960, 1080), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, 959, 1079), 48, fill=CARD + (235,), outline=GOLD + (200,), width=4)
    cd.rounded_rectangle((330, -2, 630, 80), 24, fill=RED + (255,))
    text(cd, (480, 36), f"المباراة {idx}/{total}", F("700Bold", 40), WHITE)
    home, away = m["home"], m["away"]
    # Heim rechts (RTL), Gast links
    for name, x in ((home, 720), (away, 240)):
        b = club_badge(name, 250)
        card.paste(b, (x - 125, 105), b)
        f = fit_font("700Bold", 50, name, 400)
        text(cd, (x, 405), name, f, WHITE)
    status = m.get("status")
    if status:
        sh = sa = None
        label, sub = STATUS[status]
        col = RED if status == "live" else GOLD
        cd.rounded_rectangle((120, 470, 840, 660), 40, fill=GREEN_D + (255,), outline=col + (255,), width=5)
        text(cd, (480, 560), label, fit_font("900Black", 92, label, 640), WHITE if status == "live" else GOLD)
        cd.line((80, 710, 880, 710), fill=GOLD + (120,), width=2)
        text(cd, (480, 800), sub, fit_font("700Bold", 46, sub, 820), MUTED)
    else:
        sh, sa = m["score"]
        cd.rounded_rectangle((250, 470, 710, 660), 40, fill=GREEN_D + (255,), outline=GOLD + (255,), width=3)
        text(cd, (600, 555), str(sh), F("900Black", 150), WHITE)
        text(cd, (480, 555), "-", F("900Black", 100), GOLD)
        text(cd, (360, 555), str(sa), F("900Black", 150), WHITE)
        cd.line((80, 710, 880, 710), fill=GOLD + (120,), width=2)
    # Torschützen
    y = 770
    names_mode = m.get("_names_mode", True)
    def _line(g):
        if isinstance(g, str):
            g = {"name": "", "min": g}
        mn = g["min"] if "'" in g["min"] else g["min"] + "'"
        return f"{g['name']}  {mn}" if names_mode else f"هدف  {mn}"
    lines = {sd: [_line(g) for g in m.get("scorers", {}).get(sd, [])[:5]] for sd in ("home", "away")}
    allt = lines["home"] + lines["away"]
    fsz = min([fit_font("400Regular", 42, t, 400).size for t in allt] or [42])  # einheitliche Größe pro Karte
    for side, x, anc in (("home", 900, "rm"), ("away", 60, "lm")):
        yy = y
        for s_txt in lines[side]:
            text(cd, (x, yy), s_txt, F("400Regular", fsz), MUTED, anc)
            yy += 66
    if not m.get("scorers", {}).get("home") and not m.get("scorers", {}).get("away"):
        text(cd, (480, 780), "تعادل سلبي" if sh == sa == 0 else "", F("700Bold", 44), MUTED)
    if m.get("note"):
        text(cd, (480, 1000), m["note"], fit_font("700Bold", 42, m["note"], 860), GOLD)
    card.putalpha(card.getchannel("A").point(lambda v: v * al // 255))
    lay.paste(card, (cx - 480, 400), card)
    return lay

def _pentagram(layer, cx, cy, R, width, color):
    pts = [(cx + R * math.cos(math.radians(-90 + 144 * i)), cy + R * math.sin(math.radians(-90 + 144 * i))) for i in range(5)]
    ImageDraw.Draw(layer).line(pts + [pts[0]], fill=color, width=width, joint="curve")

def _rosettes():
    """Zellige-Rosetten aus deinem Instagram-Bild freistellen (eigenes Artwork)."""
    for cand in (BRAND_IMG,):
        if os.path.exists(cand):
            im = Image.open(cand).convert("RGB").crop((285, 880, 645, 1115))
            a = np.asarray(im).astype(np.float32)
            mx, mn = a.max(axis=2), a.min(axis=2)
            sat = (mx - mn) / (mx + 1e-6)
            mask = np.where((sat > 0.28) | (mx > 150), 255, 0).astype(np.uint8)
            m = Image.fromarray(mask).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
            out = im.convert("RGBA"); out.putalpha(m)
            return out
    return None

_TBL_BG = None
def table_background():
    global _TBL_BG
    if _TBL_BG is not None:
        return _TBL_BG
    rng = np.random.default_rng(5)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    top, bot = np.array([44, 50, 60], np.float32), np.array([20, 23, 29], np.float32)
    k = (yy / H)[..., None]
    arr = top * (1 - k) + bot * k
    # warmer grüner Lichtkegel hinter dem Kopfbereich
    glow = np.exp(-(((xx - 560) / 620) ** 2 + ((yy - 260) / 420) ** 2))[..., None]
    arr += glow * np.array([6, 38, 26], np.float32)
    # Vignette
    vig = 1 - 0.38 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
    arr *= vig[..., None]
    # feines Schiefer-Korn
    arr += rng.normal(0, 2.2, (H, W, 1))
    bg = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
    # riesiger, zarter Marokko-Stern (Pentagramm) hinter der Tabelle
    ss = 2
    star = Image.new("RGBA", (W * ss, H * ss), (0, 0, 0, 0))
    _pentagram(star, 540 * ss, 1040 * ss, 720 * ss, 26 * ss, (150, 175, 160, 34))
    _pentagram(star, 540 * ss, 1040 * ss, 720 * ss, 5 * ss, (232, 182, 66, 40))
    bg.alpha_composite(star.resize((W, H), Image.LANCZOS))
    d = ImageDraw.Draw(bg)
    # Akzentstreifen wie im Hauptdesign
    d.rectangle((0, 0, W, 14), fill=RED + (255,)); d.rectangle((0, 14, W, 20), fill=GOLD + (255,))
    d.rectangle((0, H - 20, W, H - 14), fill=GOLD + (255,)); d.rectangle((0, H - 14, W, H), fill=RED + (255,))
    # Rosetten unten + goldene Linien
    ro = _rosettes()
    if ro is not None:
        h = 150; w = int(ro.width * h / ro.height)
        ro = ro.resize((w, h), Image.LANCZOS)
        bg.alpha_composite(ro, ((W - w) // 2, 1738))
        d.line((70, 1812, (W - w) // 2 - 30, 1812), fill=GOLD + (140,), width=3)
        d.line(((W + w) // 2 + 30, 1812, W - 70, 1812), fill=GOLD + (140,), width=3)
    _TBL_BG = bg.convert("RGB")
    return _TBL_BG

ROW0, PITCH, RH = 392, 83, 76
def scene_table(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = ease(t / 0.5)
    al0 = int(255 * a)
    text(d, (720, 182), "الترتيب العام", F("900Black", 92), WHITE + (al0,))
    text(d, (720, 275), f"بعد الجولة {data['table_round']}", F("700Bold", 46), GOLD + (al0,))
    text(d, (990, 362), "الفريق", F("700Bold", 28), MUTED + (al0,), "rm")
    for x, lab in ((370, "لعب"), (250, "فارق"), (110, "نقاط")):
        text(d, (x, 362), lab, F("700Bold", 28), MUTED + (al0,))
    rows = data["table"]
    fn, fg, fp = F("900Black", 40), F("400Regular", 38), F("900Black", 46)
    for i, r in enumerate(rows):
        ra = ease((t - 0.35 - i * 0.07) / 0.4)
        if ra <= 0:
            continue
        al = int(255 * ra)
        y = ROW0 + i * PITCH
        x0 = int((1 - ra) * 360)
        lead = (i == 0)
        fill = ((70, 52, 12) if lead else (14, 30, 26)) + (int(205 * ra),)
        d.rounded_rectangle((50 + x0, y, 1030 + x0, y + RH), 22, fill=fill,
                            outline=(GOLD if lead else (92, 110, 100)) + (int((230 if lead else 150) * ra),), width=3 if lead else 2)
        cx = 990 + x0
        d.ellipse((cx - 30, y + RH // 2 - 30, cx + 30, y + RH // 2 + 30), fill=(RED if lead else (26, 74, 54)) + (al,))
        num(d, (cx, y + RH // 2 - 2), str(i + 1), fn, WHITE + (al,))
        b = club_badge(r["team"], 62)
        lay.alpha_composite(_fade(b, al), (905 + x0 - 31, y + (RH - 62) // 2))
        text(d, (860 + x0, y + RH // 2 - 2), r["team"], fit_font("700Bold", 42, r["team"], 420), WHITE + (al,), "rm")
        num(d, (370 + x0, y + RH // 2 - 2), str(r["played"]), fg, MUTED + (al,))
        gd = r["gd"]
        num(d, (250 + x0, y + RH // 2 - 2), f"{gd:+d}" if gd else "0", fg,
            (((120, 220, 150) if gd > 0 else (240, 120, 120) if gd < 0 else MUTED) + (al,)))
        num(d, (110 + x0, y + RH // 2 - 2), str(r["pts"]), fp, (GOLD if lead else WHITE) + (al,))
    return lay

def _fade(img, al):
    img = img.copy()
    img.putalpha(img.getchannel("A").point(lambda v: v * al // 255))
    return img

def scene_outro(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = ease(t / 0.6)
    al = int(255 * a)
    text(d, (W // 2, 800), "تابعونا لكل جديد", F("900Black", 92), WHITE + (al,))
    text(d, (W // 2, 950), "عن الكرة المغربية", F("700Bold", 64), GOLD + (al,))
    text(d, (W // 2, 1110), "شاركونا توقعاتكم في التعليقات", F("400Regular", 48), MUTED + (al,))
    return lay

# ---------- Zusammenbau ----------
def build_timeline(data):
    allg = [g for m in data["matches"] for side in ("home", "away") for g in m.get("scorers", {}).get(side, [])]
    full = all(isinstance(g, dict) and len(g.get("name", "").split()) >= 2 for g in allg)
    for m in data["matches"]:
        m["_names_mode"] = full
    tl = [(2.6, lambda t, du: scene_intro(data, t, du), "main")]
    ms = sorted(data["matches"], key=lambda m: bool(m.get("status")))  # beendete zuerst
    for i, m in enumerate(ms, 1):
        tl.append((2.8 if m.get("status") else 3.4, lambda t, du, m=m, i=i: scene_match(m, i, len(ms), t, du), "main"))
    if not data.get("table"):
        raise SystemExit("ABBRUCH: Tabelle fehlt – das Video wird ohne Tabelle nicht erstellt.")
    tl.append((5.4, lambda t, du: scene_table(data, t, du), "table"))
    tl.append((2.6, lambda t, du: scene_outro(data, t, du), "outro"))
    return tl

AUDIO_EXT = (".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac")
def _dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)

def pick_music(seed, total, bpm=112):
    """Echter Track aus music/ (rotierend nach Datum) + taktgenauer Startpunkt (4 Takte = 1 Schritt)."""
    files = sorted(f for f in glob.glob(os.path.join(MUSIC_DIR, "*")) if f.lower().endswith(AUDIO_EXT))
    if not files:
        return None, 0.0
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    track = files[h % len(files)]
    step = 4 * 4 * 60.0 / bpm                       # 4 Takte à 4 Schläge
    room = _dur(track) - total - 2.5                # Platz für den Ausschnitt
    n = int(room // step) + 1 if room > 0 else 1
    return track, ((h // len(files)) % n) * step if room > 0 else 0.0

def render(data, out):
    main_bg = table_background()  # einheitlicher Hintergrund für alle Szenen
    hdr = header_layer(data)
    base_main = main_bg.copy().convert("RGBA"); base_main.alpha_composite(hdr)
    base_tbl = table_background().convert("RGBA"); base_tbl.alpha_composite(hdr)
    tl = build_timeline(data)
    total = sum(d for d, _, _ in tl)
    track, start = pick_music(data.get("date_label", "") + str(data.get("round", "")), total)
    fades = f"afade=t=in:st=0:d=0.8,afade=t=out:st={total - 2.0:.2f}:d=2.0"
    afx = fades + ",volume=0.8"
    if track:
        a_in = ["-ss", f"{start:.2f}", "-stream_loop", "-1", "-i", track]
        afx = "loudnorm=I=-14:TP=-1.5:LRA=7," + fades   # Instagram/Facebook-Niveau
        print(f"Musik: {os.path.basename(track)} ab {start:.1f}s")
    else:
        music = os.path.join(BASE, "_music.wav")
        subprocess.run([sys.executable, os.path.join(BASE, "music.py"), f"{total:.2f}", music], check=True, stdout=subprocess.DEVNULL)
        a_in = ["-i", music]
        print("WARNUNG: keine Tracks in music/ – synthetischer Notbehelf")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"] + a_in + [
           "-t", f"{total:.2f}", "-af", afx,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for dur, fn, bgk in tl:
        for k in range(int(dur * FPS)):
            t = k / FPS
            if bgk == "table":
                base = Image.blend(base_main, base_tbl, ease(t / 0.6)) if t < 0.6 else base_tbl
            elif bgk == "outro":
                base = base_main
            else:
                base = base_main
            fr = base.copy()
            fr.alpha_composite(fn(t, dur))
            p.stdin.write(fr.convert("RGB").tobytes())
    p.stdin.close()
    p.wait()
    return total

if __name__ == "__main__":
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    if not data.get("table"):  # Tabelle immer aus der Ergebnisliste berechnen
        from standings import compute
        rows, rd, _ = compute()
        data["table"], data["table_round"] = rows, rd
    secs = render(data, sys.argv[2])
    print(f"OK {sys.argv[2]} {secs:.1f}s")
