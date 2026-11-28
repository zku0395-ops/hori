# ChatGPT で まとめて 作った 背景（白い すきまで くぎった よこ○まい × たて○まい）を 1まいずつに 切りわける 道具
# つかいかた：python3 kakezan/tools/split_bg.py <絵> <よこの まいすう> <たての まいすう> <なまえ,なまえ,...>
#   ・なまえは 上の だんの 左から じゅんに（.webp を つけずに）。kakezan/img/<なまえ>.webp に 書きます
#   ・はしから はしまで ずっと 白い 線だけを すきまと みなします（ゆきの 白は すきまに なりません）
import os, sys
import numpy as np
from PIL import Image

src, cols, rows, names = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(',')
assert len(names) == cols * rows, f'なまえの かずが {cols * rows} ではありません（{len(names)}）'
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
img = Image.open(src).convert('RGB')
a = np.asarray(img).astype(np.int16)
H, W, _ = a.shape
WHITE = (a.min(axis=2) >= 232) & ((a.max(axis=2) - a.min(axis=2)) <= 14)

def panels(frac, n, length):
    """frac（線ごとの 白の わりあい）から、白い すきまで くぎった n この はんいを かえす"""
    gut = frac >= 0.96
    runs, i = [], 0
    while i < length:
        if gut[i]:
            j = i
            while j < length and gut[j]: j += 1
            runs.append((i, j)); i = j
        else: i += 1
    lo = runs[0][1] if runs and runs[0][0] == 0 else 0           # はしの よはく
    hi = runs[-1][0] if runs and runs[-1][1] == length else length
    inner = [r for r in runs if r[0] > lo and r[1] < hi]
    if len(inner) < n - 1:  # すきまが みつからない ときは ひとしく わける
        step = (hi - lo) / n
        return [(round(lo + k * step), round(lo + (k + 1) * step)) for k in range(n)]
    cuts = sorted(sorted(inner, key=lambda r: r[1] - r[0], reverse=True)[:n - 1])
    edges = [lo] + [x for r in cuts for x in r] + [hi]
    return [(edges[2 * k], edges[2 * k + 1]) for k in range(n)]

ys = panels(WHITE.mean(axis=1), rows, H)
k = 0
for (y0, y1) in ys:
    xs = panels(WHITE[y0:y1].mean(axis=0), cols, W)
    for (x0, x1) in xs:
        pad = 3  # ふちの 白い にじみを のぞく
        piece = img.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad))
        if piece.width > 1280:
            piece = piece.resize((1280, round(piece.height * 1280 / piece.width)), Image.LANCZOS)
        piece.save(os.path.join(out_dir, names[k] + '.webp'), 'WEBP', quality=86, method=6)
        print('書きました：img/' + names[k] + '.webp', piece.size)
        k += 1
