#!/bin/sh
# ことばの ゆうしゃ ワークシートの PDF を作ります（Windows の Git Bash で 動かします）。
# つかいかた：sh kotobayushaprint/tools/make-pdf.sh
# Edge の「PDF に 印刷」を つかいます。できた PDF は kotobayushaprint/pdf/ に入ります。
# Edge が ほかの 場所に あるときは、BROWSER に その exe の 場所を 入れて 動かします。
cd "$(dirname "$0")/.." || exit 1
BROWSER="${BROWSER:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
DIR="$(pwd -W 2>/dev/null || pwd)"
TMP="$(mktemp -d)"
TMPW="$(cd "$TMP" && (pwd -W 2>/dev/null || pwd))"
mkdir -p pdf
# ファイル名には 記号を 使わない（メールや ほかの パソコンで 文字化け しないように）
for v in "color 1_カラー" "mono 2_しろくろ" "key 3_こたえ"; do
  set -- $v
  rm -f "$TMP/out.pdf"
  "$BROWSER" --headless --disable-gpu --no-pdf-header-footer --user-data-dir="$TMPW/prof$1" \
    --virtual-time-budget=60000 --print-to-pdf="$TMPW/out.pdf" "file:///$DIR/index.html?print=1&v=$1"
  # Edge は すぐ もどって、うしろで PDF を 書くので、できあがるまで まつ
  n=0; last=-1
  while [ $n -lt 300 ]; do
    sz=$( { [ -f "$TMP/out.pdf" ] && wc -c < "$TMP/out.pdf"; } || echo 0)
    if [ "$sz" -gt 0 ] && [ "$sz" = "$last" ]; then break; fi
    last=$sz; n=$((n+3)); sleep 3
  done
  if [ ! -s "$TMP/out.pdf" ]; then echo "できませんでした：$2"; exit 1; fi
  mv "$TMP/out.pdf" "pdf/ことばのゆうしゃワークシート_$2.pdf"
  echo "できました：pdf/ことばのゆうしゃワークシート_$2.pdf"
done
rm -rf "$TMP"
