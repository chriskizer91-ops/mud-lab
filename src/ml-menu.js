/* =====================================================================================
   MUD LAB 13: THE MAP'S MENU, THE GUIDE ARROW, THINGS TO DO.
   His words: the map's buttons (the other SUV, bring it, the tyres' pressure, the grip) covered the map, and the Bog,
   the pull test and the tyres weren't easy to find. Now the open map has one button, MENU, beside it (over its corner
   on an upright phone); it drops down a list:
     GET IN the other SUV / BRING IT HERE (Free play) or A TOW HOME (Real, bogged) / TYRE SIZE / TYRE AIR / GRIP /
     THINGS TO DO.
   THINGS TO DO lists what there is here: the Bog, the pull test, the three trails, the Hill Climb (Mud Lab 14), the
   pond's bank, a rescue. Pick
   one: in Free play you're set down there, facing the right way; in Real an arrow by the HUD points the way and counts
   the feet down, and says what to do when you arrive. In Real a tap on any place's name on the map guides you there
   the same way; in Free play the tap offers JUMP as before, and OR GUIDE ME THERE over it.
   A TRAIL picked here is a timed run: the arrow leads you down it bend by bend (it points at the trail 130 ft ahead),
   the clock starts as you pull away and stops at the trail's end; each SUV's best time on each trail is remembered.
   A RESCUE stands the other SUV in a puddle on the Field Track: get there, strap it, pull it clear; it times you.
   ===================================================================================== */
const MLM={btn:null,panel:null,nav:null,gb:null,open:false,page:'main',guide:null,rescue:null,run:null,bank:null,sig:'',
  best:(()=>{try{return JSON.parse(localStorage.getItem('mudlab:runs')||'{}')||{};}catch(e){return {};}})()};
const mlmClock=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const ML_POND_AT={u:232,v:104,a:62,b:34,r:-.5};
/* the top of the pond's bank where it is tallest, and a way down it between the trees: of nine lanes 3 m apart, the
   one with the most room from 6 m back of the rim to the water */
function mlmBank(){if(MLM.bank)return MLM.bank;const P=ML_POND_AT,A=WG.mlA,cs=Math.cos(P.r),sn=Math.sin(P.r),Z={},at=(r,f)=>{const a=r*Math.cos(f),b=r*Math.sin(f);return [P.u+a*P.a*cs-b*P.b*sn,P.v+a*P.a*sn+b*P.b*cs];};
  let best=0,bf=0;for(let k=0;k<72;k++){const f=k/72*TAU,p0=at(1.25,f),p1=at(2.2,f),d=WG.mlZone(p1[0],p1[1],Z).h-WG.mlZone(p0[0],p0[1],Z).h;if(d>best){best=d;bf=f;}}
  const q1=at(2.15,bf),q0=at(1.4,bf),l=Math.hypot(q0[0]-q1[0],q0[1]-q1[1]),dn=[(q0[0]-q1[0])/l,(q0[1]-q1[1])/l],tg=[-dn[1],dn[0]];
  let L=[];try{WG.mlTrees(A.x+q1[0]-56,A.z+q1[1]-56,A.x+q1[0]+56,A.z+q1[1]+56,(tx,tz)=>{L.push(tx,tz);});}catch(e){}
  let room=-1,off=0;for(const s of [0,3,-3,6,-6,9,-9,12,-12]){let c=9;for(let d=-8;d<=l;d+=1.5){const x=A.x+q1[0]+tg[0]*s+dn[0]*d,z=A.z+q1[1]+tg[1]*s+dn[1]*d;for(let k=0;k<L.length;k+=2)c=Math.min(c,Math.hypot(L[k]-x,L[k+1]-z));}
    if(c>room+.4){room=c;off=s;}}
  return MLM.bank={u:q1[0]+tg[0]*off-dn[0]*5,v:q1[1]+tg[1]*off-dn[1]*5,yaw:Math.atan2(-dn[1],dn[0]),exact:true,room,off};}
function mlmDo(){const B=WG.mlBog,P=MLB_POST(),A=WG.mlA,T=WG.mlTrails,C=WG.mlClimb,
  tr=(n,i,name,brief)=>{const p=T[n].pts,a=p[i],b=p[i+3];return {name,brief,u:a[0],v:a[1],yaw:Math.atan2(-(b[1]-a[1]),b[0]-a[0]),run:{n,i}};};
  return [{name:'THE BOG',u:B.u0-14,v:B.v,yaw:0,brief:'THE BOG: DRIVE IN FROM THIS END. WHERE YOU STOP IS YOUR MARK'},
    {name:'THE PULL TEST',u:P.x-A.x+7,v:P.z-A.z,yaw:0,brief:'PULL TEST: STOP WITH YOUR TAIL TO THE POST, THEN TAP PULL TEST'},
    tr(4,48,'EASY TRAIL','EASY: THE FIELD TRACK, EAST TO THE QUARRY. KEEP MOVING THROUGH THE PUDDLES'),
    tr(0,4,'MEDIUM TRAIL','MEDIUM: THE CREEK LOOP, NORTH. THE FORDS STOP THE STOCK SUV'),
    tr(2,4,'HARD TRAIL','HARD: THE GUMBO TRAIL. A STEADY THROTTLE THROUGH THE PITS, AND DON\'T STOP'),
    {name:'HILL CLIMB',u:C.u,v:C.v+4.5,yaw:Math.PI/2,exact:true,quiet:true,brief:'THE HILL CLIMB: STOP AT THE LINE BY THE TWO TALL POSTS, THEN GO'},
    Object.assign({name:'THE POND\'S BANK',brief:'THE BANK: EASE DOWN IT INTO THE POND, THEN WINCH BACK UP TREE BY TREE'},mlmBank()),
    /* (Mud Lab 19) the new ground: a timed lap of the Track; the River at the Shallows; the Lake from its beach */
    tr(T.length-1,0,'THE TRACK','THE TRACK: ONE LAP, 1.8 MILES. THE CLOCK STARTS WHEN YOU DO'),
    {name:'THE RIVER',u:1262,v:455,yaw:0,brief:'THE SHALLOWS: CROSS ANYWHERE. EACH FORD UP OR DOWN THE RIVER IS DEEPER'},
    {name:'THE LAKE',u:846,v:1900,yaw:0,brief:'THE LAKE: FIRM SAND FOR 30 FT, THEN 10 FT OF WATER OVER MUCK'},
    /* (Mud Lab 21) the jumps: each from the start of its run-up, facing its ramp */
    ...WG.mlX.jumps.map(J=>{const s=J.g+J.A.far-14;return {name:J.name,u:J.u-J.dx*s,v:J.v-J.dz*s,yaw:-J.deg*Math.PI/180,exact:true,jump:1,brief:MLJ_BRIEF[J.name]||''};}),
    {name:'A RESCUE',rescue:1}];}
/* (beside each name in the list: this SUV's best there) */
function mlmMark(E){const t=GAME.car,k=t&&!t.rt?mlSuvKind(t):MLSV.pick;
  if(E.run){const b=MLM.best[E.run.n+':'+k];return b?'  '+mlmClock(b):'';}
  if(E.name==='THE BOG'){const b=MLB.best[k];return b?'  '+b+' FT':'';}
  if(E.name==='HILL CLIMB'){const b=MLHC.best[k];return b?'  '+b+' FT':'';}
  if(E.jump){const b=MLJ.best[E.name+':'+k];return b?'  '+b+' FT':'';}return '';}
/* ---------- the guide ---------- */
function mlmGuide(name,x,z,brief,run){MLM.run=null;MLM.guide={name,x,z,brief:brief||'',run:run||null};say('GUIDING YOU TO '+name+': FOLLOW THE ARROW',2.6);}
function mlmGo(E){const A=WG.mlA;
  if(E.rescue){mlmRescue();mlmClose();return;}
  if(MLR.mode==='real'){mlmGuide(E.name,A.x+E.u,A.z+E.v,E.brief,E.run&&Object.assign({name:E.name},E.run));mlmClose();return;}
  mlvJump({name:E.name,u:E.u,v:E.v,yaw:E.yaw,exact:E.exact,kind:'do'});MLM.guide=null;MLM.run=null;mlmClose();if(E.brief&&!E.quiet)say(E.brief,5);
  if(E.run)mlmRun(E.name,E.run.n,E.run.i);}
/* ---------- a trail, timed: the arrow leads down it; the clock runs from pulling away to the trail's end ---------- */
function mlmRun(name,n,i){const P=WG.mlTrails[n].pts,cum=new Float32Array(P.length);for(let k=P.length-2;k>=0;k--)cum[k]=cum[k+1]+Math.hypot(P[k+1][0]-P[k][0],P[k+1][1]-P[k][1]);
  const A=WG.mlA,j=Math.min(P.length-1,i+10);MLM.run={name,n,i,t0:null,cum};MLM.guide={name,x:A.x+P[j][0],z:A.z+P[j][1],brief:'',leg:true,togo:cum[i],clock:0};}
function mlmRunTick(t){const R=MLM.run,G=MLM.guide;if(!G||!G.leg){MLM.run=null;return;}const P=WG.mlTrails[R.n].pts,A=WG.mlA,u=t.p[0]-A.x,v=t.p[2]-A.z,last=P.length-1;
  /* (how far along: the nearest of the next 16 points, 200 ft of trail; so a jump ahead doesn't count) */
  let bi=R.i,bd=1e9;for(let k=R.i;k<=Math.min(last,R.i+16);k++){const d=(P[k][0]-u)*(P[k][0]-u)+(P[k][1]-v)*(P[k][1]-v);if(d<bd){bd=d;bi=k;}}
  if(bd<900)R.i=bi;if(R.t0===null&&t.speed>1)R.t0=GAME.time;
  const j=Math.min(last,R.i+10);G.x=A.x+P[j][0];G.z=A.z+P[j][1];G.togo=R.cum[R.i]+Math.sqrt(bd);G.clock=R.t0===null?0:GAME.time-R.t0;
  if(R.i>=last-3&&bd<400){const s=Math.round(G.clock),key=R.n+':'+mlSuvKind(t),was=MLM.best[key]||0;MLM.run=null;MLM.guide=null;
    if(!was||s<was){MLM.best[key]=s;try{localStorage.setItem('mudlab:runs',JSON.stringify(MLM.best));}catch(e){}}
    say(R.name+' IN '+mlmClock(s)+(!was?'. YOUR FIRST TIME':s<was?'. A NEW BEST (WAS '+mlmClock(was)+')':' (BEST '+mlmClock(was)+')'),6,PAL.gold);}}
function mlmRescue(){const t=GAME.car,o=MLR.other;if(!t||t.rt||!o){say('THERE IS NO OTHER SUV TO RESCUE',2.4);return;}
  const Hs=WG.mlHoles.filter(H=>H.tr===4),H=Hs[Math.floor(Math.random()*Hs.length)],A=WG.mlA;if(!H)return;
  if(MLR.strap||MLR.winch||MLR.pull)mlrUnhook();
  mlvStand(o,{x:A.x+H.u,z:A.z+H.v,yaw:-H.r});o.v.fill(0);o.w.fill(0);o.mlStuck=true;o.mlMove=1;MLM.run=null;
  MLM.rescue={H,o,t0:GAME.time,x:A.x+H.u,z:A.z+H.v};MLM.guide={name:'THE '+mlrName(o),x:A.x+H.u,z:A.z+H.v,brief:'STRAP IT AND PULL IT CLEAR OF THE PUDDLE'};
  say('RESCUE: THE '+mlrName(o)+' IS BOGGED ON THE FIELD TRACK. GO AND PULL IT OUT',5);}
/* ---------- the tyres' size, on the spot (it was only on the title: tap your SUV's name again) ---------- */
function mlmSize(){const t=GAME.car;if(!t||t.rt)return;const k=mlSuvKind(t);
  if(t.speed>1.5){say('STOP FIRST',1.4);return;}
  if(MLR.mode==='real'&&(MLR.stuck||(MLS.wd||0)>.05)){mlmClose();say('TYRE SIZE: ON DRY GROUND ONLY',2.2);return;}
  if(MLR.strap||MLR.winch||MLR.pull)mlrUnhook();
  MLSV.big[k]=!MLSV.big[k];const i=mlSuvIdx(k);try{localStorage.setItem('mudlab:big:'+k,MLSV.big[k]?'1':'0');}catch(e){}
  if(i<0||i===t.bi)return;const d=GAME.dirt;spawnCar(i,t.p[0],t.p[2],mlvYaw(t));GAME.dirt=d;
  {const n=GAME.car.pt;if(n.st==='off'){n.st='run';n.we=n.e.idle*TAU/60;}}MLR.stuck=false;MLR.stuckT=0;MLV.quiet=APP.t+4;
  say('THE '+ML_SUV_NAME[k]+' ON '+ML_TYRE[k][MLSV.big[k]?1:0],2);}
/* (Mud Lab 17) CLEAR ALL RUTS, his ask ("so that things like making new ruts can be done in free play and also ruts
   impede your ability to do consecutive hill climbs and then bogs"): every rut, berm and track gone, the ground as it
   was made. On the list and on the Backspace key (which raked the ground before, and left a SUV that was sunk in a
   rut inside the ground: it was thrown 1.7 m into the air and landed on its side). Now a SUV whose tyres were more
   than 8 cm down is set on the new ground where it stands, as RESET does, and the other SUV is stood on it too.
   In Real, not while you are bogged: that is what the strap, the winch and the tow home are for */
function mlmClear(){const t=GAME.car,o=MLR.other,sunk=v=>!!v&&!v.rt&&v.wheels.some(w=>(w.mlZ||0)>.08);
  if(MLR.mode==='real'&&MLR.stuck){say('BOGGED: THE RUTS STAY. THE STRAP, THE WINCH OR A TOW HOME',3);return false;}
  const up=sunk(t);mlRake();if(up)resetCar();if(o&&!o.rt)mlvStand(o,{x:o.p[0],z:o.p[2],yaw:mlvYaw(o)});
  MLR.stuck=false;MLR.stuckT=0;say('ALL RUTS CLEARED: THE GROUND IS AS IT WAS MADE',2.6);return true;}
/* (Mud Lab 17) a tune for the SUV you are in, on the spot (as the tyre size: stopped; in Real only on dry ground and
   not bogged) */
function mlmTune(id){const t=GAME.car;if(!t||t.rt)return;const k=mlSuvKind(t);
  if(t.speed>1.5){mlmClose();say('STOP FIRST: YOU ARE STILL ROLLING',2.2);return;}
  if(MLR.mode==='real'&&(MLR.stuck||(MLS.wd||0)>.05)){mlmClose();say('A TUNE: ON DRY GROUND ONLY',2.2);return;}
  if(!ML_TUNE[k].some(q=>q.id===id))return;if(MLR.strap||MLR.winch||MLR.pull)mlrUnhook();
  MLSV.tune[k]=id;const i=mlSuvIdx(k),q=mlTuneHp(k,mlTuneOf(k));try{localStorage.setItem('mudlab:tune:'+k,MLSV.tune[k]);}catch(e){}mlmClose();
  if(i>=0&&i!==t.bi){const d=GAME.dirt;spawnCar(i,t.p[0],t.p[2],mlvYaw(t));GAME.dirt=d;
    {const n=GAME.car.pt;if(n.st==='off'){n.st='run';n.we=n.e.idle*TAU/60;}}MLR.stuck=false;MLR.stuckT=0;MLV.quiet=APP.t+4;}
  say('THE '+ML_SUV_NAME[k]+', '+q.name+': '+q.hp.toLocaleString('en-US')+' HP',2.6);}
/* ---------- (Mud Lab 21) A JUMP, MEASURED ---------- */
/* His words, 14 Nov 2026: "we're getting close to the point where I want to add the point system." Not points yet: the
   measure they would be made of. Any time all four tyres are off the ground for 0.7 s or more, the SUV went 30 ft or
   more in that time, and its tyres were a foot or more clear of the ground on the way (a SUV sliding on its roof has
   no tyre on the ground either): one line as it touches down, how long and how far. And for a named jump, taken from
   its own ramp and landed on its wheels (still upright and not drowned a second and a half later): the longest so
   far for that SUV is kept, and shown beside the jump's name in THINGS TO DO. No dice rolled, nothing of the physics
   touched */
const MLJ_BRIEF={'CREEK GAP':'CREEK GAP: 55 MPH CLEARS BIG CREEK. EITHER WAY, EITHER SUV',
  'RIVER JUMP':'RIVER JUMP: 83 MPH AT THE RAMP, 88 COMING BACK. THE STOCK SUV NEEDS THE WHOLE RUN-UP',
  'LAKE JUMP':'LAKE JUMP: 70 MPH LANDS ON THE ISLAND. WADE BACK ALONG THE SAND BAR',
  'BIG AIR':'BIG AIR: NO GAP. THE FASTER YOU GO, THE FURTHER YOU FLY'};
const MLJ={a:null,land:null,on:null,last:null,Z:{},car:null,px:0,pz:0,downT:-9,best:(()=>{try{return JSON.parse(localStorage.getItem('mudlab:jumps')||'{}')||{};}catch(e){return {};}})()};
function mljTick(t,dt){if(!t||t.rt||!WG.mlX||!WG.mlX.jumps){MLJ.a=null;MLJ.land=null;return;}
  const A=WG.mlA,u=t.p[0]-A.x,v=t.p[2]-A.z,on=t.wheels.some(w=>w.contact);
  /* (set down somewhere else: by the map, a reset, a tow, the other SUV. That is not a flight. The first try credited
     the Rock & Mud, reset off its roof to the far end of the lane, with a 1,252 ft jump) */
  if(MLJ.car!==t||Math.hypot(t.p[0]-MLJ.px,t.p[2]-MLJ.pz)>6+t.speed*dt*3){MLJ.a=null;MLJ.land=null;MLJ.on=null;}MLJ.car=t;MLJ.px=t.p[0];MLJ.pz=t.p[2];
  if(on){
    if(MLJ.a){const a=MLJ.a,d=Math.hypot(t.p[0]-a.x,t.p[2]-a.z);MLJ.a=null;
      /* (it left on its wheels, and not as a bounce in the two seconds after the last touchdown) */
      if(a.t>=.7&&d>=9&&a.clear>=.3&&a.up>.6&&a.t0-MLJ.downT>2){const ft=Math.round(d*3.281);let j=a.j;
        /* (a jump with a gap counts only if it came down on the far side of it) */
        if(j){const J=WG.mlX.jumps.find(q=>q.name===j),s=(u-J.u)*J.dx+(v-J.v)*J.dz;if(J.g>3&&!(s*a.sg<0&&Math.abs(s)>J.g-1.5))j=null;}
        MLJ.downT=GAME.time;MLJ.last={ft,air:+a.t.toFixed(2),jump:j};MLJ.land={t:0,ft,j};say('IN THE AIR '+a.t.toFixed(1)+' S: '+ft+' FT',2.8,PAL.gold);}}
    /* (the jump whose ramp it is on: anywhere from the ramp's foot to its lip; Big Air's lip from either side) */
    WG.mlZone(u,v,MLJ.Z);MLJ.on=null;MLJ.sg=0;if(MLJ.Z.jmp){const J=WG.mlX.jumps[MLJ.Z.jmp-1],s=(u-J.u)*J.dx+(v-J.v)*J.dz,S=s<0?J.A:J.B,x=Math.abs(s)-J.g;if(x>-4&&x<Math.max(12,S.len+6)){MLJ.on=J.name;MLJ.sg=s<0?-1:1;}}
    if(MLJ.land){const L=MLJ.land;L.t+=dt;if(t.M[4]<.5||t.mlDrowned)MLJ.land=null;
      else if(L.t>1.5){MLJ.land=null;if(L.j){const k=L.j+':'+mlSuvKind(t),was=MLJ.best[k]||0;
          if(L.ft>was){MLJ.best[k]=L.ft;try{localStorage.setItem('mudlab:jumps',JSON.stringify(MLJ.best));}catch(e){}say(L.j+': '+L.ft+' FT. '+(was?'YOUR LONGEST':'YOUR FIRST'),3.2,PAL.gold);}}}}}
  else{if(!MLJ.a)MLJ.a={x:t.p[0],z:t.p[2],t:0,t0:GAME.time,clear:0,j:MLJ.on,sg:MLJ.sg||0,up:t.M[4]};const a=MLJ.a;a.t+=dt;a.clear=Math.max(a.clear,t.p[1]-(t.c.hcg||.8)-RANCH.W.heightAt(t.p[0],t.p[2]));}}
/* (a run is over if you jump somewhere else, or are towed home) */
function mlmEnd(){if(MLM.run){MLM.run=null;if(MLM.guide&&MLM.guide.leg)MLM.guide=null;}}
const MLM_VJ=mlvJump;mlvJump=function(p){if(p.kind!=='do')mlmEnd();return MLM_VJ(p);};
/* ---------- the menu ---------- */
function mlmUI(){if(MLM.btn)return;
  const st=document.createElement('style');st.textContent=`#mlGrip,#mlSuv,#mlBring,#mlAir{display:none!important}
#mlMenu,#mlMenuP button{font:600 13px system-ui,sans-serif;letter-spacing:.05em;color:#f2e6d2;cursor:pointer}
#mlMenu{position:fixed;z-index:62;top:calc(env(safe-area-inset-top) + 8px);left:calc(50% + 48vh + 8px);padding:9px 16px;border-radius:999px;border:0;background:#c98f4a;color:#1d140a;box-shadow:0 4px 16px rgba(0,0,0,.4)}
#mlMenuP{position:fixed;z-index:62;top:calc(env(safe-area-inset-top) + 48px);left:calc(50% + 48vh + 8px);width:196px;max-width:calc(50vw - 48vh - 14px);max-height:calc(100vh - 58px);overflow-y:auto;display:flex;flex-direction:column;gap:4px}
#mlMenuP button{text-align:left;padding:9px 12px;border-radius:10px;border:1px solid rgba(242,230,210,.3);background:rgba(20,14,9,.86)}
#mlMenuP button.h{background:rgba(201,143,74,.9);color:#1d140a;border-color:transparent}
#mlMenuP.k{width:300px}#mlMenuP.k button{padding:7px 12px}
@media (max-aspect-ratio:3/2){#mlMenu,#mlMenuP{left:calc(env(safe-area-inset-left) + 8px)}#mlMenuP{max-width:none}}
@media (hover:hover) and (pointer:fine){#mlMenu{top:46px}#mlMenuP{top:86px;max-height:calc(100vh - 96px)}}
#mlGuideB{position:fixed;z-index:61;left:calc(env(safe-area-inset-left) + 12px);top:calc(50% - 76px);font:600 12px system-ui,sans-serif;letter-spacing:.06em;padding:8px 14px;border-radius:999px;border:1px solid rgba(242,230,210,.4);background:rgba(20,14,9,.82);color:#f2e6d2;cursor:pointer}
#mlNav{position:fixed;z-index:40;top:calc(env(safe-area-inset-top) + 96px);left:calc(env(safe-area-inset-left) + 96px);font:700 13px system-ui,sans-serif;letter-spacing:.06em;color:#f3c66a;text-shadow:0 1px 3px #000,0 0 6px rgba(0,0,0,.7);pointer-events:none;display:flex;align-items:center;gap:10px;white-space:pre}
#mlNav b{display:inline-block;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:21px solid #f3c66a;filter:drop-shadow(0 1px 2px #000)}`;document.head.appendChild(st);
  const b=MLM.btn=document.createElement('button');b.type='button';b.id='mlMenu';b.hidden=true;b.textContent='MENU ▾';
  const p=MLM.panel=document.createElement('div');p.id='mlMenuP';p.hidden=true;
  for(const el of [b,p]){el.addEventListener('pointerdown',e=>e.stopPropagation());}
  b.addEventListener('click',e=>{e.stopPropagation();MLM.open=!MLM.open;MLM.page='main';MLM.sig='';});
  p.addEventListener('click',e=>{e.stopPropagation();const k=e.target&&e.target.dataset&&e.target.dataset.k;if(k)mlmPick(k);});
  const n=MLM.nav=document.createElement('div');n.id='mlNav';n.hidden=true;n.innerHTML='<b></b><span></span>';
  const g=MLM.gb=document.createElement('button');g.type='button';g.id='mlGuideB';g.hidden=true;g.textContent='OR GUIDE ME THERE';g.addEventListener('pointerdown',e=>e.stopPropagation());
  g.addEventListener('click',e=>{e.stopPropagation();const q=MLV.sel;if(!q)return;const G9=mlvGuideTo(q);mlmGuide(q.name,G9.x,G9.z);MLV.sel=null;if(MLV.jb)MLV.jb.hidden=true;mlmClose();});
  document.body.appendChild(b);document.body.appendChild(p);document.body.appendChild(n);document.body.appendChild(g);}
function mlmClose(){MLM.open=false;MLM.page='main';MLKB.cap=null;APP.bigMap=false;}
function mlmRows(){const t=GAME.car,o=MLR.other,R=[];
  if(MLM.page==='do'){R.push(['back','◂ BACK','h']);mlmDo().forEach((E,i)=>R.push(['do'+i,E.name+mlmMark(E)]));return R;}
  /* (Mud Lab 17, src/ml-suv.js) the tunes of the SUV you are in: what each comes to; the one it has is lit */
  if(MLM.page==='tune'&&t&&!t.rt){const k=mlSuvKind(t);R.push(['back','◂ BACK','h']);
    for(const q of ML_TUNE[k]){mlTuneHp(k,q);R.push(['tn:'+q.id,q.name+': '+q.hp.toLocaleString('en-US')+' HP, '+q.lbft.toLocaleString('en-US')+' LB-FT. '+q.note,q===mlTuneOf(k)?'h':'']);}return R;}
  /* (Mud Lab 16, src/ml-keys.js) the keyboard's keys: click a row, press the key it should have */
  if(MLM.page==='keys'){R.push(['back','◂ BACK','h']);R.push(['knote',MLKB.note||'CLICK A ROW, THEN PRESS ITS NEW KEY']);
    for(const r of MLKB.rows)R.push(['key:'+r[0],MLKB.cap===r[0]?r[1]+': PRESS A KEY (ESC LEAVES IT)':r[1]+': '+mlkKeys(r[0]),MLKB.cap===r[0]?'h':'']);
    R.push(['kreset','RESET ALL KEYS','h']);return R;}
  if(t&&!t.rt){const k=mlSuvKind(t),opp=k==='stock'?'crawler':'stock';R.push(o&&mlSuvKind(o)===opp?['seat','GET IN THE '+ML_SUV_SHORT[opp]]:['swap','SWITCH TO THE '+ML_SUV_SHORT[opp]]);
    if(o&&MLR.mode==='free')R.push(['bring','BRING THE '+ML_SUV_SHORT[mlSuvKind(o)]+' HERE']);else if(MLR.mode==='real'&&MLR.stuck)R.push(['home','A TOW HOME']);
    R.push(['size','TYRE SIZE: '+ML_TYRE[k][MLSV.big[k]?1:0].replace('s',' IN')]);R.push(['tune','TUNE: '+mlTuneOf(k).name+' ▸']);
    const A=ML_AIRS[t.mlAirI||0];R.push(['air','TYRE AIR: '+A.psi+' PSI '+A.name]);}
  R.push(['grip','GRIP: '+(MLS.terra?'SOIL SCIENCE':'GAME')]);R.push(['rake','CLEAR ALL RUTS']);R.push(['todo','THINGS TO DO ▸','h']);
  /* (the keys' list only where there is a keyboard: a key has been pressed, or the pointer is a mouse) */
  if(MLKB.seen||matchMedia('(hover:hover) and (pointer:fine)').matches)R.push(['keys','KEYS ▸','h']);
  if(MLM.guide)R.push(['stop',MLM.run?'END THE RUN':'STOP GUIDING']);return R;}
function mlmPick(k){MLM.sig='';const t=GAME.car;
  /* (a refusal is said where it can be read: the game's messages are drawn under the open map, so it closes first) */
  if((k==='size'||k==='air'||k==='swap'||k==='seat')&&t&&!t.rt&&t.speed>1.5){mlmClose();say('STOP FIRST: YOU ARE STILL ROLLING',2.2);return;}
  if(k==='tune'){MLM.page='tune';return;}if(k.slice(0,3)==='tn:'){mlmTune(k.slice(3));return;}
  if(k==='rake'){mlmClose();mlmClear();return;}
  if(k==='keys'){MLM.page='keys';MLKB.note='';MLKB.cap=null;return;}if(k==='knote')return;if(k==='kreset'){MLKB.cap=null;mlkReset();return;}
  if(k.slice(0,4)==='key:'){const q=k.slice(4);MLKB.cap=MLKB.cap===q?null:q;return;}
  if(k==='swap'){mlSuvSet(mlSuvKind(t)==='stock'?'crawler':'stock');MLR.stuck=false;MLR.stuckT=0;mlmClose();return;}
  if(k==='seat'){mlrSeat();mlmClose();}else if(k==='bring'){mlrBring();mlmClose();}else if(k==='home'){mlrHome();mlmEnd();mlmClose();}
  else if(k==='size')mlmSize();else if(k==='air')mlrAirNext();else if(k==='grip')mlGripToggle();else if(k==='todo')MLM.page='do';else if(k==='back'){MLM.page='main';MLKB.cap=null;}
  else if(k==='stop'){MLM.guide=null;MLM.rescue=null;MLM.run=null;}else if(k.slice(0,2)==='do'){const E=mlmDo()[+k.slice(2)];if(E)mlmGo(E);}}
/* ---------- each frame ---------- */
function mlmTick(t){mlmUI();const map=APP.bigMap&&GAME.state==='drive';
  if(!map&&MLM.open){MLM.open=false;MLM.page='main';}
  if(MLKB.cap&&!(map&&MLM.open&&MLM.page==='keys'))MLKB.cap=null;MLM.panel.classList.toggle('k',MLM.page==='keys'||MLM.page==='tune');
  {const g=MLM.gb,on=map&&!!MLV.jb&&!MLV.jb.hidden&&!!MLV.sel;if(g.hidden===on)g.hidden=!on;}
  if(MLM.btn.hidden===map)MLM.btn.hidden=!map;const showP=map&&MLM.open;if(MLM.panel.hidden===showP)MLM.panel.hidden=!showP;
  if(showP){const R=mlmRows(),sig=JSON.stringify(R);if(sig!==MLM.sig){MLM.sig=sig;MLM.panel.innerHTML=R.map(r=>'<button type="button" data-k="'+r[0]+'"'+(r[2]?' class="'+r[2]+'"':'')+'>'+r[1].replace(/&/g,'&amp;')+'</button>').join('');}}
  /* the rescue: done when the strap is off and the bogged SUV stands clear of its puddle */
  if(MLM.rescue){const R=MLM.rescue,o=MLR.other;if(o!==R.o)MLM.rescue=null;
    else if(!MLR.strap&&Math.hypot(o.p[0]-R.x,o.p[2]-R.z)>R.H.L+6){const s=GAME.time-R.t0;MLM.rescue=null;MLM.guide=null;o.mlStuck=false;say('RESCUED IN '+mlmClock(s),5,PAL.gold);}}
  if(MLM.run&&t&&!t.rt&&GAME.state==='drive')mlmRunTick(t);
  /* the arrow: up is straight ahead of the SUV */
  const G=MLM.guide,n=MLM.nav,show=!!G&&!map&&GAME.state==='drive'&&!!t;if(n.hidden===show)n.hidden=!show;
  if(show){const dx=G.x-t.p[0],dz=G.z-t.p[2],d=Math.hypot(dx,dz),fx=t.M[0],fz=t.M[6],a=Math.atan2(-dx*fz+dz*fx,dx*fx+dz*fz),ft=m=>Math.round(m*3.281).toLocaleString('en-US')+' FT';
    n.firstChild.style.transform='rotate('+a.toFixed(2)+'rad)';const tx=G.leg?G.name+'  '+ft(G.togo)+'  '+mlmClock(G.clock):G.name+'  '+ft(d);if(n.lastChild.textContent!==tx)n.lastChild.textContent=tx;
    if(!G.leg&&d<16&&!(t.rt&&G.run)){MLM.guide=null;say(G.brief||('YOU ARE AT '+G.name),5);if(G.run)mlmRun(G.run.name,G.run.n,G.run.i);}}}
window.__mlm={MLM,mlmGuide,mlmGo,mlmDo,mlmRescue,mlmPick,mlmRows,mlmSize,mlmRun,mlmTune,mlmClear,MLJ,mljTick};
