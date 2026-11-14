window.T9=/* Mud Lab test drivers (tools/test/ml-pits.py, ml-rescue.py): put a SUV somewhere, drive a hole, a trail, bog it, tow it, winch it. Physics only. */{
 sgn:0,
 f:v=>+v.toFixed(2),
 inp(o){__dyb.setTestInput(Object.assign({steer:0,thr:0,brk:0,hb:0,nos:false},o));},
 steps(n){for(let i=0;i<n;i++)__dyb.step(1/120);},
 yaw(t){return Math.atan2(-t.M[6],t.M[0]);},
 /* a vehicle made new at u,v (the world's own coordinates), facing yaw; mode: stock 'AWD'|'4 HI'|'4 LO', crawler 'open'|'lock'|'low' */
 /* (the game's dice are set the same at the start of every drive, so a drive doesn't depend on the ones before it: the
    clods a tyre throws are rolled for, and where they land changes the ground; T9.seedN picks another set) */
 put(kind,u,v,yaw,mode){const D=__dyb,A=D.WG.mlA;__game.FX.length=0;this.inp({hb:1});if(window.__seed)__seed((this.seedN||1)*7919+13);
   if(window.__mlr&&__mlr.testClear)__mlr.testClear();
   __mlsv.mlSuvIdx('stock');__mlsv.mlSuvIdx('crawler');__game.spawnCar(this.bigOn&&__mlsv.MLSV.big?(__mlsv.MLSV.big[kind]=true,__mlsv.mlSuvIdx(kind)):(__mlsv.MLSV.big&&(__mlsv.MLSV.big[kind]=false),__mlsv.MLSV.tune&&__mlsv.MLSV.tune[kind]?__mlsv.mlSuvIdx(kind):__mlsv.MLSV.bi[kind]),A.x+u,A.z+v,yaw);__mlsv.MLSV.pick=kind;__game.FX.length=0;this.steps(240);
   const t=D.GAME.car;
   /* (Mud Lab 19: the engine gives a new car the engine state of the one before it, and a drive that ended drowned in
      the Lake left that "off") */
   if(t.pt.st==='off'){t.pt.st='run';t.pt.we=t.pt.e.idle*2*Math.PI/60;}
   if(kind==='stock'){let g=0;while(__mlsv.mlMode(t)!==(mode||'4 HI')&&g++<4)__mlsv.mlLow(t);}
   else{if(mode==='lock'||mode==='low'||!mode){t.locked=true;const d=t.c.diff;if(d.can.r){d.rLock=true;if(d.can.f)d.fLock=true;}}if(mode==='low')__mlsv.mlLow(t);}
   return t;},
 /* (Mud Lab 17) a tune ('' as it came), then: what the vehicle is (from the vehicle itself), a flat-out run from rest on
    the Heron's strip (firm, 400 m: seconds to 30 and to 60 mph, mph after 8 s, wheelspin at its worst) */
 tune(kind,id){__mlsv.MLSV.tune[kind]=id||'';return id||'as it came';},
 spec(kind,mode){const t=this.put(kind,-470,-300,.6,mode),e=t.pt.e,d=t.c.diff;return {tune:__mlsv.mlTuneOf(kind).name,hp:Math.round(e.peak.hp),lbft:Math.round(e.peak.tq*.7376),redline:e.redline,gears:e.gears.length,first:e.gears[0],axle:e.fd,low:d.lowK,kg:Math.round(t.c.mass),lockers:!!(d.can&&d.can.r),nos:!!e.nosKw};},
 accel(kind,mode,thr){this.sign();const t=this.put(kind,-50,690,0,mode),y0=this.yaw(t);let tt=0,t30=null,t60=null,slip=0;
   while(tt<8){let e=y0-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;this.inp({thr:thr||1,steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});this.steps(6);tt+=.05;const mph=t.speed*2.237;
     if(t30===null&&mph>=30)t30=+tt.toFixed(2);if(t60===null&&mph>=60)t60=+tt.toFixed(2);for(const w of t.wheels)if(w.contact)slip=Math.max(slip,Math.abs(w.w*w.R-w.vl)*2.237);}
   return {to30:t30,to60:t60,mphAt8s:+(t.speed*2.237).toFixed(1),worstSpinMph:Math.round(slip)};},
 /* (Mud Lab 17) CLEAR ALL RUTS under a SUV that is sunk in: drive into the Bog until stopped, clear, and watch it for 3 s:
    how deep the tyres were, how far the body rose, the fastest it went up, whether it stayed on its wheels */
 clearUnder(kind,mode){this.sign();const B=__dyb.WG.mlBog,A=__dyb.WG.mlA;__ml.mlRake();const t=this.put(kind,B.u0-20,B.v,0,mode);let tt=0;
   while(tt<14){let e=-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;this.inp({thr:.8,steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});this.steps(12);tt+=.1;}
   this.inp({hb:1});this.steps(120);const deep=__ml.mlStats().deepestCm,y0=t.p[1];let sunk=0;for(const w of t.wheels)sunk=Math.max(sunk,w.mlZ||0);
   __mlm.mlmPick('rake');let up=0,vy=0,air=0;for(let i=0;i<360;i++){this.steps(1);up=Math.max(up,t.p[1]-y0);vy=Math.max(vy,t.v[1]);if(!t.wheels.some(w=>w.contact))air++;}
   return kind+': ruts '+deep+' cm, a tyre '+Math.round(sunk*100)+' cm down; cleared: rose '+(up*100).toFixed(0)+' cm at most, '+vy.toFixed(2)+' m/s up at its fastest, '+(air/120).toFixed(2)+' s with no wheel on the ground, ends '+((t.p[1]-y0)*100).toFixed(0)+' cm higher, '+(t.M[4]>.7?'upright':'NOT upright')+', ruts now '+__ml.mlStats().deepestCm+' cm';},
 /* (Mud Lab 19) straight across water from a spot (u, v), heading yaw, until it is `far` m from where it started, has
    stood still for 4 s, or secs are up. Holds o.v m/s (4: about 9 mph) unless o.thr gives a fixed throttle. Says how far
    it got, the deepest water over the ground under it, its slowest once wet, how far a tyre sank, and whether the engine
    drowned and with how much water over the roof */
 cross(kind,mode,u,v,yaw,far,o){o=o||{};this.sign();__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),x0=t.p[0],z0=t.p[2];let tt=0,deep=0,vmin=99,wet=false,still=0,sunk=0,dAt=null,over=0;
   const dist=()=>Math.hypot(t.p[0]-x0,t.p[2]-z0),vT=o.v||4,S=__ml.MLS;
   while(tt<(o.secs||70)){let e=yaw-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     this.inp({thr:o.thr?o.thr:Math.max(0,Math.min(1,(vT-t.speed)*.6+.15)),steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});this.steps(12);tt+=.1;
     const wd=S.wd||0;if(wd>.05)wet=true;deep=Math.max(deep,wd);if(wet)vmin=Math.min(vmin,t.speed);for(const w of t.wheels)sunk=Math.max(sunk,w.mlZ||0);
     if(t.mlDrowned&&dAt===null)dAt=dist();if(t.mlDrowned)over=Math.max(over,wd-(t.c.hcg||.7)-1);
     if(dist()>far)break;if(tt>3&&t.speed<.1)still+=.1;else still=0;if(still>(t.mlDrowned?9:4))break;}
   const r={kind,mode:mode||'',gotM:this.f(dist()),across:dist()>far,deepestWaterCm:Math.round(deep*100),slowestMph:this.f(vmin===99?t.speed*2.237:vmin*2.237),tyreSankCm:Math.round(sunk*100),secs:this.f(tt)};
   if(dAt!==null){r.drownedAtM=this.f(dAt);r.waterNowCm=Math.round((S.wd||0)*100);r.engine=t.pt.st;r.upright=t.M[4]>.7;}return r;},
 /* (Mud Lab 19) THE SKY-YANK, kept on purpose (his words, 13 Nov 2026: "It might technically be a bug, but it's a bug
    that's staying"): with the pull test's line still on the post, get in the other SUV: the line is now on that one,
    far too short, and it is thrown at the post. Here: the Rock & Mud hooked at the post, the stock SUV standing `far` m
    east of it; GET IN; 6 s of physics. Says how fast and how high the SUV you got into went, and how far it flew */
 yank(far){this.sign();const A=__dyb.WG.mlA,P=__mlb.MLB_POST(),t=this.put('crawler',P.x-A.x+6,P.z-A.z,0,'lock'),M=this.R();
   M.other=__mlr.mlrMake('stock',{x:P.x+(far||60),z:P.z,yaw:0});M.made=true;M.rescue=1e9;this.go({},1);const hooked=__mlb.mlbPullHook(t),line=!!M.pull;
   const sat=__mlr.mlrSeat(),n=__dyb.GAME.car,x0=n.p[0],z0=n.p[2],y0=n.p[1];let vmax=0,up=0,far2=0,air=0;
   for(let i=0;i<720;i++){this.steps(1);vmax=Math.max(vmax,Math.hypot(n.v[0],n.v[1],n.v[2]));up=Math.max(up,n.p[1]-y0);far2=Math.max(far2,Math.hypot(n.p[0]-x0,n.p[2]-z0));if(!n.wheels.some(w=>w.contact))air++;}
   return {hookedAtThePost:hooked&&line,gotInTheOther:sat,in:__mlsv.mlSuvKind?__mlsv.mlSuvKind(n):'',lineStillOn:!!M.pull,fastestMph:Math.round(vmax*2.237),highestM:this.f(up),flewM:this.f(far2),secsOffTheGround:this.f(air/120)};},
 /* (Mud Lab 19) a lap of the Track at a steady speed (o.v m/s; it lifts for the bends: no faster than a bend of that
    radius takes at .7 g), following its middle line. Says the lap time, and for each thing built on it (and each bend
    tighter than 45 m) what happened there: the slowest and fastest it went, how long it was off the ground, how far it
    leaned, how far off the middle it got; and where it ended if it didn't get round, and whether on its wheels */
 lap(kind,mode,o){o=o||{};this.sign();__ml.mlRake();const X=__dyb.WG.mlX,T=X.track,P=T.pts,A=__dyb.WG.mlA,n=P.length-1,vT=o.v||11,i0=o.from||0;
   const t=this.put(kind,P[i0][0],P[i0][1],Math.atan2(-(P[i0+2][1]-P[i0][1]),P[i0+2][0]-P[i0][0]),mode);let i=i0+2,tt=0,still=0,air=0,airNow=0,lean=0;
   const marks=T.feats.map(F=>({what:F[1],at:F[0],to:F[0]+(F[1]==='table'?2*F[2]+F[3]:F[1]==='whoops'?F[2]*F[3]:F[1]==='kicker'?F[2]+3:F[2]+F[4])+25})),seen=marks.map(m=>({what:m.what+' at '+m.at+' m',min:99,max:0,air:0,lean:0,off:0}));
   const out={kind,mode:mode||'',holding:Math.round(vT*2.237)+' mph'};
   while(tt<(o.secs||500)){const u=t.p[0]-A.x,v=t.p[2]-A.z;while(i<n&&Math.hypot(P[i][0]-u,P[i][1]-v)<9)i++;
     if(i>=n&&Math.hypot(P[n][0]-u,P[n][1]-v)<10){out.lap=this.f(tt)+' s';break;}
     const q=P[i],want=Math.atan2(-(q[1]-v),q[0]-u);let e=want-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     let k=0;for(let d=0;d<6&&i+d<n;d++)k=Math.max(k,Math.abs(P[i+d][3]));const vB=Math.min(vT,Math.sqrt(6.9/Math.max(k,1e-4)));
     this.inp({thr:Math.max(0,Math.min(1,(vB-t.speed)*.5+.12)),brk:t.speed>vB+2.5?Math.min(1,(t.speed-vB-2.5)*.3):0,steer:Math.max(-1,Math.min(1,this.sgn*e*1.8))});this.steps(6);tt+=.05;
     const off=!t.wheels.some(w=>w.contact),ln=Math.acos(Math.max(-1,Math.min(1,t.M[4])))*57.3,pa=P[Math.max(0,i-1)],pb=P[i],sA=pa[2],ex=pb[0]-pa[0],ez=pb[1]-pa[1],dm=Math.abs(ex*(v-pa[1])-ez*(u-pa[0]))/(Math.hypot(ex,ez)||1);
     marks.forEach((m,j)=>{if(sA>=m.at-6&&sA<=m.to){const S=seen[j];S.min=Math.min(S.min,t.speed*2.237);S.max=Math.max(S.max,t.speed*2.237);if(off)S.air+=.05;S.lean=Math.max(S.lean,ln);S.off=Math.max(S.off,dm);}});
     lean=Math.max(lean,ln);if(tt>4&&t.speed<.2)still+=.05;else still=0;if(still>3||ln>75&&t.speed<1){out.stoppedAt=Math.round(sA)+' m round';out.onItsWheels=t.M[4]>.7;break;}}
   out.mostLean=Math.round(lean)+' deg';out.things=seen.filter(S=>S.max>0).map(S=>S.what+': '+S.min.toFixed(0)+' to '+S.max.toFixed(0)+' mph, '+S.air.toFixed(2)+' s in the air, leaned '+S.lean.toFixed(0)+' deg, '+S.off.toFixed(1)+' m off the middle');return out;},
 /* (Mud Lab 19) into the Lake until the engine drowns, 8 s for the cab to fill, then the winch to the nearest tree
    for up to secs: what the game offered, how long the line was, and second by second how far from where it drowned,
    how deep the water is over the ground under it, the line's pull, the engine */
 lakeOut(kind,mode,u,v,yaw,secs){this.sign();__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),S=__ml.MLS,M=this.R();let tt=0;
   while(tt<40&&!t.mlDrowned){let e=yaw-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;this.inp({thr:Math.max(0,Math.min(1,(3-t.speed)*.6+.15)),steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});this.steps(12);tt+=.1;}
   if(!t.mlDrowned)return {kind,drowned:false,waterCm:Math.round((S.wd||0)*100)};
   this.go({},8);const x0=t.p[0],z0=t.p[2],out={kind,drownedAfter:this.f(tt)+' s',waterOverTheGroundCm:Math.round(S.wd*100),waterOverTheRoofCm:Math.round((S.wd-(kind==='stock'?1.72:2.1))*100),engine:t.pt.st,tyresDownCm:Math.round(Math.max(...t.wheels.map(w=>w.mlZ||0))*100)};
   M.stuck=true;M.treeT=-9;this.go({},.3);out.offered=this.st().can;out.trees=this.trees();const ok=__mlr.mlrHookUp();out.hooked=ok&&!!M.winch;if(!M.winch)return out;out.lineM=this.f(M.winch.len);out.pull=[];
   for(let i=0;i<(secs||60);i++){M.stuck=true;this.go({},1);const W=M.winch;if(i%4===3||!W)out.pull.push((i+1)+' s: '+Math.hypot(t.p[0]-x0,t.p[2]-z0).toFixed(1)+' m, water '+Math.round((S.wd||0)*100)+' cm, '+(W?(W.T/1000).toFixed(0)+' kN, line '+W.len.toFixed(1)+' m':'line off')+', engine '+t.pt.st);if(!W)break;}
   out.upright=t.M[4]>.7;return out;},
 /* (Mud Lab 19) every ford of the River with both SUVs: the Shallows at three places, then each riffle up and down the
    river from there (s: metres down the river from the north edge), from the bank on the right looking downstream,
    straight across at a steady 9 mph (T9.cross) */
 fordList:[['the Shallows, middle',1700],['the Shallows, north end',1440],['the Shallows, south end',1980],['first ford north',1148],['second ford north',645],['third ford north',250],['first ford south',2083],['second ford south',2420],['third ford south',2810]],
 ford(k,kind,mode){const R=__dyb.WG.mlX.rivers[0],[name,sWant]=this.fordList[k];let s=0;for(let i=0;i<R.length-1;i++){const a=R[i],b=R[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
     if(s+L>=sWant){const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L,nx=-tz,nz=tx,d=a[2]*1.12+12;return Object.assign({ford:name},this.cross(kind,mode,a[0]+nx*d,a[1]+nz*d,Math.atan2(nz,-nx),2*d+6));}s+=L;}},
 /* (Mud Lab 20) CHURNING IN DEEP MUCK: DOES IT POP UP OUT OF THE WATER? His words, 13 Nov 2026: "When you're in very
    mucky stuff and you're moving the soil around beneath the SUV, sometimes the SUV can pop up out of the water kind of
    intensely." Into the water from u,v facing yaw at 0.6 throttle until it stops gaining ground (25 s at most), then
    secs of rocking flat out: 3 s forward on full throttle with the wheel swung from side to side, 2 s on the brake
    (which backs it up), and round again. Watched 20 times a second: how far its middle rose above where it stood when
    it stopped, the fastest it rose, how long all four tyres were off the ground at once, how far its sills came out of
    the water, and the five sharpest moments */
 fordAt(k){const R=__dyb.WG.mlX.rivers[0],[name,sWant]=this.fordList[k];let s=0;for(let i=0;i<R.length-1;i++){const a=R[i],b=R[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
     if(s+L>=sWant){const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L,nx=-tz,nz=tx,d=a[2]*1.12+12;return {name,u:a[0]+nx*d,v:a[1]+nz*d,yaw:Math.atan2(nz,-nx)};}s+=L;}},
 /* (a place on the River's bank s metres down it from the north edge, on its right bank looking downstream (side 1) or
    its left (-1), facing across) */
 riverAt(sWant,side){const R=__dyb.WG.mlX.rivers[0];let s=0;side=side||1;for(let i=0;i<R.length-1;i++){const a=R[i],b=R[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
     if(s+L>=sWant){const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L,nx=-tz*side,nz=tx*side,d=a[2]*1.12+12;return {name:'the River '+sWant+' m down',u:a[0]+nx*d,v:a[1]+nz*d,yaw:Math.atan2(nz,-nx)};}s+=L;}},
 churn(kind,mode,u,v,yaw,secs,o){o=o||{};this.sign();__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),S=__ml.MLS,A=__dyb.WG.mlA,f=this.f;let tt=0,best=0,still=0;const x0=t.p[0],z0=t.p[2];
   while(tt<(o.inSecs||25)&&still<1.5){let e=yaw-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;this.inp({thr:o.inThr||.6,steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});this.steps(6);tt+=.05;
     const d=Math.hypot(t.p[0]-x0,t.p[2]-z0);if(d>best+.02){best=d;still=0;}else still+=.05;if(o.inM&&d>=o.inM)break;}
   const out={kind,mode:mode||'',wentInM:f(best),waterCm:Math.round((S.wd||0)*100),liftAtStopPct:Math.round((S.buoy||0)/((t.c.mass||2500)*9.81)*100),engineAtStop:t.pt.st},y0=t.p[1],clr=t.__mlClr||.5,hcg=t.c.hcg||.7,top=[];let rise=-9,vy=0,air=0,airMax=0,airNow=0,sill=-9,roll=0,q=0,deep=-9,deepAt='',acc=0,vPrev=t.v[1];
   const cyc=(o.fwd||3)+(o.back||2);while(q<secs){const ph=q%cyc,fwd=ph<(o.fwd||3);this.inp(fwd?{thr:1,steer:Math.sin(q*2.1)*(o.swing||.7)}:{brk:t.rev?1:.7,steer:o.wild?Math.sin(q*1.3)*.8:0});this.steps(6);q+=.05;
     const wl=__ml.mlWL(t.p[0],t.p[2])+S.h0,r=t.p[1]-y0,off=!t.wheels.some(w=>w.contact),sl=t.p[1]-hcg+clr-wl;
     if(off){air+=.05;airNow+=.05;airMax=Math.max(airMax,airNow);}else airNow=0;rise=Math.max(rise,r);if((S.wd||0)>=.7&&sl>deep){deep=sl;deepAt=f(q)+' s, in '+Math.round(S.wd*100)+' cm of water';}acc=Math.max(acc,(t.v[1]-vPrev)/.05/9.81);vPrev=t.v[1];vy=Math.max(vy,t.v[1]);sill=Math.max(sill,sl);roll=Math.max(roll,Math.acos(Math.max(-1,Math.min(1,t.M[4])))*57.3);
     if(t.v[1]>1.2||r>.5){top.push([t.v[1],f(q)+' s: rising '+t.v[1].toFixed(1)+' m/s, '+Math.round(r*100)+' cm up, sills '+Math.round(sl*100)+' cm '+(sl>0?'out of':'under')+' the water, lift '+Math.round((S.buoy||0)/((t.c.mass||2500)*9.81)*100)+'% of its weight, engine '+t.pt.st+(off?', all four tyres off the ground':'')]);}}
   top.sort((a,b)=>b[0]-a[0]);
   return Object.assign(out,{sillsOverDeepWaterCm:deep>-9?Math.round(deep*100):null,when:deepAt,hardestKickG:f(acc),roseCm:Math.round(rise*100),fastestRiseMs:f(vy),sillsOutOfWaterCm:Math.round(sill*100),allFourOffS:f(air),longestOffS:f(airMax),mostLeanDeg:Math.round(roll),waterAtEndCm:Math.round((S.wd||0)*100),engine:t.pt.st,upright:t.M[4]>.7,sharpest:top.slice(0,5).map(x=>x[1])});},
 /* (Mud Lab 20) EVERY NAME ON THE MAP: where JUMP sets the SUV down (how far from the name, the water under it, on its
    wheels, what the corner of the screen calls the place) and where the guide arrow leads */
 jumps(){const V=__mlv,A=__dyb.WG.mlA,S=__ml.MLS,out=[];__ml.mlRake();this.put('crawler',0,630,0,'lock');
   for(const p of V.mlvPlaces()){if(p.kind==='heron'||p.kind==='suv')continue;V.mlvJump(p);this.inp({hb:1});this.steps(300);const t=__dyb.GAME.car,g=V.mlvGuideTo(p),Z={};__dyb.WG.mlZone(g.x-A.x,g.z-A.z,Z);
     out.push(p.name+': '+Math.round(Math.hypot(t.p[0]-A.x-p.u,t.p[2]-A.z-p.v))+' m from its name, water '+Math.round(Math.max(0,S.wd||0)*100)+' cm, '+(t.M[4]>.9?'upright':'LEANING '+Math.round(Math.acos(t.M[4])*57.3)+' deg')+', "'+__ml.mlStats().here.place+'"'+(p.kind==='jump'?', facing '+Math.round(-this.yaw(t)*57.3)+' deg (east 0, south 90)':'')+'; arrow: '+(Z.wl>Z.h-.02?'WATER '+Math.round((Z.wl-Z.h)*100)+' cm':'dry')+', '+Math.round(Math.hypot(g.x-A.x-p.u,g.z-A.z-p.v))+' m from its name');}
   return out;},
 /* what the SUV you are in has had to do with water: the most its intake has been under (cm; negative: never under),
    whether the engine is missing now, drowned, the cab's water */
 wet(){const t=__dyb.GAME.car;return {intakeUnderAtMostCm:Math.round((t.mlOverMax===undefined?-9.99:t.mlOverMax)*100),missing:this.f(t.mlWet||0),drowned:!!t.mlDrowned,cab:this.f(t.mlFlood||0),engine:t.pt.st};},
 /* INTO DEEP WATER UNDER ITS OWN POWER from u,v facing yaw, at about 8 mph, watched ten times a second: when the engine
    first missed and how far out, how low the revs sagged, when it died; what the screen said, in order. Then (how):
    'winch': what the game offers once it lies there, the line hooked, the pull second by second;
    'reset': RESET, and where that leaves it;
    'back': at the first miss the driver backs out: does it clear? */
 drown(kind,mode,u,v,yaw,how,o){o=o||{};this.sign();__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),S=__ml.MLS,M=this.R(),f=this.f,A=__dyb.WG.mlA,x0=t.p[0],z0=t.p[2],seen=new Set(),said=[];t.mlOverMax=-9;
   let tt=0,miss=null,dead=null,rpmLo=1e9,rpmHi=0,backing=false,cleared=null;const dist=()=>Math.hypot(t.p[0]-x0,t.p[2]-z0),hear=()=>{for(const m of __dyb.GAME.msgs)if(!seen.has(m.t)){seen.add(m.t);said.push(f(tt)+' s: '+m.t);}};
   while(tt<(o.secs||50)){let e=yaw-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     if(backing)this.inp({brk:t.rev?.8:.7,steer:0});else this.inp({thr:Math.max(0,Math.min(1,((o.v||3.6)-t.speed)*.6+.15)),steer:Math.max(-1,Math.min(1,this.sgn*e*1.6))});
     this.steps(12);tt+=.1;hear();
     if(t.mlWet>0&&!miss){miss={t:tt,m:dist(),w:S.wd};if(how==='back')backing=true;}
     if(miss&&!dead&&t.pt.st==='run'){rpmLo=Math.min(rpmLo,t.pt.rpm);rpmHi=Math.max(rpmHi,t.pt.rpm);}
     if(t.mlDrowned&&!dead)dead={t:tt,m:dist(),w:S.wd};
     if(backing&&miss&&!(t.mlWet>0)&&!t.mlDrowned&&cleared===null)cleared=tt;
     if(dead&&tt-dead.t>(o.after||9))break;if(backing&&cleared!==null&&tt-cleared>3)break;if(!miss&&tt>30)break;}
   const out={kind,mode:mode||'',how};
   if(!miss){out.never='the intake never went under: at most '+Math.round((t.mlOverMax||0)*100)+' cm';out.waterCm=Math.round((S.wd||0)*100);out.wentM=f(dist());return out;}
   out.firstMiss=f(miss.t)+' s in, '+f(miss.m)+' m out, in '+Math.round(miss.w*100)+' cm of water';
   if(dead){out.died=f(dead.t)+' s in, '+f(dead.m)+' m out, in '+Math.round(dead.w*100)+' cm of water';out.chokedForS=f(dead.t-miss.t);}else out.died='no';
   if(rpmHi>0)out.revsWhileMissing=Math.round(rpmLo)+' to '+Math.round(rpmHi)+' rpm';
   if(how==='back'){out.backedOut=cleared!==null?'cleared '+f(cleared-miss.t)+' s after the first miss':'did not clear';out.engine=t.pt.st;out.endedM=f(dist());out.said=said;return out;}
   this.go({},.5);hear();out.lies=f(dist())+' m out in '+Math.round((S.wd||0)*100)+' cm of water, '+(t.M[4]>.7?'on its wheels':'not upright')+', tyres '+Math.round(Math.max(...t.wheels.map(w=>w.mlZ||0))*100)+' cm into the bed';
   out.stuck=M.stuck;out.offered=M.can||'nothing';const T=__mlr.mlrTree(t),Sh=__mlr.mlrShore(t);out.tree=T?f(T.d)+' m '+(T.end>0?'ahead':'behind'):'none in reach';out.bank=Sh?f(Sh.d)+' m '+(Sh.end>0?'ahead':'behind'):'none in reach';
   if(how==='reset'){__mlr.reset();this.go({hb:1},2.5);hear();const Z={};__dyb.WG.mlZone(t.p[0]-A.x,t.p[2]-A.z,Z);const c=__dyb.GAME.car;
     out.afterReset=f(Math.hypot(c.p[0]-x0,c.p[2]-z0))+' m from where it started, water '+Math.round(Math.max(0,S.wd||0)*100)+' cm, '+(c.M[4]>.9?'upright':'not upright')+', engine '+c.pt.st+', "'+__ml.mlStats().here.place+'"';out.said=said;return out;}
   if(M.can!=='WINCH'){out.said=said;return out;}
   const ok=__mlr.mlrHookUp();hear();out.hooked=ok&&!!M.winch;if(!M.winch){out.said=said;return out;}out.lineM=f(M.winch.len);out.to=M.winch.shore?'a ground anchor on the bank':'a tree';out.pull=[];let peak=0,caught=null,dry=null;const d0=dist();
   for(let i=0;i<(o.pullSecs||90);i++){this.go({},1);tt+=1;hear();const W=M.winch;if(W)peak=Math.max(peak,W.T);if(caught===null&&t.pt.st==='run')caught=i+1;if(dry===null&&!((S.wd||0)>.05))dry=i+1;
     if(i%5===4||!W)out.pull.push((i+1)+' s: '+Math.abs(dist()-d0).toFixed(1)+' m, water '+Math.round(Math.max(0,S.wd||0)*100)+' cm, '+(W?(W.T/1000).toFixed(0)+' kN':'line off')+', engine '+t.pt.st+', lift '+Math.round((S.buoy||0)/((t.c.mass||2500)*9.81)*100)+'%');if(!W)break;}
   /* (the line is off: eight seconds more, for an engine about to catch) */
   for(let i=0;i<8;i++){this.go({},1);tt+=1;hear();if(caught===null&&t.pt.st==='run')caught='line off + '+(i+1);if(dry===null&&!((S.wd||0)>.05))dry='line off + '+(i+1);}out.endsIn=Math.round(Math.max(0,S.wd||0)*100)+' cm of water, engine '+t.pt.st;
   out.engineRanAgainAfterS=caught;out.outOfTheWaterAfterS=dry;out.hardestPullKN=Math.round(peak/1000);out.upright=t.M[4]>.7;out.said=said;return out;},
 /* (Mud Lab 21) HOW FAST DOES IT GET? Flat out from a stand at u,v along yaw, held straight: its speed (mph) every
    `every` m for `far` m, the time to get there, and whether it stayed on the ground */
 dash(kind,mode,u,v,yaw,far,every,o){o=o||{};this.sign();__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),x0=t.p[0],z0=t.p[2],f=this.f,marks=[];let tt=0,next=every||50,top=0;
   while(tt<(o.secs||60)){let e=yaw-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;this.inp({thr:1,steer:Math.max(-1,Math.min(1,this.sgn*e*(o.gain||1.2)))});this.steps(6);tt+=.05;
     const d=Math.hypot(t.p[0]-x0,t.p[2]-z0);top=Math.max(top,t.speed);while(d>=next){marks.push(next+' m: '+Math.round(t.speed*2.237)+' mph, '+f(tt)+' s');next+=every||50;}if(d>=far)break;}
   return {kind,mode:mode||'',tyres:this.bigOn?'a size up':'standard',topMph:Math.round(top*2.237),gear:t.pt.gear,rpm:Math.round(t.pt.rpm),upright:t.M[4]>.7,marks};},
 /* (Mud Lab 21) A JUMP, DRIVEN: from `from` m back from the lip (the start of the run-up if not said), along the lane,
    flat out or held at o.mph; o.back: the other way (side B to side A). What it reports: how fast it left the lip, the
    longest time all four wheels were off the ground, how far it went in that time (lip to touchdown, ft) and how high over
    where it left, how fast it was falling at touchdown, its nose and its lean at touchdown (degrees), whether it stayed
    on its wheels, how many more times it left the ground after, where it stopped (m past the far lip: under 0 is in
    the gap), what that place is called, and whether the engine took in water */
 jump(kind,mode,name,o){o=o||{};this.sign();__ml.mlRake();const D=__dyb,X=D.WG.mlX,J=X.jumps.find(j=>j.name===name),A=D.WG.mlA,bk=o.back?-1:1,S=bk>0?J.A:J.B,
     from=Math.min(o.from||1e9,S.far-14),tx=J.dx*bk,tz=J.dz*bk,u0=J.u-tx*(J.g+from),v0=J.v-tz*(J.g+from),yaw0=Math.atan2(-tz,tx),t=this.put(kind,u0,v0,yaw0,mode),f=this.f;
   let tt=0,air=0,a0=null,main=null,lip=0,hops=0,landed=0,minUp=1,stopT=0,topMph=0;const tgt=o.mph?o.mph/2.237:1e9,far=bk>0?J.B:J.A;
   while(tt<(o.secs||80)){const pu=t.p[0]-A.x,pv=t.p[2]-A.z,s=(pu-J.u)*tx+(pv-J.v)*tz,w=(pu-J.u)*-tz+(pv-J.v)*tx,on=t.wheels.some(q=>q.contact),sp=t.speed;
     const c=Math.max(-.35,Math.min(.35,w*.05)),ddx=tx+tz*c,ddz=tz-tx*c;let e=Math.atan2(-ddz,ddx)-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
     const st=on?Math.max(-1,Math.min(1,this.sgn*e*(o.gain||1.2))):0;
     if(!landed)this.inp({thr:sp<tgt?Math.max(0,Math.min(1,.2+(tgt-sp)*.5)):0,brk:sp>tgt+1.5?.3:0,steer:st});else this.inp({thr:0,brk:o.coast?0:1,steer:st});
     this.steps(6);tt+=.05;topMph=Math.max(topMph,sp*2.237);minUp=Math.min(minUp,t.M[4]);
     if(on){if(a0){const d=Math.hypot(t.p[0]-a0.x,t.p[2]-a0.z);
         /* (the jump itself: the first time off the ground for a third of a second or more, from the ramp or past it) */
         if(air>=.3&&a0.s>-J.g-S.len-2){if(!main)main={air,ft:d*3.281,up:a0.top-a0.y,mph:a0.mph,s0:a0.s,s1:s,vDown:-a0.vy*2.237,nose:Math.asin(Math.max(-1,Math.min(1,t.M[3])))*57.3,lean:Math.asin(Math.max(-1,Math.min(1,t.M[5])))*57.3};else hops++;landed=1;}
         a0=null;air=0;}
       if(!landed&&s<-J.g+2)lip=sp*2.237;}
     else{if(!a0)a0={x:t.p[0],z:t.p[2],y:t.p[1],top:t.p[1],s,mph:sp*2.237,vy:0};air+=.05;a0.top=Math.max(a0.top,t.p[1]);a0.vy=Math.min(a0.vy,t.v[1]);}
     if(landed){stopT+=.05;if(sp<.5&&on&&stopT>1.5||stopT>(o.after||16))break;}
     if(!landed&&s>J.g+far.far+30)break;}
   const pu=t.p[0]-A.x,pv=t.p[2]-A.z,sEnd=(pu-J.u)*tx+(pv-J.v)*tz,W=this.wet(),m=main||{};
   return {jump:name+(o.back?' (back)':''),kind,mode:mode||'',from:Math.round(from),heldMph:o.mph||'flat out',topMph:Math.round(topMph),lipMph:Math.round(m.mph||lip),airS:f(m.air||0),feet:Math.round(m.ft||0),upFt:f((m.up||0)*3.281),
     tookOffPastLip:m.s0===undefined?null:f(m.s0+J.g),cameDownPastFarLip:m.s1===undefined?null:f(m.s1-J.g),neverCameDownOnGround:!main&&!!a0,fallingMph:Math.round(m.vDown||0),noseDeg:Math.round(m.nose||0),leanDeg:Math.round(m.lean||0),
     onItsWheels:t.M[4]>.7,leastUpright:f(minUp),hopsAfter:hops,stoppedPastFarLip:Math.round(sEnd-J.g),offLine:f((pu-J.u)*-tz+(pv-J.v)*tx),place:D.WG.mlPlace(pu,pv),drowned:W.drowned,missing:W.missing,endMph:Math.round(t.speed*2.237),said:window.__mlm&&__mlm.MLJ?__mlm.MLJ.last:null,best:window.__mlm&&__mlm.MLJ?JSON.stringify(__mlm.MLJ.best):null,lines:(__dyb.GAME.msgs||[]).map(m=>m.t)};},
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
/* Mud Lab 11: the tyre size up (T9.bigOn=true before a drive), and the pond's bank */
Object.assign(T9,{bigOn:false,
 facts(kind){const t=this.put(kind,0,620,0);this.go({},1);const c=t.c;return kind.slice(0,5)+(this.bigOn?' big':' std')+': tyre R '+c.R+' W '+c.tyreW+' tread '+c.tread+', '+Math.round(t.m)+' kg, sills '+this.f(t.__mlClr*100)+' cm';},
 /* down the pond's bank from its top (the brakes dragging), into the pond; then the winch back up */
 bank(kind){const C=this.cliff(),dx=C.p0[0]-C.p1[0],dz=C.p0[1]-C.p1[1],l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l,Z={};__ml.mlRake();
   /* (the top: back from the rim until the ground stops rising) */
   let top=C.p1,hT=__dyb.WG.mlZone(top[0],top[1],Z).h;for(let d=2;d<40;d+=2){const q=[C.p1[0]-ux*d,C.p1[1]-uz*d],h=__dyb.WG.mlZone(q[0],q[1],Z).h;if(h<hT+.3){break;}top=q;hT=h;}
   const st=[top[0]-ux*6,top[1]-uz*6],t=this.put(kind,st[0],st[1],Math.atan2(-uz,ux)),y0=t.p[1];let tt=0,pit=0,roll=0,vmax=0,up=true;
   while(tt<40){const sp=t.speed;this.inp(sp<2.5?{thr:.25}:{brk:.5});this.steps(12);tt+=.1;pit=Math.max(pit,Math.abs(Math.asin(Math.max(-1,Math.min(1,t.M[3])))*57.3));roll=Math.max(roll,Math.abs(Math.asin(Math.max(-1,Math.min(1,t.M[5])))*57.3));vmax=Math.max(vmax,sp);if(t.M[4]<.5)up=false;if((__ml.MLS.wd||0)>.3)break;}
   const out=[kind+(this.bigOn?' big':'')+': top '+this.f(hT)+' m over the pond, down in '+this.f(tt)+' s, steepest '+this.f(pit)+' deg, leaned '+this.f(roll)+' deg, fastest '+this.f(vmax*2.237)+' mph, upright '+up+', in water '+this.f((__ml.MLS.wd||0)*100)+' cm, dropped '+this.f(y0-t.p[1])+' m'];
   for(let q=0;q<60&&t.speed>.4;q++)this.go({brk:1,hb:1},.5);const M=this.R(),y1=t.p[1];out.push('stopped in '+this.f((__ml.MLS.wd||0)*100)+' cm of water, '+this.f(y0-t.p[1])+' m below the top');M.stuck=true;M.treeT=-9;this.go({hb:1,brk:1},.4);M.stuck=true;M.treeT=-9;this.go({hb:1,brk:1},.1);out.push(this.st().can+' at '+this.st().mph+' mph, trees '+JSON.stringify(this.trees()));__mlr.mlrHookUp();const W=this.st().winch;out.push(W?'line '+W.len+' m '+(W.end>0?'ahead':'behind'):'no line');
   let i=0;for(;i<90;i++){M.stuck=true;const s=this.go({},1);if(!s.winch){out.push('line off after '+(i+1)+' s: '+s.msgs.slice(-1)[0]);break;}}
   out.push('winched up '+this.f(t.p[1]-y1)+' m, upright '+(t.M[4]>.5));return out;}
});
/* ---------- Mud Lab 14: getting out of a hole you've stopped in ---------- */
Object.assign(window.T9,{
 /* stop in the middle of hole k (as run() does), then try to get out one way:
      'floor'  full throttle and hold it
      'ease'   a third of the throttle and hold it
      'rock'   rock it: forward on o.thr (default .7) until it stops gaining, back until it stops gaining, and again
      'dug'    floor it for o.dig seconds first (dig in), then rock
    Out = past either end of the hole. Returns how far it got, how deep the tyres are, and how long it took */
 unstick(kind,k,how,o){o=o||{};this.sign();const H=this.hole(k),dir=o.dir||1,run=o.run||25,cs=Math.cos(H.r),sn=Math.sin(H.r),s0=-(H.L+run)*dir;
   __ml.mlRake();const t=this.put(kind,H.u+cs*s0,H.v+sn*s0,dir>0?-H.r:-H.r+Math.PI,o.mode);if(o.air)this.air(o.air);
   const prog=()=>this.at(t,H).s*dir,end=H.L+5,out={kind,k,how};let tt=0;
   while(tt<20&&prog()<(o.stopAt===undefined?-H.L*.1:o.stopAt)){this.inp({thr:o.thrIn||.45,steer:this.steer(t,H,dir)});this.steps(12);tt+=.1;}
   for(let i=0;i<40&&t.speed>.15;i++){this.inp({brk:1});this.steps(12);}
   this.inp({hb:1});this.steps(120);const p0=prog();out.stopAt=this.f(p0);
   const G={n:[0,0,0]},deep=()=>{let z=0,n=0;for(const w of t.wheels){if(!__ml.mlGround(w.cp[0],w.cp[2],G))continue;z+=Math.max(0,__ml.mlBase(w.cp[0],w.cp[2])-(G.y-__ml.MLS.h0));n++;}return n?z/n:0;};
   const done=()=>prog()>end||prog()<-end,secs=o.secs||40;let t2=0,cyc=0,pmax=p0,pmin=p0;
   const hold=(inp,T)=>{let q=0;while(q<T&&!done()){this.inp(Object.assign({steer:this.steer(t,H,dir)},inp));this.steps(12);q+=.1;t2+=.1;pmax=Math.max(pmax,prog());pmin=Math.min(pmin,prog());}};
   if(how==='floor')hold({thr:1},secs);
   else if(how==='ease')hold({thr:o.thr||.33},secs);
   else{if(how==='dug'||how==='dugf')hold({thr:1},o.dig||6);
     /* (a rocking driver: on the gas while it gains ground, off and into reverse the moment it stops gaining) */
     /* (the game's reverse: the brake held half a second at a standstill, then the pedals swap; gas brings it back to
        forward at once. So a leg back is: brake until it stops, hold on, and it goes back) */
     const thr=o.thr||.7,ends=[],feather=how==='feather'||how==='dugf';let fwd=o.first==='back'?false:true;
     while(t2<secs&&!done()){let best=prog()*(fwd?1:-1),still=0,q=0;const min=fwd?.4:1.1;
       /* ('feather': the pedal eased whenever a tyre spins faster than 0.3 m/s over the ground, pressed again when none does:
          the soil is only dug by a tyre slipping more than 0.35 m/s) */
       let ped=feather?(o.ped0||.3):thr;
       while((q<min||still<(o.wait||.4))&&q<(o.leg||5)&&!done()){
         for(let u=0;u<3;u++){if(feather){let sl=0;for(const w of t.wheels)if(w.contact)sl=Math.max(sl,Math.abs(w.w*w.R-w.vl));ped=Math.max(.1,Math.min(thr,ped+(sl>.3?-.1:.04)));}
           this.inp(fwd?{thr:ped,steer:this.steer(t,H,dir)}:{brk:t.rev?ped:.6,steer:0});this.steps(4);}
         q+=.1;t2+=.1;const p=prog()*(fwd?1:-1);if(p>best+.015){best=p;still=0;}else still+=.1;pmax=Math.max(pmax,prog());pmin=Math.min(pmin,prog());}
       ends.push(this.f(prog()-p0));fwd=!fwd;cyc++;}
     out.legs=cyc;out.ends=ends.slice(0,24).join(' ');}
   out.out=done()?(prog()>0?'ahead':'back'):'no';out.secs=this.f(t2);out.reach=this.f(pmin-p0)+' to +'+this.f(pmax-p0);out.deepCm=Math.round(deep()*100);out.waterCm=Math.round((__ml.MLS.wd||0)*100);
   this.inp({hb:1});return out;},
 /* a table of the above: every way for each [kind,hole,mode] */
 unstickAll(L,hows,o){const R=[];if(o&&o.terra!==undefined)__ml.MLS.terra=!!o.terra;for(const q of L)for(const h of hows){const r=this.unstick(q[0],q[1],h,Object.assign({mode:q[2]},o||{}));R.push(q[0]+' '+(q[2]||'')+' hole '+q[1]+' '+h+': '+(r.out==='no'?'STUCK':'out '+r.out)+' in '+r.secs+' s, reach '+r.reach+' m, tyres '+r.deepCm+' cm down'+(r.legs?', '+r.legs+' legs: '+r.ends:''));}return R;}
});
/* ---------- Mud Lab 14: the grading, one table, under either grip (terra true = Soil science) ----------
   part 'easy': the Field Track's six puddles, the stock SUV kept moving at 16 mph (AWD, 4 HI) and stopped then floored
   part 'medium': the Creek Loop's four puddles, the stock SUV kept moving; both fords, each SUV
   part 'hard': the Gumbo Trail's four pits, the Rock & Mud kept moving (locked at 11 mph, low at 7) and stopped then floored
   part 'bog': the Bog's marks */
Object.assign(window.T9,{
 grade(part,terra,seed){this.seedN=seed||1;__ml.MLS.terra=!!terra;const R=[],n=(L,f)=>L.filter(f).length,g=terra?'Soil science':'Game';
   const thru=(kind,ks,o)=>ks.map(k=>this.run(kind,k,'cruise',o)),stop=(kind,ks,o)=>ks.map(k=>this.run(kind,k,'stop',o));
   if(part==='easy'){const K=[13,14,15,16,17,18];
     {let r=[];for(const q of [['AWD',5],['AWD',7],['4 HI',9]])r=r.concat(thru('stock',K,{mode:q[0],v:q[1],run:30}));R.push(g+', easy, stock kept moving (11 and 16 mph in AWD, 20 in 4 HI): through '+n(r,x=>x.through)+' of 18 (slowest '+r.map(x=>Math.round(x.minMph)).join(' ')+' mph)');}
     {const r=stop('stock',K,{mode:'AWD'});R.push(g+', easy, stock AWD stopped then floored: bogged '+n(r,x=>!x.through)+' of 6 (moved '+r.map(x=>x.moved).join(' ')+' m)');}
     {const r=thru('crawler',[14,17],{mode:'lock',v:7});R.push(g+', easy, Rock & Mud kept moving: through '+n(r,x=>x.through)+' of 2');}}
   if(part==='medium'){const K=[0,1,2,3];
     {let r=[];for(const q of [['AWD',5],['AWD',7],['4 HI',9]])r=r.concat(thru('stock',K,{mode:q[0],v:q[1],run:30}));R.push(g+', medium puddles, stock kept moving: through '+n(r,x=>x.through)+' of 12 (slowest '+r.map(x=>Math.round(x.minMph)).join(' ')+' mph)');}
     /* the fords: along the Creek Loop from 12 points before the point nearest each ford to 12 after */
     const P=__dyb.WG.mlTrails[0].pts;for(const F of [['Lower Ford',-24,150],['Upper Ford',282,-48]]){let bi=0,bd=1e9;for(let i=0;i<P.length;i++){const d=Math.hypot(P[i][0]-F[1],P[i][1]-F[2]);if(d<bd){bd=d;bi=i;}}
       for(const q of [['stock','4 LO'],['crawler','lock']]){const r=this.trail(q[0],0,bi-12,bi+12,{mode:q[1],v:5,secs:60,wait:5});R.push(g+', '+F[0]+', '+q[0]+' '+q[1]+': '+(r.done?'across':'stopped'+(r.bogged?' at '+r.bogged:''))+' in '+r.secs+' s, slowest '+r.minMph+' mph, water '+r.water+' cm');}}}
   if(part==='hard'){const K=[7,8,9,10];
     {let r=[];for(const q of [[25,1],[25,.5],[14,.65],[10,.5]])r=r.concat(K.map(k=>this.run('crawler',k,'mom',{run:q[0],thr:q[1]})));R.push(g+', hard, Rock & Mud kept moving (a run at it, half to full throttle): through '+n(r,x=>x.through)+' of 16 (slowest '+r.map(x=>Math.round(x.minMph)).join(' ')+' mph)');}
     {const r=stop('crawler',K,{mode:'lock'});R.push(g+', hard, Rock & Mud stopped then floored: bogged '+n(r,x=>!x.through)+' of 4 (moved '+r.map(x=>x.moved).join(' ')+' m)');}
     {const r=thru('stock',[7,9],{mode:'4 LO',v:5});R.push(g+', hard, stock 4 LO kept moving: through '+n(r,x=>x.through)+' of 2');}}
   if(part==='bog'){for(const q of [['stock','AWD',.6],['stock','AWD',1],['stock','4 LO',.6],['crawler','lock',.6],['crawler','lock',1],['crawler','low',.6]])R.push(g+', the Bog, '+q[1]+': '+this.bogRun(q[0],0,q[2],q[1]));}
   return R;}
});
/* a short version of the grading for trying soil-science numbers (T: {mu,cap,rr,rv}, put into the game as it runs) */
Object.assign(window.T9,{
 gq(terra,T,seed){this.seedN=seed||1;__ml.MLS.terra=!!terra;if(T)Object.assign(__ml.ML_T,T);const R=[],y=r=>r.through?'through ('+Math.round(r.minMph)+')':'stops at '+r.at;
   R.push((terra?'SS '+JSON.stringify(__ml.ML_T):'Game')+' dice '+this.seedN);
   R.push('easy stock: '+[[14,'AWD',7],[17,'AWD',7],[14,'4 HI',9],[17,'AWD',5]].map(q=>y(this.run('stock',q[0],'cruise',{mode:q[1],v:q[2],run:30}))).join(', ')+'; stopped+floored moved '+this.run('stock',14,'stop',{mode:'AWD'}).moved+' m');
   R.push('hard R&M: '+[[8,25,1],[9,25,1],[8,10,.5],[9,14,.65]].map(q=>y(this.run('crawler',q[0],'mom',{run:q[1],thr:q[2]}))).join(', ')+'; stopped+floored moved '+this.run('crawler',8,'stop').moved+' m');
   R.push('bog: '+this.bogRun('stock',0,.6,'AWD')+'; '+this.bogRun('crawler',0,.6,'lock')+'; '+this.bogRun('crawler',0,1,'lock'));
   {const t=this.put('stock',-451,-300,0,'4 HI');this.go({thr:1},3);const a=this.f(t.speed*2.237);const c=this.put('crawler',455,516,0,'lock');this.go({thr:1},6);R.push('dry clay pan, stock floored 3 s: '+a+' mph; dry quarry sand, R&M floored 6 s: '+this.f(c.speed*2.237)+' mph');}
   return R;}
});
/* a trace: floored (or thr) from a standstill at u,v for secs; each second: speed, the wheels' speed, how deep the tyres are, the
   grip the tyres are given, the weight on them (share of the SUV's), soil science's drag and the belly's (share of weight) */
Object.assign(window.T9,{
 trace(kind,u,v,yaw,mode,thr,secs,terra,T){__ml.MLS.terra=!!terra;if(T)Object.assign(__ml.ML_T,T);__ml.mlRake();const t=this.put(kind,u,v,yaw,mode),W=t.m*9.81,G={n:[0,0,0]},out=[];
   for(let s=1;s<=secs;s++){this.inp({thr});let mu=0,fz=0,z=0,ws=0,res=0,pl=0,n=0;for(let q=0;q<120;q++){__dyb.step(1/120);if(q%12)continue;n++;
       for(const w of t.wheels){mu+=(terra?w.mlMuT:t._smu(w,w.surf))/4;fz+=w.Fz/W;ws+=Math.abs(w.w*w.R)/4;if(w.contact&&__ml.mlGround(w.cp[0],w.cp[2],G))z+=Math.max(0,__ml.mlBase(w.cp[0],w.cp[2])-(G.y-__ml.MLS.h0))/4;}
       res+=(__ml.MLS.res||0)/W;pl+=(__ml.MLS.plough||0)/W;}
     out.push(s+'s: '+this.f(t.speed*2.237)+' mph, wheels '+this.f(ws/n*2.237)+', tyres '+Math.round(z/n*100)+' cm down, grip '+this.f(mu/n)+', weight on tyres '+this.f(fz/n)+', drag '+this.f(res/n)+' (belly '+this.f(pl/n)+'), on '+t.wheels[0].surf);}
   return out;}
});
/* ---------- Mud Lab 14: the Hill Climb ---------- */
Object.assign(window.T9,{
 /* the Hill Climb from a standing start at its line: the throttle held at thr; o.feather: eased whenever a tyre slips more
    than o.feather m/s; o.roll: no stop at the line, a run at it from o.roll metres back (which the game doesn't count) */
 climb(kind,mode,thr,o){o=o||{};this.sign();const C=__dyb.WG.mlClimb,A=__dyb.WG.mlA,M=__mlhc.MLHC;if(o.terra!==undefined)__ml.MLS.terra=!!o.terra;__ml.mlRake();M.cool=false;M.run=null;M.last=null;M.staged=false;
   const t=this.put(kind,C.u,C.v+(o.roll||4),Math.PI/2,mode);if(o.air)this.air(o.air);if(!o.roll)this.go({hb:1},1.2);const staged=M.staged;let tt=0,vmax=0,ped=thr,xm=-9,flip=false;
   while(tt<(o.secs||40)&&!M.last){let e=Math.PI/2-this.yaw(t);while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;const lat=t.p[0]-A.x-C.u;
     for(let u=0;u<3;u++){if(o.feather){let sl=0;for(const w of t.wheels)if(w.contact)sl=Math.max(sl,Math.abs(w.w*w.R-w.vl));ped=Math.max(.12,Math.min(thr,ped+(sl>o.feather?-.08:.04)));}
       this.inp({thr:ped,steer:Math.max(-1,Math.min(1,this.sgn*(e*1.6+lat*.12)))});this.steps(4);}
     tt+=.1;vmax=Math.max(vmax,t.speed);xm=Math.max(xm,(A.z+C.v)-t.p[2]);if(t.M[4]<.3)flip=true;if(!M.run&&!o.roll&&tt>6)break;if(o.roll&&tt>8&&!M.run)break;}
   const L=M.last,deg=Math.asin(Math.max(-1,Math.min(1,t.M[3])))*57.3;this.go({hb:1,brk:0},2.5);const back=xm-((A.z+C.v)-t.p[2]);
   return kind.slice(0,5)+' '+(mode||'')+(o.air?' '+__mlr.ML_AIRS[o.air].psi+'psi':'')+' thr '+thr+(o.feather?' feathered':'')+(o.roll?' ROLLING from '+o.roll+' m':'')+': '+(L?L.ft+' FT':'no mark (staged '+staged+', got '+this.f(xm)+' m up)')+' of '+Math.round(__mlhc.mlhcLen()*3.281)+', fastest '+this.f(vmax*2.237)+' mph, nose up '+Math.round(deg)+' deg, '+this.f(tt)+' s; then on the e-brake: slid back '+this.f(back)+' m, '+(flip||t.M[4]<.3?'ROLLED OVER':'upright');},
 /* standing on the lane x metres up it, then the throttle: does it pull away? */
 climbHold(kind,mode,x,thr,o){o=o||{};this.sign();const C=__dyb.WG.mlClimb,A=__dyb.WG.mlA;if(o.terra!==undefined)__ml.MLS.terra=!!o.terra;__ml.mlRake();const t=this.put(kind,C.u,C.v-x,Math.PI/2,mode);this.go({hb:1,brk:0},1);
   const z0=t.p[2],deg=Math.asin(Math.max(-1,Math.min(1,t.M[3])))*57.3;let ws=0;for(let i=0;i<40;i++){this.inp({thr});this.steps(12);ws=Math.max(ws,Math.abs(t.wheels[0].w*t.wheels[0].R));}
   const up=z0-t.p[2];this.inp({hb:1});return kind.slice(0,5)+' '+(mode||'')+' standing '+x+' m up ('+Math.round(deg)+' deg), thr '+thr+' for 4 s: '+(up>.5?'climbs '+this.f(up)+' m':up<-.5?'slides back '+this.f(-up)+' m':'holds')+', wheels to '+this.f(ws*2.237)+' mph';},
 /* the lane's shape: along its middle, and across it part way up */
 climbShape(){const C=__dyb.WG.mlClimb,Z={},out=[],W=__dyb.RANCH.W,A=__dyb.WG.mlA;
   for(let x=-28;x<=C.X+C.top+30;x+=4){const z=__dyb.WG.mlZone(C.u,C.v-x,Z),z2=__dyb.WG.mlZone(C.u+40,C.v-x,{});out.push('x '+x+': lane '+this.f(z.h)+' m (over its foot '+this.f(z.h-C.h0)+'), 40 m east '+this.f(z2.h)+'; wood '+this.f(z.wood)+', grass '+this.f(z.grass)+', sand '+this.f(z.sand)+', moist '+this.f(z.moist)+', world '+this.f(W.heightAt(A.x+C.u,A.z+C.v-x)-A.h0));}
   for(const x of [10,30]){const r=[];for(let w=-24;w<=24;w+=4){const z=__dyb.WG.mlZone(C.u+w,C.v-x,Z);r.push(w+':'+this.f(z.h)+(z.wood>.2?'w':''));}out.push('across at x '+x+': '+r.join(' '));}
   let n=0;try{__dyb.WG.mlTrees(A.x+C.u-C.hw-1,A.z+C.v-C.X-C.top,A.x+C.u+C.hw+1,A.z+C.v+10,()=>{n++;});}catch(e){n='?';}out.push('trees on the lane: '+n+'; slope length '+this.f(__mlhc.mlhcLen())+' m = '+Math.round(__mlhc.mlhcLen()*3.281)+' ft; rise '+this.f(__dyb.WG.mlClimbY(C.X+4))+' m');return out;}
});
Object.assign(window.T9,{
 /* the Bog, second by second: how far, how fast, the wheels, how deep, the grip given, the weight on the tyres, the drag */
 bogTrace(kind,thr,mode,terra,secs){__ml.MLS.terra=!!terra;this.sign();const B=__dyb.WG.mlBog,A=__dyb.WG.mlA;__ml.mlRake();__mlb.MLB.cool=false;__mlb.MLB.run=null;__mlb.MLB.last=null;const t=this.put(kind,B.u0-30,B.v,0,mode),W=t.m*9.81,G={n:[0,0,0]},out=[];
   for(let s=1;s<=(secs||30)&&!__mlb.MLB.last;s++){let mu=0,fz=0,z=0,ws=0,res=0,pl=0,cl=0,n=0;for(let q=0;q<10;q++){let e=0-this.yaw(t);const lat=(t.p[2]-A.z-B.v);this.inp({thr,steer:Math.max(-1,Math.min(1,this.sgn*(e*1.6+lat*.12)))});this.steps(12);n++;
       for(const w of t.wheels){mu+=(terra?w.mlMuT:t._smu(w,w.surf))/4;fz+=w.Fz/W;ws+=Math.abs(w.w*w.R)/4;cl+=(w.mlClog||0)/4;if(w.contact&&__ml.mlGround(w.cp[0],w.cp[2],G))z+=Math.max(0,__ml.mlBase(w.cp[0],w.cp[2])-(G.y-__ml.MLS.h0))/4;}
       res+=(__ml.MLS.res||0)/W;pl+=(__ml.MLS.plough||0)/W;}
     if(s>3)out.push(s+'s: '+Math.round((t.p[0]-A.x-B.u0+2.4)*3.281)+' ft, '+this.f(t.speed*2.237)+' mph, wheels '+this.f(ws/n*2.237)+', tyres '+Math.round(z/n*100)+' cm down, water '+Math.round((__ml.MLS.wd||0)*100)+' cm, grip '+this.f(mu/n)+', clog '+this.f(cl/n)+', weight on tyres '+this.f(fz/n)+', drag '+this.f(res/n)+' (belly '+this.f(pl/n)+'), on '+t.wheels[0].surf);}
   out.push(__mlb.MLB.last?'mark '+__mlb.MLB.last.ft+' ft':'no mark');return out;}
});
Object.assign(window.T9,{
 /* stopped in hole k, then straight back out at a held throttle: how far it gets, and what holds it */
 backOut(kind,k,mode,thr,o){o=o||{};this.sign();if(o.terra!==undefined)__ml.MLS.terra=!!o.terra;const H=this.hole(k),cs=Math.cos(H.r),sn=Math.sin(H.r),s0=-(H.L+25);
   __ml.mlRake();const t=this.put(kind,H.u+cs*s0,H.v+sn*s0,-H.r,mode),W=t.m*9.81,G={n:[0,0,0]},prog=()=>this.at(t,H).s;let tt=0;
   while(tt<20&&prog()<(o.stopAt===undefined?-H.L*.1:o.stopAt)){this.inp({thr:o.thrIn||.45,steer:this.steer(t,H,1)});this.steps(12);tt+=.1;}
   for(let i=0;i<40&&t.speed>.15;i++){this.inp({brk:1});this.steps(12);}this.inp({hb:1});this.steps(120);const p0=prog();
   if(o.dig){this.go({thr:1},o.dig);}
   const log=[];let t2=0,pmin=p0,vmax=0,wsm=0;while(t2<(o.secs||14)&&prog()>-(H.L+5)){this.inp({brk:t.rev?thr:Math.max(.6,thr),steer:0});this.steps(12);t2+=.1;pmin=Math.min(pmin,prog());vmax=Math.max(vmax,t.speed);
     let z=0,fz=0,ws=0;for(const w of t.wheels){fz+=w.Fz/W;ws=Math.max(ws,Math.abs(w.w*w.R));if(w.contact&&__ml.mlGround(w.cp[0],w.cp[2],G))z+=Math.max(0,__ml.mlBase(w.cp[0],w.cp[2])-(G.y-__ml.MLS.h0))/4;}wsm=Math.max(wsm,ws);
     if(o.log&&Math.round(t2*10)%10===0)log.push(this.f(t2)+'s '+this.f(prog()-p0)+'m '+this.f(t.speed*2.237)+'mph wheels '+this.f(ws*2.237)+' tyres '+Math.round(z*100)+'cm weight '+this.f(fz)+' belly '+this.f((__ml.MLS.plough||0)/W)+' rev '+t.rev);}
   const out=prog()<=-(H.L+5);return kind.slice(0,5)+' '+(mode||'')+' hole '+k+(o.dig?' after flooring it '+o.dig+' s':'')+', back out at '+thr+' throttle: '+(out?'OUT in '+this.f(t2)+' s':'stuck after '+this.f(p0-pmin)+' m back')+', fastest '+this.f(vmax*2.237)+' mph, wheels to '+this.f(wsm*2.237)+(o.log?' | '+log.join(' | '):'');}
});
