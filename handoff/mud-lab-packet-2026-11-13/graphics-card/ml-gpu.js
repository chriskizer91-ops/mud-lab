/* ---------- THE GRAPHICS CARD: WHICH ONE IT IS, AND WHAT HAPPENS WHEN IT CAN'T KEEP UP (from the combined-game
   trial, Ground Truth Continued build 2, 11 Nov 2026; re-pointed at Mud Lab's title, #mlTitle).
   Why: on his laptop one page was found running on the built-in Intel graphics (the Claude app's own browser pane;
   his Edge is on the RTX 5060), and there a heavy level made Windows reset the card: a torn picture, everything
   frozen, the page starting again, with a line that spoke of "the phone". Nothing on the page said which card it was.
   1. the title's bottom left corner names the card the page is running on (the build's name is bottom right), and
      on a built-in Intel card says how to give Edge the other one;
   2. a level above Low that can't hold about three frames a second for a while steps down to Low by itself and
      says why (not on a phone, not in a test browser where every frame is that slow);
   3. when the card is reset anyway, the engine's line says so in a laptop's words (mlGpuLost, one swap in the
      patch), and the next title says what happened.
   Uses the engine's own: gl, GFX, GAME, store, touchy, $, setGfx. Put it with the other ml-*.js files. ---------- */
const MLGPU={ft:16,last:0,slow:0,gpu:null};
function mlGpuName(){if(MLGPU.gpu!==null)return MLGPU.gpu;let s='';
  try{const g=(typeof gl!=='undefined'&&gl)||(window.__game&&window.__game.gl);if(!g)return '';const e=g.getExtension('WEBGL_debug_renderer_info');s=e?String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';}catch(_){}
  /* "ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Laptop GPU (0x00002D19) Direct3D11 vs_5_0 ps_5_0, D3D11)": the card's own name */
  const a=/^ANGLE \((.*)\)$/.exec(s);if(a){const p=a[1].split(',');s=(p[1]||p[0]).trim();}
  MLGPU.gpu=s.replace(/\s*\(0x[0-9A-Fa-f]+\)/,'').replace(/\s+(Direct3D|OpenGL|Vulkan|Metal).*$/,'').trim();return MLGPU.gpu;}
const mlGpuBuiltIn=()=>{const n=mlGpuName();return /intel/i.test(n)&&!/\barc\b/i.test(n);};
/* how long frames are taking (a running figure, in ms), and the step down */
(function mlGpuPace(now){if(MLGPU.last)MLGPU.ft+=(Math.min(2000,now-MLGPU.last)-MLGPU.ft)*.2;MLGPU.last=now;
  try{const L=$('loading'),up=(!L||L.hidden)&&(GAME.state==='menu'||GAME.state==='drive');
    if(up&&!touchy&&!navigator.webdriver&&GFX.level!=='low'&&GFX.level!=='mobile'&&MLGPU.ft>300){
      if(++MLGPU.slow>8){MLGPU.slow=-1e9;store.set('ml-gpu-lost',String(GFX.level).toUpperCase()+'|slow');if(L){L.hidden=false;L.textContent='This graphics card can’t keep up on '+String(GFX.level).toUpperCase()+'. Going back to the Low graphics level…';}setTimeout(()=>setGfx('low'),1800);}}
    else if(MLGPU.slow>0)MLGPU.slow--;}catch(_){}
  requestAnimationFrame(mlGpuPace);})(0);
/* the card was reset under the page (the engine's own handler shows this line, then starts the page again) */
function mlGpuLost(){try{store.set('ml-gpu-lost',String(GFX.level).toUpperCase()+'|'+(GAME.state==='drive'?'out driving':'at the title'));}catch(_){}
  return touchy?'The phone restarted its graphics. Starting again…':'The graphics card stopped answering and Windows reset it. Starting again…';}
/* the title's corner */
{const st=document.createElement('style');st.textContent='#mlGpu{position:absolute;left:14px;bottom:10px;max-width:54ch;text-align:left;font:12px/1.4 system-ui,sans-serif;letter-spacing:.03em;opacity:.8}#mlGpu b{display:block;font-weight:600}#mlGpu span{display:block;color:#ffdca8}#mlGpu u{display:block;text-decoration:none;color:#ffb38a}';document.head.appendChild(st);
 setInterval(()=>{const T=document.getElementById('mlTitle');if(!T||T.querySelector('#mlGpu'))return;const n=mlGpuName();if(!n)return;
   const d=document.createElement('div');d.id='mlGpu';const add=(tag,t)=>{const e=document.createElement(tag);e.textContent=t;d.appendChild(e);};
   add('b','Graphics card: '+n);
   if(mlGpuBuiltIn()&&!touchy)add('span','This is the laptop’s built-in graphics. If it has an NVIDIA card, the browser isn’t using it: Windows Settings › System › Display › Graphics › Microsoft Edge › Options › High performance, then close Edge and open it again.');
   let lost='';try{lost=store.get('ml-gpu-lost','')||'';if(lost)store.set('ml-gpu-lost','');}catch(_){}
   if(lost){const p=String(lost).split('|');add('u',p[1]==='slow'?'Last time this card couldn’t keep up on '+p[0]+', so the game went back to Low.':'Last time the graphics card was reset on '+p[0]+(p[1]?' '+p[1]:'')+'.');}
   T.appendChild(d);},400);}
