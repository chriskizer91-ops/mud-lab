window.TP=/* The Mud Park's test drivers (run with tools/test/ml-pits.py BUILD tools/test/ml-park.js runs.txt). Physics only.
  TP.bog('crawler',0,40)           the Rock & Mud down the run-up, into lane 0 (the Mud Lane; 1 the Water Lane) at 40 mph, flat out in the lane: its mark
  TP.bog('hatchB',1,90,{thr:.6})   the same with a part throttle in the lane
  TP.chain('stock',9)              down the Braids lengthways at a steady 9 m/s: how far, slowest, deepest water, did it choke
  TP.cross('crawler',300,5)        across the river 300 m down the chain at 5 m/s, right bank to left (through the Sloughs)
  TP.spec('tractor')               what a vehicle is, and a flat-out run on the run-up
  TP.fetch('crawler','tractor')    sink the first in the Sloughs, bring the second, strap, and pull: does it come out */{
 sgn:0,f:v=>+v.toFixed(2),
 inp(o){__dyb.setTestInput(Object.assign({steer:0,thr:0,brk:0,hb:0,nos:false},o));},
 steps(n){for(let i=0;i<n;i++)__dyb.step(1/120);},
 yaw(t){return Math.atan2(-t.M[6],t.M[0]);},
 wrap(e){while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;return e;},
 put(kind,u,v,yaw,keep){const D=__dyb,A=D.WG.mlA;__game.FX.length=0;this.inp({hb:1});if(window.__seed)__seed((this.seedN||1)*7919+13);
   if(!keep&&window.__mlr&&__mlr.testClear)__mlr.testClear();
   __game.spawnCar(__mlsv.mlSuvIdx(kind),A.x+u,A.z+v,yaw);__mlsv.MLSV.pick=kind;__game.FX.length=0;this.steps(240);
   const t=D.GAME.car;if(t.pt.st==='off'){t.pt.st='run';t.pt.we=t.pt.e.idle*2*Math.PI/60;}
   if(kind==='stock'){let g=0;while(__mlsv.mlMode(t)!=='4 HI'&&g++<4)__mlsv.mlLow(t);}
   else if(kind==='crawler'||kind==='tractor'){t.locked=true;const d=t.c.diff;if(d.can&&d.can.r){d.rLock=true;if(d.can.f)d.fLock=true;}}
   return t;},
 /* (which way the wheel turns it: found once, on the Pits) */
 sign(){if(this.sgn)return this.sgn;const t=this.put('crawler',-12,640,0);const y0=this.yaw(t);this.inp({thr:.5,steer:.4});this.steps(300);this.sgn=this.wrap(this.yaw(t)-y0)>0?1:-1;return this.sgn;},
 /* steer along a line through (u0,v0) heading (dx,dz) */
 hold(t,u0,v0,dx,dz){const A=__dyb.WG.mlA,u=t.p[0]-A.x,v=t.p[2]-A.z,lat=(v-v0)*dx-(u-u0)*dz,want=Math.atan2(-dz,dx),e=this.wrap(want-this.yaw(t));
   return Math.max(-1,Math.min(1,this.sgn*(e*1.6+Math.max(-.5,Math.min(.5,lat*.1)))));},
 wet(t){return {choke:this.f(t.mlWet||0),drowned:!!t.mlDrowned};},
 spec(kind){this.sign();const B=__dyb.WG.mlBog,t=this.put(kind,B.u0-B.run+10,B.v,0),e=t.pt.e;let tt=0,t30=null,t60=null,top=0;
   while(tt<14&&t.p[0]-__dyb.WG.mlA.x<B.u0-12){this.inp({thr:1,steer:this.hold(t,B.u0,B.v,1,0)});this.steps(6);tt+=.05;const mph=t.speed*2.237;top=Math.max(top,mph);if(t30===null&&mph>=30)t30=this.f(tt);if(t60===null&&mph>=60)t60=this.f(tt);}
   return {kind,hp:Math.round(e.peak.hp),lbft:Math.round(e.peak.tq*.7376),kg:Math.round(t.c.mass),gears:e.gears.length,drive:t.c.drv||'',tread:t.c.tread+(t.c.treadR?'/'+t.c.treadR:''),tyreR:t.wheels.map(w=>w.R).join(','),clearM:this.f(t.__mlClr||0),to30:t30,to60:t60,mphAtLanes:this.f(top),secs:this.f(tt)};},
 bog(kind,lane,mph,o){o=o||{};this.sign();__ml.mlRake();const D=__dyb,B=D.WG.mlBog,A=D.WG.mlA,L=B.lanes[lane],len=B.u1-B.u0,vT=mph/2.237;
   /* (o.back: how far back from the lanes it starts, m; all the run-up if not given. The lane's own clock, o.secs, starts at the lane) */
   const t=this.put(kind,B.u0-Math.min(B.run-10,o.back||B.run),L.v,0);let tt=0,tl=0,inMph=null,max=-99,still=0,end='time',deep=0,minIn=99;
   while(tl<(o.secs||150)&&tt<400){const s=t.p[0]-(A.x+B.u0)+(t.c.body?t.c.body.L/2:2);
     const st=this.hold(t,B.u0,L.v,1,0);
     if(s<0){this.inp({thr:Math.max(0,Math.min(1,(vT-t.speed)*.6+.1)),brk:t.speed>vT+1.5?.4:0,steer:st});}
     else{if(inMph===null)inMph=this.f(t.speed*2.237);this.inp({thr:o.thr||1,steer:st});minIn=Math.min(minIn,t.speed);deep=Math.max(deep,__ml.MLS.wd||0);
       if(s>max)max=s;if(t.speed<.3)still+=.05;else still=0;
       if(max>=len+1){end='through';break;}if(still>2){end='stopped';break;}if(Math.abs(t.p[2]-(A.z+L.v))>B.hw+2.5){end='left the lane';break;}if(t.M[4]<.3){end='rolled';break;}}
     this.steps(6);tt+=.05;if(s>=0)tl+=.05;}
   return kind+' '+L.name+' aim '+mph+': in at '+inMph+' mph -> '+Math.round(Math.min(len,Math.max(0,max))*3.281)+' ft ('+end+'), water '+this.f(deep)+' m, choke '+this.f(t.mlWet||0)+(t.mlDrowned?' DROWNED':'')+', t '+this.f(tt);},
 /* the river: P its line, a spot s down it and b across */
 rv(s,b){const P=__dyb.WG.mlX.river;let i=0;while(i<P.length-2&&P[i+1][6]<s)i++;const a=P[i],c=P[i+1],L=Math.hypot(c[0]-a[0],c[1]-a[1])||1,f=Math.max(0,Math.min(1,(s-a[6])/L)),dx=(c[0]-a[0])/L,dz=(c[1]-a[1])/L;
   return {u:a[0]+(c[0]-a[0])*f-dz*b,v:a[1]+(c[1]-a[1])*f+dx*b,dx,dz,hw:a[2]+(c[2]-a[2])*f};},
 chain(kind,v,o){o=o||{};this.sign();__ml.mlRake();const C=__dyb.WG.mlX.chain,A=__dyb.WG.mlA,b=o.b===undefined?8:o.b,q0=this.rv(C.s0+12,b);
   const t=this.put(kind,q0.u,q0.v,Math.atan2(-q0.dz,q0.dx));let s=C.s0+12,tt=0,vmin=99,vmax=0,deep=0,still=0,end='time',wave=0;
   while(tt<(o.secs||260)){const u=t.p[0]-A.x,w=t.p[2]-A.z;
     /* (how far down the river it is: the furthest point within reach) */
     for(let k=0;k<30;k++){const q=this.rv(s+2,b);if(Math.hypot(q.u-u,q.v-w)<Math.hypot(this.rv(s,b).u-u,this.rv(s,b).v-w))s+=2;else break;}
     const a=this.rv(s+14,b),want=Math.atan2(-(a.v-w),a.u-u),e=this.wrap(want-this.yaw(t));
     this.inp({thr:Math.max(0,Math.min(1,(v-t.speed)*.5+.15)),steer:Math.max(-1,Math.min(1,this.sgn*e*1.8))});this.steps(6);tt+=.05;
     if(tt>3){vmin=Math.min(vmin,t.speed);vmax=Math.max(vmax,t.speed);}deep=Math.max(deep,__ml.MLS.wd||0);if((__ml.MLS.wd||0)>.34)wave+=.05;
     if(t.speed<.3)still+=.05;else still=0;if(still>3){end='stopped';break;}if(s>=C.s0+C.len-20){end='the whole chain';break;}if(t.mlDrowned){end='drowned';break;}}
   return kind+' down the Braids at '+this.f(v*2.237)+' mph: '+Math.round((s-C.s0)*3.281)+' of '+Math.round(C.len*3.281)+' ft ('+end+'), '+this.f(tt)+' s, slowest '+this.f(vmin*2.237)+' fastest '+this.f(vmax*2.237)+' mph, deepest '+this.f(deep)+' m, '+this.f(wave)+' s in water deep enough for the full bow wave, choke '+this.f(t.mlWet||0);},
 cross(kind,sc,v,o){o=o||{};this.sign();__ml.mlRake();const C=__dyb.WG.mlX.chain,A=__dyb.WG.mlA,s=C.s0+sc,q=this.rv(s,0),from=this.rv(s,q.hw+16),to=this.rv(s,-(q.hw+26)),dx=to.u-from.u,dz=to.v-from.v,L=Math.hypot(dx,dz);
   const t=this.put(kind,from.u,from.v,Math.atan2(-dz,dx));let tt=0,still=0,end='time',deep=0,far=0,vmin=99;
   while(tt<(o.secs||120)){const u=t.p[0]-A.x,w=t.p[2]-A.z,d=((u-from.u)*dx+(w-from.v)*dz)/L;far=Math.max(far,d);
     this.inp({thr:Math.max(0,Math.min(1,(v-t.speed)*.5+.15)),steer:this.hold(t,from.u,from.v,dx/L,dz/L)});this.steps(6);tt+=.05;deep=Math.max(deep,__ml.MLS.wd||0);if(tt>2)vmin=Math.min(vmin,t.speed);
     if(t.speed<.3)still+=.05;else still=0;if(still>3){end='stopped';break;}if(d>=L-3){end='across';break;}if(t.mlDrowned){end='drowned';break;}}
   const Z={};__dyb.WG.mlZone(t.p[0]-A.x,t.p[2]-A.z,Z);
   return kind+' across the river '+sc+' m down the chain at '+this.f(v*2.237)+' mph: '+Math.round(far*3.281)+' of '+Math.round(L*3.281)+' ft ('+end+') in '+(Z.slough>.5?'the Sloughs':Z.rv?'the Braids':'the bank')+', deepest '+this.f(deep)+' m, slowest '+this.f(vmin*2.237)+' mph, t '+this.f(tt);},
 /* sink one in the Sloughs (drive in from the left bank until it stops, then spin 4 s), then the other: made on the left bank 14 m behind
    it, strapped, and driven away from the river flat out for secs. Did the sunk one come out? */
 fetch(kind,puller,sc,o){o=o||{};this.sign();__ml.mlRake();const C=__dyb.WG.mlX.chain,A=__dyb.WG.mlA,s=C.s0+(sc||470),q=this.rv(s,0),from=this.rv(s,-(q.hw+18)),to=this.rv(s,0),dx=to.u-from.u,dz=to.v-from.v,L=Math.hypot(dx,dz);
   const t0=this.put(kind,from.u,from.v,Math.atan2(-dz,dx));let tt=0,still=0;
   while(tt<60){this.inp({thr:.7,steer:this.hold(t0,from.u,from.v,dx/L,dz/L)});this.steps(6);tt+=.05;if(t0.speed<.3)still+=.05;else still=0;if(still>4)break;
     const d=((t0.p[0]-A.x-from.u)*dx+(t0.p[2]-A.z-from.v)*dz)/L;if(d>L-6)break;}
   const sunk={ft:Math.round(((t0.p[0]-A.x-from.u)*dx+(t0.p[2]-A.z-from.v)*dz)/L*3.281),stoppedBySelf:still>4,rutCm:Math.round(t0.wheels.reduce((a,w)=>Math.max(a,w.mlZ||0),0)*100)};
   const M=__mlr.MLR,p0=[t0.p[0],t0.p[2]],yb=this.yaw(t0);
   /* the puller, made 13 m behind the sunk one's tail, facing away from the river */
   const bx=t0.p[0]-A.x-dx/L*13,bz=t0.p[2]-A.z-dz/L*13,keep=t0;
   M.fleet=[];M.made=true;const t1=this.put(puller,bx,bz,Math.atan2(dz,-dx),true);M.fleet=[keep];M.other=keep;keep.pt.st='off';keep.mlStuck=true;M.rescue=__dyb.GAME.time+240;
   this.inp({hb:1});this.steps(120);__mlr.mlrPick(t1);const R=__mlr.mlrReach(t1,keep);M.can='STRAP';const ok=__mlr.mlrHookUp();
   let peak=0,t2=0;while(t2<(o.secs||25)){this.inp({thr:o.thr||1,steer:this.hold(t1,bx,bz,-dx/L,-dz/L)});this.steps(6);t2+=.05;if(M.strap)peak=Math.max(peak,M.strap.T);else if(t2>2)break;}
   const moved=Math.hypot(keep.p[0]-p0[0],keep.p[2]-p0[1]);
   return kind+' sunk '+sunk.ft+' ft into the Sloughs (ruts '+sunk.rutCm+' cm, '+(sunk.stoppedBySelf?'stopped itself':'driven to the middle')+'); the '+puller+' strapped on ('+(ok?'hooked, reach '+this.f(R.d)+' m':'NO HOOK, reach '+this.f(R.d))+'): pulled it '+Math.round(moved*3.281)+' ft in '+this.f(t2)+' s, peak pull '+Math.round(peak/4.448)+' lb, strap '+(M.strap?'on':'off');}
};
