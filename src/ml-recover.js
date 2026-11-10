/* =====================================================================================
   MUD LAB 9: GETTING STUCK IS THE GAME.
   Two ways to play, picked on the title (remembered):
   - FREE PLAY: as before. Jump anywhere from the map; RESET, when you're bogged, sets you on the nearest firm ground.
   - REAL: no jumps, and RESET only rights a rolled truck. Bogged, you rock it out, winch to a tree, get the other SUV
     and strap it out, or take a tow home to the Trailhead (the map).
   Both SUVs are in the world at once now: the one you didn't pick stands by the Trailhead. On the map, GET IN puts you
   in it where it stands; in Free play BRING IT HERE sets it on firm ground within a strap's reach of you.
   - THE WINCH (both SUVs carry one; 9,500 lb, 100 ft of line): bogged with a tree in reach ahead (or, failing that,
     behind), WINCH appears. The line reels in at a steady pace, pulls up to its rating, and stalls at it: help it with
     the wheels. It lets go by itself at the tree.
   - THE STRAP (46 ft, stretchy: a kinetic rope): with the other SUV stopped in reach of the stuck one, STRAP appears;
     hooked to the nearer ends of each. Drive off and it comes tight; a little run at it yanks harder. The towed SUV
     rolls free with its wheels straight.
   Buttons only when they can do something (his rule): one button on the driving screen that reads WINCH, STRAP or
   UNHOOK (U on a keyboard), and, during a rescue, the other SUV's name to get into it (Enter).
   Nothing of the soil, the grip or either SUV's own physics is changed here: the lines only pull on the bodies (and,
   while one pulls, the pulled belly ploughs the mud it is sunk in: mlrPlough).
   ===================================================================================== */
const MLR={mode:(()=>{try{return localStorage.getItem('mudlab:play')==='real'?'real':'free';}catch(e){return 'free';}})(),
  other:null,made:false,live:false,stuck:false,stuckT:0,freeT:0,rescue:-1,note:'',t0:0,can:'',canSaid:'',seatOk:false,
  winch:null,strap:null,pull:null,btn:null,seat:null,mapA:null,mapB:null,clogSaid:false,trees:[],tc:[1e9,1e9],tree:null,treeT:-9,mesh:null,off:false};
const MLR_STRAP=14,MLR_LINE=30,MLR_WMAX=42300,MLR_WSPD=.45;
const MLR_HOLD={steer:0,thr:0,brk:1,hb:1,nos:false},MLR_TOW={steer:0,thr:0,brk:0,hb:0,nos:false},MLR_PAIR=[null,null];
const MLR_V=()=>new Float64Array(3),MLR_A=MLR_V(),MLR_B=MLR_V(),MLR_F=MLR_V(),MLR_G=MLR_V(),MLR_R=MLR_V(),MLR_X=MLR_V(),MLR_O=MLR_V(),MLR_VA=MLR_V(),MLR_VB=MLR_V(),MLR_Z={};
const mlrName=o=>ML_SUV_NAME[mlSuvKind(o)];
/* ---------- the pull of a line on a body ---------- */
/* a vehicle's recovery point: the middle of its front (end 1) or rear (-1) bumper, half a metre off the ground */
function mlrHook(v,end,o){const M=v.M,lx=end*(v.c.body.L/2-.1),ly=.5-v.c.hcg;o[0]=v.p[0]+M[0]*lx+M[1]*ly;o[1]=v.p[1]+M[3]*lx+M[4]*ly;o[2]=v.p[2]+M[6]*lx+M[7]*ly;return o;}
function mlrVel(v,P,o){const rx=P[0]-v.p[0],ry=P[1]-v.p[1],rz=P[2]-v.p[2],w=v.w;o[0]=v.v[0]+w[1]*rz-w[2]*ry;o[1]=v.v[1]+w[2]*rx-w[0]*rz;o[2]=v.v[2]+w[0]*ry-w[1]*rx;return o;}
/* the force F (newtons, the world's axes) on the body at the point P, for dt */
function mlrPush(v,P,F,dt){const m=v.m,R=MLR_R,X=MLR_X;v.v[0]+=F[0]/m*dt;v.v[1]+=F[1]/m*dt;v.v[2]+=F[2]/m*dt;
  R[0]=P[0]-v.p[0];R[1]=P[1]-v.p[1];R[2]=P[2]-v.p[2];X[0]=(R[1]*F[2]-R[2]*F[1])*dt;X[1]=(R[2]*F[0]-R[0]*F[2])*dt;X[2]=(R[0]*F[1]-R[1]*F[0])*dt;
  const dw=v.invI(MLR_O,v.M,X);v.w[0]+=dw[0];v.w[1]+=dw[1];v.w[2]+=dw[2];}
/* a line only pulls: its stretch times its stiffness, damped, up to what it can take */
const mlrTension=(k,c,ext,sep,max)=>{if(ext<=0)return 0;const T=k*ext+c*sep;return T<0?0:T>max?max:T;};
/* the winch, each physics step: the drum takes line in unless it's at its limit; the line pulls the hook to the tree */
function mlrWinchSub(dt,t){const Wn=MLR.winch,P=mlrHook(t,Wn.end,MLR_A),dx=Wn.x-P[0],dy=Wn.y-P[1],dz=Wn.z-P[2],d=Math.hypot(dx,dy,dz)||1;Wn.d=d;
  if(Wn.T<MLR_WMAX*.97)Wn.len=Math.max(2,Wn.len-MLR_WSPD*dt);
  const ext=d-Wn.len;if(ext<=0){Wn.T=0;return;}
  const V=mlrVel(t,P,MLR_VA),T=mlrTension(260000,26000,ext,-(V[0]*dx+V[1]*dy+V[2]*dz)/d,MLR_WMAX);Wn.T=T;
  MLR_F[0]=dx/d*T;MLR_F[1]=dy/d*T;MLR_F[2]=dz/d*T;mlrPush(t,P,MLR_F,dt);}
/* the strap, each physics step: slack until the two hooks are its length apart, then it stretches and pulls both */
function mlrStrapSub(dt,t,o){const S=MLR.strap,A=mlrHook(t,S.a,MLR_A),B=mlrHook(o,S.b,MLR_B),dx=B[0]-A[0],dy=B[1]-A[1],dz=B[2]-A[2],d=Math.hypot(dx,dy,dz)||1;S.d=d;
  const ext=d-MLR_STRAP;if(ext<=0){S.T=0;return;}
  const Va=mlrVel(t,A,MLR_VA),Vb=mlrVel(o,B,MLR_VB),T=mlrTension(70000,9000,ext,((Vb[0]-Va[0])*dx+(Vb[1]-Va[1])*dy+(Vb[2]-Va[2])*dz)/d,160000);S.T=T;if(T>S.peak)S.peak=T;
  MLR_F[0]=dx/d*T;MLR_F[1]=dy/d*T;MLR_F[2]=dz/d*T;mlrPush(t,A,MLR_F,dt);MLR_G[0]=-MLR_F[0];MLR_G[1]=-MLR_F[1];MLR_G[2]=-MLR_F[2];mlrPush(o,B,MLR_G,dt);}
/* a body dragged by a line ploughs its own trough. The engine holds a hull out of the ground as if the ground were
   rock, so a truck sunk to its floor stood fast against any pull; real mud gives way. While a line is pulling (and
   only then: nothing of driving changes), the soil the belly is into is cut down to it and left churned. Limits,
   each learned from a hole it dug: only the lowest of the hull; only soil standing less than 40 cm over it; no
   trough deeper than a metre (Mud Lab 10: build 9 carved a valley into the pond's bank); and never where the land
   itself slopes more than about 11 degrees (Mud Lab 11: at a bank's foot it dug a pit instead of climbing) */
function mlrPlough(v){if(!MLS.ready||!v.hull)return 0;const C=MLS.C,N=MLS.N,M=v.M,p=v.p;let n=0;
  if(!v.mlBelly){let lo=1e9;for(const hp of v.hull)lo=Math.min(lo,hp[1]);v.mlBelly=v.hull.filter(hp=>hp[1]<lo+.3);}
  for(const hp of v.mlBelly){const x=p[0]+M[0]*hp[0]+M[1]*hp[1]+M[2]*hp[2],y=p[1]+M[3]*hp[0]+M[4]*hp[1]+M[5]*hp[2],z=p[2]+M[6]*hp[0]+M[7]*hp[1]+M[8]*hp[2];
    const ci=Math.floor((x-MLS.x0)/C),cj=Math.floor((z-MLS.z0)/C);if(ci<6||cj<6||ci>N-7||cj>N-7)continue;
    if(Math.hypot(mlBase(x+1,z)-mlBase(x-1,z),mlBase(x,z+1)-mlBase(x,z-1))>.4)continue;
    const Hc=y-MLS.h0-.03;
    for(let j=cj-3;j<=cj+3;j++)for(let i=ci-3;i<=ci+3;i++){const T=mlTile(i>>6,j>>6,true),k=((j&63)<<6)|(i&63),cur=mlBase(MLS.x0+(i+.5)*C,MLS.z0+(j+.5)*C)+T.r[k],over=cur-Hc;
      if(over>0&&over<.4&&T.r[k]>-1){T.r[k]=Math.max(-1,T.r[k]-over);T.ch[k]=Math.min(255,T.ch[k]+60);mlDirtyT(T);n++;}}}
  return n;}
/* a fixed line for the pull test (src/ml-bog.js): from the rear hook to a post; it only holds, and reads the pull */
function mlrPullSub(dt,t){const P=MLR.pull,H=mlrHook(t,-1,MLR_A),dx=P.x-H[0],dy=P.y-H[1],dz=P.z-H[2],d=Math.hypot(dx,dy,dz)||1;P.d=d;
  const ext=d-P.len;if(ext<=0){P.T=0;return;}
  const V=mlrVel(t,H,MLR_VA),T=mlrTension(300000,30000,ext,-(V[0]*dx+V[1]*dy+V[2]*dz)/d,400000);P.T=T;
  MLR_F[0]=dx/d*T;MLR_F[1]=dy/d*T;MLR_F[2]=dz/d*T;mlrPush(t,H,MLR_F,dt);}
/* each physics step, after yours: the other SUV on the physics while it's strapped, within 8 m (near enough to touch), or still
   moving (otherwise it only stands there, drawn); the two touching; the lines */
const MLR_TS=trafficSub;
trafficSub=function(dt){MLR_TS(dt);mlrSub(dt);};
function mlrSub(dt){const t=GAME.car;MLR.live=false;if(!t||GAME.state!=='drive'||MLR.off||t.rt)return;
  if(MLR.winch)mlrWinchSub(dt,t);if(MLR.pull)mlrPullSub(dt,t);
  const o=MLR.other;if(!o)return;const dx=o.p[0]-t.p[0],dz=o.p[2]-t.p[2],near=dx*dx+dz*dz<72;
  if(!(MLR.strap||near||o.mlMove>0))return;
  /* (towed: out of gear, rolling free, the wheels straight; standing: on its brakes) */
  if(MLR.strap){const pt=o.pt;if(pt.st!=='off')pt.st='off';if(pt.gear!==0){pt.gear=0;pt.clutch='open';}}
  o.step(dt,MLR.strap?MLR_TOW:MLR_HOLD);
  if(near){MLR_PAIR[0]=t;MLR_PAIR[1]=o;carContacts(MLR_PAIR);}
  if(MLR.strap)mlrStrapSub(dt,t,o);
  o.mlMove=o.speed>.3?1:Math.max(0,(o.mlMove||0)-dt);MLR.live=true;}
/* (for the soil: the other SUV, when it was on the physics this frame: src/ml-soil.js mlStep) */
const mlrLive=()=>MLR.live&&MLR.other&&!MLR.off?MLR.other:null;
/* ---------- the other SUV ---------- */
function mlrMake(kind,pose){const i=mlSuvIdx(kind);if(i<0)return null;let o=null;
  try{o=makeCar(i,RANCH.world,simOpts(),plusK(BUILDS[i].car),plusG(BUILDS[i].car));o.setAssists(APP.level);devFit(o);truck(i);if(!RECENT.includes(BUILDS[i].id))RECENT.push(BUILDS[i].id);}
  catch(e){console.warn('the other SUV',e);return null;}
  mlvStand(o,pose);o.mlDirt=BUILDS[i].dirt||0;return o;}
/* the first time you drive: the one you didn't pick, ahead of you and to the right, where you can see it */
function mlrFirst(t){MLR.made=true;const k=mlSuvKind(t)==='stock'?'crawler':'stock',yaw=mlvYaw(t),r=[Math.sin(yaw),Math.cos(yaw)],f=[Math.cos(yaw),-Math.sin(yaw)];
  const s=mlvSpot(t.p[0]+r[0]*8+f[0]*9,t.p[2]+r[1]*8+f[1]*9,t.p[0],t.p[2],7);s.yaw=yaw+.5;MLR.other=mlrMake(k,s);}
/* into the other SUV, where it stands; the one you were in stays where it is (strapped, if it was) */
function mlrSeat(){const t=GAME.car,o=MLR.other;if(!t||t.rt||!o||GAME.state!=='drive')return false;
  if(t.speed>1.5){say('STOP FIRST',1.4);return false;}
  if(MLR.winch)mlrUnhook();
  const pose={x:o.p[0],z:o.p[2],yaw:mlvYaw(o)},k=mlSuvKind(o),S=MLR.strap,wasStuck=MLR.stuck,d=o.mlDirt||0;
  t.mlDirt=GAME.dirt;t.mlStuck=wasStuck;t.mlMove=1;
  spawnCar(o.bi,pose.x,pose.z,pose.yaw);GAME.dirt=d;MLR.other=t;
  /* (the one you left: its engine off; the one you're in now: running) */
  {const n=GAME.car.pt;if(n.st==='off'){n.st='run';n.we=n.e.idle*TAU/60;}t.pt.st='off';}MLSV.pick=k;try{localStorage.setItem('mudlab:suv',k);}catch(e){}
  if(S){const a=S.a;S.a=S.b;S.b=a;}
  MLR.stuck=false;MLR.stuckT=0;MLR.rescue=GAME.time+(wasStuck||S?240:0);MLR.tree=null;APP.bigMap=false;MLV.quiet=APP.t+4;say('THE '+ML_SUV_NAME[k],1.6);return true;}
/* which ends of the two are nearest each other, and how far apart */
function mlrReach(t,o){let best=null;for(const a of [1,-1])for(const b of [1,-1]){const A=mlrHook(t,a,MLR_A),B=mlrHook(o,b,MLR_B),d=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]);if(!best||d<best.d)best={a,b,d};}return best;}
/* firm ground to stand a rescue truck on: dry, out of the trees, not a hole's wet rim */
function mlrFirm(x,z){const A=WG.mlA,u=x-A.x,v=z-A.z;if(Math.max(Math.abs(u),Math.abs(v))>A.h-30)return false;WG.mlZone(u,v,MLR_Z);return !(MLR_Z.wl>MLR_Z.h-.02)&&MLR_Z.wood<.25&&MLR_Z.moist<.72;}
/* Free play: the other SUV set on firm ground within the strap's reach, behind you if there's room there */
function mlrBring(){const t=GAME.car,o=MLR.other;if(!t||t.rt||!o)return false;if(MLR.strap)mlrUnhook();
  const yaw=mlvYaw(t),f=[Math.cos(yaw),-Math.sin(yaw)],bx=t.p[0]-f[0]*11,bz=t.p[2]-f[1]*11;let best=null,bs=1e9;
  for(const r of [9,11,13,7,15])for(let k=0;k<20;k++){const a=k/20*TAU,x=t.p[0]+Math.cos(a)*r,z=t.p[2]+Math.sin(a)*r;if(!mlrFirm(x,z))continue;const s=Math.hypot(x-bx,z-bz)+(r>13?6:0);if(s<bs){bs=s;best={x,z};}}
  if(!best)best=mlvSpot(t.p[0],t.p[2],t.p[0],t.p[2],8);
  /* (facing away from you: get in, drive off forwards, and the strap comes tight) */
  best.yaw=Math.atan2(-(best.z-t.p[2]),best.x-t.p[0]);mlvStand(o,best);o.v.fill(0);o.w.fill(0);o.mlStuck=false;o.mlMove=1;
  MLR.rescue=GAME.time+240;APP.bigMap=false;say('THE '+mlrName(o)+' IS HERE',1.8);return true;}
/* Real: a tow home. Both SUVs back at the Trailhead */
function mlrHome(){const t=GAME.car,o=MLR.other;if(!t||t.rt)return false;mlrUnhook();placeCar(HOME[0],HOME[1],HOME[2]);
  if(o){const yaw=HOME[2],r=[Math.sin(yaw),Math.cos(yaw)],s=mlvSpot(HOME[0]+r[0]*12,HOME[1]+r[1]*12,HOME[0],HOME[1],8);s.yaw=yaw;mlvStand(o,s);o.v.fill(0);o.w.fill(0);o.mlStuck=false;}
  MLR.stuck=false;MLR.stuckT=0;MLR.rescue=-1;APP.bigMap=false;MLR.note='TOWED HOME TO THE TRAILHEAD';return true;}
/* ---------- the trees a winch line can reach ---------- */
function mlrTrees(x,z){if(Math.hypot(x-MLR.tc[0],z-MLR.tc[1])<8)return MLR.trees;MLR.tc=[x,z];const L=MLR.trees=[];
  try{WG.mlTrees(x-44,z-44,x+44,z+44,(tx,tz)=>{L.push(tx,tz);});}catch(e){}return L;}
/* the tree to hook: within the line's reach of the front hook and within 60 degrees of straight ahead, the one that
   gives the longest, straightest pull (a tree beside you gets you nowhere); if there's none ahead, the same behind */
function mlrTree(t){if(GAME.time-MLR.treeT<.4)return MLR.tree;MLR.treeT=GAME.time;const L=mlrTrees(t.p[0],t.p[2]),M=t.M;let best=null;
  for(const end of [1,-1]){const P=mlrHook(t,end,MLR_A),fx=M[0]*end,fz=M[6]*end;let bs=0;
    for(let q=0;q<L.length;q+=2){const dx=L[q]-P[0],dz=L[q+1]-P[2],d=Math.hypot(dx,dz);if(d<6||d>MLR_LINE)continue;const c=(dx*fx+dz*fz)/d;if(c<.5)continue;const s=c*c*Math.min(d,26);if(s>bs){bs=s;best={x:L[q],z:L[q+1],end,d};}}
    if(best)break;}
  return MLR.tree=best;}
function mlrHookUp(){const t=GAME.car,o=MLR.other;if(!t||t.rt||GAME.state!=='drive')return false;
  if(MLR.winch||MLR.strap||MLR.pull){mlrUnhook(MLR.winch?'WINCH LINE OFF':MLR.pull?'PULL LINE OFF':'STRAP OFF');return true;}
  if(MLR.can==='PULL TEST')return mlbPullHook(t);
  if(MLR.can==='STRAP'&&o){const R=mlrReach(t,o);if(R.d>MLR_STRAP)return false;MLR.strap={a:R.a,b:R.b,d:R.d,T:0,peak:0};o.mlMove=1;
    say(MLR.stuck?'STRAP ON. GET IN THE '+mlrName(o)+' AND PULL':'STRAP ON: EASE AWAY, THEN PULL',2.8);return true;}
  if(MLR.can==='WINCH'){MLR.treeT=-9;const T=mlrTree(t);if(!T)return false;const P=mlrHook(t,T.end,MLR_A),y=RANCH.W.heightAt(T.x,T.z)+.7,d=Math.hypot(T.x-P[0],y-P[1],T.z-P[2]);
    MLR.winch={x:T.x,y,z:T.z,end:T.end,len:d,d,T:0,stallT:0,said:0};say('WINCH LINE ON A TREE '+Math.round(d*3.281)+' FT '+(T.end>0?'AHEAD':'BEHIND'),2.6);return true;}
  return false;}
function mlrUnhook(msg){const o=MLR.other;MLR.pull=null;if(MLR.strap){if(o){o.mlStuck=false;o.mlMove=1;}MLR.rescue=GAME.time+240;}MLR.winch=null;MLR.strap=null;if(msg)say(msg,1.8);}
/* ---------- RESET: for a roll-over, as it was. Bogged and upright: Free play sets you on the nearest firm ground;
   Real leaves you where you are ---------- */
const MLR_RESET=resetCar;
resetCar=function(){const t=GAME.car;
  if(t&&!t.rt&&!MLR.off&&MLR.stuck&&t.M[4]>.5){
    if(MLR.mode==='real'){MLR.note='BOGGED: ROCK IT, WINCH, STRAP, OR A TOW HOME (MAP)';return;}
    mlrUnhook();let s=null;for(let r=4;r<60&&!s;r+=3)for(let k=0;k<16;k++){const a=k/16*TAU,x=t.p[0]+Math.cos(a)*r,z=t.p[2]+Math.sin(a)*r;if(mlrFirm(x,z)){s={x,z};break;}}
    if(!s)s=mlvSpot(t.p[0],t.p[2],t.p[0],t.p[2],6);placeCar(s.x,s.z,mlvYaw(t));MLR.stuck=false;MLR.stuckT=0;MLR.note='ON FIRM GROUND';return;}
  if(MLR.winch)mlrUnhook();MLR_RESET();};
/* ---------- each frame ---------- */
const MLR_VT=mlvTick;
mlvTick=function(){MLR_VT();mlrTick();};
function mlrTick(){const t=GAME.car;if(!t||GAME.state!=='drive'||!WG.mlStrip||MLR.off)return;
  const now=GAME.time,dt=Math.max(0,Math.min(.1,now-(MLR.t0||now)));MLR.t0=now;mlrUI();
  if(MLR.note){say(MLR.note,3);MLR.note='';}
  if(t.rt){mlrShow('',false);mlrMap();return;}
  if(!MLR.other&&!MLR.made)mlrFirst(t);
  const o=MLR.other;if(o){if(o.takeEvents)o.takeEvents();if(o.pt&&o.pt.takeEvents)o.pt.takeEvents();}
  /* tyre pressure: each SUV keeps its own (remembered) */
  if(t.mlAirI===undefined)mlrAirSet(t,mlrAirGet(mlSuvKind(t)));if(o&&o.mlAirI===undefined)mlrAirSet(o,mlrAirGet(mlSuvKind(o)));
  /* the tread packed with clay (the soil's own clogging, as it always was: now it says so, once each time) */
  {let c=0;for(const w of t.wheels)c+=w.mlClog||0;c/=4;if(c>.45&&!MLR.clogSaid){MLR.clogSaid=true;say('TREAD PACKED WITH CLAY: SPIN IT CLEAN',2.8);}else if(c<.2)MLR.clogSaid=false;}
  mlbTick(t,dt);
  /* bogged: the throttle down (either way) on soil and going nowhere for a couple of seconds; out: moving again */
  const soil=t.wheels.some(w=>w.mlOn);
  /* (not while it's held by the pull test's line: standing still at full throttle is the test) */
  if(soil&&!MLR.pull&&(t.thrIn||0)>.5&&t.speed<.45)MLR.stuckT+=dt;else MLR.stuckT=Math.max(0,MLR.stuckT-dt*1.5);
  if(!MLR.stuck&&MLR.stuckT>2.2){MLR.stuck=true;MLR.freeT=0;MLR.treeT=-9;
    say(MLR.mode==='real'?'BOGGED. ROCK IT, WINCH TO A TREE, OR GET THE OTHER SUV (MAP)':'BOGGED. ROCK IT, WINCH, STRAP, OR RESET',3.6);}
  if(MLR.stuck){if(t.speed>2.2){MLR.freeT+=dt;if(MLR.freeT>1.2){MLR.stuck=false;MLR.stuckT=0;}}else MLR.freeT=0;}
  if(MLR.winch){const Wn=MLR.winch;
    if(Wn.d<3.4)mlrUnhook('AT THE TREE: WINCH LINE OFF');
    else if(Wn.d>MLR_LINE+6)mlrUnhook('WINCH LINE OFF');
    else{
      /* (stalled: the line has come in less than a foot in four seconds. Climbing more than about 14 degrees to its
         tree, it's pulling you at a bank, not along the ground: it lets go. Otherwise it says to help it) */
      Wn.stallT+=dt;if(Wn.stallT>4){const took=(Wn.len0===undefined?Wn.len+9:Wn.len0)-Wn.len;Wn.len0=Wn.len;Wn.stallT=0;
        if(took<.3){const P=mlrHook(t,Wn.end,MLR_A),rise=Wn.y-P[1],run=Math.hypot(Wn.x-P[0],Wn.z-P[2])||1;
          if(rise/run>.25)mlrUnhook('TOO STEEP FOR THE WINCH: LINE OFF');
          else if(!Wn.said){Wn.said=1;say('THE WINCH IS AT ITS LIMIT: HELP IT WITH THE WHEELS',3.2);}}}}}
  if(MLR.strap&&(!o||MLR.strap.d>MLR_STRAP+14))mlrUnhook('THE STRAP CAME OFF');
  if(MLR.winch&&MLR.winch.T>2000)mlrPlough(t);
  if(MLR.strap&&MLR.strap.T>2000&&o){mlrPlough(o);mlrPlough(t);}
  /* what the button can do now */
  let can='',seat=false;
  if(MLR.winch||MLR.strap||MLR.pull)can='UNHOOK';
  else if(t.speed<1.5){const help=MLR.stuck||o&&o.mlStuck||MLR.rescue>now;
    if(o&&help&&mlrReach(t,o).d<=MLR_STRAP)can='STRAP';else if(MLR.stuck&&mlrTree(t))can='WINCH';else if(mlbPullCan(t))can='PULL TEST';}
  if(o&&t.speed<1.5&&(MLR.strap||MLR.stuck||o.mlStuck||MLR.rescue>now)&&Math.hypot(o.p[0]-t.p[0],o.p[2]-t.p[2])<MLR_STRAP+10)seat=true;
  MLR.can=can;MLR.seatOk=seat;mlrShow(can,seat);
  if(can&&can!==MLR.canSaid&&!GAME.touch&&can!=='UNHOOK')say('U: '+can,1.8);MLR.canSaid=can;
  mlrMap();}
/* ---------- the buttons ---------- */
function mlrUI(){if(MLR.btn)return;const col=document.querySelector('#touch .tside.R');if(!col)return;
  const mk=(id,fn)=>{const b=document.createElement('button');b.className='tb';b.id=id;b.type='button';b.hidden=true;b.addEventListener('click',e=>{e.preventDefault();b.blur();fn();});col.insertBefore(b,col.firstChild);return b;};
  MLR.seat=mk('mlSeat',mlrSeat);MLR.btn=mk('mlRec',mlrHookUp);}
function mlrShow(can,seat){const b=MLR.btn,s=MLR.seat;if(!b)return;if(b.hidden!==!can)b.hidden=!can;if(can&&b.textContent!==can)b.textContent=can;
  if(s.hidden!==!seat)s.hidden=!seat;if(seat){const nm=ML_SUV_SHORT[mlSuvKind(MLR.other)];if(s.textContent!==nm)s.textContent=nm;}}
addEventListener('keydown',e=>{if(e.code==='KeyU'&&!e.repeat&&GAME.state==='drive'&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||''))mlrHookUp();});
/* (Enter: into the Heron when you can; otherwise, in a rescue, into the other SUV) */
const MLR_SW=mlvSwap;
mlvSwap=function(){if(!MLV.can&&MLR.seatOk&&GAME.car&&!GAME.car.rt)return mlrSeat();return MLR_SW();};
/* on the map, under the SUV's own button: BRING IT HERE (Free play), or A TOW HOME when you're bogged (Real) */
function mlrMap(){mlrAirBtn();const t=GAME.car,o=MLR.other;let b=MLR.mapA;const show=APP.bigMap&&GAME.state==='drive'&&t&&!t.rt&&o&&(MLR.mode==='free'||MLR.stuck);
  if(!b){if(!show)return;b=MLR.mapA=document.createElement('button');b.type='button';b.id='mlBring';
    b.style.cssText='position:fixed;right:calc(env(safe-area-inset-right) + 12px);top:calc(50% + 6px);z-index:61;font:600 13px system-ui,sans-serif;letter-spacing:.05em;padding:9px 16px;border-radius:999px;border:1px solid rgba(242,230,210,.35);background:rgba(20,14,9,.72);color:#f2e6d2;cursor:pointer';
    b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();if(MLR.mode==='free')mlrBring();else mlrHome();});document.body.appendChild(b);}
  if(b.hidden!==!show)b.hidden=!show;if(show){const nm=MLR.mode==='free'?'BRING THE '+ML_SUV_SHORT[mlSuvKind(o)]+' HERE':'A TOW HOME';if(b.textContent!==nm)b.textContent=nm;}}
/* ---------- tyre pressure (Mud Lab 10): road, trail, soft. Aired down, the footprint is longer and a little wider:
   the tyre sinks less and grips soft or slick ground better (src/ml-soil.js), and drags a little on firm ground.
   On the map, TYRES: steps through them, stopped. Road pressure is the SUV exactly as it always drove ---------- */
const ML_AIRS=[{name:'ROAD',psi:35,kL:1,kW:1,g:0,rr:0},{name:'TRAIL',psi:20,kL:1.25,kW:1.04,g:.1,rr:.012},{name:'SOFT',psi:12,kL:1.5,kW:1.08,g:.18,rr:.03}];
function mlrAirGet(k){try{const i=+localStorage.getItem('mudlab:air:'+k);return i===1||i===2?i:0;}catch(e){return 0;}}
function mlrAirSet(v,i){v.mlAirI=i;v.mlAir=i?ML_AIRS[i]:null;}
function mlrAirNext(){const t=GAME.car;if(!t||t.rt)return;if(t.speed>1.5){say('STOP FIRST',1.4);return;}
  const i=((t.mlAirI||0)+1)%3,A=ML_AIRS[i];mlrAirSet(t,i);try{localStorage.setItem('mudlab:air:'+mlSuvKind(t),i);}catch(e){}
  say(i?'TYRES AT '+A.psi+' PSI: A LONGER FOOTPRINT, LESS SINKING':'TYRES BACK AT '+A.psi+' PSI',2.6);}
function mlrAirBtn(){const t=GAME.car;let b=MLR.mapB;const show=APP.bigMap&&GAME.state==='drive'&&t&&!t.rt;
  if(!b){if(!show)return;b=MLR.mapB=document.createElement('button');b.type='button';b.id='mlAir';
    b.style.cssText='position:fixed;right:calc(env(safe-area-inset-right) + 12px);top:calc(50% + 50px);z-index:61;font:600 13px system-ui,sans-serif;letter-spacing:.05em;padding:9px 16px;border-radius:999px;border:1px solid rgba(242,230,210,.35);background:rgba(20,14,9,.72);color:#f2e6d2;cursor:pointer';
    b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();mlrAirNext();mlrAirBtn();});document.body.appendChild(b);}
  if(b.hidden!==!show)b.hidden=!show;if(show){const A=ML_AIRS[t.mlAirI||0],nm='TYRES: '+A.name+' '+A.psi+' PSI';if(b.textContent!==nm)b.textContent=nm;}}
/* ---------- the title: which way to play ---------- */
function mlrTitle(root){const row=root.querySelector('#mlPick');if(!row)return;
  row.insertAdjacentHTML('beforeend','<span class="gap"></span><button type="button" data-m="free">Free play</button><button type="button" data-m="real">Real</button>');
  const note=document.createElement('div');note.id='mlPlayNote';row.parentNode.insertBefore(note,row.nextSibling);
  const paint=()=>{for(const x of row.children)if(x.dataset.m)x.classList.toggle('on',x.dataset.m===MLR.mode);
    note.textContent=(MLR.mode==='real'?'Real: no jumps. Bogged means rock it out, winch to a tree, strap it out with the other SUV, or a tow home.':'Free play: jump anywhere on the map. Bogged, RESET sets you on firm ground. The winch and the strap are there too.')+' Tap your SUV again for bigger tyres.';};
  row.addEventListener('click',e=>{const m=e.target&&e.target.dataset&&e.target.dataset.m;if(m){MLR.mode=m;try{localStorage.setItem('mudlab:play',m);}catch(_){}}paint();});paint();
  const st=document.createElement('style');st.textContent='#mlPick .gap{display:inline-block;width:14px}#mlPlayNote{font:12px system-ui,sans-serif;opacity:.85;margin:-6px auto 12px;max-width:520px;min-height:30px;text-shadow:0 1px 6px rgba(0,0,0,.6)}';document.head.appendChild(st);}
/* ---------- drawn: the other SUV where it stands (its coarse copy past 45 m), its shadow near you, the lines ---------- */
function mlrMesh(rgb){const pos=[],nrm=[],col=[],mat=[],idx=[],uv=[];
  /* (a bar one long along x, one each way across: four sides, drawn from both faces) */
  for(const [n,P] of [[[0,1,0],[[0,1,-1],[1,1,-1],[1,1,1],[0,1,1]]],[[0,-1,0],[[0,-1,-1],[1,-1,-1],[1,-1,1],[0,-1,1]]],[[0,0,1],[[0,-1,1],[1,-1,1],[1,1,1],[0,1,1]]],[[0,0,-1],[[0,-1,-1],[1,-1,-1],[1,1,-1],[0,1,-1]]]]){
    const k=pos.length/3;for(const q of P){pos.push(q[0],q[1],q[2]);nrm.push(n[0],n[1],n[2]);col.push(rgb[0],rgb[1],rgb[2],0);mat.push(0);uv.push(0,0);}idx.push(k,k+1,k+2,k,k+2,k+3,k,k+2,k+1,k,k+3,k+2);}
  return makeMesh({pos:new Float32Array(pos),nrm:new Float32Array(nrm),col:new Float32Array(col),mat:new Float32Array(mat),idx:new Uint16Array(idx),uv:new Float32Array(uv)});}
function mlrSeg(mesh,A,B,r){const dx=B[0]-A[0],dy=B[1]-A[1],dz=B[2]-A[2],L=Math.hypot(dx,dy,dz);if(!(L>1e-3)||!Number.isFinite(L))return 0;
  let sx=dz,sz=-dx;const sl=Math.hypot(sx,sz);if(sl<1e-4){sx=1;sz=0;}else{sx/=sl;sz/=sl;}
  const nx=dx/L,ny=dy/L,nz=dz/L,ux=ny*sz,uy=nz*sx-nx*sz,uz=-ny*sx,u=CUR.u;
  const M=M4.basis([A[0]-RO[0],A[1]-RO[1],A[2]-RO[2]],[dx,dy,dz],[ux*r,uy*r,uz*r],[sx*r,0,sz*r]);
  gl.uniformMatrix4fv(u.uM,false,M);gl.uniformMatrix4fv(u.uPrevM,false,M);drawMesh(mesh);return 16;}
/* a line from A to B that sags by how slack it is, kept off the ground */
function mlrRope(mesh,A,B,slack,r){const n=6;let tris=0,p0=[A[0],A[1],A[2]];const sag=Math.max(0,Math.min(1.4,slack*.7));
  for(let k=1;k<=n;k++){const s=k/n,p=[A[0]+(B[0]-A[0])*s,A[1]+(B[1]-A[1])*s-sag*4*s*(1-s),A[2]+(B[2]-A[2])*s];
    if(k<n&&sag>.02){const g=RANCH.W.heightAt(p[0],p[2])+.04;if(p[1]<g)p[1]=g;}tris+=mlrSeg(mesh,p0,p,r);p0=p;}return tris;}
function mlrLines(){const t=GAME.car,o=MLR.other;if(!t||t.rt||!(MLR.winch||MLR.strap||MLR.pull))return 0;
  if(!MLR.mesh)MLR.mesh={strap:mlrMesh([.62,.36,.03]),line:mlrMesh([.09,.09,.1])};
  const u=CUR.u;if(u.uMudOff)gl.uniform1f(u.uMudOff,1);let n=0;
  if(MLR.winch){const Wn=MLR.winch,P=mlrHook(t,Wn.end,MLR_A);n+=mlrRope(MLR.mesh.line,P,[Wn.x,Wn.y,Wn.z],Math.max(0,Wn.len-Wn.d),.02);}
  if(MLR.pull){const P=MLR.pull,H=mlrHook(t,-1,MLR_A);n+=mlrRope(MLR.mesh.strap,[H[0],H[1],H[2]],[P.x,P.y,P.z],Math.max(0,P.len-P.d),.03);}
  if(MLR.strap&&o){const A=mlrHook(t,MLR.strap.a,MLR_A),B=mlrHook(o,MLR.strap.b,MLR_B);n+=mlrRope(MLR.mesh.strap,[A[0],A[1],A[2]],B,Math.max(0,MLR_STRAP-MLR.strap.d),.03);}
  return n;}
/* (a parked vehicle outside the picture isn't drawn: the Heron on its strip behind you was 60,000 triangles a frame;
   its shadow still falls where it should. Past 30 m the other SUV is its coarse copy) */
function mlrSeen(P,r){const cam=CAM.last;if(!cam||!cam.VPw)return true;if(MLR.frT!==APP.t){MLR.frT=APP.t;MLR.fr=frustum(cam.VPw);}
  for(let q=0;q<6;q++){const p=MLR.fr[q];if(p[0]*P[0]+p[1]*P[1]+p[2]*P[2]+p[3]<-r)return false;}return true;}
/* ---------- (Mud Lab 11) the Heron from far off: the same model with its corners merged on a 10 cm grid, drawn in its
   place (and into the shadows) from more than 70 m away on a phone (130 m on a laptop), where a pixel is wider than that. The model had no
   simpler copy: all 60,481 triangles were drawn out to 450 m ---------- */
const MLF={on:false,full:0,far:0,parts:[]};
function mlFarMesh(d,cell){try{const pos=d.pos,n=pos.length/3,map=new Map(),remap=new Uint32Array(n),keep=[];
    for(let k=0;k<n;k++){const key=Math.round(pos[k*3]/cell)+','+Math.round(pos[k*3+1]/cell)+','+Math.round(pos[k*3+2]/cell)+','+(d.mat?d.mat[k]:0);let q=map.get(key);if(q===undefined){q=keep.length;map.set(key,q);keep.push(k);}remap[k]=q;}
    const src=d.idx,out=[];for(let q=0;q<src.length;q+=3){const a=remap[src[q]],b=remap[src[q+1]],c=remap[src[q+2]];if(a!==b&&b!==c&&a!==c)out.push(a,b,c);}
    if(out.length<9||out.length>src.length*.85)return null;
    const pick=(arr,st)=>{if(!arr)return undefined;const o=new Float32Array(keep.length*st);for(let q=0;q<keep.length;q++)for(let c=0;c<st;c++)o[q*st+c]=arr[keep[q]*st+c];return o;};
    const f={pos:pick(pos,3),nrm:pick(d.nrm,3),col:pick(d.col,4),mat:pick(d.mat,1),idx:keep.length>65535?new Uint32Array(out):new Uint16Array(out)};if(d.uv)f.uv=pick(d.uv,2);
    const m=makeMesh(f);m.tris=out.length/3;return m;}catch(e){console.warn('far copy',e);return null;}}
/* (a piece's far copy: on the 10 cm grid; a piece that mostly vanishes on it (struts, gear legs: tubes thinner than the
   grid) is tried on a 4 cm grid, and kept whole if it still mostly vanishes) */
function mlFarPiece(m,d,nm,full){let f=mlFarMesh(d,.1),c=.1;if(!f||f.tris<full*.22){f=mlFarMesh(d,.04);c=.04;if(f&&f.tris<full*.22)f=null;}
  MLF.parts.push([nm,full,f?f.tris:full,f?c:0]);MLF.full+=full;MLF.far+=f?f.tris:full;if(f)m.far=f;}
const MLF_DM=drawMesh;
drawMesh=function(m){return MLF_DM(MLF.on&&m.far?m.far:m);};
/* (from 70 m on the phone's tier; from 130 m on a laptop's, whose pixels are finer) */
const mlfFar=(P,x,z)=>!!(P&&P.rt&&MLF.far>0&&Math.hypot(P.p[0]-x,P.p[2]-z)>(GFX.level==='mobile'?70:130));
const MLF_SH=mlvShadow;
mlvShadow=function(){const r=MLF_SH();if(r){const t=GAME.car;MLF.on=!!t&&mlfFar(mlvParked(),t.p[0],t.p[2]);}return r;};
const MLR_VD=mlvDraw;
mlvDraw=function(eye){MLF.on=false;if(MLR.off)return MLR_VD(eye);let n=0;const P=mlvParked(),o=MLR.other;
  if(P&&mlrSeen(P.p,P.rt?10:5)){const far=mlfFar(P,eye[0],eye[2]);MLF.on=far;n=MLR_VD(eye);MLF.on=false;if(far&&n>MLF.full-MLF.far)n-=MLF.full-MLF.far;}
  if(GAME.state!=='drive')return n;
  if(o&&mlrSeen(o.p,5)){const d=Math.hypot(o.p[0]-eye[0],o.p[2]-eye[2]);if(d<450)n+=drawWorldCar(o,null,o.mlDirt||0,d>30,false)||0;}
  return n+mlrLines()+mlbDraw(eye);};
const mlrShadow=()=>{MLF.on=false;const o=MLR.other,t=GAME.car;return o&&t&&!MLR.off&&GAME.state==='drive'&&Math.hypot(o.p[0]-t.p[0],o.p[2]-t.p[2])<60?o:null;};
/* (for the tests: no other SUV, nothing hooked) */
window.__mlr={MLR,MLF,mlrSeat,mlrBring,mlrHome,mlrHookUp,mlrUnhook,mlrTree,mlrTrees,mlrReach,mlrMake,mlrFirm,mlrAirSet,mlrAirNext,ML_AIRS,testClear(){MLR.other=null;MLR.made=true;MLR.winch=null;MLR.strap=null;MLR.pull=null;MLR.stuck=false;MLR.stuckT=0;MLR.rescue=-1;}};
