/* =====================================================================================
   MUD LAB: THE SOIL (src/ml-soil.js, put in by src/build.py just before the boot). Mud Lab 4: the whole world
   (src/ml-world.js, 1,536 m square) is soil, kept every 8 cm: 19,200 x 19,200 cells in 64 x 64 squares of 5.12 m, each
   square made only when a tyre or a clod first touches it (the rest is still the world's own ground, so it costs
   nothing):
     rut    what's been done to it: down in the ruts, up in the berms and where clods land (metres)
     churn  how much it's been turned over: dark, moist, lumpy, less grip
     press  how hard a rolling tyre pressed it: smoother, a little darker, the tread's knobs
     comp   how packed it is: a tyre sinks until the soil bears its pressure, and packed soil bears more
     dir    which way the tyre was rolling (for the tread)
     wet    when it was last wetted by a wet tyre (the tracks dry over a minute and a half)
     spring (peat) how far it will spring back
     broken (peat) its moss mat broken through: soup underneath
   THE WORLD'S OWN GROUND, three ways: every 2.56 m for all of it (made while the title is up: height, water, moisture,
   the soils, sod and woods; the map is painted from it), every 64 cm in 41 m blocks made as the truck comes near
   (height, water, the trails' worn two-tracks), and the trails' ruts on top of that every 8 cm.
   EVERY SPOT IS A SOIL AND A MOISTURE (ML_SOIL: each soil dry and wet, in between by how wet it is; mixed where soils
   meet): the same loam hard and dusty on a ridge, soft at the foot of a slope, soup by the creek
     loam   firm red dirt
     clay   dry: hard as a road, cracked, dusty; wet: slick and sticky, it packs into the tread
     silt   dry: fine powder; wet: soupy, sinks deep, the ruts slump back and fill in, it splashes
     peat   spongy: springs part way back behind the tyre; spin or push too hard and the mat breaks through to soup
     sand   dry: loose, sprays and dusts; wet: firm until you spin it, then quicksand
     sod and the woods' floor on top: sod holds the ground together until it's torn, leaf litter is soft
   WATER where the world has it (the creek, the pond, the mud holes), each at its own flat level: drawn as a surface
   wherever the ground (ruts too) is under it, so ruts fill. Spray, a bow wave, drag on the tyres and the body, wet tyres
   that leave wet tracks.
   TWO KINDS OF GRIP (G, or the switch on the big map): GAME grip is the racing game's own grip for the surface, times
   the soil's; SOIL SCIENCE works it out the way off-road engineers do, from how strong the soil is (its cohesion and
   its friction angle) over the tyre's contact patch, which grows as the tyre sinks, and adds the work of pushing
   through it (more the deeper the tyre is in).
   THE PICTURE: the soil near the truck (122 m square, moving with it) on the graphics card with the ground's height
   every 8 cm; the world's ground every 2.56 m for all of it; a fine mesh under the truck (8 cm apart under it, out to
   30 m); the water.
   ===================================================================================== */
/* each soil, dry and wet. D: how far it sinks at the reference pressure (m); max: its floor (m); berm: share of what
   sinks squeezed up beside the tyre; dig: m dug a second per m/s of spin; roost: clods a second per m/s of spin; fling:
   clods a second per m/s of speed (wet soil peeling off the tread); dust: dry dust; grip: times the surface's own grip
   (game grip); slump: how fast its ruts flow back; spring: share of what sinks that springs back; size: its clods;
   c, phi: its cohesion (kPa) and friction angle (degrees), for soil science */
const ML_SOIL={
  loam:{dry:{D:.012,max:.06,berm:.12,dig:.004,roost:10,fling:0,dust:1.4,grip:1.05,slump:0,spring:0,size:.8,c:14,phi:34},
        wet:{D:.09,max:.3,berm:.25,dig:.016,roost:18,fling:.8,dust:0,grip:.82,slump:.15,spring:0,size:1.2,c:4,phi:20}},
  clay:{dry:{D:.006,max:.03,berm:.08,dig:.002,roost:5,fling:0,dust:.9,grip:1.08,slump:0,spring:0,size:.7,c:45,phi:28},
        wet:{D:.045,max:.3,berm:.35,dig:.008,roost:11,fling:1.1,dust:0,grip:.55,slump:0,spring:0,size:1.6,c:7,phi:5}},
  silt:{dry:{D:.03,max:.1,berm:.15,dig:.012,roost:8,fling:0,dust:1.6,grip:.95,slump:.2,spring:0,size:.5,c:6,phi:32},
        wet:{D:.22,max:.55,berm:.25,dig:.03,roost:7,fling:1.6,dust:0,grip:.8,slump:2.2,spring:0,size:.7,c:2,phi:10}},
  peat:{dry:{D:.06,max:.2,berm:.08,dig:.01,roost:8,fling:0,dust:.3,grip:.9,slump:0,spring:.5,size:1,c:8,phi:24},
        wet:{D:.1,max:.3,berm:.1,dig:.014,roost:9,fling:.6,dust:0,grip:.78,slump:0,spring:.6,size:1.1,c:4,phi:15}},
  sand:{dry:{D:.065,max:.24,berm:.5,dig:.02,roost:22,fling:0,dust:.45,grip:1,slump:.25,spring:0,size:.4,c:.5,phi:32},
        wet:{D:.025,max:.38,berm:.4,dig:.03,roost:14,fling:.5,dust:0,grip:1.08,slump:.6,spring:0,size:.6,c:3,phi:35}}};
const ML_KEYS=['D','max','berm','dig','roost','fling','dust','grip','slump','spring','size','c','phi'],ML_TYPES=['loam','clay','silt','peat','sand'];
const ML_SOUP={D:.22,max:.7};                 /* broken-through peat */
const ML_PREF=50000,ML_TAU=.06,ML_RHO=1000;
/* soil science's own numbers (regraded in Mud Lab 14, so the trails and the Bog grade as they do on game grip):
   mu, the soil's strength into grip, and cap, the most it can give: both times the grip this game's ground gives that
     surface (double on everything but sand: before, soil science's grip left that out, and had half the game's);
   rr, the work of pushing through soil the tyre has sunk into, as rolling drag on the wheel (the engine's own kind, so
     it holds a spinning wheel back as the game's mud does: before, it pulled on the body only, the wheels spun free
     and dug themselves in, and it was three times as strong);
   rv, how much of that again per m/s in wet soil (it is thick: it drags more the faster it's pushed);
   lf, the soil's stickiness counts only as far as the tyre is pressed into it (a tyre the water is half carrying has
     that much less hold): before, a SUV afloat in a deep pit had more grip on soil science than on game grip;
   L0, the length of tyre on the ground before it has sunk at all, m (it was .16: on slick wet clay a tyre that hadn't
     sunk yet had too little hold to climb out of a puddle's far side) */
const ML_T={mu:1.05,cap:1.1,rr:.12,rv:.5,lf:1,L0:.24};
const ML_SURFS=['grass','dirt','strip','trail','rock','mud','concrete','water','gravel','asphalt','ruts','sand'];
function mlWheelDrag(w,kr,kd){const a=w.__mlRR,b=w.__mlDG;if(!a||a.k===kr&&b.k===kd)return;a.k=kr;b.k=kd;for(const q of ML_SURFS){a[q]=kr;b[q]=kd;}}
/* (Mud Lab 19: the world is 3,072 m a side, four times the ground: WS, and with it N (8 cm cells across), NT (5.12 m
   squares across), NM (2.56 m cells across) and NB (41 m blocks across) are twice what they were. Its corner is where
   it was, so every cell, square and block of the first map has the place and the number it had) */
const MLS={ready:false,prep:0,C:.08,WS:3072,N:38400,T:64,NT:600,NW:1536,NM:1200,CM:2.56,BC:.64,BN:64,NB:75,x0:0,z0:0,h0:0,terra:false,
  tiles:null,ntile:0,blocks:new Map(),cB:null,cW:null,cMo:null,cM:null,cG:null,cWd:null,cTr:null,map:null,s0:null,s1:null,w0:null,w1:null,wc:[NaN,NaN],up:new Set(),act:new Map(),
  clock:0,lut:null,hb:null,db:null,col:{},stat:{dug:0,clods:0,landed:0,up:0,splash:0}};
const MLP={mesh:null,n:0,E:30,cx:0,cz:0,on:false,water:null};
/* half floats for the textures */
const ML_F=new Float32Array(1),ML_U=new Uint32Array(ML_F.buffer);
function mlHalf(v){ML_F[0]=v;const x=ML_U[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
/* (the soil's own clock: the game's time, so it stops in the menu and keeps step with the physics) */
const mlNow=()=>MLS.clock;
const sst=(a,b,x)=>{let t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
/* ---------- the world's own ground every 2.56 m (bilinear between) ---------- */
function mlC(a,x,z,sc){const M=MLS.NM,fx=Math.max(0,Math.min(M-1.001,(x-MLS.x0)/MLS.CM-.5)),fz=Math.max(0,Math.min(M-1.001,(z-MLS.z0)/MLS.CM-.5)),i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*M+i;
  return (a[k]+(a[k+1]-a[k])*ax+(a[k+M]-a[k])*az+(a[k]-a[k+1]-a[k+M]+a[k+M+1])*ax*az)*(sc||1);}
/* ---------- every 64 cm, in blocks of 41 m made as the truck comes near: height, water level, the trail's distance ---------- */
const MLZB={};
function mlBlock(bi,bj){const key=bj*MLS.NB+bi;let B=MLS.blocks.get(key);if(B)return B;
  const n=MLS.BN,A=WG.mlA,h=new Float32Array(n*n),wl=new Float32Array(n*n),td=new Float32Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;WG.mlZone(MLS.x0+(bi*n+i+.5)*MLS.BC-A.x,MLS.z0+(bj*n+j+.5)*MLS.BC-A.z,MLZB);h[k]=MLZB.h;wl[k]=MLZB.wl;td[k]=Math.min(4,MLZB.trail);}
  B={h,wl,td};MLS.blocks.set(key,B);return B;}
/* one 64 cm cell (across blocks) */
function mlBC(arr,i,j){const n=MLS.BN,bi=Math.floor(i/n),bj=Math.floor(j/n);if(bi<0||bj<0||bi>=MLS.NB||bj>=MLS.NB)return arr==='wl'?-99:0;const B=mlBlock(bi,bj);return B[arr][(j-bj*n)*n+(i-bi*n)];}
/* the trails' worn two-track: two ruts 9 cm deep, 1.72 m apart, a slight crown between */
const mlTrailRut=d=>d>=2.2?0:-.09*Math.exp(-Math.pow((d-.86)/.17,2))+.015*Math.exp(-d*d/.18);
const mlTrailRutD=d=>d>=2.2?0:.09*2*(d-.86)/(.17*.17)*Math.exp(-Math.pow((d-.86)/.17,2))-.015*2*d/.18*Math.exp(-d*d/.18);
/* the world's own ground at a point, 8 cm sharp: height (over h0), and its slope (out[0], out[1]) */
const MLBG=[0,0];let ML_TR=0;
function mlBase(x,z,g){const C=MLS.BC,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5,i=Math.floor(fx),j=Math.floor(fz),ax=fx-i,az=fz-j,n=MLS.BN,bi=Math.floor(i/n),bj=Math.floor(j/n);
  let a,b,c,d,ta,tb,tc,td;
  if(i-bi*n<n-1&&j-bj*n<n-1&&bi>=0&&bj>=0&&bi<MLS.NB&&bj<MLS.NB){const B=mlBlock(bi,bj),k=(j-bj*n)*n+(i-bi*n);a=B.h[k];b=B.h[k+1];c=B.h[k+n];d=B.h[k+n+1];ta=B.td[k];tb=B.td[k+1];tc=B.td[k+n];td=B.td[k+n+1];}
  else{a=mlBC('h',i,j);b=mlBC('h',i+1,j);c=mlBC('h',i,j+1);d=mlBC('h',i+1,j+1);ta=mlBC('td',i,j);tb=mlBC('td',i+1,j);tc=mlBC('td',i,j+1);td=mlBC('td',i+1,j+1);}
  const x2=a-b-c+d,t2=ta-tb-tc+td,t=ta+(tb-ta)*ax+(tc-ta)*az+t2*ax*az,r=mlTrailRut(t);ML_TR=r;
  if(g){const rd=mlTrailRutD(t);g[0]=((b-a)+x2*az)/C+rd*((tb-ta)+t2*az)/C;g[1]=((c-a)+x2*ax)/C+rd*((tc-ta)+t2*ax)/C;}
  return a+(b-a)*ax+(c-a)*az+x2*ax*az+r;}
/* the trail's ruts alone at a point (for the picture) */
function mlTrailAt(x,z){const C=MLS.BC,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5,i=Math.floor(fx),j=Math.floor(fz),ax=fx-i,az=fz-j;
  const ta=mlBC('td',i,j),tb=mlBC('td',i+1,j),tc=mlBC('td',i,j+1),td=mlBC('td',i+1,j+1);return mlTrailRut(ta+(tb-ta)*ax+(tc-ta)*az+(ta-tb-tc+td)*ax*az);}
/* the water's level at a point (over h0; -99 none): the highest of the four 64 cm cells round it (water lies flat) */
function mlWL(x,z){const C=MLS.BC,i=Math.floor((x-MLS.x0)/C-.5),j=Math.floor((z-MLS.z0)/C-.5);return Math.max(mlBC('wl',i,j),mlBC('wl',i+1,j),mlBC('wl',i,j+1),mlBC('wl',i+1,j+1));}
/* what's under a point: the soils' weights (loam is what's left), its moisture, the sod and the woods, the water */
const MLW={};
function mlWeights(x,z,o){const M=MLS.NM,M2=M*M,fx=Math.max(0,Math.min(M-1.001,(x-MLS.x0)/MLS.CM-.5)),fz=Math.max(0,Math.min(M-1.001,(z-MLS.z0)/MLS.CM-.5)),i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*M+i;
  const g=(A,q)=>(A[q]+(A[q+1]-A[q])*ax+(A[q+M]-A[q])*az+(A[q]-A[q+1]-A[q+M]+A[q+M+1])*ax*az)/255;
  o.clay=g(MLS.cM,k);o.silt=g(MLS.cM,M2+k);o.peat=g(MLS.cM,2*M2+k);o.sand=g(MLS.cM,3*M2+k);o.grass=g(MLS.cG,k);o.wood=g(MLS.cWd,k);o.moist=g(MLS.cMo,k);o.wl=mlWL(x,z);
  const t=o.clay+o.silt+o.peat+o.sand;if(t>1){const f=1/t;o.clay*=f;o.silt*=f;o.peat*=f;o.sand*=f;}o.loam=Math.max(0,1-Math.min(1,t));return o;}
/* the soil's numbers where a tyre is: each soil's, dry to wet by the moisture, mixed by how much of each there is; sod
   holds it together (stiffer, stronger) until it's torn, leaf litter softens it */
const MLK={};
function mlParams(W,wetter){const o=MLK,m=sst(.12,.88,Math.min(1,W.moist+(wetter||0)));for(const k of ML_KEYS)o[k]=0;
  let best='loam',bw=-1;
  for(const s of ML_TYPES){const w=W[s];if(w>bw){bw=w;best=s;}if(w<=0)continue;const P=ML_SOIL[s];for(const k of ML_KEYS)o[k]+=(P.dry[k]+(P.wet[k]-P.dry[k])*m)*w;}
  const sod=W.grass||0,lit=W.wood||0;o.D*=1-.45*sod+.25*lit;o.max*=1-.35*sod;o.c+=sod*(10-5*m)-lit*2;o.roost*=1-.3*sod;o.dust*=1-.6*sod-.8*lit;
  o.main=best;o.m=m;return o;}
/* ---------- the soil's squares ---------- */
function mlTile(ti,tj,make){const q=tj*MLS.NT+ti;let t=MLS.tiles[q];
  if(!t&&make){const n=MLS.T*MLS.T;t=MLS.tiles[q]={ti,tj,r:new Float32Array(n),ch:new Uint8Array(n),pr:new Uint8Array(n),cp:new Uint8Array(n),fl:new Uint8Array(n),
    dr:new Uint8Array(n*2).fill(128),wt:new Float32Array(n).fill(-9999),sp:null};MLS.ntile++;}return t;}
function mlRut(i,j){if(i<0||j<0||i>=MLS.N||j>=MLS.N)return 0;const t=MLS.tiles[(j>>6)*MLS.NT+(i>>6)];return t?t.r[((j&63)<<6)|(i&63)]:0;}
function mlDirtyT(t){MLS.up.add(t.tj*MLS.NT+t.ti);}
/* ---------- the world's ground every 2.56 m: made a slice at a time while the title is up (or all at once if START
   comes first), then its textures, its map and its water ---------- */
/* (Mud Lab 19) The layer is filled in bands of 48 rows. Background workers (mlPrepWorkers) take bands from the top;
   the page's own thread takes them from the bottom, a few rows at a time inside the time it is given (most of each
   tick while the title is up, a little once you are driving), so there is always headway whatever the workers do, and
   on a phone with cores to spare it is done in a fraction of the time. MLS.pb: each band 0 free, 1 being made, 2 done */
const ML_BAND=48;
function mlPrepStep(ms){
  if(MLS.prep>=2||!WG.mlA)return MLS.prep>=2;const A=WG.mlA,M=MLS.NM,M2=M*M;
  if(!MLS.cB){MLS.h0=WG.mlLevel();MLS.x0=A.x+A.cu-MLS.WS/2;MLS.z0=A.z+A.cv-MLS.WS/2;MLS.cB=new Float32Array(M2);MLS.cW=new Float32Array(M2);MLS.cMo=new Uint8Array(M2);MLS.cM=new Uint8Array(M2*4);
    MLS.cG=new Uint8Array(M2);MLS.cWd=new Uint8Array(M2);MLS.cTr=new Uint8Array(M2);MLS.S0=new Uint16Array(M2*4);MLS.S1=new Uint8Array(M2*4);
    MLS.pb=new Uint8Array(Math.ceil(M/ML_BAND));MLS.pleft=MLS.pb.length;MLS.pm=null;MLS.pt0=performance.now();MLS.pmine=0;mlPrepWorkers();}
  const t0=performance.now(),PB=MLS.pb,all=ms>1e8;
  /* (a worker that has had a band for 20 s has stopped: its band is free again) */
  if(MLS.pw)for(const w of MLS.pw)if(w.b>=0&&t0-w.t>20000){if(PB[w.b]===1)PB[w.b]=0;w.b=-1;w.dead=true;try{w.terminate();}catch(_){}}
  while(MLS.pleft>0&&(all||performance.now()-t0<ms)){
    if(!MLS.pm){let b=PB.length-1;while(b>=0&&PB[b])b--;
      /* (asked to finish it all now, START pressed with the workers still at it: their bands too) */
      if(b<0&&all){b=PB.length-1;while(b>=0&&PB[b]!==1)b--;}
      if(b<0)break;PB[b]=1;MLS.pm={b,j:b*ML_BAND,j1:Math.min(M,(b+1)*ML_BAND)};}
    const m=MLS.pm,j=m.j;m.j=Math.min(m.j1,j+4);mlPrepTake(WG.mlLayerRows(MLS.x0-A.x,MLS.z0-A.z,MLS.CM,M,j,m.j));
    if(m.j>=m.j1){if(PB[m.b]!==2){PB[m.b]=2;MLS.pleft--;MLS.pmine++;}MLS.pm=null;}}
  if(MLS.pleft<=0){MLS.prep=2;MLS.pms=performance.now()-MLS.pt0;if(MLS.pw){for(const w of MLS.pw)try{w.terminate();}catch(_){}MLS.pw=null;}mlPaintMap();}return MLS.prep>=2;}
/* (some rows, from a worker or from here, into the world's layer) */
function mlPrepTake(r){const M=MLS.NM,M2=M*M,n=(r.j1-r.j0)*M,o=r.j0*M;MLS.cB.set(r.B,o);MLS.cW.set(r.Wl,o);MLS.cMo.set(r.Mo,o);MLS.cG.set(r.Gr,o);MLS.cWd.set(r.Wd,o);MLS.cTr.set(r.Tr,o);
  for(let c=0;c<4;c++)MLS.cM.set(r.Ms.subarray(c*n,(c+1)*n),c*M2+o);MLS.S0.set(r.S0,o*4);MLS.S1.set(r.S1,o*4);}
/* the workers: up to three (cores left for the page and the land's own worker), each with the world's generator, as the
   land's worker has. None if they can't be made (or the page's address ends #noworker): the page's own thread does it all */
function mlPrepWorkers(){MLS.pw=null;MLS.pwn=0;if(/noworker/.test(location.hash))return;
  const A=WG.mlA,M=MLS.NM,PB=MLS.pb,nW=Math.max(1,Math.min(3,(navigator.hardwareConcurrency||4)-2)),src=WORLDGEN.toString()+'\nconst G=WORLDGEN('+WSEED+');\n'+
    'onmessage=e=>{const q=e.data,r=G.mlLayerRows(q.u0,q.v0,q.CM,q.M,q.j0,q.j1);r.b=q.b;postMessage(r,[r.B.buffer,r.Wl.buffer,r.Mo.buffer,r.Ms.buffer,r.Gr.buffer,r.Wd.buffer,r.Tr.buffer,r.S0.buffer,r.S1.buffer]);};';
  const L=[],give=w=>{w.b=-1;if(MLS.prep>=2||w.dead)return;let b=0;while(b<PB.length&&PB[b])b++;if(b>=PB.length)return;PB[b]=1;w.b=b;w.t=performance.now();w.postMessage({b,u0:MLS.x0-A.x,v0:MLS.z0-A.z,CM:MLS.CM,M,j0:b*ML_BAND,j1:Math.min(M,(b+1)*ML_BAND)});};
  try{const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
    for(let q=0;q<nW;q++){const w=new Worker(url);w.b=-1;
      w.onmessage=e=>{const r=e.data;if(MLS.prep>=2)return;if(PB[r.b]!==2){mlPrepTake(r);PB[r.b]=2;MLS.pleft--;}give(w);};
      w.onerror=e=>{console.warn('soil prep worker failed; its rows on the main thread',e&&e.message);if(w.b>=0&&PB[w.b]===1)PB[w.b]=0;w.b=-1;w.dead=true;};L.push(w);}
    MLS.pw=L;MLS.pwn=nW;for(const w of L)give(w);}
  catch(e){for(const w of L)try{w.terminate();}catch(_){}MLS.pw=null;MLS.pwn=0;}}
/* lay the world out on the graphics card (the first time the truck drives) */
function mlInit(){
  /* (Mud Lab 19: START with the layer not finished. With workers at it, up to two and a half seconds are given for
     them and this thread to finish it between frames: until then there is no soil, the SUV stands on the land's own
     ground as it does outside the world. Then, or without workers, it is finished here and now, as it always was) */
  if(MLS.ready||!WG.mlA)return;const t0=performance.now();
  if(!mlPrepStep(0)){if(MLS.pw&&MLS.pw.some(w=>!w.dead)&&t0-(MLS.pwait||(MLS.pwait=t0))<2500){if(!mlPrepStep(12))return;}else while(!mlPrepStep(1e9));}
  MLS.tiles=new Array(MLS.NT*MLS.NT).fill(null);
  const M=MLS.NM,M2=M*M,s0=MLS.S0,s1=MLS.S1;MLS.S0=MLS.S1=null;
  const mk=(u,f)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,f);return t;};
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  MLS.s0=mk(ML_U0+2,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,M,M,0,gl.RGBA,gl.HALF_FLOAT,s0);
  MLS.s1=mk(ML_U0+3,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,M,M,0,gl.RGBA,gl.UNSIGNED_BYTE,s1);
  /* the soil near the truck: 1536 x 1536 cells, wrapping round as the truck moves: (rut, churn, press, wet) and (the
     ground's own height every 8 cm, the tread's heading, the trails' ruts) */
  const NW=MLS.NW;MLS.w0=mk(ML_U0,gl.REPEAT);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA16F,NW,NW);MLS.w1=mk(ML_U0+1,gl.REPEAT);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA16F,NW,NW);
  const T=MLS.T,n=T*T;MLS.lut=new Uint16Array(256);for(let q=0;q<256;q++)MLS.lut[q]=mlHalf(q/255);MLS.dlut=new Uint16Array(256);for(let q=0;q<256;q++)MLS.dlut[q]=mlHalf((q-127.5)/127);
  MLS.hb=new Uint16Array(n*4);MLS.db=new Uint16Array(n*4);MLS.nw=mlHalf(-9999);
  mlBindUnits();
  /* the clods' and the dust's colours: his ground pictures' own means (linear), darker where it's turned and wet */
  const mean=(t,d)=>{const L=typeof TEXPACK!=='undefined'&&TEXPACK.layers.find(l=>l.t===t&&l.has);return L?L.m.slice(0,3):d;};
  const dm=mean('DIRT',[.30,.17,.09]),mm=mean('MUD',[.12,.08,.05]),sm=mean('SAND',[.55,.32,.15]),gm=mean('GRASS',[.15,.15,.06]);
  MLS.col={loam:dm.map(v=>v*.55),clay:[.2,.165,.12],silt:mm.map(v=>v*.8),peat:[.045,.033,.022],sand:sm.map(v=>v*.85),
    dustloam:dm.map(v=>Math.min(1,v*1.35+.06)),dustclay:[.42,.36,.29],dustsilt:[.45,.4,.33],dustpeat:[.2,.16,.12],dustsand:sm.map(v=>Math.min(1,v*1.15+.05)),water:[.3,.25,.18]};
  mlPatchBuild();mlWaterBuild();
  MLS.ready=true;MLS.ms=performance.now()-t0;
}
/* the patch: a grid that follows the truck, a vertex every 8 cm under it, spreading out to 30 m (x = a u + b u^3) */
function mlPatchBuild(){
  const n=GFX.level==='mobile'?160:GFX.level==='low'?192:256,h=n/2,E=MLP.E,A=MLS.C*h,B=E-A,nv=(n+1)*(n+1);
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*4),M=new Float32Array(nv).fill(40),I=[];
  const w=q=>{const u=q/h-1;return A*u+B*u*u*u;};
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const k=j*(n+1)+i;P[k*3]=w(i);P[k*3+1]=0;P[k*3+2]=w(j);N[k*3+1]=1;C[k*4+3]=1;}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+1,r=p+n+1,s=r+1;I.push(p,s,q,p,r,s);}
  if(MLP.mesh&&MLP.mesh.vao)gl.deleteVertexArray(MLP.mesh.vao);
  MLP.mesh=makeMesh({pos:P,nrm:N,col:C,mat:M,idx:nv<65536?new Uint16Array(I):new Uint32Array(I)});MLP.mesh.tris=I.length/3;MLP.n=n;MLP.lvl=GFX.level;
}
/* ---------- (Mud Lab 22.3 water) THE RIPPLES ARE WORKED OUT, NOT DRAWN ----------
   His words, 15 Nov 2026: "simulating the bow wake. If instead of doing these lines coming off of it, we tried to
   simulate the water rippling effect ... if you're pushing through the water, you're making ripples, and you're
   pushing forward, the ripples are stacking up on top of each other in front of the truck and getting stretched out
   behind the truck and propagating away from the side of the truck ... It doesn't matter the orientation of the
   truck, it's the direction the truck is moving through the water. So if we're just simulating the solid body of the
   truck, the solid body of the tires ... it's going to ripple at the same speed no matter what speed you're going.
   The faster you're going means those ripples get taller and tighter together because the ripples are still
   rippling."
   Builds 22 to 22.2 DREW a wake: a V of crests laid along the path each tyre and the body had taken, their shape
   written down by hand. Now the water's surface round the SUV is a sheet of points 28 m square (a point every 25 cm
   on the phone's tier, 22 on Low, 17.5 above) and each point's height is WORKED OUT, many times a second, from its
   four neighbours' (the wave equation: a point higher than its neighbours is pulled down, and overshoots). Nothing
   says where a crest should be.
   - WHAT MAKES RIPPLES is the solid shapes in the water, by where they are now and where they were a moment ago:
     each tyre's foot (as long as its waterline, as wide as its tread) and the body below the waterline once the
     water is over the sills. Water a shape moves into is pushed up, by the depth the shape takes up; water it has
     just left is drawn down. So a shape pushes a hump ahead of the way it MOVES, whichever way it points, leaves a
     hollow behind, and a faster one moves more water each moment: taller.
   - HOW FAST THEY TRAVEL is the water's own doing and nothing else's: sqrt(9.81 x depth) (1.7 m/s in a foot of
     water, 3.1 in 3 ft), for each point from the depth of the water at it. The SUV's speed is no part of it. So
     ahead of a wading SUV the ripples it keeps making pile up close together, behind it they are drawn out, and
     off its sides they spread away; faster than the ripples travel, they cannot get ahead at all and fold back into
     a V with a steep wave at the nose. Ripples slow and bunch as the water shallows, and turn back from a bank.
   - A spinning tyre works the water (its foot is taken as swelling and shrinking as it churns): rings.
   - Dry ground, water at another level, and a rut that had no water in it before it was dug (below) are no part of
     the sheet: nothing ripples there.
   The sheet goes with the SUV you are in, a little behind it at speed (5 m at 30 mph: a wake lies behind), in whole
   steps of its own grid, so the water never slides under the points. Its edge soaks ripples up.
   WHAT IS DRAWN: the sheet, 5 mm under the level water and lifted by each point's height PLUS how big the ripples
   round that point have lately been (e: so a trough still stands clear of the level water, and the level water
   under it is hidden; where the water is calm the sheet is under and not drawn). Each point carries its slope (the
   light), its height (crests paler, troughs darker) and its foam: foam comes where a shape parts the water fast
   and where a wave has got too steep to stand, stays where it is on the water, and is gone in a second or two.
   The spray (the fan, the mist, the splash, the drips: 22.1 and 22.2) is as it was, off the same tyres and body.
   Nothing of the physics reads any of it and no dice are rolled.
   h height, v how fast it is rising, e how big the ripples there have lately been, f foam, c the water's wave speed
   squared over the grid's step squared (0: no water to ripple), dm what is left of v after a step (the edge soaks
   it up), m the same as c at every other point (worked out once as the sheet moves over new water), oa and ob how
   much of each point a solid shape takes up, this moment and the last (la, lb: which points) */
const MLRP={n:0,dx:.25,ox:0,oz:0,lv:-99,on:false,lvl:'',h:null,v:null,e:null,f:null,c:null,dm:null,m:null,oa:null,ob:null,la:[],lb:[],flip:0,col:null,uv:null,mesh:null,dirty:false,acc:0,quiet:9,px:0,pz:0,ph:[0,0,0,0],peak:0,j0:1,j1:0,u0:1,u1:0};
const ML_RPDT=1/90;
function mlRpMake(){const R=MLRP,n=GFX.level==='mobile'?112:GFX.level==='low'?128:160,dx=28/n,nn=n*n;
  R.n=n;R.dx=dx;for(const k of ['h','v','e','f','c','dm','oa','ob'])R[k]=new Float32Array(nn);R.m=new Float32Array((n>>1)*(n>>1));R.col=new Float32Array(nn*4);R.uv=new Float32Array(nn*2);R.la=[];R.lb=[];
  const P=new Float32Array(nn*3),N=new Float32Array(nn*3),M=new Float32Array(nn).fill(50),I=[];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i,b=Math.min(i,j,n-1-i,n-1-j),sp=b<10?(10-b)/10:0;P[k*3]=i*dx;P[k*3+2]=j*dx;N[k*3+1]=1;R.col[k*4+3]=1;R.dm[k]=Math.max(0,1-ML_RPDT*(.5+9*sp*sp));}
  for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){const p=j*n+i,q=p+1,r=p+n,s=r+1;I.push(p,s,q,p,r,s);}
  if(R.mesh)freeMesh(R.mesh);R.mesh=makeMesh({pos:P,nrm:N,col:R.col,mat:M,uv:R.uv,idx:new Uint16Array(I)});R.mesh.tris=I.length/3;R.lvl=GFX.level;R.on=false;R.quiet=9;R.peak=0;}
/* (the sheet has moved si, sj points over the water: what each point held goes with the water) */
function mlRpShift(A,n,si,sj,fill,st){const w=n*(st||1);si*=st||1;
  if(sj>0)for(let j=0;j<n;j++){const s=j+sj;if(s<n)A.copyWithin(j*w,s*w,s*w+w);else A.fill(fill,j*w,j*w+w);}
  else if(sj<0)for(let j=n-1;j>=0;j--){const s=j+sj;if(s>=0)A.copyWithin(j*w,s*w,s*w+w);else A.fill(fill,j*w,j*w+w);}
  if(si>0)for(let j=0;j<n;j++){const o=j*w;A.copyWithin(o,o+si,o+w);A.fill(fill,o+w-si,o+w);}
  else if(si<0)for(let j=0;j<n;j++){const o=j*w;A.copyWithin(o-si,o,o+w+si);A.fill(fill,o,o-si);}}
/* (is there water to ripple at this point, and how fast do ripples go in it: water at the sheet's own level, over
   ground that was under it before any rut was dug) */
function mlRpMask(a,b){const R=MLRP,x=R.ox+(a*2+.5)*R.dx,z=R.oz+(b*2+.5)*R.dx,wl=mlWL(x,z);if(wl<-90||Math.abs(wl-R.lv)>.01)return 0;
  const d=R.lv-mlBase(x,z);return d>.02?9.81*Math.min(1.3,Math.max(.06,d))/(R.dx*R.dx):0;}
function mlRpPlace(cx,cz){const R=MLRP,n=R.n,hn=n>>1,dx=R.dx,s=2*dx,ox=Math.round((cx-n*dx/2)/s)*s,oz=Math.round((cz-n*dx/2)/s)*s;
  const si=R.on?Math.round((ox-R.ox)/dx):n,sj=R.on?Math.round((oz-R.oz)/dx):n;if(!si&&!sj)return;R.ox=ox;R.oz=oz;
  if(Math.abs(si)>=n||Math.abs(sj)>=n){for(const k of ['h','v','e','f','oa','ob','col','uv'])R[k].fill(0);R.la.length=0;R.lb.length=0;R.m.fill(-1);}
  else{for(const k of ['h','v','e','f','oa','ob'])mlRpShift(R[k],n,si,sj,0);mlRpShift(R.m,hn,si>>1,sj>>1,-1);
    /* (and what is sent to the graphics card for each point) */
    mlRpShift(R.col,n,si,sj,0,4);mlRpShift(R.uv,n,si,sj,0,2);
    for(const L of [R.la,R.lb]){let w=0;for(let q=0;q<L.length;q++){const k=L[q],i=k%n-si,j=((k/n)|0)-sj;if(i>=0&&j>=0&&i<n&&j<n)L[w++]=j*n+i;}L.length=w;}}
  const m=R.m,c=R.c,h=R.h,v=R.v;for(let b=0;b<hn;b++)for(let a=0;a<hn;a++){const q=b*hn+a;if(m[q]<0)m[q]=mlRpMask(a,b);const val=m[q],k=b*2*n+a*2;c[k]=c[k+1]=c[k+n]=c[k+n+1]=val;
    if(val<=0){h[k]=h[k+1]=h[k+n]=h[k+n+1]=0;v[k]=v[k+1]=v[k+n]=v[k+n+1]=0;}}
  {const col=R.col;for(let k=3,e=n*n*4;k<e;k+=4)col[k]=1;}R.u0=0;R.u1=n-1;R.dirty=true;
  /* (the rows with ripples on them go with the water too; a sheet laid afresh has none) */
  if(Math.abs(si)>=n||Math.abs(sj)>=n){R.j0=1;R.j1=0;}else{R.j0=Math.max(1,R.j0-sj);R.j1=Math.min(n-2,R.j1-sj);}
  R.on=true;}
/* (a solid shape in the water: how much of each point it takes up, as depth: a box hl long and hw wide each way from
   cx, cz, lying along ax, az, ds deep, its edges soft over one step of the grid) */
function mlRpBox(O,L,cx,cz,ax,az,hl,hw,ds){const R=MLRP,n=R.n,dx=R.dx,r=Math.hypot(hl,hw)+dx,i0=Math.max(1,Math.floor((cx-r-R.ox)/dx)),i1=Math.min(n-2,Math.ceil((cx+r-R.ox)/dx)),j0=Math.max(1,Math.floor((cz-r-R.oz)/dx)),j1=Math.min(n-2,Math.ceil((cz+r-R.oz)/dx));
  for(let j=j0;j<=j1;j++){const pz=R.oz+j*dx-cz;for(let i=i0;i<=i1;i++){const px=R.ox+i*dx-cx,ca=(hl+dx*.5-Math.abs(px*ax+pz*az))/dx,cb=(hw+dx*.5-Math.abs(pz*ax-px*az))/dx;if(ca<=0||cb<=0)continue;
    const k=j*n+i;if(O[k]===0)L.push(k);O[k]+=ds*(ca>1?1:ca)*(cb>1?1:cb);}}
  mlRpRows(j0-2,j1+2);}
/* (these rows of the sheet have something on them) */
function mlRpRows(a,b){const R=MLRP,n=R.n;a=Math.max(1,a);b=Math.min(n-2,b);if(R.j0>R.j1){R.j0=a;R.j1=b;}else{if(a<R.j0)R.j0=a;if(b>R.j1)R.j1=b;}}
/* (a knock on the water at a point: a spinning or creeping tyre's rings, the air coming up off a drowned SUV, a splash) */
function mlRpPoke(x,z,a){const R=MLRP;if(!R.on)return;const n=R.n,i=Math.round((x-R.ox)/R.dx),j=Math.round((z-R.oz)/R.dx);if(i<2||j<2||i>n-3||j>n-3)return;
  const k=j*n+i,h=R.h,c=R.c,q=.035*a;if(c[k]>0)h[k]+=q;for(const o of [1,-1,n,-n])if(c[k+o]>0)h[k+o]+=q*.5;R.quiet=0;mlRpRows(j-3,j+3);}
/* one moment of it, for the SUV you are in: nw tyres (where and how deep: MLWK.tx, tz, td), going U; its body lying
   along fx, fz with deep of water over its sills; air: all of it clear of the water */
function mlRipple(dt,t,nw,U,fx,fz,deep,air){const R=MLRP;if(R.lvl!==GFX.level)mlRpMake();
  const p=t.p,v=t.v,TX=MLWK.tx,TZ=MLWK.tz,TD=MLWK.td,now=MLS.clock,body=deep>.02&&!air,o=mlrLive();
  let wet=body;for(let q=0;q<nw;q++)if(TD[q]>.03)wet=true;
  let owet=false;if(o&&o!==t)for(const w of o.wheels)if(w.contact&&now-(w.mlWdT||-9)<.05&&(w.mlWdE||0)>.03)owet=true;
  const was=R.on;
  if(!R.on){if(!(wet||owet)||MLWK.lv<-90)return;R.lv=MLWK.lv;R.quiet=0;}
  else if(wet&&Math.abs(MLWK.lv-R.lv)>.01){R.on=false;R.lv=MLWK.lv;R.quiet=0;}
  {const lead=Math.min(U,14)/14*5,un=U>.5?1/U:0;mlRpPlace(p[0]-v[0]*un*lead,p[2]-v[2]*un*lead);}
  /* the shapes, now (a tyre: six tenths of the water its foot stands in, most of it going round a narrow shape; all of
     it at speed, when there is no time to; less of it once the tyre is right under) */
  const O=R.flip?R.ob:R.oa,L=R.flip?R.lb:R.la,Op=R.flip?R.oa:R.ob,Lp=R.flip?R.la:R.lb;for(let q=0;q<L.length;q++)O[L[q]]=0;L.length=0;R.flip^=1;
  for(let q=0;q<nw;q++){const wd=TD[q];if(wd<=.03)continue;const w=t.wheels[q],wf=Math.hypot(w.f[0],w.f[2])||1,d=Math.min(wd,w.R),ch=Math.sqrt(Math.max(0,w.R*w.R-(w.R-d)*(w.R-d))),hw=(w.front?t.c.tyreW:t.c.tyreWR||t.c.tyreW||.28)/2;
    const spin=Math.abs(w.w*w.R-w.vl);R.ph[q]+=dt*(14+Math.min(spin,10));mlRpBox(O,L,TX[q],TZ[q],w.f[0]/wf,w.f[2]/wf,Math.max(.12,ch),hw,(.6+.4*sst(4,12,U))*Math.min(wd,.35)*(1-.6*sst(.35,.8,wd))+.02*Math.min(1,spin/6)*Math.sin(R.ph[q]));}
  /* (the body: what is over its sills, and a share of what is under them: axles, engine and tyres fill much of that) */
  if(body)mlRpBox(O,L,p[0],p[2],fx,fz,t.__mlHx||2.3,t.__mlHz||1,1.6*Math.min(.6,deep+.12));
  if(owet)for(const w of o.wheels)if(w.contact&&(w.mlWdE||0)>.03){const wf=Math.hypot(w.f[0],w.f[2])||1;mlRpBox(O,L,w.cp[0],w.cp[2],w.f[0]/wf,w.f[2]/wf,.3,.16,.6*Math.min(w.mlWdE,.35));}
  /* (Mud Lab 22.4: and the other SUV's body, as the one you are in) */
  if(owet){let wd=0;for(const w of o.wheels)if(w.contact)wd=Math.max(wd,w.mlWdE||0);const dp=wd-(o.__mlClr===undefined?.557:o.__mlClr),m=o.M,l=Math.hypot(m[0],m[6])||1;if(dp>.02)mlRpBox(O,L,o.p[0],o.p[2],m[0]/l,m[6]/l,2.3,1,1.6*Math.min(.6,dp+.12));}
  /* what they have moved into is pushed up, what they have left drawn down (not for a SUV set down from somewhere
     else, nor the moment the sheet is first laid: that is not water being pushed) */
  const jump=!was||Math.hypot(p[0]-R.px,p[2]-R.pz)>3;R.px=p[0];R.pz=p[2];let moved=0;
  /* (AT SPEED THE WATER IS THROWN ASIDE. Worked out as above, a fast shape's push and the hollow it leaves all but
     cancel: it is gone from a point a thirtieth of a second after it came, before a ripple has gone anywhere. Water a
     fast tyre parts does not sit on its nose: it is flung out to the sides and lands there. So what a shape pushes up
     goes down to each side of the way the SUV is going (three quarters of it each side: thrown water lands in a heap), as far out as 6 cm for every m/s (nothing at a wade, a
     metre at 37 mph, 1.2 m at most), and the hollow stays in its track: a trough with a ridge either side, which the
     water then makes a wake of) */
  if(!jump){const h=R.h,c=R.c,f=R.f,n=R.n,G=.6,kf=sst(2,9,U)*2.5+(body?sst(1,3.5,U)*.5:0),th=U>.5?Math.min(1.2,U*.06)/R.dx:0,oi=th?Math.round(-v[2]/U*th):0,oj=th?Math.round(v[0]/U*th):0;
    for(let q=0;q<L.length;q++){const k=L[q];if(c[k]<=0)continue;let d=O[k]-Op[k];d=d>.2?.2:d<-.2?-.2:d;moved+=d<0?-d:d;
      if(d>0&&(oi||oj)){const i=k%n,j=(k/n)|0;for(let sd=-1;sd<=1;sd+=2){const a=i+oi*sd,b=j+oj*sd,kk=a>0&&b>0&&a<n-1&&b<n-1&&c[b*n+a]>0?b*n+a:k;h[kk]+=G*d*.75;if(kf>0){const g=f[kk]+d*kf*2;f[kk]=g>.75?.75:g;}}}
      else{h[k]+=G*d;if(kf>0){const g=f[k]+(d<0?-d:d)*kf;f[k]=g>.6?.6:g;}}}
    for(let q=0;q<Lp.length;q++){const k=Lp[q];if(O[k]!==0||c[k]<=0)continue;let d=Op[k];d=d>.2?.2:d;h[k]-=G*d;moved+=d;if(kf>0){const g=f[k]+d*kf;f[k]=g>.6?.6:g;}}}
  if(moved>1e-4)R.quiet=0;
  /* (still water, with nothing moving in it: nothing to work out, and the sheet is not drawn) */
  if(R.quiet>1.5){if(!wet&&!owet)R.on=false;return;}
  /* the water's own moments */
  R.acc+=dt;let ns=0;const n=R.n,nn=n*n,h=R.h,vv=R.v,c=R.c,dm=R.dm;
  /* (Mud Lab 22.4: only the rows of the sheet that have ripples on them, and three either side for them to spread into:
     j0 to j1. A SUV wading has them over a third of the sheet; nothing is lost, the rest is still water) */
  const ja=R.j0,jb=R.j1;if(ja>jb){R.acc=0;if(moved<=1e-4)R.quiet+=dt;return;}
  while(R.acc>=ML_RPDT&&ns<4){R.acc-=ML_RPDT;ns++;
    for(let j=ja;j<=jb;j++){let k=j*n+1;for(let i=1;i<n-1;i++,k++){const ck=c[k];if(ck<=0)continue;const hk=h[k];
      vv[k]=(vv[k]+ck*ML_RPDT*((c[k-1]>0?h[k-1]:hk)+(c[k+1]>0?h[k+1]:hk)+(c[k-n]>0?h[k-n]:hk)+(c[k+n]>0?h[k+n]:hk)-4*hk))*dm[k];}}
    for(let k=ja*n,e=(jb+1)*n;k<e;k++)h[k]+=vv[k]*ML_RPDT;}
  if(R.acc>ML_RPDT)R.acc=0;if(!ns)return;
  /* what each point is drawn with: its lift, its height, its slope, its foam */
  const e=R.e,f=R.f,col=R.col,uv=R.uv,T=ns*ML_RPDT,i2=.5/R.dx,kd=Math.max(0,1-T*1.1),kf=Math.max(0,1-T/1.3),dl=R.dx*R.dx/9.81*.7;let mx=0,na=n,nb=0;
  for(let j=ja;j<=jb;j++){let k=j*n+1,rm=0;for(let i=1;i<n-1;i++,k++){const ck=c[k],k2=k*2,k4=k*4;
    if(ck<=0){e[k]*=kd;uv[k2]=0;uv[k2+1]=0;col[k4]=0;col[k4+1]=0;col[k4+2]=0;continue;}
    let hk=h[k];const lim=ck*dl,top=.08+lim*.6;if(hk<-lim){hk=h[k]=-lim;if(vv[k]<0)vv[k]=0;}else if(hk>top){hk=h[k]=top;if(vv[k]>0)vv[k]=0;}
    hk=h[k]=hk+.02*(.25*(h[k-1]+h[k+1]+h[k-n]+h[k+n])-hk);
    const ah=hk<0?-hk:hk;let ek=(e[k]*.6+.1*(e[k-1]+e[k+1]+e[k-n]+e[k+n]))*kd;if(ek<ah*1.15)ek=ah*1.15;e[k]=ek;if(ek>rm)rm=ek;
    const sx=(h[k+1]-h[k-1])*i2,sz=(h[k+n]-h[k-n])*i2,sl=Math.sqrt(sx*sx+sz*sz);let fk=(f[k]*.8+.05*(f[k-1]+f[k+1]+f[k-n]+f[k+n]))*kf;
    /* (Mud Lab 22.4: foam from a quarter of a slope where the water stands high, as on the face of the swell at a
       wading SUV's nose; and a wave too steep to stand, .45, breaks: eased toward its neighbours, with more foam) */
    if(sl>.25&&hk>.03){fk+=T*2.5*(sl-.25)*(hk>.1?1:hk*10);if(fk>1)fk=1;}
    if(sl>.45){fk+=T*3*(sl-.45);if(fk>1)fk=1;h[k]=hk+=.3*(.25*(h[k-1]+h[k+1]+h[k-n]+h[k+n])-hk);vv[k]*=.8;}f[k]=fk;
    uv[k2]=ek+hk;uv[k2+1]=hk;col[k4]=sx;col[k4+1]=sz;col[k4+2]=fk;}
    if(rm>mx)mx=rm;if(rm>2e-4){if(j<na)na=j;if(j>nb)nb=j;}}
  /* (these rows are what is sent to the graphics card; the rows with ripples on them, for the next moment) */
  if(R.u0>R.u1){R.u0=ja;R.u1=jb;}else{if(ja<R.u0)R.u0=ja;if(jb>R.u1)R.u1=jb;}
  if(na>nb){R.j0=1;R.j1=0;}else{R.j0=Math.max(1,na-3);R.j1=Math.min(n-2,nb+3);}
  R.peak=mx;R.dirty=true;if(mx<.002&&moved<=1e-4)R.quiet+=dt;else R.quiet=0;}
/* (Mud Lab 22.3 water) A RUT DUG DOWN TO THE WATER FILLS; IT DOES NOT BURST. His words, 15 Nov 2026: "when you make a
   rut nearby a body of water ... the splashing happens like very suddenly, but the water would fill the rut after you
   made it. It wouldn't explode out of it unless you hit a rut that was already there."
   Water stands wherever the ground is under a water's level, so the moment a tyre dug a rut below it the rut was
   full: the tyre was "in water", and threw its spray, its splash and its waves. Now every spot of ground remembers
   when it was first dug below the water (T.ft, set by mlStamp). For 0.3 s after, there is no water there at all; over
   the next 2.2 s it comes up, as if the water stood 30 cm lower and rose (the deepest of the rut first: the picture
   does the same, src/ml-look.glsl, from the same number sent with the soil's own picture, mlUpload). A rut filled
   long ago is water like any other, and a tyre that hits it at speed splashes.
   mlStand: how deep the water STANDS at a point, by that rule. What a tyre is taken to be in, for everything that is
   seen (its spray, splash, mist, rings and ripples), is the water standing half a metre AHEAD of it the way the SUV is
   going: the water that was there before it came, not the water in the rut it is making. The physics still goes by
   the ground and the water's level as it always did (the drag, the lift, the grip are untouched) */
function mlStand(x,z){const wl=mlWL(x,z);if(wl<-90)return 0;const i=((x-MLS.x0)/MLS.C)|0,j=((z-MLS.z0)/MLS.C)|0;let d=wl-mlBase(x,z)-mlRut(i,j);if(d<=0)return 0;
  if(i>=0&&j>=0&&i<MLS.N&&j<MLS.N){const t=MLS.tiles[(j>>6)*MLS.NT+(i>>6)];if(t&&t.ft){const age=MLS.clock-t.ft[((j&63)<<6)|(i&63)];if(age>=0&&age<2.6)d-=.3*(1-Math.min(1,Math.max(0,(age-.3)/2.2)));}}
  return d>0?d:0;}
/* (the squares of soil with a rut still filling are sent to the graphics card again each frame until it has, and once more after) */
function mlFillTick(){const F=MLS.fill;if(!F||!F.size)return;const now=MLS.clock;for(const q of F){const t=MLS.tiles[q];if(!t||now<t.fillT||now-t.fillT>2.8)F.delete(q);if(t)MLS.up.add(q);}}
/* the water: a flat surface at each water's own level, in 2.56 m squares over wherever there's water (the ground hides
   it wherever it stands higher) */
function mlWaterBuild(){
  /* (Mud Lab 19: a strip for each run of cells at one level along a row, in place of a square for every cell: the
     River and the Lake would have been 60,000 more triangles in every frame; this way all the world's water is a few
     thousand) */
  const NM=MLS.NM,P=[],I=[];let nv=0;const step=MLS.CM;
  for(let j=0;j<NM-1;j++){let a0=0,rl=-99;const z0=MLS.z0+j*step;
    for(let i=0;i<NM;i++){let lv=-99;
      if(i<NM-1)for(let b=0;b<=1;b++)for(let a=0;a<=1;a++){const k=(j+b)*NM+i+a,w=MLS.cW[k];if(w>MLS.cB[k]-.6)lv=Math.max(lv,w);}
      if(lv===rl)continue;
      if(rl>-90){const xa=MLS.x0+a0*step,xb=MLS.x0+(i+1)*step;for(const [x,dz] of [[xa,0],[xb,0],[xa,step*2],[xb,step*2]])P.push(x-WG.mlA.x,rl,z0+dz-WG.mlA.z);I.push(nv,nv+3,nv+1,nv,nv+2,nv+3);nv+=4;}
      a0=i;rl=lv;}}
  if(!nv){MLP.water=null;return;}
  const pos=new Float32Array(P),nrm=new Float32Array(nv*3),col=new Float32Array(nv*4),mat=new Float32Array(nv).fill(50);
  for(let k=0;k<nv;k++){nrm[k*3+1]=1;col[k*4]=.07;col[k*4+1]=.055;col[k*4+2]=.035;col[k*4+3]=1;}
  MLP.water=makeMesh({pos,nrm,col,mat,idx:nv<65536?new Uint16Array(I):new Uint32Array(I)});MLP.water.tris=I.length/3;}
/* ---------- the ground under a point, inside the world: the soil's own height and slope, its surface ---------- */
const ML_IN=2,MLG={};
/* (Mud Lab 18, from Ground Truth's rollover fix by way of the packet of 13 Nov) the land's own slope under a point,
   against a direction: the ground the soil lies on, without the ruts, berms and clods the soil has at 8 cm. For the
   wheels' "has the truck rolled onto its side?" (src/build.py): read off the soil itself, a rut's wall counted as a
   truck on its side. Not a number outside the soil's square (the engine's own ground is asked there) */
const ML_BU=[0,0];
function mlBroadUp(x,z,U){
  if(!MLS.ready||MLS.off)return NaN;
  const N=MLS.N,C=MLS.C,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5;
  if(fx<ML_IN||fz<ML_IN||fx>N-1-ML_IN||fz>N-1-ML_IN)return NaN;
  mlBase(x,z,ML_BU);return (U[1]-ML_BU[0]*U[0]-ML_BU[1]*U[2])/Math.hypot(ML_BU[0],1,ML_BU[1]);}
function mlGround(x,z,o){
  if(MLS.off)return false;
  const N=MLS.N,C=MLS.C,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5;
  if(fx<ML_IN||fz<ML_IN||fx>N-1-ML_IN||fz>N-1-ML_IN)return false;
  const i=fx|0,j=fz|0,ax=fx-i,az=fz-j,a=mlRut(i,j),b=mlRut(i+1,j),c=mlRut(i,j+1),d=mlRut(i+1,j+1),x2=a-b-c+d;
  const base=mlBase(x,z,MLBG),gx=((b-a)+x2*az)/C+MLBG[0],gz=((c-a)+x2*ax)/C+MLBG[1],l=hyp3(gx,1,gz),y=a+(b-a)*ax+(c-a)*az+x2*ax*az+base;
  o.y=MLS.h0+y;o.n[0]=-gx/l;o.n[1]=1/l;o.n[2]=-gz/l;
  /* the surface for the engine's grip, sound and dirt: the soil's (wet soft soils as mud, turned loam as the ruts),
     deep water as water */
  mlWeights(x,z,MLG);const t=MLS.tiles[(j>>6)*MLS.NT+(i>>6)],ch=t?t.ch[((j&63)<<6)|(i&63)]:0,wd=MLG.wl-y,soft=MLG.silt+MLG.peat+MLG.clay;
  o.surf=wd>.2?'water':soft>.5&&MLG.moist>.45?'mud':MLG.sand>.5?'sand':MLG.grass>.5&&ch<130?'grass':ch>130?(MLG.moist>.55?'mud':'ruts'):MLG.moist<.3&&soft<.5?'dirt':'dirt';
  return true;}

const ML_BK=[],ML_BW=[],ML_BT=[];
function mlStamp(t,w,dt,S,W){
  const C=MLS.C,N=MLS.N,cp=w.cp,now=mlNow();
  let ux=w.f[0],uz=w.f[2];const fl=Math.hypot(ux,uz)||1;ux/=fl;uz/=fl;const rx=-uz,rz=ux;
  /* (aired down: the patch longer and a little wider, so the same weight presses less and sinks less) */
  const A=t.mlAir,R=w.R,hw=(w.front?t.c.tyreW:t.c.tyreWR)*.5*(A?A.kW:1),hl=Math.min(.24,.1+R*.12)*(A?A.kL:1),bw=.2,ext=hw+bw;
  w.mlFz=w.mlFz===undefined?w.Fz:w.mlFz+(w.Fz-w.mlFz)*Math.min(1,dt/.12);const pn=w.mlFz/(4*hw*hl)/ML_PREF,slip=w.w*R-w.vl,aslip=Math.abs(slip),spin=Math.max(0,aslip-.35);
  const p=t.p,v=t.v,Wv=t.w,ry=cp[1]-p[1],qx=cp[0]-p[0],qz=cp[2]-p[2],vx=v[0]+(Wv[1]*qz-Wv[2]*ry),vz=v[2]+(Wv[0]*ry-Wv[1]*qx),vlat=vx*rx+vz*rz,side=Math.max(0,Math.abs(vlat)-.6)*Math.sign(vlat);
  const Hc=cp[1]-MLS.h0,rad=Math.hypot(hl,ext)+C;
  const i0=Math.max(2,Math.floor((cp[0]-rad-MLS.x0)/C)),i1=Math.min(N-3,Math.ceil((cp[0]+rad-MLS.x0)/C)),j0=Math.max(2,Math.floor((cp[2]-rad-MLS.z0)/C)),j1=Math.min(N-3,Math.ceil((cp[2]+rad-MLS.z0)/C));
  if(i0>i1||j0>j1)return 0;
  let sunk=0,plough=0,dug=0,bwSum=0;ML_BK.length=ML_BW.length=ML_BT.length=0;
  const th2=2*Math.atan2(uz,ux),hc2=Math.round(127.5+127*Math.cos(th2)),hs2=Math.round(127.5+127*Math.sin(th2));
  /* wet sand goes soft as it's churned; the wet tyre's track */
  const sinkK=dt/ML_TAU,dig=S.dig*spin*dt,sl=Math.abs(side),wetT=w.mlWet>.05?now-(1-w.mlWet)*90:-9999,liq=W.sand*sst(.4,.8,W.moist),peat=W.peat,touched=new Set();
  for(let j=j0;j<=j1;j++){const pz=MLS.z0+(j+.5)*C-cp[2];
    for(let i=i0;i<=i1;i++){const px=MLS.x0+(i+.5)*C-cp[0],a=px*ux+pz*uz,b=px*rx+pz*rz,ab=Math.abs(b),aa=Math.abs(a);
      if(aa>hl||ab>ext)continue;const T=mlTile(i>>6,j>>6,true),k=((j&63)<<6)|(i&63);
      if(ab>hw){const q=(ab-hw)/bw,wt=(q<.35?q/.35:(1-q)/.65)*(1-aa/hl*.5)*(side?(Math.sign(b)===Math.sign(side)?1+2.5*Math.min(1,sl):Math.max(.15,1-sl)):1);
        ML_BT.push(T);ML_BK.push(k);ML_BW.push(wt);bwSum+=wt;continue;}
      touched.add(T);
      const cur=mlBase(MLS.x0+(i+.5)*C,MLS.z0+(j+.5)*C)+T.r[k],ty=Hc+R-Math.sqrt(R*R-a*a)+Math.max(0,ab-(hw-.045))*.6;let nh=cur;
      const broken=T.fl[k]&1,D=broken?ML_SOUP.D:S.D*(1+4*liq*T.ch[k]/255),mx=broken?ML_SOUP.max:S.max;
      if(nh>ty){const cut=nh-ty;sunk+=cut;T.cp[k]=Math.min(255,T.cp[k]+cut/D*100);nh=ty;}
      const touch=cur-ty>-.015,cm=T.cp[k]*.01;
      let dz=touch?Math.min(.6*dt,Math.max(0,pn-Math.pow(cm,1.6))*D*sinkK):0,dd=touch||cur-ty>-.05?dig*(1-ab/hw*.45)*(broken?1.6:1):0;
      const sc=touch&&sl>0?S.dig*.35*sl*dt:0;
      const floor=-mx;if(T.r[k]+(nh-cur)-dz-dd-sc<floor){const room=Math.max(0,T.r[k]+(nh-cur)-floor),tot=dz+dd+sc||1;dz*=room/tot;dd*=room/tot;}
      nh-=dz+dd+sc;sunk+=dz;dug+=dd;plough+=sc;
      if(dz>0){T.cp[k]=Math.min(255,T.cp[k]+dz/D*100);
        /* (peat: part of it only bends, and comes back once the tyre has gone) */
        if(S.spring>0){if(!T.sp)T.sp=new Float32Array(MLS.T*MLS.T);T.sp[k]+=dz*S.spring;}}
      if(dd>0){T.cp[k]=Math.max(0,T.cp[k]-dd/D*60);T.ch[k]=Math.min(255,T.ch[k]+40+dd*9000);
        /* (peat: spun through, the mat breaks and there's soup under it) */
        if(peat>.45&&T.r[k]+(nh-cur)<-.08)T.fl[k]|=1;}
      else if(touch&&aslip>.15)T.ch[k]=Math.min(255,T.ch[k]+aslip*dt*300);
      if(touch){T.pr[k]=Math.max(T.pr[k],T.ch[k]>120?120:220);if(aslip<1.2){T.dr[k*2]=hc2;T.dr[k*2+1]=hs2;}if(wetT>T.wt[k])T.wt[k]=wetT;}
      T.r[k]+=nh-cur;mlDirtyT(T);
      /* (Mud Lab 22.3: first dug below the water's level: its water comes up from now, mlStand) */
      if(W.wl>-90&&nh<W.wl-.005&&cur>=W.wl-.005){if(!T.ft)T.ft=new Float32Array(MLS.T*MLS.T).fill(-9999);T.ft[k]=now;T.fillT=now;(MLS.fill||(MLS.fill=new Set())).add(T.tj*MLS.NT+T.ti);}
    }}
  /* the berms: what was scraped aside, and the soil's share of what sank */
  const up=plough+sunk*S.berm;
  if(up>0&&bwSum>0){const kk=up/bwSum;for(let q=0;q<ML_BK.length;q++){const T=ML_BT[q],k=ML_BK[q],wt=ML_BW[q];T.r[k]+=kk*wt;T.ch[k]=Math.min(255,T.ch[k]+wt*(10+up*400));mlDirtyT(T);}}
  /* soft soils keep moving after the tyre: slumping silt and sand, springing peat */
  if(S.slump>0||S.spring>0||peat>.3)for(const T of touched)MLS.act.set(T,mlNow()+9);
  MLS.stat.dug+=dug*C*C;return dug*C*C;
}
/* ---------- the soft soils moving on their own: silt and wet sand slump back into their ruts, peat springs back ---------- */
function mlSettle(dt){
  const now=mlNow(),L=[];for(const [T,until] of MLS.act){if(L.length>=5)break;L.push(T);}
  for(const T of L){const until=MLS.act.get(T);MLS.act.delete(T);if(now<until)MLS.act.set(T,until);
    /* (each square settles by the time since it last did: a few squares a frame, round and round) */
    const dd=Math.min(.12,now-(T.st||now-dt));T.st=now;const r=T.r,x0=T.ti*64,z0=T.tj*64,W=MLW;
    mlWeights(MLS.x0+(x0+32)*MLS.C,MLS.z0+(z0+32)*MLS.C,W);const P=mlParams(W),ks=Math.min(.22,dd*P.slump*2);
    if(ks>.001||T.fl.some(f=>f&1)){for(let j=0;j<64;j++)for(let i=0;i<64;i++){const k=(j<<6)|i,gi=x0+i,gj=z0+j;
      const kk=T.fl[k]&1?Math.min(.22,dd*3):ks;if(kk<=.001)continue;
      const nb=(i>0?r[k-1]:mlRut(gi-1,gj))+(i<63?r[k+1]:mlRut(gi+1,gj))+(j>0?r[k-64]:mlRut(gi,gj-1))+(j<63?r[k+64]:mlRut(gi,gj+1));
      r[k]+=(nb*.25-r[k])*kk;}}
    if(T.sp){const kr=1-Math.exp(-dd/.35);for(let k=0;k<4096;k++){const s=T.sp[k];if(s>1e-5){const q=s*kr;r[k]+=q;T.sp[k]-=q;}}}
    mlDirtyT(T);}
}
/* ---------- what each tyre throws ---------- */
function mlThrow(t,w,dt,S,W,wd){
  const R=w.R,cp=w.cp,n=w.n,wr=w.w*R,awr=Math.abs(wr),s=wr>=0?1:-1,slip=wr-w.vl,spin=Math.max(0,Math.abs(slip)-.35),K=LOOK.dust,soil=S.main;
  let ux=w.f[0],uy=w.f[1],uz=w.f[2];const fl=hyp3(ux,uy,uz)||1;ux/=fl;uy/=fl;uz/=fl;const rx=w.r[0],ry=w.r[1],rz=w.r[2];
  const hub=[cp[0]+n[0]*R,cp[1]+n[1]*R,cp[2]+n[2]*R],v=t.v,cap=fxCap(),col=MLS.col[soil]||MLS.col.loam,soupy=soil==='silt'||soil==='peat'&&W.peat>.6;
  const clod=(th,k,dep,kind)=>{if(FX.length>=cap)return;const sn=Math.sin(th),cs=Math.cos(th),sp=Math.min(awr,11)*k;
    const px=hub[0]+R*(-s*ux*sn-n[0]*cs),py=hub[1]+R*(-s*uy*sn-n[1]*cs),pz=hub[2]+R*(-s*uz*sn-n[2]*cs),lat=(Math.random()-.5)*.38*sp;
    /* (Mud Lab 15: a wet soil's clods are as dark as the ground they came out of, and drawn at two thirds the size
       (what they carry and where they land is as it was): they flew as pale boulders) */
    const r0=Math.random(),sz=(.012+.05*r0*r0)*S.size,b=(.82+Math.random()*.32)*(kind==='water'?1:1-.45*(S.m||0)),c=kind==='water'?MLS.col.water:col;
    FX.push({kind:kind||'mud',x:px,y:py,z:pz,vx:v[0]+sp*(-s*ux*cs+n[0]*sn)+rx*lat+(Math.random()-.5)*.6,vy:v[1]+sp*(-s*uy*cs+n[1]*sn)+ry*lat+Math.random()*.5,vz:v[2]+sp*(-s*uz*cs+n[2]*sn)+rz*lat+(Math.random()-.5)*.6,
      s:kind==='water'?sz*1.4:sz*.66,s0:sz,life:kind==='water'?1.4:3,max:3,r:c[0]*b,g:c[1]*b,b:c[2]*b,yaw:Math.random()*TAU,vol:dep&&kind!=='water'?4.19*sz*sz*sz*.55:0,soil,dusty:S.dust>.3,ml:1});MLS.stat.clods++;};
  /* roost: off the tread just behind the contact, back and up at the tread's speed (soupy soil as splashes) */
  const nr=fxCount(S.roost*spin*K*dt);for(let q=0;q<nr;q++)clod(.15+Math.random()*.8,.5+Math.random()*.5,true,soupy&&Math.random()<.6?'water':'mud');
  /* at speed in wet soil, it peels off the back of the tyre and arcs up */
  if(S.fling&&awr>2){const nf=fxCount(S.fling*Math.min(awr,25)*K*dt);for(let q=0;q<nf;q++)clod(.9+Math.random()*.8,.25+Math.random()*.45,false,soupy?'water':'mud');}
  /* in water: spray off the tyre, sideways and back, more the deeper and the faster */
  if(wd>.015){const sp=Math.abs(w.vl)+spin,ns=fxCount(Math.min(1,wd/.25)*(sp*6+spin*4)*K*dt);
    /* (Mud Lab 22.3: off a tyre in a rut the water has not come up in yet, the drops are rolled for and counted as ever, so
       the game's dice are what they were, and are of no size: not seen) */
    const vis=(w.mlWdE||0)>.015?1:0;
    for(let q=0;q<ns&&FX.length<cap;q++){const sd=(Math.random()<.5?-1:1),k=.25+Math.random()*.5,up=1.2+Math.random()*2.2+sp*.12;
      FX.push({kind:'water',x:cp[0]+rx*sd*.2,y:cp[1]+Math.min(wd,.3),z:cp[2]+rz*sd*.2,vx:v[0]*.6+rx*sd*sp*k-s*ux*spin*.4,vy:up,vz:v[2]*.6+rz*sd*sp*k-s*uz*spin*.4,
        s:(.03+Math.random()*.05)*vis,s0:.04*vis,life:1.2,max:1.2,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});MLS.stat.splash++;}}
  /* dry soil: dust behind the tyre */
  if(S.dust>.05&&wd<-.05){const sp=Math.hypot(v[0],v[2]),nd=fxCount(S.dust*(Math.max(0,Math.abs(slip)-.8)*1.6+Math.max(0,sp-3)*.3)*K*dt),dc=MLS.col['dust'+soil]||MLS.col.dustloam;
    for(let q=0;q<nd&&FX.length<cap;q++){const back=-s*(.15+Math.random()*.25),k=Math.min(6,Math.abs(slip))*.3;
      FX.push({kind:'dust',x:cp[0]+ux*back+(Math.random()-.5)*.4,y:cp[1]+.12,z:cp[2]+uz*back+(Math.random()-.5)*.4,vx:v[0]*.3-s*ux*k+(Math.random()-.5)*.8,vy:.35+Math.random()*.7,vz:v[2]*.3-s*uz*k+(Math.random()-.5)*.8,
        s:.14+Math.random()*.12,s0:.14+Math.random()*.12,life:1.6+Math.random()*1.2,max:2.8,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}}
}
/* a thrown clod lands: a little more soil where it falls (a soft lump), turned over; true when it's taken in. In water
   it just sinks */
function mlLand(p){
  /* (Mud Lab 22.4: a clod that comes down in standing water knocks it, by its size: a ring) */
  if(MLRP.on&&mlStand(p.x,p.z)>.03)mlRpPoke(p.x,p.z,Math.min(1.5,.35+(p.s0||.03)*14));
  if(!MLS.ready)return false;const N=MLS.N,C=MLS.C,fi=(p.x-MLS.x0)/C-.5,fj=(p.z-MLS.z0)/C-.5;
  if(fi<3||fj<3||fi>N-4||fj>N-4)return false;
  if(mlWL(p.x,p.z)>mlBase(p.x,p.z)+mlRut(fi|0,fj|0)+.02){MLS.stat.landed++;return true;}
  const r=Math.max(C*1.1,p.s0*1.6),rc=Math.ceil(r/C),ci=Math.round(fi),cj=Math.round(fj);let sw=0;
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2<1)sw+=1-d2;}
  if(sw<=0)return false;const hk=p.vol/(sw*C*C);
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2>=1)continue;const gi=ci+i,gj=cj+j,T=mlTile(gi>>6,gj>>6,true),k=((gj&63)<<6)|(gi&63),wt=1-d2;
    T.r[k]+=hk*wt;T.ch[k]=Math.min(255,T.ch[k]+150*wt+40);T.cp[k]=Math.max(0,T.cp[k]-30*wt);mlDirtyT(T);}
  if(p.dusty&&p.s0>.02&&FX.length<fxCap()&&Math.random()<.6){const dc=MLS.col['dust'+p.soil]||MLS.col.dustloam,sz=p.s0*3;
    FX.push({kind:'dust',x:p.x,y:p.y+.05,z:p.z,vx:p.vx*.15,vy:.3,vz:p.vz*.15,s:sz,s0:sz,life:.9+Math.random()*.6,max:1.5,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}
  MLS.stat.landed++;return true;}
/* (Mud Lab 16, 22.3) a knock on the water: a tyre in standing water gives one for every 70 cm it moves (or would have
   moved: a spinning tyre counts), no more than nine a second between all the tyres; the air off a drowned SUV; a
   splash. Until Mud Lab 22.3 each was a ring drawn by the water's shader; now each is a push on the worked-out
   water (mlRpPoke), and the rings are what the water does with it. Nothing of the physics reads them and no dice are
   rolled */
const MLWK={t:-9,n:0,R:[],tx:[0,0,0,0],tz:[0,0,0,0],td:[0,0,0,0],fx:[],lv:-99,dripT:-9,dripK:0,nm:0};
function mlWake(x,z,a,c){MLWK.t=MLS.clock;MLWK.n++;mlRpPoke(x,z,a);}
/* ---------- (Mud Lab 22, 22.3) WHAT EACH TYRE AND THE BODY IS DOING IN THE WATER ----------
   (Mud Lab 22 laid a drawn wave along the path each of these took; Mud Lab 22.3 works the ripples out, above, and
   what is kept here is what the spray goes by.) Six of them: tyres 0 to 3, the body 4, and 5 the other SUV while it
   is on the physics. Each: where its leading edge is now (x, z), the way it is going (ux, uz), w0 half its width
   across that way, c the water's own wave speed there, k how strongly it is parting the water (0 to 1, easing in
   and out), on: it is in the water (a tyre that hops clear for under a quarter second is still in) */
for(let q=0;q<6;q++)MLWK.R.push({x:0,z:0,w0:.2,sp:1,c:1,k:0,on:false,seen:-9,ux:1,uz:0,qx:0,qz:0,qt:-9});
let ML_WD=2463534242;const mlWDice=()=>{ML_WD^=ML_WD<<13;ML_WD^=ML_WD>>>17;ML_WD^=ML_WD<<5;return (ML_WD>>>8)/16777216;};
/* one of them, one step: wet (it is cutting the water now), its leading edge at hx, hz, going U m/s; c the water's own
   wave speed there; w0 half its width across the way it goes; S how strong */
function mlWkStep(R,dt,wet,hx,hz,U,c,w0,S){const now=MLS.clock;
  /* (a clock put back, as the picture tool does before each view) */
  if(now<R.seen){R.seen=-9;R.on=false;R.k=0;R.qt=-9;}
  if(wet)R.seen=now;const on=wet||(R.on&&now-R.seen<.25);
  R.k+=((wet?S:0)-R.k)*Math.min(1,dt*(wet?5:9));
  if(on){if(!R.on||Math.hypot(hx-R.x,hz-R.z)>2.5)R.k=0;R.x=hx;R.z=hz;R.w0=w0;R.sp=Math.max(c,.36*U);R.c=c;}
  R.on=on;}
/* (Mud Lab 22.1 water) HOW STRONG A WAVE IS, BY HOW FAST THE THING CUTTING THE WATER GOES. Build 22's were full
   strength from 7 mph. Now a wave at a crawl is the gentle one it should be (under half strength at 7 mph: ripples,
   no foam), and it builds on to full by about 27 mph: the shader's foam goes by the strength squared, so foam is
   something speed makes. (The body's own wave is full from 6 mph: water deep enough to reach the body holds
   the SUV to a wade, and a wade is when it pushes its biggest wave) */
const mlWkS=U=>sst(.5,3,U)*(.45+.55*sst(3,12,U));
/* (Mud Lab 22.1 water) MIST. Water thrown up fine where a wave breaks off a tyre or the body at speed: soft pale
   puffs (the engine's own spray, as off wet tarmac: they swell, hang and drift), from either side of the wave's
   head, flung out and up and carried along. From 8 mph, more with speed. They are the wake's own (MLWK.fx, its own
   dice), like Build 22's side drops: the game's dice and its count of particles are untouched.
   R the wave, U how fast it goes, y the water's surface, s0 how big a puff starts, (nx, nz) across the way it goes */
function mlWkMist(R,dt,U,y,s0,nx,nz){if(reduce||R.k<.2||U<3.5||!R.on)return;const F=MLWK.fx,cap=mlWkCap(),e=R.k*Math.min(U-3,12)*3*LOOK.dust*dt;
  let n=Math.floor(e)+(mlWDice()<e-Math.floor(e)?1:0);
  for(;n>0&&F.length<cap&&MLWK.nm<ML_WKM;n--,MLWK.nm++){const sd=mlWDice()<.5?-1:1,o=sd*(R.w0*(.5+.7*mlWDice())),bk=mlWDice()*.8,out=sd*U*(.14+.3*mlWDice()),l=.5+mlWDice()*.5,s=s0*(.7+.6*mlWDice());
    F.push({kind:'spray',x:R.x+nx*o-R.ux*bk,y:y+.1+mlWDice()*.25,z:R.z+nz*o-R.uz*bk,vx:R.ux*U*.5+nx*out,vy:.9+mlWDice()*1.6+U*.12,vz:R.uz*U*.5+nz*out,s,s0:s,life:l,max:l,r:.56,g:.5,b:.41,al:.27,yaw:mlWDice()*6.283});}
  /* (Mud Lab 22.2 water) THE FAN. From 10 mph the water a tyre or the body parts is thrown out to both sides as a fan
     of drops: flung out and up at a share of its speed and carried along with it, the ones flung furthest out the
     lowest, so they arc over and come down as a curtain beside the SUV. More and further with speed */
  const ef=R.k*Math.max(0,Math.min(U-4.5,13))*(s0>.2?5:3.4)*LOOK.dust*dt,wc=MLS.col.water;let m=Math.floor(ef)+(mlWDice()<ef-Math.floor(ef)?1:0);
  for(;m>0&&F.length<cap;m--){const sd=mlWDice()<.5?-1:1,a=mlWDice(),o=sd*R.w0*(.7+.4*mlWDice()),out=sd*U*(.16+.34*a),al=U*(.5+.25*mlWDice()),l=.45+mlWDice()*.5,sz=.05+mlWDice()*.07;
    F.push({kind:'water',x:R.x+nx*o-R.ux*mlWDice()*.5,y:y+.06,z:R.z+nz*o-R.uz*mlWDice()*.5,vx:R.ux*al+nx*out,vy:1+U*(.1+.17*mlWDice())*(1-.45*a),vz:R.uz*al+nz*out,s:sz,s0:sz,life:l,max:l,r:wc[0]*1.9,g:wc[1]*1.9,b:wc[2]*1.9,yaw:0});}}
/* (how many of the wake's own particles may be alive at once: the phone's share, everyone else's. And of those, how
   many may be puffs of mist: the same on every tier, 56 (and 12 more for a splash). A puff is big and soft, and a
   hundred of them behind a SUV in a hard turn were a white veil between it and the chase camera: the laptop's
   picture showed it, the phone's did not only because its share ran out first) */
const mlWkCap=()=>GFX.level==='mobile'?170:340,ML_WKM=56;
/* (Mud Lab 22.2 water) THE SPLASH OF GOING IN. A tyre, or the body, that meets the water at 9 mph or more (down as
   well as along: a jump's landing counts) throws up a burst the moment it does: drops flung forward and out and up
   by how hard it hit, a few puffs of mist, and a ring. R the wave that has just begun, sp how hard, y the water's
   surface, k how big (1 a tyre, 2 the body) */
function mlWkSplash(R,sp,y,k){if(reduce||sp<4||MLS.clock-(R.spT||-9)<.6)return;R.spT=MLS.clock;const F=MLWK.fx,cap=mlWkCap(),wc=MLS.col.water,nx=-R.uz,nz=R.ux;
  let n=Math.round(Math.min(40,8+sp*1.6)*k*LOOK.dust);
  for(;n>0&&F.length<cap;n--){const an=(mlWDice()-.5)*3.4,c=Math.cos(an),sn=Math.sin(an),h=sp*(.18+.34*mlWDice()),l=.55+mlWDice()*.5,sz=.06+mlWDice()*.09;
    F.push({kind:'water',x:R.x+(mlWDice()-.5)*.5*k,y:y+.06,z:R.z+(mlWDice()-.5)*.5*k,vx:(R.ux*c+nx*sn)*h+R.ux*sp*.3,vy:1.6+sp*(.14+.2*mlWDice()),vz:(R.uz*c+nz*sn)*h+R.uz*sp*.3,s:sz,s0:sz,life:l,max:l,r:wc[0]*1.9,g:wc[1]*1.9,b:wc[2]*1.9,yaw:0});}
  for(n=Math.round((3+sp*.3)*k);n>0&&F.length<cap&&MLWK.nm<ML_WKM+12;n--,MLWK.nm++){const l=.6+mlWDice()*.5,sz=(.2+.16*mlWDice())*k;
    F.push({kind:'spray',x:R.x+(mlWDice()-.5)*.8*k,y:y+.15+mlWDice()*.3,z:R.z+(mlWDice()-.5)*.8*k,vx:R.ux*sp*.4+(mlWDice()-.5)*2,vy:1.2+mlWDice()*1.6+sp*.08,vz:R.uz*sp*.4+(mlWDice()-.5)*2,s:sz,s0:sz,life:l,max:l,r:.56,g:.5,b:.41,al:.27,yaw:mlWDice()*6.283});}
  mlWake(R.x,R.z,Math.min(1,.5+sp*.05),R.c);}
/* all of them, for the SUV you are in */
function mlWakeStep(dt,t){const p=t.p,v=t.v,now=MLS.clock;
  /* (a clock put back: the rings laid by the old clock are forgotten too, or each would be seen again as the new clock came to its time) */
  if(now<MLWK.t){MLWK.t=-9;MLRP.on=false;MLRP.quiet=9;}
  const U=Math.hypot(v[0],v[2]),M=t.M,fl=Math.hypot(M[0],M[6])||1,fx=M[0]/fl,fz=M[6]/fl;
  const B=MLWK.R[4];if(U>.3){B.ux=v[0]/U;B.uz=v[2]/U;}const ux=B.ux,uz=B.uz,uf=Math.abs(ux*fx+uz*fz),us=Math.abs(uz*fx-ux*fz);
  if(t.__mlHx===undefined){let a=0,b=0;for(const q of t.c.hull||[]){a=Math.max(a,Math.abs(q[0]));b=Math.max(b,Math.abs(q[2]));}t.__mlHx=a>1?a:2.3;t.__mlHz=b>.5?b:1;}
  const clr=t.__mlClr===undefined?.557:t.__mlClr,wl=mlWL(p[0],p[2]),dw=MLS.wd;if(dw>.02&&wl>-90)MLWK.lv=wl;const air=!t.wheels.some(w=>w.contact)&&p[1]-(t.c.hcg||.7)>wl+MLS.h0+.05,deep=Math.min(dw,mlStand(p[0],p[2]))-clr;
  /* the tyres: where each is (its hub, the same point whether it is on the ground or off it: a tyre chattering on
     and off the bed must not seem to jump about), and how far its foot is under the water there */
  const TX=MLWK.tx,TZ=MLWK.tz,TD=MLWK.td,nw=Math.min(4,t.wheels.length);
  for(let q=0;q<nw;q++){const w=t.wheels[q];TX[q]=w.hpW[0]-M[1]*w.len;TZ[q]=w.hpW[2]-M[7]*w.len;
    /* (Mud Lab 22.3: the water that STANDS there, mlStand: not the water in a rut it is digging) */
    if(w.contact&&now-(w.mlWdT||-9)<.05)TD[q]=w.mlWdE||0;else{const l=mlWL(TX[q],TZ[q]);TD[q]=l>-90?Math.min(l+MLS.h0-(w.hpW[1]-M[4]*w.len-w.R),mlStand(TX[q],TZ[q])):0;}}
  for(let q=0;q<nw;q++){const w=t.wheels[q],R=MLWK.R[q],wd=TD[q],x=TX[q],z=TZ[q];
    /* the way this tyre itself is going, and how fast */
    let Ut=U;if(now-R.qt<.05){const dx=x-R.qx,dz=z-R.qz,d=Math.hypot(dx,dz);Ut=Math.min(60,d/dt);if(Ut>.3){R.ux=dx/d;R.uz=dz/d;}}else{R.ux=ux;R.uz=uz;}R.qx=x;R.qz=z;R.qt=now;
    const tx=R.ux,tz=R.uz;
    /* another tyre ahead of it in its own line: no wave */
    let sh=0;for(let j=0;j<nw;j++)if(j!==q&&TD[j]>.03){const dx=TX[j]-x,dz=TZ[j]-z;if(dx*tx+dz*tz>.4)sh=Math.max(sh,1-sst(.35,.9,Math.abs(dz*tx-dx*tz)));}
    const wf=Math.hypot(w.f[0],w.f[2])||1,sb=Math.abs(tz*w.f[0]-tx*w.f[2])/wf,cb=Math.sqrt(Math.max(0,1-sb*sb));
    const d=Math.max(0,Math.min(wd,w.R)),ch=Math.sqrt(Math.max(0,w.R*w.R-(w.R-d)*(w.R-d))),hw=(w.front?t.c.tyreW:t.c.tyreWR||t.c.tyreW||.28)/2,ld=(ch*cb+hw*sb)*.8;
    const was=R.on;
    mlWkStep(R,dt,wd>.03,x+tx*ld,z+tz*ld,Ut,Math.sqrt(9.81*Math.max(.03,Math.min(wd,1))),hw*cb+ch*sb,mlWkS(Ut)*Math.min(1,wd/.1)*(1-sst(clr,clr+.22,wd))*(1-sh));mlWkMist(R,dt,Ut,wl+MLS.h0,.15,-tz,tx);
    if(!was&&R.on)mlWkSplash(R,Math.hypot(Ut,v[1]),wl+MLS.h0,1);}
  /* the body: from whichever of its sides is foremost the way it is going */
  /* (Mud Lab 22.1 water) THE BOW'S ROLL. The head of the body's path is put inside the body, as far back from its
     leading side as the body is half wide across the way it goes, less 10 cm: the shader draws the first piece of
     a wave round the front of its head at that half width (src/ml-look.glsl), so the crest stands against the
     leading side (10 cm off it: water piled up on the bumper, the flank, the tail), across the whole of it, and
     sweeps back round both corners into the arms. Sliding broadside
     the roll lies along the whole flank */
  {const a=t.__mlHx,b=t.__mlHz,w0=a*us+b*uf,lead=a*uf+b*us-w0+.1,wasB=B.on;
    mlWkStep(B,dt,deep>.02&&!air,p[0]+ux*lead,p[2]+uz*lead,U,Math.sqrt(9.81*Math.max(.05,Math.min(dw,1.2))),w0,sst(.4,2.5,U)*Math.min(1,.5+deep/.2));mlWkMist(B,dt,U,wl+MLS.h0,.3,-uz,ux);if(!wasB&&B.on)mlWkSplash(B,Math.hypot(U,v[1]),wl+MLS.h0,2);}
  /* (Mud Lab 22.2 water) OUT OF THE WATER, IT RUNS OFF. A SUV that has been in over its axles (25 cm) drips for three
     seconds once it is out: drops falling from under its body, all round it, many at first and fewer as it drains;
     more of them the deeper it was */
  if(dw>.25){MLWK.dripT=now;MLWK.dripK=Math.min(1,dw/.7);}
  else if(dw<=.02&&!reduce){const age=now-MLWK.dripT;if(age<3){const F=MLWK.fx,cap=mlWkCap(),g=1-age/3,e=(14+50*MLWK.dripK)*g*g*LOOK.dust*dt,wc=MLS.col.water,a=t.__mlHx,b=t.__mlHz,yb=p[1]-(t.c.hcg||.7)+clr+.1;
      let n=Math.floor(e)+(mlWDice()<e-Math.floor(e)?1:0);
      for(;n>0&&F.length<cap;n--){const al=(mlWDice()*2-1)*a*.9,sd=(mlWDice()*2-1)*b,l=.5,sz=.02+mlWDice()*.025;
        F.push({kind:'water',x:p[0]+fx*al-fz*sd,y:yb,z:p[2]+fz*al+fx*sd,vx:v[0]*.85,vy:-.3,vz:v[2]*.85,s:sz,s0:sz,life:l,max:l,r:wc[0],g:wc[1],b:wc[2],yaw:0});}}}
  /* the other SUV, towed or driven beside you: one wave for it, off its leading side, while a tyre of it is in water */
  {const o=mlrLive(),R=MLWK.R[5];let wet=false,hx=R.x,hz=R.z,Uo=0,wd=0,w0=1;
    if(o&&o!==t){for(const w of o.wheels)if(w.contact&&now-(w.mlWdT||-9)<.05)wd=Math.max(wd,w.mlWdE||0);Uo=Math.hypot(o.v[0],o.v[2]);if(Uo>.3){R.ux=o.v[0]/Uo;R.uz=o.v[2]/Uo;}
      if(wd>.03){const m=o.M,l=Math.hypot(m[0],m[6])||1,gx=m[0]/l,gz=m[6]/l,af=Math.abs(R.ux*gx+R.uz*gz),as=Math.abs(R.uz*gx-R.ux*gz),ld=2.3*af+1*as;wet=true;w0=2.3*as+1*af;hx=o.p[0]+R.ux*(ld-w0+.1);hz=o.p[2]+R.uz*(ld-w0+.1);}}
    mlWkStep(R,dt,wet,hx,hz,Uo,Math.sqrt(9.81*Math.max(.03,Math.min(wd,1.2))),w0,.7*mlWkS(Uo)*Math.min(1,wd/.1));}
  /* (Mud Lab 22.3 water) and the water itself */
  mlRipple(dt,t,nw,U,fx,fz,deep,air);}
/* ---------- the water against the truck: drag on the tyres and the body (by how deep and how fast), the bow wave ---------- */
function mlWater(dt,t){
  const p=t.p,b=mlBase(p[0],p[2]),fi=(p[0]-MLS.x0)/MLS.C,fj=(p[2]-MLS.z0)/MLS.C,g=b+mlRut(fi|0,fj|0),wl=mlWL(p[0],p[2]),dw=wl-g;
  /* (how high the body's sills are off the ground: the water and the mud meet them there) */
  if(t.__mlClr===undefined){let mn=0;for(const q of t.c.hull||[])mn=Math.min(mn,q[1]);t.__mlClr=t.c.hull?Math.max(.15,Math.min(.8,t.c.hcg+mn)):.557;}
  const M=t.M,fx=M[0],fz=M[6],fl=Math.hypot(fx,fz)||1,f=[fx/fl,fz/fl],v=t.v,vf=v[0]*f[0]+v[2]*f[1],vs=-v[0]*f[1]+v[2]*f[0];
  MLS.wd=dw;if(dw<=.02){if(t.mlDrowned||t.mlWet>0||t.mlFlood>0)mlDeepDry(t);return;}
  const flood=mlDeep(dt,t,wl);
  /* (Mud Lab 21) IN THE AIR OVER WATER IS NOT IN IT. Found with the first jump over the River: the Rock & Mud left the
     lip at 152 mph, rose 60 ft as it should, and came down 26 ft further on: the drag below is worked out from how deep
     the water is over the ground under the SUV, whatever height the SUV is at, and over 6 ft of river that is a wall.
     Nothing had ever been over water without being in it. With all four tyres off the ground and the lowest of the SUV
     clear of the surface: no drag, no lift, no bow wave. Anything else is exactly as it was */
  if(MLS.over=!t.wheels.some(w=>w.contact)&&p[1]-(t.c.hcg||.7)>wl+MLS.h0+.05){MLS.buoy=0;return;}
  /* (the body meets the water above its sills: the Rock & Mud's are 56 cm up, his SUV's 32 cm (Mud Lab 6: the body's
     depth measured from its own sills, the Rock & Mud's as before)) */
  const imm=Math.max(0,dw-.3+(.557-t.__mlClr)),wh=Math.min(dw,.94),Cd=.9,m=t.c.mass||2500;
  /* (forward: the body's front and the four tyres; sideways: the body's side) */
  const Af=1.9*imm+4*t.c.tyreW*wh,As=4.7*imm+2*.9*wh*.5;
  const Ff=-.5*ML_RHO*Cd*Af*Math.abs(vf)*vf,Fs=-.5*ML_RHO*Cd*As*Math.abs(vs)*vs;
  let dvf=Ff/m*dt,dvs=Fs/m*dt;if(Math.abs(dvf)>Math.abs(vf))dvf=-vf;if(Math.abs(dvs)>Math.abs(vs))dvs=-vs;
  /* (Mud Lab 6) water over the sills lifts the body: a quarter of the water the body pushes aside below the waterline (a
     cab isn't sealed), so the tyres press down less and grip less; his SUV's lower body floats sooner than the
     Rock & Mud's */
  /* (Mud Lab 20) OFF THE GROUND, THE LIFT IS FOR THE WATER THE BODY IS REALLY IN. His words, 13 Nov 2026: "When you're in
     very mucky stuff and you're moving the soil around beneath the SUV, sometimes the SUV can pop up out of the water
     kind of intensely." Caught in the Bog's last pit (tools/test/ml-drive.js T9.churn, Build 19): the Rock & Mud,
     rocking flat out in 1.2 m of water, was kicked up at 3.6 m/s by the pit's own wall, and then hung in the air for
     3.4 s, its sills 2.2 m over the water, and rolled over up there. The lift is worked out from how deep the water
     is over the ground under the SUV's middle, whatever height the SUV itself is at: two thirds of its weight in that
     pit, and it went on being lifted by two thirds of its weight all the way up, out of the water, falling at a third
     of gravity. With a tyre on the ground the lift is as it always was (the Bog's marks and every crossing depend on
     it). With none on the ground it is for the water over the body's own sills as it lies (never more than the old
     figure): a SUV thrown out of the water comes straight back down */
  {const air=!t.wheels.some(w=>w.contact),up=wl+MLS.h0-(p[1]-(t.c.hcg||.7)),sub=Math.max(0,(air?Math.min(dw,up):dw)-t.__mlClr);if(sub>0){const B=ML_RHO*9.81*4.9*1.9*Math.min(sub,1.1)*.25*flood;v[1]+=Math.min(B,.85*m*9.81)/m*dt;MLS.buoy=B;}else MLS.buoy=0;}
  v[0]+=f[0]*dvf-f[1]*dvs;v[2]+=f[1]*dvf+f[0]*dvs;
  /* the bow wave: water pushed up and out in front of the truck, and a mist off it */
  const vis=mlStand(p[0],p[2])>.03?1:0;
  const sp=Math.abs(vf);if(sp>1.2&&!reduce){const cap=fxCap(),nb=fxCount(Math.min(1,dw/.35)*sp*sp*1.4*LOOK.dust*dt),fwd=vf>=0?1:-1,L=2.5*fwd;
    for(let q=0;q<nb&&FX.length<cap;q++){const sd=(Math.random()-.5)*2.1,x=p[0]+f[0]*L-f[1]*sd,z=p[2]+f[1]*L+f[0]*sd,out=Math.sign(sd)*(1+Math.random()*1.8)*sp*.22;
      FX.push({kind:'water',x,y:wl+MLS.h0+.05,z,vx:v[0]*.9+f[0]*fwd*sp*.15-f[1]*out,vy:1+Math.random()*1.6+sp*.18,vz:v[2]*.9+f[1]*fwd*sp*.15+f[0]*out,
        s:(.04+Math.random()*.06)*vis,s0:.05*vis,life:1.3,max:1.3,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});MLS.stat.splash++;}}
  /* (Mud Lab 22) and off its SIDE when it slides: the part of its speed that is sideways throws its own drops, from
     along whichever flank leads. They are the wake's own (MLWK.fx: rolled on its own dice, moved by mlWkDrops, handed
     to the engine's drawing only while a frame is drawn), so the game's dice and its count of particles are what they
     were with no slide at all: the test drives cannot tell */
  {const sl=Math.abs(vs);if(sl>1.2&&!reduce&&vis&&t===GAME.car){const F=MLWK.fx,cap=mlWkCap(),e=Math.min(1,dw/.35)*sl*sl*1.4*LOOK.dust*dt,g=vs>=0?1:-1,sx=-f[1]*g,sz=f[0]*g;
      let n=Math.floor(e)+(mlWDice()<e-Math.floor(e)?1:0);
      for(;n>0&&F.length<cap;n--){const al=(mlWDice()-.5)*4.6,x=p[0]+sx*1.15+f[0]*al,z=p[2]+sz*1.15+f[1]*al,out=(mlWDice()-.5)*2*(1+mlWDice()*1.8)*sl*.22;
        F.push({kind:'water',x,y:wl+MLS.h0+.05,z,vx:v[0]*.9+sx*sl*.15+f[0]*out,vy:1+mlWDice()*1.6+sl*.18,vz:v[2]*.9+sz*sl*.15+f[1]*out,
          s:.04+mlWDice()*.06,s0:.05,life:1.3,max:1.3,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});}}}
}
/* (Mud Lab 22) the side spray's drops: they fall as the engine's own water drops do (fxStep) and end on the ground */
function mlWkDrops(dt){const F=MLWK.fx,W=RANCH.W;let nm=0;
  for(let i=F.length-1;i>=0;i--){const q=F[i];q.life-=dt;if(q.life<=0){F[i]=F[F.length-1];F.pop();continue;}if(q.kind==='spray')nm++;
    /* (Mud Lab 22.1 water: the mist drifts as the engine's spray does; the drops fall. Mud Lab 22.2: it swells fast at
       first and then slowly, so a puff is a haze almost at once and never a ball) */
    if(q.kind==='spray'){q.vx*=1-dt*2.4;q.vz*=1-dt*2.4;q.vy=q.vy*(1-dt*2)-dt*.6;q.s=q.s0*(1+3.2*Math.sqrt(1-q.life/q.max));q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;continue;}
    q.vy-=9.8*dt;q.vx*=1-dt*.4;q.vz*=1-dt*.4;q.s=q.s0*(1-(1-q.life/q.max)*.6);q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
    /* (Mud Lab 22.4: a drop that comes down on the worked-out water knocks it: a ring. One in three, the bigger ones more) */
    if(q.vy<0&&MLRP.on&&q.y<MLS.h0+MLRP.lv){q.life=0;if(q.s0>.03&&(MLRP.pk=(MLRP.pk||0)+1)%3===0)mlRpPoke(q.x,q.z,Math.min(.5,q.s0*5));}
    else if(q.y<W.heightAt(q.x,q.z))q.life=0;}
  MLWK.nm=nm;}
/* (Mud Lab 22.4 water) a drop's streak (src/build.py): which way it is crossing the picture, and how long that makes it:
   into the engine's list of puffs at o (o+3 its turn in the picture, o+6 how much longer than wide) */
function mlStreak(p,o){const B=R.camBasis;if(!B)return;const r=B.r,u=B.up,vr=p.vx*r[0]+p.vy*r[1]+p.vz*r[2],vu=p.vx*u[0]+p.vy*u[1]+p.vz*u[2],sp=Math.hypot(vr,vu);
  if(sp>1.5){PUFF_BUF[o+3]=Math.atan2(-vr,vu);PUFF_BUF[o+6]=Math.min(3.5,(sp-1.5)*.16);}}
/* (they join the engine's particles only for the moment it draws them) */
{const draw=FXP.particles;FXP.particles=function(R,U,texs){const F=MLWK.fx,n=FX.length;for(let i=0;i<F.length&&FX.length<FX_MAX;i++)FX.push(F[i]);try{return draw.call(this,R,U,texs);}finally{FX.length=n;}};}
/* (Mud Lab 19) DEEP WATER: THE ENGINE DROWNS. (Mud Lab 20) AND IT CHOKES FIRST. His words, 13 Nov 2026: "when it does
   submerge I think that it should like take a moment like vehicles do in real life and so the stock SUV's tailpipe can
   go below the water but it's the intake that can't go below the water, and then the Rock and Mud SUV with its snorkel
   can go until the snorkel goes below water, and then once it does go below water it like chokes the way an engine
   would, not just dying immediately."
   WHERE THE AIR GOES IN, measured on the two models (tools/world: their hoods, roofs and the snorkel): the stock SUV
   breathes from under the front edge of its hood (the hood is 1.07 to 1.17 m off the ground: 1.05 m), the Rock & Mud
   from its snorkel's mouth on the windscreen pillar (2.05 m; its roof is 2.27). ML_INTAKE: metres ahead of the SUV's
   middle, above the ground it stands on, to its side, and the height of its centre of gravity as measured (a tyre
   size up lifts the body and that centre together). Where that point is against the water is worked out from the
   body as it lies (mlUnder), so a SUV nosing down a bank puts a front intake under sooner. Build 19 had them at 1.55 m
   (the top of the stock SUV's doors) and 2.05 m, over the SUV's middle.
   THE EXHAUST is no part of it: a tailpipe under water is a running engine.
   CHOKING: the intake under for a third of a second, the engine starts to miss (the engine's own fuel cut, a miss at
   a time: its sound is the engine's own misfire), more and longer as it swallows more, the revs sagging with each
   miss; three seconds of that and it dies. Get the intake clear before then and it coughs for as long again and
   clears. (The line said BACK OUT at first. Off the Lake's beach, in the Pond and in a deep ford, backing out at the
   first miss never saved it in the tests: the SUV was already sliding in, or already bogged. It says what is
   happening instead.)
   Dead, it stays dead until the intake has been 30 cm clear of the water for two and a half seconds; then it
   starts, and coughs once more.
   THE CAB (t.mlFlood, 0 to 1): fills in six seconds once the engine has drowned, and drains in eight once it is
   running again: the water's lift on the body falls to under a third as it fills, so a drowned SUV settles onto the
   bottom, into the muck. (Build 19 gave the lift all back at once the moment the engine restarted: a jolt upward.)
   ON THE FIRST MAP: the Rock & Mud's snorkel is where it was. The stock SUV's intake is half a metre lower than
   Build 19 had it, so it now chokes in water over its hood: README, Mud Lab 20, has where that is */
const ML_INTAKE={stock:[1.9,1.05,.5,.74],crawler:[.25,2.05,1,.982]},ML_CHOKE=3;
/* (how far under the water a point of the body is, m; negative: clear of it. q: ahead, up from the ground, to the side,
   and the centre of gravity's height it was measured with) */
function mlUnder(t,q,wl){const M=t.M;return wl+MLS.h0-(t.p[1]+M[3]*q[0]+M[4]*(q[1]-q[3])+M[5]*q[2]);}
/* (Mud Lab's own dice for what is only seen and heard: the game's are counted, and the test drives count on that) */
let ML_DICE=12345;const mlDice=()=>{ML_DICE=(Math.imul(ML_DICE,1664525)+1013904223)|0;return (ML_DICE>>>8)/16777216;};
/* (a choking engine: a miss, then a gap; the wetter, the longer the miss and the shorter the gap) */
function mlCough(dt,t){const pt=t.pt,w=t.mlWet;if(!pt||pt.st!=='run')return;t.mlCutG=(t.mlCutG||0)-dt;
  if(t.mlCutG<=0){const c=.05+.25*w*(.6+.8*mlDice());pt.cutT=Math.max(pt.cutT||0,c);t.mlCutG=c+(.4-.3*w)*(.5+mlDice());}
  if(pt.cutT>0&&!pt.locked){const iw=pt.e.idle*TAU/60;if(pt.we>iw*.6)pt.we-=pt.we*Math.min(.5,dt*(1.5+5*w));}}
function mlDeep(dt,t,wl){const kind=mlSuvKind(t),over=mlUnder(t,ML_INTAKE[kind]||ML_INTAKE.crawler,wl),pt=t.pt,me=t===GAME.car;
  if(over>(t.mlOverMax||-9))t.mlOverMax=over;
  if(!t.mlDrowned){const run=pt&&pt.st!=='off'&&pt.st!=='stopping';
    if(over>0&&run){t.mlDrT=(t.mlDrT||0)+dt;if(t.mlDrT>.33){if(!(t.mlWet>0)&&me)say(kind==='stock'?'WATER IN THE INTAKE: THE ENGINE IS CHOKING':'WATER IN THE SNORKEL: THE ENGINE IS CHOKING',2.6,PAL.gold);t.mlWet=Math.min(1,(t.mlWet||0)+dt/ML_CHOKE);}}
    else{t.mlDrT=0;if(t.mlWet>0){t.mlWet=Math.max(0,t.mlWet-dt/(run?ML_CHOKE:.6));if(!t.mlWet){if(me&&run&&t.mlWetMax>.3)say('IT COUGHED THE WATER OUT',2.2);t.mlWetMax=0;}}}
    if(t.mlWet>0){t.mlWetMax=Math.max(t.mlWetMax||0,t.mlWet);mlCough(dt,t);}
    if(t.mlWet>=1){t.mlDrowned=MLS.clock+1e-6;t.mlDryT=0;t.mlWet=0;t.mlWetMax=0;MLS.stat.drowned=(MLS.stat.drowned||0)+1;if(pt&&pt.stop&&pt.st!=='off')pt.stop();
      if(me){MLS.drownT=t;for(let q=GAME.msgs.length-1;q>=0;q--)if(/^(BOGGED|WHEELSPIN|WATER IN)/.test(GAME.msgs[q].t))GAME.msgs.splice(q,1);
        say('THE ENGINE HAS DROWNED: '+(MLR.mode==='real'&&!MLR.off?'WINCH, STRAP, OR A TOW HOME (MAP)':'WINCH, STRAP OR RESET'),6,PAL.gold);}}}
  else{
    if(over<-.3){t.mlDryT+=dt;if(t.mlDryT>2.5){t.mlDrowned=0;t.mlWet=.45;t.mlWetMax=0;if(me){if(pt&&(pt.st==='off'||pt.st==='stopping'))startEngine();say('THE INTAKE IS CLEAR: THE ENGINE RUNS AGAIN',3);}}}
    else{t.mlDryT=0;if(pt&&pt.stop&&pt.st!=='off'&&pt.st!=='stopping')pt.stop();
      /* (air coming up out of it: a few drops breaking the surface over where it lies, so there is something to see of
         a SUV that is all the way under; fewer once the cab has filled) */
      if(!reduce&&MLS.col.water){const k=MLS.clock-t.mlDrowned,n=fxCount((k<8?9:2.5)*LOOK.dust*dt),cap=fxCap();for(let q=0;q<n&&FX.length<cap;q++){const a=Math.random()*6.283,r=Math.random()*1.6;
        FX.push({kind:'water',x:t.p[0]+Math.cos(a)*r,y:wl+MLS.h0+.03,z:t.p[2]+Math.sin(a)*r,vx:(Math.random()-.5)*.5,vy:.9+Math.random()*1.3,vz:(Math.random()-.5)*.5,s:.05+Math.random()*.07,s0:.06,life:.9,max:.9,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});}
        if(MLS.clock-(t.mlRingT||0)>.5){t.mlRingT=MLS.clock;mlWake(t.p[0]+(Math.random()-.5)*1.5,t.p[2]+(Math.random()-.5)*1.5,k<8?.9:.4);}}}}
  /* the cab */
  t.mlFlood=t.mlDrowned?Math.min(1,(t.mlFlood||0)+dt/6):Math.max(0,(t.mlFlood||0)-dt/8);
  return 1-.7*t.mlFlood;}
/* (a drowned SUV that is out of the water altogether, set there by RESET or a tow home: it starts again at once, dry) */
function mlDeepDry(t){if(t.mlDrowned){t.mlDrowned=0;t.mlDrT=0;t.mlWet=0;t.mlFlood=0;if(t===GAME.car&&t.pt&&(t.pt.st==='off'||t.pt.st==='stopping'))startEngine();}else if(t.mlWet>0||t.mlFlood>0){t.mlWet=0;t.mlFlood=0;t.mlDrT=0;}}
/* (Mud Lab 19) no camera under the water: an eye that would be under a water's surface (the chase camera following a
   SUV down into the Lake) is held 70 cm over it, looking down at the SUV.
   (Mud Lab 20) EXCEPT THE CAMERAS THAT ARE ON THE SUV. His words, 13 Nov 2026: "when you do fully submerge under the
   water you can switch wheel cam and actually see the SUV underwater." The Wheel cam, the Hood and the Cockpit go
   under with it once the water is deep over them (in the Film camera too, while it is on one of them). MLS.eyeUnder
   is how deep the eye is (0: in the air), and mlUnderEnv below turns that into muddy water to look through */
const ML_ONBOARD={'Wheel cam':1,'Hood':1,'Cockpit':1};
function mlCamDry(c){MLS.eyeWas=MLS.eyeUnder||0;MLS.eyeUnder=0;if(!MLS.ready||MLS.off||!MLS.cW||!c||!c.eye)return c;const x=c.eye[0],z=c.eye[2];
  if(x<MLS.x0+4||z<MLS.z0+4||x>MLS.x0+MLS.WS-4||z>MLS.z0+MLS.WS-4)return c;const wl=mlC(MLS.cW,x,z),g=mlC(MLS.cB,x,z);if(wl<g-.2)return c;
  if(ML_ONBOARD[camMode()]){
    /* (under only when the eye would be well under: more than 55 cm, and then until it is less than 35 cm. In water
       shallower than that over the eye, the Mud Hole's or a ford's, the camera is held over the surface as Build 19
       held it: an eye just under a surface that isn't drawn from below sees the SUV standing in no water at all) */
    const w2=mlWL(x,z),d=w2+MLS.h0-c.eye[1];if(w2>mlBase(x,z)-.05&&d>(MLS.eyeWas>0?.35:.55)){MLS.eyeUnder=d;return c;}}
  const y=wl+MLS.h0+.7;if(c.eye[1]<y){c.eye[1]=y;const t=GAME.car;if(t){const dx=t.p[0]-x,dy=t.p[1]+.8-y,dz=t.p[2]-z,l=Math.hypot(dx,dy,dz)||1;c.fwd=[dx/l,dy/l,dz/l];}}return c;}
/* (Mud Lab 20) LOOKING THROUGH MUDDY WATER (the engine's own environment for the frame, changed after it is worked
   out: src/build.py). The engine's light-in-the-air pass does the work: its haze made about a hundred times thicker
   and brown, the same at every height, so the SUV 15 ft away is seen dimly and anything past 30 ft not at all; the
   sun's beam cut to a tenth, the sky's light to a half and browner the deeper the eye is; the sky itself the same
   mud. Nothing is added to any shader */
function mlUnderEnv(E){const d=GAME.state==='drive'?MLS.eyeUnder||0:0;if(!(d>0))return;
  /* (w: the water thickens from nothing over the first foot of depth. mlCamDry lets an eye under only at more than a
     foot, so this is 1 whenever it matters; it is kept so the look can never switch on at full strength at a surface) */
  const k=Math.min(1,d/2),w=sst(0,.3,d),mix=(a,b)=>a+(b-a)*w,T=[.16,.115,.06].map(v=>v*(1-.4*k)),amb=mix(1,.65-.25*k),br=[1,mix(1,.85),mix(1,.6)];
  E.fogDen=mix(E.fogDen,.11+.05*k);E.fogFall=mix(E.fogFall,0);E.fogAmb=E.fogAmb.map((v,i)=>mix(v,T[i]));E.fogCol=E.fogCol.map((v,i)=>mix(v,T[i]*1.1));
  /* (the light down here is the water's own glow, soft and from everywhere: the sun's beam is all but gone, so the
     water between is not lit up brighter than the SUV behind it) */
  E.sunCol=E.sunCol.map(v=>v*mix(1,.1));E.ambUp=E.ambUp.map((v,i)=>v*amb*br[i]);E.ambDn=E.ambDn.map((v,i)=>v*amb*br[i]);
  /* (and the sky is the same mud: it is what the reflections' own picture is made of, and the wet bed under the SUV,
     which nothing ever saw from below, mirrored a bright sky) */
  E.skyZen=E.skyZen.map((v,i)=>mix(v,T[i]*.8));E.skyHor=E.skyHor.map((v,i)=>mix(v,T[i]));E.skyGlow=E.skyGlow.map(v=>v*(1-w));E.stars=0;}
/* ---------- each frame, after the physics ---------- */
const ML_LUG={};
function mlLug(tr){if(ML_LUG[tr]===undefined){const T=TREAD_MU[tr],M=TREAD_MU.mud;ML_LUG[tr]=T&&M?Math.max(.5,Math.min(1.1,T.mud/M.mud)):1;}return ML_LUG[tr];}
function mlStep(dt,t){
  if(!WG.mlA||MLS.off)return;if(!MLS.ready)mlInit();if(!MLS.ready||!t||t.rt)return;MLS.clock+=dt;
  mlStepCar(dt,t);if(t===GAME.car)mlWakeStep(dt,t);mlWkDrops(dt);
  /* (Mud Lab 19: a SUV made new while the one before it stood drowned (a tune picked, a tyre size): the engine gives a
     new car the engine state of the old one, and that was "off". This one hasn't drowned: it runs) */
  if(MLS.drownT){if(t!==MLS.drownT){if(!t.mlDrowned&&t.pt&&t.pt.st==='off'){t.pt.st='run';t.pt.we=t.pt.e.idle*TAU/60;}MLS.drownT=null;}else if(!t.mlDrowned)MLS.drownT=null;}
  /* (Mud Lab 9) the other SUV, while it's on the physics (strapped, or beside you: src/ml-recover.js): the same soil
     under its tyres; the readouts stay yours */
  {const o=mlrLive();if(o){const k=[MLS.wd,MLS.buoy,MLS.plough,MLS.res,GAME.dirt];mlStepCar(dt,o);o.mlDirt=Math.min(1,(o.mlDirt||0)+Math.max(0,GAME.dirt-k[4]));MLS.wd=k[0];MLS.buoy=k[1];MLS.plough=k[2];MLS.res=k[3];GAME.dirt=k[4];}}
  if(!APP.bigMap){if(MLS.gripBtn)MLS.gripBtn.hidden=true;if(MLMV.open){MLMV.open=false;MLMV.whole=false;if(MLMV.btn)MLMV.btn.hidden=true;}}
  mlSettle(dt);mlFillTick();mlWindow();mlUpload();
}
/* one vehicle's tyres and belly on the soil, for this frame */
function mlStepCar(dt,t){
  /* (the soil's grip on each tyre, in place of or times the engine's own) */
  {const P=Object.getPrototypeOf(t);if(!P.__mlg){const o=P._smu;P._smu=function(wh,s){return MLS.terra&&wh.mlOn&&wh.mlMuT!==undefined?wh.mlMuT:o.call(this,wh,s)*(wh.mlGrip===undefined?1:wh.mlGrip);};P.__mlg=1;}}
  mlWater(dt,t);let res=0,zS=0,nZ=0;const m=t.c.mass||2500;
  /* (Mud Lab 22.3: half a metre ahead of a tyre the way the SUV is going, for mlStand; where it stands, if it is not going) */
  const sv=Math.hypot(t.v[0],t.v[2]),sax=sv>.5?t.v[0]/sv*.55:0,saz=sv>.5?t.v[2]/sv*.55:0;
  for(const w of t.wheels){
    /* (soil science does its own rolling resistance: the engine's per-surface drag stood down while it's on) */
    if(MLS.terra){if(!w.__rr0){w.__rr0=w.surfRR;w.__dg0=w.surfDrag;w.__mlRR={};w.__mlDG={};mlWheelDrag(w,.015,0);}w.surfRR=w.__mlRR;w.surfDrag=w.__mlDG;}else if(w.__rr0){w.surfRR=w.__rr0;w.surfDrag=w.__dg0;w.__rr0=null;}
    w.mlOn=false;if(w.mlClog===undefined){w.mlClog=0;w.mlWet=0;}
    if(!w.contact){w.mlFz=0;continue;}
    const fi=(w.cp[0]-MLS.x0)/MLS.C,fj=(w.cp[2]-MLS.z0)/MLS.C;if(fi<8||fj<8||fi>MLS.N-8||fj>MLS.N-8){w.mlGrip=1;if(MLS.terra)mlWheelDrag(w,.015,0);continue;}
    const W=mlWeights(w.cp[0],w.cp[2],MLW),wd=W.wl-(w.cp[1]-MLS.h0),S=mlParams(W,wd>0?.6:0),wR=Math.abs(w.w*w.R),clayWet=W.clay*sst(.35,.7,W.moist);w.mlOn=true;w.mlWd=wd;w.mlWdT=MLS.clock;w.mlWdE=wd>.015?Math.min(wd,mlStand(w.cp[0]+sax,w.cp[2]+saz)):wd;
    /* (the tread (Mud Lab 6): how well its lugs bite into soft soil against a mud-terrain's, from the engine's own grip in
       mud: 1 for the Rock & Mud's mud-terrains, .69 for his SUV's all-seasons; a fine tread packs with clay sooner and
       throws it out later) */
    const lug=mlLug((w.front||!t.c.treadR)?t.c.tread:t.c.treadR);
    /* wet clay packs into the tread as it rolls; spinning throws it out; other ground wears it off */
    const roll=Math.min(1,Math.abs(w.vl)/3);w.mlClog=Math.max(0,Math.min(1,w.mlClog+dt*(clayWet*.32*roll*(wd<.05?1:.2)/Math.pow(lug,1.5)-w.mlClog*(Math.max(0,wR-5)*.09*lug*lug+(1-clayWet)*.12+(wd>.1?.3:0)))));
    w.mlGrip=S.grip*(1-.5*w.mlClog)*(wd>.05?.92:1);
    /* (Mud Lab 10) tyres aired down (src/ml-recover.js; nothing at road pressure): a longer footprint grips soft and
       slick ground better, and costs a little on firm ground */
    const A=t.mlAir,soft=A?Math.max(sst(.03,.12,S.D),sst(1,.6,S.grip),W.sand*.9*(1-S.m)):0;if(A)w.mlGrip*=1+A.g*soft;
    /* soil science: the soil's strength over the contact patch (which grows as the tyre sinks), the tread's lugs biting
       into it; the work of pushing through it, more the deeper the tyre is in */
    const z=Math.max(0,-mlRut(fi|0,fj|0))+.01,L=((MLS.terra?ML_T.L0:.16)+Math.sqrt(2*w.R*z))*(A?A.kL:1),Ar=(w.front?t.c.tyreW:t.c.tyreWR)*L,Fz=Math.max(800,w.Fz);zS+=z;nZ++;w.mlZ=z;
    {const gW=t.world&&t.world.grip?(t.world.grip[w.surf]??1):1;w.mlMuT=Math.max(.08,Math.min(ML_T.cap*gW,ML_T.mu*gW*(1-.4*w.mlClog)*(S.c*1000*Ar/Fz*lug*(ML_T.lf?Math.min(1,w.Fz/(m*9.81/4*.8)):1)+Math.tan(S.phi*Math.PI/180)*(.85+.15*lug))*(wd>.05?.9:1)*(A?1+A.g*W.sand*.9*(1-S.m):1)));}
    if(MLS.terra){const kz=ML_T.rr*Math.sqrt(z/w.R);mlWheelDrag(w,.015+kz,kz*ML_T.rv*S.m);res+=w.Fz*kz*(1+ML_T.rv*S.m*Math.abs(w.vl));}
    if(A&&A.rr){const dv=Math.min(Math.abs(w.vl),A.rr*2.45*(1-soft)*dt)*Math.sign(w.vl),fx=w.f[0],fz=w.f[2],fl=Math.hypot(fx,fz)||1;t.v[0]-=fx/fl*dv;t.v[2]-=fz/fl*dv;}
    /* tyres come out of water or wet mud wet, and dry as they roll on */
    const wetSoil=W.moist*Math.max(W.silt+W.peat+W.clay*.6,.4);if(wd>.01||wetSoil>.55)w.mlWet=1;else w.mlWet=Math.max(0,w.mlWet-dt*(.04+.025*Math.abs(w.vl)));
    if(w.mlWdE>.03){const mv=Math.hypot(t.v[0],t.v[2])+Math.abs(wR-Math.abs(w.vl))*.4;w.mlWk=(w.mlWk||0)+mv*dt;
      if(w.mlWk>.7&&MLS.clock-MLWK.t>.11){w.mlWk=0;const tv=Math.hypot(t.v[0],t.v[2]);mlWake(w.cp[0],w.cp[2],Math.min(1,.35+mv*.16)*Math.min(1,wd/.1)*(t===GAME.car?1-.5*sst(1.2,3.5,tv):1),Math.sqrt(9.81*Math.max(.03,Math.min(wd,1))));}}
    mlStamp(t,w,dt,S,W);if(!reduce)mlThrow(t,w,dt,S,W,wd);
    if(clayWet>.4&&roll>.2)GAME.dirt=Math.min(1,GAME.dirt+dt*.012*clayWet);}
  /* the belly in the mud (Mud Lab 6): sunk deeper than the body's underside sits above the tyres' bottoms, the axles and
     the floor plough the soil between the ruts; soft soil pushes back on them as on a blade (its stickiness over the
     buried depth, and its weight); his SUV's underside is 24 cm up, the Rock & Mud's 49 */
  if(nZ>=2&&t.__mlClr!==undefined){const pen=zS/nZ-(t.__mlClr-.07);MLS.plough=0;
    if(pen>0){const W=mlWeights(t.p[0],t.p[2],MLW),S=mlParams(W),F=Math.min(.6*m*9.81,1.2*pen*(S.c*1000*4+9000*pen)),vx=t.v[0],vz=t.v[2],vl=Math.hypot(vx,vz);
      if(vl>1e-3){const dv=Math.min(vl,F/m*dt);t.v[0]-=vx/vl*dv;t.v[2]-=vz/vl*dv;}MLS.plough=F;res+=F;}}
  MLS.res=res;
}
/* ---------- the graphics card's soil: a window of 24 x 24 squares round the truck, wrapping as it moves ---------- */
function mlWindow(){const c=GAME.car;if(!c)return;const cs=MLS.T*MLS.C,ci=Math.floor((c.p[0]-MLS.x0)/cs),cj=Math.floor((c.p[2]-MLS.z0)/cs),H=MLS.NW/MLS.T/2;
  if(ci===MLS.wc[0]&&cj===MLS.wc[1])return;const old=MLS.wc.slice();MLS.wc=[ci,cj];
  /* (the squares coming in, nearest first; the ones already waiting stay in the queue after them) */
  const L=[];for(let tj=cj-H;tj<cj+H;tj++)for(let ti=ci-H;ti<ci+H;ti++){if(ti<0||tj<0||ti>=MLS.NT||tj>=MLS.NT)continue;
    if(Number.isFinite(old[0])&&ti>=old[0]-H&&ti<old[0]+H&&tj>=old[1]-H&&tj<old[1]+H)continue;L.push([Math.max(Math.abs(ti-ci),Math.abs(tj-cj)),tj*MLS.NT+ti]);}
  L.sort((a,b)=>a[0]-b[0]);const rest=[...MLS.up];MLS.up.clear();for(const [,q] of L)MLS.up.add(q);for(const q of rest)MLS.up.add(q);
  /* (the first time, and after a jump (a reset, a swap, the map's JUMP: Mud Lab 6), the squares under and round the
     truck before anything is drawn, so the patch never shows another place's ground) */
  const first=!Number.isFinite(old[0]),jump=!first&&Math.max(Math.abs(ci-old[0]),Math.abs(cj-old[1]))>2;
  if(first||jump){const R=first?6:4,keep=[];for(const q of MLS.up){const ti=q%MLS.NT,tj=(q/MLS.NT)|0;if(Math.max(Math.abs(ti-ci),Math.abs(tj-cj))<=R)keep.push(q);}
    const save=mlUploadCap;mlUploadCap=1e9;const all=MLS.up;MLS.up=new Set(keep);mlUpload();mlUploadCap=save;for(const q of keep)all.delete(q);MLS.up=all;}}
let mlUploadCap=4;const MLBC=new Map();
function mlUpload(){
  const T=MLS.T,n=T*T,H=MLS.NW/T/2,[ci,cj]=MLS.wc,LU=MLS.lut,DL=MLS.dlut,hb=MLS.hb,db=MLS.db,C=MLS.C,nw=MLS.nw;let up=0;const t0=performance.now();
  for(const q of MLS.up){if(up>=(mlUploadCap>1e8?1e9:40)||performance.now()-t0>mlUploadCap)break;MLS.up.delete(q);const ti=q%MLS.NT,tj=(q/MLS.NT)|0;
    if(ti<ci-H||ti>=ci+H||tj<cj-H||tj>=cj+H)continue;up++;
    const t=MLS.tiles[q],sx=(ti*T)%MLS.NW,sz=(tj*T)%MLS.NW,x0=MLS.x0+(ti*T+.5)*C,z0=MLS.z0+(tj*T+.5)*C;
    /* (Mud Lab 22.3: a spot whose rut is still filling sends -1 (no water yet) to -2 (full) in place of when it was last
       wet: src/ml-look.glsl reads both) */
    const ft=t&&t.ft,now=MLS.clock;
    /* (the ground's own height and the trails' ruts never change: worked out once per square and kept for the next time
       it comes into the window (Mud Lab 6: up to 600 squares, 16 KB each)) */
    let bc=MLBC.get(q);if(!bc){bc=new Uint16Array(n*2);for(let j=0;j<T;j++)for(let i=0;i<T;i++){const k=j*T+i;bc[k*2]=mlHalf(mlBase(x0+i*C,z0+j*C));bc[k*2+1]=mlHalf(ML_TR);}
      MLBC.set(q,bc);if(MLBC.size>600)MLBC.delete(MLBC.keys().next().value);}
    for(let k=0;k<n;k++){const o=k*4;db[o]=bc[k*2];db[o+3]=bc[k*2+1];
      if(t){hb[o]=mlHalf(t.r[k]);hb[o+1]=LU[t.ch[k]];hb[o+2]=LU[t.pr[k]];hb[o+3]=ft&&now-ft[k]<2.6&&now>=ft[k]?mlHalf(-1-Math.min(1,Math.max(0,(now-ft[k]-.3)/2.2))):mlHalf(t.wt[k]);db[o+1]=DL[t.dr[k*2]];db[o+2]=DL[t.dr[k*2+1]];}
      else{hb[o]=hb[o+1]=hb[o+2]=0;hb[o+3]=nw;db[o+1]=db[o+2]=0;}}
    gl.activeTexture(gl.TEXTURE0+ML_U0);gl.bindTexture(gl.TEXTURE_2D,MLS.w0);gl.texSubImage2D(gl.TEXTURE_2D,0,sx,sz,T,T,gl.RGBA,gl.HALF_FLOAT,hb);
    gl.activeTexture(gl.TEXTURE0+ML_U0+1);gl.bindTexture(gl.TEXTURE_2D,MLS.w1);gl.texSubImage2D(gl.TEXTURE_2D,0,sx,sz,T,T,gl.RGBA,gl.HALF_FLOAT,db);}
  if(up)gl.activeTexture(gl.TEXTURE0);MLS.stat.up=up;}

/* the soil's four textures sit on four texture units of their own, high up where nothing else binds (27 to 30), held
   there for good: blank ones until the world is laid out (G.finish wrapped once, at the land's programs' making) */
let ML_BLANK=null,ML_U0=27;
function mlBlank(){if(!ML_BLANK){ML_BLANK=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,ML_BLANK);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,1,1,0,gl.RGBA,gl.HALF_FLOAT,new Uint16Array(4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);}return ML_BLANK;}
const ML_SAMP=['uMLt','uMLd','uMLs0','uMLs1'];
function mlBindUnits(){const X=[MLS.w0,MLS.w1,MLS.s0,MLS.s1];for(let q=0;q<4;q++){gl.activeTexture(gl.TEXTURE0+ML_U0+q);gl.bindTexture(gl.TEXTURE_2D,X[q]||mlBlank());}gl.activeTexture(gl.TEXTURE0);}
function mlHookUse(G){if(G._mlu)return;G._mlu=1;ML_U0=Math.min(27,gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)-4);const f0=G.finish;
  G.finish=P=>{const was=P.ready,r=f0(P);
    /* (the program's other samplers back on the units they had before these came along: other code binds to them) */
    if(!was&&P.samplers&&P.samplers.uMLt!==undefined){gl.useProgram(P.p);let n=0;
      for(const k of Object.keys(P.samplers)){const q=ML_SAMP.indexOf(k),u=q>=0?ML_U0+q:n++,l=gl.getUniformLocation(P.p,k);if(l)gl.uniform1i(l,u);P.samplers[k]=u;}mlBindUnits();}
    return r;};}
/* the land's uniforms for the soil (each lit pass): where the world is, the window, the patch, the time */
function mlUniforms(P){
  const G=R.G,on=MLS.ready?1:0;
  if(!APP.bigMap&&MLMV.open){MLMV.open=false;MLMV.whole=false;if(MLMV.btn)MLMV.btn.hidden=true;}
  if(on&&GAME.car){if(MLP.lvl!==GFX.level)mlPatchBuild();const c=GAME.car,A=WG.mlA,lim=MLS.WS/2+MLP.E;
    MLP.cx=Math.round(c.p[0]*2)/2;MLP.cz=Math.round(c.p[2]*2)/2;MLP.on=Math.abs(MLP.cx-A.x-A.cu)<lim&&Math.abs(MLP.cz-A.z-A.cv)<lim;}else MLP.on=false;
  const cs=MLS.T*MLS.C,wx=MLS.x0+(MLS.wc[0]+.5)*cs,wz=MLS.z0+(MLS.wc[1]+.5)*cs,half=(MLS.NW/MLS.T/2-1)*cs;
  G.uni(P,'uMLo',[MLS.x0-RO[0],MLS.z0-RO[2],1/MLS.WS,on]);G.uni(P,'uMLw',[wx-RO[0],wz-RO[2],1/(MLS.NW*MLS.C),Number.isFinite(wx)?half:-1]);
  G.uni(P,'uMLp',[MLP.cx-RO[0],MLP.cz-RO[2],MLP.E,MLP.on?1:0]);G.uni(P,'uMLq',[1/MLS.NW,MLS.C,MLS.h0-RO[1],on?mlNow():0]);G.uni(P,'uMLv',0);
  /* (Mud Lab 8, src/ml-look.glsl) how far the trees are drawn: past it the woods' floor is painted as their canopy; and
     where his ground pictures fade to their own colour (metres across a pixel: by how sharply this tier filters them) */
  {const f=GFX.level==='mobile'?Math.min(GFX.q.propD,BUDGET.treeD):GFX.q.propD,a=GFX.q.texAniso||4;G.uni(P,'uMLf',[f*.72,f*.97,.06*a,.25*a]);}
  mlBindUnits();
}
/* the patch, and the water, after the chunks' ground (the main pass only) */
function mlPatchDraw(u){
  if(!MLS.ready||!MLP.mesh)return 0;let tris=0;
  if(MLP.on){if(u.uMLv)gl.uniform1f(u.uMLv,1);atM(u,MLP.cx,0,MLP.cz);drawMesh(MLP.mesh);if(u.uMLv)gl.uniform1f(u.uMLv,0);tris+=MLP.mesh.tris;}
  if(MLP.water){atM(u,WG.mlA.x,MLS.h0,WG.mlA.z);drawMesh(MLP.water);tris+=MLP.water.tris;}
  /* (Mud Lab 22.3 water) the worked-out water (mlRipple): its points' lift, height, slope and foam sent as they are
     now, and the sheet drawn 5 mm under its water's level, only with the soil's own program and only while there are
     ripples on it */
  if(u.uMLf&&u.uMLv&&MLRP.on&&MLRP.mesh&&MLRP.quiet<1.5&&MLRP.peak>.003){const R=MLRP;
    if(R.dirty&&R.u0<=R.u1){const a=R.u0*R.n,m=(R.u1-R.u0+1)*R.n;gl.bindBuffer(gl.ARRAY_BUFFER,R.mesh.bufs[2]);gl.bufferSubData(gl.ARRAY_BUFFER,a*16,R.col,a*4,m*4);gl.bindBuffer(gl.ARRAY_BUFFER,R.mesh.bufs[4]);gl.bufferSubData(gl.ARRAY_BUFFER,a*8,R.uv,a*2,m*2);R.u0=1;R.u1=0;}R.dirty=false;
    gl.uniform1f(u.uMLv,2);atM(u,R.ox,MLS.h0+R.lv-.005,R.oz);drawMesh(R.mesh);gl.uniform1f(u.uMLv,0);tris+=R.mesh.tris;}
  return tris;}
/* the world raked smooth again (K on a keyboard; the test tools) */
function mlRake(){if(!MLS.ready)return;for(let q=0;q<MLS.tiles.length;q++)if(MLS.tiles[q]){MLS.tiles[q]=null;MLS.up.add(q);}MLS.ntile=0;MLS.act.clear();}
addEventListener('keydown',e=>{if(GAME.state!=='drive'||e.repeat)return;if(mlkIs('rake',e))mlmClear();if(mlkIs('grip',e))mlGripToggle();});
/* for the test tools */
function mlStats(){if(!MLS.ready)return {ready:false};let mn=0,mx=0,ch=0,pr=0,br=0,wet=0;const now=mlNow();
  for(const t of MLS.tiles){if(!t)continue;for(let k=0;k<4096;k++){const r=t.r[k];if(r<mn)mn=r;if(r>mx)mx=r;if(t.ch[k]>60)ch++;if(t.pr[k]>60)pr++;if(t.fl[k]&1)br++;if(now-t.wt[k]<60)wet++;}}
  const a=MLS.C*MLS.C,c=GAME.car;let here=null;if(c){const W=mlWeights(c.p[0],c.p[2],{});here={main:mlParams(W).main,moist:+W.moist.toFixed(2),place:GAME.place,mu:c.wheels.map(w=>+(w.mlMuT||0).toFixed(2)).join(','),waterCm:+(Math.max(0,MLS.wd||0)*100).toFixed(0),clog:c.wheels.map(w=>+(w.mlClog||0).toFixed(2)).join(','),grip:c.wheels.map(w=>+(w.mlGrip||1).toFixed(2)).join(',')};}
  return {ready:true,ms:Math.round(MLS.ms),prepMs:Math.round(MLS.pms||0),prepWorkers:MLS.pwn||0,prepBandsHere:MLS.pmine||0,prepBands:MLS.pb?MLS.pb.length:0,waterTris:MLP.water?MLP.water.tris:0,terra:MLS.terra,blocks:MLS.blocks.size,squares:MLS.ntile,mb:+(MLS.ntile*4096*14/1048576).toFixed(1),deepestCm:+(-mn*100).toFixed(1),bermCm:+(mx*100).toFixed(1),churnedM2:+(ch*a).toFixed(1),pressedM2:+(pr*a).toFixed(1),
    brokenM2:+(br*a).toFixed(1),wetTrackM2:+(wet*a).toFixed(1),dugLitres:+(MLS.stat.dug*1000).toFixed(1),clods:MLS.stat.clods,splash:MLS.stat.splash,fx:FX.length,patch:MLP.mesh?MLP.mesh.tris:0,water:MLP.water?MLP.water.tris:0,settling:MLS.act.size,here};}


/* ---------- the grip switch: game grip or soil science (G; on the big map, a button) ---------- */
function mlGripToggle(){MLS.terra=!MLS.terra;try{localStorage.setItem('mudlab:terra',MLS.terra?'1':'0');}catch(_){}
  say(MLS.terra?'Grip: SOIL SCIENCE':'Grip: GAME',1.8,MLS.terra?PAL.gold:PAL.cyan);if(MLS.gripBtn)MLS.gripBtn.textContent=mlGripLabel();}
const mlGripLabel=()=>'Grip: '+(MLS.terra?'Soil science':'Game');
try{MLS.terra=localStorage.getItem('mudlab:terra')==='1';}catch(_){}
/* ---------- the map: painted from the world's own ground, everything on it from the start ---------- */
const MLPM={r:0,g:0,b:0,m(w,R,G,B){this.r+=(R-this.r)*w;this.g+=(G-this.g)*w;this.b+=(B-this.b)*w;}};
function mlPaintMap(){
  const M=MLS.NM,M2=M*M,map=new Uint32Array(M2),cl=(a,b,t)=>a+(b-a)*t;
  for(let j=0;j<M;j++)for(let i=0;i<M;i++){const k=j*M+i,mo=MLS.cMo[k]/255,cy=MLS.cM[k]/255,si=MLS.cM[M2+k]/255,pe=MLS.cM[2*M2+k]/255,sa=MLS.cM[3*M2+k]/255,gr=MLS.cG[k]/255,wd=MLS.cWd[k]/255,tr=MLS.cTr[k]/255;
    /* the ground's own colour: loam by how wet; clay, silt, peat, sand over it; sod; the woods; the trails; the water */
    let r=cl(176,100,mo),g=cl(118,66,mo),b=cl(74,42,mo);
    /* (each layer laid over: written out, not a little function made for every dot) */
    MLPM.r=r;MLPM.g=g;MLPM.b=b;
    MLPM.m(cy,cl(196,118,mo),cl(178,100,mo),cl(142,78,mo));MLPM.m(si,cl(170,96,mo),cl(152,84,mo),cl(120,62,mo));MLPM.m(pe,58,52,32);MLPM.m(sa,cl(222,170,mo),cl(176,128,mo),cl(116,82,mo));
    MLPM.m(gr*.85,cl(170,96,mo),cl(160,128,mo),cl(84,58,mo));MLPM.m(wd*.9,34,64,34);MLPM.m(tr*.9,218,196,150);
    const wl=MLS.cW[k],h=MLS.cB[k];if(wl>h)MLPM.m(Math.min(1,.55+(wl-h)*1.2),42,62,70);r=MLPM.r;g=MLPM.g;b=MLPM.b;
    /* hill shade, the light from the north-west */
    const hx=MLS.cB[j*M+Math.min(M-1,i+1)]-MLS.cB[j*M+Math.max(0,i-1)],hz=MLS.cB[Math.min(M-1,j+1)*M+i]-MLS.cB[Math.max(0,j-1)*M+i],sh=Math.max(.6,Math.min(1.35,1+(hx+hz)*-.12));
    map[k]=pack(r*sh,g*sh,b*sh,255);}
  MLS.map=map;MLS.mapC=null;}
/* the corner map and the big map read it (instead of the chunks you've seen) */
function mlMapFill(X0,Y0,n,cx0,cz0,mpp,keep){
  const M=MLS.NM,out=pack(70,82,52,255);{const a=Math.max(0,Y0),b=Math.min(BH,Y0+n);if(b>a)hMark(a,b);}
  /* (the big map doesn't move: its picture made once for its size, then copied in a row at a time (Mud Lab 6: it was
     redrawn dot by dot every frame, 25 ms of a laptop's frame)) */
  if(keep&&MLS.map){const key=n+','+cx0+','+cz0+','+mpp;let C=MLS.mapC;
    if(!C||C.key!==key){const img=new Uint32Array(n*n);for(let j=0;j<n;j++){const z=cz0+(j+.5-n/2)*mpp,mj=Math.floor((z-MLS.z0)/MLS.CM);
        for(let i=0;i<n;i++){const x=cx0+(i+.5-n/2)*mpp,mi=Math.floor((x-MLS.x0)/MLS.CM);img[j*n+i]=mi<0||mj<0||mi>=M||mj>=M?out:MLS.map[mj*M+mi];}}
      C=MLS.mapC={key,img};}
    const i0=Math.max(0,-X0),i1=Math.min(n,BW-X0);if(i1<=i0)return;
    for(let j=0;j<n;j++){const Y=Y0+j;if(Y<0||Y>=BH)continue;HB.set(C.img.subarray(j*n+i0,j*n+i1),Y*BW+X0+i0);}
    return;}
  for(let j=0;j<n;j++){const Y=Y0+j;if(Y<0||Y>=BH)continue;const o=Y*BW+X0,z=cz0+(j+.5-n/2)*mpp,mj=Math.floor((z-MLS.z0)/MLS.CM);
    for(let i=0;i<n;i++){const X=X0+i;if(X<0||X>=BW)continue;const x=cx0+(i+.5-n/2)*mpp,mi=Math.floor((x-MLS.x0)/MLS.CM);
      HB[o+i]=mi<0||mj<0||mi>=M||mj>=M?out:MLS.map[mj*M+mi];}}}
/* (Mud Lab 19) the big map at two scales. It opens as it always was, a mile across with every name on it, on the
   ground round where you are (the map has four times the ground now, and all of it at once is too small for its
   names on a phone); WHOLE MAP, a button beside it, shows all two miles with the main places' names only; CLOSE UP
   goes back. mlMapView(): which is showing, its middle (u, v) and how many metres it is across */
const MLMV={open:false,whole:false,cu:0,cv:0,span:0,btn:null};
function mlMapView(){const A=WG.mlA,V=MLMV,full=MLS.WS*1.06;
  if(!V.open){V.open=true;const t=GAME.car,half=full/4,lim=full/2-half;V.tu=t?Math.max(A.cu-lim,Math.min(A.cu+lim,t.p[0]-A.x)):0;V.tv=t?Math.max(A.cv-lim,Math.min(A.cv+lim,t.p[2]-A.z)):0;}
  if(V.whole){V.cu=A.cu;V.cv=A.cv;V.span=full;}else{V.cu=V.tu;V.cv=V.tv;V.span=full/2;}return V;}
/* (is a place's name on the map as it is showing: in the close-up, the ones inside it; on the whole map, the main ones) */
function mlMapHas(p,u,v){const V=MLMV;return V.whole?!!p:Math.max(Math.abs(u-V.cu),Math.abs(v-V.cv))<V.span/2*.97;}
function mlMapBtn(){const V=MLMV;let b=V.btn;if(!b){b=V.btn=document.createElement('button');b.type='button';b.id='mlWhole';
    b.style.cssText='position:fixed;right:calc(50% + 48vh + 8px);top:calc(50% + 24px);z-index:62;font:600 13px system-ui,sans-serif;letter-spacing:.05em;padding:9px 16px;border-radius:999px;border:1px solid rgba(242,230,210,.4);background:rgba(20,14,9,.82);color:#f2e6d2;cursor:pointer';
    b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();V.whole=!V.whole;if(typeof MLV!=='undefined'){MLV.sel=null;if(MLV.jb)MLV.jb.hidden=true;}});document.body.appendChild(b);}
  const tx=V.whole?'CLOSE UP':'WHOLE MAP';if(b.textContent!==tx)b.textContent=tx;if(b.hidden)b.hidden=false;}
function mlBigMap(){
  const A=WG.mlA,size=Math.min(H-14,W-14)|0,x0=Math.round((W-size)/2),y0=Math.round((H-size)/2),n=size*HS,V=mlMapView(),span=V.span;
  hRect(0,0,W,H,pack(0,0,0,110));hRect(x0-2,y0-2,size+4,size+4,pack(0,0,0,225));
  mlMapFill(x0*HS,y0*HS,n,A.x+V.cu,A.z+V.cv,span/n,true);mlMapBtn();
  const toM=(u,v)=>[x0+size/2+(u-V.cu)/span*size,y0+size/2+(v-V.cv)/span*size];
  for(const [name,u,v,kind,big] of WG.mlPlaces){if(!mlMapHas(big,u,v))continue;const [a,b]=toM(u,v),col=kind==='trail'?pack(240,226,190,255):kind==='water'||kind==='ford'?PAL.cyan:kind==='camp'?PAL.gold:PAL.ink;
    if(kind!=='trail')hDisc(a,b,1.3,col);otxt3(name,a+3,b-6,col);}
  if(typeof mlvMap==='function')mlvMap(toM);
  const t=GAME.car;{const [a,b]=toM(t.p[0]-A.x,t.p[2]-A.z);if(Math.max(Math.abs(a-x0-size/2),Math.abs(b-y0-size/2))<size/2)mapArrow(a,b,1.3);}
  hFrame(x0-2,y0-2,size+4,size+4,pack(255,255,255,70));
  otxt3(V.whole?'MUD LAB  ALL OF IT: 10,000 FT ACROSS':'MUD LAB  5,000 FT OF ITS 10,000',x0+3,y0+3,PAL.ink);otxt3(GAME.touch?'TAP TO CLOSE':mlkName('map')+' TO CLOSE',x0+3,y0+size-8,PAL.dim);
  otxt3((MLS.terra?'GRIP: SOIL SCIENCE':'GRIP: GAME')+(GAME.touch?'':'  ('+mlkName('grip')+')'),x0+size-3,y0+size-8,MLS.terra?PAL.gold:PAL.cyan,1,'r');
  /* (on a phone, the switch for the grip under the map) */
  if(GAME.touch){let b=MLS.gripBtn;if(!b){b=MLS.gripBtn=document.createElement('button');b.type='button';b.id='mlGrip';
      b.style.cssText='position:fixed;right:calc(env(safe-area-inset-right) + 12px);top:calc(50% - 84px);z-index:60;font:600 14px system-ui,sans-serif;letter-spacing:.06em;padding:10px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(20,14,9,.75);color:#f2e6d2';
      b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();mlGripToggle();});document.body.appendChild(b);}
    b.textContent=mlGripLabel();b.hidden=false;}
}
/* the land's full program (landSoil: the soil painted, the water) compiles in the background; the title waits only for
   the plain one (Mud Lab 6, from the review). Checked every 16 frames (a round trip to the graphics process); when the
   driver has it, it takes over for every pass. Until then the world is drawn in the engine's own ground colours */
let ML_PRN=0;
/* (for the tests: #nosoil holds the full ground back, to see the plain one a laptop shows while it builds) */
if(/nosoil/.test(location.hash))MLS.noSoilFS=true;
function mlSoilPromote(){const G=R&&R.G;if(!G||!P_LANDML||P_LANDML===P_LAND||MLS.noSoilFS)return;
  if(!P_LANDML.ready){if((++ML_PRN&15)||ML_PRN<16)return;const par=G.ext.par;
    if(par){if(!gl.getProgramParameter(P_LANDML.p,par.COMPLETION_STATUS_KHR))return;}else if(performance.now()<(BOOT.menu||0)+3000)return;
    try{G.finish(P_LANDML);}catch(e){console.warn('the soil shader would not build here: the ground stays plain. '+(e&&e.message||e));MLS.noSoilFS=true;return;}}
  MLS.lite=P_LAND;P_LAND=P_LANDML;MLS.soilFS=performance.now();if(R)R.resetTAA=true;
  if(MLS.soilWait&&GAME.state==='drive')say('THE GROUND\'S DETAIL IS READY',2.5);}
/* (at Start, if the full ground isn't built yet (a Windows laptop the first time): say so, so plain ground isn't a surprise) */
function mlSoilNote(){
  /* (Mud Lab 19: START with the world's layer still being filled: say so, once; it is seconds. And the driver's line
     waits for the layer: until it is full the plain ground is the layer's doing, and the line above has said so) */
  let lay=false,drv=false;
  for(const ms of [300,1000,2000])setTimeout(()=>{if(!lay&&MLS.prep<2&&GAME.state==='drive'){lay=true;say('LAYING OUT THE GROUND: THE SOIL IS A MOMENT AWAY',3);}},ms);
  for(const ms of [1500,4500,9000])setTimeout(()=>{if(drv||MLS.prep<2)return;drv=true;if(P_LANDML&&P_LAND!==P_LANDML&&!MLS.noSoilFS&&GAME.state==='drive'){MLS.soilWait=true;
  /* (Mud Lab 20: the laptop's line is 128 letters, and a phone's screen holds about 105: it ran off both edges) */
  say(GAME.touch?'THE GROUND\'S DETAIL IS STILL BEING BUILT: PLAIN GROUND FOR A MOMENT':'THE GROUND\'S DETAIL IS STILL BEING BUILT BY THE GRAPHICS DRIVER: PLAIN GROUND UNTIL IT\'S READY (SLOW THE FIRST TIME ON A LAPTOP)',6);}},ms);}
window.__ml={MLS,MLP,MLMV,MLWK,MLRP,mlStand,ML_INTAKE,mlUnder,mlUnderEnv,ML_T,mlStats,mlRake,mlGround,ML_SOIL,mlWeights,mlParams,mlGripToggle,mlBase,mlWL,land:()=>({cur:P_LAND&&P_LAND.name,soil:P_LANDML&&P_LANDML.ready,at:MLS.soilFS,no:MLS.noSoilFS})};
/* the world's ground every 2.56 m made a slice at a time while the title is up */
{let mlPrepE=0;const mlPrepT=setInterval(()=>{try{if(WG&&WG.mlA&&mlPrepStep(GAME.hold?20:MLS.pw?5:10))clearInterval(mlPrepT);}catch(e){if(++mlPrepE>3){console.warn('soil prep: '+(e&&e.message||e));clearInterval(mlPrepT);}}},25);}
