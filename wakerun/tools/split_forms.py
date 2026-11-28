# 4×3 に ならんだ すがたの 絵を 12まいに 切りわけて、img/form_<なまえ>.webp に する道具
# つかいかた：unchecker_usui.py で forms_cut.png を つくってから、python3 wakerun/tools/split_forms.py
import os, sys
from PIL import Image
from collections import deque
im = Image.open(sys.argv[1] if len(sys.argv) > 1 else 'forms_cut.png')
names = ['cat','rabbit','bear','penguin','frog','unicorn','dragon','lion','alien','eagle','tiger','star']
W, H = im.size; cw, ch = W / 4, H / 3; S = 640
sheet = Image.new('RGBA', (S * 4 // 2, S * 3 // 2), (30, 27, 75, 255))
for k, n in enumerate(names):
    r, c = divmod(k, 4)
    cell = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
    w, h = cell.size; a = cell.getchannel('A'); ap = a.load()
    # ちいさな のこりを けす（300px より ちいさい かたまり）
    seen = bytearray(w * h); keep = Image.new('L', (w, h), 0); kp = keep.load()
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or ap[sx, sy] < 40: continue
            comp = []; q = deque([(sx, sy)]); seen[sy * w + sx] = 1
            while q:
                x, y = q.popleft(); comp.append((x, y))
                for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and ap[nx, ny] >= 40:
                        seen[ny * w + nx] = 1; q.append((nx, ny))
            if len(comp) >= 300:
                for p in comp: kp[p] = 255
    keep = keep.filter(__import__('PIL.ImageFilter', fromlist=['x']).MaxFilter(5))
    from PIL import ImageChops
    cell.putalpha(ImageChops.multiply(a, keep))
    bb = cell.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    fig = cell.crop(bb); fw, fh = fig.size
    sc = min(S * 0.97 / fh, S * 0.98 / fw)
    fig = fig.resize((round(fw * sc), round(fh * sc)), Image.LANCZOS)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(fig, ((S - fig.width) // 2, S - fig.height - 6))
    out.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', f'form_{n}.webp'), 'WEBP', quality=88, method=6)
    sheet.alpha_composite(out.resize((S // 2, S // 2)), (c * S // 2, r * S // 2))
sheet.convert('RGB').save('forms_sheet.png')  # 12まいを ならべた 見本
print('ok')
