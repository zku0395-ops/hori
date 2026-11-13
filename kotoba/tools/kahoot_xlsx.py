# Kahoot! に 取りこめる Excel（.xlsx）を 作る（Kahoot! の「スプレッドシートから 取りこむ」の ひながたと おなじ 形）
# つかいかた：python3 kotoba/tools/kahoot_xlsx.py
import json, os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, '..', 'kahoot')
qs = json.load(open(os.path.join(DIR, 'kahoot_2nen.json'), encoding='utf-8'))

wb = Workbook()
ws = wb.active
ws.title = 'Sheet1'
ws['B1'] = 'ドラッチと ことばの ぼうけん　2ねんせい「みなとの ちほう」の ことば（15もん）'
ws['B1'].font = Font(bold=True, size=14)
ws['B3'] = 'Kahoot! の「スプレッドシートから 取りこむ（Import spreadsheet）」で、この ファイルを えらんで ください。'
ws['B4'] = 'こたえる じかんは 1もん 30びょう。せいかいの ばんごうは H れつに あります。'
ws['B5'] = 'ことば・いみ・ぶんは、アプリ「ドラッチと ことばの ぼうけん」と おなじ です（オリジナル）。'
HEAD = ['Question - max 120 characters', 'Answer 1 - max 75 characters', 'Answer 2 - max 75 characters',
        'Answer 3 - max 75 characters', 'Answer 4 - max 75 characters',
        'Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs', 'Correct answer(s) - choose at least one']
fill = PatternFill('solid', fgColor='46178F')
for i, h in enumerate(HEAD):
    c = ws.cell(row=8, column=2 + i, value=h)
    c.font = Font(bold=True, color='FFFFFF')
    c.fill = fill
    c.alignment = Alignment(wrap_text=True, vertical='center')
for r, q in enumerate(qs):
    row = 9 + r
    ws.cell(row=row, column=1, value=q['no'])
    ws.cell(row=row, column=2, value=q['q'])
    for j, a in enumerate(q['answers']):
        ws.cell(row=row, column=3 + j, value=a)
    ws.cell(row=row, column=7, value=30)
    ws.cell(row=row, column=8, value=q['correct'])
    for col in range(2, 9):
        ws.cell(row=row, column=col).alignment = Alignment(wrap_text=True, vertical='top')
for col, w in zip('ABCDEFGH', [5, 48, 26, 26, 26, 26, 14, 14]):
    ws.column_dimensions[col].width = w
out = os.path.join(DIR, 'ことばの いみ_2ねん_kahoot.xlsx')
wb.save(out)
print('できました：', os.path.relpath(out))
