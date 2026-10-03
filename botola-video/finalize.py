#!/usr/bin/env python3
"""Botola-Tagesvideo: Daten prüfen -> Ergebnisliste fortschreiben -> Tabelle -> Video -> Bildunterschrift.

  python3 finalize.py build day.json          erzeugt out/botola-<datum>.mp4, out/caption.txt, out/summary.json
  python3 finalize.py check-posted 2026-10-04 Exit 0 = für diesen LAUF-Tag schon gepostet, Exit 1 = noch nicht
  python3 finalize.py mark-posted 2026-10-04 --note "..."   trägt den Lauf-Tag in posted_log.json ein
(Der Lauf-Tag ist das Berliner Datum, an dem der 00:30-Job läuft – nicht das Spieldatum. So wird ein spätes Spiel,
 das erst nach dem Lauf endet, am Folgetag trotzdem berichtet.)

day.json (vom täglichen Lauf geschrieben, nach Prüfung gegen mind. 2 Quellen):
{
  "date": "2026-10-03",                  # Spieltag (Datum der meisten Spiele) – nur für die Anzeige im Video
  "run_date": "2026-10-04",              # optional; Standard: heutiges Berliner Datum (Dateiname, Release-Tag, Doppelpost-Sperre)
  "round": 2,
  "matches": [
    {"home": "حسنية أكادير", "away": "المغرب الفاسي", "score": [1, 2],
     "scorers": {"home": [{"name": "عماد الرياحي", "min": "56' ض.ج"}], "away": [...]},
     "note": "optional, kurzer arabischer Hinweis"},
    {"home": "الرجاء الرياضي", "away": "نهضة الزمامرة", "status": "live"},        # live | postponed | not_played
    {"home": "نهضة بركان", "away": "الجيش الملكي", "status": "postponed"}
  ]
}
Torschützen nur mit vollem Namen (Vor- und Nachname) angeben, sonst zeigt das Video überall nur Minuten.
"""
import argparse, datetime, json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(BASE, "season_results.json")
POSTED = os.path.join(BASE, "posted_log.json")
OUT = os.path.join(BASE, "out")

WEEKDAYS = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"]
STATUS_TXT = {"live": "لم تنتهِ بعد", "postponed": "مؤجلة", "not_played": "لم تُلعب بعد"}
STATUS_ICON = {"live": "⏳", "postponed": "⏸️", "not_played": "🕒"}


def arabic_date(d: datetime.date) -> str:
    return f"{WEEKDAYS[d.weekday()]} {d.day} {MONTHS[d.month - 1]} {d.year}"


def load(path, default=None):
    if not os.path.exists(path):
        return default
    return json.load(open(path, encoding="utf-8"))


def save(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write("\n")


def alias_map():
    """Alle bekannten Schreibweisen -> kanonischer arabischer Vereinsname (= erster Alias)."""
    m = {}
    for _fn, aliases in load(os.path.join(BASE, "wappen_map.json"), {}).items():
        for a in aliases:
            m[a.strip().lower()] = aliases[0]
    return m


def canon(name, amap, teams):
    c = amap.get(name.strip().lower(), name.strip())
    if c not in teams:
        sys.exit(f"FEHLER: unbekannter Verein '{name}'. Erlaubt: {', '.join(teams)}")
    return c


def build(day_path):
    day = load(day_path)
    ledger = load(LEDGER)
    teams = ledger["teams"]
    amap = alias_map()
    date = datetime.date.fromisoformat(day["date"])
    from zoneinfo import ZoneInfo
    run_date = day.get("run_date") or datetime.datetime.now(ZoneInfo("Europe/Berlin")).date().isoformat()
    default_round = int(day["round"])

    finished, unfinished = [], []
    for m in day["matches"]:
        m = dict(m)
        m["home"], m["away"] = canon(m["home"], amap, teams), canon(m["away"], amap, teams)
        if m["home"] == m["away"]:
            sys.exit("FEHLER: Heim und Gast sind gleich")
        m["round"] = int(m.get("round", default_round))
        if m.get("status"):
            if m["status"] not in STATUS_TXT:
                sys.exit(f"FEHLER: unbekannter Status {m['status']}")
            unfinished.append(m)
            continue
        sh, sa = m["score"]
        if not all(isinstance(x, int) and x >= 0 for x in (sh, sa)):
            sys.exit(f"FEHLER: ungültiges Ergebnis {m['score']}")
        for side, goals in (("home", sh), ("away", sa)):
            n = len(m.get("scorers", {}).get(side, []))
            if n > goals:
                sys.exit(f"FEHLER: {m['home']}–{m['away']}: mehr Torschützen ({n}) als Tore ({goals}) für {side}")
            if n < goals:
                print(f"WARNUNG: {m['home']}–{m['away']}: nur {n} von {goals} Torschützen ({side}) bekannt", file=sys.stderr)
        finished.append(m)
    if not finished:
        sys.exit("ABBRUCH: kein beendetes Spiel – es wird kein Video erstellt.")

    # Ergebnisliste fortschreiben (idempotent; Konflikte brechen ab)
    known = {(r["round"], r["home"], r["away"]): r for r in ledger["results"]}
    added = 0
    for m in finished:
        key = (m["round"], m["home"], m["away"])
        if key in known:
            if known[key]["score"] != m["score"]:
                sys.exit(f"KONFLIKT: {key} steht mit {known[key]['score']} in der Liste, neu gemeldet {m['score']}")
        else:
            ledger["results"].append({"round": m["round"], "home": m["home"], "away": m["away"], "score": m["score"]})
            added += 1
    done = {(m["round"], m["home"], m["away"]) for m in finished}
    pend = [p for p in ledger.get("pending", []) if (p["round"], p["home"], p["away"]) not in done]
    for m in unfinished:
        pend = [p for p in pend if (p["round"], p["home"], p["away"]) != (m["round"], m["home"], m["away"])]
        pend.append({"round": m["round"], "home": m["home"], "away": m["away"], "status": m["status"]})
    ledger["pending"] = pend
    save(LEDGER, ledger)

    import standings, render
    rows, table_round, _ = standings.compute(LEDGER)
    played = sum(r["played"] for r in rows)
    assert played == 2 * len(ledger["results"]), "Tabelle passt nicht zur Ergebnisliste"

    ordered = finished + unfinished
    data = {
        "demo": False,
        "page_name": "كرة القدم المغربية",
        "round": max(m["round"] for m in finished),
        "date_label": arabic_date(date),
        "matches": [
            {k: v for k, v in m.items() if k in ("home", "away", "score", "scorers", "note", "status")} for m in ordered
        ],
        "table": rows,
        "table_round": table_round,
    }
    os.makedirs(OUT, exist_ok=True)
    video = os.path.join(OUT, f"botola-{run_date}.mp4")
    secs = render.render(data, video)

    # Bildunterschrift (arabisch, ohne Links)
    L = [f"🏆 نتائج الجولة {data['round']} من البطولة الاحترافية إنوي", f"📅 {data['date_label']}", ""]
    for m in finished:
        L.append(f"⚽ {m['home']} {m['score'][0]} - {m['score'][1]} {m['away']}")
    if unfinished:
        L.append("")
        for m in unfinished:
            L.append(f"{STATUS_ICON[m['status']]} {m['home']} × {m['away']}: {STATUS_TXT[m['status']]}")
    L += ["", f"📊 الترتيب العام بعد الجولة {table_round} في الفيديو", "💬 شاركونا توقعاتكم في التعليقات", ""]
    tags = ["#البطولة_الاحترافية", "#البطولة_الاحترافية_إنوي", "#كرة_القدم_المغربية", "#الدوري_المغربي", "#Botola", "#BotolaPro", "#Morocco"]
    for m in finished:
        for t in (m["home"], m["away"]):
            tag = "#" + t.replace(" ", "_")
            if tag not in tags:
                tags.append(tag)
    L.append(" ".join(tags))
    caption = "\n".join(L)
    open(os.path.join(OUT, "caption.txt"), "w", encoding="utf-8").write(caption)

    summary = {
        "match_date": date.isoformat(), "run_date": run_date, "round": data["round"], "video": video, "seconds": round(secs, 1),
        "caption_file": os.path.join(OUT, "caption.txt"), "release_tag": f"botola-{run_date}",
        "finished": len(finished), "unfinished": len(unfinished), "ledger_added": added,
        "top3": [f"{r['team']} {r['pts']}" for r in rows[:3]],
    }
    save(os.path.join(OUT, "summary.json"), summary)
    print(json.dumps(summary, ensure_ascii=False, indent=1))


def check_posted(run_date):
    log = load(POSTED, {"posted": []})
    sys.exit(0 if any(p["date"] == run_date for p in log["posted"]) else 1)


def mark_posted(date, note):
    log = load(POSTED, {"posted": []})
    if not any(p["date"] == date for p in log["posted"]):
        log["posted"].append({"date": date, "at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "note": note})
        save(POSTED, log)
    print("OK", date)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build"); b.add_argument("day_json")
    c = sub.add_parser("check-posted"); c.add_argument("date")
    m = sub.add_parser("mark-posted"); m.add_argument("date"); m.add_argument("--note", default="")
    a = ap.parse_args()
    if a.cmd == "build":
        build(a.day_json)
    elif a.cmd == "check-posted":
        check_posted(a.date)
    else:
        mark_posted(a.date, a.note)
