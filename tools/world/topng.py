import sys
from PIL import Image
raw,w,h,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
im=Image.frombytes('RGB',(w,h),open(raw,'rb').read())
if len(sys.argv)>5: s=float(sys.argv[5]); im=im.resize((round(w*s),round(h*s)),Image.LANCZOS)
im.save(out,quality=90); print(out,im.size)
