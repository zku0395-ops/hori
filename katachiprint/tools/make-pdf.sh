#!/bin/bash
# サンカの かたち ワークシートの PDF（①〜⑧ × 50まい と こたえ）を 作り直します。
# つかいかた：リポジトリの いちばん上を http://localhost:8765/ で 見られるように してから、
#   bash katachiprint/tools/make-pdf.sh
# Edge（または Chrome）の「PDF に 保存」を、画面を 出さずに 動かします。
EDGE="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
BASE="${BASE:-http://localhost:8765/katachiprint/}"
OUT="$(cd "$(dirname "$0")/../pdf" && pwd)"
PROF="$(mktemp -d)"
NAMES=(さんかくけいをかこう しかくけいをかこう へんとちょうてん かずをかぞえよう みつけよう なまえとわけ へんをかきたそう まとめ)
for t in 1 2 3 4 5 6 7 8; do
  for m in all ans; do
    name="かたちワークシート_${t}_${NAMES[$((t-1))]}"; [ "$m" = ans ] && name="${name}_こたえ"
    "$EDGE" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --user-data-dir="$(cygpath -w "$PROF")" \
      --print-to-pdf="$(cygpath -w "$OUT/$name.pdf")" "${BASE}?type=${t}&print=${m}" >/dev/null 2>&1
    echo "$name.pdf"
  done
done
