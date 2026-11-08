# ChatGPT で まとめて 作った 絵（白い はいけいに よこ○れつ × たて○だん）を 1まいずつに 切りわける 道具
# つかいかた：python3 kakezan/tools/split_sheet.py <絵> <よこの れつ> <たての だん> <なまえ,なまえ,...> [みほんの 絵]
#   ・なまえは 上の だんの 左から じゅんに（.webp を つけずに）。kakezan/img/<なまえ>.webp に 書きます
#   ・ふちから つながった 白い ところだけを とうめいに します（ふくの 白い ところは のこります）
#   ・おなじ シートの 絵は、おなじ 大きさの わくに 足もとを そろえて おきます（ならべた ときに 大きさが そろう）
import os, sys
import numpy as np
from PIL import Image

src, cols, rows, names = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(',')
preview = sys.argv[5] if len(sys.argv) > 5 else None
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
im = np.asarray(Image.open(src).convert('RGB')).astype(np.int16)
H, W, _ = im.shape
assert len(names) == cols * rows, f'なまえの かずが {cols * rows} ではありません（{len(names)}）'

def flood_bg(cell):
    """ふちから つながった 白っぽい ところ（はいけい）を さがす"""
    mn, mx = cell.min(axis=2), cell.max(axis=2)
    white = (mn >= 228) & ((mx - mn) <= 22)
    reg = np.zeros_like(white)
    reg[0, :] = white[0, :]; reg[-1, :] = white[-1, :]; reg[:, 0] = white[:, 0]; reg[:, -1] = white[:, -1]
    while True:
        g = reg.copy()
        g[1:, :] |= reg[:-1, :]; g[:-1, :] |= reg[1:, :]; g[:, 1:] |= reg[:, :-1]; g[:, :-1] |= reg[:, 1:]
        g &= white
        if (g == reg).all(): return reg, mn
        reg = g

def parts(mask, limit, big=False):
    """mask の なかで limit より ちいさい（big=True なら おおきい）かたまりを かえす"""
    h, w = mask.shape
    seen = np.zeros_like(mask); out = np.zeros_like(mask)
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]: continue
        stack = [(sy, sx)]; seen[sy, sx] = True; comp = []
        while stack:
            y, x = stack.pop(); comp.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        if (len(comp) >= limit) if big else (len(comp) < limit):
            for p in comp: out[p] = True
    return out

def comps(mask, limit):
    """mask の なかで limit いじょうの かたまりを 1つずつ かえす"""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]: continue
        stack = [(sy, sx)]; seen[sy, sx] = True; comp = []
        while stack:
            y, x = stack.pop(); comp.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        if len(comp) >= limit: yield comp

def enclosed_bg(pure, mn):
    """かこまれた 白の うち、まわりが くろい りんかくせんの ところ（つえと からだの すきま）だけ はいけいに する。
    ふくの 白（まわりが クリーム色や きんいろ）は のこす"""
    out = np.zeros_like(pure)
    h, w = pure.shape
    for comp in comps(pure, 60):
        reg = np.zeros_like(pure)
        ys, xs = zip(*comp); reg[ys, xs] = True
        ring = np.zeros_like(reg)
        ring[1:, :] |= reg[:-1, :]; ring[:-1, :] |= reg[1:, :]; ring[:, 1:] |= reg[:, :-1]; ring[:, :-1] |= reg[:, 1:]
        # 2つ そとがわまで みる（ふちの ぼかしを こえて りんかくせんに とどくように）
        r2 = ring.copy()
        r2[1:, :] |= ring[:-1, :]; r2[:-1, :] |= ring[1:, :]; r2[:, 1:] |= ring[:, :-1]; r2[:, :-1] |= ring[:, 1:]
        r2 &= ~reg
        if r2.sum() and (mn[r2] < 140).mean() > 0.5: out |= reg
    return out

# 絵の ある ところ（白くない ところ）
MN, MX = im.min(axis=2), im.max(axis=2)
FG = ~((MN >= 228) & ((MX - MN) <= 22))

def cut_line(lo, hi, axis_len_fn):
    """lo〜hi の あいだで、絵が いちばん すくない 線の いち"""
    best, at = None, (lo + hi) // 2
    for v in range(lo, hi):
        n = axis_len_fn(v)
        if best is None or n < best: best, at = n, v
    return at

# れつ ごとに だんの さかいめ・だん ごとに れつの さかいめ を、すきまの いちばん おおきい ところに する
# （となりの 人の ぼうしの 先などが はいりこまないように）
band_y, band_x = int(H / rows * 0.18), int(W / cols * 0.18)
def ybounds(c):
    xa, xb = round(c * W / cols), round((c + 1) * W / cols)
    ys = [0] + [cut_line(round(r * H / rows) - band_y, round(r * H / rows) + band_y, lambda v: FG[v, xa:xb].sum()) for r in range(1, rows)] + [H]
    return ys
def xbounds(r, y0, y1):
    return [0] + [cut_line(round(c * W / cols) - band_x, round(c * W / cols) + band_x, lambda v: FG[y0:y1, v].sum()) for c in range(1, cols)] + [W]

cuts = []
for k, name in enumerate(names):
    r, c = divmod(k, cols)
    yb = ybounds(c); y0, y1 = yb[r], yb[r + 1]
    xb = xbounds(r, y0, y1); x0, x1 = xb[c], xb[c + 1]
    cell = im[y0:y1, x0:x1]
    bg, mn = flood_bg(cell)
    # つえと からだの すきま など、かこまれた はいけい（まっしろで いろの かたよりが ない ところ）も すかす
    # （そうりょの ふくの 白は すこし きいろっぽいので のこる）
    mx = cell.max(axis=2)
    pure = (mn >= 240) & ((mx - mn) <= 8) & ~bg
    bg = bg | enclosed_bg(pure, mn)
    alpha = np.where(bg, 0, 255).astype(np.int16)
    # はいけいの となりの うすい いろは すこし すかす（白い ふちを のこさない）
    near = np.zeros_like(bg)
    near[1:, :] |= bg[:-1, :]; near[:-1, :] |= bg[1:, :]; near[:, 1:] |= bg[:, :-1]; near[:, :-1] |= bg[:, 1:]
    edge = near & ~bg
    alpha[edge] = np.clip((255 - mn[edge]) * 255 // 60, 0, 255)
    fg = alpha > 0
    alpha[parts(fg, 150)] = 0
    ys, xs = np.nonzero(alpha > 20)
    if not len(ys): raise SystemExit(f'{name}：絵が みつかりません')
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.dstack([cell, alpha]).astype(np.uint8)[by0:by1, bx0:bx1]
    cuts.append((name, Image.fromarray(rgba, 'RGBA')))

pad = 8
bw = max(i.width for _, i in cuts) + pad * 2
bh = max(i.height for _, i in cuts) + pad * 2
for name, img in cuts:
    box = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    box.paste(img, ((bw - img.width) // 2, bh - pad - img.height), img)
    box.save(os.path.join(out_dir, name + '.webp'), 'WEBP', quality=90, method=6)
    print('書きました：img/' + name + '.webp', box.size)

if preview:  # くらい いろと あかるい いろの 上に ならべて、白い ふちが のこって いないか 見る
    sheet = Image.new('RGBA', (bw * cols, bh * rows * 2), (30, 41, 59, 255))
    for k, (name, img) in enumerate(cuts):
        r, c = divmod(k, cols)
        b = Image.open(os.path.join(out_dir, name + '.webp'))
        sheet.paste(b, (c * bw, r * bh), b)
        light = Image.new('RGBA', (bw, bh), (250, 204, 21, 255)); light.paste(b, (0, 0), b)
        sheet.paste(light, (c * bw, (rows + r) * bh))
    sheet.convert('RGB').save(preview)
