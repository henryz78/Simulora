import requests
from bs4 import BeautifulSoup

url = 'https://quaternius.com/'
res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}, timeout=60)
print('STATUS', res.status_code, 'LENGTH', len(res.text), 'FINAL', res.url)
soup = BeautifulSoup(res.text, 'html.parser')
print('TITLE', soup.title.get_text(' ', strip=True) if soup.title else '')
links = [(a.get_text(' ', strip=True), a.get('href','')) for a in soup.find_all('a', href=True)]
print('LINK_COUNT', len(links))
for text, href in links[:80]:
    print(repr(text), repr(href))
