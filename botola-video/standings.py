#!/usr/bin/env python3
"""Berechnet die Tabelle aus season_results.json (Punkte, Tordifferenz, erzielte Tore)."""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))

def compute(path=None):
    d = json.load(open(path or os.path.join(BASE, "season_results.json"), encoding="utf-8"))
    t = {n: dict(team=n, played=0, w=0, d=0, l=0, gf=0, ga=0, pts=0) for n in d["teams"]}
    for r in d["results"]:
        h, a = t[r["home"]], t[r["away"]]
        gh, ga = r["score"]
        for x, f, c in ((h, gh, ga), (a, ga, gh)):
            x["played"] += 1; x["gf"] += f; x["ga"] += c
        if gh > ga: h["w"] += 1; a["l"] += 1; h["pts"] += 3
        elif gh < ga: a["w"] += 1; h["l"] += 1; a["pts"] += 3
        else: h["d"] += 1; a["d"] += 1; h["pts"] += 1; a["pts"] += 1
    rows = list(t.values())
    for x in rows: x["gd"] = x["gf"] - x["ga"]
    # Gleichstand: Punkte, Tordifferenz, erzielte Tore (Näherung – offizielle Regel kann abweichen)
    rows.sort(key=lambda x: (-x["pts"], -x["gd"], -x["gf"], x["team"]))
    last_round = max(r["round"] for r in d["results"])
    return rows, last_round, d.get("pending", [])

if __name__ == "__main__":
    rows, rd, pend = compute()
    print(f"Tabelle nach Runde {rd}")
    for i, x in enumerate(rows, 1):
        print(f"{i:2d} {x['team']:<24} {x['played']} {x['w']}-{x['d']}-{x['l']} {x['gf']}:{x['ga']} {x['gd']:+d} {x['pts']}")
    print("offen:", pend)
