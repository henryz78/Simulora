from pathlib import Path
import csv
import json
import time
import requests
from bs4 import BeautifulSoup

ROOT = Path('/home/ubuntu/ai_world_moodboard')
OUT = ROOT / 'staging' / 'kenney_expansion_03'
OUT.mkdir(parents=True, exist_ok=True)
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}

collections = [
    ('3D', 'https://kenney.nl/assets/category:3D', 4, 16),
    ('2D', 'https://kenney.nl/assets/category:2D', 4, 16),
    ('UI', 'https://kenney.nl/assets/tag:interface', 2, 4),
    ('Textures', 'https://kenney.nl/assets/category:Textures', 1, 4),
]
priorities = [
    'interior','furniture','restaurant','hospital','school','office','shop','store','market','house','home','room','cabin','village','town','city','building',
    'transport','train','car','vehicle','space','sci-fi','robot','character','people','animal','creature','pet','food','farm',
    'map','minimap','tile','ui','interface','icon','hud','button','cursor','effect','particle','vfx','weather','water','forest','nature','road','street',
]

def url_for(base, page):
    return base if page == 1 else f'{base}/page:{page}'

def get_directory(label, base, pages):
    found = []; seen = set()
    for page in range(1, pages+1):
        url = url_for(base,page)
        try:
            res = requests.get(url, headers=HEADERS, timeout=20)
        except Exception as exc:
            print('SKIP',url,type(exc).__name__); continue
        if not res.ok:
            print('SKIP',url,res.status_code); continue
        soup = BeautifulSoup(res.text,'html.parser')
        for h2 in soup.find_all('h2'):
            a=h2.find('a',href=True)
            if a and a['href'].startswith('https://kenney.nl/assets/') and a['href'] not in seen:
                seen.add(a['href']); found.append({'title':a.get_text(' ',strip=True),'url':a['href'],'collection':label})
        time.sleep(0.08)
    return found

def score(record):
    text=record['title'].lower()
    return sum(1 for word in priorities if word in text)*1000

def theme(record):
    x=record['title'].lower()
    if any(k in x for k in ['interior','furniture','restaurant','hospital','school','office','shop','market','food','house','home']): return '室内、商店与社区资产'
    if any(k in x for k in ['character','people','animal','creature','pet','rpg']): return '角色、NPC与生物资产'
    if any(k in x for k in ['transport','train','car','vehicle','road','street']): return '载具、公共交通与城市资产'
    if any(k in x for k in ['map','minimap','tile']): return '世界地图与地形资产'
    if any(k in x for k in ['ui','interface','icon','hud','button','cursor']): return 'UI图标、HUD与地图控件'
    if any(k in x for k in ['effect','particle','vfx']): return 'VFX与动态表现资产'
    if any(k in x for k in ['space','sci-fi','robot']): return '科幻地点与文明资产'
    return '世界环境、建筑与道具资产'

def use(record):
    return {
        '室内、商店与社区资产':'家庭、餐厅、商店、公共设施与小型社区的快速 2D／3D 原型',
        '角色、NPC与生物资产':'居民、NPC、职业角色、生物图鉴和行为状态验证',
        '载具、公共交通与城市资产':'道路、车辆、公共交通、城市生活和文明基础设施原型',
        '世界地图与地形资产':'世界地图、地点层、地形符号和区域导航原型',
        'UI图标、HUD与地图控件':'HUD、地图图标、状态面板、交互按钮与运营界面',
        'VFX与动态表现资产':'粒子、事件反馈、天气／魔法／战斗等动态状态表现',
        '科幻地点与文明资产':'科幻社区、太空地点、科技设备与文明设施原型',
        '世界环境、建筑与道具资产':'自然环境、建筑、道具、地块和世界地点的快速生产',
    }[theme(record)]

existing=set()
with (ROOT/'final'/'asset_manifest.csv').open(encoding='utf-8',newline='') as f:
    existing={r['来源链接'] for r in csv.DictReader(f) if r['来源链接']}
chosen=[]
for label,base,pages,quota in collections:
    records=[r for r in get_directory(label,base,pages) if r['url'] not in existing]
    records.sort(key=lambda r:(-score(r),r['title']))
    chosen.extend(records[:quota])
unique=[]; used=set()
for record in chosen:
    if record['url'] not in used:
        used.add(record['url']); unique.append(record)
rows=[]
for ix,record in enumerate(unique,start=1):
    rows.append({
        'id':f'KX{ix:02d}','主题':theme(record),'标题或描述':record['title'],
        '来源线索':f"Kenney / 官方 {record['collection']} 单件资产页",'来源链接':record['url'],
        '适合用在哪里':use(record),
        '可借鉴的视觉特点':'统一风格、可下载的 2D／3D 游戏资产包；单件页可获取预览与下载文件，适合生产原型及可读性验证。',
        '风格关键词':f"Kenney {record['collection']} CC0 {record['title']}",'权利分级':'A-可实际使用',
        '使用边界':'Kenney 官方支持页说明资产页游戏资产为 CC0，可用于商业项目且无需署名；应保留单件页及下载包的 license 文件，不得使用 Kenney logo。',
        'asset_category':record['collection']
    })
fields=['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','asset_category']
with (OUT/'kenney_expansion_03_candidates.csv').open('w',encoding='utf-8',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader(); writer.writerows(rows)
summary={'selected_count':len(rows),'by_theme':{k:sum(r['主题']==k for r in rows) for k in sorted({r['主题'] for r in rows})}}
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
for r in rows: print(r['id'],r['主题'],r['标题或描述'],r['来源链接'])
