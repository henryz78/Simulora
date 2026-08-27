from pathlib import Path
import csv
import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

ROOT=Path('/home/ubuntu/ai_world_moodboard')
OUT=ROOT/'staging'/'quaternius_expansion_03'
OUT.mkdir(parents=True,exist_ok=True)
BASE='https://quaternius.com/'
HEADERS={'User-Agent':'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}
priority_terms=[
    'interior','furniture','restaurant','sushi','house','building','farm','village','city','street','downtown','transport','train','car','ship',
    'character','women','men','human','animation','animal','monster','fish','dinosaur','alien','robot','zombie','knight',
    'space','sci','cyberpunk','mech','gun','turret','nature','tree','crops','ruins','dungeon','pirate','medieval','fantasy','food','props'
]

with (ROOT/'final'/'asset_manifest.csv').open(encoding='utf-8',newline='') as f:
    existing={row['来源链接'] for row in csv.DictReader(f) if row['来源链接']}
res=requests.get(BASE,headers=HEADERS,timeout=45); res.raise_for_status()
soup=BeautifulSoup(res.text,'html.parser')
records=[]; seen=set()
for a in soup.find_all('a',href=True):
    url=urljoin(BASE,a['href'])
    if '/packs/' not in url or not url.endswith('.html') or url in seen or url in existing:
        continue
    seen.add(url)
    img=a.find('img')
    title=(img.get('alt','').strip() if img else '') or a.get_text(' ',strip=True)
    if not title:
        slug=url.rsplit('/',1)[-1].replace('.html','')
        title=re.sub(r'(?<=[a-z])(?=[A-Z])',' ',slug.replace('_',' ')).replace('ultimate','Ultimate ').replace('animated','Animated ').replace('modular','Modular ').strip().title()
    records.append({'title':title,'url':url})

def score(r):
    text=r['title'].lower()+' '+r['url'].lower()
    return sum(1 for term in priority_terms if term in text)*1000
records.sort(key=lambda r:(-score(r),r['title']))
selected=records[:36]

def theme(r):
    text=(r['title']+' '+r['url']).lower()
    if any(k in text for k in ['interior','furniture','restaurant','sushi','house','food']):return '室内、家具与生活空间资产'
    if any(k in text for k in ['character','women','men','human','animation','knight']):return '角色、NPC与角色动画资产'
    if any(k in text for k in ['animal','monster','fish','dinosaur','alien','zombie']):return '生物、Creature与生态资产'
    if any(k in text for k in ['train','car','ship','transport','street','city','downtown','building','village','farm']):return '城市、社区与公共交通资产'
    if any(k in text for k in ['space','sci','cyberpunk','mech','robot','gun','turret']):return '科幻地点与文明资产'
    if any(k in text for k in ['nature','tree','crops']):return '植被、地形与世界环境资产'
    return '奇幻地点、建筑与道具资产'

def use(r):
    return {
        '室内、家具与生活空间资产':'家庭、商店、餐厅、公共空间和现代生活场景的 3D 原型',
        '角色、NPC与角色动画资产':'居民、NPC、职业、情绪、移动和动作状态验证',
        '生物、Creature与生态资产':'生态区、物种图鉴、世界事件和生物行为原型',
        '城市、社区与公共交通资产':'大型文明、小型社区、建筑、道路、公共交通和城市生活',
        '科幻地点与文明资产':'科幻室内外地点、星际文明、装备和科技派系',
        '植被、地形与世界环境资产':'植被、农业、自然环境和可变化世界地块',
        '奇幻地点、建筑与道具资产':'奇幻室内外地点、遗迹、道具和世界探索场景',
    }[theme(r)]
rows=[]
for index,r in enumerate(selected,start=1):
    rows.append({'id':f'QX{index:02d}','主题':theme(r),'标题或描述':r['title'],'来源线索':'Quaternius / 官方单件 pack page','来源链接':r['url'],'适合用在哪里':use(r),'可借鉴的视觉特点':'官方低多边形 3D 资产包，支持以模块化方式搭建世界地点、居民或状态动画；具体格式和包内容以单件页为准。','风格关键词':f"Quaternius CC0 3D {r['title']}",'权利分级':'A-可实际使用','使用边界':'Quaternius 单项页面与下载包中的 CC0 声明为最终依据。部分完整包／源文件可能存在付费下载选项；下载所用版本后归档 license 文件与来源 URL。'})
fields=['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界']
with (OUT/'quaternius_expansion_03_candidates.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
summary={'selected_count':len(rows),'by_theme':{k:sum(r['主题']==k for r in rows) for k in sorted({r['主题'] for r in rows})}}
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
for r in rows:print(r['id'],r['主题'],r['标题或描述'],r['来源链接'])
