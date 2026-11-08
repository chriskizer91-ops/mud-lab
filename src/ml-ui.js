/* =====================================================================================
   MUD LAB: ITS FRONT DOOR. The page starts on its own title over the bay: START drives out onto the field; BAY is
   the engine's bay with the Rock & Mud. The engine's garage of other cars, its races, challenges, career and traffic
   stay out of the menus. The build's name in the corner, so you can tell which one you opened. On the phone's
   driving screen: no N2O, O/D OFF, REAR or HORN buttons (his rule: every button has to earn its place).
   ===================================================================================== */
const ML_BUILD='mud-lab-6';
function mlTitle(){
  const st=document.createElement('style');st.textContent=`
#tNos,#tOD,#tRear,#touch [data-k=horn],#shBack,#mTabs [data-t=chals],#mTabs [data-t=races],#mTabs [data-t=garage],#mTabs [data-t=cool],
#menu section:has(#mCars),#menu section:has(#mModes),#menu section:has(#mPresets),#menu section:has(#mTraffic),#menu section:has(#mSim){display:none!important}
#mlTitle{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;color:#f2e6d2;font-family:Georgia,'Times New Roman',serif;
  background:radial-gradient(120% 70% at 50% 105%,#3b2715 0%,#2a1c10 45%,rgba(20,14,9,.0) 75%),linear-gradient(180deg,#8fa3b3 0%,#c9b28e 55%,#5a3d22 80%,#24170c 100%)}
#mlTitle .mlT{text-align:center;padding:16px 24px;max-width:680px}
#mlTitle small{letter-spacing:.32em;text-transform:uppercase;font-size:13px;opacity:.85;font-family:system-ui,sans-serif}
#mlTitle h1{font-size:min(10vw,16vh,96px);white-space:nowrap;font-weight:400;font-style:italic;margin:4px 0 2px;text-shadow:0 2px 18px rgba(0,0,0,.45)}
#mlTitle p{font-size:clamp(14px,2.2vw,18px);margin:0 0 22px;opacity:.92;text-shadow:0 1px 8px rgba(0,0,0,.5)}
#mlTitle button{font:600 18px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;border:0;border-radius:999px;cursor:pointer;margin:6px}
#mlGo{background:#c98f4a;color:#1d140a;padding:16px 54px;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#mlOut{background:rgba(20,14,9,.55);color:#f2e6d2;padding:12px 26px;font-size:14px!important;border:1px solid rgba(242,230,210,.35)!important}
#mlTitle i{position:absolute;right:12px;bottom:8px;font:12px system-ui,sans-serif;opacity:.6}`;
  document.head.appendChild(st);
  const h=document.querySelector('#menu .mhead h1');if(h)h.innerHTML='Mud Lab <small class="tagw">'+ML_BUILD+'</small>';
  document.title='Mud Lab';
  const d=document.createElement('div');d.id='mlTitle';
  d.innerHTML='<div class="mlT"><small>Two SUVs and a bush plane</small><h1>Mud Lab</h1><p>Five thousand feet of soil, wet and dry: creek bottoms, a clay pan, a quarry, mud trails through the woods. And the Heron, waiting on its strip.</p>'+
    '<button id="mlGo" type="button">Start</button><br><button id="mlOut" type="button">Bay</button></div><i>'+ML_BUILD+'</i>';
  /* (the game holds behind the title: nothing drawn under it (Mud Lab 6), so the soil's preparation gets the time) */
  document.body.appendChild(d);mlSuvTitle(d);GAME.hold=true;
  d.querySelector('#mlGo').addEventListener('click',()=>{d.remove();GAME.hold=false;mlSuvStart();const b=$('sasDrive');if(b)b.click();mlSoilNote();});
  d.querySelector('#mlOut').addEventListener('click',()=>{d.remove();GAME.hold=false;mlSuvStart();});}
window.__mlui={mlTitle,ML_BUILD};
