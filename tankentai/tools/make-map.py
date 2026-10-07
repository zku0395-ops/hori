# 日本地図（都道府県）の SVG パスを作る
#   もとのデータ：Natural Earth（ne_10m_admin_1_states_provinces、パブリックドメイン）から日本の47都道府県を取り出したもの
#   使い方：python3 make-map.py jp.geojson ../data/japan-map.js
import json, math, sys

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))

W = 1000
LON0, LON1, LAT0, LAT1 = 128.6, 146.0, 30.0, 45.7
K = math.cos(math.radians(37))
sx = W / ((LON1 - LON0) * K)
H = round((LAT1 - LAT0) * sx)

# 沖縄県は 左上の わくの中に うつす
OKI = dict(lon0=122.9, lon1=131.4, lat0=24.0, lat1=27.95)
INSET = dict(x=14, y=14, w=0, h=0)
OKS = 0.8
INSET['w'] = round((OKI['lon1'] - OKI['lon0']) * K * sx * OKS)
INSET['h'] = round((OKI['lat1'] - OKI['lat0']) * sx * OKS)

def proj(lon, lat):
    return ((lon - LON0) * K * sx, (LAT1 - lat) * sx)

def proj_oki(lon, lat):
    return (INSET['x'] + (lon - OKI['lon0']) * K * sx * OKS, INSET['y'] + (OKI['lat1'] - lat) * sx * OKS)

def dp(pts, tol):
    if len(pts) < 3:
        return pts
    stack = [(0, len(pts) - 1)]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            dist = abs(dy * px - dx * py + bx * ay - by * ax) / L
            if dist > best:
                best, bi = dist, i
        if best > tol:
            keep[bi] = True
            stack.append((a, bi)); stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]

def area(pts):
    s = 0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2

prefs = {}
for f in d['features']:
    code = f['properties']['iso'].split('-')[1]
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    parts = []
    big = (0, 0, 0)
    for poly in polys:
        ring = poly[0]
        lon_c = sum(p[0] for p in ring) / len(ring)
        lat_c = sum(p[1] for p in ring) / len(ring)
        if code == '47':
            pr = proj_oki
        elif lat_c < 29.0:
            continue  # 小笠原・奄美などの 遠い 島は のせない（沖縄県だけ わくに 入れる）
        else:
            pr = proj
        pts = [pr(x, y) for x, y in ring[:-1]]
        pts = dp(pts, 0.7)
        if len(pts) < 3:
            continue
        a = area(pts)
        if a < (2 if code == '47' else 10):
            continue
        parts.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
        if a > big[0]:
            cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
            big = (a, cx, cy)
    prefs[code] = {'d': ''.join(parts), 'cx': round(big[1], 1), 'cy': round(big[2], 1)}

data = {'w': W, 'h': H, 'inset': INSET, 'prefs': prefs}
with open(out, 'w') as fo:
    fo.write('// 日本地図（都道府県）。tools/make-map.py で作りました。\n')
    fo.write('// もとのデータ：Natural Earth（パブリックドメイン）。小笠原などの遠い島は省き、沖縄県は左上のわくに入れています。\n')
    fo.write('window.JAPAN_MAP = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print(W, H, INSET, sum(len(v['d']) for v in prefs.values()))
