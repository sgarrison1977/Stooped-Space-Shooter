"""Generates one sound pack per UI style (7 sfx + music loop) into assets/sounds/<style>/ and
writes src/game/soundPacks.ts. 'ember' keeps the original files in assets/sounds/ (gen_sounds.py)."""
import numpy as np, wave
from pathlib import Path

SR = 22050
MSR = 16000  # music sample rate (keeps loops small)
ROOT = Path("/app/frontend/assets/sounds")
rng = np.random.default_rng(11)
SFX = ["laser", "explosion", "boss_explosion", "hit", "boss_warning", "levelup", "pickup"]


def t(d, sr=SR): return np.arange(int(sr * d)) / sr
def env(n, a=0.005, decay=6.0, sr=SR):
    x = np.arange(n) / sr
    return np.clip(x / max(a, 1e-4), 0, 1) * np.exp(-x * decay)
def noise(d, sr=SR): return rng.standard_normal(int(sr * d))
def lp(x, cut, sr=SR):
    a = np.exp(-2 * np.pi * cut / sr); y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc = (1 - a) * v + a * acc; y[i] = acc
    return y
def hp(x, cut, sr=SR): return x - lp(x, cut, sr)
def osc(f, d, shape="sine", sr=SR):
    tt = t(d, sr); f = np.broadcast_to(f, tt.shape) if np.ndim(f) else np.full(tt.shape, f)
    ph = 2 * np.pi * np.cumsum(f) / sr
    if shape == "square": return np.sign(np.sin(ph))
    if shape == "saw": return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if shape == "tri": return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
    return np.sin(ph)
def sweep(f0, f1, d, shape="sine", sr=SR): return osc(np.geomspace(f0, f1, int(sr * d)), d, shape, sr)
def crush(x, bits=4, hold=4):
    q = np.round(x * 2 ** bits) / 2 ** bits
    return np.repeat(q[::hold], hold)[: len(x)]
def cat(*xs): return np.concatenate(xs)
def sil(d): return np.zeros(int(SR * d))
def mixn(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def note(f, d, shape="sine", decay=8, a=0.003): x = osc(f, d, shape); return x * env(len(x), a, decay)
def save(path, x, gain=0.85, sr=SR):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    n = int(sr * 0.004); x[-n:] *= np.linspace(1, 0, n)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes())
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)


def music(bpm, prog, lead="sine", bass="sine", drums="soft", arp_oct=12, swing=0.0, pad=0.0, bars=8):
    beat = 60 / bpm; total = int(MSR * beat * 4 * bars); mix = np.zeros(total + MSR)
    for bi in range(bars):
        ch = prog[bi % len(prog)]; start = int(bi * 4 * beat * MSR)
        if pad:
            bl = int(4 * beat * MSR); p = sum(osc(mtof(m), bl / MSR, "saw", MSR) for m in ch)
            mix[start:start + bl] += lp(p, 800, MSR) * pad
        for k in range(4):  # bass on beats
            s = start + int(k * beat * MSR); d = beat * 0.85
            b = osc(mtof(ch[0] - 12), d, bass, MSR) * env(int(MSR * d), 0.004, 5, MSR)
            mix[s:s + len(b)] += b * 0.25
        tones = [m + arp_oct for m in ch] + [ch[0] + arp_oct + 12]
        for k in range(8):  # arp eighths
            s = start + int((k + (swing if k % 2 else 0)) * beat / 2 * MSR); d = 0.28
            a = osc(mtof(tones[(k + bi) % len(tones)]), d, lead, MSR) * env(int(MSR * d), 0.002, 10, MSR)
            mix[s:s + len(a)] += a * 0.09
        for k in range(4):  # drums
            s = start + int(k * beat * MSR)
            if drums == "march" or k % 2 == 0 or drums == "four":
                kk = sweep(110, 40, 0.25, "sine", MSR) * env(int(MSR * 0.25), 0.001, 12, MSR); mix[s:s + len(kk)] += kk * 0.35
            if drums == "march":
                for r in range(3):
                    sn = noise(0.06, MSR) * env(int(MSR * 0.06), 0.0005, 40, MSR); o = s + int(r * beat / 3 * MSR); mix[o:o + len(sn)] += hp(sn, 1500, MSR) * 0.12
            elif drums != "none":
                h = noise(0.03, MSR) * env(int(MSR * 0.03), 0.0005, 90, MSR); o = s + int(beat / 2 * MSR); mix[o:o + len(h)] += hp(h, 5000, MSR) * 0.07
    return mix[:total]


C, F, G, Am, Dm, Em, E = [48, 52, 55], [53, 57, 60], [55, 59, 62], [57, 60, 64], [50, 53, 57], [52, 55, 59], [52, 56, 59]

PACKS = {
    "cartoon": dict(
        laser=sweep(600, 1500, 0.14) * (1 + 0.2 * osc(30, 0.14)) * env(int(SR * 0.14), 0.002, 12),
        explosion=sweep(300, 70, 0.3) * env(int(SR * 0.3), 0.001, 9) + lp(noise(0.3), 1200) * env(int(SR * 0.3), 0.001, 14) * 0.6,
        boss_explosion=mixn(cat(sweep(1800, 200, 0.7) * 0.5, sil(0.05)) * 0.6, cat(sil(0.4), lp(noise(0.35), 800) * env(int(SR * 0.35), 0.001, 5))),
        hit=osc(np.geomspace(500, 160, int(SR * 0.3)) * (1 + 0.3 * osc(25, 0.3)), 0.3) * env(int(SR * 0.3), 0.001, 8),
        boss_warning=cat(*[cat(lp(osc(220 * (1 + 0.03 * osc(7, 0.25)), 0.25, "saw"), 1500) * env(int(SR * 0.25), 0.01, 3), sil(0.08)) for _ in range(3)]),
        levelup=cat(*[note(mtof(m), 0.1, "sine", 14) + 0.3 * note(mtof(m) * 4, 0.1, "sine", 30) for m in (72, 76, 79, 84)], note(mtof(88), 0.4, "sine", 6)),
        pickup=sweep(900, 1700, 0.06) * env(int(SR * 0.06), 0.001, 30),
        music=music(120, [C, F, G, C], "tri", "square", "soft", 24, 0.15),
    ),
    "retro": dict(
        laser=crush(sweep(1400, 200, 0.12, "square"), 3, 3) * env(int(SR * 0.12), 0.001, 18),
        explosion=crush(lp(noise(0.45), 2500), 3, 8) * env(int(SR * 0.45), 0.001, 7),
        boss_explosion=crush(lp(noise(1.4), 1500), 3, 12) * env(int(SR * 1.4), 0.002, 2.5),
        hit=crush(sweep(300, 50, 0.18, "square"), 3, 4) * env(int(SR * 0.18), 0.001, 14),
        boss_warning=cat(*[cat(note(880, 0.09, "square", 2), note(660, 0.09, "square", 2)) for _ in range(5)]),
        levelup=cat(*[note(mtof(m), 0.07, "square", 6) for m in (72, 76, 79, 84, 79, 84)], note(mtof(88), 0.3, "square", 4)),
        pickup=cat(note(988, 0.05, "square", 4), note(1319, 0.12, "square", 10)),
        music=music(140, [Am, F, C, G], "square", "tri", "soft", 12),
    ),
    "racing": dict(
        laser=lp(sweep(900, 250, 0.1, "saw"), 3000) * env(int(SR * 0.1), 0.001, 20) + hp(noise(0.1), 3000) * env(int(SR * 0.1), 0.001, 30) * 0.4,
        explosion=lp(noise(0.5), 1000) * env(int(SR * 0.5), 0.002, 6) + sweep(120, 40, 0.5) * env(int(SR * 0.5), 0.001, 8),
        boss_explosion=lp(noise(1.5), 600) * env(int(SR * 1.5), 0.004, 2.4) + sweep(80, 25, 1.5) * env(int(SR * 1.5), 0.002, 2),
        hit=sum(osc(f, 0.25) for f in (523, 1187, 1730)) * env(int(SR * 0.25), 0.0005, 16),
        boss_warning=cat(sweep(500, 1200, 0.45), sweep(1200, 500, 0.45), sweep(500, 1200, 0.45)) * 0.8,
        levelup=cat(*[lp(sweep(180 * 1.4 ** i, 420 * 1.4 ** i, 0.18, "saw"), 2500) * env(int(SR * 0.18), 0.003, 3) for i in range(3)]),
        pickup=hp(noise(0.03), 4000) * env(int(SR * 0.03), 0.0005, 80) + note(2000, 0.03, "sine", 60),
        music=music(128, [Am, Am, F, G], "saw", "saw", "four", 12),
    ),
    "notebook": dict(
        laser=lp(hp(noise(0.09), 2500), 7000) * env(int(SR * 0.09), 0.001, 25) * (0.6 + 0.4 * np.abs(osc(60, 0.09))),
        explosion=cat(*[lp(noise(0.04), 4000) * env(int(SR * 0.04), 0.0005, 50) for _ in range(6)]) * 0.9,
        boss_explosion=mixn(cat(*[lp(noise(0.05), 3500) * env(int(SR * 0.05), 0.0005, 40) * (1 - i / 22) for i in range(20)]), cat(sweep(90, 35, 0.6) * env(int(SR * 0.6), 0.002, 4), sil(0.4))),
        hit=lp(noise(0.22), 900) * env(int(SR * 0.22), 0.002, 12),
        boss_warning=cat(*[cat(hp(noise(0.015), 2000) * env(int(SR * 0.015), 0.0002, 200), sil(0.11)) for _ in range(8)]),
        levelup=cat(*[note(mtof(m), 0.14, "sine", 9) + 0.2 * note(mtof(m) * 3, 0.14, "sine", 20) for m in (67, 69, 72, 76)], note(mtof(79), 0.4, "sine", 5)),
        pickup=hp(noise(0.05), 3000) * env(int(SR * 0.05), 0.001, 45),
        music=music(84, [C, Am, F, G], "sine", "tri", "soft", 24, 0.1),
    ),
    "military": dict(
        laser=hp(noise(0.08), 800) * env(int(SR * 0.08), 0.0005, 45) + sweep(200, 80, 0.08) * env(int(SR * 0.08), 0.0005, 30),
        explosion=lp(noise(0.6), 700) * env(int(SR * 0.6), 0.002, 6) + sweep(90, 30, 0.6) * env(int(SR * 0.6), 0.001, 7),
        boss_explosion=lp(noise(1.8), 450) * env(int(SR * 1.8), 0.004, 2) + sweep(70, 22, 1.8) * env(int(SR * 1.8), 0.002, 1.8) * 1.3,
        hit=sweep(2200, 1200, 0.25) * env(int(SR * 0.25), 0.0005, 12),
        boss_warning=cat(*[cat(note(1000, 0.08, "sine", 1), sil(0.06)) for _ in range(8)]),
        levelup=cat(*[lp(note(mtof(m), 0.15, "square", 5), 2000) for m in (67, 72, 76)], lp(note(mtof(79), 0.45, "square", 3), 2000)),
        pickup=mixn(hp(noise(0.012), 2500) * env(int(SR * 0.012), 0.0002, 200), note(1400, 0.04, "sine", 50) * 0.5),
        music=music(100, [Am, Am, Dm, E], "tri", "sine", "march", 12, 0, 0.04),
    ),
    "comic": dict(
        laser=sweep(1500, 450, 0.12) * env(int(SR * 0.12), 0.001, 16),
        explosion=lp(noise(0.28), 2000) * env(int(SR * 0.28), 0.0005, 12) + sweep(180, 50, 0.28) * env(int(SR * 0.28), 0.0005, 10) * 1.2,
        boss_explosion=lp(noise(1.3), 900) * env(int(SR * 1.3), 0.002, 3) + sweep(140, 30, 1.3) * env(int(SR * 1.3), 0.001, 2.5) * 1.3,
        hit=sweep(650, 380, 0.12) * env(int(SR * 0.12), 0.0005, 25),
        boss_warning=cat(*[cat(lp(sum(osc(mtof(m), 0.22, "saw") for m in (55, 59, 62)), 1800) * env(int(SR * 0.22), 0.005, 6), sil(0.1)) for _ in range(3)]),
        levelup=cat(*[lp(note(mtof(m), 0.12, "saw", 6), 2500) for m in (67, 72, 76)], lp(sum(note(mtof(m), 0.5, "saw", 3) for m in (72, 76, 79)), 2500)),
        pickup=note(1760, 0.25, "sine", 12) + 0.3 * note(1760 * 2.76, 0.25, "sine", 20),
        music=music(132, [C, Am, Dm, G], "saw", "tri", "soft", 12, 0.2),
    ),
    "blueprint": dict(
        laser=sweep(1700, 1150, 0.07) * env(int(SR * 0.07), 0.001, 30),
        explosion=lp(noise(0.35), 900) * env(int(SR * 0.35), 0.002, 9) * 0.7 + sweep(220, 90, 0.35) * env(int(SR * 0.35), 0.001, 10),
        boss_explosion=lp(noise(1.2), 600) * env(int(SR * 1.2), 0.004, 3) + sweep(160, 40, 1.2) * env(int(SR * 1.2), 0.002, 2.6),
        hit=sweep(180, 90, 0.16) * env(int(SR * 0.16), 0.001, 14),
        boss_warning=cat(*[cat(note(1200, 0.07, "sine", 4), sil(0.03), note(1200, 0.07, "sine", 4), sil(0.03), note(1600, 0.12, "sine", 4), sil(0.12)) for _ in range(2)]),
        levelup=cat(*[note(mtof(m), 0.1, "sine", 10) for m in (72, 74, 78, 79, 83)], note(mtof(84), 0.4, "sine", 5)),
        pickup=note(2400, 0.06, "sine", 35),
        music=music(90, [C, [50, 54, 57], Em, G], "sine", "sine", "soft", 24, 0, 0.03),
    ),
}

lines = ["// Generated by scripts/gen_sound_packs.py — one sound pack per UI style", "export const SOUND_PACKS = {"]
names = SFX + ["music"]
lines.append("  ember: {" + ", ".join(f'{n}: require("../../assets/sounds/{n}.wav")' for n in names) + " },")
for style, pack in PACKS.items():
    d = ROOT / style; d.mkdir(parents=True, exist_ok=True)
    for n in SFX: save(d / f"{n}.wav", pack[n], 0.8)
    save(d / "music.wav", pack["music"], 0.75, MSR)
    lines.append(f"  {style}: {{" + ", ".join(f'{n}: require("../../assets/sounds/{style}/{n}.wav")' for n in names) + " },")
lines.append("};")
Path("/app/frontend/src/game/soundPacks.ts").write_text("\n".join(lines) + "\n")
print("ok")
