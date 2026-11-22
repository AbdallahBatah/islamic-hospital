"""Prepares optimized image variants from the original photos (one-off helper).
Usage: python3 tools/prepare_images.py <folder with originals> src/img
The file names below are the ones the originals had when the site was built; adjust them for new photos."""
import sys
from PIL import Image, ImageOps
U, OUT = sys.argv[1], sys.argv[2]
def save(im, name, q=74):
    im.save(f"{OUT}/{name}", "WEBP", quality=q, method=6)
ent = Image.open(f"{U}/03aab35b-image.jpg").convert("RGB")      # entrance 1502x1001
orr = Image.open(f"{U}/fedd5d67-image.jpg").convert("RGB")      # operating room 1528x1528
logo = Image.open(f"{U}/21d145c6-image.jpg").convert("RGB")     # logo 554x554
# hero crop (4:5) centred on the glass doors
hero = ent.crop((380, 0, 1180, 1000))
for w in (720, 440): save(hero.resize((w, int(w*1.25)), Image.LANCZOS), f"entrance-hero-{w}.webp")
for w in (1280, 640): save(ent.resize((w, round(w*1001/1502)), Image.LANCZOS), f"entrance-{w}.webp")
for w in (1100, 560): save(orr.resize((w, w), Image.LANCZOS), f"operating-room-{w}.webp")
# extra crops from the two large photos
def crop(src, box, name, widths):
    c = src.crop(box)
    for w in widths: save(c.resize((w, round(w*c.height/c.width)), Image.LANCZOS), f"{name}-{w}.webp")
crop(orr, (640, 110, 1340, 610), "or-lights", (360, 700))
crop(orr, (470, 540, 1430, 1260), "or-table", (400, 800))
crop(orr, (0, 430, 540, 1250), "or-anesthesia", (300, 540))
crop(ent, (1040, 60, 1502, 900), "flag", (300, 462))
crop(ent, (60, 60, 540, 920), "awareness", (300, 480))
# the three smaller photos: kept at their native size (no upscaling)
for f, name, widths in (("40bb3447-image.jpg", "lobby", (320, 547)), ("5086d5e7-image.jpg", "waiting", (275,)), ("85a9c444-image.jpg", "building", (300, 447))):
    im = Image.open(f"{U}/{f}").convert("RGB")
    for w in widths: save(im.resize((w, round(w*im.height/im.width)), Image.LANCZOS), f"{name}-{w}.webp", q=80)
# OG image 1200x630
og = ImageOps.fit(ent, (1200, 630), Image.LANCZOS, centering=(0.5, 0.45)); og.save(f"{OUT}/og-cover.jpg", quality=80, optimize=True)
# logo: white background -> alpha
r, g, b = logo.split()
alpha = r.point(lambda v: max(0, min(255, int((250 - v) * 255 / 225))))
box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
rgba = Image.merge("RGBA", (r, g, b, alpha)).crop(box)
white = Image.merge("RGBA", (*[alpha.point(lambda v: 255)]*3, alpha)).crop(box)
print("logo bbox", box, rgba.size)
h = 176
for im, n in ((rgba, "logo.png"), (white, "logo-white.png")):
    im.resize((round(im.width*h/im.height), h), Image.LANCZOS).quantize(colors=48, method=Image.FASTOCTREE, dither=Image.NONE).save(f"{OUT}/{n}", optimize=True)
# row projection to find the emblem (top part)
a = alpha.crop(box); rows = [sum(a.crop((0, y, a.width, y+1)).tobytes()) for y in range(a.height)]
gap = next(y for y in range(60, a.height) if rows[y] == 0)
cols_im = a.crop((0, 0, a.width, gap)); eb = cols_im.point(lambda v: 255 if v > 24 else 0).getbbox()
emblem = rgba.crop(eb); print("emblem", eb)
for s, n in ((64, "favicon.png"), (180, "apple-touch-icon.png")):
    cv = Image.new("RGBA", (s, s), (255, 255, 255, 255)); m = int(s*0.1)
    e = ImageOps.contain(emblem, (s-2*m, s-2*m), Image.LANCZOS); cv.alpha_composite(e, ((s-e.width)//2, (s-e.height)//2)); cv.save(f"{OUT}/{n}", optimize=True)
