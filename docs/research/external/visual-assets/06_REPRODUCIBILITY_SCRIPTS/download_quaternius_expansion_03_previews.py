from pathlib import Path
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

ROOT=Path('/home/ubuntu/ai_world_moodboard')
CSV_PATH=ROOT/'staging'/'quaternius_expansion_03'/'quaternius_expansion_03_candidates.csv'
OUT=ROOT/'assets'/'references_production_03'
OUT.mkdir(parents=True,exist_ok=True)
HEADERS={'User-Agent':'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}
with CSV_PATH.open(encoding='utf-8',newline='') as f:rows=list(csv.DictReader(f))

def work(row):
    try:
        page=requests.get(row['来源链接'],headers=HEADERS,timeout=(5,14))
        page.raise_for_status()
        soup=BeautifulSoup(page.text,'html.parser')
        target=''
        for image in soup.find_all('img'):
            src=image.get('src','')
            if 'fullres' in src.lower():
                target=urljoin('https://quaternius.com/',src);break
        if not target:return row['id'],False,'no_fullres'
        image=requests.get(target,headers=HEADERS,timeout=(5,18),stream=True)
        image.raise_for_status()
        data=bytearray()
        for chunk in image.iter_content(65536):
            data.extend(chunk)
            if len(data)>5*1024*1024:break
        ext='.png' if 'png' in image.headers.get('content-type','').lower() else '.jpg'
        (OUT/f"{row['id']}{ext}").write_bytes(data)
        return row['id'],True,target
    except Exception as exc:return row['id'],False,type(exc).__name__

results=[]
with ThreadPoolExecutor(max_workers=10) as ex:
    futures=[ex.submit(work,row) for row in rows]
    for future in as_completed(futures):results.append(future.result())
print('downloaded',sum(ok for _,ok,_ in results),'of',len(results))
for result in sorted(results):print(*result,sep='\t')
