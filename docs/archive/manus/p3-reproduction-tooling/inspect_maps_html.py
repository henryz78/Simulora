from bs4 import BeautifulSoup
from pathlib import Path

html_path = Path('/home/ubuntu/browser_html/worldos_cc_maps_1787653433922.html')
soup = BeautifulSoup(html_path.read_text(encoding='utf-8'), 'html.parser')
anchor = soup.find('a', href='/zh-cn/worlds/demon-slayer-simulator')
print('anchor found:', bool(anchor))
if anchor:
    print('anchor text:', anchor.get_text(' ', strip=True))
    current = anchor
    for level in range(6):
        current = current.parent
        print('\nLEVEL', level + 1, 'TAG', current.name, 'CLASS', current.get('class'))
        print(str(current)[:3500])

world_anchors = [a for a in soup.find_all('a', href=True) if a['href'].startswith('/zh-cn/worlds/')]
print('\nworld anchor total:', len(world_anchors))
print('unique:', len(set(a['href'] for a in world_anchors)))
print('first hrefs:', [a['href'] for a in world_anchors[:8]])
print('last hrefs:', [a['href'] for a in world_anchors[-8:]])
