/* =====================================================================================
   THE BOG AND THE PULL TEST (Mud Lab 10's, for the alternate map: two lanes, four vehicles).
   - THE BOG (the world's part is in src/ml-world.js, ML_BOG): west of the Pits, one firm run-up 1,080 ft long and at
     its end two measured lanes side by side, 400 ft each, running east: the MUD LANE and the WATER LANE. Each gets
     evenly deeper from nothing at its start to its end. Come down the run-up as fast as you dare and drive in: where
     you stop is your mark. A post every 25 ft down both sides of each lane (a taller one every 100), and a stake
     where each vehicle got to at its best in that lane (remembered; each vehicle its own colour). The run ends when
     you've stood still for two seconds, left the lane, or come out the far end. It says how fast you came in.
   - THE PULL TEST: a post on firm ground beside the run-up's end. Stopped with your tail towards it, PULL TEST hooks a
     line from your rear hook to the post; drive off and the line holds. Lift off and it reads the pull you held
     and your peak, in pounds and as a share of the vehicle's weight (drawbar pull: the number engineers use for
     traction). For the tests the same line can be tied anywhere (mlbPullAt), so every soil can be given its number.
   ===================================================================================== */
const MLB={run:null,cool:false,best:(()=>{try{return JSON.parse(localStorage.getItem('mudpark:bog')||'{}')||{};}catch(e){return {};}})(),mesh:null,last:null};
const MLB_POST=()=>{const A=WG.mlA,B=WG.mlBog;return {x:A.x+B.u0-40,z:A.z+B.lanes[B.lanes.length-1].v+B.hw+12};};
const mlbFt=m=>Math.round(m*3.281);
/* (a vehicle's best in a lane: lane's number, then the vehicle) */
const mlbKey=(q,k)=>q+':'+k;
function mlbTick(t,dt){const B=WG.mlBog;if(!B||t.rt)return;const A=WG.mlA,H=mlrHook(t,1,MLR_B),s=H[0]-(A.x+B.u0),len=B.u1-B.u0;
  /* (which lane it is in, or nearest) */
  let q=0,dv=1e9;for(let k=0;k<B.lanes.length;k++){const d=Math.abs(t.p[2]-(A.z+B.lanes[k].v));if(d<dv){dv=d;q=k;}}
  if(!MLB.run){if(MLB.cool){if(s<-3||dv>B.hw+6)MLB.cool=false;}
    else if(s>0&&s<12&&dv<B.hw&&t.M[0]>.5&&t.speed>.8){MLB.run={q,max:s,still:0,mph:Math.round(t.speed*2.237)};say('THE '+B.lanes[q].name+': '+mlbFt(len)+' FT. IN AT '+MLB.run.mph+' MPH',2);}
    mlbPull(t,dt);return;}
  const R=MLB.run,L=B.lanes[R.q],dw=Math.abs(t.p[2]-(A.z+L.v));if(s>R.max)R.max=s;if(t.speed<.3)R.still+=dt;else R.still=0;
  const through=R.max>=len+1;if(!(through||R.still>2||dw>B.hw+2.5||s<-2))return;
  const ft=mlbFt(Math.min(len,R.max)),k=mlSuvKind(t),key=mlbKey(R.q,k),was=MLB.best[key]||0;MLB.run=null;MLB.cool=true;MLB.last={k,q:R.q,ft,mph:R.mph,psi:ML_AIRS[t.mlAirI||0].psi};
  if(ft>was){MLB.best[key]=ft;try{localStorage.setItem('mudpark:bog',JSON.stringify(MLB.best));}catch(e){}}
  say((through?'THROUGH THE '+L.name+': ALL ':'THE '+L.name+': ')+ft+' FT, IN AT '+R.mph+' MPH'+(ft>was?(was?'. A NEW BEST (WAS '+was+')':'. YOUR FIRST MARK'):' (BEST '+was+')'),4,through?PAL.gold:undefined);}
/* ---------- the pull test ---------- */
function mlbPullCan(t){if(!WG.mlBog||MLR.stuck)return false;const P=MLB_POST(),H=mlrHook(t,-1,MLR_B);return Math.hypot(P.x-H[0],P.z-H[2])<7;}
function mlbPullAt(t,x,z){const H=mlrHook(t,-1,MLR_B),y=RANCH.W.heightAt(x,z)+.5;MLR.pull={x,y,z,len:Math.hypot(x-H[0],y-H[1],z-H[2])+.25,d:0,T:0,peak:0,avg:0,held:0,said:false};return MLR.pull;}
function mlbPullHook(t){const P=MLB_POST();mlbPullAt(t,P.x,P.z);say('LINE ON THE POST. DRIVE OFF AND HOLD IT, THEN LIFT OFF',3);return true;}
function mlbPull(t,dt){const P=MLR.pull;if(!P)return;const thr=t.thrIn||0;
  /* (pulling: the throttle down and the line tight. The reading comes when you lift off; press on again for another) */
  if(thr>.3&&P.T>500){if(P.said){P.said=false;P.peak=0;P.avg=0;P.held=0;}P.peak=Math.max(P.peak,P.T);P.avg+=(P.T-P.avg)*Math.min(1,dt/.8);P.held+=dt;}
  else if(thr<.1&&P.held>1.2&&!P.said){P.said=true;const W=t.m*9.81,lb=v=>Math.round(v/4.448/10)*10;
    MLB.pulled={kN:+(P.avg/1000).toFixed(1),peak:+(P.peak/1000).toFixed(1),share:+(P.avg/W).toFixed(2)};
    say('PULL: '+lb(P.avg).toLocaleString('en-US')+' LB HELD ('+(P.avg/W).toFixed(2)+' OF ITS WEIGHT), PEAK '+lb(P.peak).toLocaleString('en-US'),5);}}
/* ---------- drawn: the posts down each lane, the stakes at each vehicle's best, the pull post ---------- */
/* (each vehicle's stake: the stock SUV amber, the Rock & Mud red, the Group B white, the tractor green) */
const MLB_COL={stock:[.7,.42,.06],crawler:[.75,.12,.08],hatchB:[.86,.86,.84],tractor:[.12,.42,.14]};
function mlbDraw(eye){const B=WG.mlBog;if(!B||GAME.state!=='drive')return 0;const A=WG.mlA,x0=A.x+B.u0,len=B.u1-B.u0;
  if(Math.hypot(x0+len/2-eye[0],A.z+B.v-eye[2])>300)return 0;
  if(!MLB.mesh){MLB.mesh={mark:mlrMesh([.85,.83,.76]),post:mlrMesh([.16,.12,.09])};for(const k of ML_KINDS)MLB.mesh[k]=mlrMesh(MLB_COL[k]);}
  const u=CUR.u;if(u.uMudOff)gl.uniform1f(u.uMudOff,1);let n=0;
  const post=(mesh,x,z,h,r)=>{const y=RANCH.W.heightAt(x,z);if(mlrSeen([x,y,z],3))n+=mlrSeg(mesh,[x,y-.1,z],[x,y+h,z],r);};
  for(let q=0;q<B.lanes.length;q++){const z0=A.z+B.lanes[q].v;
    for(let ft=0;ft<=mlbFt(len);ft+=25){const x=x0+ft/3.281,tall=ft%100===0;for(const sd of [-1,1])post(MLB.mesh.mark,x,z0+sd*(B.hw+2.1),tall?1.5:.8,tall?.06:.04);}
    /* (the stakes: two each side of the lane, a foot apart, so four vehicles' marks don't hide each other) */
    ML_KINDS.forEach((k,i)=>{const ft=MLB.best[mlbKey(q,k)];if(ft)post(MLB.mesh[k],x0+ft/3.281,z0+(i%2?1:-1)*(B.hw+2.6+.5*(i>>1)),1.9,.05);});}
  {const P=MLB_POST();post(MLB.mesh.post,P.x,P.z,1.1,.11);}
  return n;}
window.__mlb={MLB,mlbPullAt,mlbPullHook,MLB_POST,mlbKey};
