window.T9=/* Mud Lab test drivers (tools/test/ml-pits.py, ml-rescue.py): put a SUV somewhere, drive a hole, a trail, bog it, tow it, winch it. Physics only. */{
 sgn:0,
 f:v=>+v.toFixed(2),
 inp(o){__dyb.setTestInput(Object.assign({steer:0,thr:0,brk:0,hb:0,nos:false},o));},
 steps(n){for(let i=0;i<n;i++)__dyb.step(1/120);},
 yaw(t){return Math.atan2(-t.M[6],t.M[0]);},
 /* a vehicle made new at u,v (the world's own coordinates), facing yaw; mode: stock 'AWD'|'4 HI'|'4 LO', crawler 'open'|'lock'|'low' */
 put(kind,u,v,yaw,mode){const D=__dyb,A=D.WG.mlA;__game.FX.length=0;this.inp({hb:1});
   if(window.__mlr&&__mlr.testClear)__mlr.testClear();
   __mlsv.mlSuvIdx('stock');__mlsv.mlSuvIdx('crawler');__game.spawnCar(__mlsv.MLSV.bi[kind],A.x+u,A.z+v,yaw);__mlsv.MLSV.pick=kind;__game.FX.length=0;this.steps(240);
   const t=D.GAME.car;
   if(kind==='stock'){let g=0;while(__mlsv.mlMode(t)!==(mode||'4 HI')&&g++<4)__mlsv.mlLow(t);}
   else{if(mode==='lock'||mode==='low'||!mode){t.locked=true;const d=t.c.diff;if(d.can.r){d.rLock=true;if(d.can.f)d.fLock=true;}}if(mode==='low')__mlsv.mlLow(t);}
   return t;},
 /* which way steer turns: found once on the dry field */
 sign(){if(this.sgn)return this.sgn;const t=this.put('crawler',0,620,0,'open');const y0=this.yaw(t);this.inp({thr:.5,steer:.4});this.steps(300);let d=this.yaw(t)-y0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;this.sgn=d>0?1:-1;return this.sgn;},
 hole(k){const H=__dyb.WG.mlHoles[k];return H;},
 /* where the truck is along a hole's long axis (a: -1 one end, +1 the other) and across it (metres) */
 at(t,H){const A=__dyb.WG.mlA,x=t.p[0]-A.x-H.u,z=t.p[2]-A.z-H.v,cs=Math.cos(H.r),sn=Math.sin(H.r);return {s:x*cs+z*sn,lat:-x*sn+z*cs};},
 /* hold the hole's axis: steer from the offset across it and the heading */
 steer(t,H,dir){const q=this.at(t,H),want=dir>0?-H.r:-H.r+Math.PI;let e=want-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
   /* (to the left of the axis going its way, lat is negative when ...: worked out from the heading alone plus a pull to the line) */
   const pull=Math.max(-.5,Math.min(.5,-q.lat*dir*.12));return Math.max(-1,Math.min(1,this.sgn*(e*1.6+pull*this.latSign)));},
 latSign:-1,
 /* through a hole. style 'mom': full throttle from run m back. 'stop': in at part throttle, stop in the middle, then full throttle for secs.
    'rock': after the stop, forward 1.2 s, reverse 1.2 s ... */
 run(kind,k,style,o){o=o||{};this.sign();const H=this.hole(k),dir=o.dir||1,run=o.run||25,cs=Math.cos(H.r),sn=Math.sin(H.r),s0=-(H.L+run)*dir;
   __ml.mlRake();const t=this.put(kind,H.u+cs*s0,H.v+sn*s0,dir>0?-H.r:-H.r+Math.PI,o.mode);if(o.air)this.air(o.air);
   const out={kind,k,style,L:H.L,d:H.d};let vmin=99,vin=null,tt=0;const thr=o.thr||1,end=(H.L+6);
   const prog=()=>this.at(t,H).s*dir;
   if(style==='mom'||style==='cruise'){const vT=o.v||7;
     while(tt<(o.secs||25)){this.inp({thr:style==='cruise'?Math.max(0,Math.min(thr,(vT-t.speed)*.6+.15)):thr,steer:this.steer(t,H,dir)});this.steps(12);tt+=.1;const p=prog();if(p>-H.L&&vin===null)vin=t.speed;if(p>-H.L&&p<H.L)vmin=Math.min(vmin,t.speed);if(p>end)break;}
     out.inMph=this.f((vin||0)*2.237);out.minMph=this.f(vmin*2.237);out.through=prog()>end;out.at=this.f(prog());out.secs=this.f(tt);}
   else{
     while(tt<20&&prog()<(o.stopAt===undefined?-H.L*.1:o.stopAt)){this.inp({thr:o.thrIn||.45,steer:this.steer(t,H,dir)});this.steps(12);tt+=.1;}
     out.inMph=this.f(t.speed*2.237);
     for(let i=0;i<40&&t.speed>.15;i++){this.inp({brk:1});this.steps(12);}
     this.inp({});this.steps(120);const p0=prog();out.stopAt=this.f(p0);
     if(style==='stop'){let t2=0;while(t2<(o.secs||15)){this.inp({thr,steer:this.steer(t,H,dir)});this.steps(12);t2+=.1;if(prog()>end)break;}
       out.moved=this.f(prog()-p0);out.through=prog()>end;out.endMph=this.f(t.speed*2.237);out.secs=this.f(t2);}
     else if(style==='rock'){let t2=0,ph=0;const per=o.per||1.3;while(t2<(o.secs||30)){const fwd=Math.floor(t2/per)%2===0;
         if(fwd)this.inp({thr,steer:this.steer(t,H,dir)});else this.inp({brk:1,steer:0});this.steps(12);t2+=.1;if(prog()>end||prog()<-end)break;}
       out.moved=this.f(prog()-p0);out.through=prog()>end||prog()<-end;out.endMph=this.f(t.speed*2.237);out.secs=this.f(t2);}}
   const S=__ml.mlStats();out.rutCm=S.deepestCm;out.lat=this.f(this.at(t,H).lat);out.mu=t.wheels.map(w=>this.f(w.mlGrip===undefined?-1:w.mlGrip)).join(',');out.clog=t.wheels.map(w=>this.f(w.mlClog||0)).join(',');
   return out;},
 c(kind,k,style,o){const r=this.run(kind,k,style,o),H=this.hole(k);return (H.pit||k)+' '+kind.slice(0,5)+' '+style+(o&&o.mode?'/'+o.mode:'')+(o&&o.air?' '+__mlr.ML_AIRS[o.air].psi+'psi':'')+': in '+r.inMph+(style!=='stop'&&style!=='rock'?' min '+r.minMph:' stopAt '+r.stopAt+' moved '+r.moved)+' thr '+((o&&o.thr)||1)+' run '+((o&&o.run)||25)+' through '+r.through+(r.at!==undefined?' at '+r.at:'')+' t '+r.secs+' rut '+r.rutCm+' lat '+r.lat+' mu '+r.mu.split(',')[0]+' clog '+r.clog.split(',')[0];},
 holes(){return __dyb.WG.mlHoles.map((H,k)=>({k,u:Math.round(H.u),v:Math.round(H.v),L:H.L,W:H.W,d:H.d,big:H.big||0}));}
};
Object.assign(T9,{
 R(){return __mlr.MLR;},
 st(){const M=this.R(),t=__dyb.GAME.car,o=M.other,A=__dyb.WG.mlA,f=this.f;return {me:__mlsv.MLSV.pick,p:[f(t.p[0]-A.x),f(t.p[2]-A.z)],mph:f(t.speed*2.237),stuck:M.stuck,can:M.can,seat:M.seatOk,mode:M.mode,
   other:o?{kind:(o.build.kit||o.build.id),p:[f(o.p[0]-A.x),f(o.p[2]-A.z)],mph:f((o.speed||0)*2.237),live:M.live,stuck:!!o.mlStuck}:null,
   winch:M.winch?{len:f(M.winch.len),d:f(M.winch.d),kN:f(M.winch.T/1000),end:M.winch.end}:null,strap:M.strap?{d:f(M.strap.d),kN:f(M.strap.T/1000),peak:f(M.strap.peak/1000)}:null,
   msgs:__dyb.GAME.msgs.map(m=>m.t).slice(-2)};},
 /* drive for secs with the pedal and wheel given; returns the state */
 go(o,secs){this.inp(o);this.steps(Math.round(secs*120));return this.st();},
 /* bog a SUV in hole k (stops in its middle, spins 4 s), with the other one made 40 m back on the approach */
 bog(kind,k,mode){this.sign();const H=this.hole(k),cs=Math.cos(H.r),sn=Math.sin(H.r),A=__dyb.WG.mlA;__ml.mlRake();
   const t0=this.put(kind,H.u-cs*(H.L+25),H.v-sn*(H.L+25),-H.r,mode);let tt=0;
   while(tt<20&&this.at(__dyb.GAME.car,H).s<-H.L*.1){this.inp({thr:.45,steer:this.steer(__dyb.GAME.car,H,1)});this.steps(12);tt+=.1;}
   for(let i=0;i<40&&__dyb.GAME.car.speed>.15;i++){this.inp({brk:1});this.steps(12);}
   const ok=kind==='stock'?'crawler':'stock';this.R().other=__mlr.mlrMake(ok,{x:A.x+H.u-cs*(H.L+40),z:A.z+H.v-sn*(H.L+40),yaw:-H.r});this.R().made=true;
   return this.go({thr:1},5);},
 trees(){const t=__dyb.GAME.car,L=__mlr.mlrTrees(t.p[0],t.p[2]);let n=0,near=99;for(let q=0;q<L.length;q+=2){const d=Math.hypot(L[q]-t.p[0],L[q+1]-t.p[2]);if(d<30)n++;near=Math.min(near,d);}return {within30:n,nearest:this.f(near)};}
});
Object.assign(T9,{
 treesAt(u,v){const A=__dyb.WG.mlA;__mlr.MLR.tc=[1e9,1e9];const L=__mlr.mlrTrees(A.x+u,A.z+v);let n=0,near=99;for(let q=0;q<L.length;q+=2){const d=Math.hypot(L[q]-A.x-u,L[q+1]-A.z-v);if(d<30)n++;near=Math.min(near,d);}return n+'/'+this.f(near);},
 holeTrees(){return __dyb.WG.mlHoles.map((H,k)=>k+':'+this.treesAt(H.u,H.v)).join('  ');},
 /* strap test on the dry field: the towed one 10 m behind the puller */
 tow(pull,thr,secs){const A=__dyb.WG.mlA;const t=this.put(pull,60,560,0,pull==='stock'?'4 HI':'lock');const ok=pull==='stock'?'crawler':'stock';
   const M=this.R();M.other=__mlr.mlrMake(ok,{x:A.x+50,z:A.z+560,yaw:0});M.made=true;M.rescue=1e9;this.go({},1.5);const a=this.st();__mlr.mlrHookUp();const out=[a.can,this.st().strap&&this.st().strap.d];
   for(let i=0;i<secs;i++){const s=this.go({thr},1);out.push(s.mph+'/'+s.other.mph+' '+s.strap.kN+'kN pk'+s.strap.peak);}return out;},
 /* winch test: a SUV put at u,v facing yaw, called bogged, hooked, the winch run for secs with the pedal given */
 winch(kind,u,v,yaw,thr,secs){const t=this.put(kind,u,v,yaw);const M=this.R();this.go({},.5);M.stuck=true;M.treeT=-9;this.go({},.2);const c=this.st().can;__mlr.mlrHookUp();const out=[c,JSON.stringify(this.st().winch)];
   for(let i=0;i<secs;i++){M.stuck=true;const s=this.go({thr},1);out.push(s.mph+(s.winch?' len '+s.winch.len+' d '+s.winch.d+' '+s.winch.kN+'kN':' off:'+s.msgs.slice(-1)));if(!s.winch)break;}return out;}
});
Object.assign(T9,{
 near(n,u,v){const P=__dyb.WG.mlTrails[n].pts;let b=0,bd=1e9;P.forEach((p,i)=>{const d=Math.hypot(p[0]-u,p[1]-v);if(d<bd){bd=d;b=i;}});return b;},
 /* along trail n from point i0 to i1 (either way), holding vT m/s where it can: where it got to, where it bogged */
 trail(kind,n,i0,i1,o){o=o||{};this.sign();const P=__dyb.WG.mlTrails[n].pts,A=__dyb.WG.mlA,dir=i1>i0?1:-1,vT=o.v||8;__ml.mlRake();
   const p0=P[i0],p1=P[i0+dir*2],t=this.put(kind,p0[0],p0[1],Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),o.mode);
   let i=i0,tt=0,still=0,vmin=99,slow=[];const out={kind,trail:__dyb.WG.mlTrails[n].name,from:i0,to:i1};
   while(tt<(o.secs||240)){const u=t.p[0]-A.x,v=t.p[2]-A.z;
     while(i!==i1&&Math.hypot(P[i][0]-u,P[i][1]-v)<7)i+=dir;
     if(i===i1&&Math.hypot(P[i][0]-u,P[i][1]-v)<8){out.done=true;break;}
     const q=P[i],want=Math.atan2(-(q[1]-v),q[0]-u);let e=want-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     const thr=Math.max(0,Math.min(o.thr||1,(vT-t.speed)*.6+.15));this.inp({thr,steer:Math.max(-1,Math.min(1,this.sgn*e*1.8))});this.steps(12);tt+=.1;
     if(tt>3){if(t.speed<vmin)vmin=t.speed;if(t.speed<.3)still+=.1;else still=0;if(t.speed<2&&(!slow.length||Math.hypot(slow[slow.length-1][0]-u,slow[slow.length-1][1]-v)>25))slow.push([Math.round(u),Math.round(v),this.f(t.speed*2.237)]);}
     if(still>(o.wait||6)){out.bogged=[Math.round(u),Math.round(v)];break;}}
   out.secs=this.f(tt);out.at=i;out.minMph=this.f(vmin*2.237);out.slow=slow;out.water=this.f((__ml.MLS.wd||0)*100);return out;}
});
Object.assign(T9,{
 scan(n,L,step){const P=__dyb.WG.mlTrails[n].pts,Z={},out=[];for(let i=6;i<P.length-6;i+=step||6){const a=P[i-1],b=P[i+1],r=Math.atan2(b[1]-a[1],b[0]-a[0]),cs=Math.cos(r),sn=Math.sin(r),u=P[i][0],v=P[i][1];
   const h0=__dyb.WG.mlZone(u-cs*(L+8),v-sn*(L+8),Z).h,h1=__dyb.WG.mlZone(u+cs*(L+8),v+sn*(L+8),Z).h,hc=__dyb.WG.mlZone(u,v,Z).h;
   /* (how far the trail bends over the pit's length) */
   const j0=Math.max(0,i-Math.round(L/4)),j1=Math.min(P.length-1,i+Math.round(L/4)),bend=Math.abs((P[j0][0]-u)*sn-(P[j0][1]-v)*cs)+Math.abs((P[j1][0]-u)*sn-(P[j1][1]-v)*cs);
   out.push((i/(P.length-1)).toFixed(3)+' ('+Math.round(u)+','+Math.round(v)+') dh '+this.f(h0-hc)+'/'+this.f(h1-hc)+' bend '+this.f(bend)+' trees '+this.treesAt(u,v)+' clay '+this.f(Z.clay)+' m '+this.f(Z.moist));}return out;}
});
Object.assign(T9,{
 dbg(kind,n,i0,i1,k,o){o=o||{};this.sign();const P=__dyb.WG.mlTrails[n].pts,A=__dyb.WG.mlA,dir=i1>i0?1:-1,vT=o.v||8,H=this.hole(k);__ml.mlRake();
   const p0=P[i0],p1=P[i0+dir*2],t=this.put(kind,p0[0],p0[1],Math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0]),o.mode);let i=i0,tt=0;const out=[];
   while(tt<(o.secs||40)){const u=t.p[0]-A.x,v=t.p[2]-A.z;while(i!==i1&&Math.hypot(P[i][0]-u,P[i][1]-v)<7)i+=dir;if(i===i1)break;
     const q=P[i],want=Math.atan2(-(q[1]-v),q[0]-u);let e=want-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     const thr=Math.max(0,Math.min(o.thr||1,(vT-t.speed)*.6+.15)),st=Math.max(-1,Math.min(1,this.sgn*e*1.8));this.inp({thr,steer:st});this.steps(12);tt+=.1;
     const a=this.at(t,H);if(Math.abs(a.s)<14&&Math.round(tt*10)%4===0)out.push('s'+this.f(a.s)+' lat'+this.f(a.lat)+' '+this.f(t.speed*2.237)+'mph thr'+this.f(thr)+' st'+this.f(st)+' g'+t.pt.gear+' rpm'+Math.round(t.pt.rpm||0)+' w'+t.wheels.map(w=>Math.round(w.w*w.R*2.237)).join('/')+' wd'+this.f((__ml.MLS.wd||0)*100)+' pl'+Math.round(__ml.MLS.plough||0));}
   return out;}
});
/* Mud Lab 10: tyre pressure, the Bog, the pull test, the winch at a bank */
Object.assign(T9,{
 air(i){if(__mlr.mlrAirSet)__mlr.mlrAirSet(__dyb.GAME.car,i||0);return i||0;},
 /* down the Bog from 30 m back on a held throttle: how far (the game's own mark) */
 bogRun(kind,i,thr,mode){this.sign();const B=__dyb.WG.mlBog;__ml.mlRake();__mlb.MLB.cool=false;__mlb.MLB.run=null;__mlb.MLB.last=null;const t=this.put(kind,B.u0-30,B.v,0,mode);this.air(i);
   const A=__dyb.WG.mlA;let tt=0;while(tt<60&&!__mlb.MLB.last){let e=0-this.yaw(t);const lat=(t.p[2]-A.z-B.v);this.inp({thr,steer:Math.max(-1,Math.min(1,this.sgn*(e*1.6+lat*.12)))});this.steps(12);tt+=.1;}
   const L=__mlb.MLB.last;return kind.slice(0,5)+' '+__mlr.ML_AIRS[i||0].psi+'psi thr'+thr+': '+(L?L.ft+' ft':'no mark')+' in '+this.f(tt)+' s';},
 /* drawbar pull: tied by the tail to a point 5 m behind, the throttle held for secs: the pull held over the last half, and the wheels' slip */
 pull(kind,u,v,yaw,i,thr,secs,mode){const t=this.put(kind,u,v,yaw,mode);this.air(i);const A=__dyb.WG.mlA,M=t.M;__mlb.mlbPullAt(t,t.p[0]-M[0]*7.5,t.p[2]-M[6]*7.5);
   const P=__mlr.MLR.pull;let sum=0,n=0,pk=0,slip=0;const N=Math.round((secs||6)*10);for(let q=0;q<N;q++){this.inp({thr:thr||.7});this.steps(12);pk=Math.max(pk,P.T);if(q>=N/2){sum+=P.T;n++;slip+=t.wheels.reduce((a,w)=>a+Math.abs(w.w*w.R),0)/4;}}
   const W=t.m*9.81,S=__ml.mlStats();this.inp({});__mlr.mlrUnhook();return kind.slice(0,5)+' '+__mlr.ML_AIRS[i||0].psi+'psi @'+u+','+v+' '+(S.here?S.here.main+' m'+S.here.moist:'')+': held '+this.f(sum/n/1000)+' kN ('+this.f(sum/n/W)+' W) peak '+this.f(pk/1000)+' wheels '+this.f(slip/n*2.237)+' mph ruts '+S.deepestCm+' cm';},
 /* the steepest drop at the pond's rim, and a winch pull at it */
 cliff(){const P={u:232,v:104,a:62,b:34,r:-.5},cs=Math.cos(P.r),sn=Math.sin(P.r),Z={},at=(r,f)=>{const a=r*Math.cos(f),b=r*Math.sin(f);return [P.u+a*P.a*cs-b*P.b*sn,P.v+a*P.a*sn+b*P.b*cs];};let best=null;
   for(let k=0;k<72;k++){const f=k/72*6.2832,p0=at(1.22,f),p1=at(1.6,f),h0=__dyb.WG.mlZone(p0[0],p0[1],Z).h,h1=__dyb.WG.mlZone(p1[0],p1[1],Z).h;if(!best||h1-h0>best.dh)best={dh:this.f(h1-h0),f,p0,p1,trees:this.treesAt(p1[0],p1[1])};}return best;},
 cliffWinch(secs){const C=this.cliff(),dx=C.p1[0]-C.p0[0],dz=C.p1[1]-C.p0[1];__ml.mlRake();const t=this.put('crawler',C.p0[0],C.p0[1],Math.atan2(-dz,dx)),M=this.R(),y0=t.p[1],x0=t.p[0],z0=t.p[2];
   this.go({},.5);M.stuck=true;M.treeT=-9;this.go({},.3);const can=this.st().can;__mlr.mlrHookUp();const out=['drop '+C.dh+' m, trees '+C.trees,can];let last='';
   for(let i=0;i<(secs||45);i++){M.stuck=true;const s=this.go({},1);if(!s.winch){last=s.msgs.slice(-1)[0];out.push('line off after '+(i+1)+' s: '+last);break;}}
   const S=__ml.mlStats();out.push('moved '+this.f(Math.hypot(t.p[0]-x0,t.p[2]-z0))+' m, up '+this.f(t.p[1]-y0)+' m, deepest cut '+S.deepestCm+' cm, pitch '+this.f(Math.asin(Math.max(-1,Math.min(1,t.M[3])))*57.3)+' deg');return out;}
});
