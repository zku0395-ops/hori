# パネルから 1600x400 の へやの絵を作る：python3 rooms.py 入力 x0,y0,x1,y1:下からの余白:出力 ...
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
prev = Image.new('RGB', (1150, 180 * (len(sys.argv) - 2)), 'white')
for k, spec in enumerate(sys.argv[2:]):
    box, off, out = spec.split(':'); x0, y0, x1, y1 = map(int, box.split(','))
    x0 += 6; x1 -= 6; y0 += 6; y1 -= 6
    sh = (x1 - x0) // 4; b = y1 - int(off); t = b - sh
    r = im.crop((x0, t, x1, b)).resize((1600, 400), Image.LANCZOS)
    r.save(out, 'WEBP', quality=86)
    # アプリの場面（1150x168、object-cover）の見え方
    ch = int(1600 * 168 / 1150); c = r.crop((0, (400 - ch) // 2, 1600, (400 - ch) // 2 + ch)).resize((1150, 168))
    prev.paste(c, (0, k * 180))
prev.save('rooms_prev.png')
