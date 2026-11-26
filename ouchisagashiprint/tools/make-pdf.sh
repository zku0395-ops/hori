#!/bin/bash
# ホーせんぱいの おうちさがし プリントの PDF（子ども用 と こたえ）を 作り直します。
# つかいかた：リポジトリの いちばん上を http://localhost:8765/ で 見られるように してから、
#   bash ouchisagashiprint/tools/make-pdf.sh
# Edge（または Chrome）の「PDF に 保存」を、画面を 出さずに 動かします。
EDGE="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
BASE="${BASE:-http://localhost:8765/ouchisagashiprint/}"
mkdir -p "$(dirname "$0")/../pdf"
OUT="$(cd "$(dirname "$0")/../pdf" && pwd)"
PROF="$(mktemp -d)"
for m in all ans; do
  name="おうちさがしプリント"; [ "$m" = ans ] && name="${name}_こたえ"
  "$EDGE" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=15000 --user-data-dir="$(cygpath -w "$PROF")" \
    --print-to-pdf="$(cygpath -w "$OUT/$name.pdf")" "${BASE}?print=${m}" >/dev/null 2>&1
  echo "$name.pdf"
done
