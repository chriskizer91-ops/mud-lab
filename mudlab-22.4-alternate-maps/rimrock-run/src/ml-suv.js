/* =====================================================================================
   MUD LAB: THE STOCK SUV (Mud Lab 6). His own SUV as the engine has it (the Stock build: the 4.6 V8, six-speed
   automatic, 3.73 gears, 2,180 kg, 245/65R17 all-season tyres, all-wheel drive through a slipping centre coupling
   with brake traction control, open diffs, no lockers, factory ride height), next to the Rock & Mud, so the two can be
   driven into the same mud. Nothing about either is changed; the soil reads their tyres (src/ml-soil.js: an
   all-season's small tread voids bite less into soft soil and pack with sticky clay sooner than a mud-terrain's lugs).
   - the title: pick ROCK & MUD or STOCK SUV under the title (remembered); BAY shows the one picked;
   - on the map (Mud Lab 9: both SUVs are in the world now, src/ml-recover.js): GET IN: STOCK / GET IN: ROCK & MUD
     (right, under the grip) puts you in the other one, where it stands, when you're stopped; the Heron's TRUCK puts you in the one you drove last;
   - his SUV's four-wheel drive, as its transfer case has it (the game's Stock has the two-speed one): the button (L on a
     keyboard) goes AWD (the centre coupling slips, the brakes send the torque) -> 4 HI (the centre locked: front and
     rear turn together) -> 4 LO (locked, and the 2.64 low range) -> AWD.
   ===================================================================================== */
/* THE ALTERNATE MAPS: FOUR VEHICLES. The two SUVs as they were; and two of the engine's own that Mud Lab never
   offered: the GROUP B HATCH (Salt & Sand's rally car, the engine's build hatchB: 1,050 kg, four-wheel drive, gravel
   tyres; drawn from its own bake, src/ml-truck.js) and the OLD TRACTOR (the engine's 1940s two-cylinder: 2,500 kg,
   rear-wheel drive, six gears to about 12 mph, 38 in lugged rear tyres; drawn as the engine builds it). Nothing of
   either is changed: the soil reads their tyres as it reads any (src/ml-soil.js mlLug). One tyre size and one
   tune each, for now */
/* (Rimrock Run: the two SUVs and the Group B) */
const ML_KINDS=['crawler','stock','hatchB'];
const MLSV={pick:(()=>{try{const k=localStorage.getItem('rimrockrun:suv');return ML_KINDS.includes(k)?k:'crawler';}catch(e){return 'crawler';}})(),bi:{crawler:-1,stock:-1,hatchB:-1,tractor:-1},btn:null,
  /* (Mud Lab 11) a tyre size up for each, his idea: the stock SUV on 33 in all-terrains with the 2 in leveling kit they
     need; the Rock & Mud on 40 in mud-terrains. Built by the engine's own garage (rigBuild), so the bigger tyre's
     radius, width, weight, tread and the taller gearing it gives are the engine's; the soil reads them as it reads
     any tyre. Picked on the title (tap your SUV's name again), each SUV's own, remembered */
  big:{crawler:false,stock:false,hatchB:false,tractor:false},bib:{crawler:-1,stock:-1},
  /* (Mud Lab 17) a tune for each (ML_TUNE below; '' is as it came), each SUV's own, remembered; rb: the builds made */
  tune:{crawler:'',stock:'',hatchB:'',tractor:''},rb:{}};
for(const k of ['crawler','stock'])try{MLSV.big[k]=localStorage.getItem('rimrockrun:big:'+k)==='1';MLSV.tune[k]=localStorage.getItem('rimrockrun:tune:'+k)||'';}catch(e){}
const ML_BIG={stock:{tires:'at33',ride:'lift2'},crawler:{tires:'mt40'}},ML_TYRE={stock:['29s','33s'],crawler:['37s','40s'],hatchB:['gravel 24s'],tractor:['38 in lugs']};
const mlSuvKind=v=>{if(!v||v.rt||!v.build)return 'crawler';const b=v.build;return (b.kit||b.id)==='stock'?'stock':b.car==='hatch'?'hatchB':b.car==='tractor'?'tractor':'crawler';};
const mlIsStock=v=>!!(v&&!v.rt&&v.build&&(v.build.kit||v.build.id)==='stock');
const ML_SUV_NAME={crawler:'ROCK & MUD',stock:'STOCK SUV',hatchB:'GROUP B HATCH',tractor:'TRACTOR'},ML_SUV_SHORT={crawler:'ROCK & MUD',stock:'STOCK',hatchB:'GROUP B',tractor:'TRACTOR'},
  ML_SUV_LABEL={crawler:'Rock & Mud',stock:'Stock SUV',hatchB:'Group B',tractor:'Tractor'};
/* (Mud Lab 17) tuned presets of the engine and the gearing, his ask: "tuned presets for the performance part of the
   vehicle for both the stock and the rock and mud SUV in the drop-down menu". Each is a handful of the engine's own
   garage parts laid over the SUV as it came, built by the garage (rigBuild) like the bigger tyres, so the power, the
   weight, the gears and the sound are the engine's own. The first of each list is the SUV as it has always been
   (the same build as before, to the last digit). Tyres, suspension, diffs and the body are not touched: the stock
   SUV keeps its open diffs and all-seasons, the Rock & Mud its lockers and mud-terrains.
   His SUV: more power in three steps. The Rock & Mud comes with 2,175 hp (a blown 10.4 litre and a race
   four-speed): its two tunes are for control, an automatic, shorter gears and a crawl box (4 to 1 in low) */
const ML_TUNE={
  stock:[{id:'',name:'FACTORY',note:'4.6 V8, 3.73 GEARS'},
    {id:'bolt',name:'BOLT-ONS',note:'COLD AIR, CAT-BACK EXHAUST, STREET TUNE',rig:{intake:1,exhaust:'catback',tune:1}},
    {id:'sc',name:'SUPERCHARGED',note:'A BLOWER ON THE 4.6, 4.10 GEARS',rig:{power:'roots',intake:1,exhaust:'catback',tune:1,axle:4.1}},
    {id:'v62',name:'6.2 V8 SWAP',note:'HEADERS, STREET CAM, 4.10 GEARS',rig:{engine:'v62',intake:2,exhaust:'headers',cam:1,tune:1,axle:4.1}}],
  crawler:[{id:'',name:'AS BUILT',note:'BLOWN 10.4 BIG-BLOCK, RACE FOUR-SPEED, 4.10 GEARS'},
    {id:'trail',name:'TRAIL V8',note:'6.2 V8, AUTOMATIC, 4.88 GEARS, CRAWL BOX',rig:{engine:'v62',power:'none',intake:1,exhaust:'headers',cam:1,tune:1,nos:0,trans:'auto6',axle:4.88,transfer:'crawl'}},
    {id:'f46',name:'FACTORY 4.6',note:'THE STOCK SUV\'S ENGINE, AUTOMATIC, 5.38 GEARS, CRAWL BOX',rig:{engine:'v46',power:'none',intake:0,exhaust:'stock',cam:0,tune:0,nos:0,trans:'auto6',axle:5.38,transfer:'crawl'}}],
  hatchB:[{id:'',name:'GROUP B',note:'1.8 TURBO FOUR, ANTI-LAG, FOUR-WHEEL DRIVE'}],
  tractor:[{id:'',name:'AS IT CAME',note:'5.5 LITRE TWO-CYLINDER, SIX GEARS, DIFF LOCK'}]};
const mlTuneOf=k=>ML_TUNE[k].find(q=>q.id===MLSV.tune[k])||ML_TUNE[k][0];
/* (what a tune comes to, from the engine's own spec: horsepower and pound-feet at the crank) */
function mlTuneHp(k,q){if(q.hp===undefined){try{const e=specOf(q.rig?rigBuild('suv',Object.assign(presetRig(k),q.rig)):BUILDS.findIndex(b=>b.id===k));q.hp=Math.round(e.peak.hp);q.lbft=Math.round(e.peak.tq*.7376);}catch(e){q.hp=0;q.lbft=0;}}return q;}
/* (the builds: the Rock & Mud as the game made it at boot; his SUV as its garage preset) */
function mlSuvIdx(k){
  /* (the hatch and the tractor: the engine's own builds, as they are) */
  if(k==='hatchB'||k==='tractor'){if(MLSV.bi[k]<0)MLSV.bi[k]=BUILDS.findIndex(b=>b.id===k);return MLSV.bi[k];}
  {const q=mlTuneOf(k);if(q.rig){const key=k+'|'+(MLSV.big[k]?1:0)+'|'+q.id;if(MLSV.rb[key]===undefined){try{MLSV.rb[key]=rigBuild('suv',Object.assign(presetRig(k),MLSV.big[k]?ML_BIG[k]:{},q.rig));}catch(e){console.warn('tune',key,e);MLSV.rb[key]=-1;}}
    if(MLSV.rb[key]>=0)return MLSV.rb[key];MLSV.tune[k]='';}}
  if(MLSV.big[k]){if(MLSV.bib[k]<0){try{MLSV.bib[k]=rigBuild('suv',Object.assign(presetRig(k),ML_BIG[k]));}catch(e){console.warn('big tyres',e);MLSV.big[k]=false;}}if(MLSV.bib[k]>=0)return MLSV.bib[k];}
  if(k==='crawler'){if(MLSV.bi.crawler<0){const c=GAME.car;MLSV.bi.crawler=c&&!c.rt&&(c.build.kit||c.build.id)==='crawler'?c.bi:BUILDS.findIndex(b=>b.id==='crawler');}return MLSV.bi.crawler;}
  if(MLSV.bi.stock<0){try{MLSV.bi.stock=rigBuild('suv',presetRig('stock'));}catch(e){MLSV.bi.stock=BUILDS.findIndex(b=>b.id==='stock');}}return MLSV.bi.stock;}
/* into the other SUV, where this one stands (or, before the drive, the one the bay shows) */
function mlSuvSet(k){
  mlSuvIdx('crawler');MLSV.pick=k;try{localStorage.setItem('rimrockrun:suv',k);}catch(e){}
  const t=GAME.car;if(!t||t.rt||mlSuvKind(t)===k)return true;const i=mlSuvIdx(k);if(i<0)return false;
  if(GAME.state==='drive'){const yaw=Math.atan2(-t.M[6],t.M[0]);spawnCar(i,t.p[0],t.p[2],yaw);say('THE '+ML_SUV_NAME[k],1.6);}
  else spawnCar(i);
  return true;}
/* ---------- 4WD: his SUV's centre locked in high range (the LOW button and the L key, on this one) ---------- */
const mlMode=t=>!t.low?'AWD':t.pt.lo>1?'4 LO':'4 HI';
function mlLow(t){
  if(mlIsStock(t)){const m=mlMode(t);
    if(m==='AWD'){t.low=true;t.pt.lo=1;t.c.diff.cLock=true;return '4 HI: FRONT AND REAR LOCKED TOGETHER';}
    if(m==='4 HI'&&setLow(t,true))return '4 LO: LOW RANGE';
    setLow(t,false);t.low=false;t.pt.lo=1;t.c.diff.cLock=false;return 'AWD';}
  return setLow(t,!t.low)?(t.low?'Low range':'High range'):'No low range on this car';}
/* the button's name, each frame it matters */
function mlSuvTick(){const t=GAME.car;if(!t||GAME.state!=='drive')return;
  const b=document.getElementById('tLow');if(b){const nm=mlIsStock(t)?mlMode(t):'LOW';if(b.textContent!==nm)b.textContent=nm;}
  if(MLSV.btn&&!APP.bigMap&&!MLSV.btn.hidden)MLSV.btn.hidden=true;}
/* ---------- on the map: the swap (under the grip, right) ---------- */
function mlSuvBtn(){
  const t=GAME.car;let b=MLSV.btn;
  if(!b){b=MLSV.btn=document.createElement('button');b.type='button';b.id='mlSuv';
    b.style.cssText='position:fixed;right:calc(env(safe-area-inset-right) + 12px);top:calc(50% - 38px);z-index:61;font:600 13px system-ui,sans-serif;letter-spacing:.05em;padding:9px 16px;border-radius:999px;border:1px solid rgba(242,230,210,.35);background:rgba(20,14,9,.72);color:#f2e6d2;cursor:pointer';
    b.addEventListener('pointerdown',e=>e.stopPropagation());
    b.addEventListener('click',e=>{e.stopPropagation();const c=GAME.car;if(!c||c.rt)return;
      if(Math.hypot(c.v[0],c.v[1],c.v[2])>3){say('STOP FIRST',1.4);return;}
      if(MLR.other&&!MLR.off)mlrSeat();else mlSuvSet(mlSuvKind(c)==='stock'?'crawler':'stock');mlSuvBtn();});
    document.body.appendChild(b);}
  const show=APP.bigMap&&GAME.state==='drive'&&t&&!t.rt;b.hidden=!show;
  if(show){const nm=MLR.other&&!MLR.off?'GET IN: '+ML_SUV_SHORT[mlSuvKind(MLR.other)]:'SUV: '+ML_SUV_SHORT[mlSuvKind(t)];if(b.textContent!==nm)b.textContent=nm;}}
/* ---------- the title: which one to drive ---------- */
function mlSuvTitle(root){
  /* (the Rock & Mud as the game made it at boot: noted before any other is made) */
  if(MLSV.bi.crawler<0){const c=GAME.car;if(c&&!c.rt&&(c.build.kit||c.build.id)==='crawler')MLSV.bi.crawler=c.bi;}
  const row=document.createElement('div');row.id='mlPick';
  row.innerHTML='<button type="button" data-k="crawler">Rock &amp; Mud</button><button type="button" data-k="stock">Stock SUV</button><button type="button" data-k="hatchB">Group B</button>';
  const NM=ML_SUV_LABEL,paint=()=>{for(const x of row.children){const k=x.dataset.k;if(!k)continue;x.classList.toggle('on',k===MLSV.pick);x.textContent=NM[k]+(ML_BIG[k]?' \u00b7 '+ML_TYRE[k][MLSV.big[k]?1:0]:'');}};
  row.addEventListener('click',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.k;if(!k)return;
    if(k===MLSV.pick&&ML_BIG[k]){MLSV.big[k]=!MLSV.big[k];try{localStorage.setItem('rimrockrun:big:'+k,MLSV.big[k]?'1':'0');}catch(_){}}
    mlSuvSet(k);if(GAME.state!=='drive'&&GAME.car&&GAME.car.bi!==mlSuvIdx(k))spawnCar(mlSuvIdx(k));paint();});
  paint();const go=root.querySelector('#mlGo');go.parentNode.insertBefore(row,go);
  const st=document.createElement('style');st.textContent=`#mlTitle .mlT{max-width:800px}#mlPick{margin:0 0 10px}#mlPick button{background:rgba(20,14,9,.45);color:#f2e6d2;padding:9px 13px;font-size:13px!important;letter-spacing:.1em!important;border:1px solid rgba(242,230,210,.3)!important;margin:4px}
#mlPick button.on{background:#f2e6d2;color:#1d140a;border-color:#f2e6d2!important}`;document.head.appendChild(st);}
/* (at Start, the one picked: the game makes the Rock & Mud at boot) */
function mlSuvStart(){if(mlSuvKind(GAME.car)!==MLSV.pick)mlSuvSet(MLSV.pick);
  /* (the size picked: the game makes the standard one) */
  {const i=mlSuvIdx(MLSV.pick);if(GAME.car&&!GAME.car.rt&&i>=0&&GAME.car.bi!==i)spawnCar(i);}}
/* (for the tests: what a rig comes to) */
function mlRigTry(k,rig){if(k==='hatchB'||k==='tractor'){const i=mlSuvIdx(k),e=specOf(i),c=buildChassis(i,null);return {i,hp:e.peak&&Math.round(e.peak.hp),tq:e.peak&&Math.round(e.peak.tq),mass:Math.round(c.mass),gears:e.gears,fd:e.fd};}
  const i=rigBuild('suv',Object.assign(presetRig(k),rig||{})),e=specOf(i),b=BUILDS[i],c=buildChassis(i,null);
  return {i,hp:e.peak&&Math.round(e.peak.hp),tq:e.peak&&Math.round(e.peak.tq),rpm:e.peak&&e.peak.rpm,red:e.redline,fd:e.fd,gears:e.gears,mass:Math.round(c.mass),lowK:c.diff&&c.diff.lowK,can:c.diff&&c.diff.can,nos:e.nosKw,rig:b.rig};}
window.__mlsv={ML_KINDS,MLSV,ML_TUNE,mlTuneOf,mlTuneHp,mlSuvSet,mlSuvIdx,mlSuvKind,mlIsStock,mlLow,mlMode,mlRigTry};
