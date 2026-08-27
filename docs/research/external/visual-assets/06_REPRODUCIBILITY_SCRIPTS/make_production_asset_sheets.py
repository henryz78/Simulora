from pathlib import Path
import csv
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path('/home/ubuntu/ai_world_moodboard')
FINAL = ROOT / 'final'
OUT = FINAL / 'production_asset_sheets'
OUT.mkdir(parents=True, exist_ok=True)

source_specs = [
    ('PH', ROOT / 'staging' / 'polyhaven' / 'polyhaven_candidates.csv', ROOT / 'staging' / 'polyhaven' / 'thumbnails', 'POLY HAVEN — CC0 HDRI / PBR / 3D MODELS', '#4DA5A7'),
    ('K', ROOT / 'staging' / 'kenney' / 'kenney_candidates.csv', ROOT / 'staging' / 'kenney' / 'thumbnails', 'KENNEY — CC0 2D / 3D WORLD PROTOTYPING KITS', '#8DBA70'),
    ('Q', ROOT / 'staging' / 'quaternius' / 'quaternius_candidates.csv', ROOT / 'staging' / 'quaternius' / 'thumbnails', 'QUATERNIUS — CC0 CHARACTERS / WORLDS / ANIMATIONS', '#B586C8'),
    ('N', ROOT / 'staging' / 'nasa_svs' / 'nasa_svs_candidates.csv', ROOT / 'staging' / 'nasa_svs' / 'thumbnails', 'NASA SVS — EARTH / WEATHER / STATE VISUALIZATIONS', '#7196D0'),
]

W, H = 4000, 2775
MX, HEADER_H = 100, 285
COLS, ROWS = 5, 4
GX, GY = 28, 30
CARD_W = (W - 2*MX - (COLS-1)*GX) // COLS
CARD_H = 555
IMG_H = 378
BG, CARD, TEXT, MUTED = '#0F1315', '#192025', '#EDF2F1', '#A7B4B1'
font_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 43)
font_sub = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
font_label = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
font_micro = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
font_id = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 19)

for prefix, csv_path, thumb_dir, sheet_title, accent in source_specs:
    with csv_path.open(encoding='utf-8', newline='') as f:
        rows = list(csv.DictReader(f))
    # Each sheet carries up to twenty assets so labels remain readable at 100%.
    chunks = [rows[i:i+20] for i in range(0, len(rows), 20)]
    for page, chunk in enumerate(chunks, start=1):
        canvas = Image.new('RGB', (W, H), BG)
        draw = ImageDraw.Draw(canvas)
        draw.text((MX, 58), sheet_title, font=font_title, fill=TEXT)
        draw.text((MX, 116), f'PAGE {page:02d}/{len(chunks):02d}  ·  Specific source pages and rights tiers are in asset_manifest.csv', font=font_sub, fill=MUTED)
        draw.line((MX, 176, W-MX, 176), fill='#3B464B', width=2)
        rights = 'A / CC0 production path' if prefix in {'PH','K','Q'} else 'A / NASA conditional production path — check credit per asset'
        draw.text((MX, 203), f'CARD PREVIEWS ARE FOR ASSET SELECTION ONLY  ·  {rights}', font=font_micro, fill='#D7B274')
        for index, row in enumerate(chunk):
            r, c = divmod(index, COLS)
            x = MX + c*(CARD_W+GX)
            y = HEADER_H + r*(CARD_H+GY)
            draw.rounded_rectangle((x,y,x+CARD_W,y+CARD_H), radius=16, fill=CARD)
            files = list(thumb_dir.glob(f"{row['id']}.*")) + list(thumb_dir.glob(f"{row['id']}_*"))
            if not files:
                continue
            img = Image.open(files[0]).convert('RGB')
            fitted = ImageOps.contain(img, (CARD_W, IMG_H), method=Image.Resampling.LANCZOS)
            draw.rectangle((x,y,x+CARD_W,y+IMG_H), fill='#111518')
            canvas.paste(fitted, (x+(CARD_W-fitted.width)//2, y+(IMG_H-fitted.height)//2))
            draw.rectangle((x,y,x+10,y+IMG_H), fill=accent)
            draw.rounded_rectangle((x+21,y+IMG_H+27,x+92,y+IMG_H+66),radius=8,fill=accent)
            draw.text((x+34,y+IMG_H+35),row['id'],font=font_id,fill='#0F1315')
            theme = row.get('asset_type') or row.get('asset_category') or row.get('主题','')
            draw.text((x+110,y+IMG_H+23),theme[:54].upper(),font=font_micro,fill=MUTED)
            title = row['标题或描述'].upper()
            # Prevent overly long source names from colliding with the card edge.
            if len(title) > 44:
                title = title[:41] + '...'
            draw.text((x+110,y+IMG_H+50),title,font=font_label,fill=TEXT)
            rights_label = row['权利分级']
            draw.text((x+21,y+IMG_H+103),rights_label + '  ·  see exact source URL in manifest',font=font_micro,fill=MUTED)
        target = OUT / f'{prefix.lower()}_production_assets_{page:02d}.jpg'
        canvas.save(target, quality=92, optimize=True)
        print(target)
