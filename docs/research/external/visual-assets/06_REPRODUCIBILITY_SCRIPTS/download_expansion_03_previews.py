from pathlib import Path
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup

ROOT=Path('/home/ubuntu/ai_world_moodboard')
OUT=ROOT/'assets'/'references_production_03'
OUT.mkdir(parents=True,exist_ok=True)
HEADERS={'User-Agent':'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}
inputs=[
    (ROOT/'staging'/'polyhaven_expansion_03'/'polyhaven_expansion_03_candidates.csv','polyhaven'),
    (ROOT/'staging'/'kenney_expansion_03'/'kenney_expansion_03_candidates.csv','kenney'),
    (ROOT/'staging'/'quaternius_expansion_03'/'quaternius_expansion_03_candidates.csv','quaternius'),
    (ROOT/'staging'/'kenney_vfx_ui_expansion_03_candidates.csv','kenney'),
]
rows=[]
for path,source in inputs:
    with path.open(encoding='utf-8',newline='') as f:
        rows.extend([{**row,'_source':source} for row in csv.DictReader(f)])

def find_preview(row):
    if row['_source']=='polyhaven':
        return row.get('thumbnail_url','')
    response=requests.get(row['来源链接'],headers=HEADERS,timeout=(5,12))
    response.raise_for_status()
    soup=BeautifulSoup(response.text,'html.parser')
    og=soup.find('meta',attrs={'property':'og:image'})
    if og and og.get('content'): return og['content']
    # Kenney exposes individual preview image links in the body.
    for image in soup.find_all('img'):
        src=image.get('src','')
        if 'preview' in src.lower() and ('kenney.nl' in src or src.startswith('/')):
            return requests.compat.urljoin(row['来源链接'],src)
    # Quaternius full-resolution cards may be exposed as an image link rather than OG metadata.
    for image in soup.find_all('img'):
        src=image.get('src','')
        if 'fullres' in src.lower(): return requests.compat.urljoin('https://quaternius.com/',src)
    return ''

def download(row):
    try:
        url=find_preview(row)
        if not url:return row['id'],False,'no_preview_url'
        response=requests.get(url,headers=HEADERS,timeout=(5,18),stream=True)
        response.raise_for_status()
        content=bytearray()
        for chunk in response.iter_content(65536):
            content.extend(chunk)
            if len(content)>6*1024*1024: break
        if not content:return row['id'],False,'empty'
        content_type=response.headers.get('content-type','').lower()
        ext='.png' if 'png' in content_type else '.jpg'
        (OUT/f"{row['id']}{ext}").write_bytes(content)
        return row['id'],True,url
    except Exception as exc:return row['id'],False,type(exc).__name__

results=[]
with ThreadPoolExecutor(max_workers=10) as ex:
    futures=[ex.submit(download,row) for row in rows]
    for future in as_completed(futures):results.append(future.result())
print('downloaded',sum(ok for _,ok,_ in results),'of',len(results))
for result in sorted(results):print(*result,sep='\t')
