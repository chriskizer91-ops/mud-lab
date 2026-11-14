/* (Mud Lab 21) the jumps, outside the game: node tools/world/jumps.js src/ml-world.js
   For each: where its lane starts and ends, how high each lip stands, how far the lane's own heights are from the
   ground as it lay (the deepest cut and the highest fill), and, for a SUV leaving the lip at a few speeds with no air
   drag (a thrown stone: the game's SUVs fall a little short of this), where it comes down along the lane, how long it
   is in the air, how high over the lip it gets, and how hard it meets the ground (the speed straight into it) */
const {load}=require('./world.js'),W=load(process.argv[2]),X=W.X,o={},mph=2.237;
const hAt=(J,s)=>{W.mlZone(J.u+J.dx*s,J.v+J.dz*s,o);return {h:o.h,wl:o.wl};};
for(const J of X.jumps){X.jumpY(J,0);
  const a=-(J.g+J.A.far),b=J.g+J.B.far;
  console.log('\n'+J.name+': runs '+(J.deg)+' deg; lane from ('+(J.u+J.dx*a).toFixed(0)+', '+(J.v+J.dz*a).toFixed(0)+') to ('+(J.u+J.dx*b).toFixed(0)+', '+(J.v+J.dz*b).toFixed(0)+'), '+(b-a).toFixed(0)+' m; gap lip to lip '+(2*J.g)+' m');
  for(const [nm,S,sg] of [['A',J.A,-1],['B',J.B,1]]){const lip=hAt(J,sg*J.g).h,foot=hAt(J,sg*(J.g+S.len+1)).h;let wet=0,deep=0;
    console.log('  side '+nm+': run '+S.run+' m, ramp '+S.len.toFixed(1)+' m long to '+S.H.toFixed(2)+' m ('+S.th+' deg, radius '+S.R+'); lip at height '+lip.toFixed(2)+', lane at the ramp\'s foot '+foot.toFixed(2)+', at the far end '+hAt(J,sg*(J.g+S.far-45)).h.toFixed(2));}
  {let w0=null,w1=null,deep=0;for(let s=-J.g;s<=J.g;s+=.25){const q=hAt(J,s);if(q.wl>-90&&q.wl>q.h){if(w0===null)w0=s;w1=s;deep=Math.max(deep,q.wl-q.h);}}console.log('  in the gap: water '+(w0===null?'none':'from '+w0+' to '+w1+' ('+(w1-w0).toFixed(1)+' m), deepest '+deep.toFixed(2)+' m'));}
  for(const [nm,S,sg] of [['A to B',J.A,-1],['B to A',J.B,1]]){if(!S.R)continue;const T=sg<0?J.B:J.A,th=S.th*Math.PI/180,y0=hAt(J,sg*J.g).h;let line='  '+nm+':';
    console.log('    (to leave the lip at v, it must reach the ramp\'s foot going sqrt(v*v+2*9.81*'+S.H.toFixed(2)+'): 45 -> '+[45,60,75,90].map(v=>Math.round(Math.sqrt((v/mph)**2+19.62*S.H)*mph)).join(', 60/75/90 -> ').replace(', 60/75/90 -> ',' mph; 60, 75, 90 -> ').replace(/, 60\/75\/90 -> /g,', ')+' mph)');
    for(const v of [35,45,55,65,75,85,100,120,150]){const vs=v/mph,vx=vs*Math.cos(th),vy=vs*Math.sin(th);let t=0,x=0,y=y0,land=null,top=0;
      for(t=.02;t<12;t+=.01){x=vx*t;y=y0+vy*t-4.905*t*t;top=Math.max(top,y-y0);const s=-sg*J.g+(-sg)*x*-1;const sp=sg<0?-J.g+x:J.g-x;if(Math.abs(sp)>J.g+T.far+60){land=null;break;}
        const q=hAt(J,sp),gr=Math.max(q.h,q.wl>-90?q.wl:-1e9);if(y<=gr){const e=.5,q2=hAt(J,sp+(sg<0?e:-e)),sl=(q2.h-q.h)/e,vyn=vy-9.81*t,n=(-(vyn)+sl*vx)/Math.hypot(1,sl);land={x,t,top,into:n,wet:q.wl>-90&&q.wl>q.h,back:x-2*J.g};break;}}
      line+=land?'  '+v+' mph: '+land.x.toFixed(0)+' m'+(land.wet?' WET':land.back<0?' SHORT':' (+'+land.back.toFixed(0)+')')+' '+land.t.toFixed(1)+'s up'+land.top.toFixed(1)+' in'+land.into.toFixed(1)+';':'  '+v+' mph: off the end;';}
    console.log(line);}}
