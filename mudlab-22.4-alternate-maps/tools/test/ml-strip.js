/* Rimrock Run's test drives (run with tools/test/ml-pits.py BUILD tools/test/ml-park.js+this, joined: see README).
  TS2.road('hatchB',0,22,120)   down the Grade from its point 0 (River Camp) at up to 22 m/s for 120 s: how far, the speeds, the steepest
  TS2.road('hatchB',-1,22,120)  the same from its far end (the Rim), down toward the River */
window.TS2={
 road(kind,from,v,secs){TP.sign();__ml.mlRake();const A=__dyb.WG.mlA,P=__dyb.WG.mlX.roads[0].pts,n=P.length-1,dir=from<0?-1:1;let i=from<0?n-3:3;const a=P[i],b=P[i+3*dir];
   const t=TP.put(kind,a[0],a[1],Math.atan2(-(b[1]-a[1]),b[0]-a[0]));let tt=0,still=0,end='time',vmax=0,vsum=0,cnt=0,y0=t.p[1],ymin=1e9,ymax=-1e9,air=0,lean=0,s0=P[i][2];
   while(tt<secs){const u=t.p[0]-A.x,w=t.p[2]-A.z;while(i>0&&i<n&&Math.hypot(P[i][0]-u,P[i][1]-w)<10)i+=dir;
     const q=P[Math.max(0,Math.min(n,i+4*dir))],want=Math.atan2(-(q[1]-w),q[0]-u),e=TP.wrap(want-TP.yaw(t));
     /* (slow for the bends ahead: the sharpest turn in the next 60 m) */
     let k=0;for(let d=1;d<15;d++){const j=Math.max(1,Math.min(n-1,i+d*dir)),p0=P[j-1],p1=P[j],p2=P[j+1],a1=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),a2=Math.atan2(p2[1]-p1[1],p2[0]-p1[0]);k=Math.max(k,Math.abs(TP.wrap(a2-a1))/4);}
     const vB=Math.min(v,Math.sqrt(7/Math.max(k,1e-4)));
     TP.inp({thr:Math.max(0,Math.min(1,(vB-t.speed)*.5+.15)),brk:t.speed>vB+2?Math.min(1,(t.speed-vB-2)*.3):0,steer:Math.max(-1,Math.min(1,TP.sgn*e*1.8))});TP.steps(6);tt+=.05;
     vmax=Math.max(vmax,t.speed);vsum+=t.speed;cnt++;ymin=Math.min(ymin,t.p[1]);ymax=Math.max(ymax,t.p[1]);if(!t.wheels.some(w=>w.contact))air+=.05;lean=Math.max(lean,Math.acos(Math.max(-1,Math.min(1,t.M[4])))*57.3);
     if(t.speed<.4)still+=.05;else still=0;if(still>4){end='stopped';break;}if(t.M[4]<.3){end='rolled';break;}if(i<=0||i>=n){end='the end of the road';break;}}
   return kind+' on the Grade from '+(from<0?'the Rim':'River Camp')+', up to '+Math.round(v*2.237)+' mph for '+TP.f(tt)+' s: '+Math.round(Math.abs(P[i][2]-s0)*3.281)+' ft ('+end+'), average '+Math.round(vsum/cnt*2.237)+' mph, top '+Math.round(vmax*2.237)+', climbed/fell '+Math.round((ymax-ymin)*3.281)+' ft, in the air '+TP.f(air)+' s, leaned up to '+Math.round(lean)+' deg, at '+__dyb.GAME.place;}};
