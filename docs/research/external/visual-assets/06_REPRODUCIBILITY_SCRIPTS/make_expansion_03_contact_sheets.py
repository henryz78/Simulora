from pathlib import Path
import csv
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path('/home/ubuntu/ai_world_moodboard')
FINAL=ROOT/'final'
OUT=FINAL/'production_asset_sheets_03'
OUT.mkdir(parents=True,exist_ok=True)
PREVIEW=ROOT/'assets'/'references_production_03'

sources=[
    ('PX',[ROOT/'staging'/'polyhaven_expansion_03'/'polyhaven_expansion_03_candidates.csv'],'POLY HAVEN — INTERIORS / NIGHT HDRI / PBR / PROPS','#4DA5A7'),
    ('KXKV',[ROOT/'staging'/'kenney_expansion_03'/'kenney_expansion_03_candidates.csv',ROOT/'staging'/'kenney_vfx_ui_expansion_03_candidates.csv'],'KENNEY — NPC / INTERIORS / MAP UI / VFX / TRANSPORT','#8DBA70'),
    ('QX',[ROOT/'staging'/'quaternius_expansion_03'/'quaternius_expansion_03_candidates.csv'],'QUATERNIUS — CHARACTERS / INTERIORS / CREATURES / WORLDS','#B586C8'),
]

W,H=4000,2775; MX,HEADER=100,285; COLS,ROWS=5,4; GX,GY=28,30
CARD_W=(W-2*MX-(COLS-1)*GX)//COLS; CARD_H=555; IMG_H=378
BG,CARD,TEXT,MUTED='#0F1315','#192025','#EDF2F1','#A7B4B1'
font_title=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',43)
font_sub=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
font_label=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18)
font_micro=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
font_id=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',19)

def preview_for(record_id):
    matches=list(PREVIEW.glob(f'{record_id}.*'))
    return matches[0] if matches else None

for code,paths,title,accent in sources:
    rows=[]
    for path in paths:
        with path.open(encoding='utf-8',newline='') as f:
            rows.extend(list(csv.DictReader(f)))
    rows=[row for row in rows if preview_for(row['id'])]
    chunks=[rows[i:i+20] for i in range(0,len(rows),20)]
    for page,chunk in enumerate(chunks,start=1):
        canvas=Image.new('RGB',(W,H),BG);draw=ImageDraw.Draw(canvas)
        draw.text((MX,58),title,font=font_title,fill=TEXT)
        draw.text((MX,116),f'PAGE {page:02d}/{len(chunks):02d}  ·  Official single-page preview images only  ·  See asset_manifest.csv for exact URL and rights tier',font=font_sub,fill=MUTED)
        draw.line((MX,176,W-MX,176),fill='#3B464B',width=2)
        draw.text((MX,203),'A — VERIFIED PRODUCTION PATH  ·  PREVIEW IS FOR SELECTION; DOWNLOAD ORIGINAL SOURCE FILE FROM MANIFEST URL',font=font_micro,fill='#D7B274')
        for index,row in enumerate(chunk):
            r,c=divmod(index,COLS); x=MX+c*(CARD_W+GX);y=HEADER+r*(CARD_H+GY)
            draw.rounded_rectangle((x,y,x+CARD_W,y+CARD_H),radius=16,fill=CARD)
            image=Image.open(preview_for(row['id'])).convert('RGB')
            fitted=ImageOps.contain(image,(CARD_W,IMG_H),method=Image.Resampling.LANCZOS)
            draw.rectangle((x,y,x+CARD_W,y+IMG_H),fill='#111518');canvas.paste(fitted,(x+(CARD_W-fitted.width)//2,y+(IMG_H-fitted.height)//2))
            draw.rectangle((x,y,x+10,y+IMG_H),fill=accent)
            draw.rounded_rectangle((x+21,y+IMG_H+27,x+92,y+IMG_H+66),radius=8,fill=accent)
            draw.text((x+34,y+IMG_H+35),row['id'],font=font_id,fill='#0F1315')
            category=row.get('asset_type') or row.get('asset_category') or row.get('主题','')
            draw.text((x+110,y+IMG_H+23),category[:48].upper(),font=font_micro,fill=MUTED)
            label=row['标题或描述'].upper(); label=label if len(label)<=44 else label[:41]+'...'
            draw.text((x+110,y+IMG_H+50),label,font=font_label,fill=TEXT)
            draw.text((x+21,y+IMG_H+103),'A · manifest → exact URL / license evidence',font=font_micro,fill=MUTED)
        out=OUT/f'{code.lower()}_assets_{page:02d}.jpg';canvas.save(out,quality=92,optimize=True);print(out)
