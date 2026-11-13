/* From Ground Truth 28 (last-road src/lr-game.js): the Heron on water. Reference only: it reads Ground
   Truth's own world (WG.gt*). The one swap that calls it, in src/lr_patch.py, after the air's forces in the plane's step:
     lrHWater(t,dt);
   Ground Truth's bars: firm sand a hand above the water, 380 m long and 32 m wide; round each the shallows go from
   ankle deep to half a metre over 10 m, then to 1.3 m. Tested there: half a metre of water at 60 mph noses the Heron
   over in 30 to 40 m; over on its back or nose, or in more than 0.9 m, it is ditched (engine stops, RECOVER). */
/* ---------- THE HERON ON WATER (his ask: it "can land in shallow water as well: a river sandbar right at the surface,
   or a flat beach"; src/gt-world.js GT_WATERS: Crane Bar and River Mouth Bar in the Delta, South Beach on the Lake).
   Water now pulls at the Heron's wheels: each wheel in the water is dragged back as water drags (half its density,
   times the wheel's width times how deep it's in, times the speed squared), at the wheel's bottom, so a film of
   water on a bar slows you with a spray, and a wheel that runs into water a foot deep at landing speed digs in and
   puts the Heron on its nose, as it would. Down in water too deep (the cabin in it): ditched; the engine drowns, and
   a button gets it recovered to the nearest strip ($400 in the campaign; Dell's crew). The truck isn't waiting at
   the bars or the beach: you can't drive there ---------- */
const LRHW={o:{},q:{},ditch:false,t:0,ui:null,told:0};
function lrHWater(t,dt){
  if(typeof WG==='undefined'||!WG.GTW||LRW.on)return;const p=t.p,o=LRHW.o;
  /* (high up, no water to touch) */
  if(p[1]-RANCH.W.heightAt(p[0],p[2])>6){LRHW.ditch=false;return;}
  const M=t.M,U=[M[1],M[4],M[7]],v=t.v,w=t.w,m=t.m;let wet=0;
  for(const wh of t.wheels){const hp=wh.hpW,L=(wh.len||.3)+wh.R,bx=hp[0]-U[0]*L,by=hp[1]-U[1]*L,bz=hp[2]-U[2]*L;
    WG.sample(bx,bz,o);if(o.code!==WG.SF.water)continue;const d=Math.min(2*wh.R,o.wl-by);if(d<=0)continue;wet++;
    const rx=bx-p[0],ry=by-p[1],rz=bz-p[2],vx=v[0]+w[1]*rz-w[2]*ry,vy=v[1]+w[2]*rx-w[0]*rz,vz=v[2]+w[0]*ry-w[1]*rx,sp=Math.hypot(vx,vz);if(sp<.2)continue;
    /* (the drag, never more in a step than half the point's speed) */
    const A=Math.max(.12,(wh.front?t.c.tyreW:t.c.tyreWR)||.18)*d,F=Math.min(.5*1000*1.1*A*sp*sp,.5*sp*m/dt/Math.max(1,t.wheels.length)),fx=-vx/sp*F,fz=-vz/sp*F;
    v[0]+=fx/m*dt;v[2]+=fz/m*dt;const tq=[ry*fz,rz*fx-rx*fz,-ry*fx],dw=t.invI(F3(),M,tq);w[0]+=dw[0]*dt;w[1]+=dw[1]*dt;w[2]+=dw[2]*dt;}
  /* down in it: the cabin in the water */
  /* (or over on its back or its nose in the shallows, stopped: no flipping it back by hand in the water) */
  WG.sample(p[0],p[2],o);const sunk=o.code===WG.SF.water&&(o.wl-o.h>.9&&p[1]<o.wl+.35||U[1]<.35&&Math.hypot(v[0],v[2])<3);
  if(sunk){const k=Math.exp(-dt*2.5);v[0]*=k;v[2]*=k;w[0]*=k;w[1]*=k;w[2]*=k;if(!LRHW.ditch){LRHW.ditch=true;LRHW.t=performance.now();LRHW.deep=o.wl-o.h>.9;}}
  else LRHW.ditch=false;}
/* once a frame: the word, and the recovery button */
function lrHTick(t){if(!t||!t.rt||LRW.on){lrHRecUI(false);return;}
  if(LRHW.ditch){GAME.flipSaid=true;if(t.pt.st==='run')t.pt.st='stopping';if(LRHW.told!==LRHW.t){LRHW.told=LRHW.t;/* (the newest line shows on top) */say('LAND ON THE SAND ITSELF: IT\'S FIRM',4,PAL.amber);say(LRHW.deep?'THE HERON\'S IN THE WATER: TOO DEEP TO LAND':'NOSED OVER IN THE SHALLOWS',4,PAL.amber);}
    lrHRecUI(performance.now()-LRHW.t>1500);}else lrHRecUI(false);}
function lrHRecUI(on){let b=LRHW.ui;if(!on){if(b)b.hidden=true;return;}
  if(!b){b=document.createElement('button');b.type='button';b.id='lrHRec';b.style.cssText='position:fixed;left:50%;top:60%;transform:translateX(-50%);z-index:30;border:0;border-radius:999px;padding:12px 22px;font:700 14px var(--f,system-ui);letter-spacing:.1em;text-transform:uppercase;background:#e2b85c;color:#1d160c;box-shadow:0 6px 24px rgba(0,0,0,.4);cursor:pointer';
    b.addEventListener('click',lrHRecover);document.body.appendChild(b);LRHW.ui=b;}
  b.textContent=LRM.mode==='campaign'?'Recover the Heron · $400':'Recover the Heron';b.hidden=false;}
function lrHRecover(){const t=GAME.car;if(!t||!t.rt)return;const i=lrNearStrip(t.p[0],t.p[2],1e9),S=WG.GTS[i<0?0:i],u=-(S.len/2-40);
  if(LRM.mode==='campaign'){if(lrMoney()>=400){lrMoney(-400);say('DELL\'S CREW FLOATED HER OUT · $400',3,PAL.amber);}else say('DELL: PAY ME WHEN YOU CAN',3,PAL.amber);}
  else say('RECOVERED',2,PAL.green);
  placeCar(S.x+S.dx*u,S.z+S.dz*u,Math.atan2(-S.dz,S.dx));t.v[0]=t.v[1]=t.v[2]=0;t.w[0]=t.w[1]=t.w[2]=0;LRHW.ditch=false;lrHRecUI(false);say(S.name.toUpperCase()+(S.name.endsWith('Strip')?'':' STRIP'),2.4,PAL.green);}
/* which water landing (x,z) is on: its sand, with m metres to spare (-1: none) */
function lrWaterAt(x,z,m){const G=WG.GTW||[];for(let i=0;i<G.length;i++){const S=G[i],u=(x-S.x)*S.dx+(z-S.z)*S.dz,v=-(x-S.x)*S.dz+(z-S.z)*S.dx;
  if(Math.abs(u)<S.len/2+m&&(S.kind==='beach'?v>-S.hw-m&&v<6+m:Math.abs(v)<S.hw+m))return i;}return -1;}
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&LRHW.ui&&!LRHW.ui.hidden)lrHRecover();});
window.__lr=Object.assign(window.__lr||{},{LRHW,lrHWater,lrHRecover,lrWaterAt});
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&LRWD.ui&&!LRWD.ui.hidden)lrTow();});

