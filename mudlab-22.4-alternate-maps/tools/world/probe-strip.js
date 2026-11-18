/* Rimrock Run's numbers: node tools/world/probe-strip.js rimrock-run/src/ml-world.js
   the land east to west (W: over the River's water), the creek's pools, the Grade's steepest pitches */
const {load}=require('./world.js');const W=load(process.argv[2]),o={},ft=m=>Math.round(m*3.281);
let line='';for(let u=3000;u>=-3072;u-=200){W.mlZone(u,0,o);line+=`${u}:${ft(o.h+88)} `;}console.log('ft over the River along the middle, east to west:\n'+line);
let hi=-1e9,at=null;for(let v=-760;v<=760;v+=16)for(let u=-3060;u<=3060;u+=16){W.mlZone(u,v,o);if(o.h>hi){hi=o.h;at=[u,v];}}console.log('highest',ft(hi+88),'ft over the River at',at);
for(const [nm,u,v] of [['camp',2390,330],['butte top',-488,300],['lookout',W.ML_X.look.u+12,W.ML_X.look.v],['rim west end',-3000,0],['shelf',-1180,-200]]){W.mlZone(u,v,o);console.log(nm,ft(o.h+88),'ft');}
W.mlCreekInit();const P=W.MLCK.P;let st=[];for(let k=1;k<P.length;k++)st.push(P[k-1].wl-P[k].wl);
console.log('Cold Creek:',P.length,'pools over',Math.round(W.ML_CREEK[W.ML_CREEK.length-1][2]),'m; falls between them',Math.min(...st).toFixed(2),'to',Math.max(...st).toFixed(2),'m; first pool level',(P[0].wl+88).toFixed(1),'last',(P[P.length-1].wl+88).toFixed(1),'m over the River');
for(const R of W.ML_ROADS){const Y=W.mlRoadY(R),p=R.pts;let mx=0,mxAt=0,sum=0;for(let i=10;i<p.length;i+=10){const g=Math.abs(Y[i]-Y[i-10])/(p[i][2]-p[i-10][2]);if(g>mx){mx=g;mxAt=i;}}
  console.log(R.name+':',Math.round(p[p.length-1][2]*3.281),'ft long, climbs',ft(Y[p.length-1]-Y[0]),'ft; steepest 40 m',(mx*100).toFixed(1)+'% at',p[mxAt].slice(0,2).map(Math.round));}
