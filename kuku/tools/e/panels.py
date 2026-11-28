# 2x2 などの パネルの わくを さがす：python3 panels.py 入力
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); w, h = im.size; px = im.load()
def nonwhite(p): return min(p) < 235
def runs(vals, thr):
    out = []; s = None
    for i, v in enumerate(vals):
        if v > thr and s is None: s = i
        if v <= thr and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(vals)))
    return [r for r in out if r[1] - r[0] > 50]
rows = [sum(nonwhite(px[x, y]) for x in range(0, w, 4)) / (w / 4) for y in range(h)]
cols = [sum(nonwhite(px[x, y]) for y in range(0, h, 4)) / (h / 4) for x in range(w)]
print('rows', runs(rows, 0.3)); print('cols', runs(cols, 0.3))
