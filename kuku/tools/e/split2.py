# 白い背景をすかして、つながった かたまりごとに 切り分ける：python3 split2.py 入力 出力の頭 人数
import sys
from collections import deque
from PIL import Image, ImageFilter
src, pre, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGBA'); w, h = im.size; px = im.load()
def white(p): return p[3] == 0 or (p[0] > 232 and p[1] > 232 and p[2] > 232)
seen = bytearray(w * h); q = deque()
for x in range(w): q.append((x, 0)); q.append((x, h - 1))
for y in range(h): q.append((0, y)); q.append((w - 1, y))
while q:
    x, y = q.popleft(); i = y * w + x
    if seen[i]: continue
    seen[i] = 1
    if not white(px[x, y]): continue
    px[x, y] = (255, 255, 255, 0)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]: q.append((nx, ny))
a = im.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)); im.putalpha(a)
# かたまりを さがす（1/4に 小さくして）
sm = im.getchannel('A').resize((w // 4, h // 4)); sw, sh = sm.size; sp = sm.load()
lab = [0] * (sw * sh); comps = []
for y in range(sh):
    for x in range(sw):
        if sp[x, y] > 40 and not lab[y * sw + x]:
            k = len(comps) + 1; q = deque([(x, y)]); lab[y * sw + x] = k; pts = []
            while q:
                cx, cy = q.popleft(); pts.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < sw and 0 <= ny < sh and not lab[ny * sw + nx] and sp[nx, ny] > 40:
                        lab[ny * sw + nx] = k; q.append((nx, ny))
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            comps.append(dict(k=k, n=len(pts), box=(min(xs), min(ys), max(xs) + 1, max(ys) + 1), cx=sum(xs) / len(xs)))
comps.sort(key=lambda c: -c['n'])
big = sorted(comps[:n], key=lambda c: c['cx'])
print('big', [(c['n'], c['box']) for c in big], 'others', len(comps) - n)
groups = [[c] for c in big]
for c in comps[n:]:
    j = min(range(n), key=lambda j: abs(big[j]['cx'] - c['cx'])); groups[j].append(c)
for i, g in enumerate(groups):
    keys = {c['k'] for c in g}
    x0 = min(c['box'][0] for c in g) * 4; y0 = min(c['box'][1] for c in g) * 4
    x1 = max(c['box'][2] for c in g) * 4; y1 = max(c['box'][3] for c in g) * 4
    out = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0)); op = out.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            if lab[(y // 4) * sw + (x // 4)] in keys or (px[x, y][3] and lab[min(sh-1,(y // 4)) * sw + min(sw-1,x // 4)] == 0 and any(lab[yy * sw + xx] in keys for yy in range(max(0,y//4-1), min(sh,y//4+2)) for xx in range(max(0,x//4-1), min(sw,x//4+2)))):
                op[x - x0, y - y0] = px[x, y]
    out.save(f'{pre}{i}.png'); print(i, out.size)
