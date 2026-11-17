/* =====================================================================================
   MUD LAB 22.4, ALTERNATE MAP 1: THE MUD PARK (put inside the engine's world generator by src/build.py, so the
   background worker that makes the land has it too: it may use only the generator's own helpers, sst, vn, fbm, hs, SF,
   rimAt). Everything technical is Mud Lab 22.4's (the soil, the water, the SUVs, the winch and the strap); only the
   ground is new. One mile square (1,536 m), every spot a soil and a moisture, as before. u east, v south of the
   middle, metres:
     the Pits (south): a packed pad where you start and where the others wait
     the Bog (west of the Pits): a firm run-up 1,080 ft long, then two measured lanes side by side, 400 ft each, that
       get evenly deeper all the way: the MUD LANE (soft silt and clay, water from a quarter of the way in) and the
       WATER LANE (a firm bed, 7 ft of water at its end). Where you stop is your mark; the faster you come in, the further
     the Braids: the river through the middle, 400 ft wide: a chain of sand bars and flat-bottomed pools, each pool a
       little deeper than the last (15 in at the top, 27 in at the bottom; half that along the white bank): deep enough
       for a full bow wave, never deep enough to drown an engine or float a SUV off its wheels. Cross anywhere, or run it lengthways. Along its south-east side the Sloughs: soft,
       dark, silty bars and backwaters that swallow a SUV, and no tree within a winch line's reach
     the Narrows (north): the river before it spreads, deep, wooded banks; the Upper Ford across it
     the White Dunes (north-west): gypsum-white dunes up to 130 ft, long easy backs and steep slip faces; Big White
     the White Marsh (between the dunes and the river): a white clay flat, hard crust at its rim, slick wet clay and a
       sheet of still water an inch or two deep in its middle, soft channels through it
     the Bluff (east): 200 ft up, a steep face over the river bottoms, an easy back slope from the south; the Overlook
       on its rim, the Hill Climb up its face
     the Gumbo Woods (under the Bluff): wet clay bottoms, trees to winch to; the HARD trail
     the home field (round the Pits): sod, clay flats, the Mud Pit; the EASY trail
     the bank all round (a dune ridge round the white corner), country beyond
   ===================================================================================== */
/* (x, z: where u = 0, v = 0 is in the world; h: half the square's side; cu, cv: its middle; m: the blend into the
   country beyond; old: as h (Mud Lab's first map grew; this one is its own square)) */
const ML_A={x:0,z:1200,h:768,cu:0,cv:0,m:140,h0:2,old:768};
/* how far out a spot is: 768 on the square's edge all round, less inside */
const ML_E=(u,v)=>Math.max(Math.abs(u),Math.abs(v));
const ML_NONE=-99,ML_CL=-.35;          /* the river's water level over the valley's floor; no water */
/* a smooth line through waypoints, a point every 4 m (Catmull-Rom) */
function mlLine(P){const o=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/4));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  o.push(P[P.length-1].slice());return o;}
/* ---------- THE RIVER: its middle line, a point every 10 m, north edge to west edge. Each waypoint: where (u, v), then
   hw half its width; ch how much of it is the chain of bars and pools (0 a plain channel, 1 the Braids); dp how deep
   a plain channel is in its middle; soft how soft a plain channel's bed is (0 firm sand .. 1 silt). Each point of
   the line carries those (eased from waypoint to waypoint) and, last, how far down the river it is (m) ---------- */
function mlRiver(P,step){const o=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3),q=[f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])],e=t2*(3-2*t);
      for(let c=2;c<6;c++)q.push(p1[c]+(p2[c]-p1[c])*e);o.push(q);}}
  o.push(P[P.length-1].slice(0,6));
  let s=0;for(let i=0;i<o.length;i++){if(i)s+=Math.hypot(o[i][0]-o[i-1][0],o[i][1]-o[i-1][1]);o[i].push(s);}
  return o;}
/*                          u     v   hw  ch   dp  soft */
const ML_RIVER=mlRiver([[ 130,-800, 20,  0, 1.9, .5],[ 150,-640, 20,  0, 2.0, .5],[ 128,-505, 24,  0, 1.7, .4],[ 110,-400, 38,  0, .34,  0],
                        [  70,-290, 52,  1, .45,  0],[ -20,-170, 60,  1, .45,  0],[-140, -40, 66,  1, .45,  0],[-270,  70, 66,  1, .45,  0],
                        [-410, 160, 60,  1, .45,  0],[-540, 215, 48,  1, .6,  .2],[-650, 240, 36,  0, 1.5, .7],[-800, 250, 32,  0, 1.8, .8]],10);
/* (where the chain starts and how long it is, along the river) */
const ML_CHAIN=(()=>{let a=-1,b=0;for(const p of ML_RIVER){if(p[3]>.5){if(a<0)a=p[6];b=p[6];}}return {s0:a,len:b-a,P:40,d0:.38,d1:.7};})();
/* ---------- the trails: worn two-tracks. The first three are graded and timed (THINGS TO DO) ---------- */
const ML_TRAILS=[
  {name:'Park Loop',pts:mlLine([[40,612],[150,590],[250,520],[290,420],[250,320],[160,270],[60,280],[0,340],[20,430],[40,520],[40,600]])},
  {name:'Slough Trail',pts:mlLine([[160,270],[100,170],[0,90],[-78,34],[-150,96],[-214,150],[-300,206],[-371,247],[-440,312],[-478,410],[-484,500]])},
  {name:'Gumbo Run',pts:mlLine([[250,320],[270,200],[252,80],[232,-40],[252,-160],[240,-280],[256,-400],[236,-520],[250,-640]])},
  {name:'Bluff Road',pts:mlLine([[70,640],[200,662],[340,672],[470,644],[570,560],[612,440],[624,300],[612,160],[588,30],[562,-90],[520,-176],[462,-200]])},
  {name:'Dune Road',pts:mlLine([[246,-340],[190,-392],[110,-400],[0,-420],[-120,-440],[-260,-470],[-372,-486]])},
  {name:'Marsh Track',pts:mlLine([[-236,-36],[-300,-150],[-332,-280],[-360,-400],[-372,-486]])}];
/* ---------- THE BOG: two measured lanes side by side, running east, at the end of one long firm run-up. u0 to u1: the
   lanes (122 m: 400 ft); run: the run-up's length; each lane: its middle (v), how deep its bed is at its far end (m,
   evenly from nothing at its start), where its water stands under the field (m), and its bed (soft: silt and clay; or
   firm sand; peat: how far down a soft lane its bed turns to peat, 1 for never). Tried with all four vehicles
   (docs/CHANGELOG.md): deeper mud took away what a fast run-in gains; a peat end bogged the Rock & Mud at 300 ft and
   let the stock SUV past it ---------- */
const ML_BOG={u0:-150,u1:-28,v:541,hw:4.2,run:330,lv:null,
  lanes:[{name:'MUD LANE',v:530,deep:1.05,wl:-.24,soft:1,peat:1},{name:'WATER LANE',v:552,deep:2.2,wl:-.05,soft:0}]};
/* the mud holes on the trails, each its own pool; and the Mud Pit. The recipes are Mud Lab 9's, graded there with both
   SUVs: EASY puddles 8 m long, 30 cm deep, mostly clay; MEDIUM longer and a little deeper; HARD pits 20 m long, 72 cm
   deep, all clay, in the woods (trees for the winch) */
const ML_HOLES=[];
(()=>{const add=(tr,f,L,W,d,c)=>{const P=ML_TRAILS[tr].pts,i=Math.max(1,Math.min(P.length-2,Math.round(f*(P.length-1)))),a=P[i-1],b=P[i+1],r=Math.atan2(b[1]-a[1],b[0]-a[0]),H={u:P[i][0],v:P[i][1],L,W,r,d,lv:null,tr};if(c!==undefined)H.c=c;ML_HOLES.push(H);};
  [[0,.1,4,4.6,.3,.8],[0,.24,4,4.6,.3,.8],[0,.4,4,4.6,.3,.8],[0,.56,4,4.6,.3,.8],[0,.72,4,4.6,.3,.8],[0,.88,4,4.6,.3,.8],
   [1,.16,8,4.6,.3],[1,.42,12,5,.4],[1,.63,8,4.6,.3],[1,.84,14,5,.45],
   [2,.46,10,5,.72,1],[2,.6,10,5,.72,1],[2,.75,10,5,.72,1],[2,.9,10,5,.72,1]].forEach(a=>add(...a));
  ML_HOLES.push({u:170,v:432,L:30,W:19,r:.35,d:.75,lv:null,big:1});})();
/* the Pits: a packed pad, level and dry */
const ML_PITS={u:20,v:642,a:52,b:26,lv:null};
/* ---------- THE HILL CLIMB (Mud Lab 14's, on the Bluff's face): a lane 10 m wide, loose dry sand, that gets steeper
   all the way: a0 degrees at its foot to a1 at its top, X metres on, with a rounded crest and a level landing. u, v:
   the middle of its foot; dx, dz: the way it runs (east, up the face). Sand because it is the one ground in this game
   with a real tyre's grip on it ---------- */
const ML_CLIMB=Object.assign({u:428,v:380,dx:1,dz:0,X:40,hw:5,a0:16,a1:28,top:12,h0:null,sand:.85},typeof ML_CLIMB_ENV==='object'&&ML_CLIMB_ENV||{});
/* (its height over its foot, x metres up it on the level; and its length along the slope to there) */
function mlClimbY(x){const C=ML_CLIMB,a=C.a0*Math.PI/180,b=C.a1*Math.PI/180;if(x<=0)return 0;
  const yX=C.X/(b-a)*Math.log(Math.cos(a)/Math.cos(b));if(x<=C.X)return C.X/(b-a)*Math.log(Math.cos(a)/Math.cos(a+(b-a)*x/C.X));
  const t=Math.min(4,x-C.X);return yX+4/b*Math.log(Math.cos(b*(1-t/4))/Math.cos(b));}
function mlClimbS(x){const C=ML_CLIMB,a=C.a0*Math.PI/180,b=C.a1*Math.PI/180;x=Math.max(0,Math.min(C.X,x));let s=0;const n=Math.max(1,Math.ceil(x/.25)),dx=x/n;for(let i=0;i<n;i++)s+=dx/Math.cos(a+(b-a)*(i+.5)*dx/C.X);return s;}
/* (what the game's other parts ask the world for that this map has none of: no jump lanes) */
const ML_X={jumps:[],river:ML_RIVER,chain:ML_CHAIN};
/* the places for the map: name, where, what (for its mark), and 1 for the main places */
const ML_PLACES=[['THE PITS',20,642,'camp',1],['THE BOG',-150,541,'hole',1],['RUN-UP',-470,541,'trail'],['MUD PIT',170,432,'hole'],
  ['THE BRAIDS',-140,-40,'ford',1],['THE SLOUGHS',-190,118,'bog'],['THE NARROWS',146,-640,'water',1],['UPPER FORD',110,-400,'ford'],['LOWER RIVER',-650,240,'water'],
  ['WHITE DUNES',-470,-380,'sand',1],['BIG WHITE',-520,-548,'hill'],['WHITE MARSH',-330,-160,'clay',1],
  ['THE BLUFF',600,-380,'hill',1],['OVERLOOK',452,-200,'hill'],['HILL CLIMB',ML_CLIMB.u-8,ML_CLIMB.v+14,'hill'],['GUMBO WOODS',250,-300,'bog'],
  ['EASY: PARK LOOP',250,520,'trail'],['MEDIUM: SLOUGH TRAIL',-300,206,'trail'],['HARD: GUMBO RUN',252,-160,'trail'],['BLUFF ROAD',612,440,'trail'],['DUNE ROAD',-120,-440,'trail'],['MARSH TRACK',-332,-280,'trail']];
/* ---------- quick nearest-line lookups: each line's segments in 32 m buckets ---------- */
const ML_RVPAD=170;
const ML_BK=32,ML_BO=ML_A.h+ML_A.m,ML_BN=Math.ceil(2*(ML_A.h+ML_A.m)/ML_BK)+2;
const ML_IDX={river:new Map(),trail:new Map()};
(()=>{const put=(M,ln,P,k)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],pad=k;
    const i0=Math.max(0,Math.floor((Math.min(a[0],b[0])-pad+ML_BO)/ML_BK)),i1=Math.min(ML_BN-1,Math.floor((Math.max(a[0],b[0])+pad+ML_BO)/ML_BK)),j0=Math.max(0,Math.floor((Math.min(a[1],b[1])-pad+ML_BO)/ML_BK)),j1=Math.floor((Math.max(a[1],b[1])+pad+ML_BO)/ML_BK);
    for(let j=j0;j<=j1;j++)for(let q=i0;q<=i1;q++){const key=j*ML_BN+q;let L=M.get(key);if(!L)M.set(key,L=[]);L.push(ln,i);}}};
  put(ML_IDX.river,0,ML_RIVER,ML_RVPAD);ML_TRAILS.forEach((t,n)=>put(ML_IDX.trail,n,t.pts,12));})();
function mlNear(M,lines,u,v,o){o.d=1e9;o.n=-1;const L=M.get(Math.floor((v+ML_BO)/ML_BK)*ML_BN+Math.floor((u+ML_BO)/ML_BK));if(!L)return o;
  for(let q=0;q<L.length;q+=2){const n=L[q],i=L[q+1],P=lines(n),a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],ll=ex*ex+ez*ez||1;let f=((u-a[0])*ex+(v-a[1])*ez)/ll;f=f<0?0:f>1?1:f;
    const dx=u-a[0]-ex*f,dz=v-a[1]-ez*f,d=dx*dx+dz*dz;if(d<o.d){o.d=d;o.n=n;o.i=i;o.f=f;}}
  o.d=Math.sqrt(o.d);return o;}
const ML_RV_F=n=>ML_RIVER,ML_TR_F=n=>ML_TRAILS[n].pts;
/* ---------- the shapes of the land ---------- */
/* the valley's floor: low swells */
function mlHills(u,v){return .9+2.4*fbm(u/260+3.1,v/260-1.7,3,901)+.5*fbm(u/60,v/60,2,902);}
/* the white country (the dunes and the marsh): how far into it a spot is, metres past its edge. Its edge follows the
   river's right bank: the river from the Upper Ford down lies within 9 m of a circle (middle -874.8, -807.2; radius
   1,068.7: tools/world/probe.js), and the white begins 80 m inside that circle, just past the right bank's beach.
   src/ml-look.glsl paints by the same circle */
function mlWhiteD(u,v){return 988.7-Math.hypot(u+874.8,v+807.2);}
/* the Bluff: where its face stands (the middle of its face, u, at this v), and how high its top is here (an easy back
   slope down to the south) */
/* (how white a spot is, 0 to 1: for the map and for what the tyres throw) */
function mlWhite(u,v){return sst(0,45,mlWhiteD(u,v)+16*(vn(u/37,v/37,832)-.5));}
function mlBluffU(v){return 430+50*Math.sin(v/230+.6)+60*(fbm(v/170,7.3,2,903)-.5);}
function mlBluffTop(v){return 60*sst(680,40,v);}
/* ---------- the ground before anything is built on it: height, soils, moisture, water, woods; and what the rest needs
   to know (how far into the white, the river, the bluff) ---------- */
const MLRV={d:0,n:-1,i:0,f:0},MLTQ={d:0,n:-1,i:0,f:0};
function mlLand(u,v,o){
  const n1=vn(u/9,v/9,831)-.5,n2=vn(u/37,v/37,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5,big=fbm(u/260,v/260,2,834)-.5;
  let h=mlHills(u,v),clay=0,silt=0,peat=0,sand=0,wl=ML_NONE,moist=.36+.12*n2+.1*big,wood=0,bare=0;
  const wD=mlWhiteD(u,v)+16*n2,white=sst(0,45,wD);
  /* THE RIVER: where this spot is against it: s how far down it, rB across it (under 0: its left bank looking
     downstream, the south-east side), and what the river is like here */
  mlNear(ML_IDX.river,ML_RV_F,u,v,MLRV);
  let rv=0,rD=1e9,rB=0,rS=0,rHW=0,rCh=0,rDp=0,rSoft=0;
  if(MLRV.n>=0){const P=ML_RIVER,a=P[MLRV.i],b=P[MLRV.i+1],f=MLRV.f,ex=b[0]-a[0],ez=b[1]-a[1];rv=1;rD=MLRV.d;
    rHW=a[2]+(b[2]-a[2])*f;rCh=a[3]+(b[3]-a[3])*f;rDp=a[4]+(b[4]-a[4])*f;rSoft=a[5]+(b[5]-a[5])*f;rS=a[6]+(b[6]-a[6])*f;
    rB=(ex*(v-a[1])-ez*(u-a[0])<0?-1:1)*rD;
    /* (its edges wander a little, so the banks aren't ruled lines) */
    rHW*=1+.12*(vn(rS/70,3,879)-.5);}
  /* its valley: flat floor for 60 m and more each side */
  const bot=rv?sst(170,70,rD+n2*30):0;h=h*(1-.8*bot)+.3*bot;moist+=.42*bot;
  /* THE BLUFF: uu is how far east of the middle of its face; a talus slope, then the steep upper face, then its top */
  const uu=u-mlBluffU(v)+26*(fbm(u/70,v/45,2,904)-.5),bt=mlBluffTop(v);let face=0,up=0;
  if(uu>-90&&bt>.01){const sh=.35*sst(-75,-5,uu)+.65*sst(-25,55,uu);up=sst(20,70,uu);face=sst(-70,-30,uu)*(1-up);
    h+=bt*sh+2.6*(fbm(u/150,v/150,2,905)-.5)*up;moist-=(.16*up+.1*face)*sst(4,20,bt);}
  /* the Gumbo Woods: the wet clay bottoms between the river's north reach and the Bluff's foot */
  const gum=sst(60,-60,v+60*n2)*sst(-40,-95,uu)*(rv?sst(10,40,-rB-rHW):u>130?1:0);
  if(gum>0){clay=Math.max(clay,.75*gum);moist=Math.max(moist,(.62+.2*sst(.4,.7,fbm(u/50,v/50,2,906)))*gum);wood=Math.max(wood,.85*gum);}
  /* clay flats and peat in the low wet spots of the valley's floor (not in the white) */
  {const lo=(1-white)*(1-up)*(1-face);clay=Math.max(clay,sst(.64,.78,fbm(u/90+7,v/90,2,843))*lo);
    peat+=bot*lo*sst(.58,.7,fbm(u/70,v/70,2,838))*sst(34,60,rD-rHW)*sst(-30,-90,uu);if(peat>.2)h-=.06*peat*(vn(u/2.2,v/2.2,839)-.3);}
  /* THE WHITE MARSH: wM how much of this spot is marsh. A flat of white clay a foot over the river. Its own water
     (level with its floor, so it lies an inch or two deep wherever the floor dips), soft channels through it, a dry
     crust at its rim */
  /* (the dunes die away before the square's edge: past it the engine paints the land its own colours, and a tall dune
     standing on the edge showed its far flank orange over the white) */
  const dn=sst(230,380,wD)*sst(716,630,ML_E(u,v)),wM=white*(1-dn)*sst(rHW+10,rHW+50,rD);
  let marsh=0;
  if(wM>.01){const cn=Math.abs(fbm(u/130+2.2,v/130,2,921)-.5),chn=sst(.035,.008,cn)*sst(.25,.8,wM),low=sst(.42,.62,fbm(u/150,v/150,2,922))*sst(.5,1,wM);
    const fl=.335+.04*n1+.02*n3-.11*low-.42*chn;h=h+(fl-h)*wM;
    if(wM>.5){wl=.3;marsh=1;}
    const wet=sst(.07,-.03,fl-.3);clay=Math.max(clay,wM*(1-.6*chn));silt=Math.max(silt,.7*chn*wM);moist=moist*(1-wM)+(.16+.84*wet)*wM;}
  /* THE WHITE DUNES: long ridges lying across the wind (it blows to the north-east), an easy back and a steep slip
     face, taller and shorter, their crests wandering; flat white hardpan between them; Big White, the tall one */
  let dune=0;
  if(dn>.01){const a=u*.75-v*.66,b=u*.66+v*.75,ph=a/118+1.7*(fbm(u/330+1.7,v/330,2,911)-.5)+.3*Math.sin(b/75+6.28*vn(a/210,3.3,912)),t=ph-Math.floor(ph),
      pf=t<.7?sst(0,.7,t):sst(1,.7,t),amp=15*(.3+1.15*fbm(u/190,v/190,2,913)),bw=Math.hypot(u+520,v+548)/125,bigW=26*Math.exp(-bw*bw);
    const hd=amp*pf+bigW*(.75+.25*pf)+1.6*(fbm(u/45,v/45,2,914)-.5);dune=dn;
    h=h*(1-dn)+(.6+hd)*dn;const pan=sst(.1,.02,pf)*sst(9,4,amp+bigW);
    sand=Math.max(sand,dn*(1-.5*pan));clay=clay*(1-dn)+.5*pan*dn;moist=moist*(1-dn)+(.06+.26*pan)*dn;}
  /* (the white bank of the river, and the white that is neither marsh nor dune: firm pale sand) */
  if(white>0){const rest=white*(1-Math.max(wM,dn));if(rest>0){sand=Math.max(sand,.8*rest);moist=moist*(1-.5*rest);}}
  /* THE RIVER'S BED AND BANKS */
  let slough=0,bar=0,rvWood=0;
  if(rv&&rD<rHW+90){const x=rB/rHW,ax=Math.abs(x);
    if(ax<1){
      /* a plain channel: deepest in its middle, shelving to each bank */
      let dep=rDp*Math.pow(Math.max(0,1-ax*ax),.6),sf=rSoft;
      if(rCh>.01){const C=ML_CHAIN,sc=rS-C.s0,pr=Math.max(0,Math.min(1,sc/C.len));
        /* THE CHAIN: every 40 m down the river a bar right across it, 8 m of flat top just out of the water (one in
           three just under it), a gentle ramp each side, and between two bars a flat-bottomed pool; each pool a
           little deeper than the last. The bars lie in waves across the river, not ruled */
        const q=sc/C.P+.34*Math.sin(rB/36+1.3)+.22*(vn(rB/27,sc/160,881)-.5),k=Math.floor(q),tc=Math.abs(q-k-.5)*2,br=sst(.55,.8,tc),
          top=hs(k,7,882)<.34?-.05:.06,
          /* (a pool is its full depth from the river's middle to the Sloughs' spit, and shallower toward the white
             bank: half as deep three quarters of the way over. The low rally car has a line to run there; the SUVs
             take the middle) */
          pd=(C.d0+(C.d1-C.d0)*pr)*(.92+.16*vn(sc/55,rB/30,883))*(.5+.5*sst(.75,-.05,x));
        let dc=pd*(1-br)-top*br;
        /* the main channel shelves up to the white beach on its right bank */
        dc=dc*sst(1,.8,x)-.04*sst(.8,1,x);
        /* THE SLOUGHS: the left third of it, behind a low spit: soft, dark silt; pools and bars in blotches, not a chain */
        const sl=sst(-.42,-.58,x);
        if(sl>0){const m=vn(sc/36,rB/15,884),bk=sst(.4,.32,m),ds=(-.04-.1*sst(.36,.2,m))*bk+(.3+.62*sst(.36,.7,m))*(1-bk);dc=dc*(1-sl)+ds*sst(1,.9,ax)*sl;slough=sl;}
        bar=br*(1-sl);dep=dep*(1-rCh)+dc*rCh;sf=sf*(1-rCh)+sl*rCh;}
      h=Math.min(h,ML_CL-dep);wl=ML_CL;marsh=0;
      const upB=sst(.02,.3,-dep);sand=Math.max(sand,1-sf);silt=Math.max(silt*(1-.5*(1-sf)),sf*.9);clay*=sf;peat=0;moist=Math.max(moist,1-.7*upB*(1-sf*.6));wood=0;}
    else{const dOut=(ax-1)*rHW,left=x<0;
      if(left){
        /* the left bank: a cut bank, the valley's floor standing over the water; trees along its top in clumps
           (something to winch to, from the bank only: out on the bars there is nothing) */
        if(dOut<5)h=Math.min(h,ML_CL+.04+(h-ML_CL)*sst(0,5,dOut));silt=Math.max(silt,.5*sst(22,4,dOut)*(1-white));
        rvWood=.75*sst(5,10,dOut)*sst(42,24,dOut)*sst(.38,.56,vn(rS/42,1.5,885))*(1-up)*(1-face);}
      else{
        /* the right bank: a beach easing up out of the water */
        if(dOut<14)h=Math.min(h,ML_CL+.03+(h-ML_CL)*sst(0,14,dOut));sand=Math.max(sand,sst(20,4,dOut));
        if(rCh<.5)rvWood=.7*sst(6,12,dOut)*sst(40,24,dOut)*sst(.4,.58,vn(rS/42,4.5,886))*(1-white);}
      if(dOut<1.2)wl=ML_CL;moist=Math.max(moist,1-.5*sst(0,16,dOut));}}
  /* the woods: the Gumbo Woods; groves on the Bluff's top and thin on its face; trees along the river's left bank; a
     grove here and there on the home field; none in the white */
  wood=Math.max(wood,rvWood,(.3*face+up*sst(.5,.64,fbm(u/200,v/200,3,844)))*sst(6,22,bt),sst(.68,.78,fbm(u/170+4,v/170,3,875))*(1-bot)*(1-up)*(1-face));
  /* (none within 100 ft of the Overlook: the view) */
  wood*=(1-white)*(1-clay*.35)*(1-sand*.8)*sst(22,40,Math.hypot(u-455,v+200));if(wl>ML_NONE+1)wood=0;
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=wl;o.wood=wood;
  o.white=white;o.dune=dune;o.marsh=marsh;o.wM=wM;o.rv=rv&&Math.abs(rB)<rHW?1:0;o.rvD=rD;o.rvW=rHW;o.rvS=rS;o.rvB=rB;o.rvCh=rCh;o.slough=slough;o.bar=bar;o.up=up;o.face=face;o.gum=gum;o.bt=bt;return o;}
/* (the ground's own height at a spot, with nothing built on it: a mud hole's level, the Pits', the Bog's) */
const MLL0={};
function mlLandH(u,v){return mlLand(u,v,MLL0).h;}
/* ---------- the world's own ground: the land, and what is built on it: the trails, the mud holes, the Pits, the Bog's
   run-up and its two lanes, the Hill Climb, the bank ---------- */
function mlZone(u,v,o){
  mlLand(u,v,o);
  const e=ML_E(u,v),n1=vn(u/9,v/9,831)-.5,n2=vn(u/37,v/37,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5;
  let h=o.h,clay=o.clay,silt=o.silt,peat=o.peat,sand=o.sand,wl=o.wl,moist=o.moist,wood=o.wood,trk=0,bogK=0,lane=0;
  /* the trails: worn two-tracks a little below the ground round them, wetter (not across open water: a ford is the
     river's own bed) */
  mlNear(ML_IDX.trail,ML_TR_F,u,v,MLTQ);let trail=99;
  if(MLTQ.d<3.6&&!o.rv){trail=MLTQ.d;const k=sst(3.6,1.6,MLTQ.d);h-=.14*k*(1-o.dune);moist=Math.min(1,moist+.12*k);}
  /* the mud holes: each a pool at its own level, the bed under it; the Mud Pit dug deep */
  for(const H of ML_HOLES){const x=u-H.u,z=v-H.v;if(Math.abs(x)>H.L+8||Math.abs(z)>H.L+8)continue;const cs=Math.cos(H.r),sn=Math.sin(H.r),a=(x*cs+z*sn)/H.L,b=(-x*sn+z*cs)/H.W,r=Math.hypot(a,b)+n3*.12;
    if(r<1.5){if(H.lv===null)H.lv=mlLandH(H.u,H.v)-.14-.14-.12*(H.big||0);const k=sst(1.5,1,r);
      h=r<1?Math.min(h,H.lv-H.d*sst(1,.15,r)):h+(Math.max(H.lv+.12,Math.min(h,H.lv+.4))-h)*k;if(r<1)wl=H.lv;moist=Math.max(moist,1-.5*sst(1,1.5,r));clay=Math.max(clay,(H.c!==undefined?H.c:H.big?.7:.35)*sst(1.5,1,r));wood*=1-k;}}
  /* the Pits: a pad of packed clay, level and dry */
  {const P=ML_PITS,r=Math.max(Math.abs(u-P.u)/P.a,Math.abs(v-P.v)/P.b);if(r<1.5){if(P.lv===null)P.lv=mlLandH(P.u,P.v)+.15;const k=sst(1.5,1,r),on=sst(1.05,.95,r);
      h=h+(P.lv-h)*k;clay=clay*(1-on)+.45*on;silt*=1-on;peat*=1-on;sand*=1-on;moist=moist*(1-k)+.16*k;wood*=1-k;trk=Math.max(trk,on);if(k>.5)wl=ML_NONE;}}
  /* THE BOG: the field laid level round it; the run-up, packed and dry; the two lanes, each evenly deeper to its end */
  {const B=ML_BOG,x=u-B.u0,L=B.u1-B.u0,v0=B.lanes[0].v,v1=B.lanes[B.lanes.length-1].v,dv=v<v0?v0-v:v>v1?v-v1:0;
    if(x>-B.run-50&&x<L+50&&dv<B.hw+34){
      if(B.lv===null)B.lv=mlLandH(B.u0-60,B.v)+.1;
      bogK=sst(B.hw+34,B.hw+10,dv)*sst(-B.run-50,-B.run-16,x)*sst(L+50,L+16,x);h=h+(B.lv-h)*bogK;wood*=1-bogK;if(bogK>.5&&wl>ML_NONE+1)wl=ML_NONE;
      /* (the run-up: packed clay from its far end to the lanes' start, across both lanes and a little over) */
      const ru=sst(B.hw+5,B.hw+2.5,dv)*sst(-B.run-6,-B.run,x)*sst(3,-3,x);
      if(ru>0){clay=clay*(1-ru)+.55*ru;silt*=1-ru;peat*=1-ru;sand*=1-ru;moist=moist*(1-ru)+.15*ru;trk=Math.max(trk,ru);}
      for(let q=0;q<B.lanes.length;q++){const Ln=B.lanes[q],w=Math.abs(v-Ln.v);if(w>B.hw+3||x<-2||x>L+8)continue;
        /* (its bed: nothing at its start, evenly down to its far end, then a wall; its sides cut straight) */
        const dep=Ln.deep*Math.max(0,Math.min(1,x/L)),k=sst(B.hw+1.8,B.hw-.2,w)*sst(L+7,L,x);
        h=B.lv-dep*k;if(k>.5&&B.lv+Ln.wl>h){wl=B.lv+Ln.wl;}
        const on=sst(B.hw+1.2,B.hw,w)*sst(-1,2,x)*sst(L+7,L+2,x);lane=Math.max(lane,on*(q+1));
        /* (the Mud Lane's bed: silt and clay; and from Ln.peat of the way down it, turning to peat: a true bog, a mat over soup) */
        if(Ln.soft){const pk=Ln.peat<1?sst(Ln.peat,Ln.peat+.2,x/L):0;silt=silt*(1-on)+.72*(1-pk)*on;clay=clay*(1-on)+.28*(1-pk)*on;sand*=1-on;peat=peat*(1-on)+pk*on;}
        else{sand=sand*(1-on)+.7*on;clay=clay*(1-on)+.2*on;silt*=1-on;peat*=1-on;}moist=moist*(1-on)+on*(.7+.3*sst(0,L*.2,x));trk=Math.max(0,trk-on);}}}
  /* the Hill Climb: its lane laid to its own heights, dry and bare; the ground round it brought up or down to meet it.
     x: metres up it from its foot; w: off its middle */
  let climbK=0,climbL=0,climbW=1;
  {const C=ML_CLIMB,x=(u-C.u)*C.dx+(v-C.v)*C.dz,w=Math.abs((v-C.v)*C.dx-(u-C.u)*C.dz);if(x>-74&&x<C.X+C.top+110&&w<C.hw+60){
    if(C.h0===null)C.h0=mlLandH(C.u,C.v);
    climbK=sst(-70,-8,x)*sst(C.X+C.top+30,C.X+C.top+4,x)*sst(C.hw+28,C.hw+1,w);
    if(climbK>0){h=h+(C.h0+mlClimbY(x)-h)*climbK;clay*=1-climbK;silt*=1-climbK;peat*=1-climbK;moist=moist*(1-climbK)+.15*climbK;if(climbK>.5)wl=ML_NONE;}
    climbL=sst(C.hw+3,C.hw+.5,w)*sst(-12,-8,x)*sst(C.X+C.top+4,C.X+C.top,x);
    /* (the sand: on the lane from just short of its foot to the crest; the place to line up and the landing are dirt) */
    {const ks=sst(C.hw+2.5,C.hw+.5,w)*sst(-4,-1,x)*sst(C.X+6,C.X+3,x);sand=sand*(1-ks)+C.sand*ks;}
    /* (the woods stand back from it) */
    climbW=1-sst(-74,-50,x)*sst(C.X+C.top+110,C.X+C.top+85,x)*(1-sst(C.hw+30,C.hw+55,w));}}
  /* the bank all round: rising 6 m, grass; round the white corner a dune ridge, 14 m of white sand */
  const bank=sst(724,752,e+n2*10);h+=(6+8*o.white)*bank;if(bank>.2)wl=ML_NONE;if(o.white>0){sand=Math.max(sand,bank*o.white);moist=moist*(1-.8*bank*o.white);}
  moist=Math.max(0,Math.min(1,moist));
  if(trail<4.5||wl>ML_NONE+1)wood=0;wood*=(1-Math.min(1,climbK*2.2))*climbW*(1-bank);
  const grass=(1-wood)*(1-sst(.3,.7,clay+sand+peat+silt))*(trail<99?sst(1.4,2.6,trail):1)*(wl>ML_NONE+1?0:1)*(.6+.4*sst(.15,.5,moist))*(1-climbL)*(1-trk)*(1-o.white)*(1-.85*o.face);
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=wl;o.grass=Math.max(0,Math.min(1,grass));o.wood=wood;
  /* (a trail in the white country is its worn, damper two-track only: the picture paints a trail as red dirt, and across
     white dunes that was an orange road) */
  o.trail=o.white>.5?99:trail;
  o.strip=0;o.stripD=99;o.trk=trk;o.jmp=0;o.isle=0;o.lake=0;o.bogK=bogK;o.lane=lane;o.dc=o.rvD;return o;}
const MLZ={};
function mlBaseH(u,v){return mlZone(u,v,MLZ).h;}
function mlMat(u,v,o){mlZone(u,v,o);o.mud=Math.max(o.silt,o.peat);o.rock=0;
  o.code=o.wl>ML_NONE+1&&o.wl>o.h+.12?SF.water:(o.silt>.5||o.peat>.5)&&o.moist>.5?SF.mud:o.sand>.5?SF.sand:o.grass>.5?SF.grass:o.trail<2.5?SF.trail:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* the world's own ground every CM metres, rows j0 up to j1 of a layer M across whose corner is at (u0, v0): what the
   soil keeps for all of the world (src/ml-soil.js mlPrepStep: height, water, moisture, the soils, sod, woods, trails),
   and the same packed for its two pictures on the graphics card. Here, inside the generator, so that background
   workers can make it as they make the land */
const ML_HF=new Float32Array(1),ML_HU=new Uint32Array(ML_HF.buffer);
function mlHalfW(v){ML_HF[0]=v;const x=ML_HU[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
function mlLayerRows(u0,v0,CM,M,j0,j1){const n=(j1-j0)*M,B=new Float32Array(n),Wl=new Float32Array(n),Mo=new Uint8Array(n),Ms=new Uint8Array(n*4),Gr=new Uint8Array(n),Wd=new Uint8Array(n),Tr=new Uint8Array(n),S0=new Uint16Array(n*4),S1=new Uint8Array(n*4),o={};
  for(let j=j0;j<j1;j++)for(let i=0;i<M;i++){const k=(j-j0)*M+i;mlZone(u0+(i+.5)*CM,v0+(j+.5)*CM,o);
    B[k]=o.h;Wl[k]=o.wl>-90?o.wl:o.h-1;Mo[k]=Math.round(o.moist*255);const w=[o.clay,o.silt,o.peat,o.sand];for(let c=0;c<4;c++)S1[k*4+c]=Ms[c*n+k]=Math.round(Math.max(0,Math.min(1,w[c]))*255);
    Gr[k]=Math.round(o.grass*255);Wd[k]=Math.round(o.wood*255);Tr[k]=o.trail<3.6?Math.round(255*(1-o.trail/3.6)):o.trk>.6?150:0;
    S0[k*4]=mlHalfW(B[k]);S0[k*4+1]=mlHalfW(Wl[k]);S0[k*4+2]=mlHalfW(Mo[k]/255);S0[k*4+3]=mlHalfW(Gr[k]>=Wd[k]?Gr[k]/255:-Wd[k]/255);}
  return {j0,j1,B,Wl,Mo,Ms,Gr,Wd,Tr,S0,S1};}
/* the country round it, out to the edge of the world: low swells, dry grass with bare patches. (Far hills were tried
   here, to stand behind the dunes: the engine draws far land plain and coarse, and they stood as orange blocks) */
function mlOuter(x,z,o){
  const h=ML_A.h0+9+3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5);
  const bare=sst(.6,.72,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=ML_E(u,v)-A.h;
  if(e>A.m)mlOuter(x,z,o);
  else{const cu=Math.max(-A.h,Math.min(A.h,u)),cv=Math.max(-A.h,Math.min(A.h,v));mlMat(cu,cv,MLM);const h=A.h0+MLM.h;
    o.h=h;o.code=MLM.code===SF.water?SF.mud:MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;
    /* (past the square's edge the engine paints the land itself: grass and dirt only. It has no sand there (its own was
       taken out of the soil's program), and the white corner's sand came out teal: outside, the dune ridge's far side
       is dry grass) */
    if(e>0){const g={};mlOuter(x,z,g);const f=sst(0,A.m,e),g0=Math.max(MLM.grass,MLM.sand*.8);o.h=h+(g.h-h)*f;o.grass=g0+(g.grass-g0)*f;o.sand=0;if(o.code===SF.sand)o.code=SF.grass;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}
/* the woods' trees, chunk by chunk (genStatic hands in its own addTree): a tree every 6 m or so where it's wooded,
   broadleaf mostly, pines up on the Bluff */
function mlTrees(x0,z0,x1,z1,addTree){
  const A=ML_A,S=6.2,o={};
  for(let z=Math.floor(z0/S)*S;z<z1;z+=S)for(let x=Math.floor(x0/S)*S;x<x1;x+=S){
    const jx=x+hs(Math.round(x),Math.round(z),861)*S,jz=z+hs(Math.round(x),Math.round(z),862)*S;if(jx<x0||jx>=x1||jz<z0||jz>=z1)continue;
    const u=jx-A.x,v=jz-A.z;if(ML_E(u,v)>A.h-20)continue;mlZone(u,v,o);
    if(o.wood<.05||hs(Math.round(jx*3),Math.round(jz*3),863)>o.wood*.95)continue;
    const pine=o.h>14&&hs(Math.round(jx),Math.round(jz),864)<.6,sc=.8+.55*hs(Math.round(jx*2),Math.round(jz*2),865);
    addTree(jx,jz,pine?3:hs(Math.round(jx),Math.round(jz),866)<.5?0:1,sc,1);}}
/* the place's name for the screen */
function mlPlace(u,v){const e=ML_E(u,v);if(e>752)return 'Outside';
  const o=mlZone(u,v,{});if(e>724)return o.white>.5?'The dune ridge':'The bank';
  {const B=ML_BOG,x=u-B.u0;if(o.lane>.5)return o.lane>1.5?'The Water Lane':'The Mud Lane';if(o.bogK>.5&&x<0&&Math.abs(v-B.v)<20)return 'The run-up';if(o.bogK>.5)return 'The Bog';}
  for(const H of ML_HOLES)if(Math.hypot(u-H.u,v-H.v)<H.L+3)return H.big?'The Mud Pit':'A mud hole';
  {const C=ML_CLIMB,x=(u-C.u)*C.dx+(v-C.v)*C.dz,w=Math.abs((v-C.v)*C.dx-(u-C.u)*C.dz);if(x>-12&&x<C.X+C.top&&w<C.hw+3)return 'The Hill Climb';}
  if(o.rvD<o.rvW+30){if(o.rvCh>.5)return o.slough>.5?'The Sloughs':'The Braids';return o.rvS<340?'The Narrows':o.rvS<520?'The Upper Ford':'The lower river';}
  if(o.trail<3.6){mlNear(ML_IDX.trail,ML_TR_F,u,v,MLTQ);if(MLTQ.n>=0)return ML_TRAILS[MLTQ.n].name;}
  if(Math.max(Math.abs(u-ML_PITS.u)/ML_PITS.a,Math.abs(v-ML_PITS.v)/ML_PITS.b)<1.1)return 'The Pits';
  if(o.dune>.5)return Math.hypot(u+520,v+548)<150?'Big White':'The White Dunes';if(o.wM>.5)return 'The White Marsh';if(o.white>.5)return 'The white flats';
  if(o.up>.5)return Math.hypot(u-462,v+200)<50?'The Overlook':'The Bluff';if(o.face>.4&&o.bt>12)return 'The Bluff\'s face';
  if(o.gum>.5)return 'The Gumbo Woods';
  return o.wood>.5?'A grove':'The home field';}
