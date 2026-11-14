/* ---------------------------------------------------------------------------------------------------------------------
   (Mud Lab 16) the keyboard's keys: one table, and a list in the map's MENU to change them.

   The engine keeps its keys in KEYS (thr, brk, cam, rear ...: each a list of key codes) and asks keyOn/keyHit of that
   table. Mud Lab's own keys were written straight into its listeners, and one of them clashed: G was both the engine's
   look-behind (held) and Mud Lab's switch between game grip and soil science, so looking behind changed the grip.
   Now Mud Lab's four are in the same table (grip, hook, swap, rake), nothing shares a key, and MENU > KEYS on the open
   map lists every one: click a row, press the key you want. A key that was another row's is taken from it (and that
   row gets the key this one had, if it would be left with none). The choices are kept in the browser
   ('mudlab:keys'); RESET ALL KEYS puts back the keys below. The legend in the pause menu follows the table.
   --------------------------------------------------------------------------------------------------------------------- */
KEYS.grip=['Semicolon'];KEYS.hook=['KeyU'];KEYS.swap=['Enter','NumpadEnter'];KEYS.rake=['Backspace'];
const MLKB={
  /* (the rows of the list, in its order: the engine's or Mud Lab's name for it, what it says) */
  rows:[['thr','GAS'],['brk','BRAKE, REVERSE'],['left','STEER LEFT'],['right','STEER RIGHT'],['hb','HANDBRAKE'],['up','GEAR UP'],['down','GEAR DOWN'],
    ['low','LOW RANGE'],['lockers','LOCKERS'],['od','OVERDRIVE'],['rear','LOOK BEHIND (HELD)'],['cam','CAMERA'],['map','MAP'],['grip','GRIP (GAME / SOIL)'],
    ['hook','HOOK UP, UNHOOK'],['swap','GET IN, GET OUT'],['reset','RESET'],['lights','HEADLIGHTS'],['horn','HORN'],['ign','ENGINE ON, OFF'],['cruise','CRUISE'],
    ['stats','NUMBERS ON SCREEN'],['pitch','ENGINE PITCH'],['rake','CLEAR ALL RUTS'],['menu','PAUSE']],
  def:null,cap:null,note:'',seen:false,
  /* (what a key is called on the list) */
  nm:{ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Space:'SPACE',ShiftLeft:'L SHIFT',ShiftRight:'R SHIFT',Enter:'ENTER',NumpadEnter:'NUM ENTER',Backspace:'BACKSPACE',
    Escape:'ESC',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',BracketLeft:'[',BracketRight:']',Minus:'-',Equal:'=',Backquote:'`',Delete:'DEL',Insert:'INS',
    PageUp:'PG UP',PageDown:'PG DN',Home:'HOME',End:'END'}};
const mlkKey=c=>MLKB.nm[c]||(c.startsWith('Key')?c.slice(3):c.startsWith('Digit')?c.slice(5):c.startsWith('Numpad')?'NUM '+c.slice(6).toUpperCase():c.toUpperCase());
const mlkKeys=k=>(KEYS[k]||[]).map(mlkKey).join(' or ')||'NO KEY';
/* (the first key of a row, for a message that names it: "U: HOOK UP") */
const mlkName=k=>KEYS[k]&&KEYS[k].length?mlkKey(KEYS[k][0]):'';
const mlkIs=(k,e)=>!!KEYS[k]&&KEYS[k].includes(e.code);
const mlkLabel=k=>{const r=MLKB.rows.find(q=>q[0]===k);return r?r[1]:'';};
function mlkSave(){const o={};for(const k of Object.keys(MLKB.def))if(JSON.stringify(KEYS[k])!==JSON.stringify(MLKB.def[k]))o[k]=KEYS[k];
  try{if(Object.keys(o).length)localStorage.setItem('mudlab:keys',JSON.stringify(o));else localStorage.removeItem('mudlab:keys');}catch(_){}mlkLegend();}
function mlkLoad(){MLKB.def={};for(const k of Object.keys(KEYS))MLKB.def[k]=KEYS[k].slice();
  try{const o=JSON.parse(localStorage.getItem('mudlab:keys')||'{}');for(const k of Object.keys(o))if(KEYS[k]&&Array.isArray(o[k])&&o[k].every(c=>typeof c==='string'))KEYS[k]=o[k].slice(0,4);}catch(_){}}
function mlkReset(){for(const k of Object.keys(MLKB.def))KEYS[k]=MLKB.def[k].slice();MLKB.note='ALL KEYS AS THEY CAME';mlkSave();}
/* a row takes a key: any other row that had it loses it, and takes this row's old key if that leaves it with none */
function mlkSet(k,code){
  if(/^(Control|Alt|Meta|OS)|^(Tab|CapsLock|ContextMenu|NumLock|ScrollLock|PrintScreen|Pause)$/.test(code)){MLKB.note='THAT KEY CAN\'T BE USED';return false;}
  if(/^(Digit|Numpad)[1-9]$/.test(code)){MLKB.note='1 TO 9 ARE PART GAS';return false;}
  const old=KEYS[k].slice();let took='';
  for(const o of Object.keys(KEYS)){if(o===k||!KEYS[o].includes(code))continue;KEYS[o]=KEYS[o].filter(c=>c!==code);
    if(!KEYS[o].length){const give=old.find(c=>c!==code&&!Object.keys(KEYS).some(q=>q!==k&&KEYS[q].includes(c)));if(give)KEYS[o]=[give];}
    if(mlkLabel(o))took=mlkLabel(o)+' IS NOW '+mlkKeys(o);}
  KEYS[k]=[code];MLKB.note=mlkLabel(k)+' IS '+mlkKey(code)+(took?'. '+took:'');mlkSave();return true;}
/* while a row waits for its key, that key press is the list's alone: the game doesn't see it */
addEventListener('keydown',e=>{if(e.isTrusted!==false)MLKB.seen=true;if(!MLKB.cap)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  const k=MLKB.cap;MLKB.cap=null;if(e.code==='Escape'){MLKB.note=mlkLabel(k)+' LEFT AS IT WAS';return;}mlkSet(k,e.code);},true);
/* the legend in the pause menu, from the table */
function mlkLegend(){const p=document.querySelector('p.keys');if(!p)return;const kb=k=>(KEYS[k]||[]).map(c=>'<kbd>'+mlkKey(c).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</kbd>').join(' ')||'<kbd>none</kbd>';
  p.innerHTML=MLKB.rows.map(r=>kb(r[0])+' '+r[1].toLowerCase()).join(' · ')+' · <kbd>1</kbd>–<kbd>9</kbd> part gas<br>To change a key: open the map, MENU, KEYS.';}
mlkLoad();mlkLegend();
window.__mlk={MLKB,mlkSet,mlkReset,mlkKeys,KEYS};
