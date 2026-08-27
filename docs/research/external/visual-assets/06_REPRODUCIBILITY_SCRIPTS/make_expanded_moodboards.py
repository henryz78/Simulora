from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path('/home/ubuntu/ai_world_moodboard')
ASSET_DIR = ROOT / 'assets' / 'references_expanded'
OUT_DIR = ROOT / 'final' / 'expanded_moodboards'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# The order follows the expansion manifest E01–E61.
groups = [
    ('ENVIRONMENT & NATURAL WORLDS', '#79A875', [
        ('E01','Pexels / sunset wetland'),('E02','Pexels / bright grassland'),('E03','Pexels / forest lake'),
        ('E04','Unsplash / cinematic valley'),('E05','Unsplash / misty valley'),('E06','Unsplash / vertical mountain'),
        ('E07','Wikimedia / painted landscape'),('E08','Wikimedia / sunset'),
    ]),
    ('WORLD STATE, CLIMATE & COSMOS', '#6B88D9', [
        ('E09','NASA / climate essentials'),('E10','NASA / climate spiral'),('E11','NASA / habitable zone'),
        ('E12','NASA / Andromeda'),('E13','NASA / temperature 2025'),('E14','NASA / galaxy'),('E15','NASA / temperature 2019'),
    ]),
    ('MAPS, CITIES & ARCHIVAL WORLDS', '#C79A57', [
        ('E16','Fairyland / hand-drawn map'),('E17','Smithsonian / 1831 world map'),('E18','LOC / illustrated city'),
        ('E19','LOC / birdseye city'),('E20','PDR / map collection A'),('E21','PDR / map collection B'),
        ('E22','Smithsonian / archive scroll'),('E23','NYPL / Geographia'),
    ]),
    ('CHARACTERS & READABLE RESIDENTS', '#D68A4A', [
        ('E24','Kenney / mini characters'),('E25','Kenney / animated people'),('E26','OGA / tiny pixel characters'),
        ('E27','Quaternius / animated pack'),('E28','Quaternius / fantasy outfits'),('E29','Kenney / character set'),
        ('E30','OGA / CC0 spritesheet'),('E31','Quaternius / outfit system'),
    ]),
    ('3D WORLDS, PLACES & PROTOTYPING', '#45A7A0', [
        ('E32','Quaternius / fantasy village'),('E33','Eclair / nature kit GLB'),('E34','Quaternius / nature megakit'),
        ('E35','Kenney / survival kit'),('E36','Poly Haven / hidden alley'),('E37','itch.io / CC0 nature pool'),
        ('E38','Quaternius / fantasy props'),('E39','Poly Haven / hidden alley alt'),
    ]),
    ('MOTION, TIME & AMBIENT BACKGROUNDS', '#A27AC2', [
        ('E40','Mixkit / mountain highway'),('E41','Mixkit / waterfall'),('E42','Mixkit / countryside meadow'),
        ('E43','Pexels / mountain lake timelapse'),('E44','Pexels / cloud timelapse'),('E45','Pexels / nature timelapse'),
        ('E46','NASA / draining oceans'),
    ]),
    ('CITIES, CIVILIZATION & NIGHT LIFE', '#D75D83', [
        ('E47','Pexels / aerial night city'),('E48','Unsplash / futuristic city'),('E49','Wikimedia lead / city aerial'),
        ('E50','Pexels / night skyline'),('E51','Unsplash / modern city night'),('E52','Pexels / city at night'),
        ('E53','Unsplash / cyber architecture'),
    ]),
    ('LICENSABLE PRODUCTION PATHS', '#C26B65', [
        ('E54','Envato / fantasy night loop'),('E55','Envato / watermill animation'),('E56','Fab / stylized village'),
        ('E57','Adobe Stock / fantasy concept'),('E58','Adobe Stock / fantasy town'),('E59','Fab / free content'),
        ('E60','Adobe Stock / watermill town'),('E61','Fab / adventure village'),
    ]),
]

# 16 cards per page, preserving the source image in each card using letterboxing.
pages = []
for group_name, color, entries in groups:
    for code, label in entries:
        pages.append((code, group_name, label, color))
chunks = [pages[i:i+16] for i in range(0, len(pages), 16)]

W, H = 3520, 2660
MARGIN_X, MARGIN_Y = 90, 74
HEADER_H = 235
COLS, ROWS = 4, 4
GAP_X, GAP_Y = 34, 34
CARD_W = (W - 2*MARGIN_X - GAP_X*(COLS-1)) // COLS
CARD_H = 535
IMAGE_H = 370
BG = '#0F1315'
CARD = '#192025'
WHITE = '#EDF2F1'
MUTED = '#A7B4B1'
font_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 47)
font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
font_label = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 23)
font_code = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
font_micro = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)

for page_num, page_items in enumerate(chunks, start=1):
    canvas = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((MARGIN_X, 55), 'AI WORLD SIMULATION — EXPANDED VISUAL LIBRARY', font=font_title, fill=WHITE)
    draw.text((MARGIN_X, 118), f'PAGE {page_num:02d} / {len(chunks):02d}  ·  61 new candidates across open, public-domain, CC0 and licensable sources', font=font_small, fill=MUTED)
    draw.line((MARGIN_X, 181, W-MARGIN_X, 181), fill='#3B464B', width=2)
    draw.text((MARGIN_X, 198), 'REFERENCE IMAGERY ONLY — actual product use is governed by the rights tier and source URL in asset_manifest.csv', font=font_micro, fill='#D7B274')
    for idx, (code, group_name, label, accent) in enumerate(page_items):
        row, col = divmod(idx, COLS)
        x = MARGIN_X + col*(CARD_W+GAP_X)
        y = HEADER_H + row*(CARD_H+GAP_Y)
        draw.rounded_rectangle((x,y,x+CARD_W,y+CARD_H), radius=16, fill=CARD)
        matches = list(ASSET_DIR.glob(f'{code}_*'))
        if not matches:
            raise FileNotFoundError(code)
        src = Image.open(matches[0]).convert('RGB')
        # Use contain rather than crop: a reference asset retains its full visual composition.
        fitted = ImageOps.contain(src, (CARD_W, IMAGE_H), method=Image.Resampling.LANCZOS)
        xoff = x + (CARD_W - fitted.width)//2
        yoff = y + (IMAGE_H - fitted.height)//2
        draw.rectangle((x, y, x+CARD_W, y+IMAGE_H), fill='#111518')
        canvas.paste(fitted, (xoff, yoff))
        draw.rectangle((x, y, x+12, y+IMAGE_H), fill=accent)
        draw.rounded_rectangle((x+24, y+IMAGE_H+30, x+95, y+IMAGE_H+72), radius=9, fill=accent)
        draw.text((x+38, y+IMAGE_H+39), code, font=font_code, fill='#0F1315')
        draw.text((x+115, y+IMAGE_H+27), group_name, font=font_micro, fill=MUTED)
        draw.text((x+115, y+IMAGE_H+55), label.upper(), font=font_label, fill=WHITE)
        draw.text((x+24, y+IMAGE_H+111), 'See manifest for source and rights tier', font=font_micro, fill=MUTED)
    out = OUT_DIR / f'expanded_moodboard_{page_num:02d}.jpg'
    canvas.save(out, quality=92, optimize=True)
    print(out)
