/* Mud Lab's world (src/ml-world.js) outside the browser: the generator's own helpers (copied from the engine, seed 6)
   round the file, so the ground can be looked at and timed in a second. node world.js <ml-world.js> -> module */
const fs=require('fs');
function load(file){
  const src=fs.readFileSync(file,'utf8');
  const pre=`'use strict';const SEED=6;
const SURF=['grass','dirt','strip','trail','rock','mud','concrete','water','gravel','asphalt','ruts','sand'];
const SF={};SURF.forEach((n,i)=>SF[n]=i);
const sst=(a,b,x)=>{let t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
function hs(ix,iz,s){let h=Math.imul(ix|0,0x27d4eb2d)^Math.imul(iz|0,0x165667b1)^Math.imul((s+SEED)|0,0x9e3779b1);
  h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296;}
function vn(x,z,s){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const a=hs(ix,iz,s),b=hs(ix+1,iz,s),c=hs(ix,iz+1,s),d=hs(ix+1,iz+1,s);return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;}
function fbm(x,z,o,s){let t=0,a=.5,n=0;for(let i=0;i<o;i++){t+=a*vn(x,z,s+i*101);n+=a;x=x*2.03+17.3;z=z*2.03-9.1;a*=.5;}return t/n;}
const rimAt=(x,z)=>0;
`;
  const post=`\nreturn {ML_A,ML_BOG,ML_CLIMB,ML_RIVER,ML_CHAIN,ML_PITS,mlLand,mlClimbY,mlZone,mlMat,mlCore,mlPlace,mlHills,ML_PLACES,ML_TRAILS,ML_HOLES,ML_NONE,ML_CL,
  X:(typeof ML_X!=='undefined'?ML_X:null)};`;
  return new Function(pre+src+post)();
}
module.exports={load};
