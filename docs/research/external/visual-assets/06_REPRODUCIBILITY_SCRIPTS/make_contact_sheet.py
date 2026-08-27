from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path('/home/ubuntu/ai_world_moodboard')
ASSETS = ROOT / 'assets' / 'references'
OUT = ROOT / 'final' / 'moodboard_contact_sheet.jpg'

items = [
    ('S01', 'WORLD / LIVING HORIZON', 'S01_open_fields_lyrimidia.jpg', '#8CBF88'),
    ('S05', 'WORLD / RUIN + REGROWTH', 'S05_ruin_regrowth_environment.jpg', '#54746B'),
    ('S08', 'WORLD / SIMULATION HALL', 'S08_earth_simulation_hall.jpg', '#5CA9A3'),
    ('M04', 'MAP / GREEN MEGACITY', 'M04_megacity_2050.jpg', '#8AAA74'),
    ('M06', 'MAP / STORY TERRAIN', 'M06_arvyre_campaign_map.jpg', '#BE9F6B'),
    ('M07', 'MAP / REGIONAL ATLAS', 'M07_delfur_world_map.jpg', '#A77F6A'),
    ('C02', 'CHARACTER / READABLE SILHOUETTE', 'C02_stylized_character.jpg', '#F19A49'),
    ('C04', 'CHARACTER / CULTURAL CODE', 'C04_character_worldbuilding.jpg', '#789167'),
    ('C05', 'CHARACTER / PERSONAL MYTH', 'C05_moonlit_character.jpg', '#617AAF'),
    ('A01', 'ATMOSPHERE / CIVILIZATION LIGHTS', 'A01_nasa_earth_night.jpg', '#667DE3'),
    ('A06', 'ATMOSPHERE / FOG + PAUSE', 'A06_fog_mountains.jpg', '#9DA9A1'),
    ('A07', 'ATMOSPHERE / COSMIC SEED', 'A07_southern_ring_nebula.png', '#E17D5B'),
    ('U01', 'UI / WORLD AS HERO', 'U01_simulation_dashboard.png', '#3B93BE'),
    ('U03', 'UI / GENERATIVE AUTHORING', 'U03_hex_worldbuilding_tool.jpg', '#7963A6'),
    ('U05', 'UI / QUIET MAP LAYERS', 'U05_map_ui_design.png', '#A5B28B'),
    ('V02', 'MOTION / LONG TIME SCALE', 'V02_one_year_earth.jpg', '#5F77C4'),
    ('V05', 'MOTION / LOW-FREQUENCY LOOP', 'V05_looping_countryside.jpg', '#86BDE5'),
    ('V07', 'MOTION / VISIBLE RULES', 'V07_procedural_generation.jpg', '#B76D8F'),
    ('X01', 'ARCHIVE / FIELD NOTE', 'X01_smithsonian_bird_cards.jpg', '#D7B568'),
    ('X03', 'ARCHIVE / CABINET OF WONDERS', 'X03_cabinet_curiosities.jpg', '#A17C5A'),
    ('X07', 'ARCHIVE / SPECIES CATALOG', 'X07_seba_marine_life.jpg', '#71819B'),
]

W, H = 3600, 3260
MARGIN_X = 110
MARGIN_Y = 95
HEADER_H = 245
COLS = 3
GAP = 38
CARD_W = (W - 2 * MARGIN_X - GAP * (COLS - 1)) // COLS
CARD_H = 405
IMG_H = 312
LABEL_H = CARD_H - IMG_H
BACKGROUND = '#101315'
CARD_BG = '#1A1F22'
TEXT = '#F1F4F3'
SUBTEXT = '#AAB5B2'

font_bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
font_title = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 54)
font_subtitle = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 25)
font_micro = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)

canvas = Image.new('RGB', (W, H), BACKGROUND)
draw = ImageDraw.Draw(canvas)

draw.text((MARGIN_X, 62), 'AI WORLD SIMULATION — VISUAL EXPLORATION', font=font_title, fill=TEXT)
draw.text((MARGIN_X, 132), 'A cross-genre internal moodboard: world, map, character, atmosphere, interface, motion, archive', font=font_subtitle, fill=SUBTEXT)
draw.line((MARGIN_X, 198, W - MARGIN_X, 198), fill='#384246', width=2)
draw.text((MARGIN_X, 214), 'REFERENCE IMAGERY ONLY — see the accompanying manifest for source and license handling', font=font_micro, fill='#D3A86C')

for idx, (code, label, filename, accent) in enumerate(items):
    row, col = divmod(idx, COLS)
    x = MARGIN_X + col * (CARD_W + GAP)
    y = HEADER_H + row * (CARD_H + GAP)
    draw.rounded_rectangle((x, y, x + CARD_W, y + CARD_H), radius=16, fill=CARD_BG)
    source = Image.open(ASSETS / filename).convert('RGB')
    fitted = ImageOps.fit(source, (CARD_W, IMG_H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    canvas.paste(fitted, (x, y))
    draw.rectangle((x, y, x + 12, y + IMG_H), fill=accent)
    draw.rectangle((x, y + IMG_H, x + CARD_W, y + CARD_H), fill=CARD_BG)
    draw.rounded_rectangle((x + 25, y + IMG_H + 28, x + 86, y + IMG_H + 69), radius=9, fill=accent)
    draw.text((x + 37, y + IMG_H + 35), code, font=font_small, fill='#101315')
    draw.text((x + 108, y + IMG_H + 28), label, font=font_bold, fill=TEXT)
    draw.text((x + 108, y + IMG_H + 66), 'Mood & visual-language reference', font=font_small, fill=SUBTEXT)

canvas.save(OUT, quality=92, optimize=True)
print(OUT)
