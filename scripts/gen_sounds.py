"""Generates EMBERDEEP sound effects + soundtrack as 16-bit mono WAVs (procedural, royalty-free)."""
import numpy as np
import wave
from pathlib import Path

SR = 22050
OUT = Path("/app/frontend/assets/sounds")
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, decay=6.0):
    x = np.arange(n) / SR
    att = np.clip(x / max(a, 1e-4), 0, 1)
    return att * np.exp(-x * decay)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    n = int(SR * 0.004)
    x[-n:] *= np.linspace(1, 0, n)
    data = (x * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


def sweep(f0, f1, d, shape="square"):
    tt = t(d)
    f = np.geomspace(f0, f1, len(tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == "square":
        return np.sign(np.sin(ph)) * 0.6 + np.sin(ph) * 0.4
    if shape == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    return np.sin(ph)


# Laser: quick descending zap
x = sweep(1800, 320, 0.11, "square") * env(int(SR * 0.11), 0.002, 28)
save("laser", lowpass(x, 5000), 0.55)

# Explosion: filtered noise burst with low thump
d = 0.55
n = rng.standard_normal(int(SR * d))
x = lowpass(n, 1400) * env(len(n), 0.003, 7) + sweep(140, 40, d, "sine") * env(len(n), 0.002, 9) * 0.8
save("explosion", x, 0.8)

# Boss explosion: long, deep, rumbling
d = 1.6
n = rng.standard_normal(int(SR * d))
x = lowpass(n, 700) * env(len(n), 0.005, 2.6) + sweep(90, 28, d, "sine") * env(len(n), 0.003, 2.2) * 1.2
x += lowpass(rng.standard_normal(len(n)), 3000) * env(len(n), 0.001, 14) * 0.5
save("boss_explosion", x, 0.95)

# Hit (player damaged): crunchy thud
d = 0.2
x = sweep(320, 60, d, "square") * env(int(SR * d), 0.001, 18) + lowpass(rng.standard_normal(int(SR * d)), 2500) * env(int(SR * d), 0.001, 25)
save("hit", x, 0.7)

# Boss warning: two-tone klaxon x3
parts = []
for _ in range(3):
    for f in (440, 330):
        tt = t(0.22)
        s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
        parts.append(lowpass(s * env(len(tt), 0.01, 3), 2600))
    parts.append(np.zeros(int(SR * 0.06)))
save("boss_warning", np.concatenate(parts), 0.7)

# Level up: rising arpeggio
notes = [523.25, 659.25, 783.99, 1046.5]
parts = []
for f in notes:
    tt = t(0.11)
    parts.append((np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt)) * env(len(tt), 0.003, 10))
tail = t(0.35)
parts.append((np.sin(2 * np.pi * 1046.5 * tail) + 0.3 * np.sin(2 * np.pi * 1568 * tail)) * env(len(tail), 0.003, 6))
save("levelup", np.concatenate(parts), 0.6)

# Pickup: tiny glassy blip
tt = t(0.07)
x = np.sin(2 * np.pi * np.geomspace(1200, 2200, len(tt)) * tt) * env(len(tt), 0.001, 40)
save("pickup", x, 0.35)

# Soundtrack: dark ember ambient loop (A minor), 96 BPM, 12 bars
bpm = 96
beat = 60 / bpm
bars = 12
total = int(SR * beat * 4 * bars)
mix = np.zeros(total)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = ["Am", "Am", "F", "F", "Dm", "Dm", "E", "E", "Am", "Am", "F", "E"]
chords = {"Am": [57, 60, 64], "F": [53, 57, 60], "Dm": [50, 53, 57], "E": [52, 56, 59]}

for bi, name in enumerate(prog):
    start = int(bi * 4 * beat * SR)
    blen = int(4 * beat * SR)
    tt = np.arange(blen) / SR
    # Pad: detuned saws, slow swell
    pad = np.zeros(blen)
    for m in chords[name]:
        for det in (-0.12, 0.12):
            f = mtof(m) * 2 ** (det / 12)
            pad += 2 * ((f * tt) % 1) - 1
    sw = np.minimum(1, tt / 0.8) * np.minimum(1, (blen / SR - tt) / 0.5)
    mix[start:start + blen] += lowpass(pad, 900) * sw * 0.06
    # Bass pulse on every beat
    root = chords[name][0] - 12
    for k in range(4):
        s = start + int(k * beat * SR)
        bl = int(beat * SR * 0.9)
        bt = np.arange(bl) / SR
        b = np.tanh(np.sin(2 * np.pi * mtof(root) * bt) * 2) * env(bl, 0.004, 4.5)
        mix[s:s + bl] += b * 0.22
    # Kick on 1 and 3
    for k in (0, 2):
        s = start + int(k * beat * SR)
        kl = int(SR * 0.3)
        kick = sweep(110, 38, 0.3, "sine") * env(kl, 0.001, 12)
        mix[s:s + kl] += kick * 0.35
    # Arp: eighth notes over chord tones, two octaves up
    tones = [m + 12 for m in chords[name]] + [chords[name][0] + 24]
    for k in range(8):
        s = start + int(k * beat / 2 * SR)
        al = int(SR * 0.3)
        at = np.arange(al) / SR
        f = mtof(tones[(k + bi) % len(tones)])
        a = (np.sin(2 * np.pi * f * at) + 0.25 * np.sin(2 * np.pi * f * 3 * at)) * env(al, 0.002, 9)
        mix[s:s + al] += a * 0.07
    # Hat on offbeats
    for k in range(4):
        s = start + int((k + 0.5) * beat * SR)
        hl = int(SR * 0.04)
        h = rng.standard_normal(hl) * env(hl, 0.0005, 80)
        mix[s:s + hl] += (h - lowpass(h, 6000)) * 0.08

# simple echo for space
delay = int(beat * 0.75 * SR)
echo = np.zeros_like(mix)
echo[delay:] = mix[:-delay] * 0.28
mix = mix + echo
save("music", mix, 0.8)
print("done", sorted(p.name for p in OUT.iterdir()))
