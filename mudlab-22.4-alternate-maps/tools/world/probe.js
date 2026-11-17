/* numbers off the alternate map's ground: node tools/world/probe.js src/ml-world.js
   the highest and lowest ground, the Hill Climb's fit, the Bog's lanes, the chain's pools down the river */
const {load}=require('./world.js');const W=load(process.argv[2]),o={};
let hi=-1e9,hiAt=null,dn=-1e9,dnAt=null,wet=0,n=0,white=0,water=0;
for(let v=-760;v<=760;v+=8)for(let u=-760;u<=760;u+=8){W.mlZone(u,v,o);n++;if(o.h>hi){hi=o.h;hiAt=[u,v];}if(o.dune>.5&&o.h>dn){dn=o.h;dnAt=[u,v];}if(o.moist>.6)wet++;if(o.white>.5)white++;if(o.wl>-90&&o.wl>o.h)water++;}
const ft=m=>Math.round(m*3.281);
console.log('highest',hi.toFixed(1),'m',ft(hi),'ft at',hiAt,'| highest dune',dn.toFixed(1),'m',ft(dn),'ft at',dnAt);
console.log('share wet (moist>.6)',(wet/n*100).toFixed(0)+'%','white',(white/n*100).toFixed(0)+'%','under water',(water/n*100).toFixed(0)+'%');
{const C=W.ML_CLIMB;console.log('HILL CLIMB foot',C.u,C.v);for(const x of [-60,-30,-10,0,10,20,30,40,46,52,60,80,110]){const u=C.u+C.dx*x,v=C.v+C.dz*x;const a=W.mlLand(u,v,{}).h,b=W.mlZone(u,v,{}).h;console.log('  x',x,'land',a.toFixed(1),'built',b.toFixed(1));}}
{const B=W.ML_BOG;for(const L of B.lanes){let r=L.name+': ';for(const x of [-300,-100,-5,0,10,30,61,90,120,125,132]){W.mlZone(B.u0+x,L.v,o);r+=x+':'+(o.h).toFixed(2)+(o.wl>-90?'/w'+(o.wl-o.h).toFixed(2):'')+' ';}console.log(r);}}
{const R=W.ML_RIVER,C=W.ML_CHAIN;console.log('chain from',C.s0,'len',C.len,'pools',Math.round(C.len/C.P));let line='';
  for(const p of R){if(p[6]%50>10)continue;let mx=0,bx=0;for(let b=-80;b<=80;b+=2){const i=R.indexOf(p),q=R[Math.min(R.length-1,i+1)],ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez)||1,u=p[0]-ez/l*b,v=p[1]+ex/l*b;W.mlZone(u,v,o);if(o.wl>-90&&o.wl-o.h>mx){mx=o.wl-o.h;bx=b;}}line+=Math.round(p[6])+':'+mx.toFixed(2)+' ';}console.log('deepest water across the river every 50 m:',line);}
