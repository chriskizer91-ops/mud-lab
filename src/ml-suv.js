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
const MLSV={pick:(()=>{try{return localStorage.getItem('mudlab:suv')==='stock'?'stock':'crawler';}catch(e){return 'crawler';}})(),bi:{crawler:-1,stock:-1},btn:null,
  /* (Mud Lab 11) a tyre size up for each, his idea: the stock SUV on 33 in all-terrains with the 2 in leveling kit they
     need; the Rock & Mud on 40 in mud-terrains. Built by the engine's own garage (rigBuild), so the bigger tyre's
     radius, width, weight, tread and the taller gearing it gives are the engine's; the soil reads them as it reads
     any tyre. Picked on the title (tap your SUV's name again), each SUV's own, remembered */
  big:{crawler:false,stock:false},bib:{crawler:-1,stock:-1}};
for(const k of ['crawler','stock'])try{MLSV.big[k]=localStorage.getItem('mudlab:big:'+k)==='1';}catch(e){}
const ML_BIG={stock:{tires:'at33',ride:'lift2'},crawler:{tires:'mt40'}},ML_TYRE={stock:['29s','33s'],crawler:['37s','40s']};
const mlSuvKind=v=>v&&!v.rt&&v.build&&(v.build.kit||v.build.id)==='stock'?'stock':'crawler';
const mlIsStock=v=>!!(v&&!v.rt&&v.build&&(v.build.kit||v.build.id)==='stock');
const ML_SUV_NAME={crawler:'ROCK & MUD',stock:'STOCK SUV'},ML_SUV_SHORT={crawler:'ROCK & MUD',stock:'STOCK'};
/* (the builds: the Rock & Mud as the game made it at boot; his SUV as its garage preset) */
function mlSuvIdx(k){
  if(MLSV.big[k]){if(MLSV.bib[k]<0){try{MLSV.bib[k]=rigBuild('suv',Object.assign(presetRig(k),ML_BIG[k]));}catch(e){console.warn('big tyres',e);MLSV.big[k]=false;}}if(MLSV.bib[k]>=0)return MLSV.bib[k];}
  if(k==='crawler'){if(MLSV.bi.crawler<0){const c=GAME.car;MLSV.bi.crawler=c&&!c.rt&&(c.build.kit||c.build.id)==='crawler'?c.bi:BUILDS.findIndex(b=>b.id==='crawler');}return MLSV.bi.crawler;}
  if(MLSV.bi.stock<0){try{MLSV.bi.stock=rigBuild('suv',presetRig('stock'));}catch(e){MLSV.bi.stock=BUILDS.findIndex(b=>b.id==='stock');}}return MLSV.bi.stock;}
/* into the other SUV, where this one stands (or, before the drive, the one the bay shows) */
function mlSuvSet(k){
  mlSuvIdx('crawler');MLSV.pick=k;try{localStorage.setItem('mudlab:suv',k);}catch(e){}
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
  row.innerHTML='<button type="button" data-k="crawler">Rock &amp; Mud</button><button type="button" data-k="stock">Stock SUV</button>';
  const NM={crawler:'Rock & Mud',stock:'Stock SUV'},paint=()=>{for(const x of row.children){const k=x.dataset.k;if(!k)continue;x.classList.toggle('on',k===MLSV.pick);x.textContent=NM[k]+' \u00b7 '+ML_TYRE[k][MLSV.big[k]?1:0];}};
  row.addEventListener('click',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.k;if(!k)return;
    if(k===MLSV.pick){MLSV.big[k]=!MLSV.big[k];try{localStorage.setItem('mudlab:big:'+k,MLSV.big[k]?'1':'0');}catch(_){}}
    mlSuvSet(k);if(GAME.state!=='drive'&&GAME.car&&GAME.car.bi!==mlSuvIdx(k))spawnCar(mlSuvIdx(k));paint();});
  paint();const go=root.querySelector('#mlGo');go.parentNode.insertBefore(row,go);
  const st=document.createElement('style');st.textContent=`#mlTitle .mlT{max-width:800px}#mlPick{margin:0 0 10px}#mlPick button{background:rgba(20,14,9,.45);color:#f2e6d2;padding:9px 13px;font-size:13px!important;letter-spacing:.1em!important;border:1px solid rgba(242,230,210,.3)!important;margin:4px}
#mlPick button.on{background:#f2e6d2;color:#1d140a;border-color:#f2e6d2!important}`;document.head.appendChild(st);}
/* (at Start, the one picked: the game makes the Rock & Mud at boot) */
function mlSuvStart(){if(MLSV.pick==='stock'&&mlSuvKind(GAME.car)!=='stock')mlSuvSet('stock');
  /* (the size picked: the game makes the standard one) */
  {const i=mlSuvIdx(MLSV.pick);if(GAME.car&&!GAME.car.rt&&i>=0&&GAME.car.bi!==i)spawnCar(i);}}
window.__mlsv={MLSV,mlSuvSet,mlSuvIdx,mlIsStock,mlLow,mlMode};
