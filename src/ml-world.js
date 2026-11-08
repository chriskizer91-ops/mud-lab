/* =====================================================================================
   MUD LAB: THE WORLD (put inside the engine's world generator by src/build.py, so the background worker that makes
   the land has it too: it may use only the generator's own helpers, sst, vn, fbm, SF, rimAt).
   The whole world is soil: a square 327.68 m (1,075 ft) across, every centimetre of it can be dug, packed, rutted and
   thrown (src/ml-soil.js keeps it every 8 cm). A grassy bank all round it, trees beyond. Its places (u east, v south
   of its middle, metres):
     the field (the middle): loam, gently rolling, a patch of sod to the south
     the clay flats (north-west): flat grey clay, cracked where it's dry, puddles 2-5 cm deep in its hollows
     the peat bog (north-east): low, dark and spongy, the water a few centimetres under the moss (any rut fills), and
       a few bog holes of open water 20-30 cm deep
     the ditch: from the bog down to the pond, 4 m wide, 25-40 cm of water over soft silt
     the pond (east): soft silt bottom, 30-65 cm of water, and a ford across its west end 15-20 cm deep
     the beach (south-east): wet sand along the pond's south shore, firm until you spin it
     the sand (south-west): dry dunes, 1-2 m high
     the hills (west): a mound and a steeper hill to climb
   Everything is a cheap function of where you are, so the soil can lay it all out at the start.
   ===================================================================================== */
const ML_A={x:0,z:1200,h:163.84,m:40,h0:2};
const ML_PL=-.35,ML_NONE=-99;   /* the pond's (and the ditch's) water level, over h0; no water */
const mlEll=(u,v,cu,cv,ru,rv)=>Math.hypot((u-cu)/ru,(v-cv)/rv);
/* the world's own ground: its height over h0 and what it's made of (weights 0..1; loam is what's left), and the level
   of the water lying on it (over h0; ML_NONE where there is none) */
function mlZone(u,v,o){
  const n1=vn(u/9,v/9,831)-.5,n2=vn(u/23,v/23,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5,e=Math.max(Math.abs(u),Math.abs(v));
  /* the field: gently rolling loam */
  let h=.22*Math.sin(u*.045+.6)*Math.cos(v*.05-.3)+.12*Math.sin(u*.11+v*.07+1.3)+.1*n2;
  let clay=0,silt=0,peat=0,sand=0,grass=0,wl=ML_NONE;
  /* the clay flats: flat, a little low, hollows that hold puddles */
  {const w=sst(-34,-48,u+n1*10)*sst(-38,-52,v+n2*12);if(w>0){const flat=-.12+.08*(vn(u/6.5,v/6.5,834)-.5)+.03*(vn(u/2.1,v/2.1,835)-.5);
    h=h+(flat-h)*w;clay=w;const lv=-.145;if(w>.6)wl=Math.max(wl,lv);}}
  /* the peat bog: low and flat, hummocks of moss, the water just under; bog holes */
  {const w=sst(34,48,u+n1*10)*sst(-52,-66,v+n2*12);if(w>0){let b=-.28+.05*(vn(u/2.4,v/2.4,836)-.5)+.03*n2;
    const hole=Math.max(sst(5.5,2.5,mlEll(u,v,95,-110,1,1)*5.5+n3*2),sst(4.5,2,mlEll(u,v,120,-85,1,1.3)*4.5+n3*2),sst(4,1.8,mlEll(u,v,70,-128,1,1)*4+n3*2));
    b-=.28*hole;h=h+(b-h)*w;peat=w;if(w>.55)wl=Math.max(wl,-.315);}}
  /* the pond: a silt bottom down to 65 cm under the water; a ford across its west end */
  {const r=mlEll(u,v,95,18,46,30)+n1*.12;
    if(r<1.35){let d=.65*sst(1.0,.25,r);const ford=sst(7,3,Math.abs(u-68+n3*2));d=Math.min(d,d*(1-ford)+.17*ford*sst(1.0,.6,r));
      const bed=ML_PL-d+.02*n3,shore=ML_PL+.18*sst(.95,1.3,r);const k=sst(1.32,.95,r);h=h+((r<1?bed:shore)-h)*k;silt=Math.max(silt,sst(1.3,1.05,r));if(r<1.45)wl=Math.max(wl,ML_PL);}}
  /* the ditch: from the bog down to the pond */
  {const t=Math.max(0,Math.min(1,(v+62)/52)),cu=92+10*Math.sin(t*2.6),cv=-62+t*52,d=Math.hypot(u-cu,v-cv)+n3*.6;
    if(d<6.5&&v>-66&&v<-6){const k=sst(6.5,2.2,d),bed=ML_PL-.28-.08*sst(2,0,d);h=h+(bed-h)*k;silt=Math.max(silt,sst(5,2.5,d));if(d<3.4)wl=Math.max(wl,ML_PL);}}
  /* the beach: wet sand along the pond's south shore */
  {const w=sst(36,50,u+n1*8)*sst(8,22,v+n2*6)*sst(-80,-66,-v+n2*8)*sst(.92,1.08,mlEll(u,v,95,18,46,30))*sst(1.75,1.45,mlEll(u,v,95,30,50,36));sand=Math.max(sand,w);silt*=1-w;}
  /* the sand: dry dunes in the south-west */
  {const w=sst(-34,-50,u+n1*10)*sst(42,58,v+n2*10);if(w>0){const du=Math.max(0,Math.sin(u*.075+v*.03+n1)*.9+.25)*1.5+.35*Math.sin(u*.21-v*.13);h+=du*w;sand=Math.max(sand,w);}}
  /* the hills: a mound and a steeper hill */
  {const dm=Math.hypot(u+62,v+6);if(dm<15)h+=1.8*(.5+.5*Math.cos(Math.PI*dm/15));
   const dh=Math.hypot((u+118)/1.2,v-14);if(dh<22)h+=3.6*Math.pow(.5+.5*Math.cos(Math.PI*dh/22),1.3);}
  /* a patch of sod south of the field */
  {const w=sst(-14,-4,u+n1*12)*sst(-14,-4,58-u+n2*12)*sst(60,72,v+n1*10)*sst(-10,0,132-v);grass=Math.max(grass,w*(1-sand)*(.8+.2*vn(u/1.7,v/1.7,837)));}
  /* the bank all round: grass rising 3 m */
  {const b=sst(146,162,e+n1*4);h+=3.2*b;grass=Math.max(grass,b);clay*=1-b;peat*=1-b;sand*=1-b;silt*=1-b;if(b>.2)wl=ML_NONE;}
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.grass=grass;o.wl=wl;return o;}
/* (the older names the soil asks for) */
const MLZ={};
function mlBaseH(u,v){return mlZone(u,v,MLZ).h;}
function mlMat(u,v,o){mlZone(u,v,o);o.mud=Math.max(o.silt,o.peat);o.rock=0;
  o.code=o.wl>ML_NONE+1&&o.wl>o.h+.12?SF.water:o.silt>.5||o.peat>.5||o.clay>.5?SF.mud:o.sand>.5?SF.sand:o.grass>.5?SF.grass:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* the grassland round it, out to the edge of the world: low swells, dry grass with bare patches */
function mlOuter(x,z,o){
  const h=ML_A.h0+3.2+3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5);
  const bare=sst(.6,.72,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=Math.max(Math.abs(u),Math.abs(v))-A.h;
  if(e>A.m)mlOuter(x,z,o);
  else{const cu=Math.max(-A.h,Math.min(A.h,u)),cv=Math.max(-A.h,Math.min(A.h,v));mlMat(cu,cv,MLM);const h=A.h0+MLM.h;
    o.h=h;o.code=MLM.code===SF.water?SF.mud:MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;
    /* the ring past its edge: the bank's top easing into the grassland */
    if(e>0){const g={};mlOuter(x,z,g);const f=sst(0,A.m,e);o.h=h+(g.h-h)*f;o.grass=MLM.grass+(g.grass-MLM.grass)*f;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}
/* the place's name for the screen */
function mlPlace(u,v){const o=mlZone(u,v,{}),e=Math.max(Math.abs(u),Math.abs(v));
  if(e>163.84)return 'The grassland';if(e>146)return 'The bank';
  if(o.wl>-90&&o.wl>o.h)return mlEll(u,v,95,18,46,30)<1.1?(Math.abs(u-68)<6?'The ford':'The pond'):o.peat>.4?'A bog hole':o.silt>.4?'The ditch':'A puddle';
  return o.peat>.5?'The peat bog':o.clay>.5?'The clay flats':o.silt>.5?'The pond\'s edge':o.sand>.5?(u>0?'The beach':'The sand'):Math.hypot(u+118,v-14)<22||Math.hypot(u+62,v+6)<15?'The hills':o.grass>.5?'The sod':'The field';}
