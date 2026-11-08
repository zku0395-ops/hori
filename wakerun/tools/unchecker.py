# ChatGPT の絵で、背景に「市松もよう」が描かれて しまった ときに、もようを 透明に する道具
# つかいかた：python3 wakerun/tools/unchecker.py もとの絵 できた絵.png 見本.png [いちばん くらい 灰色（はじめは 180）]
# まわりから つながって いる 白と灰色の ところだけを 透明に します（ロボットの 白い ところは のこります）。
import sys
from PIL import Image, ImageFilter
from collections import deque
src, dst, prev = sys.argv[1], sys.argv[2], sys.argv[3]
LOW = int(sys.argv[4]) if len(sys.argv) > 4 else 180
im = Image.open(src).convert('RGB'); W, H = im.size; px = im.load()
def bgish(p):
    r, g, b = p; mx, mn = max(p), min(p)
    return mx - mn <= 8 and mn >= LOW
seen = bytearray(W * H); q = deque()
for x in range(W):
    for y in (0, H - 1): q.append((x, y))
for y in range(H):
    for x in (0, W - 1): q.append((x, y))
while q:
    x, y = q.popleft(); i = y * W + x
    if seen[i] or not bgish(px[x, y]): continue
    seen[i] = 1
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx]: q.append((nx, ny))
mask = Image.frombytes('L', (W, H), bytes(0 if s else 255 for s in seen))
mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
out = im.convert('RGBA'); out.putalpha(mask)
out.save(dst)
bg = Image.new('RGBA', (W, H), (30, 27, 75, 255)); bg.alpha_composite(out); bg.convert('RGB').resize((627, 627)).save(prev)
