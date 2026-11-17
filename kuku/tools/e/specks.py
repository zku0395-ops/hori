# ちいさな はなれた かけらを けす：python3 specks.py 入力 出力 [わりあい]
import sys
from collections import deque
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA'); w, h = im.size; px = im.load()
r = float(sys.argv[3]) if len(sys.argv) > 3 else 0.02
seen = bytearray(w * h); comps = []
for y0 in range(h):
    for x0 in range(w):
        if seen[y0 * w + x0] or px[x0, y0][3] < 30: continue
        q = deque([(x0, y0)]); seen[y0 * w + x0] = 1; pts = []
        while q:
            x, y = q.popleft(); pts.append((x, y))
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3] >= 30:
                    seen[ny * w + nx] = 1; q.append((nx, ny))
        comps.append(pts)
total = sum(len(c) for c in comps); n = 0
for c in comps:
    if len(c) < total * r:
        n += 1
        for x, y in c: px[x, y] = (255, 255, 255, 0)
im.save(sys.argv[2]); print('removed', n)
