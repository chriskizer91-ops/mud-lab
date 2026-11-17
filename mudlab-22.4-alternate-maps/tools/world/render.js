/* a picture of the world's ground straight from mlZone: node render.js <ml-world.js> <out.rgb> u0 v0 u1 v1 metresPerPixel
   colours: the soils by how wet, sod, woods, trails, water by depth (pale shallow .. dark deep), hill shade */
const {load}=require('./world.js'),fs=require('fs');
const W=load(process.argv[2]),out=process.argv[3],u0=+process.argv[4],v0=+process.argv[5],u1=+process.argv[6],v1=+process.argv[7],m=+process.argv[8];
const nx=Math.round((u1-u0)/m),nz=Math.round((v1-v0)/m),B=Buffer.alloc(nx*nz*3),H=new Float32Array(nx*nz),o={};
const cl=(a,b,t)=>a+(b-a)*t;const t0=Date.now();
const C=new Float32Array(nx*nz*3);
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const u=u0+(i+.5)*m,v=v0+(j+.5)*m;W.mlZone(u,v,o);const k=j*nx+i;H[k]=o.h;
  const mo=o.moist;let r=cl(176,100,mo),g=cl(118,66,mo),b=cl(74,42,mo);const mix=(w,R,G,Bb)=>{r+=(R-r)*w;g+=(G-g)*w;b+=(Bb-b)*w;};
  mix(Math.min(1,o.clay),cl(196,118,mo),cl(178,100,mo),cl(142,78,mo));mix(Math.min(1,o.silt),cl(170,96,mo),cl(152,84,mo),cl(120,62,mo));mix(Math.min(1,o.peat),58,52,32);mix(Math.min(1,o.sand),cl(222,170,mo),cl(176,128,mo),cl(116,82,mo));
  /* (the alternate map's white country: bare soil bleached, as src/ml-look.glsl does) */
  if(o.white>0){const l=(r+g+b)/3/255,k=o.white;r+=(222*(.55+.9*l)-r)*k;g+=(219*(.55+.9*l)-g)*k;b+=(211*(.55+.9*l)-b)*k;}
  mix(o.grass*.85,cl(170,96,mo),cl(160,128,mo),cl(84,58,mo));mix(o.wood*.9,34,64,34);if(o.trail<3.6)mix(.9*(1-o.trail/3.6),218,196,150);
  if(o.wl>-90&&o.wl>o.h){const d=o.wl-o.h,t=Math.min(1,d/.5);mix(Math.min(1,.45+d*.9),cl(120,70,t),cl(170,130,t),cl(190,160,t));if(d>.5){const q=Math.min(1,(d-.5)/1.8);r=cl(r,10,q);g=cl(g,30,q);b=cl(b,80,q);}}
  C[k*3]=r;C[k*3+1]=g;C[k*3+2]=b;}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,hx=H[j*nx+Math.min(nx-1,i+1)]-H[j*nx+Math.max(0,i-1)],hz=H[Math.min(nz-1,j+1)*nx+i]-H[Math.max(0,j-1)*nx+i],sh=Math.max(.45,Math.min(1.5,1-(hx+hz)*.3/m));
  for(let c=0;c<3;c++)B[k*3+c]=Math.max(0,Math.min(255,C[k*3+c]*sh));}
fs.writeFileSync(out,B);fs.writeFileSync(out+'.h',Buffer.from(H.buffer));console.log(nx,nz,Date.now()-t0,'ms',((Date.now()-t0)/(nx*nz)*1000).toFixed(2),'us each');
