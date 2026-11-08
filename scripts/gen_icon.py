"""Draws the Stooopid Space Shooter Game icon, adaptive icon, splash and favicon with PIL."""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = "/app/frontend/assets/images/"
S = 2048  # supersample canvas
random.seed(11)


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def radial(size, inner, outer, cx=0.5, cy=0.5, r=0.75):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            d = min(1, math.hypot(x / size - cx, y / size - cy) / r)
            px[x, y] = tuple(int(inner[i] + (outer[i] - inner[i]) * d) for i in range(4))
    return img


def ship_layer(size, scale, ox, oy, angle_deg=-20):
    """Player fighter (same silhouette as the in-game sprite) on a transparent layer."""
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    P = lambda pts: [(ox + (x - 50) * scale, oy + (y - 50) * scale) for x, y in pts]
    light, mid, dark, cock, accent, glow = hexc("#E6F3FF"), hexc("#4FA3FF"), hexc("#1B3F8F"), hexc("#7FF6FF"), hexc("#00E5FF"), hexc("#FFB347")
    # engine flame
    flame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flame)
    fd.polygon(P([(36, 86), (64, 86), (50, 134)]), fill=hexc("#FF7B33", 230))
    fd.polygon(P([(42, 86), (58, 86), (50, 116)]), fill=hexc("#FFE45C", 255))
    flame = flame.filter(ImageFilter.GaussianBlur(scale * 2.2))
    lay.alpha_composite(flame)
    d.polygon(P([(44, 40), (8, 72), (10, 80), (40, 72)]), fill=dark, outline=light)
    d.polygon(P([(56, 40), (92, 72), (90, 80), (60, 72)]), fill=dark, outline=light)
    d.polygon(P([(44, 44), (14, 70), (40, 66)]), fill=mid)
    d.polygon(P([(56, 44), (86, 70), (60, 66)]), fill=mid)
    d.polygon(P([(12, 74), (4, 60), (8, 58), (16, 70)]), fill=light)
    d.polygon(P([(88, 74), (96, 60), (92, 58), (84, 70)]), fill=light)
    d.polygon(P([(38, 76), (44, 76), (44, 90), (38, 90)]), fill=dark)
    d.polygon(P([(56, 76), (62, 76), (62, 90), (56, 90)]), fill=dark)
    d.polygon(P([(50, 4), (60, 36), (62, 78), (50, 86), (38, 78), (40, 36)]), fill=mid, outline=light)
    d.polygon(P([(50, 4), (56, 34), (50, 40), (44, 34)]), fill=light)
    d.polygon(P([(50, 40), (62, 78), (50, 86)]), fill=dark)
    cx, cy = ox, oy + (40 - 50) * scale
    d.ellipse([cx - 5.5 * scale, cy - 11 * scale, cx + 5.5 * scale, cy + 11 * scale], fill=cock, outline=light)
    d.line(P([(30, 66), (42, 60)]), fill=accent, width=int(scale * 2.2))
    d.line(P([(70, 66), (58, 60)]), fill=accent, width=int(scale * 2.2))
    for ex in (41, 59):
        x, y = ox + (ex - 50) * scale, oy + (91 - 50) * scale
        d.ellipse([x - 3 * scale, y - 2 * scale, x + 3 * scale, y + 2 * scale], fill=glow)
    return lay.rotate(angle_deg, resample=Image.BICUBIC, center=(ox, oy))


def lasers(size, ox, oy, angle_deg):
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = math.radians(-90 - angle_deg)
    for k, off in enumerate((0.0,)):
        for i in range(3):
            dist = size * (0.2 + i * 0.075)
            x, y = ox + math.cos(a) * dist, oy + math.sin(a) * dist
            L = size * 0.035
            d.line([(x, y), (x + math.cos(a) * L, y + math.sin(a) * L)], fill=hexc("#FFF4E0"), width=int(size * 0.012))
    glow = lay.filter(ImageFilter.GaussianBlur(size * 0.006))
    glow.alpha_composite(lay)
    return glow


def enemy(size, x, y, s, rot):
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    P = lambda pts: [(x + (px - 50) * s, y + (py - 50) * s) for px, py in pts]
    d.polygon(P([(50, 8), (62, 40), (90, 26), (76, 64), (60, 68), (50, 92), (40, 68), (24, 64), (10, 26), (38, 40)]), fill=hexc("#E5533A"), outline=hexc("#FFB199"))
    d.polygon(P([(50, 26), (56, 50), (50, 70), (44, 50)]), fill=hexc("#5A1208"))
    d.ellipse([x - 6 * s, y - 6 * s, x + 6 * s, y + 6 * s], fill=hexc("#FFB347"))
    return lay.rotate(rot, resample=Image.BICUBIC, center=(x, y))


def background(size):
    bg = radial(size // 8, hexc("#3A1A0C"), hexc("#0C0705"), 0.62, 0.35, 0.8).resize((size, size), Image.BICUBIC)
    blue = radial(size // 8, hexc("#1C3D8F", 120), hexc("#1C3D8F", 0), 0.15, 0.9, 0.55).resize((size, size), Image.BICUBIC)
    bg.alpha_composite(blue)
    d = ImageDraw.Draw(bg)
    for _ in range(260):
        x, y, r = random.random() * size, random.random() * size, random.random() * size * 0.0025 + 1
        c = hexc("#FFF4E0", int(80 + random.random() * 175)) if random.random() > 0.3 else hexc("#FFC27A", 200)
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return bg


def compose(full_bleed=True, transparent=False):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0)) if transparent else background(S)
    ox, oy, ang = S * 0.5, S * (0.52 if full_bleed else 0.46), -18
    if full_bleed:
        img.alpha_composite(enemy(S, S * 0.2, S * 0.2, S * 0.0016, 160))
        img.alpha_composite(enemy(S, S * 0.82, S * 0.3, S * 0.0012, 200))
    img.alpha_composite(lasers(S, ox, oy, ang))
    halo = radial(S // 8, hexc("#4FA3FF", 90), hexc("#4FA3FF", 0), 0.5, 0.56, 0.3).resize((S, S), Image.BICUBIC)
    img.alpha_composite(halo)
    img.alpha_composite(ship_layer(S, S * (0.0058 if full_bleed else 0.0044), ox, oy, ang))
    return img


icon = compose(True)
icon.convert("RGB").resize((1024, 1024), Image.LANCZOS).save(OUT + "icon.png")
icon.convert("RGB").resize((48, 48), Image.LANCZOS).save(OUT + "favicon.png")
compose(False, transparent=True).resize((1024, 1024), Image.LANCZOS).save(OUT + "adaptive-icon.png")
compose(False, transparent=True).resize((1024, 1024), Image.LANCZOS).save(OUT + "splash-image.png")
print("icons written")
