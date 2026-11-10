/* =====================================================================================
   MUD LAB 10: THE BOG AND THE PULL TEST.
   - THE BOG (the world's part is in src/ml-world.js, ML_BOG): a measured mud lane north-east of the Trailhead, 262 ft
     long: eight clay pits end to end, each deeper than the last. Drive in from the west; where you stop is your
     mark. A post every 25 ft down both sides (a taller one every 100), and a stake where each SUV got to at its best
     (remembered). The run ends when you've stood still for two seconds, left the lane, or come out the far end.
   - THE PULL TEST: a post on firm ground by the Bog's start. Stopped with your tail towards it, PULL TEST hooks a
     line from your rear hook to the post; drive off and the line holds. Lift off and it reads the pull you held
     and your peak, in pounds and as a share of the SUV's weight (drawbar pull: the number engineers use for traction).
     For the tests the same line can be tied anywhere (mlbPullAt), so every soil can be given its number.
   ===================================================================================== */
const MLB={run:null,cool:false,best:(()=>{try{return JSON.parse(localStorage.getItem('mudlab:bog')||'{}')||{};}catch(e){return {};}})(),mesh:null,last:null};
const MLB_POST=()=>{const A=WG.mlA,B=WG.mlBog;return {x:A.x+B.u0-16,z:A.z+B.v+B.hw+9};};
const mlbFt=m=>Math.round(m*3.281);
function mlbTick(t,dt){const B=WG.mlBog;if(!B||t.rt)return;const A=WG.mlA,H=mlrHook(t,1,MLR_B),s=H[0]-(A.x+B.u0),dv=Math.abs(t.p[2]-(A.z+B.v)),len=B.u1-B.u0;
  if(!MLB.run){if(MLB.cool){if(s<-3||dv>B.hw+6)MLB.cool=false;}
    else if(s>0&&s<8&&dv<B.hw&&t.M[0]>.5&&t.speed>.8){MLB.run={max:s,still:0};say('THE BOG: 262 FT. HOW FAR?',2);}
    mlbPull(t,dt);return;}
  const R=MLB.run;if(s>R.max)R.max=s;if(t.speed<.3)R.still+=dt;else R.still=0;
  const through=R.max>=len+1;if(!(through||R.still>2||dv>B.hw+2.5||s<-2))return;
  const ft=mlbFt(Math.min(len,R.max)),k=mlSuvKind(t),was=MLB.best[k]||0;MLB.run=null;MLB.cool=true;MLB.last={k,ft,psi:ML_AIRS[t.mlAirI||0].psi};
  if(ft>was){MLB.best[k]=ft;try{localStorage.setItem('mudlab:bog',JSON.stringify(MLB.best));}catch(e){}}
  say((through?'THROUGH THE BOG: ALL ':'THE BOG: ')+ft+' FT'+(ft>was?(was?'. A NEW BEST (WAS '+was+')':'. YOUR FIRST MARK'):' (BEST '+was+')'),4,through?PAL.gold:undefined);}
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
/* ---------- drawn: the posts down the lane, the stakes at each SUV's best, the pull post ---------- */
function mlbDraw(eye){const B=WG.mlBog;if(!B||GAME.state!=='drive')return 0;const A=WG.mlA,x0=A.x+B.u0,z0=A.z+B.v,len=B.u1-B.u0;
  if(Math.hypot(x0+len/2-eye[0],z0-eye[2])>260)return 0;
  if(!MLB.mesh)MLB.mesh={mark:mlrMesh([.85,.83,.76]),stock:mlrMesh([.7,.42,.06]),crawler:mlrMesh([.75,.12,.08]),post:mlrMesh([.16,.12,.09])};
  const u=CUR.u;if(u.uMudOff)gl.uniform1f(u.uMudOff,1);let n=0;
  const post=(mesh,x,z,h,r)=>{const y=RANCH.W.heightAt(x,z);if(mlrSeen([x,y,z],3))n+=mlrSeg(mesh,[x,y-.1,z],[x,y+h,z],r);};
  for(let ft=0;ft<=250;ft+=25){const x=x0+ft/3.281,tall=ft%100===0;for(const sd of [-1,1])post(MLB.mesh.mark,x,z0+sd*(B.hw+1.3),tall?1.5:.8,tall?.06:.04);}
  for(const k of ['stock','crawler']){const ft=MLB.best[k];if(ft)post(MLB.mesh[k],x0+ft/3.281,z0-(B.hw+.7)*(k==='stock'?1:-1),1.9,.05);}
  {const P=MLB_POST();post(MLB.mesh.post,P.x,P.z,1.1,.11);}
  return n;}
window.__mlb={MLB,mlbPullAt,mlbPullHook,MLB_POST};
