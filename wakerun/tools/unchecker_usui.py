# ChatGPT の絵で、うすい「市松もよう」が描かれて しまった ときに、もようを 透明に する道具（すがた12まいで つかいました）
# つかいかた：python3 wakerun/tools/unchecker_usui.py もとの絵 できた絵.png 見本.png
# きびしく（まったくの 灰色だけ）消してから、そのまわり 5px だけ ゆるく 消します。白い 耳や 羽が きえにくく なります。
import sys
from PIL import Image, ImageFilter, ImageChops
from collections import deque
src, dst, prev = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGB'); W, H = im.size; px = im.load()
def flood(ok):
    seen = bytearray(W * H); q = deque()
    for x in range(W): q.append((x, 0)); q.append((x, H - 1))
    for y in range(H): q.append((0, y)); q.append((W - 1, y))
    while q:
        x, y = q.popleft(); i = y * W + x
        if seen[i] or not ok(x, y): continue
        seen[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < W - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < H - 1: q.append((x, y + 1))
    return Image.frombytes('L', (W, H), bytes(255 if s else 0 for s in seen))
def neutral(tol, low):
    def f(x, y):
        p = px[x, y]; return max(p) - min(p) <= tol and min(p) >= low
    return f
strict = flood(neutral(2, 240))           # 255 = はいけい
band = strict.filter(ImageFilter.MaxFilter(11))  # はいけいから 5px
lp = None
loose_raw = neutral(10, 225)
lpx = band.load()
loose = flood(lambda x, y: lpx[x, y] and loose_raw(x, y))
bgmask = ImageChops.lighter(strict, loose)
alpha = ImageChops.invert(bgmask).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
out = im.convert('RGBA'); out.putalpha(alpha); out.save(dst)
bg = Image.new('RGBA', (W, H), (30, 27, 75, 255)); bg.alpha_composite(out); bg.convert('RGB').save(prev)
