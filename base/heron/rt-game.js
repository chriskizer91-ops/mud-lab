/* =====================================================================================
   THE REDTAIL (redtail-2, the bush plane baked in Blender) IN THE GAME. Picked in the bay (✈ Redtail beside
   Drive ▶), it goes out where the car was. It is a Vehicle of the game's own physics with the plane's own
   numbers: its two tundra tyres in front (2.5 m apart, 0.92 m tall) and its tailwheel 5.3 m behind them, 750 kg,
   88% of it on the mains, sitting 6.4 degrees nose up as it does on its wheels. The game's tyres, surfaces (the
   ice's grip and all), suspension, collisions, cameras, HUD and sound carry on as for a car; what's the plane's
   own: the propeller pushes (no wheel is driven, so it pulls on ice as well as on the road), the tailwheel steers
   (and the rudder with it), the brakes are on the mains; and it flies (rt-fly: the wings, the tail, the stick).
   The model: redtail-2.glb's pieces (RT2_DATA), drawn in the game's own lit shader with its three baked pictures
   (material 120: colour with its crevices, surface detail as a normal map, roughness and metal), each moving piece
   on its hinge: the prop turning with the engine, the wheels rolling, the tailwheel and rudder steering.
   ===================================================================================== */
const RT={want:false,v:null,mesh:null,tex:null,texN:0,prev:{},ro0:0,ro2:0,
  /* the plane's geometry (model coordinates: x forward, y up, z right, 0 on the thrust line) */
  mainC:[.98,-1.79],tailC:[-4.30,-1.20],cgM:[.50,-.25,0],
  /* the engine: idle rpm, full throttle standing still, the most it turns (faster as the air speeds the prop up);
     thr: the throttle as the engine has caught up with it */
  eng:{idle:750,full:2450,max:2800,rpm:0,ang:0,thr:0},
  D:null,build:null};
RT.th0=Math.atan2(RT.tailC[1]-RT.mainC[1],RT.mainC[0]-RT.tailC[0]);
/* model -> the physics body (level when it sits on its three wheels, its origin at the centre of gravity) */
RT.toB=p=>{const c=Math.cos(RT.th0),s=Math.sin(RT.th0),x=p[0]-RT.cgM[0],y=p[1]-RT.cgM[1];return [c*x-s*y,s*x+c*y,(p[2]||0)-RT.cgM[2]];};
{const m=RT.toB(RT.mainC),t=RT.toB(RT.tailC);RT.a=m[0];RT.b=-t[0];RT.hcg=-(m[1]+t[1])/2;}
RT.B2M=M4.mul(M4RZ(RT.th0),M4T(-RT.cgM[0],-RT.cgM[1],-RT.cgM[2]));
/* the points that hit the ground and the walls: the prop's disc, the spinner and cowl, the belly, the tail, the fin,
   the stabiliser's and the wings' tips, the top of the wing */
RT.hullM=[[2.17,-1.15,0],[2.17,-.81,.81],[2.17,-.81,-.81],[2.17,0,1.15],[2.17,0,-1.15],[2.45,0,0],[1.9,-.55,0],[.9,-.62,0],[-.5,-.62,0],[-2.5,-.42,0],
  [-4.5,-.3,0],[-4.4,1.45,0],[-4.7,-.25,0],[-4.0,-.05,1.65],[-4.0,-.05,-1.65],[.45,1.0,5.3],[.45,1.0,-5.3],[-1.2,.95,5.3],[-1.2,.95,-5.3],
  [-.4,.85,5.35],[-.4,.85,-5.35],[0,1.18,0]];
/* the game's car-maker, with the plane in place of the car while RT.want is on */
const RT_makeCar=makeCar;
makeCar=function(i,world,sim,plus,gear){return RT.want?rtVehicle(i,world):RT_makeCar(i,world,sim,plus,gear);};
function rtVehicle(i,world){
  const hb=BUILDS[i],c0=buildChassis(i,null),m=750,c=Object.assign({},c0);
  Object.assign(c,{name:'redtail',mass:m,wb:RT.a+RT.b,wf:RT.b/(RT.a+RT.b),hcg:RT.hcg,trackF:2.5,trackR:.16,R:.46,Rr:.14,Iw:1.3,IwR:.04,
    susp:{rest:.14,travel:.12,kF:45e3,kR:8e3,cbF:2600,crF:3600,cbR:350,crR:500,arbF:0,arbR:0},tyre:Object.assign({},c0.tyre),tyreR:null,
    brake:1000,bias:0,hbTorque:1500,lock:.5,cdA:0,clF:0,clR:0,body:{L:7.0,W:10.6,H:3.1},tyreW:.3,tyreWR:.08,rcH:.25,cg:[0,RT.hcg],
    hull:RT.hullM.map(RT.toB),diff:Object.assign({},c0.diff,{can:{r:false,f:false,low:false}})});
  /* its engine for the synth: a big air-cooled flat six (8.9 litres, 260 hp, short open stacks, a lumpy idle),
     turning the prop at 2,800 rpm at most */
  const hs=specOf(i),spec=Object.assign({},hs,SIM.makeSpec({id:'redtail',name:'Redtail flat six',layout:'F6',disp:8.9,redline:2800,idle:RT.eng.idle,tq:640,
    fi:'none',ex:4,exLen:1.2,intake:2,cam:2,crackle:.22,seq:0,gearWhine:0,launch:0,nos:0,gain:1.3,ch:{scatter:.16,td:1.15},mass:m,drv:'RWD'}));
  for(const k of ['gears','fd','nG','shiftT','shiftRpm','gKp','gKi','startG','cvt','R','mu','cdA'])if(k in hs)spec[k]=hs[k];
  Object.assign(spec,{conv:false,mass:m,drv:'RWD'});
  const v=new Vehicle(c,spec,world);
  v.build=RT.build=Object.assign(Object.create(hb),{id:'redtail',name:'Redtail',gov:0,look:Object.assign({},hb.look,{track:2.5,body:hb.look.body||'suv'})});
  v.bi=i;v.cg=c.cg;v.low=false;v.locked=false;v.pt.lo=1;v.pt.partShift=true;v.rt=true;
  /* a plane's inertia (kg m2: roll, yaw, pitch), not a box's */
  v.I=Float64Array.of(1300,2600,1500);
  /* the tailwheel steers (the physics steers its 'front' wheels: so here, the two halves of the tailwheel), the
     brakes are the mains', and nothing is driven: the prop does the pushing */
  for(const w of v.wheels)w.front=w.hp[0]<0;
  v.pt.drvAll=[];v.pt.drv=[];
  /* its powertrain: starting and catching as the game's do, then the engine turns only the prop (rtStep) and the
     wheels just roll; no gearbox to shift */
  v.pt.step=function(dt,inp,W,aid){if(this.st==='off'||this.st==='crank'||this.st==='catch')return Powertrain.prototype.step.call(this,dt,inp,W,aid);
    this.t+=dt;this.lopeT+=dt;this.vW=0;this.engage=0;this.locked=false;this._free(W,dt);this._out();};
  v.pt.autoShift=()=>{};
  v.step=rtStep;RT.v=v;
  /* the cameras and the soft shadow under it measure it as a 9 m, 3.1 m tall machine (the host car's own drawing
     numbers otherwise) */
  const hD=(TRUCK[hb.id]||TRUCKF[hb.id]||truck(i)).D;RT.D=Object.assign(Object.create(hD),{L:9,Hr:3.1});
  return v;
}
/* (carD finds the plane's numbers by its build's id; kept out of the lists the game tidies) */
Object.defineProperty(TRUCK,'redtail',{get(){return RT.D?{D:RT.D}:undefined;},enumerable:false,configurable:true});
const RT_VSTEP=Vehicle.prototype.step;
/*@@FLY@@*/
/* ---------- the model: up to the graphics card the first time it's drawn ---------- */
const RT_U8=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
function rtBuild(){
  const D=window.RT2_DATA;if(!D)return false;const ms={};
  for(const [nm,e] of Object.entries(D.pieces)){
    const pos=new Float32Array(RT_U8(e.pos).buffer),nrm=new Float32Array(RT_U8(e.nrm).buffer),n=pos.length/3,glass=nm==='glass';
    const col=new Float32Array(n*4),mat=new Float32Array(n);for(let k=0;k<n;k++){col[k*4]=col[k*4+1]=col[k*4+2]=1;col[k*4+3]=glass?-.35:0;mat[k]=glass?70:120;}
    const ib=RT_U8(e.idx),idx=e.i32?new Uint32Array(ib.buffer):new Uint16Array(ib.buffer);
    const d={pos,nrm,col,mat,idx};if(e.uv)d.uv=new Float32Array(RT_U8(e.uv).buffer);
    ms[nm]=makeMesh(d);ms[nm].pv=e.pv;ms[nm].tris=e.n/3;}
  RT.mesh=ms;RT.tris=Object.values(ms).reduce((a,m)=>a+m.tris,0);
  /* the pictures (WebP, as baked), each with its mipmaps; the paint job last chosen goes on as soon as it's ready */
  RT.tex={};
  for(const k of ['a','n','o'])rtTexFrom(D.tex[k],tx=>{RT.tex[k]=tx;if(k==='a')RT.tex.a0=tx;RT.texN++;if(RT.texN===3&&RT.paint)rtPaint(RT.paint,true);});
  return true;
}
function rtTexFrom(b64,cb){const an=gl.getExtension('EXT_texture_filter_anisotropic'),im=new Image();im.onload=()=>{const tx=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,4);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);cb(tx);};
  im.src='data:image/webp;base64,'+b64;}
/* ---------- its paint jobs: redtail-2's own, and his two from ChatGPT (Nov 7 2026), each one colour picture for the
   same model (the shape, the surface detail and the roughness stay redtail-2's); the choice is remembered ---------- */
const RT_PAINTS=[{id:'original',name:'REDTAIL (ORIGINAL)'},{id:'yellow-black',name:'YELLOW & BLACK'},{id:'wilderness-olive',name:'WILDERNESS OLIVE'}];
RT.paint=(()=>{try{return Math.max(0,RT_PAINTS.findIndex(p=>p.id===localStorage.getItem('rtPaint')));}catch(_){return 0;}})();
function rtPaint(i,quiet){
  i=((i%RT_PAINTS.length)+RT_PAINTS.length)%RT_PAINTS.length;RT.paint=i;const P=RT_PAINTS[i];
  try{localStorage.setItem('rtPaint',P.id);}catch(_){}if(!quiet)say(P.name,1.6);
  if(!RT.tex||!RT.tex.a0)return;
  const drop=()=>{if(RT.texP){gl.deleteTexture(RT.texP);RT.texP=null;}};
  if(P.id==='original'){drop();RT.tex.a=RT.tex.a0;return;}
  const src=window.RT2_DATA&&RT2_DATA.paints&&RT2_DATA.paints[P.id];if(!src)return;
  rtTexFrom(src,tx=>{if(RT.paint!==i){gl.deleteTexture(tx);return;}drop();RT.texP=tx;RT.tex.a=tx;});
}
const RT_MW=new Float32Array(16);
/* the plane where the physics has it (in place of drawWorldCar's car): depth, into a shadow map (no glass) */
function rtDraw(t,v,dirt,far,depth){
  if(!RT.mesh&&!rtBuild())return 0;if(RT.texN<3)return 0;
  const u=CUR.u,M=t.M,Mw=RT_MW,E=RT.eng,ms=RT.mesh;
  Mw[0]=M[0];Mw[1]=M[3];Mw[2]=M[6];Mw[3]=0;Mw[4]=M[1];Mw[5]=M[4];Mw[6]=M[7];Mw[7]=0;Mw[8]=M[2];Mw[9]=M[5];Mw[10]=M[8];Mw[11]=0;
  Mw[12]=t.p[0]-RO[0];Mw[13]=t.p[1]-RO[1];Mw[14]=t.p[2]-RO[2];Mw[15]=1;
  const Mb=M4.mul(Mw,RT.B2M),pm=RT.prev;
  /* (last frame's matrices for TAA, stepped with the origin) */
  if(!depth&&(RT.ro0!==RO[0]||RT.ro2!==RO[2])){const dx=RO[0]-RT.ro0,dz=RO[2]-RT.ro2;for(const k in pm){pm[k][12]-=dx;pm[k][14]-=dz;}RT.ro0=RO[0];RT.ro2=RO[2];}
  const setM=(key,Mx)=>{gl.uniformMatrix4fv(u.uM,false,Mx);if(!depth){const q=pm[key];gl.uniformMatrix4fv(u.uPrevM,false,q||Mx);if(q)q.set(Mx);else pm[key]=Float32Array.from(Mx);}};
  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,0);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);
    /* (the renderer hands its own samplers their units; these three are the plane's, on units of their own) */
    if(RT.locP!==CUR.p){RT.locP=CUR.p;RT.loc=['uRTa','uRTn','uRTo'].map(n=>gl.getUniformLocation(CUR.p,n));}
    const U=[[RT.loc[0],RT.tex.a,13],[RT.loc[1],RT.tex.n,14],[RT.loc[2],RT.tex.o,15]];
    for(const [loc,tx,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tx);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);}
  const piece=(nm,Mx)=>{setM(nm,Mx);drawMesh(ms[nm]);};
  const at=(nm,R)=>{const p=ms[nm].pv,T=M4.mul(Mb,M4T(p[0],p[1],p[2]));return R?M4.mul(T,R):T;};
  piece('body',Mb);if(!RT.cowlOff)piece('cowl',Mb);
  if(!depth&&!(t===GAME.car&&CAMS[APP.cam]==='Cockpit'&&!CAM.over))piece('glass',Mb);
  piece('prop',at('prop',M4RX(E.ang)));
  /* the surfaces as the pilot moves them: the rudder (with the tailwheel on the ground), the elevators, the
     ailerons (one up, one down), the flaps */
  const W=t.wheels,stA=t.steer||0,C=RTF.ctl,fl=RTF.flapA;
  piece('rudder',at('rudder',M4RY(clamp(C.r*.45,-.45,.45))));
  piece('elevR',at('elevR',M4RZ(-C.e*.38)));piece('elevL',at('elevL',M4RZ(-C.e*.38)));
  piece('aileronR',at('aileronR',M4RZ(-C.a*.32)));piece('aileronL',at('aileronL',M4RZ(C.a*.32)));
  piece('flapR',at('flapR',M4RZ(fl)));piece('flapL',at('flapL',M4RZ(fl)));
  /* the wheels rolling as the physics rolls them; the tailwheel steering */
  const mR=W.find(w=>!w.front&&w.hp[2]>0),mL=W.find(w=>!w.front&&w.hp[2]<0),tw=W.find(w=>w.front);
  piece('wheelR',at('wheelR',M4RZ(-(mR?mR.ang:0))));piece('wheelL',at('wheelL',M4RZ(-(mL?mL.ang:0))));
  piece('tailwheel',at('tailwheel',M4.mul(M4RY(-stA),M4RZ(-(tw?tw.ang:0)))));
  if(!depth){gl.uniform1f(u.uPrevOn,0);gl.uniform1f(u.uDirt,0);gl.uniform1f(u.uLiv,0);gl.uniform1f(u.uLamps,0);gl.uniform1f(u.uBrake,0);gl.uniform3f(u.uGlow,0,0,0);}
  return RT.tris;
}
/* its lamps (in place of a car's): the landing lights in the wing's leading edge for the Lights button, the nav
   lights at night (red on the left tip, green on the right, white on the tail); no brake lights on a plane */
const RT_CL=carLights;
carLights=function(t,L){if(!(t&&t.rt))return RT_CL(t,L);
  const M=t.M,F=[M[0],M[3],M[6]],U=[M[1],M[4],M[7]],Rt=[M[2],M[5],M[8]];
  const at=p=>{const b=RT.toB(p);return [t.p[0]-RO[0]+F[0]*b[0]+U[0]*b[1]+Rt[0]*b[2],t.p[1]-RO[1]+F[1]*b[0]+U[1]*b[1]+Rt[1]*b[2],t.p[2]-RO[2]+F[2]*b[0]+U[2]*b[1]+Rt[2]*b[2]];};
  if(APP.lights){const c=Math.cos(RT.th0),s=Math.sin(RT.th0),d=V3.norm([F[0]*c+U[0]*(s-.12),F[1]*c+U[1]*(s-.12),F[2]*c+U[2]*(s-.12)]),hk=1.5*LOOK.hl;
    L.headlights={on:1,high:0,posL:at([.5,.98,-2.0]),posR:at([.5,.98,2.0]),dir:d,right:Rt,up:U,col:[1050*hk,1090*hk,1140*hk],range:85};}
  if(SKY.lightsOn||APP.lights){L.dyn.push({pos:at([-.3,.95,-5.36]),r:3,col:[3,.08,.05],type:0});L.dyn.push({pos:at([-.3,.95,5.36]),r:3,col:[.08,3,.6],type:0});
    L.dyn.push({pos:at([-4.75,.3,0]),r:2.5,col:[1.6,1.6,1.5],type:0});}
};
/* its cockpit: the front seat's eyes, looking out along the nose (a taildragger's nose sits up in front of you on
   the ground, as it does in the real thing), the windows clear from inside */
const RT_COCK=cockStep;
cockStep=function(t,dt,cut){if(!(t&&t.rt))return RT_COCK(t,dt,cut);
  const M=t.M,e=RT.toB([.30,.47,0]),p=t.p,eye=[p[0]+M[0]*e[0]+M[1]*e[1]+M[2]*e[2],p[1]+M[3]*e[0]+M[4]*e[1]+M[5]*e[2],p[2]+M[6]*e[0]+M[7]*e[1]+M[8]*e[2]];
  const a=RT.th0-.09,F=mvec(M,[Math.cos(a),Math.sin(a),0]),U=mvec(M,[-Math.sin(a),Math.cos(a),0]);COCK.seat=true;
  if(!COCK.F||cut){COCK.F=F;COCK.U=U;}const k=1-Math.exp(-dt*22);COCK.F=norm2(madd(COCK.F,sub2(F,COCK.F),k));COCK.U=norm2(madd(COCK.U,sub2(U,COCK.U),k));
  return {eye,fwd:COCK.F,up:COCK.U,fov:1.15};};
const RT_DWC=drawWorldCar;
drawWorldCar=function(t,v,dirt,far,depth){return t&&t.rt?rtDraw(t,v,dirt,far,depth):RT_DWC(t,v,dirt,far,depth);};
/* ---------- out in it, and back to the car ---------- */
function rtFly(on){
  RT.want=!!on;const t=GAME.car;
  if(!!(t&&t.rt)!==RT.want)spawnCar(APP.bi,...(t?[t.p[0],t.p[2],Math.atan2(-t.M[6],t.M[0])]:[]));
  if(RT.want)say('THE REDTAIL',2);
}
window.__rt2={RT,RTF,RTI,RTS,rtFly,rtBuild,rtPaint,rtSound,SIM,ENG:()=>ENG,audio:async()=>{await startEngine();return !!ENG.audio;},oldSpec:()=>Object.assign({},specOf(APP.bi),{name:'Redtail flat four',layout:'F4',cyl:4,disp:5.9,redline:2700,limiterRpm:2750,idle:700,fi:'na',boost:0,antilag:0,bov:'',crackle:0,seq:0,gearWhine:0,launch:0,nosKw:0,turbo:false,sup:false,conv:false,mass:750,drv:'RWD'}),reset:()=>{resetCar();return GAME.car.rt;},dsp:()=>{try{const c=SIM.dspCfg(GAME.car.spec);return {ok:true,keys:Object.keys(c).length};}catch(e){return {ok:false,err:String(e)};}}};
