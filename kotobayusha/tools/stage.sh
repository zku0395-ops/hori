#!/bin/sh
# usage: sh tools/stage.sh name1.png name2.png ...
# The newest N unfinished downloads (.tmp), oldest first, are copied to the staging folder as name1, name2, ...
D=/c/Users/PC_User/Downloads
S=/c/Users/PC_User/AppData/Local/Temp/claude/a80b1560e270a5a1/fbd18a70-89ba-40ca-8828-d71f332abbae/scratchpad/src
mkdir -p "$S"
N=$#
ls -t "$D" | grep '\.tmp$' | head -$N | tac > /tmp/kstage.txt 2>/dev/null || ls -t "$D" | grep '\.tmp$' | head -$N | tac > "$S/../kstage.txt"
L="$S/../kstage.txt"; [ -s /tmp/kstage.txt ] && L=/tmp/kstage.txt
for name in "$@"; do
  f=$(head -1 "$L"); sed -i '1d' "$L"
  cp "$D/$f" "$S/$name"
  echo "$name <- $f $(od -An -tu1 -j16 -N8 "$S/$name" | awk '{print $3*256+$4 "x" $7*256+$8}')"
done
