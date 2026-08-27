from pathlib import Path
import shutil

root = Path('/home/ubuntu')
evidence = root / 'worldos_p3_evidence'
staging = root / 'worldos_p3_phase3_bundle'
archive = root / 'WORLDOS_PHASE3_EVIDENCE_BUNDLE.zip'

if staging.exists():
    shutil.rmtree(staging)
staging.mkdir()
shutil.copytree(evidence, staging / 'worldos_p3_evidence', ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))

shots_src = root / 'screenshots'
shots_dst = staging / 'screenshots'
shots_dst.mkdir()
for pattern in ('worldos_cc_2026-08-25_09-*.webp', 'worldos_cc_2026-08-25_10-*.webp', 'worldos_cc_2026-08-25_11-*.webp'):
    for src in shots_src.glob(pattern):
        shutil.copy2(src, shots_dst / src.name)

html_src = root / 'browser_html'
html_dst = staging / 'browser_html'
html_dst.mkdir()
for src in html_src.glob('worldos_cc_maps_*.html'):
    shutil.copy2(src, html_dst / src.name)

for extra in [
    root / 'WORLDOS_EXTERNAL_VALIDATION_REPORT.md',
    root / 'worldos_p2_evidence' / 'WORLDOS_PHASE2_EXECUTIVE_SUMMARY.md',
]:
    if extra.exists():
        shutil.copy2(extra, staging / extra.name)

if archive.exists():
    archive.unlink()
shutil.make_archive(str(archive.with_suffix('')), 'zip', root_dir=staging)

files = [p for p in staging.rglob('*') if p.is_file()]
print(f'archive={archive}')
print(f'files={len(files)}')
print(f'bytes={archive.stat().st_size}')
