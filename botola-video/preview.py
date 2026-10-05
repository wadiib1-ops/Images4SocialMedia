#!/usr/bin/env python3
"""Botola Pro: Vorschau-Video des kommenden Spieltags (Begegnungen), gleiches Design und gleiche Musik wie das Tagesvideo.

  python3 preview.py build fixtures.json     -> out/botola-vorschau-runde<N>.mp4, out/caption-vorschau.txt, out/summary-vorschau.json
  python3 preview.py check <N>               Exit 0 = Vorschau für Runde N schon gepostet, Exit 1 = noch nicht
  python3 preview.py mark <N> --note "..."   trägt Runde N in preview_log.json ein

fixtures.json:
{
  "round": 3,
  "date_range": "من 8 إلى 11 أكتوبر 2026",      # Anzeige im Intro
  "matches": [
    {"date": "2026-10-08", "time": "16:00", "home": "اتحاد تواركة", "away": "نهضة بركان"}, ...
  ]
}
Uhrzeiten = Ortszeit Marokko. Die Platzierungen vor dem Spiel kommen aus season_results.json.
"""
import json, os, sys, datetime, subprocess
from PIL import Image, ImageDraw
import render as R
from render import W, H, FPS, F, text, num, fit_font, club_badge, ease, GOLD, RED, WHITE, MUTED, CARD, GREEN_D
import standings, finalize

DAYS = finalize.WEEKDAYS
MONTHS = finalize.MONTHS


def day_label(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{DAYS[d.weekday()]} {d.day} {MONTHS[d.month - 1]}"


def pts_word(n):
    w = "نقطة" if n in (0, 1) or n >= 11 else "نقطتان" if n == 2 else "نقاط"
    return "نقطتان" if n == 2 else f"{n}\u200f {w}"


def scene_intro(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = ease(t / 0.6)
    y = int(820 + (1 - a) * 120)
    al = int(255 * a)
    text(d, (W // 2, y - 170), "البطولة الاحترافية", F("900Black", 104), WHITE + (al,))
    d.rounded_rectangle((W // 2 - 300, y - 40, W // 2 + 300, y + 70), 30, fill=RED + (al,))
    text(d, (W // 2, y + 12), f"الجولة {data['round']}", F("900Black", 72), WHITE + (al,))
    text(d, (W // 2, y + 170), data.get("date_range", ""), F("700Bold", 46), MUTED + (al,))
    b = ease((t - 0.5) / 0.6)
    text(d, (W // 2, y + 300), "برنامج المباريات", F("700Bold", 56), GOLD + (int(255 * b),))
    return lay


def scene_fixture(m, idx, total, pos, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    a = ease(t / 0.5)
    out = ease((t - (dur - 0.35)) / 0.35)
    off = int((1 - a) * W * 0.6 - out * W * 0.6)
    al = int(255 * a * (1 - out))
    card = Image.new("RGBA", (960, 1080), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, 959, 1079), 48, fill=CARD + (235,), outline=GOLD + (200,), width=4)
    cd.rounded_rectangle((330, -2, 630, 80), 24, fill=RED + (255,))
    text(cd, (480, 36), f"المباراة {idx}/{total}", F("700Bold", 40), WHITE)
    for name, x in ((m["home"], 720), (m["away"], 240)):  # Heim rechts (RTL)
        b = club_badge(name, 250)
        card.paste(b, (x - 125, 105), b)
        text(cd, (x, 405), name, fit_font("700Bold", 50, name, 400), WHITE)
    # Mitte: VS-Kreis zwischen den Wappen
    cd.ellipse((420, 170, 540, 290), fill=RED + (255,), outline=GOLD + (255,), width=4)
    num(cd, (480, 226), "VS", F("900Black", 52), WHITE)
    # Uhrzeit
    cd.rounded_rectangle((250, 470, 710, 660), 40, fill=GREEN_D + (255,), outline=GOLD + (255,), width=3)
    num(cd, (480, 552), m["time"], F("900Black", 120), WHITE)
    text(cd, (480, 720), day_label(m["date"]), F("700Bold", 50), GOLD)
    text(cd, (480, 785), "بتوقيت المغرب", F("400Regular", 34), MUTED)
    cd.line((80, 840, 880, 840), fill=GOLD + (120,), width=2)
    # Platzierung vor dem Spiel
    text(cd, (480, 885), "الترتيب قبل المباراة", F("700Bold", 32), MUTED)
    for name, x in ((m["home"], 720), (m["away"], 240)):
        p = pos[name]
        s = f"المركز {p['rank']}\u200f · {pts_word(p['pts'])}"
        cd.rounded_rectangle((x - 190, 930, x + 190, 1020), 26, fill=GREEN_D + (255,), outline=(92, 110, 100, 255), width=2)
        text(cd, (x, 973), s, fit_font("700Bold", 40, s, 350), WHITE)
    card.putalpha(card.getchannel("A").point(lambda v: v * al // 255))
    lay.paste(card, (W // 2 + off - 480, 400), card)
    return lay


def scene_overview(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    al0 = int(255 * ease(t / 0.5))
    text(d, (W // 2, 450), f"برنامج الجولة {data['round']}", F("900Black", 64), WHITE + (al0,))
    y, i = 540, 0
    last = None
    fn = F("700Bold", 34)
    for m in data["matches"]:
        if m["date"] != last:
            last = m["date"]
            ra = ease((t - 0.3 - i * 0.07) / 0.4); i += 1
            if ra > 0:
                al = int(255 * ra)
                d.rounded_rectangle((W // 2 - 220, y + 4, W // 2 + 220, y + 60), 18, fill=RED + (al,))
                text(d, (W // 2, y + 30), day_label(m["date"]), F("700Bold", 34), WHITE + (al,))
            y += 84
        ra = ease((t - 0.3 - i * 0.07) / 0.4); i += 1
        if ra > 0:
            al = int(255 * ra)
            x0 = int((1 - ra) * 360)
            d.rounded_rectangle((50 + x0, y, 1030 + x0, y + 80), 20, fill=(14, 30, 26, int(205 * ra)),
                                outline=(92, 110, 100, int(150 * ra)), width=2)
            for name, bx, tx, anc in ((m["home"], 985, 940, "rm"), (m["away"], 95, 140, "lm")):
                b = R._fade(club_badge(name, 56), al)
                lay.alpha_composite(b, (bx + x0 - 28, y + 12))
                text(d, (tx + x0, y + 38), name, fit_font("700Bold", 34, name, 300), WHITE + (al,), anc)
            d.rounded_rectangle((W // 2 - 70 + x0, y + 16, W // 2 + 70 + x0, y + 64), 14, fill=GREEN_D + (al,),
                                outline=GOLD + (al,), width=2)
            num(d, (W // 2 + x0, y + 38), m["time"], F("900Black", 34), GOLD + (al,))
        y += 100
    return lay


def scene_outro(data, t, dur):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    al = int(255 * ease(t / 0.6))
    text(d, (W // 2, 800), "من سيفوز؟", F("900Black", 100), WHITE + (al,))
    text(d, (W // 2, 950), "شاركونا توقعاتكم في التعليقات", F("700Bold", 56), GOLD + (al,))
    text(d, (W // 2, 1110), "تابعونا لكل جديد عن الكرة المغربية", F("400Regular", 46), MUTED + (al,))
    return lay


PREVIEW_LOG = os.path.join(finalize.BASE, "preview_log.json")


def caption(data):
    L = [f"🔥 برنامج الجولة {data['round']} من البطولة الاحترافية إنوي", f"📅 {data.get('date_range', '')} (بتوقيت المغرب)", ""]
    last = None
    for m in data["matches"]:
        if m["date"] != last:
            if last:
                L.append("")
            last = m["date"]
            L.append(day_label(m["date"]))
        L.append(f"⚽ {m['time']} {m['home']} × {m['away']}")
    L += ["", data.get("question") or "💬 من سيفوز؟ شاركونا توقعاتكم في التعليقات", ""]
    L.append("#البطولة_الاحترافية #البطولة_الاحترافية_إنوي #كرة_القدم_المغربية #الدوري_المغربي #Botola #BotolaPro #Morocco")
    return "\n".join(L)


def build(src):
    data = json.load(open(src, encoding="utf-8"))
    os.makedirs(finalize.OUT, exist_ok=True)
    out = os.path.join(finalize.OUT, f"botola-vorschau-runde{data['round']}.mp4")
    secs = main(src, out, data)
    cap = caption(data)
    open(os.path.join(finalize.OUT, "caption-vorschau.txt"), "w", encoding="utf-8").write(cap)
    summ = {"round": data["round"], "video": out, "seconds": round(secs, 1), "matches": len(data["matches"]),
            "caption_file": os.path.join(finalize.OUT, "caption-vorschau.txt")}
    finalize.save(os.path.join(finalize.OUT, "summary-vorschau.json"), summ)
    print(json.dumps(summ, ensure_ascii=False, indent=1))


def main(src, out, data=None):
    data = data or json.load(open(src, encoding="utf-8"))
    amap = finalize.alias_map()
    teams = json.load(open(finalize.LEDGER, encoding="utf-8"))["teams"]
    for m in data["matches"]:
        m["home"], m["away"] = finalize.canon(m["home"], amap, teams), finalize.canon(m["away"], amap, teams)
    data["matches"].sort(key=lambda m: (m["date"], m["time"]))
    rows, _, _ = standings.compute()
    pos = {r["team"]: {"rank": i, "pts": r["pts"]} for i, r in enumerate(rows, 1)}
    n = len(data["matches"])
    tl = [(2.6, lambda t, du: scene_intro(data, t, du), "main")]
    for i, m in enumerate(data["matches"], 1):
        tl.append((3.2, lambda t, du, m=m, i=i: scene_fixture(m, i, n, pos, t, du), "main"))
    tl.append((7.5, lambda t, du: scene_overview(data, t, du), "table"))
    tl.append((2.8, lambda t, du: scene_outro(data, t, du), "main"))
    # Renderer des Tagesvideos wiederverwenden (gleicher Hintergrund, Kopf, Musik, Lautheit)
    R.build_timeline = lambda _d: tl
    data.setdefault("page_name", "كرة القدم المغربية")
    data["date_label"] = data.get("date_range", "")
    data["table"] = rows
    secs = R.render(data, out)
    print(f"OK {out} {secs:.1f}s")
    return secs


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "build":
        build(sys.argv[2])
    elif cmd == "check":
        log = finalize.load(PREVIEW_LOG, {"posted": []})
        sys.exit(0 if any(p["round"] == int(sys.argv[2]) for p in log["posted"]) else 1)
    elif cmd == "mark":
        log = finalize.load(PREVIEW_LOG, {"posted": []})
        note = sys.argv[4] if len(sys.argv) > 4 and sys.argv[3] == "--note" else ""
        if not any(p["round"] == int(sys.argv[2]) for p in log["posted"]):
            log["posted"].append({"round": int(sys.argv[2]), "at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "note": note})
            finalize.save(PREVIEW_LOG, log)
        print("OK Runde", sys.argv[2])
    else:
        sys.exit("Befehle: build | check | mark")
