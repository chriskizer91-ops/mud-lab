import sys
from PIL import Image, ImageDraw, ImageFont
S=sys.argv[1]
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
except Exception: F=ImageFont.load_default()
def lab(im,t):
    d=ImageDraw.Draw(im); w=d.textlength(t,font=F); d.rectangle([8,8,8+w+16,48],fill=(0,0,0)); d.text((16,12),t,font=F,fill=(255,255,255)); return im
def stack(out,items,crop=None,w=1144):
    ims=[]
    for p,t in items:
        im=Image.open(p).convert('RGB')
        if crop: im=im.crop(crop)
        im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); ims.append(lab(im,t))
    H=sum(i.height for i in ims)+6*(len(ims)-1); o=Image.new('RGB',(w,H),(255,255,255)); y=0
    for i in ims: o.paste(i,(0,y)); y+=i.height+6
    o.save(out,quality=88); print(out,o.size)
D='docs/shots/mud-lab-22.1-water-'
for name,v,crop in [('slide','water-slide',None),('wade','water-wake',None),('nose','water-deepf',(300,130,872,388)),('turn','water-turn',None),('chase','water-bowc',None)]:
    stack(D+name+'.jpg',[(S+'/b22/'+v+'.png','BUILD 22'),(S+'/g1/'+v+'.png','BUILD 22.1 WATER')],crop)
if len(sys.argv)>2: stack(D+'laptop.jpg',[(S+'/g1l/water-slide.png','BUILD 22.1 WATER, LAPTOP'),(S+'/g1l/water-wake.png','BUILD 22.1 WATER, LAPTOP')])
