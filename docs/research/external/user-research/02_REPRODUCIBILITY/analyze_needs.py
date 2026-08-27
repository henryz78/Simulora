import csv
from collections import Counter, defaultdict
from pathlib import Path

base = Path('/home/ubuntu/ai_world_user_research')
input_path = base / 'needs_database.csv'
output_path = base / 'needs_summary.csv'

rows = []
with input_path.open(encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

frequency_counts = Counter(row['频率判断'] for row in rows)
layer_counts = Counter(row['问题层级'] for row in rows)
strength_counts = Counter(row['证据强度'] for row in rows)

summary_rows = []
for kind, counter in [
    ('频率判断', frequency_counts),
    ('问题层级', layer_counts),
    ('证据强度', strength_counts),
]:
    for label, count in sorted(counter.items(), key=lambda x: (-x[1], x[0])):
        summary_rows.append({'维度': kind, '类别': label, '需求条目数': count})

with output_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['维度', '类别', '需求条目数'])
    writer.writeheader()
    writer.writerows(summary_rows)

print(f'需求条目数: {len(rows)}')
for kind, counter in [('频率判断', frequency_counts), ('问题层级', layer_counts), ('证据强度', strength_counts)]:
    print(kind)
    for label, count in sorted(counter.items(), key=lambda x: (-x[1], x[0])):
        print(f'  {label}: {count}')
print(f'写入: {output_path}')
