from pathlib import Path
import csv
import json
import re
from collections import Counter, defaultdict
from urllib.parse import urlparse, urlunparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

ROOT = Path('/home/ubuntu/ai_world_moodboard')
MANIFEST = ROOT / 'final' / 'asset_manifest.csv'
OUT = ROOT / 'final'
HEADERS = {'User-Agent': 'ManusVisualAssetAudit/1.0'}

with MANIFEST.open(encoding='utf-8', newline='') as f:
    rows = list(csv.DictReader(f))

def norm_url(url):
    if not url:
        return ''
    parsed = urlparse(url.strip())
    path = re.sub(r'/+$', '', parsed.path)
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, '', parsed.query, ''))

def is_platform_root(url):
    if not url:
        return True
    parsed = urlparse(url)
    return parsed.path in ('', '/') and not parsed.query and not parsed.fragment

def title_key(text):
    return re.sub(r'[^a-z0-9]+', '', (text or '').lower())

url_index = defaultdict(list)
title_index = defaultdict(list)
for row in rows:
    url_index[norm_url(row.get('来源链接',''))].append(row)
    title_index[title_key(row.get('标题或描述',''))].append(row)

issues = []
for row in rows:
    record_id = row['id']
    url = row.get('来源链接','').strip()
    tier = row.get('权利分级','')
    title = row.get('标题或描述','')
    source = row.get('来源线索','')
    if not url:
        issues.append({'id':record_id,'severity':'high','issue':'missing_url','detail':'来源链接为空','suggested_action':'补充具体对象页；无法补充则降级为 M 或 C。'})
    elif is_platform_root(url):
        severity = 'high' if tier.startswith('A-') else 'medium'
        issues.append({'id':record_id,'severity':severity,'issue':'platform_root_url','detail':f'仅记录平台或站点主页：{url}','suggested_action':'优先补充单件资源／对象页；A 类在未补齐前改为 M。'})
    if ('搜索结果' in source or '搜索结果' in title) and tier.startswith('A-'):
        issues.append({'id':record_id,'severity':'high','issue':'a_tier_search_result','detail':'A 类记录仍依赖搜索结果线索','suggested_action':'补充具体资产页，或降级为 M。'})
    if tier.startswith('A-') and ('ArtStation' in source or 'Dribbble' in source or 'reddit' in source.lower()):
        issues.append({'id':record_id,'severity':'high','issue':'a_tier_portfolio_or_community','detail':'A 类来源是作品展示／社区而非授权资源页','suggested_action':'除非已补授权文件，否则降级 C 或 M。'})

for url, same_url_rows in url_index.items():
    if url and len(same_url_rows) > 1:
        ids = ', '.join(row['id'] for row in same_url_rows)
        issues.append({'id':ids,'severity':'low','issue':'duplicate_url','detail':f'{len(same_url_rows)} 条记录共享 URL：{url}','suggested_action':'可保留为同一平台不同资产的临时来源，但应逐条改为单件 URL。'})
for key, same_title_rows in title_index.items():
    if key and len(same_title_rows) > 1:
        ids = ', '.join(row['id'] for row in same_title_rows)
        issues.append({'id':ids,'severity':'medium','issue':'duplicate_title','detail':f'{len(same_title_rows)} 条记录标题归一化后相同：{same_title_rows[0]["标题或描述"]}','suggested_action':'核验是否为同一资源的重复记录；同一资源仅保留最佳单件来源。'})

# Check HTTP reachability for non-empty URLs. A non-2xx/3xx response is not automatically a legal issue;
# failures are reported separately so review can distinguish unavailable from unknown.
def check_url(url):
    try:
        response = requests.head(url, headers=HEADERS, timeout=12, allow_redirects=True)
        status = response.status_code
        if status >= 400 or status == 405:
            response = requests.get(url, headers={**HEADERS, 'Range': 'bytes=0-1024'}, timeout=15, allow_redirects=True, stream=True)
            status = response.status_code
        return url, status, response.url
    except Exception as exc:
        return url, None, str(exc)

unique_urls = sorted({row.get('来源链接','').strip() for row in rows if row.get('来源链接','').strip()})
status_map = {}
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(check_url, url): url for url in unique_urls}
    for future in as_completed(futures):
        url, status, final = future.result()
        status_map[url] = {'status': status, 'final': final}

for row in rows:
    url = row.get('来源链接','').strip()
    if not url:
        continue
    status = status_map[url]['status']
    if status is None:
        issues.append({'id':row['id'],'severity':'medium','issue':'unreachable_or_timeout','detail':f'无法验证 URL：{url}；错误：{status_map[url]["final"][:180]}','suggested_action':'人工重新访问；若持续失效，寻找镜像、具体对象页或降级 M。'})
    elif status >= 400:
        issues.append({'id':row['id'],'severity':'high','issue':'http_error','detail':f'URL 返回 HTTP {status}：{url}','suggested_action':'寻找可用的单件页；若无有效来源，降级 M 或 C。'})

issue_fields = ['id','severity','issue','detail','suggested_action']
with (OUT / 'MANIFEST_HYGIENE_AUDIT_03.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=issue_fields)
    writer.writeheader()
    writer.writerows(issues)
summary = {
    'row_count': len(rows),
    'unique_nonempty_urls': len(unique_urls),
    'issue_count': len(issues),
    'issues_by_type': dict(sorted(Counter(issue['issue'] for issue in issues).items())),
    'issues_by_severity': dict(sorted(Counter(issue['severity'] for issue in issues).items())),
    'http_status_buckets': dict(sorted(Counter(str(v['status']) if v['status'] is not None else 'unreachable' for v in status_map.values()).items())),
}
(OUT / 'MANIFEST_HYGIENE_AUDIT_03.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
