/* =====================================================================================
   MUD LAB: THE WORLD (put inside the engine's world generator by src/build.py, so the background worker that makes
   the land has it too: it may use only the generator's own helpers, sst, vn, fbm, hs, SF, rimAt).
   Mud Lab 4: 1,536 m (5,039 ft) square, all of it soil, built on MOISTURE: every spot has its soil (loam, clay, silt,
   peat, sand) and how wet it is (0 dust dry .. 1 soaked); src/ml-soil.js makes its behaviour from the two, so the same
   red loam is hard and dusty on a ridge, soft at the foot of a slope and soup by the creek. u east, v south of the
   middle, metres:
     the Trailhead (south): the camp where you start, open dry fields round it
     the Field Track: a two-track from the camp east to the quarry and west to the Mud Hole
     the Mud Hole (south-west of camp): a big dug bog, water up to knee deep over sticky mud
     the Quarry (south-east): an old sand pit, 6 m down, steep sides
     Big Creek: across the map from the south-west to the north-east, in its flat valley, the Bottoms: silt banks, sand
       bars on its bends, peat bog in the low spots; the Lower and Upper Fords where trails cross it
     the Pond: in the Bottoms, south of the creek
     the Clay Pan (north-west): dry cracked clay, hard as a road until it's wet
     the Ridge (north), the Hill Climb up its south face
     the woods: most of the north and the east, with the mud trails through them (the Creek Loop, the Ridge Trail,
       the Gumbo Trail across the clay, Deer Run in the east woods), worn into two-tracks with mud holes in the low spots
     the bank all round, trees beyond
   ===================================================================================== */
const ML_A={x:0,z:1200,h:768,m:140,h0:2};
const ML_NONE=-99,ML_CL=-.35;          /* the creek's (and the pond's) water level over the Bottoms' floor; no water */
/* a smooth line through waypoints, a point every 4 m (Catmull-Rom) */
function mlLine(P){const o=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/4));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  o.push(P[P.length-1].slice());return o;}
const ML_CREEK=mlLine([[-800,560],[-620,500],[-470,400],[-340,300],[-220,220],[-110,180],[0,130],[110,60],[210,-25],[320,-55],[430,-140],[520,-250],[600,-370],[690,-460],[800,-520]]);
const ML_TRAILS=[
  {name:'Creek Loop',pts:mlLine([[20,620],[70,460],[62,320],[14,214],[-40,120],[-74,40],[-20,-44],[80,-66],[180,-112],[262,-62],[300,40],[262,140],[160,222],[92,330],[70,460]])},
  {name:'Ridge Trail',pts:mlLine([[-20,-44],[-84,-160],[-62,-300],[18,-420],[62,-482],[122,-560],[240,-604],[380,-566],[462,-462],[520,-334],[520,-262]])},
  {name:'Gumbo Trail',pts:mlLine([[-74,40],[-200,-22],[-330,-122],[-420,-242],[-520,-322],[-562,-452],[-462,-560],[-300,-560],[-180,-480],[-84,-380],[-62,-300]])},
  {name:'Deer Run',pts:mlLine([[300,40],[400,122],[520,182],[622,102],[662,-52],[602,-202],[520,-262]])},
  {name:'Field Track',pts:mlLine([[-170,606],[-60,640],[0,650],[110,630],[230,598],[350,566],[442,530]])}];
/* the mud holes on the trails (in their low, shady spots), each its own pool; and the big one.
   Mud Lab 9: three of the trails are graded, each hole's recipe (how long, how deep, how much clay) found on a row of
   trial pits with both SUVs (README, Mud Lab 9; tools/test/ml-pits.py):
   - the Field Track, EASY: six puddles 8 m long, 30 cm deep, mostly clay. The stock SUV gets through each at a steady
     10 to 20 mph, and is bogged if it stops in one (in 4 LO too). Nothing to the Rock & Mud.
   - the Creek Loop, MEDIUM: four of the same puddles, and Big Creek's two fords, which stop the stock SUV every time.
   - the Gumbo Trail, HARD: four pits 20 m long, 72 cm deep, all clay, on level stretches in the woods (trees for the
     winch): the Rock & Mud crawls through at 2 to 5 mph if it keeps moving (12 of 16 test drives), and is bogged if it
     stops in one (11 of 13).
   (the Ridge Trail's and Deer Run's holes are as they were) */
const ML_HOLES=[];
(()=>{const add=(tr,f,L,W,d,c)=>{const P=ML_TRAILS[tr].pts,i=Math.max(1,Math.min(P.length-2,Math.round(f*(P.length-1)))),a=P[i-1],b=P[i+1],r=Math.atan2(b[1]-a[1],b[0]-a[0]),H={u:P[i][0],v:P[i][1],L,W,r,d,lv:null,tr};if(c!==undefined)H.c=c;ML_HOLES.push(H);};
  [[0,.12,4,4.6,.3,.8],[0,.34,4,4.6,.3,.8],[0,.58,4,4.6,.3,.8],[0,.86,4,4.6,.3,.8],[1,.22,12,5,.4],[1,.48,8,4.6,.3],[1,.74,14,5,.45],[2,.145,10,5,.72,1],[2,.232,10,5,.72,1],[2,.625,10,5,.72,1],[2,.738,10,5,.72,1],
   [3,.3,12,5,.4],[3,.62,10,4.8,.38],[4,.12,4,4.6,.3,.8],[4,.4,4,4.6,.3,.8],[4,.52,4,4.6,.3,.8],[4,.64,4,4.6,.3,.8],[4,.76,4,4.6,.3,.8],[4,.88,4,4.6,.3,.8]].forEach(a=>add(...a));
  ML_HOLES.push({u:-172,v:556,L:30,W:19,r:.35,d:.75,lv:null,big:1});})();
const ML_POND={u:232,v:104,a:62,b:34,r:-.5};
const ML_QUARRY={u:450,v:516,a:66,b:48};
const ML_CLAY={u:-470,v:-300};
/* the Heron Strip (Mud Lab 5): a mown grass strip in the south fields, 400 m long, a worn dirt track down its middle,
   its ground laid level end to end; the Heron waits at its west end, facing east along it */
const ML_STRIP={u0:-60,u1:340,v:690,hw:12,h0:null,h1:null};
/* the places for the map: name, where, and what (for its mark) */
const ML_PLACES=[['TRAILHEAD',0,650,'camp'],['MUD HOLE',-172,556,'hole'],['QUARRY',450,516,'sand'],['THE POND',232,104,'water'],['BIG CREEK',-340,300,'water'],
  ['THE BOTTOMS',380,-110,'bog'],['CLAY PAN',-470,-300,'clay'],['THE RIDGE',220,-640,'hill'],['HILL CLIMB',62,-482,'hill'],['LOWER FORD',-24,150,'ford'],['UPPER FORD',282,-48,'ford'],
  ['EASY: FIELD TRACK',120,600,'trail'],['MEDIUM: CREEK LOOP',80,410,'trail'],['HARD: GUMBO TRAIL',-110,22,'trail'],['RIDGE TRAIL',400,-560,'trail'],['DEER RUN',600,80,'trail'],['HERON STRIP',250,690,'strip']];
/* ---------- quick nearest-line lookups: each line's segments in 32 m buckets ---------- */
const ML_BK=32,ML_BN=Math.ceil(2*(ML_A.h+ML_A.m)/ML_BK)+2;
const ML_IDX={creek:new Map(),trail:new Map()};
(()=>{const put=(M,ln,P,k)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],pad=k;
    const i0=Math.floor((Math.min(a[0],b[0])-pad+ML_A.h+ML_A.m)/ML_BK),i1=Math.floor((Math.max(a[0],b[0])+pad+ML_A.h+ML_A.m)/ML_BK),j0=Math.floor((Math.min(a[1],b[1])-pad+ML_A.h+ML_A.m)/ML_BK),j1=Math.floor((Math.max(a[1],b[1])+pad+ML_A.h+ML_A.m)/ML_BK);
    for(let j=j0;j<=j1;j++)for(let q=i0;q<=i1;q++){const key=j*ML_BN+q;let L=M.get(key);if(!L)M.set(key,L=[]);L.push(ln,i);}}};
  put(ML_IDX.creek,0,ML_CREEK,140);ML_TRAILS.forEach((t,n)=>put(ML_IDX.trail,n,t.pts,12));})();
const MLQ={d:1e9,t:0,n:-1,i:0,f:0};
function mlNear(M,lines,u,v,o){o.d=1e9;o.n=-1;const L=M.get(Math.floor((v+ML_A.h+ML_A.m)/ML_BK)*ML_BN+Math.floor((u+ML_A.h+ML_A.m)/ML_BK));if(!L)return o;
  for(let q=0;q<L.length;q+=2){const n=L[q],i=L[q+1],P=lines(n),a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],ll=ex*ex+ez*ez||1;let f=((u-a[0])*ex+(v-a[1])*ez)/ll;f=f<0?0:f>1?1:f;
    const dx=u-a[0]-ex*f,dz=v-a[1]-ez*f,d=dx*dx+dz*dz;if(d<o.d){o.d=d;o.n=n;o.i=i;o.f=f;}}
  o.d=Math.sqrt(o.d);return o;}
const ML_CL_F=n=>ML_CREEK,ML_TR_F=n=>ML_TRAILS[n].pts;
/* the rolling hills (over the Bottoms' floor) and the Ridge */
function mlHills(u,v){return 3+12*fbm(u/420+3.1,v/420-1.7,3,841)+3*fbm(u/120,v/120,2,842)+22*Math.exp(-Math.pow((v+600)/120,2))*sst(-760,-500,u)*sst(760,560,u);}
/* ---------- the world's own ground: height over h0, soils (weights; loam is what's left), moisture, water level,
   sod, the woods' floor, the trail (distance from its middle, 99 off it) and how wooded ---------- */
const MLN={d:0,t:0,n:-1,i:0,f:0},MLT={d:0,t:0,n:-1,i:0,f:0};
function mlZone(u,v,o){
  const e=Math.max(Math.abs(u),Math.abs(v)),n1=vn(u/9,v/9,831)-.5,n2=vn(u/37,v/37,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5,big=fbm(u/260,v/260,2,834)-.5;
  mlNear(ML_IDX.creek,ML_CL_F,u,v,MLN);const dc=MLN.d,hw=4+2*vn(MLN.i/9,0,835);
  /* the Bottoms: a flat valley 75-120 m each side of the creek; the hills beyond */
  const vb=88+30*vn(MLN.i/14,3,836),bot=sst(vb+70,vb,dc+n2*30);
  let h=mlHills(u,v)*(1-bot)+(.06*n1+.03*n3)*bot,clay=0,silt=0,peat=0,sand=0,wl=ML_NONE,moist=.32+.12*n2+.1*big;
  moist+=.5*bot+.25*sst(40,0,dc);moist-=.2*sst(5,18,h)*(1-bot);
  /* the creek: its channel, a deep middle, sand bars on the bends, silt banks; peat in the Bottoms' wettest spots */
  if(dc<hw+6){const k=Math.max(0,1-(dc/hw)**2);h=Math.min(h,-1.0*k+.05*(1-k));if(dc<hw*1.05)wl=ML_CL;}
  silt+=sst(30,6,dc)*bot;sand+=sst(.62,.75,vn(u/22,v/22,837))*sst(22,8,dc)*sst(hw*.7,hw*1.3,dc);
  peat+=bot*sst(.55,.68,fbm(u/70,v/70,2,838))*sst(30,50,dc);if(peat>.2){h-=.06*peat*(vn(u/2.2,v/2.2,839)-.3);}
  /* the pond, in the Bottoms */
  {const P=ML_POND,cs=Math.cos(P.r),sn=Math.sin(P.r),x=u-P.u,z=v-P.v,a=(x*cs+z*sn)/P.a,b=(-x*sn+z*cs)/P.b,r=Math.hypot(a,b)+n1*.1;
    if(r<1.4){const d=1.1*sst(1,.2,r);if(r<1){h=Math.min(h,ML_CL-d);wl=ML_CL;}else h=Math.min(h,ML_CL+.2*sst(1,1.4,r));silt=Math.max(silt,sst(1.4,1.05,r));moist=Math.max(moist,1-sst(1,1.4,r)*.4);}}
  /* the Clay Pan: flat cracked clay, dry; a few low spots stay wet */
  {const r=Math.hypot((u-ML_CLAY.u)/170,(v-ML_CLAY.v)/120)+n2*.4;if(r<1.3){const k=sst(1.3,.9,r);clay=Math.max(clay,k);h=h+(4.5+.25*n1-h)*k;moist=moist*(1-k)+(.12+.5*sst(.6,.72,vn(u/30,v/30,840)))*k;}}
  clay=Math.max(clay,sst(.7,.8,fbm(u/90+7,v/90,2,843))*(1-bot)*sst(60,-120,v));
  /* the Quarry: a sand pit 6 m down with steep sides */
  {const Q=ML_QUARRY,r=Math.hypot((u-Q.u)/Q.a,(v-Q.v)/Q.b)+n2*.12;if(r<1.25){const k=sst(1.12,.92,r);h=h-6*k+.8*Math.max(0,Math.sin(u*.09+v*.05))*k*sst(.85,.4,r);sand=Math.max(sand,sst(1.25,1,r));moist=Math.min(moist,.2+.3*k*sst(.4,0,r));}}
  /* the trails: worn two-tracks a little below the ground round them, wetter in the woods */
  mlNear(ML_IDX.trail,ML_TR_F,u,v,MLT);let trail=99;
  if(MLT.d<3.6){trail=MLT.d;const k=sst(3.6,1.6,MLT.d);h-=.14*k;moist=Math.min(1,moist+.12*k);}
  /* the mud holes: each a pool at its own level, the bed under it; the big one dug deep */
  for(const H of ML_HOLES){const x=u-H.u,z=v-H.v;if(Math.abs(x)>H.L+8||Math.abs(z)>H.L+8)continue;const cs=Math.cos(H.r),sn=Math.sin(H.r),a=(x*cs+z*sn)/H.L,b=(-x*sn+z*cs)/H.W,r=Math.hypot(a,b)+n3*.12;
    if(r<1.5){if(H.lv===null)H.lv=mlHillsAt(H)-.14-.12*(H.big||0);const k=sst(1.5,1,r);
      h=r<1?Math.min(h,H.lv-H.d*sst(1,.15,r)):h+(Math.max(H.lv+.12,Math.min(h,H.lv+.4))-h)*k;if(r<1)wl=H.lv;moist=Math.max(moist,1-.5*sst(1,1.5,r));clay=Math.max(clay,(H.c!==undefined?H.c:H.big?.7:.35)*sst(1.5,1,r));if(H.s)silt=Math.max(silt,H.s*sst(1.5,1,r));}}
  /* the Heron Strip: level, dry and hard, no trees near it */
  let strip=0,stripD=99;
  {const S=ML_STRIP,dv=Math.abs(v-S.v),f=(u-S.u0)/(S.u1-S.u0);if(dv<60&&f>-.2&&f<1.2){
    if(S.h0===null){S.h0=mlHills(S.u0,S.v);S.h1=mlHills(S.u1,S.v);}const fc=Math.max(0,Math.min(1,f)),hl=S.h0+(S.h1-S.h0)*fc,
    ends=sst(-.2,-.02,f)*sst(1.2,1.02,f),k=sst(S.hw+30,S.hw+4,dv)*ends;h=h+(hl-h)*k;
    strip=sst(S.hw+1.5,S.hw,dv)*sst(-.03,0,f)*sst(1.03,1,f);stripD=dv;clay*=1-k;silt*=1-k;peat*=1-k;sand*=1-k;moist=moist*(1-k)+.15*k;if(k>.5)wl=ML_NONE;}}
  /* the bank all round: rising 6 m, grass */
  const bank=sst(724,752,e+n2*10);h+=6*bank;if(bank>.2)wl=ML_NONE;
  moist=Math.max(0,Math.min(1,moist));
  /* the woods: most of the north and the east; open fields round the camp; thin in the Bottoms; none on the pan,
     the trails, the water or the bank */
  let wood=sst(.42,.56,fbm(u/300,v/300,3,844)+.22*sst(-100,-500,v)+.15*sst(150,500,u)-.35*sst(330,560,v))*(1-.7*bot)*(1-clay*.9)*(1-sand*.8)*(1-bank);
  if(trail<4.5||wl>ML_NONE+1||dc<hw+3)wood=0;
  if(stripD<99){const f=(u-ML_STRIP.u0)/(ML_STRIP.u1-ML_STRIP.u0);wood*=Math.min(1,sst(ML_STRIP.hw+18,ML_STRIP.hw+60,stripD)+1-sst(-.2,-.05,f)*sst(1.2,1.05,f));}
  const grass=(1-wood)*(1-sst(.3,.7,clay+sand+peat+silt))*(trail<99?sst(1.4,2.6,trail):1)*(wl>ML_NONE+1?0:1)*(.6+.4*sst(.15,.5,moist));
  /* (the strip: mown grass, the dirt track down its middle 3 m each side) */
  const gS=grass*(1-strip)+strip*(stripD<2.2?.1:stripD<3.2?.1+.8*(stripD-2.2):.9);
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=wl;o.grass=Math.max(0,Math.min(1,gS));o.wood=wood;o.trail=trail;o.dc=dc;o.strip=strip;o.stripD=stripD;return o;}
/* (a mud hole's own level: the ground round it, without it) */
function mlHillsAt(H){const dc=mlNear(ML_IDX.creek,ML_CL_F,H.u,H.v,{d:0}).d,bot=sst(170,90,dc);return mlHills(H.u,H.v)*(1-bot)-.14;}
const MLZ={};
function mlBaseH(u,v){return mlZone(u,v,MLZ).h;}
function mlMat(u,v,o){mlZone(u,v,o);o.mud=Math.max(o.silt,o.peat);o.rock=0;
  o.code=o.wl>ML_NONE+1&&o.wl>o.h+.12?SF.water:(o.silt>.5||o.peat>.5)&&o.moist>.5?SF.mud:o.sand>.5?SF.sand:o.grass>.5?SF.grass:o.trail<2.5?SF.trail:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* the grassland round it, out to the edge of the world: low swells, dry grass with bare patches */
function mlOuter(x,z,o){
  const h=ML_A.h0+9+3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5);
  const bare=sst(.6,.72,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=Math.max(Math.abs(u),Math.abs(v))-A.h;
  if(e>A.m)mlOuter(x,z,o);
  else{const cu=Math.max(-A.h,Math.min(A.h,u)),cv=Math.max(-A.h,Math.min(A.h,v));mlMat(cu,cv,MLM);const h=A.h0+MLM.h;
    o.h=h;o.code=MLM.code===SF.water?SF.mud:MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;
    if(e>0){const g={};mlOuter(x,z,g);const f=sst(0,A.m,e);o.h=h+(g.h-h)*f;o.grass=MLM.grass+(g.grass-MLM.grass)*f;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}
/* the woods' trees, chunk by chunk (genStatic hands in its own addTree): a tree every 6 m or so where it's wooded,
   broadleaf mostly, pines up on the high ground */
function mlTrees(x0,z0,x1,z1,addTree){
  const A=ML_A,S=6.2,o={};
  for(let z=Math.floor(z0/S)*S;z<z1;z+=S)for(let x=Math.floor(x0/S)*S;x<x1;x+=S){
    const jx=x+hs(Math.round(x),Math.round(z),861)*S,jz=z+hs(Math.round(x),Math.round(z),862)*S;if(jx<x0||jx>=x1||jz<z0||jz>=z1)continue;
    const u=jx-A.x,v=jz-A.z;if(Math.max(Math.abs(u),Math.abs(v))>A.h-20)continue;mlZone(u,v,o);
    if(o.wood<.05||hs(Math.round(jx*3),Math.round(jz*3),863)>o.wood*.95)continue;
    const pine=o.h>14&&hs(Math.round(jx),Math.round(jz),864)<.6,sc=.8+.55*hs(Math.round(jx*2),Math.round(jz*2),865);
    addTree(jx,jz,pine?3:hs(Math.round(jx),Math.round(jz),866)<.5?0:1,sc,1);}}
/* the place's name for the screen */
function mlPlace(u,v){const e=Math.max(Math.abs(u),Math.abs(v));if(e>752)return 'Outside';if(e>724)return 'The bank';
  const o=mlZone(u,v,{});
  if(o.strip>.5)return 'The Heron Strip';
  for(const H of ML_HOLES)if(Math.hypot(u-H.u,v-H.v)<H.L+3)return H.big?'The Mud Hole':'A mud hole';
  if(o.trail<3.6){mlNear(ML_IDX.trail,ML_TR_F,u,v,MLT);if(MLT.n>=0)return ML_TRAILS[MLT.n].name;}
  if(o.wl>ML_NONE+1&&o.wl>o.h)return Math.hypot(u-ML_POND.u,v-ML_POND.v)<70?'The Pond':'Big Creek';
  if(Math.hypot(u-ML_QUARRY.u,v-ML_QUARRY.v)<70)return 'The Quarry';if(Math.hypot((u-ML_CLAY.u)/170,(v-ML_CLAY.v)/120)<1.1)return 'The Clay Pan';
  if(o.dc<200&&o.h<1.5)return 'The Bottoms';if(Math.hypot(u,v-650)<70)return 'The Trailhead';if(v<-480)return 'The Ridge';
  return o.wood>.5?'The woods':'The fields';}
