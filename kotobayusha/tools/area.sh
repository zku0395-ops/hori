#!/bin/sh
# usage: sh tools/area.sh 02   (run in the app folder)
# uses Downloads/kotoba_aNN_bg.png and the two question sheets; a file still pending as .tmp is taken from the newest .tmp
A=$1
D=/c/Users/PC_User/Downloads
S=/c/Users/PC_User/AppData/Local/Temp/claude/a80b1560e270a5a1/fbd18a70-89ba-40ca-8828-d71f332abbae/scratchpad/src
pick() { if [ -f "$S/$1" ]; then echo "$S/$1"; elif [ -f "$D/$1" ]; then echo "$D/$1"; else echo "$D/$(ls -t "$D" | grep '\.tmp$' | head -1)"; fi; }
win() { echo "$1" | sed 's#^/c/#C:/#'; }
BG=$(pick "kotoba_a${A}_bg.png"); S1=$(pick "kotoba_sheet_a${A}_q1-6.png"); S2=$(pick "kotoba_sheet_a${A}_q7-10.png")
echo "bg=$BG"; echo "s1=$S1"; echo "s2=$S2"
cp "$BG" "images/area/a${A}.png" && echo "bg ok"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/split.ps1 -In "$(win "$S1")" -Cols 3 -Rows 2 -Inset 8 \
  -Out "images/q/a${A}_q01.png,images/q/a${A}_q02.png,images/q/a${A}_q03.png,images/q/a${A}_q04.png,images/q/a${A}_q05.png,images/q/a${A}_q06.png"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/split.ps1 -In "$(win "$S2")" -Cols 2 -Rows 2 -Inset 8 \
  -Out "images/q/a${A}_q07.png,images/q/a${A}_q08.png,images/q/a${A}_q09.png,images/q/a${A}_q10.png"
