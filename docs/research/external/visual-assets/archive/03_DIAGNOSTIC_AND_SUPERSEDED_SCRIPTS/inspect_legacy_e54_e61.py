from pathlib import Path
import csv

manifest = Path('/home/ubuntu/ai_world_moodboard/final/asset_manifest.csv')
with manifest.open(encoding='utf-8', newline='') as f:
    for row in csv.DictReader(f):
        if row['id'] in {f'E{i:02d}' for i in range(54, 62)}:
            print('\t'.join([row['id'], row['标题或描述'], row['权利分级'], row['来源链接']]))
