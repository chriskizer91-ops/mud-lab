/* where to stand to look at each place: the River's fords and pools (on the west bank, facing across), the Track's
   pieces (on it, facing along it). node stations.js <ml-world.js> */
const {load}=require('./world.js');const W=load(process.argv[2]),R=W.X.rivers[0],T=W.X.track.pts,o={};
const out={};
function riv(name,sWant,side,back){let s=0;for(let i=0;i<R.length-1;i++){const a=R[i],b=R[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s+L>=sWant){const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L;
      // right-hand bank looking downstream is +b: n=( -tz, tx )? b = tx*(pz-az)-tz*(px-ax) > 0  => p-a along (-tz,tx)
      const nx=-tz*side,nz=tx*side,d=a[2]*1.1+back,u=a[0]+nx*d,v=a[1]+nz*d,yaw=Math.atan2(nz,-nx);   // facing back at the river: direction (-nx,-nz); yaw 0 = +u, pi/2 = -v
      W.mlZone(u,v,o);out[name]=[+u.toFixed(1),+v.toFixed(1),+Math.atan2(nz, -nx).toFixed(3),'hw '+a[2].toFixed(0)+' h '+o.h.toFixed(2)+' wl '+o.wl];return;}s+=L;}}
riv('ford-shallows',1700,1,14);riv('ford-n1',1148,1,10);riv('ford-n2',645,1,10);riv('ford-n3',250,1,10);riv('ford-s1',2083,1,10);riv('ford-s2',2420,1,10);riv('ford-s3',2810,1,10);
riv('pool-n',896,1,10);riv('pool-n-out',896,-1,14);riv('pool-s',2713,1,10);
function trk(name,sWant){for(let i=0;i<T.length-1;i++){if(T[i+1][2]>=sWant){const a=T[i],b=T[i+1];out[name]=[+a[0].toFixed(1),+a[1].toFixed(1),+Math.atan2(-(b[1]-a[1]),b[0]-a[0]).toFixed(3),'R '+(1/a[3]).toFixed(0)];return;}}}
trk('trk-start',0);trk('trk-table',45);trk('trk-whoops',185);trk('trk-kicker',350);trk('trk-berm',1800);trk('trk-berm2',2230);trk('trk-step',1130);trk('trk-hairpin',2490);
console.log(JSON.stringify(out,null,0).replace(/\],/g,'],\n'));
