#!/usr/bin/env python3
"""Erzeugt eine eigene, lizenzfreie Pop-Hintergrundmusik (synthetisiert, kein Fremdmaterial).

Stil: moderner Pop, 120 BPM, Four-on-the-floor-Kick, Claps auf 2 und 4, Hi-Hats,
Synth-Bass, Akkordfolge I–V–vi–IV (C–G–Am–F), helles Arpeggio + Hook-Melodie.
Aufruf: python3 music.py <sekunden> out.wav
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
rng = np.random.default_rng(11)

def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)

def env(n, a=0.005, d=0.2, s=0.0, r=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * (s + (1 - s) * np.exp(-t / d))
    tail = int(0.03 * SR)
    if n > tail:
        e[-tail:] *= np.linspace(1, 0, tail)
    return e

def kick(n):
    t = np.arange(n) / SR
    f = 150 * np.exp(-t * 30) + 48
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16) * 1.0

def clap(n):
    noise = rng.standard_normal(n)
    e = env(n, 0.001, 0.09)
    for k in (0.008, 0.016):  # mehrfache Anschläge wie beim Handclap
        i = int(k * SR)
        e[i:] += env(n - i, 0.001, 0.06) * 0.6
    hp = noise - np.concatenate([[0], noise[:-1]])
    return hp * e * 0.22

def hat(n, open_=False):
    noise = rng.standard_normal(n)
    hp = noise - np.concatenate([[0], noise[:-1]])
    return hp * env(n, 0.001, 0.12 if open_ else 0.025) * 0.10

def saw(freq, n, detune=0.006):
    t = np.arange(n) / SR
    s = 0
    for dt in (-detune, 0, detune):
        ph = (freq * (1 + dt) * t) % 1.0
        s = s + (2 * ph - 1)
    return s / 3

from scipy.signal import lfilter
def lowpass(x, alpha):
    return lfilter([alpha], [1, alpha - 1], x)

def synth_bass(midi, n):
    t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * note(midi) * t)) * 0.5 + np.sin(2 * np.pi * note(midi) * t)
    return lowpass(s * env(n, 0.003, 0.18, 0.5), 0.08) * 0.38

def pad(midis, n):
    s = sum(saw(note(m), n, 0.008) for m in midis) / len(midis)
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.15) * np.minimum(1, (n / SR - t) / 0.15)
    return lowpass(s, 0.05) * fade * 0.16

def pluck(midi, n):
    s = saw(note(midi), n, 0.003) * 0.6 + np.sin(2 * np.pi * note(midi) * np.arange(n) / SR) * 0.4
    return lowpass(s, 0.25) * env(n, 0.002, 0.12) * 0.22

def lead(midi, n):
    t = np.arange(n) / SR
    vib = np.sin(2 * np.pi * 5.5 * t) * 0.004
    f = note(midi) * (1 + vib)
    ph = np.cumsum(f) / SR
    s = np.sin(2 * np.pi * ph) + 0.35 * np.sin(4 * np.pi * ph) + 0.15 * (2 * (ph % 1) - 1)
    return s * env(n, 0.01, 0.35, 0.55) * 0.20

# C–G–Am–F
CHORDS = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]
BASS = [36, 43, 45, 41]
# Hook (Viertel/Achtel), MIDI-Noten, None = Pause; ein Takt = 8 Achtel
HOOK = [
    [76, None, 76, 74, 72, None, 74, None],
    [74, None, 71, None, 74, 76, None, None],
    [72, None, 72, 74, 76, None, 79, None],
    [77, None, 76, None, 74, None, 72, None],
]

def build(seconds):
    n = int(seconds * SR) + SR
    mix = np.zeros(n)
    def add(sig, t0):
        i = int(t0 * SR)
        j = min(n, i + len(sig))
        if 0 <= i < n:
            mix[i:j] += sig[: j - i]
    bar_len = BEAT * 4
    bars = int(seconds / bar_len) + 1
    for b in range(bars):
        t0 = b * bar_len
        ci = b % 4
        intro = b < 1
        # Drums
        for k in range(4):
            add(kick(int(0.35 * SR)), t0 + k * BEAT)
            if not intro and k in (1, 3):
                add(clap(int(0.25 * SR)), t0 + k * BEAT)
        for k in range(8):
            add(hat(int(0.2 * SR), open_=(k % 2 == 1 and k == 7)), t0 + k * BEAT / 2 + (BEAT / 2 if False else 0))
        # Bass: Achtel mit Pumpen
        for k in range(8):
            add(synth_bass(BASS[ci] + (12 if k in (3, 7) else 0), int(BEAT / 2 * SR * 0.9)), t0 + k * BEAT / 2)
        # Pad
        add(pad(CHORDS[ci], int(bar_len * SR)), t0)
        # Arpeggio Sechzehntel
        arp = list(CHORDS[ci]) + [CHORDS[ci][0] + 12]
        for k in range(16):
            add(pluck(arp[k % 4] + 12, int(BEAT / 4 * SR * 1.5)), t0 + k * BEAT / 4)
        # Hook ab Takt 3
        if b >= 2:
            for k, m in enumerate(HOOK[ci]):
                if m is not None:
                    add(lead(m, int(BEAT / 2 * SR * 1.8)), t0 + k * BEAT / 2)
    mix = mix[: int(seconds * SR)]
    # Sidechain-Pumpen (Pop-typisch): leiser direkt nach jedem Kick
    t = np.arange(len(mix)) / SR
    phase = (t % BEAT) / BEAT
    duck = 0.55 + 0.45 * np.minimum(1, phase / 0.35)
    mix *= duck
    mix *= np.minimum(1, t / 0.5) * np.minimum(1, (seconds - t) / 2.0)
    mix = np.tanh(mix * 1.4)
    mix /= np.max(np.abs(mix)) + 1e-9
    return mix * 0.45

def save(sig, path):
    stereo = np.stack([sig, np.roll(sig, 180) * 0.97], axis=1)
    data = (stereo * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())

if __name__ == "__main__":
    secs = float(sys.argv[1])
    save(build(secs), sys.argv[2])
    print("OK", sys.argv[2])
