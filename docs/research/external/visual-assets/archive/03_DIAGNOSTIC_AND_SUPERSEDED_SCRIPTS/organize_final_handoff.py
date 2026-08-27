from pathlib import Path
import shutil
import json
from datetime import datetime

SRC = Path('/home/ubuntu/ai_world_moodboard')
ROOT = Path('/home/ubuntu/AI_World_Visual_Asset_Pool_Handoff')
ARCHIVE = ROOT / 'archive'

if ROOT.exists():
    raise SystemExit(f'Refusing to overwrite existing handoff directory: {ROOT}')

for directory in [
    ROOT / '01_START_HERE',
    ROOT / '02_FINAL_REPORTS_AND_INDEXES',
    ROOT / '03_CONTACT_SHEETS',
    ROOT / '04_VISUAL_REFERENCE_ASSETS',
    ROOT / '05_RESEARCH_LOGS_AND_SOURCE_DATA',
    ROOT / '06_REPRODUCIBILITY_SCRIPTS',
    ARCHIVE / '01_HISTORICAL_REPORTS',
    ARCHIVE / '02_STAGING_SOURCE_SNAPSHOTS',
    ARCHIVE / '03_DIAGNOSTIC_AND_SUPERSEDED_SCRIPTS',
    ARCHIVE / '04_PREVIOUS_DELIVERY_ZIPS',
]:
    directory.mkdir(parents=True, exist_ok=True)

def copy_file(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)

def copy_tree(source, destination):
    shutil.copytree(source, destination, dirs_exist_ok=True)

# 1. Current operational entry points.
start = ROOT / '01_START_HERE'
for filename in [
    'ACTIVE_PRODUCTION_ASSETS_03.csv',
    'asset_manifest.csv',
    'MANIFEST_REVIEW_QUEUE_03.csv',
    'PRODUCTION_INDEX_03_SUMMARY.json',
]:
    copy_file(SRC / 'final' / filename, start / filename)

# 2. Current report, audit and validation evidence.
current_final_names = [
    'EXPANSION_03_生产型资产池与Hygiene报告.md',
    'EXPANSION_03_新增单件资产记录.csv',
    'EXPANSION_03_ASSET_VALIDATION.csv',
    'EXPANSION_03_ASSET_VALIDATION.json',
    'EXPANSION_03_MERGE_SUMMARY.json',
    'MANIFEST_HYGIENE_AUDIT_03.csv',
    'MANIFEST_HYGIENE_AUDIT_03.json',
    'MANIFEST_HYGIENE_CHANGES_03.csv',
    'MANIFEST_HYGIENE_REMEDIATION_03.json',
    'MANIFEST_HYGIENE_REVIEW_03.csv',
]
for filename in current_final_names:
    copy_file(SRC / 'final' / filename, ROOT / '02_FINAL_REPORTS_AND_INDEXES' / filename)

# 3. Historical reports remain valuable, but the current report/indexes supersede them as operating documents.
historical_names = [
    'AI世界模拟_视觉素材库与Moodboard.md',
    'EXPANSION_01_新增素材与使用清单.md',
    'EXPANSION_02_生产型Visual_Asset_Pool.md',
    'EXPANSION_02_新增单件资产记录.csv',
    'EXPANSION_02_summary.json',
    'manifest_summary.json',
]
for filename in historical_names:
    copy_file(SRC / 'final' / filename, ARCHIVE / '01_HISTORICAL_REPORTS' / filename)

# 4. All browsable visual deliverables, ordered by delivery round.
contact_sets = [
    ('00_original_moodboard', [SRC / 'final' / 'moodboard_contact_sheet.jpg']),
    ('01_expansion_reference_moodboards', [SRC / 'final' / 'expanded_moodboards']),
    ('02_production_asset_sheets', [SRC / 'final' / 'production_asset_sheets']),
    ('03_current_production_asset_sheets', [SRC / 'final' / 'production_asset_sheets_03']),
]
for label, objects in contact_sets:
    target = ROOT / '03_CONTACT_SHEETS' / label
    for obj in objects:
        if obj.is_dir(): copy_tree(obj, target / obj.name)
        else: copy_file(obj, target / obj.name)

# 5. All selected visual references. No generation or destructive editing is performed.
asset_sets = [
    ('01_original_references', SRC / 'assets' / 'references'),
    ('02_expansion_01_references', SRC / 'assets' / 'references_expanded'),
    ('03_expansion_02_production_previews', SRC / 'assets' / 'references_production'),
    ('04_expansion_03_production_previews', SRC / 'assets' / 'references_production_03'),
]
for label, source in asset_sets:
    copy_tree(source, ROOT / '04_VISUAL_REFERENCE_ASSETS' / label)

# 6. Research log and strategy stay in the visible research data area.
copy_file(SRC / 'research_log.md', ROOT / '05_RESEARCH_LOGS_AND_SOURCE_DATA' / 'research_log.md')
copy_file(SRC / 'EXPANSION_02_资产池扩充策略.md', ROOT / '05_RESEARCH_LOGS_AND_SOURCE_DATA' / 'EXPANSION_02_资产池扩充策略.md')

# 7. Preserve the entire staging source record tree as archive: it may include raw API snapshots, CSV extracts and preview-cache files.
copy_tree(SRC / 'staging', ARCHIVE / '02_STAGING_SOURCE_SNAPSHOTS' / 'staging')

# 8. Separate reproducibility scripts from diagnostics and one-off inspection aids.
keep_scripts = [
    'make_contact_sheet.py', 'make_expanded_moodboards.py', 'make_production_asset_sheets.py',
    'make_expansion_03_contact_sheets.py', 'collect_polyhaven_assets.py', 'collect_kenney_assets.py',
    'collect_quaternius_assets.py', 'collect_nasa_svs_assets.py', 'collect_polyhaven_expansion_03.py',
    'collect_kenney_expansion_03.py', 'collect_quaternius_expansion_03.py', 'merge_expansion_02.py',
    'merge_expansion_03.py', 'summarize_manifest.py', 'audit_manifest_hygiene.py',
    'remediate_manifest_hygiene.py', 'validate_expansion_03_assets.py', 'build_production_indexes_03.py',
    'download_expansion_03_previews.py', 'download_quaternius_expansion_03_previews.py',
]
for filename in keep_scripts:
    copy_file(SRC / filename, ROOT / '06_REPRODUCIBILITY_SCRIPTS' / filename)
for filename in ['debug_quaternius.py', 'inspect_legacy_e54_e61.py', 'prepare_hygiene_review.py', 'organize_final_handoff.py']:
    copy_file(SRC / filename, ARCHIVE / '03_DIAGNOSTIC_AND_SUPERSEDED_SCRIPTS' / filename)

# 9. Previous user-facing delivery zips are preserved as historic snapshots, rather than treated as current handoff files.
for old_zip in [
    Path('/home/ubuntu/AI世界模拟_视觉素材包.zip'),
    Path('/home/ubuntu/AI世界模拟_视觉素材扩展包_01.zip'),
    Path('/home/ubuntu/AI世界模拟_生产型视觉资产池_扩展包_02.zip'),
    Path('/home/ubuntu/AI世界模拟_生产型视觉资产池_扩展包_03.zip'),
]:
    if old_zip.exists(): copy_file(old_zip, ARCHIVE / '04_PREVIOUS_DELIVERY_ZIPS' / old_zip.name)

# 10. Machine-readable inventory used by README/FINAL_HANDOFF and future reconciliation.
files = [path for path in ROOT.rglob('*') if path.is_file()]
summary = {
    'created_at_utc': datetime.utcnow().replace(microsecond=0).isoformat() + 'Z',
    'handoff_root': ROOT.name,
    'file_count_before_readme_and_handoff': len(files),
    'folder_counts': {str(folder.relative_to(ROOT)): sum(1 for p in folder.rglob('*') if p.is_file()) for folder in [
        ROOT / '01_START_HERE', ROOT / '02_FINAL_REPORTS_AND_INDEXES', ROOT / '03_CONTACT_SHEETS',
        ROOT / '04_VISUAL_REFERENCE_ASSETS', ROOT / '05_RESEARCH_LOGS_AND_SOURCE_DATA',
        ROOT / '06_REPRODUCIBILITY_SCRIPTS', ARCHIVE
    ]},
}
(ROOT / 'ARCHIVE_INVENTORY.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
