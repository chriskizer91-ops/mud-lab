/* =====================================================================================
   THE FILM CAMERA (sas_film): one more camera on the list, a film crew that picks its own shots. Where the Director
   switches between the cameras that are on by the clock, at random, this one looks at what the car is doing and
   cuts to the shot a car film would use for it, from the cameras the game already has and two of its own:
   - standing still: a slow, close walk round the car (Park orbit, its own);
   - pulling away hard: the wheel cam, a roadside camera just ahead, the tracking car;
   - sliding or spinning: shots that keep the whole car in the picture whichever way it points (the helicopter, the
     orbiting drone, the low drone), and no cut while the slide is still young;
   - on the dunes: the helicopter, the low drone, the following drone, the chase camera (you can see where you're
     going), a long lens on a ridge;
   - fast and straight: the helicopter, the tracking car, a roadside fly-past, the long lens far ahead, the drone
     looking back from in front;
   - in the air: the jump cam, as on every camera (Settings, Cameras), and a new shot for the landing.
   The Helicopter (its own): a long lens a long way off (55 to 90 m out to one side, 9 to 25 m up), flying along with
   the car and coming slowly round it from the front quarter to the rear quarter or the other way, the car a third
   of the picture's width, the country sliding by behind it. It climbs if a dune comes between.
   Every shot has a shortest and a longest time; a fly-past ends when the car has gone by; the same shot never
   comes twice running, nor the one before it. Heard as each camera is heard.
   ===================================================================================== */
const FILM={shot:'Chase',t:0,min:4,max:9,prev:'',scene:'cruise',want:'cruise',wantT:0,stopT:0,slideT:0,sp0:0,acc:0,jump:false,n:0,log:[]};
/* what the camera is, for everything that asks by name: the Film camera answers with the shot it is on */
const camMode=()=>{const m=CAMS[APP.cam];return m==='Film'?FILM.shot:m;};
/* each shot: its shortest and longest time (s), the slowest the car may be going for it (m/s) */
const FILM_SHOT={'Heli':[8,14,3],'Tracking car':[6,11,4],'Roadside':[2.5,8,8],'Cinematic':[4,13,14],'Low drone':[8,15,0],'Drone follow':[6,10,2],'Drone orbit':[7,12,0],
  'Drone lead':[5,8,8],'Wheel cam':[3.5,6,0],'Chase':[5,9,0],'Far':[5,8,0],'Park orbit':[8,22,0]};
/* what suits what the car is doing: the shot and how often it's picked */
const FILM_FOR={
  stop:{'Park orbit':6,'Low drone':1},
  launch:{'Wheel cam':3,'Roadside':3,'Tracking car':2,'Chase':1},
  slide:{'Heli':3,'Drone orbit':2,'Low drone':2,'Tracking car':2,'Drone follow':1},
  dunes:{'Heli':3,'Low drone':3,'Drone follow':2,'Chase':2,'Cinematic':2,'Tracking car':1,'Far':1},
  fast:{'Heli':4,'Tracking car':3,'Roadside':3,'Cinematic':3,'Drone lead':2,'Wheel cam':2,'Low drone':2,'Drone follow':1,'Chase':1},
  cruise:{'Heli':3,'Tracking car':3,'Roadside':2,'Low drone':2,'Drone follow':2,'Chase':2,'Drone orbit':1,'Cinematic':1,'Far':1}};
/* what the car is doing, read off the physics (nothing is asked of it that it doesn't already know) */
function filmScene(t,dt){
  const sp=t.speed,F=mcol(t.M,0),hv=Math.hypot(t.v[0],t.v[2]),fl=Math.hypot(F[0],F[2])||1;
  FILM.acc+=((sp-FILM.sp0)/Math.max(dt,1e-3)-FILM.acc)*(1-Math.exp(-dt*3));FILM.sp0=sp;
  FILM.stopT=sp<1?FILM.stopT+dt:0;
  const slip=hv>5?Math.acos(clamp((t.v[0]*F[0]+t.v[2]*F[2])/(hv*fl),-1,1)):0,yawR=Math.abs(t.w?t.w[1]:0);
  FILM.slideT=sp>6&&(slip>.3||yawR>.9)?FILM.slideT+dt:Math.max(0,FILM.slideT-dt*2);
  const s=FILM.stopT>1.5?'stop':FILM.slideT>.35?'slide':sp<12&&FILM.acc>3?'launch':DYB.dunes&&t.p[2]>8?'dunes':sp>26?'fast':'cruise';
  /* (held half a second before it counts, so one bump doesn't change the scene) */
  if(s===FILM.want)FILM.wantT+=dt;else{FILM.want=s;FILM.wantT=0;}
  if(FILM.wantT>.5||s==='stop'||s==='slide')FILM.scene=s;
  return FILM.scene;}
function filmCut(t,scene){
  const sp=t.speed,T=FILM_FOR[scene]||FILM_FOR.cruise;let L=[],sum=0;
  for(const nm in T){const d=FILM_SHOT[nm];if(nm===FILM.shot||nm===FILM.prev||sp<d[2])continue;L.push([nm,T[nm]]);sum+=T[nm];}
  if(!L.length){for(const nm in T)if(nm!==FILM.shot&&sp>=FILM_SHOT[nm][2]){L.push([nm,T[nm]]);sum+=T[nm];}}
  if(!L.length){L=[[FILM.shot==='Chase'?'Low drone':'Chase',1]];sum=1;}
  let r=Math.random()*sum,pick=L[0][0];for(const [nm,w] of L){r-=w;if(r<=0){pick=nm;break;}}
  const d=FILM_SHOT[pick];FILM.prev=FILM.shot;FILM.shot=pick;FILM.t=0;FILM.min=d[0];FILM.max=d[0]+(d[1]-d[0])*(.45+.55*Math.random());FILM.cutScene=scene;FILM.n++;
  if(pick==='Wheel cam')WHEEL.side=-WHEEL.side;
  FILM.log.push(pick);if(FILM.log.length>40)FILM.log.shift();
  CAM.cut=true;CAM.cutFrame=true;}
/* each frame, before the camera is worked out (60_game camUpdate): stay on the shot, or cut */
function filmStep(t,dt){
  if(CAMS[APP.cam]!=='Film'||GAME.state!=='drive'||APP.orbit||CAM.rear||CAM.over)return;
  const scene=filmScene(t,dt);
  /* (the jump cam has the picture: the landing's shot is picked now, and starts when the jump cam lets go) */
  if(JUMP.on){if(!FILM.jump){FILM.jump=true;filmCut(t,DYB.dunes&&t.p[2]>8?'dunes':'cruise');CAM.cut=false;CAM.cutFrame=false;}FILM.t=0;
    /* (the frame the jump cam lets go, by its own test in camAuto: the landing's shot starts as a cut) */
    if(JUMP.land>.8||JUMP.t>5){CAM.cut=true;FILM.eat=true;}return;}
  /* (the jump cam's own cut, a frame later: the shot has already started) */
  if(FILM.eat){FILM.eat=false;CAM.cut=false;}
  FILM.jump=false;
  FILM.t+=dt;const sp=t.speed,sh=FILM.shot,fits=!!(FILM_FOR[scene]||{})[sh];let cut=false;
  if(!FILM_SHOT[sh])cut=true;
  else if(FILM.t>=FILM.max)cut=true;
  /* what the car is doing has changed, and this shot isn't one for it (a young slide is left to play out) */
  else if(FILM.t>=FILM.min&&scene!==FILM.cutScene&&!fits)cut=true;
  else if(scene==='stop'&&sh!=='Park orbit'&&(sh!=='Low drone'||FILM.cutScene!=='stop')&&FILM.t>2.5)cut=true;
  else if(sh==='Park orbit'&&sp>4&&FILM.t>1.5)cut=true;
  else if(scene==='slide'&&!fits&&FILM.t>1.2&&FILM.slideT>.8)cut=true;
  /* a fly-past is over once the car has gone by (before the camera would set itself up again further on) */
  else if(sh==='Roadside'&&RSIDE.ok&&FILM.t>1.2){const r=sub2(t.p,RSIDE.p),al=r[0]*RSIDE.dir[0]+r[2]*RSIDE.dir[2];if(al>Math.max(16,sp*.85)||len(r)>200||sp<3&&FILM.t>4)cut=true;}
  else if(sh==='Cinematic'&&CINE.ok&&FILM.t>2){const r=sub2(t.p,CINE.p),al=dot2(r,CINE.dir);if(al>clamp(sp*3.2,36,420)||len(r)>2000||sp<2&&len(r)>60)cut=true;}
  /* too slow for a shot that needs the car moving */
  else if(sp<FILM_SHOT[sh][2]*.5&&FILM.t>2)cut=true;
  /* (pulling away from a standstill: the shots for a launch, whatever the last half second said) */
  if(cut)filmCut(t,scene==='stop'&&sp>4?'launch':scene);
}
/* ---------- the Helicopter ---------- */
const FHEL={yaw:null,yawV:0,off:null,pv:[0,0,0],t:0,T:12,side:1,th0:.8,th1:2,r:70,h:16,raise:0,look:null,fov:.14,near:.3,cut:false};
function heliStep(t,dt,cut){
  const sp=t.speed,M=t.M,W=RANCH.W;let dir=norm2([M[0],0,M[6]]);if(sp>3&&t.v[0]*t.v[0]+t.v[2]*t.v[2]>1)dir=norm2([t.v[0],0,t.v[2]]);
  const ty=Math.atan2(-dir[2],dir[0]);
  if(FHEL.yaw===null||cut){FHEL.yaw=ty;FHEL.yawV=0;FHEL.off=null;FHEL.side=Math.random()<.75?-FHEL.side:FHEL.side;FHEL.t=0;FHEL.raise=0;FHEL.cut=true;
    /* the sweep: from the front quarter (30 to 60 degrees off the nose) round to the rear quarter (100 to 130), or back */
    const a=.52+Math.random()*.52,b=1.75+Math.random()*.52;[FHEL.th0,FHEL.th1]=Math.random()<.7?[a,b]:[b,a];
    FHEL.r=55+Math.random()*35;FHEL.h=9+Math.random()*16;FHEL.T=FILM.max||12;}
  let d=ty-FHEL.yaw;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;[FHEL.yaw,FHEL.yawV]=springTo(FHEL.yaw,FHEL.yawV,FHEL.yaw+d,1.1,dt);
  FHEL.t+=dt;const k=clamp(FHEL.t/FHEL.T,0,1),e=k*k*(3-2*k),th=FHEL.th0+(FHEL.th1-FHEL.th0)*e,a=FHEL.yaw+FHEL.side*th;
  /* (a dune between the helicopter and the car: it climbs until it sees the car again, and comes down slowly) */
  const car=[t.p[0],t.p[1]+.9,t.p[2]],ex=t.p[0]+Math.cos(a)*FHEL.r,ez=t.p[2]-Math.sin(a)*FHEL.r,gy=W.heightAt(ex,ez);
  let need=0;for(let q=0;q<8&&cineBlocked([ex,Math.max(gy+6,t.p[1]+FHEL.h+need),ez],car);q++)need+=6;
  FHEL.raise=FHEL.cut?need:need>FHEL.raise?FHEL.raise+(need-FHEL.raise)*(1-Math.exp(-dt*2.5)):FHEL.raise+(need-FHEL.raise)*(1-Math.exp(-dt*.3));
  const off=[Math.cos(a)*FHEL.r,Math.max(gy+6,t.p[1]+FHEL.h+FHEL.raise)-t.p[1],-Math.sin(a)*FHEL.r];
  if(!FHEL.off){FHEL.off=off.slice();FHEL.pv=[0,0,0];}
  for(let q=0;q<3;q++){const s=springTo(FHEL.off[q],FHEL.pv[q],off[q],1.6,dt);FHEL.off[q]=s[0];FHEL.pv[q]=s[1];}
  const T=FHEL.t,eye=[t.p[0]+FHEL.off[0]+.3*Math.sin(T*.5),t.p[1]+FHEL.off[1]+.2*Math.sin(T*.7+1),t.p[2]+FHEL.off[2]+.3*Math.sin(T*.43+2)];
  const lead=clamp(sp*.1,0,3),tg=[t.p[0]+dir[0]*lead,t.p[1]+.5,t.p[2]+dir[2]*lead],kk=FHEL.cut||!FHEL.look?1:1-Math.exp(-dt*9),L=FHEL.look||tg;
  FHEL.look=[L[0]+(tg[0]-L[0])*kk,L[1]+(tg[1]-L[1])*kk,L[2]+(tg[2]-L[2])*kk];
  const dl=len(sub2(FHEL.look,eye)),want=clamp(2*Math.atan(4.6/Math.max(dl,1)),.06,.7);
  FHEL.fov=FHEL.cut?want:FHEL.fov+(want-FHEL.fov)*(1-Math.exp(-dt*1.5));FHEL.cut=false;FHEL.near=clamp(dl*.12,.25,60);
  const fwd=norm2(sub2(FHEL.look,eye)),rt=V3.norm(V3.cross(fwd,[0,1,0])),bank=clamp(-FHEL.yawV*.05,-.06,.06);
  return {eye,fwd,up:V3.norm([rt[0]*bank,1,rt[2]*bank]),fov:FHEL.fov};}
/* ---------- Park orbit: the car standing still, the camera walking slowly round it at about waist height ---------- */
const FPRK={a:0,h:1,dirn:1};
function filmParkStep(t,dt,cut){
  const D=carD(t),M=t.M,W=RANCH.W;
  if(cut){FPRK.a=Math.atan2(-M[6],M[0])+(Math.random()<.5?.7:-.7);FPRK.h=.55+Math.random()*1.1;FPRK.dirn=Math.random()<.5?1:-1;}
  FPRK.a+=dt*.14*FPRK.dirn;const r=D.L*1.15+3.4+liftOf(t)*2;
  const eye=[t.p[0]+Math.cos(FPRK.a)*r,t.p[1]+FPRK.h-.2,t.p[2]-Math.sin(FPRK.a)*r],gy=W.heightAt(eye[0],eye[2])+.35;if(eye[1]<gy)eye[1]=gy;
  return {eye,fwd:norm2(sub2([t.p[0],t.p[1]+.1,t.p[2]],eye)),up:[0,1,0],fov:.62};}
/* ---------- the pitch a camera standing by hears as the car goes by (in place of the fixed sum in cineSound) ----------
   The sound engine's own listener already bends the pitch as the car's distance changes (the sound takes time to
   arrive: 6/10 of the real thing, because the cameras tell it 6/10 of the distance), on everything: the engine, the
   exhaust, the tyres. On top of that the cameras were turning the engine's pitch by the whole of the real thing
   again, so close by the engine swung by about 1.6 times what a microphone would hear. Softer (Settings, Dev, on by
   default): the engine swings 0.8 of the real thing at every distance: what the listener gives plus the rest here.
   vr: how fast the car closes on the camera (m/s); d: how far it is */
function flyPitch(vr,d){
  const full=clamp(343/(343-vr),.65,1.45);if(!LOOK.softFly)return full;
  const near=d*.6>2&&d*.6<60;return Math.pow(full,near?.2:.8);}
