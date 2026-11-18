/* =====================================================================================
   MUD LAB 22.4, ALTERNATE MAP 2: RIMROCK RUN (put inside the engine's world generator by src/build.py, so the
   background workers that make the land have it too: it may use only the generator's own helpers, sst, vn, fbm, hs,
   SF, rimAt). Everything technical is Mud Lab 22.4's: the soil, the water, the SUVs, the winch and the strap. The
   ground is new, and the first of these maps that is a STRIP, not a square (src/ml-soil.js MLS: WS by WZ).
   His words (Nov 18): "a mile wide strip that's 3 or 4 mi long", the elevation rising "gradually from the East side of
   the map which is the river bottoms and then up to the west side", "something between rimrock one and two that has
   really good views", 800 ft of it, less steep than the Rimrocks "so the rally car can do things".
   6,144 m (3.8 miles) east to west, 1,536 m (0.95 mile) north to south; u east, v south of its middle, metres. W in
   these notes is metres over the river's water (h, what the soil keeps, is W - 88: the river's water is at -88 over the
   world's base level ML_A.h0 = 88 m, so it lies at 0). x is how far west of the east edge (3,072 - u). East to west:
     THE BOTTOMS (x 0..900; W 1 to 2): the River across the strip from north to south, its middle a chain of sand bars
       and flat-bottomed pools (the Braids: Mud Lab's water at its best), the Sloughs on its far side; the Oxbow, a
       cut-off bend: a crescent lake; cottonwoods; River Camp, where you start, facing west up the whole strip
     THE LOW BENCH (x 900..1,700; W 14 to 23): a riser of 12 m, then an old terrace, junipers
     THE BREAKS (x 1,700..2,750; W 23 to 71): bare clay and red dirt in bands, cut by gullies, badland humps
     THE HIGH BENCH (x 2,750..3,900; W 71 to 95): grass and aspen groves, a terrace step of 9 m, LONE BUTTE (38 m,
       cliffs all round, its top flat)
     THE WALL (x 3,900..4,630; W 95 to 213): two faces of 52 and 54 m with the Shelf between, gullies down them, a band
       of rimrock along the top (6 m, broken in notches). THE GRADE climbs it in two long legs and two hairpins
     THE RIM (x 4,630..6,144; W 213 to 245): pines on rolling ground; THE LOOKOUT, a knob at the rim's edge, the view
       east down all of it
     COLD CREEK: from a spring at the Wall's foot down the high bench, through the breaks in a ravine, over the low bench
       and across the bottoms into the River: a stair of pools, each flat at its own level, a little fall between each
     the bank along the long sides; beyond them the valley's walls rise, so the strip lies in a valley
   ===================================================================================== */
/* (x, z: where u = 0, v = 0 is in the world; hx, hz: half the strip each way; cu, cv: its middle; m: the blend into the
   country beyond; h0: the world's base level; old: what Mud Lab's code calls the edge (ML_E is 768 there all round)) */
const ML_A={x:0,z:1200,hx:3072,hz:768,cu:0,cv:0,m:140,h0:88,old:768};
const ML_E=(u,v)=>768+Math.max(Math.abs(u)-3072,Math.abs(v)-768);
const ML_NONE=-99,ML_CL=-88;          /* no water; the River's water */
/* a smooth line through waypoints, a point every 4 m (Catmull-Rom) */
function mlLine(P){const o=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/4));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  o.push(P[P.length-1].slice());let s=0;for(let i=0;i<o.length;i++){if(i)s+=Math.hypot(o[i][0]-o[i-1][0],o[i][1]-o[i-1][1]);o[i][2]=s;}return o;}
/* ---------- THE LAND'S SHAPE ---------- */
/* (where a step in the land stands wanders north to south, each its own way: no ruled lines) */
function mlWand(v,k){return 120*(fbm(v/430+k*1.7,k*3.1,2,950+k)-.5);}
/* the notches in the rimrock band: where the Grade tops out, and two gullies */
function mlNotch(v){return Math.max(Math.exp(-Math.pow((v-610)/45,2)),Math.exp(-Math.pow((v+420)/30,2)),Math.exp(-Math.pow((v-120)/22,2)));}
/* each band's share at x (west of the east edge) */
const mlBreaks=x=>sst(1450,1700,x)*sst(2900,2700,x),mlWallM=(x,xw)=>sst(3850,3950,xw)*sst(4640,4600,xw);
/* W, the land's height over the River's water, before anything is cut into it: the steps east to west */
function mlProf(u,v){const x=3072-u;let W=1.2+.6*sst(300,870,x);
  W+=12*sst(-45,45,x-(900+mlWand(v,1)));                     /* the low bench's riser */
  W+=9*sst(900,1700,x);                                        /* the bench, rising */
  W+=48*sst(1600,2750,x+.5*mlWand(v,2));                       /* the breaks */
  W+=7*sst(2700,3300,x)+9*sst(-35,35,x-(3260+mlWand(v,3)))+8*sst(3300,3900,x);  /* the high bench, its terrace step */
  const xw=x+mlWand(v,4);                                      /* the Wall: two faces, the Shelf, the rimrock */
  W+=52*sst(3890,4150,xw)+6*sst(4150,4400,xw)+54*sst(4350,4610,xw)+6*sst(-7,7,xw-4618)*(1-mlNotch(v));
  W+=22*sst(4650,6100,x);                                      /* the rim, rising west */
  return W+7*Math.pow(v/768,2);}                               /* (and up a little toward each long side: a valley) */
/* the Butte and the Lookout */
const ML_BUTTE={u:-488,v:300,R:95,H:38},ML_LOOK={u:-1588,v:-260};
/* ---------- the land, with what wears it: gullies, badlands, the Butte, the Lookout's knob; its soils, wet and woods ---------- */
function mlLand(u,v,o){
  const x=3072-u,n1=vn(u/9,v/9,831)-.5,n2=vn(u/37,v/37,832)-.5,xw=x+mlWand(v,4);
  let W=mlProf(u,v);
  const br=mlBreaks(x),wa=mlWallM(x,xw),rim=sst(4660,4760,xw),bot=1-sst(820,960,x);
  /* GULLIES: valleys lying east and west, deepest in the breaks and down the Wall's faces, shallow swales elsewhere */
  const g=Math.abs(fbm(u/520+1.3,v/160-2.2,2,960)-.5),g2=Math.abs(fbm(u/210+4.1,v/70+.7,2,961)-.5);
  const D=9*br+7*wa+3*sst(-90,0,x-(900+mlWand(v,1)))*sst(90,0,x-(900+mlWand(v,1)))+1.5*sst(2700,2900,x)*sst(3900,3800,x)+2*rim;
  const val=Math.pow(sst(.085,0,g),1.2),val2=sst(.06,0,g2);W-=D*(val+.45*val2)*(1-bot);
  /* the breaks' humps: badland ground */
  W+=3.2*(fbm(u/45,v/45,2,962)-.5)*br+1.2*(fbm(u/70,v/70,2,963)-.5)*(1-br);
  /* the rim rolling, and its knobs */
  W+=6*(fbm(u/300,v/300,3,964)-.5)*rim;
  {const d=Math.hypot(u-ML_LOOK.u,v-ML_LOOK.v);W+=14*Math.exp(-d*d/(110*110));}
  /* LONE BUTTE: a mesa on the high bench, cliffs all round, a talus apron at their foot, its top flat */
  let butte=0,cliff=0;{const B=ML_BUTTE,r=Math.hypot(u-B.u,v-B.v)+18*(fbm(u/60,v/60,2,965)-.5);if(r<B.R+140){butte=sst(B.R+28,B.R,r);cliff=butte*(1-butte)*4;W+=B.H*butte+7*sst(B.R+120,B.R+28,r)*(1-butte)+.6*n1*butte;}}
  const rimrock=sst(-9,-2,xw-4618)*sst(9,2,xw-4618)*(1-mlNotch(v));
  /* the soils. Loam (red dirt) under it all; clay: the breaks' and the Wall's bare faces in bands by height (grey and red,
     layer on layer), the rimrock, the Butte's cliffs, the bottoms' backswamp; silt and peat in the bottoms */
  const band=sst(.42,.62,.5+.5*Math.sin(W*1.15+2.4*fbm(u/300,v/300,2,966)));
  let clay=Math.max(band*(.75*br+.6*wa*(1-rim)),.9*rimrock,.8*cliff,.6*sst(.64,.76,fbm(u/90+7,v/90,2,843))*bot);
  let silt=.75*bot*sst(.45,.62,fbm(u/120,v/120,2,967)),peat=bot*sst(.6,.7,fbm(u/70,v/70,2,838))*sst(150,260,x),sand=.35*br*val;
  if(peat>.2)W-=.06*peat*(vn(u/2.2,v/2.2,839)-.3);
  /* wet: the bottoms soaked, drier with height; gully bottoms and north-facing ground wetter */
  let moist=.3+.12*n2+.5*bot-.1*br+.06*rim+.18*val*(1-bot)+.08*sst(0,-400,v);
  /* the woods: cottonwood groves in the bottoms, a juniper here and there on the bench and in the breaks, aspen groves on
     the high bench, scattered down the Wall's gullies, pines on the rim (clearings in it), none on the Butte or round the
     Lookout */
  let wood=Math.max(.8*sst(.6,.7,fbm(u/150,v/150,2,970))*bot,
    .3*sst(.56,.7,fbm(u/90,v/90,2,971))*sst(950,1100,x)*sst(2800,2600,x),
    .8*sst(.6,.7,fbm(u/140,v/140,2,972))*sst(2750,2900,x)*sst(3950,3850,x),
    (.3*sst(.5,.65,fbm(u/80,v/80,2,973))+.45*val)*wa*(1-rim),
    .8*sst(.38,.5,fbm(u/260,v/260,3,974))*rim);
  wood*=(1-butte)*(1-rimrock)*sst(60,90,Math.hypot(u-ML_LOOK.u,v-ML_LOOK.v))*(1-.8*clay*br);
  o.h=W+ML_CL;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=ML_NONE;o.wood=wood;
  o.x=x;o.br=br;o.wa=wa;o.rim=rim;o.bot=bot;o.butte=butte;o.cliff=cliff;o.rimrock=rimrock;o.val=val;return o;}
const MLL0={};
function mlLandH(u,v){return mlLand(u,v,MLL0).h;}
function mlHills(u,v){return mlLandH(u,v);}
/* ---------- THE RIVER: its line, a point every 10 m, north edge to south edge. Each waypoint: where (u, v), then hw
   half its width; ch how much of it is the chain of bars and pools (0 a plain channel, 1 the Braids); dp how deep a
   plain channel is in its middle; soft how soft a plain channel's bed is (0 firm sand .. 1 silt). Each point carries
   those (eased from waypoint to waypoint) and, last, how far down the River it is (m) ---------- */
function mlRiver(P,step){const o=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3),q=[f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])],e=t2*(3-2*t);
      for(let c=2;c<6;c++)q.push(p1[c]+(p2[c]-p1[c])*e);o.push(q);}}
  o.push(P[P.length-1].slice(0,6));
  let s=0;for(let i=0;i<o.length;i++){if(i)s+=Math.hypot(o[i][0]-o[i-1][0],o[i][1]-o[i-1][1]);o[i].push(s);}
  return o;}
/*                          u     v   hw  ch   dp  soft */
const ML_RIVER=mlRiver([[2760,-860, 34,  0, 1.5, .5],[2700,-600, 40,  0, 1.2, .4],[2662,-420, 54,  1, .45,  0],[2716,-210, 62,  1, .45,  0],
                        [2782,   0, 66,  1, .45,  0],[2738, 200, 64,  1, .45,  0],[2664, 380, 56,  1, .45,  0],[2700, 580, 44,  0, 1.3, .5],[2766,860, 34,  0, 1.6, .6]],10);
/* (the chain: where it starts along the River and how long it is; a pool every P m, d0 deep at its top to d1 at its foot) */
const ML_CHAIN=(()=>{let a=-1,b=0;for(const p of ML_RIVER){if(p[3]>.5){if(a<0)a=p[6];b=p[6];}}return {s0:a,len:b-a,P:40,d0:.38,d1:.7};})();
/* ---------- COLD CREEK: from its spring at the Wall's foot (upstream, s = 0) to the River ---------- */
const ML_CREEK=mlLine([[-820,-300],[-600,-250],[-350,-330],[-100,-260],[150,-120],[400,-160],[650,-60],[900,40],[1150,-20],[1400,60],[1650,20],[1900,120],[2150,80],[2350,150],[2520,120],[2652,96]]);
/* its bed and its pools, worked out once from the land along it: the bed every 4 m (B: never rising downstream), each
   pool from s0 to s1 (m) at its own level wl, dep deep in its middle. A pool ends where the bed has fallen 55 cm, or after
   56 m: on the benches long still pools, in the breaks a stair of short ones */
const MLCK={B:null,P:null,pi:null};
function mlCreekInit(){if(MLCK.B)return;const C=ML_CREEK,n=C.length,B=new Float64Array(n),o={};
  for(let i=0;i<n;i++){mlLand(C[i][0],C[i][1],o);const inc=1.1+5*o.br+1.5*o.wa+3*sst(-90,0,o.x-900)*sst(90,0,o.x-900);B[i]=o.h-inc;}
  for(let i=1;i<n;i++)B[i]=Math.min(B[i],B[i-1]-.004);
  const S=new Float64Array(n);for(let i=0;i<n;i++){let a=0,w=0;for(let d=-6;d<=6;d++){const j=i+d;if(j<0||j>=n)continue;const k=7-Math.abs(d);a+=B[j]*k;w+=k;}S[i]=a/w;}
  for(let i=1;i<n;i++)S[i]=Math.min(S[i],S[i-1]-.004);
  /* (never below the River: its last pools lie at the River's own level) */
  for(let i=0;i<n;i++)S[i]=Math.max(S[i],ML_CL-.2);
  const P=[],pi=new Int32Array(n);let i0=0;
  while(i0<n-1){let i1=i0+1;while(i1<n-1&&S[i0]-S[i1]<.55&&(C[i1][2]-C[i0][2])<56)i1++;
    P.push({s0:C[i0][2],s1:C[i1][2],wl:S[i1]+.22,dep:.35+.45*Math.min(1,(C[i1][2]-C[i0][2])/50)});for(let k=i0;k<i1;k++)pi[k]=P.length-1;i0=i1;}
  pi[n-1]=P.length-1;MLCK.B=S;MLCK.P=P;MLCK.pi=pi;}
/* ---------- the trails: worn two-tracks. The first three are graded and timed (THINGS TO DO) ---------- */
const ML_TRAILS=[
  {name:'Bottoms Track',pts:mlLine([[2380,330],[2470,190],[2545,20],[2525,-190],[2470,-370],[2350,-600],[2190,-610],[2110,-440],[2150,-200],[2210,40],[2290,220],[2380,330]])},
  {name:'Creek Trail',pts:mlLine([[2060,240],[1820,200],[1560,150],[1300,170],[1040,110],[780,140],[520,40],[260,-20],[30,-120],[-200,-150],[-430,-170],[-700,-150]])},
  {name:'Rim Trail',pts:mlLine([[-1760,-80],[-2000,-180],[-2250,-80],[-2500,-160],[-2720,-60],[-2880,120],[-2700,300],[-2420,240],[-2150,330],[-1900,260],[-1760,-80]])}];
/* ---------- THE GRADE: a graded road the length of the strip, River Camp to the Rim, laid to its own heights (the land
   along it, evened out over 100 m) and cut into the slope where it crosses one. Up the Wall in two long legs, a
   hairpin at each end. Never steeper than 9%: where the land is, the road is cut down into it or built up over it ---------- */
const ML_ROADS=[{name:'The Grade',hw:4,y:null,pts:mlLine([[2380,330],[2150,390],[1900,430],[1400,320],[900,400],[400,270],[0,350],[-260,560],[-600,610],
  [-860,640],[-1110,-580],[-1150,-655],[-1215,-665],[-1255,-600],[-1555,580],[-1600,650],[-1660,640],[-1700,520],[-1720,250],[-1700,0],[-1680,-180],
  [-1900,-300],[-2300,-200],[-2700,-300],[-2960,-250]])}];
function mlRoadY(R){if(R.y)return R.y;const P=R.pts,n=P.length,raw=new Float64Array(n),y=new Float64Array(n);
  for(let i=0;i<n;i++)raw[i]=mlLandH(P[i][0],P[i][1]);
  for(let i=0;i<n;i++){let a=0,w=0;for(let d=-25;d<=25;d++){const j=i+d;if(j<0||j>=n)continue;const k=26-Math.abs(d);a+=raw[j]*k;w+=k;}y[i]=a/w;}
  /* (the grade held under 9%: a pass each way, and the two met halfway) */
  const G=.09,f=Float64Array.from(y),b=Float64Array.from(y);
  for(let i=1;i<n;i++){const g=G*(P[i][2]-P[i-1][2]);f[i]=Math.min(Math.max(f[i],f[i-1]-g),f[i-1]+g);}
  for(let i=n-2;i>=0;i--){const g=G*(P[i+1][2]-P[i][2]);b[i]=Math.min(Math.max(b[i],b[i+1]-g),b[i+1]+g);}
  for(let i=0;i<n;i++)y[i]=(f[i]+b[i])/2;
  for(let p=0;p<3;p++)for(let i=1;i<n;i++){const g=G*(P[i][2]-P[i-1][2]);y[i]=Math.min(Math.max(y[i],y[i-1]-g),y[i-1]+g);}
  return R.y=y;}
/* the mud holes on the trails, each its own pool. The recipes are Mud Lab 9's, graded there with both SUVs: EASY
   puddles 8 m long, 30 cm deep, mostly clay; MEDIUM longer and a little deeper; HARD pits 20 m long, 72 cm deep, all clay,
   in the woods (trees for the winch) */
const ML_HOLES=[];
(()=>{const add=(tr,f,L,W,d,c)=>{const P=ML_TRAILS[tr].pts,i=Math.max(1,Math.min(P.length-2,Math.round(f*(P.length-1)))),a=P[i-1],b=P[i+1],r=Math.atan2(b[1]-a[1],b[0]-a[0]),H={u:P[i][0],v:P[i][1],L,W,r,d,lv:null,tr};if(c!==undefined)H.c=c;ML_HOLES.push(H);};
  [[0,.12,4,4.6,.3,.8],[0,.3,4,4.6,.3,.8],[0,.5,4,4.6,.3,.8],[0,.68,4,4.6,.3,.8],[0,.86,4,4.6,.3,.8],
   [1,.08,8,4.6,.3],[1,.26,12,5,.4],[1,.47,8,4.6,.3],[1,.68,14,5,.45],
   [2,.18,10,5,.72,1],[2,.42,10,5,.72,1],[2,.64,10,5,.72,1],[2,.86,10,5,.72,1]].forEach(a=>add(...a));})();
/* River Camp: a packed pad on the bottoms, where you start */
const ML_PITS={u:2390,v:330,a:46,b:24,lv:null};
/* (what the game's other parts ask the world for that this map has none of yet: no Bog, no Hill Climb, no jumps) */
const ML_BOG=null,ML_CLIMB=null;function mlClimbY(){return 0;}function mlClimbS(){return 0;}
const ML_X={jumps:[],river:ML_RIVER,chain:ML_CHAIN,creek:ML_CREEK,roads:ML_ROADS,butte:ML_BUTTE,look:ML_LOOK};
/* the places for the map: name, where, what (for its mark), and 1 for the main places */
const ML_PLACES=[['RIVER CAMP',2390,330,'camp',1],['THE BRAIDS',2740,-60,'ford',1],['THE SLOUGHS',2820,300,'bog'],['THE OXBOW',2300,-420,'water',1],
  ['THE BOTTOMS',2150,0,'bog'],['LOW BENCH',1700,-300,'hill',1],['THE BREAKS',800,-380,'hill',1],['COLD CREEK',360,-150,'water',1],
  ['HIGH BENCH',-150,120,'hill',1],['LONE BUTTE',ML_BUTTE.u,ML_BUTTE.v,'hill',1],['THE WALL',-1100,150,'hill',1],['THE SHELF',-1180,-200,'hill'],
  ['THE GRADE',-1000,40,'trail'],['RIMROCK',-1540,-480,'hill'],['THE LOOKOUT',ML_LOOK.u,ML_LOOK.v,'hill',1],['THE RIM',-2400,60,'hill',1],
  ['EASY: BOTTOMS TRACK',2160,-200,'trail'],['MEDIUM: CREEK TRAIL',1300,170,'trail'],['HARD: RIM TRAIL',-2500,-160,'trail']];
/* ---------- quick nearest-line lookups: each line's segments in 32 m buckets ---------- */
const ML_RVPAD=160;
const ML_BK=32,ML_BO=ML_A.hx+ML_A.m,ML_BN=Math.ceil(2*(ML_A.hx+ML_A.m)/ML_BK)+2;
const ML_IDX={river:new Map(),trail:new Map(),creek:new Map(),road:new Map()};
(()=>{const put=(M,ln,P,k)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],pad=k;
    const i0=Math.max(0,Math.floor((Math.min(a[0],b[0])-pad+ML_BO)/ML_BK)),i1=Math.min(ML_BN-1,Math.floor((Math.max(a[0],b[0])+pad+ML_BO)/ML_BK)),j0=Math.max(0,Math.floor((Math.min(a[1],b[1])-pad+ML_BO)/ML_BK)),j1=Math.floor((Math.max(a[1],b[1])+pad+ML_BO)/ML_BK);
    for(let j=j0;j<=j1;j++)for(let q=i0;q<=i1;q++){const key=j*ML_BN+q;let L=M.get(key);if(!L)M.set(key,L=[]);L.push(ln,i);}}};
  put(ML_IDX.river,0,ML_RIVER,ML_RVPAD);ML_TRAILS.forEach((t,n)=>put(ML_IDX.trail,n,t.pts,12));put(ML_IDX.creek,0,ML_CREEK,70);ML_ROADS.forEach((r,n)=>put(ML_IDX.road,n,r.pts,30));})();
function mlNear(M,lines,u,v,o){o.d=1e9;o.n=-1;const L=M.get(Math.floor((v+ML_BO)/ML_BK)*ML_BN+Math.floor((u+ML_BO)/ML_BK));if(!L)return o;
  for(let q=0;q<L.length;q+=2){const n=L[q],i=L[q+1],P=lines(n),a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],ll=ex*ex+ez*ez||1;let f=((u-a[0])*ex+(v-a[1])*ez)/ll;f=f<0?0:f>1?1:f;
    const dx=u-a[0]-ex*f,dz=v-a[1]-ez*f,d=dx*dx+dz*dz;if(d<o.d){o.d=d;o.n=n;o.i=i;o.f=f;}}
  o.d=Math.sqrt(o.d);return o;}
const ML_RV_F=n=>ML_RIVER,ML_TR_F=n=>ML_TRAILS[n].pts,ML_CK_F=n=>ML_CREEK,ML_RD_F=n=>ML_ROADS[n].pts;
/* ---------- the world's own ground: the land, and what is in it and built on it ---------- */
const MLRV={d:0,n:-1,i:0,f:0},MLTQ={d:0,n:-1,i:0,f:0},MLCQ={d:0,n:-1,i:0,f:0},MLRQ={d:0,n:-1,i:0,f:0};
function mlZone(u,v,o){
  mlLand(u,v,o);
  const e=ML_E(u,v),n2=vn(u/37,v/37,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5;
  let h=o.h,clay=o.clay,silt=o.silt,peat=o.peat,sand=o.sand,wl=ML_NONE,moist=o.moist,wood=o.wood,trk=0,ck=0,rv=0,rvD=1e9,rvW=0,rvS=0,slough=0,road=0,oxbow=0;
  /* COLD CREEK: its valley (a ravine through the breaks, a shallow one on the benches), its channel, its pools */
  mlCreekInit();mlNear(ML_IDX.creek,ML_CK_F,u,v,MLCQ);
  if(MLCQ.n>=0&&MLCQ.d<70){const C=ML_CREEK,i=MLCQ.i,f=MLCQ.f,s=C[i][2]+(C[i+1][2]-C[i][2])*f,B=MLCK.B[i]+(MLCK.B[i+1]-MLCK.B[i])*f,d=MLCQ.d,
      P=MLCK.P[MLCK.pi[f<.5?i:i+1]],hw=2.2+3.6*s/C[C.length-1][2],side=.13+.32*o.br+.2*o.wa;
    h=Math.min(h,B+.5+Math.max(0,d-hw)*side+.25*Math.max(0,d-hw-1)*0);
    if(d<hw*1.15){const sh=Math.max(0,1-(d/hw)*(d/hw)),al=sst(0,2,s-P.s0)*sst(0,3,P.s1-s),bed=Math.min(B+.15,P.wl-P.dep*sh*al-.04);
      h=Math.min(h,bed);if(d<hw*1.05)wl=P.wl;ck=1;}
    const bank=sst(hw+14,hw+1,d);sand=Math.max(sand,.65*sst(hw+1,hw-.5,d));silt=Math.max(silt,.6*bank*(1-sst(hw+1,hw-.5,d)));moist=Math.max(moist,.85-.4*sst(hw,hw+30,d));
    wood=Math.max(wood*(1-sst(hw+4,hw+1,d)),.7*sst(hw+2,hw+5,d)*sst(hw+16,hw+9,d)*sst(.4,.55,vn(s/30,1.7,975)));}
  /* THE OXBOW: a cut-off bend of the River, a crescent of still water 1.3 m deep over muck, firm sand on its east shore */
  {const r1=Math.hypot(u-2330,v+430),r2=Math.hypot(u-2286,v+392),m=Math.min(150-r1,r2-118)+4*n2;
    if(m>-16){const lv=ML_CL+.9,east=sst(2300,2400,u);
      if(m>0){h=Math.min(h,lv-.06-1.25*sst(0,24,m));wl=lv;oxbow=1;sand=Math.max(sand,.8*east*(1-sst(4,14,m)));silt=Math.max(silt,.7*sst(6,16,m));peat=Math.max(peat,.5*sst(10,20,m));moist=1;}
      else{h=Math.min(h,lv+.02+(h-lv)*sst(0,16,-m));moist=Math.max(moist,1-.5*sst(0,16,-m));sand=Math.max(sand,.6*east*sst(-14,-4,m));}
      wood*=sst(-6,-14,m)+(1-sst(-6,-14,m))*0;}}
  /* THE RIVER: its bed and its banks. x is across it (-1 its east bank, 1 its west, looking downstream: south) */
  mlNear(ML_IDX.river,ML_RV_F,u,v,MLRV);
  if(MLRV.n>=0){const P=ML_RIVER,a=P[MLRV.i],b=P[MLRV.i+1],f=MLRV.f,ex=b[0]-a[0],ez=b[1]-a[1];rvD=MLRV.d;
    rvW=(a[2]+(b[2]-a[2])*f)*(1+.12*(vn((a[6]+(b[6]-a[6])*f)/70,3,879)-.5));const ch=a[3]+(b[3]-a[3])*f,dp=a[4]+(b[4]-a[4])*f,soft=a[5]+(b[5]-a[5])*f;rvS=a[6]+(b[6]-a[6])*f;
    const rB=(ex*(v-a[1])-ez*(u-a[0])<0?-1:1)*rvD;
    if(rvD<rvW+90){const x=rB/rvW,ax=Math.abs(x);
      if(ax<1){let dep=dp*Math.pow(Math.max(0,1-ax*ax),.6),sf=soft,bar=0;
        if(ch>.01){const C=ML_CHAIN,sc=rvS-C.s0,pr=Math.max(0,Math.min(1,sc/C.len));
          /* THE BRAIDS: every 40 m down the River a bar right across it, 8 m of flat top just out of the water (one in three
             just under it), a gentle ramp each side, and between two bars a flat-bottomed pool, each a little deeper than the
             last (15 to 27 in), shallower toward the west bank. The bars lie in waves across the River, not ruled */
          const q=sc/C.P+.34*Math.sin(rB/36+1.3)+.22*(vn(rB/27,sc/160,881)-.5),k=Math.floor(q),tc=Math.abs(q-k-.5)*2,br=sst(.55,.8,tc),top=hs(k,7,882)<.34?-.05:.06,
            pd=(C.d0+(C.d1-C.d0)*pr)*(.92+.16*vn(sc/55,rB/30,883))*(.5+.5*sst(.75,-.05,x));
          let dc=pd*(1-br)-top*br;dc=dc*sst(1,.8,x)-.04*sst(.8,1,x);
          /* THE SLOUGHS: the east third of it, behind a low spit: soft dark silt; pools and bars in blotches */
          const sl=sst(-.42,-.58,x);
          if(sl>0){const m=vn(sc/36,rB/15,884),bk=sst(.4,.32,m),ds=(-.04-.1*sst(.36,.2,m))*bk+(.3+.62*sst(.36,.7,m))*(1-bk);dc=dc*(1-sl)+ds*sst(1,.9,ax)*sl;slough=sl;}
          bar=br*(1-sl);dep=dep*(1-ch)+dc*ch;sf=sf*(1-ch)+sl*ch;}
        h=Math.min(h,ML_CL-dep);wl=ML_CL;rv=1;
        const upB=sst(.02,.3,-dep);sand=Math.max(sand*(1-sf),1-sf);silt=Math.max(silt*(1-.5*(1-sf)),sf*.9);clay*=sf;peat=0;moist=Math.max(moist,1-.7*upB*(1-sf*.6));wood=0;}
      else{const dOut=(ax-1)*rvW;
        if(x<0){/* the east bank: a cut bank, cottonwoods along its top (something to winch to from the bank; nothing out on the bars) */
          if(dOut<5)h=Math.min(h,ML_CL+.04+(h-ML_CL)*sst(0,5,dOut));silt=Math.max(silt,.5*sst(22,4,dOut));
          wood=Math.max(wood,.75*sst(5,10,dOut)*sst(42,24,dOut)*sst(.38,.56,vn(rvS/42,1.5,885)));}
        else{/* the west bank: a beach easing up out of the water; cottonwoods back from it */
          if(dOut<14)h=Math.min(h,ML_CL+.03+(h-ML_CL)*sst(0,14,dOut));sand=Math.max(sand,sst(20,4,dOut));
          wood=Math.max(wood*sst(10,20,dOut),.7*sst(18,26,dOut)*sst(60,40,dOut)*sst(.4,.58,vn(rvS/42,4.5,886)));}
        if(dOut<1.2)wl=ML_CL;moist=Math.max(moist,1-.5*sst(0,16,dOut));}}}
  /* the trails: worn two-tracks a little below the ground round them, wetter (not through water: a ford is the water's bed) */
  mlNear(ML_IDX.trail,ML_TR_F,u,v,MLTQ);let trail=99;
  if(MLTQ.d<3.6&&!(wl>ML_NONE+1)){trail=MLTQ.d;const k=sst(3.6,1.6,MLTQ.d);h-=.14*k;moist=Math.min(1,moist+.12*k);}
  /* the mud holes: each a pool at its own level, the bed under it */
  for(const H of ML_HOLES){const x=u-H.u,z=v-H.v;if(Math.abs(x)>H.L+8||Math.abs(z)>H.L+8)continue;const cs=Math.cos(H.r),sn=Math.sin(H.r),a=(x*cs+z*sn)/H.L,b=(-x*sn+z*cs)/H.W,r=Math.hypot(a,b)+n3*.12;
    if(r<1.5){if(H.lv===null)H.lv=mlLandH(H.u,H.v)-.28;const k=sst(1.5,1,r);
      h=r<1?Math.min(h,H.lv-H.d*sst(1,.15,r)):h+(Math.max(H.lv+.12,Math.min(h,H.lv+.4))-h)*k;if(r<1)wl=H.lv;moist=Math.max(moist,1-.5*sst(1,1.5,r));clay=Math.max(clay,(H.c!==undefined?H.c:.35)*sst(1.5,1,r));wood*=1-k;}}
  /* River Camp: a pad of packed clay, level and dry */
  {const P=ML_PITS,r=Math.max(Math.abs(u-P.u)/P.a,Math.abs(v-P.v)/P.b);if(r<1.5){if(P.lv===null)P.lv=mlLandH(P.u,P.v)+.15;const k=sst(1.5,1,r),on=sst(1.05,.95,r);
      h=h+(P.lv-h)*k;clay=clay*(1-on)+.45*on;silt*=1-on;peat*=1-on;sand*=1-on;moist=moist*(1-k)+.16*k;wood*=1-k;trk=Math.max(trk,on);if(k>.5)wl=ML_NONE;}}
  /* THE GRADE: its lane laid to its own heights, flat across, packed dirt; the ground beside it cut or filled to meet it
     over 16 m; no trees within 12 m */
  mlNear(ML_IDX.road,ML_RD_F,u,v,MLRQ);
  /* (and in the bottoms no cottonwoods within 50 m of it: from River Camp you look west up the strip) */
  if(MLRQ.n>=0&&MLRQ.d<30+70*o.bot){const R=ML_ROADS[MLRQ.n],Y=mlRoadY(R),i=MLRQ.i,f=MLRQ.f,d=MLRQ.d,y=Y[i]+(Y[i+1]-Y[i])*f+.06*sst(R.hw,0,d);
    const k=sst(R.hw+16,R.hw+1.5,d),on=sst(R.hw+1.2,R.hw,d);h=h+(y-h)*k;if(k>.5&&wl>ML_NONE+1&&wl<h+.05)wl=ML_NONE;
    clay=clay*(1-on)+.35*on;silt*=1-on;peat*=1-on;sand*=1-on;moist=moist*(1-k)+.2*k;trk=Math.max(trk,on);road=on;wood*=sst(R.hw+6+44*o.bot,R.hw+12+50*o.bot,d);}
  /* the bank along the long sides and the ends: rising 6 m, grass */
  const bank=sst(724,752,e+n2*10);h+=6*bank;if(bank>.2)wl=ML_NONE;
  moist=Math.max(0,Math.min(1,moist));
  if(trail<4.5||wl>ML_NONE+1)wood=0;wood*=1-bank;
  const grass=(1-wood)*(1-sst(.3,.7,clay+sand+peat+silt))*(trail<99?sst(1.4,2.6,trail):1)*(wl>ML_NONE+1?0:1)*(.6+.4*sst(.15,.5,moist))*(1-trk)*(1-.6*o.br)*(1-.7*o.cliff);
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=wl;o.grass=Math.max(0,Math.min(1,grass));o.wood=wood;o.trail=trail;
  o.strip=0;o.stripD=99;o.trk=trk;o.jmp=0;o.isle=0;o.lake=0;o.lane=0;o.bogK=0;o.dc=rvD;
  o.rv=rv;o.rvD=rvD;o.rvW=rvW;o.rvS=rvS;o.slough=slough;o.ck=ck;o.road=road;o.oxbow=oxbow;return o;}
const MLZ={};
function mlBaseH(u,v){return mlZone(u,v,MLZ).h;}
function mlMat(u,v,o){mlZone(u,v,o);o.mud=Math.max(o.silt,o.peat);o.rock=0;
  o.code=o.wl>ML_NONE+1&&o.wl>o.h+.12?SF.water:(o.silt>.5||o.peat>.5)&&o.moist>.5?SF.mud:o.sand>.5?SF.sand:o.grass>.5?SF.grass:o.trail<2.5?SF.trail:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* the world's own ground every CM metres, rows j0 up to j1 of a layer M across whose corner is at (u0, v0): what the
   soil keeps for all of the world (src/ml-soil.js mlPrepStep), and the same packed for its two pictures on the graphics
   card. Here, inside the generator, so that background workers can make it as they make the land */
const ML_HF=new Float32Array(1),ML_HU=new Uint32Array(ML_HF.buffer);
function mlHalfW(v){ML_HF[0]=v;const x=ML_HU[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
function mlLayerRows(u0,v0,CM,M,j0,j1){const n=(j1-j0)*M,B=new Float32Array(n),Wl=new Float32Array(n),Mo=new Uint8Array(n),Ms=new Uint8Array(n*4),Gr=new Uint8Array(n),Wd=new Uint8Array(n),Tr=new Uint8Array(n),S0=new Uint16Array(n*4),S1=new Uint8Array(n*4),o={};
  for(let j=j0;j<j1;j++)for(let i=0;i<M;i++){const k=(j-j0)*M+i;mlZone(u0+(i+.5)*CM,v0+(j+.5)*CM,o);
    B[k]=o.h;Wl[k]=o.wl>-90?o.wl:o.h-1;Mo[k]=Math.round(o.moist*255);const w=[o.clay,o.silt,o.peat,o.sand];for(let c=0;c<4;c++)S1[k*4+c]=Ms[c*n+k]=Math.round(Math.max(0,Math.min(1,w[c]))*255);
    Gr[k]=Math.round(o.grass*255);Wd[k]=Math.round(o.wood*255);Tr[k]=o.trail<3.6?Math.round(255*(1-o.trail/3.6)):o.trk>.6?150:0;
    S0[k*4]=mlHalfW(B[k]);S0[k*4+1]=mlHalfW(Wl[k]);S0[k*4+2]=mlHalfW(Mo[k]/255);S0[k*4+3]=mlHalfW(Gr[k]>=Wd[k]?Gr[k]/255:-Wd[k]/255);}
  return {j0,j1,B,Wl,Mo,Ms,Gr,Wd,Tr,S0,S1};}
/* the country round it, out to the edge of the world: the strip's own rise east to west carried on out, and the valley's
   walls beyond its long sides (60 to 90 m over the strip, a few hundred metres out): the strip lies in a valley, and
   everything you look along it at has a skyline. Dry grass with bare patches (the engine paints out there itself) */
function mlOuter(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,uc=Math.max(-A.hx,Math.min(A.hx,u)),vc=Math.max(-A.hz,Math.min(A.hz,v)),sd=Math.max(0,Math.abs(v)-A.hz),ed=Math.max(0,Math.abs(u)-A.hx);
  let h=A.h0+ML_CL+mlProf(uc,vc)+6+.1*Math.min(sd,450)+45*sst(250,1300,sd)*(.6+.8*fbm(x/700,z/700,2,826))+(u>0?.02:.01)*Math.min(ed,1500);
  h+=3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5)+14*(fbm(x/260,z/260,3,827)-.5)*sst(100,500,Math.max(sd,ed));
  const bare=sst(.6,.72,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=ML_E(u,v)-A.old;
  if(e>A.m)mlOuter(x,z,o);
  else{const cu=Math.max(-A.hx,Math.min(A.hx,u)),cv=Math.max(-A.hz,Math.min(A.hz,v));mlMat(cu,cv,MLM);const h=A.h0+MLM.h;
    o.h=h;o.code=MLM.code===SF.water?SF.mud:MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;
    if(e>0){const g={};mlOuter(x,z,g);const f=sst(0,A.m,e),g0=Math.max(MLM.grass,MLM.sand*.8);o.h=h+(g.h-h)*f;o.grass=g0+(g.grass-g0)*f;o.sand=0;if(o.code===SF.sand)o.code=SF.grass;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}
/* the woods' trees, chunk by chunk (genStatic hands in its own addTree): a tree every 6 m or so where it's wooded,
   broadleaf mostly (cottonwoods, aspens), pines from the Wall up */
function mlTrees(x0,z0,x1,z1,addTree){
  const A=ML_A,S=6.2,o={};
  for(let z=Math.floor(z0/S)*S;z<z1;z+=S)for(let x=Math.floor(x0/S)*S;x<x1;x+=S){
    const jx=x+hs(Math.round(x),Math.round(z),861)*S,jz=z+hs(Math.round(x),Math.round(z),862)*S;if(jx<x0||jx>=x1||jz<z0||jz>=z1)continue;
    const u=jx-A.x,v=jz-A.z;if(ML_E(u,v)>A.old-20)continue;mlZone(u,v,o);
    if(o.wood<.05||hs(Math.round(jx*3),Math.round(jz*3),863)>o.wood*.95)continue;
    const pine=o.h>14&&hs(Math.round(jx),Math.round(jz),864)<.8,sc=.8+.55*hs(Math.round(jx*2),Math.round(jz*2),865);
    addTree(jx,jz,pine?3:hs(Math.round(jx),Math.round(jz),866)<.5?0:1,sc,1);}}
/* the place's name for the screen */
function mlPlace(u,v){const e=ML_E(u,v);if(e>752)return 'Outside';if(e>724)return 'The bank';
  const o=mlZone(u,v,{});
  if(Math.max(Math.abs(u-ML_PITS.u)/ML_PITS.a,Math.abs(v-ML_PITS.v)/ML_PITS.b)<1.1)return 'River Camp';
  if(o.road>.5)return 'The Grade';
  for(const H of ML_HOLES)if(Math.hypot(u-H.u,v-H.v)<H.L+3)return 'A mud hole';
  if(o.rvD<o.rvW+30)return o.slough>.5?'The Sloughs':o.rvS>ML_CHAIN.s0&&o.rvS<ML_CHAIN.s0+ML_CHAIN.len?'The Braids':'The River';
  if(o.oxbow||Math.hypot(u-2310,v+410)<165&&o.x<900)return 'The Oxbow';
  if(o.trail<3.6){mlNear(ML_IDX.trail,ML_TR_F,u,v,MLTQ);if(MLTQ.n>=0)return ML_TRAILS[MLTQ.n].name;}
  if(o.ck)return 'Cold Creek';
  if(o.butte>.5)return 'Lone Butte';if(Math.hypot(u-ML_LOOK.u,v-ML_LOOK.v)<90)return 'The Lookout';
  if(o.rimrock>.4)return 'The rimrock';if(o.rim>.5)return 'The Rim';
  if(o.wa>.5){const xw=o.x+mlWand(v,4);return xw>4150&&xw<4370?'The Shelf':'The Wall';}
  if(o.x<900)return 'The Bottoms';if(o.x<1700)return 'The Low Bench';if(o.x<2750)return 'The Breaks';return 'The High Bench';}
