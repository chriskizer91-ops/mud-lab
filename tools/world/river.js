/* the River's long profile: every 50 m down it, how wide the water is, how deep at its deepest, how deep along the
   shallowest way across (the best line straight across), and what the bed is. node river.js <ml-world.js> [n] */
const {load}=require('./world.js');const W=load(process.argv[2]),R=W.X?W.X.rivers[+process.argv[3]||0]:null,o={};
if(!R){console.log('no ML_X');process.exit();}
let s=0;console.log('   s      u      v   hw  bend  width deepest  ford(max on best straight line)  bed-on-ford');
for(let i=0;i<R.length-1;i++){const a=R[i],b=R[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(i%5===0){const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L,nx=-tz,nz=tx;let w=0,deep=0,sand=0,silt=0,n=0,dry=0;
    for(let q=-140;q<=140;q+=1){W.mlZone(a[0]+nx*q,a[1]+nz*q,o);if(o.wl>-90&&o.rv){const d=o.wl-o.h;if(d>0){w++;if(d>deep)deep=d;sand+=o.sand;silt+=o.silt;n++;}else dry++;}}
    console.log(String(Math.round(s)).padStart(5),a[0].toFixed(0).padStart(6),a[1].toFixed(0).padStart(6),a[2].toFixed(0).padStart(4),(a[8]*170).toFixed(2).padStart(6),String(w).padStart(5),deep.toFixed(2).padStart(7),' sand',(sand/(n||1)).toFixed(2),'silt',(silt/(n||1)).toFixed(2),'bars',dry);}
  s+=L;}
console.log('length',Math.round(s));
