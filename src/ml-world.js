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
   MUD LAB 19: FOUR TIMES THE GROUND. The square is 3,072 m a side; the map above is its north-west quarter, where it
   was and as it was (the same numbers: the square grew east and south from the same corner, so every place, every
   soil square and every pattern on the ground keeps its spot; only the bank along its old east and south edges is
   gone, and two two-tracks leave it: one from the Quarry's east rim, one from the Field Track's west end).
   u from -768 to 2304, v from -768 to 2304. The new ground, with fewer woods and more shapes to drive:
     the River: down the east from the north edge to the Lake, 3.1 km of it; Big Creek runs on east into it. It is
       laid out the way a river on soft ground lays itself out: it swings from side to side; on the outside of each
       bend a deep pool under a steep cut bank with trees along its top, on the inside a sand bar; between two bends a
       riffle, wide, shallow and firm: the ford. The Shallows in the middle: 600 m where it spreads to 120 to 140 m of
       shin-deep water over firm sand, bars and islands: cross anywhere. Every riffle up or down the river from there
       is deeper (and downstream softer) than the one before, until it can't be crossed: the Narrows at the north,
       the muddy water above the Lake at the south. Measured with both SUVs: README, Mud Lab 19
     the Lake (south-east): a firm sandy shelf round the edge, wading depth for 9 m, then it drops away to 3 m of water
       over soft muck: deep enough to put either SUV under (src/ml-soil.js mlDeep: the engine drowns). A sand beach on
       its west shore; woods along its east shore, to winch out to
     the Track (south of the Trailhead): a 2.9 km (1.8 mile) dirt loop, 10 m wide, over knolls: every bend banked, with
       a berm on its outside; four table-tops, four rows of whoops, three kickers, a step-up; the Mounds in its middle
     the Far Side (east of the River): open hills and a field of mounds, reached by the Shallows
     two-tracks out to each: the River Road, the Track Road, the Lake Road, the Far Side Road
   ===================================================================================== */
/* (x, z: where u = 0, v = 0 is in the world; h: half the square's side; cu, cv: its middle; m: the blend into the
   grassland beyond; old: half the side of the first map, the north-west quarter) */
const ML_A={x:0,z:1200,h:1536,cu:768,cv:768,m:140,h0:2,old:768};
/* how far out a spot is: 768 on the square's edge all round, less inside (so the first map's own numbers, the bank from
   724 to 752, still say the same thing on the two edges it kept) */
const ML_E=(u,v)=>Math.max(-u,-v,u-1536,v-1536);
const ML_NONE=-99,ML_CL=-.35;          /* the creek's (and the pond's) water level over the Bottoms' floor; no water */
/* a smooth line through waypoints, a point every 4 m (Catmull-Rom) */
function mlLine(P){const o=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/4));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  o.push(P[P.length-1].slice());return o;}
const ML_CREEK=mlLine([[-800,560],[-620,500],[-470,400],[-340,300],[-220,220],[-110,180],[0,130],[110,60],[210,-25],[320,-55],[430,-140],[520,-250],[600,-370],[690,-460],[800,-520]])
  .concat(mlLine([[800,-520],[905,-578],[1010,-598],[1115,-575],[1205,-548]]).slice(1));
const ML_TRAILS=[
  {name:'Creek Loop',pts:mlLine([[20,620],[70,460],[62,320],[14,214],[-40,120],[-74,40],[-20,-44],[80,-66],[180,-112],[262,-62],[300,40],[262,140],[160,222],[92,330],[70,460]])},
  {name:'Ridge Trail',pts:mlLine([[-20,-44],[-84,-160],[-62,-300],[18,-420],[62,-482],[122,-560],[240,-604],[380,-566],[462,-462],[520,-334],[520,-262]])},
  {name:'Gumbo Trail',pts:mlLine([[-74,40],[-200,-22],[-330,-122],[-420,-242],[-520,-322],[-562,-452],[-462,-560],[-300,-560],[-180,-480],[-84,-380],[-62,-300]])},
  {name:'Deer Run',pts:mlLine([[300,40],[400,122],[520,182],[622,102],[662,-52],[602,-202],[520,-262]])},
  {name:'Field Track',pts:mlLine([[-170,606],[-60,640],[0,650],[110,630],[230,598],[350,566],[442,530]])},
  /* (Mud Lab 19) out to the new ground: no mud holes on these */
  {name:'River Road',pts:mlLine([[540,548],[620,574],[710,558],[830,506],[980,456],[1120,436],[1258,452]])},
  {name:'Track Road',pts:mlLine([[-170,606],[-216,700],[-204,806],[-156,896],[-124,950]])},
  {name:'Lake Road',pts:mlLine([[336,1082],[470,1150],[640,1290],[780,1500],[838,1720],[846,1890]])},
  {name:'Far Side Road',pts:mlLine([[1500,566],[1650,520],[1800,474],[1950,504],[2046,640],[2010,900],[1960,1130]])}];
/* the Bog (Mud Lab 10): a measured mud lane in the field north-east of the Trailhead, 80 m (262 ft) long, running
   east: eight clay pits end to end, each 8 m long and deeper than the one before (30 cm of water in the first, 115 in
   the last), a low ridge between each; the field laid level round it. (One long pit of deepening water didn't stop
   either SUV: kept moving, they half float across. What stops them is climbing out of a pit, so it is pits) */
const ML_BOG={u0:150,u1:230,v:536,hw:3.6,lv:null,deep:[.3,.4,.5,.6,.72,.86,1,1.15]};
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
  ML_BOG.deep.forEach((d,k)=>ML_HOLES.push({u:ML_BOG.u0+5+k*10,v:ML_BOG.v,L:4.2,W:3.6,r:0,d,c:1,lv:null,bog:1}));
  ML_HOLES.push({u:-172,v:556,L:30,W:19,r:.35,d:.75,lv:null,big:1});})();
const ML_POND={u:232,v:104,a:62,b:34,r:-.5};
const ML_QUARRY={u:450,v:516,a:66,b:48};
const ML_CLAY={u:-470,v:-300};
/* the Heron Strip (Mud Lab 5): a mown grass strip in the south fields, 400 m long, a worn dirt track down its middle,
   its ground laid level end to end; the Heron waits at its west end, facing east along it */
const ML_STRIP={u0:-60,u1:340,v:690,hw:12,h0:null,h1:null};
/* the Hill Climb (Mud Lab 14): a lane bulldozed up the Ridge's south face beside the Ridge Trail, 10 m wide, loose dry
   sand, that gets steeper all the way: a0 degrees at its foot to a1 at its top, X metres on, with a rounded crest and a
   level landing; the woods cleared off it and off a place to line up at its foot. u, v: the middle of its foot; it
   runs north. Sand because it is the one ground in this game with a real tyre's grip on it (the rest has double, and a
   SUV would climb 50 degrees of it): on sand his SUV's all-seasons hold about 30 degrees and the Rock & Mud's
   mud-terrains about 35, and a spinning tyre digs itself in. (ML_CLIMB_ENV: trial numbers from the build's command line) */
const ML_CLIMB=Object.assign({u:40,v:-486,X:40,hw:5,a0:16,a1:28,top:12,h0:null,sand:.85},typeof ML_CLIMB_ENV==='object'&&ML_CLIMB_ENV||{});
/* (its height over its foot, x metres up it on the level; and its length along the slope to there) */
function mlClimbY(x){const C=ML_CLIMB,a=C.a0*Math.PI/180,b=C.a1*Math.PI/180;if(x<=0)return 0;
  const yX=C.X/(b-a)*Math.log(Math.cos(a)/Math.cos(b));if(x<=C.X)return C.X/(b-a)*Math.log(Math.cos(a)/Math.cos(a+(b-a)*x/C.X));
  const t=Math.min(4,x-C.X);return yX+4/b*Math.log(Math.cos(b*(1-t/4))/Math.cos(b));}
function mlClimbS(x){const C=ML_CLIMB,a=C.a0*Math.PI/180,b=C.a1*Math.PI/180;x=Math.max(0,Math.min(C.X,x));let s=0;const n=Math.max(1,Math.ceil(x/.25)),dx=x/n;for(let i=0;i<n;i++)s+=dx/Math.cos(a+(b-a)*(i+.5)*dx/C.X);return s;}
/* ---------- MUD LAB 19: THE NEW GROUND ---------- */
/* a river's line through its waypoints, a point every 10 m or so. Each waypoint: where (u, v), then what the river is
   like there: hw half its width; dr the depth on a riffle; dp the depth of a pool; soft how soft its bed is (0 firm
   sand .. 1 silt); cut how high the cut bank stands on the outside of a bend; bars how much of it is bars and
   islands. Each point of the line carries those (eased from waypoint to waypoint) and, last, how it bends there
   (1 / the bend's radius, + turning to the right-hand bank looking downstream) */
function mlRiver(P,step){const o=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3),q=[f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])],e=t2*(3-2*t);
      for(let c=2;c<8;c++)q.push(p1[c]+(p2[c]-p1[c])*e);o.push(q);}}
  o.push(P[P.length-1].slice(0,8));
  const n=o.length,K=new Float64Array(n);
  for(let i=1;i<n-1;i++){const a=o[i-1],b=o[i],c=o[i+1],ax=b[0]-a[0],az=b[1]-a[1],bx=c[0]-b[0],bz=c[1]-b[1],la=Math.hypot(ax,az)||1,lb=Math.hypot(bx,bz)||1;K[i]=(ax*bz-az*bx)/(la*lb)/((la+lb)/2);}
  for(let i=0;i<n;i++){let q=0,w=0;for(let d=-7;d<=7;d++){const j=i+d;if(j<1||j>=n-1)continue;const g=1-Math.abs(d)/8;q+=K[j]*g;w+=g;}o[i].push(w?q/w:0);}
  return o;}
/* the River, north to south; and its way out of the Lake to the south edge.     u     v   hw   dr   dp soft cut bars */
const ML_RIVERS=[mlRiver([
  [1395,-900, 20, .95,2.4, .5,2.2,0],[1340,-730, 20, .9,2.4, .5,2.2,0],[1235,-560, 26, .9,2.6, .6,1.6,0],[1265,-400, 26, .68,2.0, .4,1.8,0],
  [1400,-285, 28, .62,1.9,.35,1.6,0],[1465,-130, 30, .55,1.7, .3,1.4,0],[1385,30,   32, .36,1.5,.22,1.2,0],[1255,150,  38, .33,1.2, .2, .8,0],
  [1250,320,  58, .2, .3, .05, 0,1],[1370,470,  68, .18,.28, 0,  0,1],[1420,640,  68, .18,.28, 0,  0,1],[1345,810,  56, .22,.34, .1, 0,.8],
  [1235,950,  42, .42,1.2,.35, .6,0],[1255,1120, 40, .55,1.6, .5, .8,0],[1385,1250, 40, .7,1.9, .65, .8,0],[1450,1410, 42, .95,2.2, .8, .6,0],
  [1390,1560, 46,1.3,2.4,  .9, .3,0],[1330,1690, 60, .7,1.7,  .5, 0,.7],[1300,1800, 60,1.2,2.0,  .6, 0,0]],10),
  mlRiver([[1470,2110, 26,1.5,2.2,.8,.4,0],[1530,2220, 24,1.5,2.2,.8,.5,0],[1560,2350, 24,1.5,2.2,.8,.5,0]],10)];
/* the Lake */
const ML_LAKE={u:1250,v:1930,a:390,b:235};
/* knolls put on the new ground: u, v, how wide (m), how high (m). The first four are the Track's; the rest the Far Side's */
const ML_KNOLLS=[[-378,1392,80,12],[150,1150,62,8],[40,1640,95,9],[330,1330,70,7],[1960,280,150,15],[2080,860,150,18],[1820,1500,120,12],[2120,-330,150,16],[1780,-560,110,11],[2060,1900,130,12]];
/* the fields of mounds: u, v, how wide (m) */
const ML_MOUNDS=[[-20,1270,170],[1950,1210,250]];
/* the new ground's own shapes, over the rolling hills: the knolls, the mounds (lumps 2 to 3 m high, 25 m apart, smaller
   ones between), and bolder hills on the Far Side */
function mlNewHills(u,v){let y=0;
  for(const K of ML_KNOLLS){const dx=u-K[0],dz=v-K[1],q=(dx*dx+dz*dz)/(K[2]*K[2]);if(q<7)y+=K[3]*Math.exp(-q);}
  for(const M of ML_MOUNDS){const r=Math.hypot(u-M[0],v-M[1])/M[2];if(r<1)y+=sst(1,.72,r)*(2.8*sst(.52,.9,vn(u/25,v/25,877))+.9*sst(.5,.92,vn(u/10.5,v/10.5,878)));}
  if(u>1500)y+=7*sst(1520,1800,u)*sst(.45,.8,fbm(u/230,v/230,3,871));
  return y;}
/* THE TRACK: a closed loop through its waypoints, a point every 6 m; each point: u, v, how far round it is (m), how it
   bends (as the River's), and the ground's height there (the knolls and hills smoothed along it: found the first
   time it is asked) */
function mlLoop(P,step){const o=[],N=P.length;
  for(let i=0;i<N;i++){const p0=P[(i+N-1)%N],p1=P[i],p2=P[(i+1)%N],p3=P[(i+2)%N],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  const n=o.length,K=new Float64Array(n);let s=0;
  for(let i=0;i<n;i++){const a=o[(i+n-1)%n],b=o[i],c=o[(i+1)%n],ax=b[0]-a[0],az=b[1]-a[1],bx=c[0]-b[0],bz=c[1]-b[1],la=Math.hypot(ax,az)||1,lb=Math.hypot(bx,bz)||1;K[i]=(ax*bz-az*bx)/(la*lb)/((la+lb)/2);b.push(s);s+=lb;}
  for(let i=0;i<n;i++){let q=0,w=0;for(let d=-3;d<=3;d++){const g=1-Math.abs(d)/4;q+=K[(i+d+n)%n]*g;w+=g;}o[i].push(q/w);}
  o.push([o[0][0],o[0][1],s,o[0][3]]);o.len=s;return o;}
const ML_TRACK={hw:5,y:null,pts:mlLoop([[-124,962],[60,950],[232,984],[334,1082],[302,1204],[196,1262],[150,1362],[236,1452],[214,1560],[76,1610],[-66,1548],[-104,1420],[-190,1350],
    [-262,1392],[-250,1470],[-330,1500],[-420,1440],[-478,1340],[-440,1250],[-360,1262],[-322,1190],[-390,1120],[-352,1030],[-240,952]],6),
  /* what is built on it: where it starts (m round the loop from the start line), what, and its measures.
     table: a table-top, r m up, f m flat, r m down, h high; whoops: n of them, w m apart, h high; kicker: a ramp r m
     long to h, then it drops away; step: up h over r m, and stays up for f m before it eases back down over 30 m.
     (The whoops are a SUV's, not a dirt bike's: the first try had them 50 to 60 cm high and 6 to 8 m apart, and at
     36 mph the Rock & Mud went end over end in the first row; these are lower and two to three SUV lengths apart) */
  feats:[[70,'table',9,8,1.5],[205,'whoops',5,15,.42],[372,'kicker',10,1.2],[560,'table',7,5,1],[690,'whoops',4,9,.3],[925,'table',7,4,1],[1150,'step',10,1.5,70],[1300,'table',10,10,1.8],
    [1576,'whoops',4,14,.4],[1960,'whoops',6,10,.32],[2075,'kicker',9,1.1],[2590,'table',9,8,1.6],[2670,'kicker',10,1.3]]};
function mlTrackFeat(s){const T=ML_TRACK,L=T.pts.len;let y=0;
  for(const F of T.feats){let x=s-F[0];if(x<-L/2)x+=L;else if(x>L/2)x-=L;if(x<0)continue;const k=F[1];
    if(k==='table'){const r=F[2],f=F[3],h=F[4];if(x<2*r+f)y+=h*(x<r?sst(0,r,x):x<r+f?1:sst(2*r+f,r+f,x));}
    else if(k==='whoops'){const w=F[3],n=F[2];if(x<n*w)y+=F[4]*.5*(1-Math.cos(6.2832*x/w))*sst(0,w*.5,x)*sst(n*w,n*w-w*.5,x)+F[4]*.5*(1-Math.cos(6.2832*x/w))*(1-sst(0,w*.5,x)*sst(n*w,n*w-w*.5,x))*.6;}
    else if(k==='kicker'){const r=F[2],h=F[3];if(x<r+3)y+=x<r?h*Math.pow(x/r,1.6):h*sst(r+3,r,x);}
    else if(k==='step'){const r=F[2],h=F[3],f=F[4];if(x<r+f+30)y+=h*(x<r?sst(0,r,x):x<r+f?1:sst(r+f+30,r+f,x));}}
  return y;}
/* (the Track's own ground heights along it: the hills and knolls under its middle, evened out over 50 m) */
function mlTrackY(){const T=ML_TRACK,P=T.pts,n=P.length-1,raw=new Float64Array(n),y=T.y=new Float64Array(n+1);
  for(let i=0;i<n;i++)raw[i]=mlHills(P[i][0],P[i][1])+mlNewHills(P[i][0],P[i][1]);
  for(let i=0;i<n;i++){let q=0,w=0;for(let d=-4;d<=4;d++){const g=1-Math.abs(d)/5;q+=raw[(i+d+n)%n]*g;w+=g;}y[i]=q/w;}y[n]=y[0];return y;}
/* (the Track's middle line goes on the end of the trails' list, for the timed lap (src/ml-menu.js): marked lap, and
   kept out of the trails' lookups: it is a built lane, not a worn two-track) */
ML_TRAILS.push({name:'The Track',pts:ML_TRACK.pts,lap:1});
/* ---------- MUD LAB 21: THE JUMPS ---------- */
/* His words, 14 Nov 2026: "interesting strategic literal jumps placed in certain places that you can clearly drive super
   fast on to get the appropriate speed to like hit a ramp and do something interesting."
   Each is a straight lane of packed dirt with a gap in it: a creek, the River, open water, or only the drop off a
   ramp's lip. All of it is ground (nothing new to draw), and all on the new ground.
   u, v: the middle of the gap; deg: which way the lane runs (from east, round toward south); g: from the gap's middle
   to each lip; hw: half the lane's width; win: over how many m the ground's own heights are evened out along it
   (wide on the flats; narrow where the lane should keep a hill's shape).
   A is the side you come from when you drive the way it runs, B the far side. Each side: run, how far its lane goes
   back from its ramp's foot; then its ramp, from its lip going back: b m straight at th degrees, then a curve of
   radius R down to the lane (so the lip stands R*(1-cos th)+b*tan th over the lane). No R: no ramp.
   A ramp with th2: the curve of radius R eases only to th2 degrees; then c m straight at th2, and a second curve of
   radius R2 down to the lane (the island's landing hill).
   WHAT THE TEST DRIVES TAUGHT (tools/test/ml-drive.js T9.jump; all of it in the notes for Mud Lab 21):
   - A SUV comes down softly only on a slope about as steep as its own fall: within the ramp's straight top. On the flat
     past a ramp, falling at 25 mph or more, both SUVs roll; the stock SUV wobbles at 16.
   - So the straight is long (b): the first River ramps had 6 m of it and no speed landed the stock SUV on its wheels;
     with 24 m it lands flat out, both ways.
   - Even so the speeds that land well are few: every 1 mph more carries a SUV 8 m further down a slope that lies along
     its fall. Each run-up is as long as brings the STOCK SUV, flat out from its start, to the right speed. The
     Rock & Mud (99 mph in 100 m) has to hold that speed itself.
   - A lower slope half as steep as the take-off, to catch the faster ones, was tried on the River: they met it at
     20 mph and rolled all the same. The island keeps one (it is only met there by a SUV already slowing).
   - The gap jumps run exactly east-west or north-south: the ground is drawn as 2 m squares, and a lip's steep face
     lying at an angle across them was drawn as a row of saw teeth (the first River Jump ran 14 degrees off).
   - The River's west lip stands 1 m over its east lip (the west bank is the higher): about 82 mph clears it going
     east, 86 coming back. So the east run-up is the longer, and starts up on a knoll.
   The ramps are sized by how fast the SUVs really go (flat out from a stand on firm ground, measured: the stock SUV
   57 mph after 100 m, 70 after 200, 81 after 300; the Rock & Mud 99 after 100 m, 127 after 200): a curve's radius is
   what keeps a SUV from being slammed into its own springs at the speed the jump wants.
   isle: that side is an island built in open water, standing isle m over it (bulge: how much wider its middle is). bar: a sand bar under the water, for
   wading back from the island: from u, v to u, v, half as wide, as deep. marks: pale hard bands across side B every
   50 ft from the lip, to read a jump's length by. big: its name is on the whole map (the Creek Gap's would lie on
   the Narrows'). thru: the gap is dry ground, so the lane's heights are evened out
   as one line right through it (not each side's alone) */
const ML_JUMPS=[
  {name:'CREEK GAP',place:'The Creek Gap',u:933,v:-587.25,deg:90,g:9,hw:8,win:40,A:{run:92,R:60,th:12,b:14},B:{run:92,R:60,th:12,b:14}},
  {name:'RIVER JUMP',place:'The River Jump',big:1,u:1229.3,v:-490,deg:0,g:29,hw:10,win:64,A:{run:345,R:110,th:13,b:24},B:{run:425,R:110,th:13,b:24}},
  {name:'LAKE JUMP',place:'The Lake Jump',big:1,u:855,v:1985,deg:0,g:21,hw:9,win:64,A:{run:190,R:90,th:14,b:10},B:{run:150,R:110,th:10,b:6,th2:5,c:25,R2:200,isle:.6,hw:14,bulge:.45},bar:[938,2000,902,2054,6,.3]},
  {name:'BIG AIR',place:'Big Air',big:1,u:1174.6,v:1175,deg:70,g:1.5,hw:10,win:64,thru:1,A:{run:300,R:160,th:7,b:4},B:{run:420,R:0,th:0,b:0,marks:1}}];
/* (1 while a lane's own heights are being read off the ground as it is without the jumps) */
let ML_JOFF=0,ML_JREADY=0;
for(const J of ML_JUMPS){const a=J.deg*Math.PI/180;J.dx=Math.cos(a);J.dz=Math.sin(a);
  for(const S of [J.A,J.B]){const t=S.th*Math.PI/180,t2=(S.th2||0)*Math.PI/180;S.tn=Math.tan(t);S.sn=Math.sin(t);S.cs=Math.cos(t);S.tn2=Math.tan(t2);S.c=S.c||0;S.R2=S.R2||0;
    S.Lk=S.R*(S.sn-Math.sin(t2));S.L2=S.R2*Math.sin(t2);S.y2=S.R2*(1-Math.cos(t2));S.len=S.R?S.b+S.Lk+S.c+S.L2:0;S.H=S.R?S.y2+S.c*S.tn2+S.R*(Math.cos(t2)-S.cs)+S.b*S.tn:0;S.far=S.len+S.run;S.hw=S.hw||J.hw;S.y=null;}
  J.rad=J.g+Math.max(J.A.far,J.B.far)+40;}
/* a ramp's height over its lane, x m back from its lip */
function mlRampY(S,x){if(!S.R||x>=S.len)return 0;if(x<=S.b)return S.H-x*S.tn;
  let q=x-S.b;if(q<=S.Lk){const sa=S.sn-q/S.R;return S.H-S.b*S.tn-S.R*(Math.sqrt(1-sa*sa)-S.cs);}
  q-=S.Lk;if(q<=S.c)return S.y2+(S.c-q)*S.tn2;
  const t=S.L2-(q-S.c);return S.R2-Math.sqrt(S.R2*S.R2-t*t);}
/* each side's own lane heights, every 8 m back from its lip: the ground as it lies without the jumps, evened out
   along the lane (the last 12 m to the lip taken level: that is the bank). An island's is its height over the water.
   Found once, at the first look at any ground, before anything else of that look is under way */
function mlJumpsInit(){ML_JREADY=1;ML_JOFF=1;const o={};
  for(const J of ML_JUMPS)for(const S of [J.A,J.B]){const n=Math.ceil(S.far/8)+2,y=S.y=new Float64Array(n),sg=S===J.A?-1:1;
    if(S.isle!==undefined){y.fill(ML_CL+S.isle);continue;}
    /* (thru: the samples before the first are the other side's, so the evening-out runs through the gap) */
    const m=Math.max(1,Math.round(J.win/8)),p=J.thru?2*m:0,N=n+p,R=new Float64Array(N);
    for(let i=0;i<N;i++){const x=(i-p)*8,s=sg*(J.g+(J.thru?x:Math.max(12,x)));mlZone(J.u+J.dx*s,J.v+J.dz*s,o);R[i]=Math.max(o.h,ML_CL+.35);}
    let src=R;for(let pass=0;pass<2;pass++){const out=new Float64Array(N);for(let i=0;i<N;i++){let q=0,w=0;for(let d=-m;d<=m;d++){const g=1-Math.abs(d)/(m+1);q+=src[Math.max(0,Math.min(N-1,i+d))]*g;w+=g;}out[i]=q/w;}src=out;}
    for(let i=0;i<n;i++)y[i]=src[i+p];}
  ML_JOFF=0;}
/* (a lane's height s m along it from the middle of its gap (- on side A), for the tools and the tests) */
function mlJumpY(J,s){if(!ML_JREADY)mlJumpsInit();const S=s<0?J.A:J.B,x=Math.max(0,Math.abs(s)-J.g),xi=x/8,i=Math.min(S.y.length-2,xi|0),f=Math.min(1,xi-i);return S.y[i]+(S.y[i+1]-S.y[i])*f+mlRampY(S,x);}
/* (for the tools that look at the ground outside the game: tools/world/) */
const ML_X={rivers:ML_RIVERS,lake:ML_LAKE,track:ML_TRACK,knolls:ML_KNOLLS,mounds:ML_MOUNDS,feat:mlTrackFeat,trackY:()=>ML_TRACK.y||mlTrackY(),jumps:ML_JUMPS,jumpY:mlJumpY};
/* the places for the map: name, where, and what (for its mark) */
const ML_PLACES=[['TRAILHEAD',0,650,'camp',1],['MUD HOLE',-172,556,'hole'],['THE BOG',196,512,'hole'],['QUARRY',450,516,'sand',1],['THE POND',232,104,'water'],['BIG CREEK',-340,300,'water',1],
  ['THE BOTTOMS',380,-110,'bog'],['CLAY PAN',-470,-300,'clay',1],['THE RIDGE',220,-640,'hill',1],['HILL CLIMB',ML_CLIMB.u+12,ML_CLIMB.v+14,'hill'],['LOWER FORD',-24,150,'ford'],['UPPER FORD',282,-48,'ford'],
  ['EASY: FIELD TRACK',120,600,'trail'],['MEDIUM: CREEK LOOP',80,410,'trail'],['HARD: GUMBO TRAIL',-110,22,'trail'],['RIDGE TRAIL',400,-560,'trail'],['DEER RUN',600,80,'trail'],['HERON STRIP',250,690,'strip'],
  /* (Mud Lab 19: the new ground. A fifth mark: 1 for the main places, the ones the whole map names) */
  ['THE TRACK',-124,950,'track',1],['THE MOUNDS',-20,1270,'hill'],['THE SHALLOWS',1262,470,'ford',1],['THE RIVER',1380,-190,'water',1],['THE NARROWS',1300,-690,'water',1],['THE LAKE',1250,1930,'water',1],['LAKE BEACH',846,1900,'sand'],
  ['FAR SIDE',1960,500,'hill',1],['FAR MOUNDS',1950,1210,'hill'],['RIVER ROAD',760,520,'trail'],['LAKE ROAD',700,1380,'trail'],['TRACK ROAD',-216,760,'trail']];
/* (Mud Lab 21: each jump's name stands at the start of its run-up, 14 m in from the lane's end) */
for(const J of ML_JUMPS){const s=J.g+J.A.far-14;ML_PLACES.push([J.name,J.u-J.dx*s,J.v-J.dz*s,'jump',J.big]);}
/* ---------- quick nearest-line lookups: each line's segments in 32 m buckets ---------- */
/* (how far from the River's middle its valley is looked for: its widest water, its floor, and the rise to the hills) */
const ML_RVPAD=330;
const ML_BK=32,ML_BO=ML_A.old+ML_A.m,ML_BN=Math.ceil(2*(ML_A.h+ML_A.m)/ML_BK)+2;
const ML_IDX={creek:new Map(),trail:new Map(),river:new Map(),track:new Map()};
(()=>{const put=(M,ln,P,k)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],pad=k;
    const i0=Math.max(0,Math.floor((Math.min(a[0],b[0])-pad+ML_BO)/ML_BK)),i1=Math.min(ML_BN-1,Math.floor((Math.max(a[0],b[0])+pad+ML_BO)/ML_BK)),j0=Math.max(0,Math.floor((Math.min(a[1],b[1])-pad+ML_BO)/ML_BK)),j1=Math.floor((Math.max(a[1],b[1])+pad+ML_BO)/ML_BK);
    for(let j=j0;j<=j1;j++)for(let q=i0;q<=i1;q++){const key=j*ML_BN+q;let L=M.get(key);if(!L)M.set(key,L=[]);L.push(ln,i);}}};
  put(ML_IDX.creek,0,ML_CREEK,140);ML_TRAILS.forEach((t,n)=>{if(!t.lap)put(ML_IDX.trail,n,t.pts,12);});
  ML_RIVERS.forEach((r,n)=>put(ML_IDX.river,n,r,ML_RVPAD));put(ML_IDX.track,0,ML_TRACK.pts,24);})();
const MLQ={d:1e9,t:0,n:-1,i:0,f:0};
function mlNear(M,lines,u,v,o){o.d=1e9;o.n=-1;const L=M.get(Math.floor((v+ML_BO)/ML_BK)*ML_BN+Math.floor((u+ML_BO)/ML_BK));if(!L)return o;
  for(let q=0;q<L.length;q+=2){const n=L[q],i=L[q+1],P=lines(n),a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],ll=ex*ex+ez*ez||1;let f=((u-a[0])*ex+(v-a[1])*ez)/ll;f=f<0?0:f>1?1:f;
    const dx=u-a[0]-ex*f,dz=v-a[1]-ez*f,d=dx*dx+dz*dz;if(d<o.d){o.d=d;o.n=n;o.i=i;o.f=f;}}
  o.d=Math.sqrt(o.d);return o;}
const ML_CL_F=n=>ML_CREEK,ML_TR_F=n=>ML_TRAILS[n].pts,ML_RV_F=n=>ML_RIVERS[n],ML_TK_F=n=>ML_TRACK.pts;
/* the rolling hills (over the Bottoms' floor) and the Ridge */
function mlHills(u,v){return 3+12*fbm(u/420+3.1,v/420-1.7,3,841)+3*fbm(u/120,v/120,2,842)+22*Math.exp(-Math.pow((v+600)/120,2))*sst(-760,-500,u)*sst(760,560,u);}
/* ---------- the world's own ground: height over h0, soils (weights; loam is what's left), moisture, water level,
   sod, the woods' floor, the trail (distance from its middle, 99 off it) and how wooded ---------- */
const MLN={d:0,t:0,n:-1,i:0,f:0},MLT={d:0,t:0,n:-1,i:0,f:0},MLRV={d:0,t:0,n:-1,i:0,f:0},MLTK={d:0,t:0,n:-1,i:0,f:0};
function mlZone(u,v,o){
  if(!ML_JREADY)mlJumpsInit();
  const e=ML_E(u,v),n1=vn(u/9,v/9,831)-.5,n2=vn(u/37,v/37,832)-.5,n3=vn(u/3.3,v/3.3,833)-.5,big=fbm(u/260,v/260,2,834)-.5;
  mlNear(ML_IDX.creek,ML_CL_F,u,v,MLN);const dc=MLN.d,hw=4+2*vn(MLN.i/9,0,835);
  /* the Bottoms: a flat valley 75-120 m each side of the creek; the hills beyond */
  const vb=88+30*vn(MLN.i/14,3,836);let bot=sst(vb+70,vb,dc+n2*30),hl=mlHills(u,v);const botC=bot;
  /* (Mud Lab 19) the new ground: nw is 0 on the first map (nothing below is done there: its numbers are as they were),
     1 past its old east and south edges. The River's valley and the Lake's shore are flat floor as the Bottoms are; the
     knolls and mounds go on the hills */
  const nw=Math.max(sst(700,790,u),sst(700,790,v));
  let rv=0,rHW=0,rDr=0,rDp=0,rSoft=0,rCut=0,rBars=0,rK=0,rB=0,rS=0,lkD=-1e9,lkX=0;
  if(nw>0){hl+=mlNewHills(u,v)*nw;
    mlNear(ML_IDX.river,ML_RV_F,u,v,MLRV);
    if(MLRV.n>=0){const P=ML_RIVERS[MLRV.n],a=P[MLRV.i],b=P[MLRV.i+1],f=MLRV.f,ex=b[0]-a[0],ez=b[1]-a[1];rv=1;
      rHW=a[2]+(b[2]-a[2])*f;rDr=a[3]+(b[3]-a[3])*f;rDp=a[4]+(b[4]-a[4])*f;rSoft=a[5]+(b[5]-a[5])*f;rCut=a[6]+(b[6]-a[6])*f;rBars=a[7]+(b[7]-a[7])*f;rK=a[8]+(b[8]-a[8])*f;
      rB=(ex*(v-a[1])-ez*(u-a[0])<0?-1:1)*MLRV.d;rS=(MLRV.i+f)*10+MLRV.n*5000;
      /* (the edges wander a little, so the banks aren't ruled lines) */
      rHW*=1+.14*(vn(rS/70,3,879)-.5);
      /* (its valley's floor: by how far from the River and by the place, not by which reach is nearest: inside a
         bend the nearest reach changes from one step to the next, and anything read off it would show as a line) */
      const vbR=165+60*vn(u/240,v/240,873);bot=Math.max(bot,sst(vbR+70,vbR,MLRV.d+n2*30));}
    {const Lk=ML_LAKE,x=u-Lk.u,z=v-Lk.v;if(Math.abs(x)<Lk.a*2.2&&Math.abs(z)<Lk.b*2.4){const hy=Math.hypot(x,z),r0=Math.hypot(x/Lk.a,z/Lk.b),r=r0*(1+.16*(vn(u/120+2,v/120,876)-.5)+.05*n2);
      lkD=(1-r)*(hy>1?hy/r0:Lk.b);lkX=x/Lk.a;bot=Math.max(bot,sst(150,70,-lkD+n2*20));}}}
  let h=hl*(1-bot)+(.06*n1+.03*n3)*bot,clay=0,silt=0,peat=0,sand=0,wl=ML_NONE,moist=.32+.12*n2+.1*big;
  moist+=.5*bot+.25*sst(40,0,dc);moist-=.2*sst(5,18,h)*(1-bot);
  /* the creek: its channel, a deep middle, sand bars on the bends, silt banks; peat in the Bottoms' wettest spots */
  if(dc<hw+6){const k=Math.max(0,1-(dc/hw)**2);h=Math.min(h,-1.0*k+.05*(1-k));if(dc<hw*1.05)wl=ML_CL;}
  silt+=sst(30,6,dc)*bot;sand+=sst(.62,.75,vn(u/22,v/22,837))*sst(22,8,dc)*sst(hw*.7,hw*1.3,dc);
  /* (Mud Lab 19: in the River's valley, peat only where the River is slow and muddy: a little by the Narrows, more
     and more below the Shallows; none on the way to the Shallows or on the Lake's shore) */
  peat+=(nw>0?botC+Math.max(0,bot-botC)*(.3*sst(-250,-560,v)+.9*sst(860,1450,v))*(lkD>-200?0:1):bot)*sst(.55,.68,fbm(u/70,v/70,2,838))*sst(30,50,dc);if(peat>.2){h-=.06*peat*(vn(u/2.2,v/2.2,839)-.3);}
  let bankCut=0,rvWood=0,trk=0;
  /* (Mud Lab 19) THE RIVER: its bed and its banks. x is across it (-1 one bank, 1 the other); am how hard it is bending
     here (0 straight: a riffle; 1: a bend of 170 m radius or tighter); so which bank is the outside of the bend */
  if(rv&&MLRV.d<rHW+80){const x=rB/rHW,ax=Math.abs(x),am=Math.min(1,Math.abs(rK)*170),so=rK>0?-1:1,xin=-x*so;
    if(ax<1){
      /* the riffle's own depth right across, shelving up to each bank; shallower over the inside of a bend */
      let dep=rDr*sst(1,.74,ax)*(1-.8*am*sst(-.3,.8,xin));
      /* the pool: scoured against the outside bank, steep on that side */
      const pool=Math.pow(am,1.3)*Math.exp(-Math.pow((x-.6*so)/.36,2))*sst(1,.9,ax);dep+=(rDp-rDr)*pool;
      /* the point bar: out of the water along the inside */
      dep-=(rDr+.2)*am*sst(.5,.95,xin);
      /* the Shallows' bars and islands (long, lying with the flow), and the braids between them a little deeper */
      let isl=0;if(rBars>0){isl=rBars*sst(.57,.7,vn(rS/42,rB/13,880))*sst(1,.72,ax);dep=dep*(.72+.56*vn(rS/31,rB/8,881))*(1-isl)-.15*isl;}
      h=Math.min(h,ML_CL-dep);wl=ML_CL;
      const sf=Math.min(1,rSoft+.6*pool)*(1-isl),up=sst(.02,.3,-dep);
      sand=Math.max(sand,1-sf);silt=Math.max(silt,sf*.85);peat*=1-sst(1,.8,ax);
      moist=Math.max(moist,1-.72*up);}
    else{const dOut=(ax-1)*rHW,outer=x*so>0;
      /* the banks: the outside of a bend steep, a cut bank standing over the pool, trees along its top; the inside
         a sand beach easing up */
      if(outer){if(dOut<1.6)h=Math.min(h,ML_CL+.02+.4*sst(0,1.6,dOut));h+=rCut*am*sst(0,2.6,dOut)*sst(75,12,dOut);rvWood=am*.75*sst(4,9,dOut)*sst(60,28,dOut)*(rCut>0?1:0);}
      else{if(dOut<10)h=Math.min(h,ML_CL+.02+.42*sst(0,10,dOut));sand=Math.max(sand,sst(16,3,dOut)*(.45+.55*Math.max(am,rBars)));}
      if(dOut<1.2)wl=ML_CL;moist=Math.max(moist,1-.5*sst(0,14,dOut));}}
  /* (Mud Lab 19) THE LAKE: lkD is how far in from the shore (m). A firm sandy shelf, wading depth for 9 m; then it
     drops away to 3 m over soft muck. A sand beach on its west shore, trees along its east */
  if(lkD>-40){if(lkD>0){const dep=.06+.46*sst(0,9,lkD)+2.3*sst(10,17,lkD)+.4*sst(17,90,lkD);h=Math.min(h,ML_CL-dep);wl=ML_CL;moist=1;
      const deep=sst(10,16,lkD);sand=Math.max(sand,(.6+.35*sst(.1,-.5,lkX))*(1-deep));silt=Math.max(silt,.6*deep);peat=Math.max(peat,.55*deep);}
    else{const dOut=-lkD;if(dOut<12)h=Math.min(h,ML_CL+.02+.45*sst(0,12,dOut));if(dOut<1.2)wl=ML_CL;
      sand=Math.max(sand,sst(.1,-.5,lkX)*sst(26,8,dOut));moist=Math.max(moist,1-.55*sst(0,20,dOut));rvWood=Math.max(rvWood,.7*sst(.1,.5,lkX)*sst(5,10,dOut)*sst(55,30,dOut));}}
  /* the pond, in the Bottoms */
  {const P=ML_POND,cs=Math.cos(P.r),sn=Math.sin(P.r),x=u-P.u,z=v-P.v,a=(x*cs+z*sn)/P.a,b=(-x*sn+z*cs)/P.b,r=Math.hypot(a,b)+n1*.1;
    if(r<1.4){const d=1.1*sst(1,.2,r);if(r<1){h=Math.min(h,ML_CL-d);wl=ML_CL;}else h=Math.min(h,ML_CL+.2*sst(1,1.4,r));silt=Math.max(silt,sst(1.4,1.05,r));moist=Math.max(moist,1-sst(1,1.4,r)*.4);}
    /* (Mud Lab 11) the bank: where the pond was cut into the hills its rim ended in a sheer 10 m step. Now a steep
       slope down to the rim, 27 to 35 degrees: you can ease a SUV down it into the pond, and winch back up from
       tree to tree (the woods on it thinned to a third, so there's room to drive and something to hook) */
    /* (its foot curves up over the first 6 m, so a bumper doesn't meet the slope before the wheels do) */
    else if(r<2.8){const hn=h,ds=(r-1.4)/r*Math.hypot(x,z);h=Math.min(h,ML_CL+.2+(ds<6?ds*ds/24:1.5+.5*(ds-6)));bankCut=hn-h;}}
  /* the Clay Pan: flat cracked clay, dry; a few low spots stay wet */
  {const r=Math.hypot((u-ML_CLAY.u)/170,(v-ML_CLAY.v)/120)+n2*.4;if(r<1.3){const k=sst(1.3,.9,r);clay=Math.max(clay,k);h=h+(4.5+.25*n1-h)*k;moist=moist*(1-k)+(.12+.5*sst(.6,.72,vn(u/30,v/30,840)))*k;}}
  clay=Math.max(clay,sst(.7,.8,fbm(u/90+7,v/90,2,843))*(1-bot)*sst(60,-120,v));
  /* the Quarry: a sand pit 6 m down with steep sides */
  {const Q=ML_QUARRY,r=Math.hypot((u-Q.u)/Q.a,(v-Q.v)/Q.b)+n2*.12;if(r<1.25){const k=sst(1.12,.92,r);h=h-6*k+.8*Math.max(0,Math.sin(u*.09+v*.05))*k*sst(.85,.4,r);sand=Math.max(sand,sst(1.25,1,r));moist=Math.min(moist,.2+.3*k*sst(.4,0,r));}}
  /* the trails: worn two-tracks a little below the ground round them, wetter in the woods */
  mlNear(ML_IDX.trail,ML_TR_F,u,v,MLT);let trail=99;
  if(MLT.d<3.6){trail=MLT.d;const k=sst(3.6,1.6,MLT.d);h-=.14*k;moist=Math.min(1,moist+.12*k);}
  /* the Bog: the field laid level round its pits */
  let bogK=0;
  {const B=ML_BOG,f=(u-B.u0)/(B.u1-B.u0),dv=Math.abs(v-B.v);if(f>-.5&&f<1.3&&dv<B.hw+26){
    if(B.lv===null)B.lv=mlHills((B.u0+B.u1)/2,B.v);
    bogK=sst(B.hw+26,B.hw+7,dv)*sst(-.5,-.3,f)*sst(1.3,1.1,f);h=h+(B.lv-h)*bogK;}}
  /* the mud holes: each a pool at its own level, the bed under it; the big one dug deep */
  for(const H of ML_HOLES){const x=u-H.u,z=v-H.v;if(Math.abs(x)>H.L+8||Math.abs(z)>H.L+8)continue;const cs=Math.cos(H.r),sn=Math.sin(H.r),a=(x*cs+z*sn)/H.L,b=(-x*sn+z*cs)/H.W,r=Math.hypot(a,b)+n3*.12;
    if(r<1.5){if(H.lv===null)H.lv=H.bog?(ML_BOG.lv===null?(ML_BOG.lv=mlHills((ML_BOG.u0+ML_BOG.u1)/2,ML_BOG.v)):ML_BOG.lv)-.14:mlHillsAt(H)-.14-.12*(H.big||0);const k=sst(1.5,1,r);
      h=r<1?Math.min(h,H.lv-H.d*sst(1,.15,r)):h+(Math.max(H.lv+.12,Math.min(h,H.lv+.4))-h)*k;if(r<1)wl=H.lv;moist=Math.max(moist,1-.5*sst(1,1.5,r));clay=Math.max(clay,(H.c!==undefined?H.c:H.big?.7:.35)*sst(1.5,1,r));if(H.s)silt=Math.max(silt,H.s*sst(1.5,1,r));}}
  /* the Heron Strip: level, dry and hard, no trees near it */
  let strip=0,stripD=99;
  {const S=ML_STRIP,dv=Math.abs(v-S.v),f=(u-S.u0)/(S.u1-S.u0);if(dv<60&&f>-.2&&f<1.2){
    if(S.h0===null){S.h0=mlHills(S.u0,S.v);S.h1=mlHills(S.u1,S.v);}const fc=Math.max(0,Math.min(1,f)),hl=S.h0+(S.h1-S.h0)*fc,
    ends=sst(-.2,-.02,f)*sst(1.2,1.02,f),k=sst(S.hw+30,S.hw+4,dv)*ends;h=h+(hl-h)*k;
    strip=sst(S.hw+1.5,S.hw,dv)*sst(-.03,0,f)*sst(1.03,1,f);stripD=dv;clay*=1-k;silt*=1-k;peat*=1-k;sand*=1-k;moist=moist*(1-k)+.15*k;if(k>.5)wl=ML_NONE;}}
  /* the Hill Climb: its lane laid to its own heights, dry and bare; the ground round it brought up or down to meet it */
  let climbK=0,climbL=0,climbW=1;
  {const C=ML_CLIMB,x=C.v-v,w=Math.abs(u-C.u);if(x>-74&&x<C.X+C.top+32&&w<C.hw+34){
    if(C.h0===null)C.h0=mlHills(C.u,C.v);
    /* (the ground comes up to the level place at its foot over 60 m from the south: over 16 m it made a 22 degree bank
       that a SUV starting on it dug into) */
    climbK=sst(-70,-8,x)*sst(C.X+C.top+30,C.X+C.top+4,x)*sst(C.hw+28,C.hw+1,w);
    if(climbK>0){h=h+(C.h0+mlClimbY(x)-h)*climbK;clay*=1-climbK;silt*=1-climbK;peat*=1-climbK;moist=moist*(1-climbK)+.15*climbK;if(climbK>.5)wl=ML_NONE;}
    climbL=sst(C.hw+3,C.hw+.5,w)*sst(-12,-8,x)*sst(C.X+C.top+4,C.X+C.top,x);
    /* (the sand: on the lane from just short of its foot to the crest; the place to line up and the landing are dirt) */
    {const ks=sst(C.hw+2.5,C.hw+.5,w)*sst(-4,-1,x)*sst(C.X+6,C.X+3,x);sand=sand*(1-ks)+C.sand*ks;}
    /* (and the woods off the place to line up: from the Ridge Trail across to the lane's foot) */
    if(x>-24&&x<3&&u-C.u>-10&&u-C.u<34)climbK=Math.max(climbK,.5);}
    /* (the woods stand back from it: none within 35 m of its middle, thinning in to there from 60 m, and the same for
       110 m beyond its top, where the hill hides them from the lane anyway. Room to turn round and come back down,
       and fewer trees to draw: these are the thickest woods on the map, and the phone was drawing 265,000 to 280,000
       triangles here before there was a hill) */
    if(x>-74&&x<C.X+C.top+110&&w<C.hw+60)climbW=1-sst(-74,-50,x)*sst(C.X+C.top+110,C.X+C.top+85,x)*(1-sst(C.hw+30,C.hw+55,w));}
  /* (Mud Lab 19) THE TRACK: its lane laid to its own heights (the ground along its middle, and what is built on it),
     tilted into each bend with a berm standing on the outside; bare packed dirt; the ground beside it brought to
     meet it */
  if(nw>0){mlNear(ML_IDX.track,ML_TK_F,u,v,MLTK);
    if(MLTK.n>=0&&MLTK.d<ML_TRACK.hw+13){const T=ML_TRACK,P=T.pts,Y=T.y||mlTrackY(),i=MLTK.i,f=MLTK.f,a=P[i],b=P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],d=MLTK.d,
        bs=(ex*(v-a[1])-ez*(u-a[0])<0?-1:1)*d,sT=a[2]+(b[2]-a[2])*f,kq=a[3]+(b[3]-a[3])*f,kB=Math.max(-.4,Math.min(.4,kq*15)),bc=Math.max(-T.hw-2.5,Math.min(T.hw+2.5,bs));
      const lip=.5*Math.min(1,Math.abs(kB)/.22)*(bs*kB<0?1:0)*sst(T.hw-1.6,T.hw+1,d)*sst(T.hw+5.5,T.hw+1.6,d);
      trk=sst(T.hw+12,T.hw+2.5,d);h=h+(Y[i]+(Y[i+1]-Y[i])*f+mlTrackFeat(sT)-kB*bc+lip-h)*trk;
      const on=sst(T.hw+2.2,T.hw+.6,d);clay=clay*(1-on)+.3*on;silt*=1-on;peat*=1-on;sand*=1-on;moist=moist*(1-trk)+.17*trk;if(trk>.5)wl=ML_NONE;trk=Math.max(on,trk*.5);}}
  /* (Mud Lab 21) THE JUMPS: each lane laid to its own heights (the ground along it evened out, and its ramps), packed
     dirt, dry; the ground beside it brought to meet it over 20 m; nothing done in its gap but the trees taken out of
     the way. x is how far back from the lip (under 0: in the gap; the lip's own face falls to the gap over 3 m) */
  let jw=0,jmp=0,isle=0;
  if(nw>0&&!ML_JOFF)for(let q=0;q<ML_JUMPS.length;q++){const J=ML_JUMPS[q],ju=u-J.u,jv=v-J.v;if(Math.abs(ju)>J.rad||Math.abs(jv)>J.rad)continue;
    const s=ju*J.dx+jv*J.dz,w=Math.abs(jv*J.dx-ju*J.dz),S=s<0?J.A:J.B,x=Math.abs(s)-J.g;
    /* (an island is wider in its middle, and its edge wanders) */
    const sh=S.bulge?S.hw*(1+S.bulge*Math.sin(3.1416*Math.max(0,Math.min(1,x/S.far))))+2.4*(vn(u/11,v/11,885)-.5):S.hw;
    if(w<sh+26&&x<S.far){jw=Math.max(jw,sst(sh+24,sh+9,w)*nw);
      if(x>-3){const xc=Math.max(0,x),xi=xc/8,i=Math.min(S.y.length-2,xi|0),f=Math.min(1,xi-i),lane=S.y[i]+(S.y[i+1]-S.y[i])*f+mlRampY(S,xc),is=S.isle!==undefined,
          kl=sst(-3,0,x)*sst(S.far,S.far-40,x)*nw,k=kl*sst(sh+(is?15:21),sh+2,w),on=kl*sst(sh+1.6,sh+.2,w);
        h=h+(lane-h)*k;clay=clay*(1-on)+.3*on;silt*=1-(is?k:on);peat*=1-(is?k:on);sand*=1-on;moist=moist*(1-k)+.17*k;trk=Math.max(trk,on);if(w<sh+.9)jmp=q+1;
        /* (an island: sand round its edge) */
        if(is){sand=Math.max(sand,.85*sst(.08,.5,k)*(1-on));if(k>.5)isle=1;}
        /* (the marks: a band 5 m wide every 50 ft, hard pale clay) */
        if(S.marks&&x>24){const m=x/15.24;if(Math.abs(m-Math.round(m))*15.24<2.56)clay=clay*(1-on)+on;}}}
    /* (the sand bar: the bed brought up to wading depth) */
    if(J.bar){const b=J.bar,ex=b[2]-b[0],ez=b[3]-b[1];let f=((u-b[0])*ex+(v-b[1])*ez)/(ex*ex+ez*ez);f=f<0?0:f>1?1:f;const d=Math.hypot(u-b[0]-ex*f,v-b[1]-ez*f);
      if(d<b[4]+8&&wl>h){const k=sst(b[4]+8,b[4],d)*nw,top=Math.max(h,ML_CL-b[5]);h=h+(top-h)*k;sand=Math.max(sand,k);silt*=1-k;peat*=1-k;}}}
  /* the bank all round: rising 6 m, grass */
  const bank=sst(724,752,e+n2*10);h+=6*bank;if(bank>.2)wl=ML_NONE;
  moist=Math.max(0,Math.min(1,moist));
  /* the woods: most of the north and the east; open fields round the camp; thin in the Bottoms; none on the pan,
     the trails, the water or the bank */
  let wood=sst(.42,.56,fbm(u/300,v/300,3,844)+.22*sst(-100,-500,v)+.15*sst(150,500,u)-.35*sst(330,560,v))*(1-.7*bot)*(1-clay*.9)*(1-sand*.8)*(1-bank);
  /* (Mud Lab 19) the new ground: open country. A grove here and there in place of the first map's woods; trees along
     the River's cut banks and the Lake's east shore (something to winch to); none on the Track or in its way */
  if(nw>0){const nwW=Math.max(sst(730,1010,u+170*(fbm(u/210+5,v/210,2,874)-.5)),sst(730,900,v)),grove=sst(.64,.74,fbm(u/170,v/170,3,875))*(1-.8*bot)*(1-clay*.9)*(1-sand*.8)*(1-bank);wood=wood*(1-nwW)+Math.max(grove,rvWood)*nwW;if(rv&&MLRV.d<rHW+3)wood=0;if(lkD>-3)wood=0;wood*=1-Math.min(1,trk*3);wood*=1-jw;
    if(MLTK.n>=0)wood*=sst(ML_TRACK.hw+6,ML_TRACK.hw+22,MLTK.d);for(const M of ML_MOUNDS){const r=Math.hypot(u-M[0],v-M[1])/M[2];if(r<1.1)wood*=sst(.8,1.1,r);}}
  if(trail<4.5||wl>ML_NONE+1||dc<hw+3)wood=0;wood*=1-bogK;if(bankCut>.3)wood*=.35;wood*=(1-Math.min(1,climbK*2.2))*climbW;
  if(stripD<99){const f=(u-ML_STRIP.u0)/(ML_STRIP.u1-ML_STRIP.u0);wood*=Math.min(1,sst(ML_STRIP.hw+18,ML_STRIP.hw+60,stripD)+1-sst(-.2,-.05,f)*sst(1.2,1.05,f));}
  const grass=(1-wood)*(1-sst(.3,.7,clay+sand+peat+silt))*(trail<99?sst(1.4,2.6,trail):1)*(wl>ML_NONE+1?0:1)*(.6+.4*sst(.15,.5,moist))*(1-climbL)*(1-trk);
  /* (the strip: mown grass, the dirt track down its middle 3 m each side) */
  const gS=grass*(1-strip)+strip*(stripD<2.2?.1:stripD<3.2?.1+.8*(stripD-2.2):.9);
  o.h=h;o.clay=clay;o.silt=silt;o.peat=peat;o.sand=sand;o.moist=moist;o.wl=wl;o.grass=Math.max(0,Math.min(1,gS));o.wood=wood;o.trail=trail;o.dc=dc;o.strip=strip;o.stripD=stripD;
  o.rv=rv&&Math.abs(rB)<rHW?1:0;o.rvD=rv?MLRV.d:1e9;o.rvW=rv?rHW:0;o.lake=lkD>0?1:0;o.trk=trk;o.jmp=jmp;o.isle=isle;return o;}
/* (a mud hole's own level: the ground round it, without it) */
function mlHillsAt(H){const dc=mlNear(ML_IDX.creek,ML_CL_F,H.u,H.v,{d:0}).d,bot=sst(170,90,dc);return mlHills(H.u,H.v)*(1-bot)-.14;}
const MLZ={};
function mlBaseH(u,v){return mlZone(u,v,MLZ).h;}
function mlMat(u,v,o){mlZone(u,v,o);o.mud=Math.max(o.silt,o.peat);o.rock=0;
  o.code=o.wl>ML_NONE+1&&o.wl>o.h+.12?SF.water:(o.silt>.5||o.peat>.5)&&o.moist>.5?SF.mud:o.sand>.5?SF.sand:o.grass>.5?SF.grass:o.trail<2.5?SF.trail:SF.dirt;return o;}
function mlLevel(){return ML_A.h0;}
/* (Mud Lab 19) the world's own ground every CM metres, rows j0 up to j1 of a layer M across whose corner is at (u0, v0):
   what the soil keeps for all of the world (src/ml-soil.js mlPrepStep: height, water, moisture, the soils, sod, woods,
   trails), and the same packed for its two pictures on the graphics card. Here, inside the generator, so that
   background workers can make it as they make the land: the world is four times the size it was, and filling this on
   the page's own thread would hold the title up four times as long */
const ML_HF=new Float32Array(1),ML_HU=new Uint32Array(ML_HF.buffer);
function mlHalfW(v){ML_HF[0]=v;const x=ML_HU[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
function mlLayerRows(u0,v0,CM,M,j0,j1){const n=(j1-j0)*M,B=new Float32Array(n),Wl=new Float32Array(n),Mo=new Uint8Array(n),Ms=new Uint8Array(n*4),Gr=new Uint8Array(n),Wd=new Uint8Array(n),Tr=new Uint8Array(n),S0=new Uint16Array(n*4),S1=new Uint8Array(n*4),o={};
  for(let j=j0;j<j1;j++)for(let i=0;i<M;i++){const k=(j-j0)*M+i;mlZone(u0+(i+.5)*CM,v0+(j+.5)*CM,o);
    B[k]=o.h;Wl[k]=o.wl>-90?o.wl:o.h-1;Mo[k]=Math.round(o.moist*255);const w=[o.clay,o.silt,o.peat,o.sand];for(let c=0;c<4;c++)S1[k*4+c]=Ms[c*n+k]=Math.round(Math.max(0,Math.min(1,w[c]))*255);
    Gr[k]=Math.round(o.grass*255);Wd[k]=Math.round(o.wood*255);Tr[k]=o.trail<3.6?Math.round(255*(1-o.trail/3.6)):o.strip>.5&&o.stripD<4.2?Math.round(200*Math.min(1,(4.2-o.stripD)/1.5)):o.trk>.6?150:0;
    S0[k*4]=mlHalfW(B[k]);S0[k*4+1]=mlHalfW(Wl[k]);S0[k*4+2]=mlHalfW(Mo[k]/255);S0[k*4+3]=mlHalfW(Gr[k]>=Wd[k]?Gr[k]/255:-Wd[k]/255);}
  return {j0,j1,B,Wl,Mo,Ms,Gr,Wd,Tr,S0,S1};}
/* the grassland round it, out to the edge of the world: low swells, dry grass with bare patches */
function mlOuter(x,z,o){
  const h=ML_A.h0+9+3.2*(fbm(x/420,z/420,3,821)-.5)+1.1*(fbm(x/90,z/90,2,822)-.5);
  const bare=sst(.6,.72,fbm(x/55,z/55,3,823)),grass=Math.max(0,1-bare)*(.8+.2*vn(x/7,z/7,824));
  o.h=h;o.grass=grass;o.rock=0;o.mud=0;o.salt=0;o.sand=0;o.code=grass>.5?SF.grass:SF.dirt;return o;}
const MLM={};
function mlCore(x,z,o){
  const A=ML_A,u=x-A.x,v=z-A.z,e=ML_E(u,v)-A.old;
  if(e>A.m)mlOuter(x,z,o);
  else{const cu=Math.max(-A.old,Math.min(A.old+A.h,u)),cv=Math.max(-A.old,Math.min(A.old+A.h,v));mlMat(cu,cv,MLM);const h=A.h0+MLM.h;
    o.h=h;o.code=MLM.code===SF.water?SF.mud:MLM.code;o.grass=MLM.grass;o.rock=0;o.mud=MLM.mud;o.salt=0;o.sand=MLM.sand;
    if(e>0){const g={};mlOuter(x,z,g);const f=sst(0,A.m,e);o.h=h+(g.h-h)*f;o.grass=MLM.grass+(g.grass-MLM.grass)*f;}}
  o.h+=rimAt(x,z);o.ramp=0;o.wet=0;o.wl=o.h;o.B=o.h;o.rk=0;o.k=0;o.tm=0;o.tin=0;return o;}
/* the woods' trees, chunk by chunk (genStatic hands in its own addTree): a tree every 6 m or so where it's wooded,
   broadleaf mostly, pines up on the high ground */
function mlTrees(x0,z0,x1,z1,addTree){
  const A=ML_A,S=6.2,o={};
  for(let z=Math.floor(z0/S)*S;z<z1;z+=S)for(let x=Math.floor(x0/S)*S;x<x1;x+=S){
    const jx=x+hs(Math.round(x),Math.round(z),861)*S,jz=z+hs(Math.round(x),Math.round(z),862)*S;if(jx<x0||jx>=x1||jz<z0||jz>=z1)continue;
    const u=jx-A.x,v=jz-A.z;if(ML_E(u,v)>A.old-20)continue;mlZone(u,v,o);
    if(o.wood<.05||hs(Math.round(jx*3),Math.round(jz*3),863)>o.wood*.95)continue;
    const pine=o.h>14&&hs(Math.round(jx),Math.round(jz),864)<.6,sc=.8+.55*hs(Math.round(jx*2),Math.round(jz*2),865);
    addTree(jx,jz,pine?3:hs(Math.round(jx),Math.round(jz),866)<.5?0:1,sc,1);}}
/* the place's name for the screen */
function mlPlace(u,v){const e=ML_E(u,v);if(e>752)return 'Outside';if(e>724)return 'The bank';
  const o=mlZone(u,v,{});
  if(o.strip>.5)return 'The Heron Strip';
  /* (Mud Lab 19) */
  if(o.jmp)return ML_JUMPS[o.jmp-1].place;if(o.isle)return 'The island';if(o.trk>.5)return 'The Track';if(o.lake)return 'The Lake';
  /* (Mud Lab 20: on its banks too, 45 m back from the water's edge: the Shallows is 130 m wide, and its own bank said "Open country") */
  if(o.rvD<o.rvW+45)return v<-470?'The Narrows':v>290&&v<840?'The Shallows':v>1640?'The river mouth':'The River';
  if(u>700||v>700){if(o.trail<3.6){mlNear(ML_IDX.trail,ML_TR_F,u,v,MLT);if(MLT.n>=0)return ML_TRAILS[MLT.n].name;}
    for(const M of ML_MOUNDS)if(Math.hypot(u-M[0],v-M[1])<M[2]*.8)return 'The Mounds';
    if(Math.hypot((u-ML_LAKE.u)/(ML_LAKE.a+40),(v-ML_LAKE.v)/(ML_LAKE.b+40))<1)return 'The lake shore';
    if(o.dc<200&&o.h<1.5)return 'The Bottoms';if(u>1500)return 'The Far Side';return o.wood>.5?'A grove':'Open country';}
  {const B=ML_BOG;if(u>B.u0-6&&u<B.u1+4&&Math.abs(v-B.v)<B.hw+3)return 'The Bog';}
  for(const H of ML_HOLES)if(Math.hypot(u-H.u,v-H.v)<H.L+3)return H.big?'The Mud Hole':'A mud hole';
  if(o.trail<3.6){mlNear(ML_IDX.trail,ML_TR_F,u,v,MLT);if(MLT.n>=0)return ML_TRAILS[MLT.n].name;}
  if(o.wl>ML_NONE+1&&o.wl>o.h)return Math.hypot(u-ML_POND.u,v-ML_POND.v)<70?'The Pond':'Big Creek';
  if(Math.hypot(u-ML_QUARRY.u,v-ML_QUARRY.v)<70)return 'The Quarry';if(Math.hypot((u-ML_CLAY.u)/170,(v-ML_CLAY.v)/120)<1.1)return 'The Clay Pan';
  if(o.dc<200&&o.h<1.5)return 'The Bottoms';if(Math.hypot(u,v-650)<70)return 'The Trailhead';if(v<-480)return 'The Ridge';
  return o.wood>.5?'The woods':'The fields';}
