/* =====================================================================================
   MUD LAB: THE HERON (Mud Lab 5). Ground Truth's bush plane, flown for real: the Redtail's flying in the game's own
   physics (base/heron/rt-game.js and rt-fly.js, frozen copies of salt-mini-plus redtail/game, Nov 7 2026), the
   redtail-2 model in his Heron paint. Nothing flies itself:
   - it waits at the west end of the Heron Strip (400 m of mown grass in the south fields), facing east along it;
     drive up to it, stop, and HERON (Enter on a keyboard) puts you in it, the truck left standing where you stopped;
   - take off, fly, land wherever you dare: the strip, the fields, the Clay Pan. Crash, and RESET puts it back on its
     wheels where it came down;
   - stopped on the ground, TRUCK (Enter) puts you in your SUV beside it, the Heron left standing there.
   THE MAP: every place named, the Heron where it waits; tap a place's name, JUMP, and the truck is there (from the
   air, the Heron goes back to its strip; from the ground, it stays where you left it).
   ===================================================================================== */
/* ---------- its paint: his Heron (olive over cream, yellow wingtips and tail band, "Heron" on the cowl); no paint
   button (one plane, one paint) ---------- */
/* (Mud Lab 6: the paint is the model's own picture now (src/build.py swaps it in), so the plane is never repainted) */
RT.paint=0;try{localStorage.removeItem('rtPaint');}catch(_){}
{const st=document.createElement('style');st.textContent='#rtPaintB{display:none!important}';document.head.appendChild(st);}

/* ---------- the chase camera (Ground Truth's): behind it along where it's going, climbing, diving and turning with it ---------- */
const MLC={e:null,l:null,on:false};
function mlPlaneChase(t,dt){
  const M=t.M,F=[M[0],M[3],M[6]],v=t.v,sp=Math.hypot(v[0],v[1],v[2]),W=RANCH.W;
  /* (on the ground: its heading; in the air: halfway between where the nose points and where it's going) */
  let d=norm2([F[0],0,F[2]]);
  if(t.air||sp>14){const vd=[v[0]/Math.max(sp,1e-3),v[1]/Math.max(sp,1e-3),v[2]/Math.max(sp,1e-3)],k=clamp((sp-8)/20,0,1);
    d=norm2([F[0]*(1-.5*k)+vd[0]*.5*k,F[1]*(1-.5*k)+vd[1]*.5*k,F[2]*(1-.5*k)+vd[2]*.5*k]);}
  const back=12.5+clamp(sp*.05,0,3),eyeW=[t.p[0]-d[0]*back,t.p[1]-d[1]*back+3.0,t.p[2]-d[2]*back],lookW=[t.p[0]+d[0]*7,t.p[1]+d[1]*7+.9,t.p[2]+d[2]*7];
  /* (a cut when the camera's told to, or when the plane has jumped: a reset, a new spot) */
  const cut=CAM.cut||!MLC.on||!MLC.e||Math.hypot(MLC.e[0]-eyeW[0],MLC.e[1]-eyeW[1],MLC.e[2]-eyeW[2])>40;MLC.on=true;
  if(cut){MLC.e=eyeW;MLC.l=lookW;}else{const ke=1-Math.exp(-dt*4.5),kl=1-Math.exp(-dt*8),ky=1-Math.exp(-dt*9);
    MLC.e=[MLC.e[0]+(eyeW[0]-MLC.e[0])*ke,MLC.e[1]+(eyeW[1]-MLC.e[1])*ky,MLC.e[2]+(eyeW[2]-MLC.e[2])*ke];
    MLC.l=[MLC.l[0]+(lookW[0]-MLC.l[0])*kl,MLC.l[1]+(lookW[1]-MLC.l[1])*kl,MLC.l[2]+(lookW[2]-MLC.l[2])*kl];}
  const g=W.heightAt(MLC.e[0],MLC.e[2])+1.4;if(MLC.e[1]<g)MLC.e[1]=g;
  return {eye:MLC.e.slice(),fwd:norm2(sub2(MLC.l,MLC.e)),up:[0,1,0],fov:1.0};}
const MLC_CA=camAuto;
camAuto=function(t,dt){
  if(t&&t.rt&&CAMS[APP.cam]==='Chase'&&GAME.state==='drive'&&!APP.orbit&&!CAM.rear&&!JUMP.on&&!CAM.over){const r=MLC_CA(t,dt);if(r)return r;return mlPlaneChase(t,dt);}
  MLC.on=false;return MLC_CA(t,dt);};

/* up in it, the haze thins (half as thick 250 m up), so the whole map shows from the air; on the ground as it was */
let mlFogA=0;
let mlFogT=0;
function mlFogK(){const t=GAME.car;let a=0;if(t&&t.rt&&GAME.state==='drive')a=Math.max(0,t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2]));
  /* (eased over about a second and a half, however often it's asked) */
  const now=performance.now(),dt=Math.min(.25,Math.max(0,(now-(mlFogT||now))/1000));mlFogT=now;mlFogA+=(a-mlFogA)*(1-Math.exp(-dt*1.5));
  return 1-.5*Math.min(1,Math.max(0,(mlFogA-20)/230));}

/* ---------- THE TRUCK AND THE HERON: you're in one, the other waits ---------- */
const MLV={parked:null,btn:null,can:'',plane:null,truck:null,sel:null,hits:[],jb:null,canSaid:''};
const mlvYaw=t=>Math.atan2(-t.M[6],t.M[0]);
/* (the Heron's home: the strip's west end, facing east along it) */
function mlvHome(){const A=WG.mlA,S=WG.mlStrip;return {x:A.x+S.u0+22,z:A.z+S.v,yaw:0};}
/* a vehicle made only to stand somewhere: the truck, or the Heron (the game's own maker, with the plane asked for) */
function mlvStandIn(plane,pose){if((MLV.fail||0)>=3)return null;const w=RT.want;RT.want=plane;let o=null;
  try{o=makeCar(APP.bi,RANCH.world,simOpts(),plusK(BUILDS[APP.bi].car),plusG(BUILDS[APP.bi].car));}catch(e){MLV.fail=(MLV.fail||0)+1;console.warn('stand-in',e);}finally{RT.want=w;}
  if(o)mlvStand(o,pose);return o;}
function mlvStand(o,pose){const y=RANCH.W.heightAt(pose.x,pose.z);o.place([pose.x,y+.05,pose.z],pose.yaw);for(const w of o.wheels){w.comp=.35*(w.travel||.12);w.ang=0;w.w=0;}}
/* somewhere a truck can stand: no water over it, out of the trees, inside the bank */
const MLVZ={};
function mlvDry(x,z){const A=WG.mlA,u=x-A.x,v=z-A.z;if(Math.max(Math.abs(u),Math.abs(v))>A.h-30)return false;WG.mlZone(u,v,MLVZ);return !(MLVZ.wl>MLVZ.h-.02)&&MLVZ.wood<.25;}
/* the nearest such spot to x, z (rings 4 m apart, out to 200 m), not within keep m of (kx, kz) */
function mlvSpot(x,z,kx,kz,keep){for(let r=0;r<200;r+=4){const n=r?Math.max(8,Math.round(r*TAU/5)):1;
    for(let k=0;k<n;k++){const a=k/n*TAU,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(keep&&Math.hypot(px-kx,pz-kz)<keep)continue;if(mlvDry(px,pz))return {x:px,z:pz};}}
  return {x,z};}
/* beside the Heron: off its left wing, 14 m out, facing the way it faces */
function mlvBeside(x,z,yaw){const f=[Math.cos(yaw),-Math.sin(yaw)],r=[Math.sin(yaw),Math.cos(yaw)];const s=mlvSpot(x-r[0]*14-f[0]*2,z-r[1]*14-f[1]*2,x,z,10);s.yaw=yaw;return s;}
const mlvParked=()=>GAME.state==='drive'&&MLV.parked?MLV.parked:null;
function mlvTick(){
  const t=GAME.car;if(!t||GAME.state!=='drive'||!WG.mlStrip)return;mlSuvTick();if(APP.bigMap)mlSuvBtn();
  if(t.rt){if(MLV.parked&&MLV.parked.rt)MLV.parked=null;if(!MLV.parked&&MLV.truck)MLV.parked=mlvStandIn(false,MLV.truck);}
  else if(!MLV.parked||!MLV.parked.rt)MLV.parked=mlvStandIn(true,MLV.plane||mlvHome());
  /* can you swap now? */
  const sp=Math.hypot(t.v[0],t.v[1],t.v[2]);let can='';
  if(t.rt){const h=t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2]);if(sp<3&&h<3&&!t.air)can='TRUCK';}
  else{const P=MLV.parked;if(P&&P.rt&&sp<3&&Math.hypot(P.p[0]-t.p[0],P.p[2]-t.p[2])<45)can='HERON';}
  MLV.can=can;if(MLV.btn){MLV.btn.hidden=!can;if(can&&MLV.btn.textContent!==can)MLV.btn.textContent=can;}
  if(can&&can!==MLV.canSaid&&!GAME.touch&&APP.t>(MLV.quiet||0))say('ENTER: '+(can==='HERON'?'INTO THE HERON':'INTO THE TRUCK'),1.8);MLV.canSaid=can;
  if(!APP.bigMap&&(MLV.sel||MLV.jb&&!MLV.jb.hidden)){MLV.sel=null;if(MLV.jb)MLV.jb.hidden=true;}
  /* (the map's own buttons only while it's open; the plane's height line not over the map) */
  if(!APP.bigMap&&MLS.gripBtn&&!MLS.gripBtn.hidden)MLS.gripBtn.hidden=true;
  {const h=document.getElementById('rtHud');if(h){const vis=APP.bigMap?'hidden':'';if(h.style.visibility!==vis)h.style.visibility=vis;}}}
function mlvSwap(){
  const t=GAME.car;if(!t||GAME.state!=='drive')return false;mlvTick();
  MLV.quiet=APP.t+4;
  if(MLV.can==='TRUCK'){const yaw=mlvYaw(t),P=mlvBeside(t.p[0],t.p[2],yaw),keep=t;MLV.plane={x:t.p[0],z:t.p[2],yaw};
    rtFly(false);placeCar(P.x,P.z,P.yaw);MLV.parked=keep;MLV.truck=null;say('THE TRUCK',1.6);return true;}
  if(MLV.can==='HERON'){const P=MLV.parked,keep=t,pose={x:P.p[0],z:P.p[2],yaw:mlvYaw(P)};MLV.truck={x:t.p[0],z:t.p[2],yaw:mlvYaw(t)};
    rtFly(true);placeCar(pose.x,pose.z,pose.yaw);MLV.parked=keep;MLV.plane=null;return true;}
  say(t.rt?'LAND AND STOP FIRST':'DRIVE UP TO THE HERON AND STOP',2);return false;}
/* the one you're not in, drawn where it waits (and into the shadows) */
/* (Mud Lab 6: worked out in the game's step, not mid-draw; drawn out to 450 m (the Heron is 60,000 triangles and has no
   simpler copy), its shadow within 150 m of you) */
function mlvDraw(eye){const P=mlvParked();if(!P)return 0;const d=Math.hypot(P.p[0]-eye[0],P.p[2]-eye[2]);if(d>450)return 0;
  return drawWorldCar(P,null,0,d>260,false)||0;}
function mlvShadow(){const P=mlvParked(),t=GAME.car;return !!(P&&t&&Math.hypot(P.p[0]-t.p[0],P.p[2]-t.p[2])<150);}
/* the button: on the phone's right-hand column, at the top, only when the swap can happen; Enter on a keyboard */
function mlvUI(){if(MLV.btn)return;const col=document.querySelector('#touch .tside.R');if(!col)return;
  const b=document.createElement('button');b.className='tb';b.id='mlSwap';b.type='button';b.hidden=true;b.textContent='HERON';
  b.addEventListener('click',e=>{e.preventDefault();b.blur();mlvSwap();});col.insertBefore(b,col.firstChild);MLV.btn=b;}
/* (Enter on a keyboard (Mud Lab 6: E is the engine's gear-up key)) */
addEventListener('keydown',e=>{if((e.code==='Enter'||e.code==='NumpadEnter')&&!e.repeat&&GAME.state==='drive'&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||''))mlvSwap();});

/* ---------- THE MAP: the strip and the Heron on it; tap a name to pick it, JUMP to go there in the truck ---------- */
function mlvPlaces(){const A=WG.mlA,o=WG.mlPlaces.map(([name,u,v,kind])=>({name,u,v,kind}));
  const t=GAME.car,P=t&&!t.rt?mlvParked():null;if(P&&P.rt)o.push({name:'THE HERON',u:P.p[0]-A.x,v:P.p[2]-A.z,kind:'heron'});return o;}
function mlvMap(toM){
  const S=WG.mlStrip,[a0,b0]=toM(S.u0,S.v),[a1]=toM(S.u1,S.v);hLine(a0,b0,a1,b0,pack(236,232,214,200));
  MLV.hits=[];for(const p of mlvPlaces()){const [a,b]=toM(p.u,p.v);MLV.hits.push({p,a,b,w:p.name.length*4+6});
    if(p.kind==='heron'){hDisc(a,b,1.6,PAL.gold);otxt3('THE HERON',a+3,b+2,PAL.gold);}}
  if(MLV.sel){const [a,b]=toM(MLV.sel.u,MLV.sel.v);hRing(a,b,3.2,(APP.t*4|0)%2?PAL.white:PAL.gold);}}
/* (a tap on the map: on a name or its dot, that place; anywhere else closes it, as before) */
addEventListener('pointerdown',e=>{
  /* (any tap on the open map counts, the steering strip over its corner included (Mud Lab 6: Big Creek and the Clay Pan sat
     under it); the map's own buttons are left to themselves) */
  if(!APP.bigMap||GAME.state!=='drive'||!MLV.hits.length||e.target&&e.target.closest&&e.target.closest('button'))return;
  const hx=(e.clientX-RECT.x)/RECT.w*W,hy=(e.clientY-RECT.y)/RECT.h*H;let best=null,bd=1e9;
  for(const h of MLV.hits){const inBox=hx>=h.a-3&&hx<=h.a+h.w&&hy>=h.b-9&&hy<=h.b+(h.p.kind==='heron'?9:3),d=Math.hypot(hx-h.a,hy-h.b);
    const s=inBox?d*.2:d;if((inBox||d<7)&&s<bd){bd=s;best=h.p;}}
  if(!best)return;e.stopPropagation();e.preventDefault();MLV.sel=best;mlvJumpBtn();},true);
function mlvJumpBtn(){let b=MLV.jb;if(!b){b=MLV.jb=document.createElement('button');b.type='button';b.id='mlJump';
    b.style.cssText='position:fixed;left:calc(env(safe-area-inset-left) + 12px);top:calc(50% - 30px);max-width:calc(50vw - 49vh - 24px);min-width:120px;white-space:normal;z-index:61;font:700 14px system-ui,sans-serif;letter-spacing:.06em;padding:10px 18px;border-radius:999px;border:0;background:#c98f4a;color:#1d140a;box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer';
    b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();if(MLV.sel)mlvJump(MLV.sel);});document.body.appendChild(b);}
  b.textContent='JUMP: '+MLV.sel.name;b.hidden=false;}
/* the truck to a place: the nearest dry, open spot to it, facing it; beside the Heron for the Heron */
function mlvJump(p){
  const A=WG.mlA,t=GAME.car;let x=A.x+p.u,z=A.z+p.v,spot;
  if(p.kind==='heron'){const P=mlvParked();spot=mlvBeside(P.p[0],P.p[2],mlvYaw(P));}
  else{spot=mlvSpot(x,z);const dx=x-spot.x,dz=z-spot.z;spot.yaw=Math.hypot(dx,dz)>2?Math.atan2(-dz,dx):(t?mlvYaw(t):0);
    if(p.kind==='strip'){spot=mlvSpot(A.x+WG.mlStrip.u0+22,A.z+WG.mlStrip.v-34);spot.yaw=-Math.PI/2;}}
  if(t&&t.rt){const h=t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2]),sp=Math.hypot(t.v[0],t.v[1],t.v[2]);
    /* (landed: the Heron stays where it is; in the air: back to its strip) */
    if(h<3&&sp<3&&!t.air){MLV.plane={x:t.p[0],z:t.p[2],yaw:mlvYaw(t)};MLV.parked=t;}else{MLV.plane=null;MLV.parked=null;}
    rtFly(false);}
  MLV.quiet=APP.t+4;placeCar(spot.x,spot.z,spot.yaw);MLV.truck=null;MLV.sel=null;APP.bigMap=false;if(MLV.jb)MLV.jb.hidden=true;
  say(p.name,1.8);return true;}
/* (for the tests: a tap on the map at a place's name, as a finger would) */
function mlvTapName(name){const h=MLV.hits.find(x=>x.p.name===name);if(!h)return false;const x=RECT.x+(h.a+8)/W*RECT.w,y=RECT.y+(h.b-3)/H*RECT.h;
  cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,bubbles:true,pointerId:1}));return {x,y,sel:MLV.sel&&MLV.sel.name,btn:MLV.jb&&!MLV.jb.hidden?MLV.jb.textContent:null,map:APP.bigMap};}
window.__mlv={MLV,mlvSwap,mlvJump,mlvTick,mlvSpot,mlvPlaces,mlvHome,mlvTapName,RTF,RT};
