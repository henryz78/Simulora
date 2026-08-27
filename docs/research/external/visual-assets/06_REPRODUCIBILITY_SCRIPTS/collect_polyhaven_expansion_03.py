from pathlib import Path
import csv
import json
import re
import requests

ROOT=Path('/home/ubuntu/ai_world_moodboard')
OUT=ROOT/'staging'/'polyhaven_expansion_03'
OUT.mkdir(parents=True,exist_ok=True)
THUMBS=OUT/'thumbnails'; THUMBS.mkdir(exist_ok=True)
HEADERS={'User-Agent':'ManusVisualAssetResearch/1.0'}
raw_path=ROOT/'staging'/'polyhaven'/'raw_assets.json'
if raw_path.exists():
    assets=json.loads(raw_path.read_text(encoding='utf-8'))
else:
    response=requests.get('https://api.polyhaven.com/assets',headers=HEADERS,timeout=60);response.raise_for_status();assets=response.json()

with (ROOT/'final'/'asset_manifest.csv').open(encoding='utf-8',newline='') as f:
    existing={row['来源链接'].rstrip('/') for row in csv.DictReader(f) if row['来源链接']}

keywords={
    0:['interior','night','city','street','dusk','rain','overcast','warehouse','office','studio','apartment','restaurant','sunset'],
    1:['wood','fabric','carpet','tile','marble','brick','wall','floor','metal','leather','water','grass','moss','plaster','wooden'],
    2:['furniture','chair','table','sofa','lamp','shelf','bed','kitchen','desk','cabinet','door','window','apartment','building','restaurant','shop','vehicle','car','train','street','bench','tree','plant','sign','bottle','book'],
}
limits={0:7,1:8,2:22}

def text(meta):
    return ' '.join([meta.get('name',''),meta.get('description',''),meta.get('category',''),' '.join(meta.get('tags',[]))]).lower()

def score(meta, typ):
    tx=text(meta); hits=sum(1 for k in keywords[typ] if k in tx)
    return hits*10000000+min(meta.get('download_count',0),5000000)

def kind(typ): return {0:'HDRI',1:'PBR Texture',2:'3D Model'}[typ]

def theme(meta,typ):
    tx=text(meta)
    if typ==0: return '动态背景、城市夜景与环境光照'
    if typ==1: return '室内、建筑与地表 PBR 材质'
    if any(k in tx for k in ['furniture','chair','table','sofa','bed','kitchen','desk','cabinet','lamp']): return '室内、家具与生活空间资产'
    if any(k in tx for k in ['building','apartment','street','shop','restaurant','sign','bench']): return '城市、社区与公共空间资产'
    if any(k in tx for k in ['vehicle','car','train']): return '载具与城市交通资产'
    if any(k in tx for k in ['tree','plant']): return '植被、地形与生态资产'
    return '世界道具与场景资产'

def use(meta,typ):
    return {
        '动态背景、城市夜景与环境光照':'3D 世界的昼夜、城市夜景、天气、室内外反射和宣传镜头环境光',
        '室内、建筑与地表 PBR 材质':'建筑、室内、道路、地形和道具的高分辨率 PBR 表面',
        '室内、家具与生活空间资产':'家庭、商店、餐厅、学校、办公室和生活场景的写实 3D 原型',
        '城市、社区与公共空间资产':'社区、街道、商店、公共空间和城市文明地点的模块化场景',
        '载具与城市交通资产':'车辆、街道交通与文明基础设施原型',
        '植被、地形与生态资产':'植被、生态区、自然地形和世界地点的高质量 3D 场景',
        '世界道具与场景资产':'可互动道具、叙事物件和室内外场景细节',
    }[theme(meta,typ)]

selected=[]
for typ in (0,1,2):
    pool=[]
    for asset_id,meta in assets.items():
        if meta.get('type')!=typ:continue
        link=f'https://polyhaven.com/a/{asset_id}'
        if link.rstrip('/') in existing:continue
        if not any(k in text(meta) for k in keywords[typ]):continue
        pool.append((score(meta,typ),asset_id,meta))
    pool.sort(reverse=True,key=lambda x:x[0])
    prefixes=set(); count=0
    for _,asset_id,meta in pool:
        family=re.sub(r'_[0-9]+$','',asset_id)
        if family in prefixes:continue
        prefixes.add(family); selected.append((asset_id,meta)); count+=1
        if count>=limits[typ]:break

rows=[]
for index,(asset_id,meta) in enumerate(selected,start=1):
    typ=meta['type']; thumb=meta.get('thumbnail_url','')
    rows.append({'id':f'PX{index:02d}','主题':theme(meta,typ),'标题或描述':meta.get('name',asset_id),'来源线索':'Poly Haven / 官方单件资产页','来源链接':f'https://polyhaven.com/a/{asset_id}','适合用在哪里':use(meta,typ),'可借鉴的视觉特点':meta.get('description','')[:700] or f'CC0 {kind(typ)}；分类：{meta.get("category","")}。','风格关键词':' '.join(meta.get('tags',[])[:12]),'权利分级':'A-可实际使用','使用边界':'Poly Haven 原始资产为 CC0；从单件页下载所需文件并归档作者、版本和来源。不可复用网站 logo、网页文案或示例 render。','asset_id':asset_id,'asset_type':kind(typ),'thumbnail_url':thumb})
fields=['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','asset_id','asset_type','thumbnail_url']
with (OUT/'polyhaven_expansion_03_candidates.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
summary={'selected_count':len(rows),'by_type':{kind(t):sum(r['asset_type']==kind(t) for r in rows) for t in (0,1,2)},'by_theme':{k:sum(r['主题']==k for r in rows) for k in sorted({r['主题'] for r in rows})}}
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
for r in rows:print(r['id'],r['asset_type'],r['标题或描述'],r['来源链接'])
