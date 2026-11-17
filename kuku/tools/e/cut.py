# 白い背景を すかして、正方形に して webp に する：python3 cut.py 入力 出力 [大きさ]
import sys
from collections import deque
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 600
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()
def white(p): return p[3] == 0 or (p[0] > 232 and p[1] > 232 and p[2] > 232)
seen = bytearray(w * h)
q = deque()
for x in range(w):
    q.append((x, 0)); q.append((x, h - 1))
for y in range(h):
    q.append((0, y)); q.append((w - 1, y))
while q:
    x, y = q.popleft()
    i = y * w + x
    if seen[i]: continue
    seen[i] = 1
    if not white(px[x, y]): continue
    px[x, y] = (255, 255, 255, 0)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]: q.append((nx, ny))
# ふちを なめらかに（アルファを すこし ぼかす）
a = im.getchannel('A').filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
im.putalpha(a)
bb = im.getbbox()
im = im.crop(bb)
s = max(im.size); pad = int(s * 0.03)
out = Image.new('RGBA', (s + 2 * pad, s + 2 * pad), (0, 0, 0, 0))
out.paste(im, ((s - im.size[0]) // 2 + pad, (s - im.size[1]) // 2 + pad))
out = out.resize((size, size), Image.LANCZOS)
out.save(dst, 'WEBP', quality=88, method=6)
print(dst, out.size)
