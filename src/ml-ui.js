/* =====================================================================================
   MUD LAB: ITS FRONT DOOR. The page starts on its own title over the bay: START drives out onto the field; BAY is
   the engine's bay with the Rock & Mud. The engine's garage of other cars, its races, challenges, career and traffic
   stay out of the menus. The build's name in the corner, so you can tell which one you opened. On the phone's
   driving screen: no N2O, O/D OFF, REAR or HORN buttons (his rule: every button has to earn its place).
   ===================================================================================== */
const ML_BUILD='mud-lab-7';
function mlTitle(){
  const st=document.createElement('style');st.textContent=`
#tNos,#tOD,#touch [data-k=horn],#shBack,#mTabs [data-t=chals],#mTabs [data-t=races],#mTabs [data-t=garage],#mTabs [data-t=cool],
#menu section:has(#mCars),#menu section:has(#mModes),#menu section:has(#mPresets),#menu section:has(#mTraffic),#menu section:has(#mSim){display:none!important}
#mlTitle{position:fixed;inset:0;z-index:9000;display:grid;justify-items:center;align-items:safe center;overflow-y:auto;color:#f2e6d2;font-family:Georgia,'Times New Roman',serif;
  background:radial-gradient(120% 70% at 50% 105%,#3b2715 0%,#2a1c10 45%,rgba(20,14,9,.0) 75%),linear-gradient(180deg,#8fa3b3 0%,#c9b28e 55%,#5a3d22 80%,#24170c 100%)}
#mlTitle .mlT{text-align:center;padding:16px 24px;max-width:680px}
#mlTitle small{letter-spacing:.32em;text-transform:uppercase;font-size:13px;opacity:.85;font-family:system-ui,sans-serif}
#mlTitle h1{font-size:min(10vw,16vh,96px);white-space:nowrap;font-weight:400;font-style:italic;margin:4px 0 2px;text-shadow:0 2px 18px rgba(0,0,0,.45)}
#mlTitle p{font-size:clamp(13px,2vw,17px);margin:0 0 12px;opacity:.92;text-shadow:0 1px 8px rgba(0,0,0,.5)}
#mlTitle button{font:600 18px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;border:0;border-radius:999px;cursor:pointer;margin:6px}
#mlGo{background:#c98f4a;color:#1d140a;padding:16px 54px;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#mlOut{background:rgba(20,14,9,.55);color:#f2e6d2;padding:12px 26px;font-size:14px!important;border:1px solid rgba(242,230,210,.35)!important}
#mlBtns{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;align-items:center}
@media (max-height:460px){#mlTitle .mlT{padding:8px 16px}#mlTitle p{display:none}#mlTitle h1{font-size:min(9vw,15vh,72px);margin:0 0 6px}#mlGo{padding:12px 44px}#mlOut{padding:10px 22px}}
@media (max-width:560px){#mlTitle h1{white-space:normal}#mlTitle p{margin-bottom:10px}}
#mlTitle i{position:absolute;right:0;bottom:0;padding:16px 12px 8px 28px;font:12px system-ui,sans-serif;opacity:.6;font-style:normal;cursor:pointer}`;
  document.head.appendChild(st);
  const h=document.querySelector('#menu .mhead h1');if(h)h.innerHTML='Mud Lab <small class="tagw">'+ML_BUILD+'</small>';
  document.title='Mud Lab';
  const d=document.createElement('div');d.id='mlTitle';
  d.innerHTML='<div class="mlT"><small>Two SUVs and a bush plane</small><h1>Mud Lab</h1><p>Five thousand feet of soil, wet and dry. Three mud trails: easy, medium, hard. A winch, a strap, and the Heron on its strip.</p>'+
    '<div id="mlBtns"><button id="mlGo" type="button">Start</button><button id="mlOut" type="button">Bay</button></div></div><i>'+ML_BUILD+'</i>';
  /* (the game holds behind the title: nothing drawn under it (Mud Lab 6), so the soil's preparation gets the time) */
  document.body.appendChild(d);mlSuvTitle(d);mlrTitle(d);GAME.hold=true;
  d.querySelector('#mlGo').addEventListener('click',()=>{d.remove();GAME.hold=false;mlSuvStart();const b=$('sasDrive');if(b)b.click();mlSoilNote();});
  d.querySelector('#mlOut').addEventListener('click',()=>{d.remove();GAME.hold=false;mlSuvStart();});
  /* (Mud Lab 8) the numbers on the phone, with no button of their own: a tap on the build's name in the corner switches the
     engine's performance readout on or off (frames a second, the frame's time, the graphics chip's time, the picture's
     size, triangles: on a keyboard it's F). It's remembered, as F is; the page's address ending #numbers switches it on too */
  const lab=d.querySelector('i'),num=()=>{lab.textContent=ML_BUILD+(DEVW.hud==='off'?'':' \u00b7 numbers on');};
  if(/numbers/.test(location.hash)&&DEVW.hud==='off'){DEVW.hud='perf';saveDev();}
  lab.addEventListener('click',e=>{e.stopPropagation();DEVW.hud=DEVW.hud==='off'?'perf':'off';saveDev();num();});num();}
window.__mlui={mlTitle,ML_BUILD};
