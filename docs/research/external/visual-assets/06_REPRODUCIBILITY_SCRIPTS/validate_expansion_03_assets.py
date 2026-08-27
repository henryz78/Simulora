from pathlib import Path
import csv
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup

ROOT=Path('/home/ubuntu/ai_world_moodboard')
FINAL=ROOT/'final'
HEADERS={'User-Agent':'ManusVisualAssetResearch/1.0'}
q_path=ROOT/'staging'/'quaternius_expansion_03'/'quaternius_expansion_03_candidates.csv'
k_path=ROOT/'staging'/'kenney_expansion_03'/'kenney_expansion_03_candidates.csv'
p_path=ROOT/'staging'/'polyhaven_expansion_03'/'polyhaven_expansion_03_candidates.csv'
v_path=ROOT/'staging'/'kenney_vfx_ui_expansion_03_candidates.csv'

with (ROOT/'staging'/'polyhaven'/'raw_assets.json').open(encoding='utf-8') as f: poly_ids=set(json.load(f).keys())

def fetch_q(row):
    try:
        res=requests.get(row['来源链接'],headers=HEADERS,timeout=18)
        if not res.ok:return row['id'],{'ok':False,'status':res.status_code,'title':'','cc0':False}
        soup=BeautifulSoup(res.text,'html.parser')
        title=soup.title.get_text(' ',strip=True).replace('Quaternius • ','').strip() if soup.title else row['标题或描述']
        cc0='CC0' in soup.get_text(' ',strip=True)
        return row['id'],{'ok':cc0,'status':res.status_code,'title':title,'cc0':cc0}
    except Exception as exc:return row['id'],{'ok':False,'status':None,'title':'','cc0':False,'error':type(exc).__name__}

def fetch_k(row):
    try:
        res=requests.get(row['来源链接'],headers=HEADERS,timeout=15)
        if not res.ok:return row['id'],{'ok':False,'status':res.status_code}
        text=res.text
        return row['id'],{'ok':'Creative Commons CC0' in text,'status':res.status_code}
    except Exception as exc:return row['id'],{'ok':False,'status':None,'error':type(exc).__name__}

def load(path):
    with path.open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))
def save(path,rows):
    fields=list(rows[0].keys())
    with path.open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

q_rows=load(q_path); k_rows=load(k_path); p_rows=load(p_path); v_rows=load(v_path)
q_results={}; k_results={}
with ThreadPoolExecutor(max_workers=8) as ex:
    futures=[ex.submit(fetch_q,row) for row in q_rows]
    for fut in as_completed(futures):
        key,value=fut.result();q_results[key]=value
with ThreadPoolExecutor(max_workers=8) as ex:
    futures=[ex.submit(fetch_k,row) for row in k_rows+v_rows]
    for fut in as_completed(futures):
        key,value=fut.result();k_results[key]=value

validation=[]
for row in q_rows:
    result=q_results[row['id']]
    if result.get('title'):row['标题或描述']=result['title']
    if not result['ok']:
        row['权利分级']='M-待确认'
        row['使用边界']+=' 验证未能确认该单件页的 CC0 声明；在人工复核前不进入生产下载队列。'
    validation.append({'id':row['id'],'source':'Quaternius','status':result.get('status'),'verified':result['ok'],'reason':'单件页包含 CC0 声明' if result['ok'] else '无法确认 CC0／页面访问失败'})
for row in k_rows+v_rows:
    result=k_results[row['id']]
    if not result['ok']:
        row['权利分级']='M-待确认'
        row['使用边界']+=' 验证未能确认该单件页的 Creative Commons CC0 标识；在人工复核前不进入生产下载队列。'
    validation.append({'id':row['id'],'source':'Kenney','status':result.get('status'),'verified':result['ok'],'reason':'单件页包含 Creative Commons CC0' if result['ok'] else '无法确认 CC0／页面访问失败'})
for row in p_rows:
    asset=row.get('asset_id','')
    verified=asset in poly_ids
    if not verified:
        row['权利分级']='M-待确认'
        row['使用边界']+=' 验证时未在 Poly Haven 官方 API 目录找到 asset_id；在人工复核前不进入生产下载队列。'
    validation.append({'id':row['id'],'source':'Poly Haven','status':200 if verified else None,'verified':verified,'reason':'asset_id 存在于官方 API 目录且资产库为 CC0' if verified else 'asset_id 不在官方 API 目录'})

save(q_path,q_rows);save(k_path,k_rows);save(v_path,v_rows);save(p_path,p_rows)
with (FINAL/'EXPANSION_03_ASSET_VALIDATION.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=['id','source','status','verified','reason']);w.writeheader();w.writerows(validation)
summary={'total':len(validation),'verified':sum(bool(x['verified']) for x in validation),'failed_or_manual_review':sum(not bool(x['verified']) for x in validation),'by_source':{source:sum(x['source']==source and x['verified'] for x in validation) for source in ['Kenney','Quaternius','Poly Haven']}}
(FINAL/'EXPANSION_03_ASSET_VALIDATION.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
