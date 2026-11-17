# とじた 白い すきま（うでと からだの あいだ など）も すかす：python3 holes.py 入力 出力 [最小の広さ]
import sys
from collections import deque
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA'); w, h = im.size; px = im.load()
mn = int(sys.argv[3]) if len(sys.argv) > 3 else 600
def wh(p): return p[3] > 0 and p[0] > 240 and p[1] > 240 and p[2] > 240
seen = bytearray(w * h); cnt = 0
for y0 in range(h):
    for x0 in range(w):
        if seen[y0 * w + x0] or not wh(px[x0, y0]): continue
        q = deque([(x0, y0)]); seen[y0 * w + x0] = 1; pts = []
        while q:
            x, y = q.popleft(); pts.append((x, y))
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and wh(px[nx, ny]):
                    seen[ny * w + nx] = 1; q.append((nx, ny))
        if len(pts) >= mn:
            cnt += 1
            for x, y in pts: px[x, y] = (255, 255, 255, 0)
im.save(sys.argv[2]); print('holes', cnt)
