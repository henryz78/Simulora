from bs4 import BeautifulSoup
from pathlib import Path

source = Path('/home/ubuntu/browser_html/worldos_cc_maps_1787653893171.html')
soup = BeautifulSoup(source.read_text(encoding='utf-8'), 'html.parser')
seen = set()
rows = []
for a in soup.find_all('a', title='查看这个世界', href=True):
    href = a['href']
    if not href.startswith('/zh-cn/worlds/') or href in seen:
        continue
    seen.add(href)
    ancestor = a
    card = None
    while ancestor.parent:
        ancestor = ancestor.parent
        classes = set(ancestor.get('class') or [])
        if {'group', 'rounded-2xl', 'bg-card', 'overflow-hidden'}.issubset(classes):
            card = ancestor
            break
    if card is None:
        rows.append((href, 'NO_CARD_ANCESTOR', str(a)[:800]))
    elif not card.find('button', title='点击查看大图'):
        rows.append((href, 'NO_PREVIEW_BUTTON', str(card)[:2500]))

print('unique detail hrefs:', len(seen))
print('missing preview/card:', len(rows))
for i, row in enumerate(rows[:5], 1):
    print('\n---', i, row[0], row[1], '---')
    print(row[2])
