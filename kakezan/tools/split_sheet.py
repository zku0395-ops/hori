# ChatGPT で まとめて 作った 絵（白い はいけいに よこ○れつ × たて○だん）を 1まいずつに 切りわける 道具
# つかいかた：python3 kakezan/tools/split_sheet.py <絵> <よこの れつ> <たての だん> <なまえ,なまえ,...> [みほんの 絵]
#   ・なまえは 上の だんの 左から じゅんに（.webp を つけずに）。kakezan/img/<なまえ>.webp に 書きます
#   ・ふちから つながった 白い ところだけを とうめいに します（ふくの 白い ところは のこります）
#   ・おなじ シートの 絵は、おなじ 大きさの わくに 足もとを そろえて おきます（ならべた ときに 大きさが そろう）
#   ・--keep=なまえ,… を つけると、その 絵は くろい せんに かこまれた 白（白目 など）を けしません
#   ・--each を つけると、1まいずつ ましかくの わくいっぱいに します（モンスター。小さい モンスターも 大きく 見える）
import os, sys
import numpy as np
from PIL import Image

EACH = '--each' in sys.argv  # 1たいずつ、ましかくの わくいっぱいに する（モンスター）
# --keep=なまえ,なまえ：かこまれた 白（白目 など）を けさない 絵
KEEP = set(sum([a.split('=', 1)[1].split(',') for a in sys.argv[1:] if a.startswith('--keep=')], []))
args = [a for a in sys.argv[1:] if a != '--each' and not a.startswith('--keep=')]
src, cols, rows, names = args[0], int(args[1]), int(args[2]), args[3].split(',')
preview = args[4] if len(args) > 4 else None
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
def gap_cuts(proj, n):
    """絵の ない すきま（proj が ほぼ 0 の ところ）の うち、ひろい じゅんに n こ えらび、その まんなかを かえす。
    たりない ときは None"""
    if n <= 0: return []
    empty = proj <= 1
    runs, i, L = [], 0, len(proj)
    while i < L:
        if empty[i]:
            j = i
            while j < L and empty[j]: j += 1
            if i > 0 and j < L: runs.append((j - i, i, j))  # はしの よはくは のぞく
            i = j
        else: i += 1
    if len(runs) < n: return None
    return sorted((a + b) // 2 for _, a, b in sorted(runs, reverse=True)[:n])

# まず 絵と 絵の あいだの すきまで くぎる（ならびが そろって いない ときも きれる）。
# すきまが たりない ときは、れつ ごとに だんの さかいめ・だん ごとに れつの さかいめ を、絵が いちばん すくない 線に する
# （となりの 人の ぼうしの 先などが はいりこまないように）
def ybounds(c):
    g = gap_cuts(FG.sum(axis=1), rows - 1)
    if g is not None: return [0] + g + [H]
    xa, xb = round(c * W / cols), round((c + 1) * W / cols)
    return [0] + [cut_line(round(r * H / rows) - band_y, round(r * H / rows) + band_y, lambda v: FG[v, xa:xb].sum()) for r in range(1, rows)] + [H]
def xbounds(r, y0, y1):
    g = gap_cuts(FG[y0:y1].sum(axis=0), cols - 1)
    if g is not None: return [0] + g + [W]
    return [0] + [cut_line(round(c * W / cols) - band_x, round(c * W / cols) + band_x, lambda v: FG[y0:y1, v].sum()) for c in range(1, cols)] + [W]

# 絵の かたまりで わける（ならびが ずれて いて、となりと たてに かさなって いても きれる）
def label_all(mask):
    """つながった 絵の かたまりに ばんごうを つける"""
    lab = np.zeros(mask.shape, np.int32); n = 0; info = []
    h, w = mask.shape
    for sy, sx in zip(*np.nonzero(mask)):
        if lab[sy, sx]: continue
        n += 1; lab[sy, sx] = n; stack = [(sy, sx)]; ys = []; xs = []
        while stack:
            y, x = stack.pop(); ys.append(y); xs.append(x)
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; stack.append((ny, nx))
        info.append({'id': n, 'area': len(ys), 'cy': float(np.mean(ys)), 'cx': float(np.mean(xs)),
                     'box': (min(ys), max(ys) + 1, min(xs), max(xs) + 1)})
    return lab, info

def split_by_gaps(vals, n):
    """ならべた かずを、いちばん ひろい あいだ n-1 こで n この グループに わける（かえすのは くぎりの あたい）"""
    v = sorted(vals)
    gaps = sorted(range(1, len(v)), key=lambda i: v[i] - v[i - 1], reverse=True)[:n - 1]
    return sorted((v[i] + v[i - 1]) / 2 for i in gaps)

def group_objects():
    lab, info = label_all(FG)
    big_min = (W / cols) * (H / rows) * 0.02
    big = [o for o in info if o['area'] >= big_min]
    if len(big) < cols * rows: return None
    ycut = split_by_gaps([o['cy'] for o in big], rows)
    for o in big: o['r'] = sum(o['cy'] > t for t in ycut)
    for r in range(rows):
        row = [o for o in big if o['r'] == r]
        if len({round(o['cx']) for o in row}) < cols: return None
        xcut = split_by_gaps([o['cx'] for o in row], cols)
        for o in row: o['c'] = sum(o['cx'] > t for t in xcut)
    # ちいさい かたまり（きらきら・あわ など）は、いちばん ちかい おおきい かたまりの なかまに する
    def dist(a, b):
        y0, y1, x0, x1 = b['box']
        dy = max(y0 - a['cy'], 0, a['cy'] - y1); dx = max(x0 - a['cx'], 0, a['cx'] - x1)
        return dx * dx + dy * dy
    groups = {}
    for o in info:
        g = o if o in big else min(big, key=lambda b: dist(o, b))
        groups.setdefault((g['r'], g['c']), []).append(o['id'])
    if len(groups) != cols * rows: return None
    return lab, groups

grouped = group_objects()
if grouped is None: print('かたまりで わけられなかったので、すきまで くぎります')

cuts = []
for k, name in enumerate(names):
    r, c = divmod(k, cols)
    if grouped:
        lab, groups = grouped
        mine = np.isin(lab, groups[(r, c)])
        ys, xs = np.nonzero(mine)
        y0, y1, x0, x1 = max(0, ys.min() - 6), min(H, ys.max() + 7), max(0, xs.min() - 6), min(W, xs.max() + 7)
        cell = im[y0:y1, x0:x1].copy()
        cell[~mine[y0:y1, x0:x1] & FG[y0:y1, x0:x1]] = 255  # となりの 絵は 白に して けす
    else:
        yb = ybounds(c); y0, y1 = yb[r], yb[r + 1]
        xb = xbounds(r, y0, y1); x0, x1 = xb[c], xb[c + 1]
        cell = im[y0:y1, x0:x1]
    bg, mn = flood_bg(cell)
    # つえと からだの すきま など、かこまれた はいけい（まっしろで いろの かたよりが ない ところ）も すかす
    # （そうりょの ふくの 白は すこし きいろっぽいので のこる）
    mx = cell.max(axis=2)
    pure = (mn >= 240) & ((mx - mn) <= 8) & ~bg
    if name not in KEEP: bg = bg | enclosed_bg(pure, mn)
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
if EACH: bw = bh = max(bw, bh)
for name, img in cuts:
    if EACH:  # わくいっぱいに のばす
        k = (bw - pad * 2) / max(img.width, img.height)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
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
