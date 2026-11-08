/* =====================================================================================
   FLYING (the Redtail's own forces on the game's body). The wing: 18.5 m2 (a big STOL wing), 10.6 m span, lift from the angle the air
   meets it (stalls past about 18 degrees: the lift falls away, the nose drops and a wing wobbles), drag, the flaps
   (20 or 40 degrees: more lift, a lower stall, more drag). The prop: a 260 hp engine through a fixed-pitch prop, its
   push the most standing still (4,300 N) and its power's worth at speed; the air it throws back over the tail makes
   the elevator and rudder work on the take-off run (the tail comes up at about 30 mph with the stick forward).
   The tail and fin keep it pointing into the air (pitch and weathervane stability, damping in roll, pitch and yaw,
   a little dihedral); the stick works the elevators and ailerons, and the rudder follows the ailerons in the air
   (a coordinated turn) and the stick on the ground (with the tailwheel). Trimmed, hands off, it flies at about
   75 mph. Everything else (the wheels, the ground, the hull, gravity) is the game's own physics, as for the taxi.
   ===================================================================================== */
const RTF={S:18.5,b:10.6,c:1.75,inc:.026,a0:-.044,CLa:4.9,CLmax:1.75,CD0:.056,k:.065,P:194e3,eta:.76,T0:4300,disc:4.15,
  Cm0:.05,Cma:-.9,Cmq:-9,Cme:.25,Clb:-.07,Clp:-.45,Clr:.1,Cla:.085,Cnb:.075,Cnr:-.11,Cnrud:.05,Cna:-.008,CYb:-.55,CYr:.12,
  flapDeg:[0,20,40],flap:0,flapA:0,ctl:{e:0,a:0,r:0},alpha:0,beta:0,V:0,stall:0,warn:0,T:0,alt:0,vs:0,time:0,_m:F3()};
function rtStep(dt,inp){
  const t=this,E=RT.eng,F=RTF,pt=t.pt,M=t.M,v=t.v,w=t.w,st0=pt.st,run=st0==='run';F.time+=dt;
  const lev=run?clamp(inp.thr||0,0,1):0,brk=inp.lock?1:clamp(inp.brk||0,0,1),rollIn=clamp(inp.steer||0,-1,1),pitchIn=clamp(inp.elev||0,-1,1);
  if(inp.flap!=null)F.flap=clamp(inp.flap|0,0,2);
  /* the throttle (with the engine's lag) and the rpm: a fixed-pitch prop turns faster as the air speeds up */
  E.thr+=(lev-E.thr)*Math.min(1,dt*2.5);
  const c0=Math.cos(RT.th0),s0=Math.sin(RT.th0);
  /* the air over the airframe in its own axes (x along the thrust line, y up, z right): the body's, turned 6.4 degrees */
  const bx=M[0]*v[0]+M[3]*v[1]+M[6]*v[2],by=M[1]*v[0]+M[4]*v[1]+M[7]*v[2],bz=M[2]*v[0]+M[5]*v[1]+M[8]*v[2];
  const ux=c0*bx+s0*by,uy=-s0*bx+c0*by,uz=bz,V=Math.hypot(ux,uy,uz),qd=.5*1.225*V*V;
  const wbx=M[0]*w[0]+M[3]*w[1]+M[6]*w[2],wby=M[1]*w[0]+M[4]*w[1]+M[7]*w[2],wbz=M[2]*w[0]+M[5]*w[1]+M[8]*w[2];
  const p=c0*wbx+s0*wby,yawL=-s0*wbx+c0*wby,q=wbz;            /* roll (right wing down), yaw (nose left), pitch (nose up) */
  if(run||st0==='stopping'){const rT=run?Math.min(E.max,E.idle+(E.full-E.idle)*E.thr+Math.max(0,ux)*5.5):0;E.rpm+=(rT-E.rpm)*Math.min(1,dt*(rT>E.rpm?3.2:2.2));
    if(st0==='stopping'&&E.rpm<E.idle*.35){pt.st='off';E.rpm=0;}}
  E.ang=(E.ang+E.rpm/60*TAU*dt)%TAU;
  const ua=Math.max(0,ux),T=run?E.thr*Math.min(F.T0,F.eta*F.P/Math.max(ua,6))+(1-E.thr)*(150-7*ua):-8*ua,Tq=Math.max(0,T)/F.disc;F.T=T;
  /* the controls: the surfaces move at their own pace; the rudder steers with the stick on the ground and follows the
     ailerons in the air, keeping the turn coordinated */
  const air=t.air&&t.airT>.25,kA=air?1:clamp((V-14)/8,0,1),be=V>1?Math.asin(clamp(uz/V,-1,1)):0;
  const rT2=clamp(lerp(rollIn,rollIn*.45+be*2.2,kA),-1,1),C=F.ctl,mv=(x,to,r)=>x+clamp(to-x,-r*dt,r*dt);
  /* (on the brakes, the stick comes back as a pilot's would, so it doesn't stand on its nose) */
  const eT=!air&&brk>.3?Math.max(pitchIn,V<8?.8*E.thr:.6*brk):pitchIn;
  C.e=mv(C.e,eT,4);C.a=mv(C.a,rollIn,4.5);C.r=mv(C.r,rT2,4);F.flapA=mv(F.flapA,F.flapDeg[F.flap]*PI/180,.35);
  let FX=T,FY=0,FZ=0,MX=0,MY=0,MZ=-.15*T;F.stall=0;F.warn=0;
  if(V>.5){
    const al=Math.atan2(-uy,ux),aw=al+F.inc,fa=F.flapA,dCL=fa*1.1,aS=F.CLmax/F.CLa+F.a0-fa*.06,aN=-.21;
    const CLs=F.CLa*(aS-F.a0)+dCL;let CL=F.CLa*(aw-F.a0)+dCL,sk=0;
    if(aw>aS){const d=aw-aS;sk=clamp(d/.08,0,1);CL=Math.max(1.15*Math.sin(2*aw),CLs-1.6*d);}
    else if(aw<aN){const d=aN-aw;CL=Math.min(1.15*Math.sin(2*aw),F.CLa*(aN-F.a0)+dCL+1.6*d);}
    const CD=F.CD0+fa*fa*.08+F.k*Math.min(CL*CL,4)+1.2*Math.pow(Math.sin(aw),2)*sstep(.15,.5,Math.abs(aw)),CY=F.CYb*be+F.CYr*C.r;
    F.alpha=aw;F.beta=be;F.stall=sk;F.warn=air&&V>8&&aw>aS-.035?1:0;
    /* the forces: lift square to the air (and the span), drag along it, the fin's side force, the push */
    const iv=1/V,lx=-uy,ly=ux,ll=Math.hypot(lx,ly)||1,QS=qd*F.S;
    FX+=QS*(CL*lx/ll-CD*ux*iv);FY+=QS*(CL*ly/ll-CD*uy*iv);FZ+=QS*(CY-CD*uz*iv);
    /* the moments: the tail's stability and damping, the controls (the elevator and rudder in the prop's blast too),
       the stall's nose drop and wobble */
    const Vh=Math.max(V,5),ph=p*F.b/(2*Vh),rh=-yawL*F.b/(2*Vh),qh=q*F.c/(2*Vh),wob=sk*(.045*Math.sin(F.time*1.9)+.6*be);
    const Cl=F.Clb*be+F.Clp*ph+F.Clr*rh+F.Cla*C.a+wob*.5,Cn=F.Cnb*be+F.Cnr*rh+F.Cna*C.a,Cm=F.Cm0+F.Cma*al+F.Cmq*qh-fa*.1-.2*sk;
    MX+=QS*F.b*Cl;MY-=QS*F.b*Cn+(qd+.35*Tq)*F.S*F.b*F.Cnrud*C.r;MZ+=QS*F.c*Cm+(qd+.25*Tq)*F.S*F.c*F.Cme*C.e;}
  else{F.alpha=0;F.beta=0;}
  /* into the world: the airframe's axes to the body's (6.4 degrees), then the body's to the world's */
  const tw=(x,y,z,o)=>{const ax=c0*x-s0*y,ay=s0*x+c0*y;o[0]=M[0]*ax+M[1]*ay+M[2]*z;o[1]=M[3]*ax+M[4]*ay+M[5]*z;o[2]=M[6]*ax+M[7]*ay+M[8]*z;return o;};
  const Fw=tw(FX,FY,FZ,[0,0,0]),k=dt/t.m;v[0]+=Fw[0]*k;v[1]+=Fw[1]*k;v[2]+=Fw[2]*k;
  const Mw=tw(MX,MY,MZ,F._m),dw=t.invI(F3(),M,Mw);w[0]+=dw[0]*dt;w[1]+=dw[1]*dt;w[2]+=dw[2]*dt;
  /* the ground: the game's own physics, the tailwheel steered with the stick (against the turn: it swings the tail
     out), a touch of throttle so the physics' automatic hold and reverse stay out of it */
  const r=RT_VSTEP.call(t,dt,{steer:-rollIn,thr:.06,brk,hb:inp.hb||0,nos:false,park:true});
  if(st0==='run'||st0==='stopping'){pt.rpm=E.rpm;pt.we=E.rpm*TAU/60;}else E.rpm=pt.rpm;
  pt.thr=E.thr;pt.thrSnd=E.thr;pt.load=E.thr;pt.gear=1;t.thrIn=E.thr;pt._out();
  F.V=V;F.vs=v[1];F.alt=t.p[1]-RT.hcg-RANCH.W.heightAt(t.p[0],t.p[2]);
  return r;
}
/* ---------- the pilot's hands: the stick (or the phone's tilt), the throttle lever, the flaps ---------- */
const RTI={lev:0,pitch:0,stick:{x:0,y:0},tilt:false,t0:null,tr:0,tp:0,tiltOK:false,fPrev:false,ui:false,hudTxt:''};
const RT_PI=pollInput;
pollInput=function(dt){const o=RT_PI(dt),t=GAME.car;if(!(t&&t.rt))return o;
  const D=INPUT.down,k=c=>D.has(c);
  /* the throttle is a lever that stays where it's put: W and S move it, 1 to 9 set it (0 is full), on a phone the
     thumb on THROTTLE sets it; a gamepad's trigger is the throttle as it is */
  if(k('KeyW'))RTI.lev=Math.min(1,RTI.lev+dt*.7);if(k('KeyS'))RTI.lev=Math.max(0,RTI.lev-dt*.9);
  for(let d=0;d<=9;d++)if(k('Digit'+d)||k('Numpad'+d))RTI.lev=d===0?1:d/10;
  if(TOUCH.on&&TOUCH.thr>0)RTI.lev=clamp((TOUCH.thr-.12)/.88,0,1);
  let thr=RTI.lev,roll=o.steer,brk=Math.max(TOUCH.brk||0,k('Space')?1:0,k('KeyS')&&RTI.lev<.01&&!t.air?1:0);
  /* the stick: the arrow keys (up is the nose down, as on a stick), the phone's stick or tilt, a gamepad's left stick */
  const kp=(k('ArrowDown')?1:0)-(k('ArrowUp')?1:0);RTI.pitch+=clamp(kp-RTI.pitch,-3*dt,3*dt);let pitch=RTI.pitch;
  if(INPUT.usingPad){const ps=navigator.getGamepads?navigator.getGamepads():[];for(const g of ps)if(g&&g.connected){const y=g.axes[1]||0;pitch=Math.abs(y)<.08?0:(y-Math.sign(y)*.08)/.92;break;}thr=o.thr;brk=Math.max(brk,o.brk);}
  if(TOUCH.on){if(RTI.tilt&&RTI.tiltOK){roll=RTI.tr;pitch=RTI.tp;}else if(!RTI.tilt&&(RTI.stick.x||RTI.stick.y)){roll=RTI.stick.x;pitch=RTI.stick.y;}}
  /* the flaps: FLAPS on a phone (where LOW was), L on a keyboard: up, 20, 40, up */
  if(o.low){RTF.flap=(RTF.flap+1)%3;say('FLAPS '+RTF.flapDeg[RTF.flap]+'°',1.2);setTimeout(syncTouch,0);}o.low=false;
  /* the paint job: PAINT on a phone, U on a keyboard */
  const pk=k('KeyU');if(pk&&!RTI.fPrev)rtPaint(RT.paint+1);RTI.fPrev=pk;
  /* (elev, not pitch: the game's pitch is its engine-pitch key) */
  o.thr=thr;o.steer=roll;o.elev=pitch;o.brk=brk;return o;};
/* the phone's controls in the plane: the stick in place of the steering slider, TILT in place of the horn, FLAPS in
   place of LOW, the gas pedal a throttle lever that shows where it's set; the height and climb at the top */
function rtUI(){
  if(RTI.ui)return;RTI.ui=true;
  const st=document.createElement('style');st.textContent=
   '#rtStick{pointer-events:auto;position:fixed;left:calc(env(safe-area-inset-left) + 92px);bottom:calc(env(safe-area-inset-bottom) + 20px);width:150px;height:150px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(16,20,26,.28);touch-action:none;z-index:5}'+
   '#rtStick b{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;background:rgba(255,255,255,.6);box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none}'+
   '#rtStick span{position:absolute;bottom:-17px;left:0;right:0;text-align:center;font:700 10px system-ui,sans-serif;letter-spacing:.14em;color:rgba(255,255,255,.55);pointer-events:none}'+
   '#rtHud{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 34px);transform:translateX(-50%);font:700 12px system-ui,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7);pointer-events:none;z-index:5;white-space:nowrap}'+
   '#rtHud em{font-style:normal;color:#ff4a3d;margin-left:10px;font-size:14px}body.touch #rtHud{top:calc(env(safe-area-inset-top) + 102px)}';
  document.head.appendChild(st);
  const T=$('touch'),sk=document.createElement('div');sk.id='rtStick';sk.hidden=true;sk.innerHTML='<b></b><span>STICK</span>';T.appendChild(sk);
  const knob=sk.querySelector('b');let pid=null;
  const at=e=>{const r=sk.getBoundingClientRect(),R=r.width*.4;let x=(e.clientX-(r.left+r.width/2))/R,y=(e.clientY-(r.top+r.height/2))/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
    knob.style.transform=`translate(${(x*R).toFixed(1)}px,${(y*R).toFixed(1)}px)`;const ex=v=>{const a=Math.abs(v);return a<.05?0:Math.sign(v)*Math.pow((a-.05)/.95,1.25);};RTI.stick.x=ex(x);RTI.stick.y=ex(y);};
  sk.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{sk.setPointerCapture(pid);}catch(_){}at(e);});
  sk.addEventListener('pointermove',e=>{if(e.pointerId===pid)at(e);});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;RTI.stick.x=RTI.stick.y=0;knob.style.transform='';};
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])sk.addEventListener(ev,up);sk.addEventListener('contextmenu',e=>e.preventDefault());
  TOUCH.lets.push(()=>{pid=null;RTI.stick.x=RTI.stick.y=0;knob.style.transform='';});
  const tb=document.createElement('button');tb.className='tb';tb.id='rtTilt';tb.type='button';tb.textContent='TILT';tb.hidden=true;
  document.querySelector('#touch .tside.L').appendChild(tb);
  const pb=document.createElement('button');pb.className='tb';pb.id='rtPaintB';pb.type='button';pb.textContent='PAINT';pb.hidden=true;
  document.querySelector('#touch .tside.L').appendChild(pb);
  pb.addEventListener('pointerdown',e=>{e.preventDefault();buzz(8);rtPaint(RT.paint+1);});pb.addEventListener('contextmenu',e=>e.preventDefault());
  tb.addEventListener('pointerdown',async e=>{e.preventDefault();RTI.tilt=!RTI.tilt;RTI.t0=null;RTI.tiltOK=false;buzz(8);
    if(RTI.tilt){try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function')await DeviceOrientationEvent.requestPermission();}catch(_){}
      say('TILT: HOLD THE PHONE AS YOU LIKE, THAT IS LEVEL',2.4);
      setTimeout(()=>{if(RTI.tilt&&!RTI.tiltOK){RTI.tilt=false;say('THIS VIEW GIVES NO TILT: BACK ON THE STICK',3);syncTouch();}},2000);}
    syncTouch();});
  tb.addEventListener('contextmenu',e=>e.preventDefault());
  /* tilt: rolling the phone banks, tipping its top edge away puts the nose down (as pushing a stick does), each
     measured from how the phone was held when TILT was tapped */
  addEventListener('deviceorientation',e=>{if(!RTI.tilt||e.beta==null)return;RTI.tiltOK=true;
    const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0,land=ang===90||ang===270||ang===-90;
    const r=land?(ang===90?e.beta:-e.beta):e.gamma,pc=land?Math.abs(e.gamma||0):e.beta;
    if(RTI.t0===null)RTI.t0=[r,pc];const dz=(d,z)=>Math.abs(d)<z?0:d-Math.sign(d)*z;
    RTI.tr=clamp(dz(r-RTI.t0[0],2)/23,-1,1);RTI.tp=clamp(dz(pc-RTI.t0[1],2)/18,-1,1);});
  const hud=document.createElement('div');hud.id='rtHud';hud.hidden=true;document.body.appendChild(hud);
}
const RT_ST=syncTouch;
syncTouch=function(){RT_ST();rtUI();const t=GAME.car,p=!!(t&&t.rt);
  const horn=document.querySelector('#touch .tb[data-k="horn"]');if(horn)horn.hidden=p;
  $('rtTilt').hidden=!p;$('rtPaintB').hidden=!p;$('rtTilt').classList.toggle('lit',RTI.tilt);$('rtStick').hidden=!p||RTI.tilt;$('steerZone').style.display=p?'none':'';
  const lo=$('tLow');if(p){lo.hidden=false;lo.textContent='FLAPS '+RTF.flapDeg[RTF.flap]+'°';lo.classList.toggle('lit',RTF.flap>0);}else lo.textContent='LOW';
  const g=$('tGas').querySelector('span');if(g)g.textContent=p?'THROTTLE':'GAS';};
/* once a frame: the throttle lever's fill, the height and climb, STALL; the prop's sound */
function rtFrame(){
  const t=GAME.car,p=!!(t&&t.rt)&&GAME.state==='drive',h=$('rtHud');if(!RTI.ui)rtUI();
  if(p&&TOUCH.on&&!(TOUCH.thr>0)){const i=$('tGas').querySelector('i');const s=(RTI.lev*100).toFixed(0)+'%';if(i.style.height!==s)i.style.height=s;}
  let tx='';if(p&&(t.air||RTF.alt>2)){const ft=Math.round(RTF.alt*3.281/10)*10,fpm=Math.round(RTF.vs*196.85/50)*50;
    tx=`ALT ${ft} FT · ${fpm>=0?'▲':'▼'} ${Math.abs(fpm)} FT/MIN`+(RTF.warn?'<em>STALL</em>':'');}
  if(tx!==RTI.hudTxt){RTI.hudTxt=tx;h.innerHTML=tx;h.hidden=!tx;}
  if(p&&RTF.warn&&RTF.stall>.3)buzz(30);
  rtSound(p&&t.pt.running);
}
/* the prop's own sound on the engine's bus: the blades' beat (two blades: twice the rpm), a thrum an octave below,
   the wash of the air through them, and the stall horn */
const RTS={ok:false};
function rtSound(on){
  const A=ENG.audio;if(!A)return;const c=A.ctx;
  if(!RTS.ok){RTS.ok=true;
    const o=c.createOscillator();o.type='sawtooth';const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=.9;const g=c.createGain();g.gain.value=0;o.connect(lp);lp.connect(g);
    const o2=c.createOscillator();o2.type='triangle';const g2=c.createGain();g2.gain.value=0;o2.connect(g2);
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const ns=c.createBufferSource();ns.buffer=nb;ns.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=.6;const gn=c.createGain();gn.gain.value=0;ns.connect(bp);bp.connect(gn);
    const hz=c.createOscillator();hz.type='square';hz.frequency.value=440;const hl=c.createBiquadFilter();hl.type='lowpass';hl.frequency.value=1800;const gh=c.createGain();gh.gain.value=0;hz.connect(hl);hl.connect(gh);
    for(const n of [g,g2,gn])n.connect(A.eng);gh.connect(A.master);o.start();o2.start();ns.start();hz.start();Object.assign(RTS,{o,lp,g,o2,g2,bp,gn,gh});}
  if(c.state!=='running')return;
  /* (each value glides to its new aim; the one before is let go, so nothing piles up) */
  const sp=(pr,x,t0,tc)=>{pr.cancelScheduledValues(t0);pr.setTargetAtTime(x,t0,tc);};
  const T=c.currentTime,E=RT.eng,ok=x=>Number.isFinite(x)?x:0,rpm=on?ok(E.rpm):0,f=Math.max(20,rpm/30),ld=clamp(ok(E.thr),0,1),V=clamp(ok(RTF.V),0,90),k=on&&rpm>200?1:0,vol=RTS.vol??1;
  sp(RTS.o.frequency,f,T,.04);sp(RTS.o2.frequency,f/2,T,.04);sp(RTS.lp.frequency,clamp(450+ld*1500+V*12,60,6000),T,.2);
  sp(RTS.g.gain,vol*k*(.04+.12*ld),T,.06);sp(RTS.g2.gain,vol*k*(.05+.09*ld),T,.06);
  sp(RTS.bp.frequency,clamp(650+rpm*.25+V*10,100,6000),T,.25);sp(RTS.gn.gain,vol*(k*(.012+.045*ld)+Math.min(.07,V*V*.000018)),T,.08);
  sp(RTS.gh.gain,on&&RTF.warn?.045:0,T,.02);
}
const RT_SU=soundUpdate;
soundUpdate=function(c,dt){if(RT.clip)return;RT_SU(c,dt);rtFrame();};
/* no jump cam for the plane (it would cut to a side view for the whole flight), and no car feats (air time!) */
const RT_CA=camAuto;
camAuto=function(t,dt){if(!(t&&t.rt))return RT_CA(t,dt);const j=CAMSET.jump;CAMSET.jump=false;try{return RT_CA(t,dt);}finally{CAMSET.jump=j;}};
{const fs=Feats.step;Feats.step=function(dt,t){if(t&&t.rt)return;return fs.apply(this,arguments);};}
