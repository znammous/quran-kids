"""يرسم هلالَ الأيقونة ونجمتَها رسماً متّجهاً بأيّ مقاس — فلا تُكبَّر صورةُ ٥١٢ فتغبش.
الهندسةُ مقيسةٌ من icons/icon-maskable-512.png، ومنها تُولَّد أيقوناتُ أندرويد وشاشةُ
البداية وأيقونةُ المتجرين. يُشغَّل بعد أيّ تغييرٍ في الشكل:  python scripts/make-icons.py"""
import math, os
from PIL import Image, ImageDraw

BG, GOLD = (4, 23, 58), (240, 197, 74)
SS = 4  # رسمٌ بأربعة أضعاف ثمّ تصغير: حوافُّ ناعمة

def moon(size, scale=1.0, color=GOLD, bg=None, round_bg=False):
    """الهلال والنجمة على لوحٍ مربّع؛ scale نسبةُ حجمهما إلى ما في أيقونة ٥١٢"""
    S = size * SS
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    if bg:
        d = ImageDraw.Draw(im)
        (d.ellipse if round_bg else d.rectangle)((0, 0, S - 1, S - 1), fill=bg + (255,))
    k = S / 512 * scale
    o = S / 2 - 256 * k   # يبقى المركزُ مركزاً مهما صغُر الشكل
    P = lambda x, y: (o + x * k, o + y * k)
    m = Image.new('L', (S, S), 0); d = ImageDraw.Draw(m)
    def circ(cx, cy, r, v):
        (x, y) = P(cx, cy); d.ellipse((x - r * k, y - r * k, x + r * k, y + r * k), fill=v)
    circ(259.7, 259.3, 104.9, 255)
    circ(293.8, 244.3, 93.9, 0)
    cx, cy, R = 315.5, 206.0, 31.0
    pts = []
    for i in range(10):
        r = R if i % 2 == 0 else R * 0.382
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(P(cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=255)
    im.paste(Image.new('RGBA', (S, S), color + (255,)), (0, 0), m)
    return im.resize((size, size), Image.LANCZOS)

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True)

RES = 'android/app/src/main/res'
DPI = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for n, f in DPI.items():
    save(moon(round(48 * f), bg=BG), f'{RES}/mipmap-{n}/ic_launcher.png')
    save(moon(round(48 * f), bg=BG, round_bg=True), f'{RES}/mipmap-{n}/ic_launcher_round.png')
    # التكيّفيّة: ١٠٨dp يظهر منها ٧٢ — فيُكبَّر الشكلُ ليبدو بقدر الأيقونة القديمة
    save(moon(round(108 * f), scale=1.2), f'{RES}/mipmap-{n}/ic_launcher_foreground.png')
    save(moon(round(108 * f), scale=1.2, color=(255, 255, 255)), f'{RES}/mipmap-{n}/ic_launcher_monochrome.png')

# شاشةُ البداية: الهلالُ على الكحليّ، مكانَ شعار Capacitor الافتراضيّ
for p, dirs, files in os.walk(RES):
    if 'splash.png' in files:
        f = os.path.join(p, 'splash.png'); w, h = Image.open(f).size
        im = Image.new('RGB', (w, h), BG); s = min(w, h)
        mm = moon(s, scale=0.9); im.paste(mm, ((w - s) // 2, (h - s) // 2), mm)
        save(im, f)

# أيقونةُ المتجرين: آبل ١٠٢٤ بلا شفافيّة، وجوجل ٥١٢
save(moon(1024, bg=BG).convert('RGB'), 'store/icon-1024.png')
save(moon(512, bg=BG).convert('RGB'), 'store/play-icon-512.png')
print('تمّ')
