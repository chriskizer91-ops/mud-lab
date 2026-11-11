/* =====================================================================================
   MUD LAB 13: THE MAP'S MENU, THE GUIDE ARROW, THINGS TO DO.
   His words: the map's buttons (the other SUV, bring it, the tyres' pressure, the grip) covered the map, and the Bog,
   the pull test and the tyres weren't easy to find. Now the open map has one button, MENU, beside it (over its corner
   on an upright phone); it drops down a list:
     GET IN the other SUV / BRING IT HERE (Free play) or A TOW HOME (Real, bogged) / TYRE SIZE / TYRE AIR / GRIP /
     THINGS TO DO.
   THINGS TO DO lists what there is here: the Bog, the pull test, the three trails, the pond's bank, a rescue. Pick
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
function mlmDo(){const B=WG.mlBog,P=MLB_POST(),A=WG.mlA,T=WG.mlTrails,
  tr=(n,i,name,brief)=>{const p=T[n].pts,a=p[i],b=p[i+3];return {name,brief,u:a[0],v:a[1],yaw:Math.atan2(-(b[1]-a[1]),b[0]-a[0]),run:{n,i}};};
  return [{name:'THE BOG',u:B.u0-14,v:B.v,yaw:0,brief:'THE BOG: DRIVE IN FROM THIS END. WHERE YOU STOP IS YOUR MARK'},
    {name:'THE PULL TEST',u:P.x-A.x+7,v:P.z-A.z,yaw:0,brief:'PULL TEST: STOP WITH YOUR TAIL TO THE POST, THEN TAP PULL TEST'},
    tr(4,48,'EASY TRAIL','EASY: THE FIELD TRACK, EAST TO THE QUARRY. KEEP MOVING THROUGH THE PUDDLES'),
    tr(0,4,'MEDIUM TRAIL','MEDIUM: THE CREEK LOOP, NORTH. THE FORDS STOP THE STOCK SUV'),
    tr(2,4,'HARD TRAIL','HARD: THE GUMBO TRAIL. A STEADY THROTTLE THROUGH THE PITS, AND DON\'T STOP'),
    Object.assign({name:'THE POND\'S BANK',brief:'THE BANK: EASE DOWN IT INTO THE POND, THEN WINCH BACK UP TREE BY TREE'},mlmBank()),
    {name:'A RESCUE',rescue:1}];}
/* (beside each name in the list: this SUV's best there) */
function mlmMark(E){const t=GAME.car,k=t&&!t.rt?mlSuvKind(t):MLSV.pick;
  if(E.run){const b=MLM.best[E.run.n+':'+k];return b?'  '+mlmClock(b):'';}
  if(E.name==='THE BOG'){const b=MLB.best[k];return b?'  '+b+' FT':'';}return '';}
/* ---------- the guide ---------- */
function mlmGuide(name,x,z,brief,run){MLM.run=null;MLM.guide={name,x,z,brief:brief||'',run:run||null};say('GUIDING YOU TO '+name+': FOLLOW THE ARROW',2.6);}
function mlmGo(E){const A=WG.mlA;
  if(E.rescue){mlmRescue();mlmClose();return;}
  if(MLR.mode==='real'){mlmGuide(E.name,A.x+E.u,A.z+E.v,E.brief,E.run&&Object.assign({name:E.name},E.run));mlmClose();return;}
  mlvJump({name:E.name,u:E.u,v:E.v,yaw:E.yaw,exact:E.exact,kind:'do'});MLM.guide=null;MLM.run=null;mlmClose();if(E.brief)say(E.brief,5);
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
  g.addEventListener('click',e=>{e.stopPropagation();const q=MLV.sel,A=WG.mlA;if(!q)return;mlmGuide(q.name,A.x+q.u,A.z+q.v);MLV.sel=null;if(MLV.jb)MLV.jb.hidden=true;mlmClose();});
  document.body.appendChild(b);document.body.appendChild(p);document.body.appendChild(n);document.body.appendChild(g);}
function mlmClose(){MLM.open=false;MLM.page='main';APP.bigMap=false;}
function mlmRows(){const t=GAME.car,o=MLR.other,R=[];
  if(MLM.page==='do'){R.push(['back','◂ BACK','h']);mlmDo().forEach((E,i)=>R.push(['do'+i,E.name+mlmMark(E)]));return R;}
  if(t&&!t.rt){const k=mlSuvKind(t),opp=k==='stock'?'crawler':'stock';R.push(o&&mlSuvKind(o)===opp?['seat','GET IN THE '+ML_SUV_SHORT[opp]]:['swap','SWITCH TO THE '+ML_SUV_SHORT[opp]]);
    if(o&&MLR.mode==='free')R.push(['bring','BRING THE '+ML_SUV_SHORT[mlSuvKind(o)]+' HERE']);else if(MLR.mode==='real'&&MLR.stuck)R.push(['home','A TOW HOME']);
    R.push(['size','TYRE SIZE: '+ML_TYRE[k][MLSV.big[k]?1:0].replace('s',' IN')]);
    const A=ML_AIRS[t.mlAirI||0];R.push(['air','TYRE AIR: '+A.psi+' PSI '+A.name]);}
  R.push(['grip','GRIP: '+(MLS.terra?'SOIL SCIENCE':'GAME')]);R.push(['todo','THINGS TO DO ▸','h']);
  if(MLM.guide)R.push(['stop',MLM.run?'END THE RUN':'STOP GUIDING']);return R;}
function mlmPick(k){MLM.sig='';const t=GAME.car;
  /* (a refusal is said where it can be read: the game's messages are drawn under the open map, so it closes first) */
  if((k==='size'||k==='air'||k==='swap'||k==='seat')&&t&&!t.rt&&t.speed>1.5){mlmClose();say('STOP FIRST: YOU ARE STILL ROLLING',2.2);return;}
  if(k==='swap'){mlSuvSet(mlSuvKind(t)==='stock'?'crawler':'stock');MLR.stuck=false;MLR.stuckT=0;mlmClose();return;}
  if(k==='seat'){mlrSeat();mlmClose();}else if(k==='bring'){mlrBring();mlmClose();}else if(k==='home'){mlrHome();mlmEnd();mlmClose();}
  else if(k==='size')mlmSize();else if(k==='air')mlrAirNext();else if(k==='grip')mlGripToggle();else if(k==='todo')MLM.page='do';else if(k==='back')MLM.page='main';
  else if(k==='stop'){MLM.guide=null;MLM.rescue=null;MLM.run=null;}else if(k.slice(0,2)==='do'){const E=mlmDo()[+k.slice(2)];if(E)mlmGo(E);}}
/* ---------- each frame ---------- */
function mlmTick(t){mlmUI();const map=APP.bigMap&&GAME.state==='drive';
  if(!map&&MLM.open){MLM.open=false;MLM.page='main';}
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
window.__mlm={MLM,mlmGuide,mlmGo,mlmDo,mlmRescue,mlmPick,mlmRows,mlmSize,mlmRun};
