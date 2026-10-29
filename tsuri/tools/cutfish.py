# ChatGPT の 魚の 絵（白い 背景に 横ならび）を 1ぴきずつ 切り分け、背景を すかす
# python3 tsuri/tools/cutfish.py 絵.webp tsuri/img ayu yamame koi namazu sake（左から じゅんに id）
# 絵.webp.preview.png に、切り分けた ようすが できる
# --holes を つけると、かこまれた 白い ところも すかす（おみせの 品物 など）
import sys
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
args = [x for x in sys.argv[1:] if not x.startswith('--')]
HOLES = '--holes' in sys.argv  # かこまれた 白い ところ（つりざおと いとの あいだ など）も すかす。白い もようの ある 魚には つかわない
src, outdir, ids = args[0], args[1], args[2:]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(int); H, W, _ = a.shape
white = (a.min(axis=2) > 228) & ((a.max(axis=2) - a.min(axis=2)) < 24)
bg = np.zeros((H, W), bool); q = deque()
for x in range(W):
    for y in (0, H - 1): q.append((y, x))
for y in range(H):
    for x in (0, W - 1): q.append((y, x))
for y, x in list(q):
    if white[y, x]: bg[y, x] = 1
q = deque([p for p in q if bg[p]])
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y+dy, x+dx
        if 0 <= ny < H and 0 <= nx < W and white[ny, nx] and not bg[ny, nx]: bg[ny, nx] = 1; q.append((ny, nx))
if HOLES:
    pure = (a.min(axis=2) > 238) & ((a.max(axis=2) - a.min(axis=2)) < 16) & ~bg
    seen = np.zeros((H, W), bool)
    for y0, x0 in zip(*np.nonzero(pure)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = 1; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < H and 0 <= nx < W and pure[ny, nx] and not seen[ny, nx]: seen[ny, nx] = 1; q.append((ny, nx))
        if len(pts) > 600:
            for y, x in pts: bg[y, x] = 1
fg = ~bg
# つながった かたまり（8方向）
lab = np.zeros((H, W), int); n = 0; comps = []
for y0 in range(H):
    for x0 in range(W):
        if fg[y0, x0] and not lab[y0, x0]:
            n += 1; lab[y0, x0] = n; q = deque([(y0, x0)]); pts = 0; xs = []; 
            minx, maxx, miny, maxy = x0, x0, y0, y0
            while q:
                y, x = q.popleft(); pts += 1
                minx, maxx, miny, maxy = min(minx, x), max(maxx, x), min(miny, y), max(maxy, y)
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y+dy, x+dx
                        if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
            comps.append((n, pts, minx, maxx, miny, maxy))
mx = max(c[1] for c in comps)
big = sorted([c for c in comps if c[1] > max(3000, mx * 0.15)], key=lambda c: c[2])  # キラキラ などの 小さい かたまりは、ちかくの ものに つける
print('big', [(c[1], c[2], c[3]) for c in big], 'want', len(ids))
assert len(big) == len(ids), 'かずが あいません'
owner = {c[0]: i for i, c in enumerate(big)}
# 小さい かたまり（ひげの きれはし など）は、いちばん ちかい 魚に つける
for c in comps:
    if c[0] in owner: continue
    cx, cy = (c[2] + c[3]) / 2, (c[4] + c[5]) / 2
    d = [max(0, b[2] - cx, cx - b[3]) + max(0, b[4] - cy, cy - b[5]) for b in big]
    inside = [i for i, b in enumerate(big) if b[2] <= cx <= b[3]]  # まうえ・まうしたに ある ものを さきに えらぶ（あわ など）
    if inside and min(d[i] for i in inside) < 300: owner[c[0]] = min(inside, key=lambda i: d[i])
    elif min(d) < (150 if c[1] > 300 else 60): owner[c[0]] = int(np.argmin(d))
alpha_all = np.asarray(Image.fromarray((fg * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
rgb = np.asarray(im)
prev = Image.new('RGBA', (300 * len(ids), 200), (200, 230, 250, 255))
for i, fid in enumerate(ids):
    mine = np.isin(lab, [k for k, v in owner.items() if v == i])
    mine = np.asarray(Image.fromarray((mine * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))) > 0
    al = np.where(mine, alpha_all, 0).astype('uint8')
    ys, xs = np.nonzero(al > 10)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], al[y0:y1, x0:x1]]), 'RGBA')
    pad = 6; c = Image.new('RGBA', (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0)); c.paste(out, (pad, pad))
    if c.width > 480: c = c.resize((480, round(c.height * 480 / c.width)), Image.LANCZOS)
    c.save(f'{outdir}/fish_{fid}.webp', quality=86, method=6)
    t = c.copy(); t.thumbnail((290, 190)); prev.alpha_composite(t, (300 * i + 5, 5))
prev.save(src + ".preview.png")
print('ok')
