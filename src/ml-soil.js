/* =====================================================================================
   MUD LAB: THE SOIL (src/ml-soil.js, put in by src/build.py just before the boot). The whole world (src/ml-world.js,
   327.68 m square) is soil, kept every 8 cm: 4096 x 4096 cells in 64 x 64 squares of 5.12 m, each square made only
   when a tyre or a clod first touches it (the rest is still the world's own ground, so it costs nothing):
     rut    what's been done to it: down in the ruts, up in the berms and where clods land (metres)
     churn  how much it's been turned over: dark, moist, lumpy, less grip
     press  how hard a rolling tyre pressed it: smoother, a little darker, the tread's knobs
     comp   how packed it is: a tyre sinks until the soil bears its pressure, and packed soil bears more
     dir    which way the tyre was rolling (for the tread)
     wet    when it was last wetted by a wet tyre (the tracks dry over a minute and a half)
     spring (peat) how far it will spring back
     broken (peat) its moss mat broken through: soup underneath
   The world's own ground every 64 cm: its height, the water lying on it, and what it's made of (src/ml-world.js).
   FIVE SOILS AND THE SOD, each its own behaviour (ML_SOIL; mixed where they meet):
     loam   firm red dirt: shallow ruts, dust when dry
     clay   slick and sticky: holds sharp ruts, packs into the tread (the tyres lose grip until they spin it out),
            big clods, mud builds up on the truck
     silt   soupy: sinks deep, the ruts slump and fill back in over a few seconds, it splashes rather than throws
     peat   spongy: springs part way back behind the tyre; spin or push too hard and the mat breaks through to soup
     sand   loose: dry it sprays and dusts; wet (by the pond) it's firm until you spin it, then it goes to quicksand
     sod    grass on loam: tears up when spun
   WATER, where the world has it (flat levels: the clay's puddles, the bog's water just under the moss and its bog
   holes, the ditch, the pond and its ford): drawn as a flat surface wherever the ground (ruts too) is under its level,
   so ruts below it fill. In it the tyres throw spray, the truck pushes a bow wave, water drags on the tyres and the
   body (hard at speed), and the tyres come out wet and leave wet tracks on the dry ground.
   THE PHYSICS FEELS ALL OF IT: inside the world the ground under the wheels (groundInto) is this soil, its grip the
   soil's (and a clogged tread's), so a tyre drops into an old rut, its walls catch the sidewall, a sunk tyre has a step
   to climb. Nothing of the truck's own numbers is changed.
   THE PICTURE: the soil near the truck (122 m square, moving with it) on the graphics card; a fine mesh under the
   truck (8 cm apart under it, out to 30 m) lifted by it, so the ruts are really in the ground; the land's shader
   paints each soil, the ruts, the turned soil, the pressed tracks, the wet tracks and the water.
   ===================================================================================== */
const ML_SOIL={
  /* D: how far it sinks at the reference pressure (m); max: its floor (m); berm: share of what sinks squeezed up beside
     the tyre; dig: m dug a second per m/s of spin; roost: clods a second per m/s of spin; fling: clods a second per m/s
     of speed (wet soil peeling off the tread); dust: dry dust; grip: times the surface's own grip; slump: how fast its
     ruts flow back (per second); spring: share of what sinks that springs back */
  loam:{D:.05,max:.2,berm:.2,dig:.010,roost:16,fling:0,dust:1,grip:1,slump:0,spring:0,size:1},
  clay:{D:.035,max:.26,berm:.35,dig:.007,roost:11,fling:1.1,dust:0,grip:.62,slump:0,spring:0,size:1.5},
  silt:{D:.2,max:.5,berm:.25,dig:.03,roost:7,fling:1.6,dust:0,grip:.85,slump:2.2,spring:0,size:.7},
  peat:{D:.09,max:.3,berm:.1,dig:.014,roost:9,fling:.6,dust:0,grip:.8,slump:0,spring:.6,size:1.1},
  sand:{D:.065,max:.24,berm:.5,dig:.02,roost:22,fling:0,dust:.45,grip:1,slump:.25,spring:0,size:.4},
  wsand:{D:.025,max:.38,berm:.4,dig:.03,roost:14,fling:.5,dust:0,grip:1.08,slump:.6,spring:0,size:.6},
  grass:{D:.022,max:.11,berm:.12,dig:.006,roost:9,fling:0,dust:.35,grip:1,slump:0,spring:0,size:.9}};
const ML_SOUP={D:.22,max:.7};                 /* broken-through peat */
const ML_PREF=50000,ML_TAU=.06,ML_RHO=1000;
const MLS={ready:false,C:.08,WS:327.68,N:4096,T:64,NT:64,NW:1536,NM:512,CM:.64,x0:0,z0:0,h0:0,
  tiles:null,ntile:0,cB:null,cW:null,cM:null,s0:null,s1:null,w0:null,w1:null,wc:[NaN,NaN],up:new Set(),act:new Map(),
  clock:0,lut:null,zh:null,zd:null,hb:null,db:null,col:{},t0:0,stat:{dug:0,clods:0,landed:0,up:0,splash:0}};
const MLP={mesh:null,n:0,E:30,cx:0,cz:0,on:false,water:null};
/* half floats for the textures */
const ML_F=new Float32Array(1),ML_U=new Uint32Array(ML_F.buffer);
function mlHalf(v){ML_F[0]=v;const x=ML_U[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
/* (the soil's own clock: the game's time, so it stops in the menu and keeps step with the physics) */
const mlNow=()=>MLS.clock;
const sst=(a,b,x)=>{let t=(x-a)/(b-a);t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
/* ---------- the world's own ground, every 64 cm (bilinear between) ---------- */
function mlC(a,x,z){const M=MLS.NM,fx=Math.max(0,Math.min(M-1.001,(x-MLS.x0)/MLS.CM-.5)),fz=Math.max(0,Math.min(M-1.001,(z-MLS.z0)/MLS.CM-.5)),i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*M+i;
  return a[k]+(a[k+1]-a[k])*ax+(a[k+M]-a[k])*az+(a[k]-a[k+1]-a[k+M]+a[k+M+1])*ax*az;}
/* what's under a point: the soils' weights (loam is what's left) and the water's level over h0 */
const MLW={clay:0,silt:0,peat:0,sand:0,grass:0,wsand:0,loam:0,wl:-99};
function mlWeights(x,z,o){const M=MLS.cM,M2=MLS.NM*MLS.NM,fx=Math.max(0,Math.min(MLS.NM-1.001,(x-MLS.x0)/MLS.CM-.5)),fz=Math.max(0,Math.min(MLS.NM-1.001,(z-MLS.z0)/MLS.CM-.5)),i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*MLS.NM+i,NM=MLS.NM;
  const g=c=>{const q=c*M2+k;return (M[q]+(M[q+1]-M[q])*ax+(M[q+NM]-M[q])*az+(M[q]-M[q+1]-M[q+NM]+M[q+NM+1])*ax*az)/255;};
  o.clay=g(0);o.silt=g(1);o.peat=g(2);const sand=g(3);o.grass=g(4);o.wl=mlC(MLS.cW,x,z);
  const b=mlC(MLS.cB,x,z),wet=sst(-.45,-.15,o.wl-b);o.wsand=sand*wet;o.sand=sand*(1-wet);
  const t=o.clay+o.silt+o.peat+sand+o.grass;if(t>1){const f=1/t;o.clay*=f;o.silt*=f;o.peat*=f;o.sand*=f;o.wsand*=f;o.grass*=f;}o.loam=Math.max(0,1-Math.min(1,t));return o;}
/* the soil's numbers where a tyre is: each soil's, mixed by how much of each is there */
const MLK={};
function mlParams(W){const o=MLK;for(const k of ['D','max','berm','dig','roost','fling','dust','grip','slump','spring','size'])o[k]=0;
  for(const s of ['loam','clay','silt','peat','sand','wsand','grass']){const w=W[s];if(w<=0)continue;const P=ML_SOIL[s];for(const k in o)o[k]+=P[k]*w;}
  let best='loam',bw=-1;for(const s of ['loam','clay','silt','peat','sand','wsand','grass'])if(W[s]>bw){bw=W[s];best=s;}o.main=best;return o;}
/* ---------- the soil's squares ---------- */
function mlTile(ti,tj,make){const q=tj*MLS.NT+ti;let t=MLS.tiles[q];
  if(!t&&make){const n=MLS.T*MLS.T;t=MLS.tiles[q]={ti,tj,r:new Float32Array(n),ch:new Uint8Array(n),pr:new Uint8Array(n),cp:new Uint8Array(n),fl:new Uint8Array(n),
    dr:new Uint8Array(n*2).fill(128),wt:new Float32Array(n).fill(-9999),sp:null};MLS.ntile++;}return t;}
function mlRut(i,j){const t=MLS.tiles[(j>>6)*MLS.NT+(i>>6)];return t?t.r[((j&63)<<6)|(i&63)]:0;}
function mlDirtyT(t){MLS.up.add(t.tj*MLS.NT+t.ti);}
/* ---------- lay the world out (the first time the truck drives) ---------- */
function mlInit(){
  if(MLS.ready||!WG.mlA)return;const A=WG.mlA,t0=performance.now();MLS.t0=performance.now()/1000;
  MLS.h0=WG.mlLevel();MLS.x0=A.x-MLS.WS/2;MLS.z0=A.z-MLS.WS/2;MLS.tiles=new Array(MLS.NT*MLS.NT).fill(null);
  /* the world's own ground every 64 cm, from ml-world's mlZone */
  const NM=MLS.NM,CM=MLS.CM,M2=NM*NM,o={};MLS.cB=new Float32Array(M2);MLS.cW=new Float32Array(M2);MLS.cM=new Uint8Array(M2*5);
  for(let j=0;j<NM;j++)for(let i=0;i<NM;i++){const k=j*NM+i;WG.mlZone(MLS.x0+(i+.5)*CM-A.x,MLS.z0+(j+.5)*CM-A.z,o);
    MLS.cB[k]=o.h;MLS.cW[k]=o.wl>-90?o.wl:o.h-1;const w=[o.clay,o.silt,o.peat,o.sand,o.grass];for(let c=0;c<5;c++)MLS.cM[c*M2+k]=Math.round(Math.max(0,Math.min(1,w[c]))*255);}
  /* the graphics card's copies: the world's ground (height, water, sod, the hollows' shade; the soils) */
  const s0=new Uint16Array(M2*4),s1=new Uint8Array(M2*4);
  for(let j=0;j<NM;j++)for(let i=0;i<NM;i++){const k=j*NM+i,h=MLS.cB[k],jm=Math.max(0,j-3),jp=Math.min(NM-1,j+3),im=Math.max(0,i-3),ip=Math.min(NM-1,i+3);
    const cv=(MLS.cB[j*NM+im]+MLS.cB[j*NM+ip]+MLS.cB[jm*NM+i]+MLS.cB[jp*NM+i])/4-h;
    s0[k*4]=mlHalf(h);s0[k*4+1]=mlHalf(MLS.cW[k]);s0[k*4+2]=mlHalf(MLS.cM[4*M2+k]/255);s0[k*4+3]=mlHalf(Math.max(.55,Math.min(1,1-cv*.35)));
    for(let c=0;c<4;c++)s1[k*4+c]=MLS.cM[c*M2+k];}
  const mk=(u,f)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,f);return t;};
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  MLS.s0=mk(ML_U0+2,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,NM,NM,0,gl.RGBA,gl.HALF_FLOAT,s0);
  MLS.s1=mk(ML_U0+3,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,NM,NM,0,gl.RGBA,gl.UNSIGNED_BYTE,s1);
  /* the soil near the truck: 1536 x 1536 cells, wrapping round as the truck moves (rut, churn, press, wet; heading) */
  const NW=MLS.NW;MLS.w0=mk(ML_U0,gl.REPEAT);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA16F,NW,NW);MLS.w1=mk(ML_U0+1,gl.REPEAT);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RG8,NW,NW);
  const T=MLS.T,n=T*T;MLS.lut=new Uint16Array(256);for(let q=0;q<256;q++)MLS.lut[q]=mlHalf(q/255);
  MLS.zh=new Uint16Array(n*4);const nw=mlHalf(-9999);for(let k=0;k<n;k++)MLS.zh[k*4+3]=nw;MLS.zd=new Uint8Array(n*2).fill(128);
  MLS.hb=new Uint16Array(n*4);MLS.db=new Uint8Array(n*2);
  {const B=64,bh=new Uint16Array(NW*B*4),bd=new Uint8Array(NW*B*2).fill(128);for(let k=0;k<NW*B;k++)bh[k*4+3]=nw;
    for(let j0=0;j0<NW;j0+=B){gl.activeTexture(gl.TEXTURE0+ML_U0);gl.bindTexture(gl.TEXTURE_2D,MLS.w0);gl.texSubImage2D(gl.TEXTURE_2D,0,0,j0,NW,B,gl.RGBA,gl.HALF_FLOAT,bh);
      gl.activeTexture(gl.TEXTURE0+ML_U0+1);gl.bindTexture(gl.TEXTURE_2D,MLS.w1);gl.texSubImage2D(gl.TEXTURE_2D,0,0,j0,NW,B,gl.RG,gl.UNSIGNED_BYTE,bd);}}
  mlBindUnits();
  /* the clods' and the dust's colours: his ground pictures' own means (linear), darker where it's turned and wet */
  const mean=(t,d)=>{const L=typeof TEXPACK!=='undefined'&&TEXPACK.layers.find(l=>l.t===t&&l.has);return L?L.m.slice(0,3):d;};
  const dm=mean('DIRT',[.30,.17,.09]),mm=mean('MUD',[.12,.08,.05]),sm=mean('SAND',[.55,.32,.15]),wm=mean('DIRT2',[.4,.25,.12]),gm=mean('GRASS',[.15,.15,.06]);
  MLS.col={loam:dm.map(v=>v*.55),clay:[.2,.165,.12],silt:mm.map(v=>v*.8),peat:[.045,.033,.022],sand:sm.map(v=>v*.85),wsand:wm.map(v=>v*.55),grass:[dm[0]*.5,dm[1]*.5,dm[2]*.45],
    dustloam:dm.map(v=>Math.min(1,v*1.35+.06)),dustsand:sm.map(v=>Math.min(1,v*1.15+.05)),dustgrass:[gm[0]*.6+dm[0]*.6,gm[1]*.6+dm[1]*.6,gm[2]*.6+dm[2]*.6],water:[.3,.25,.18]};
  mlPatchBuild();mlWaterBuild();
  MLS.ready=true;MLS.ms=performance.now()-t0;
}
/* the patch: a grid that follows the truck, a vertex every 8 cm under it, spreading out to 30 m (x = a u + b u^3) */
function mlPatchBuild(){
  const n=GFX.level==='mobile'?160:GFX.level==='low'?192:256,h=n/2,E=MLP.E,A=MLS.C*h,B=E-A,nv=(n+1)*(n+1);
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*4),M=new Float32Array(nv).fill(40),I=[];
  const w=q=>{const u=q/h-1;return A*u+B*u*u*u;};
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const k=j*(n+1)+i;P[k*3]=w(i);P[k*3+1]=0;P[k*3+2]=w(j);N[k*3+1]=1;C[k*4+3]=1;}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+1,r=p+n+1,s=r+1;I.push(p,s,q,p,r,s);}
  if(MLP.mesh&&MLP.mesh.vao)gl.deleteVertexArray(MLP.mesh.vao);
  MLP.mesh=makeMesh({pos:P,nrm:N,col:C,mat:M,idx:nv<65536?new Uint16Array(I):new Uint32Array(I)});MLP.mesh.tris=I.length/3;MLP.n=n;MLP.lvl=GFX.level;
}
/* the water: a flat surface at each water's own level, in squares of 2.56 m over wherever there's water (the shader
   keeps it to the water's own edge, and the ground hides it wherever it stands higher) */
function mlWaterBuild(){
  const S=4,NM=MLS.NM,step=MLS.CM*S,P=[],I=[];let nv=0;
  for(let j=0;j<NM-S;j+=S)for(let i=0;i<NM-S;i+=S){let lv=-99;
    for(let b=0;b<=S;b++)for(let a=0;a<=S;a++){const k=(j+b)*NM+i+a,w=MLS.cW[k];if(w>MLS.cB[k]-.6)lv=Math.max(lv,w);}
    if(lv<-90)continue;const x0=MLS.x0+(i+.5)*MLS.CM,z0=MLS.z0+(j+.5)*MLS.CM;
    for(const [dx,dz] of [[0,0],[step,0],[0,step],[step,step]])P.push(x0+dx-WG.mlA.x,lv,z0+dz-WG.mlA.z);
    I.push(nv,nv+3,nv+1,nv,nv+2,nv+3);nv+=4;}
  if(!nv){MLP.water=null;return;}
  const pos=new Float32Array(P),nrm=new Float32Array(nv*3),col=new Float32Array(nv*4),mat=new Float32Array(nv).fill(50);
  for(let k=0;k<nv;k++){nrm[k*3+1]=1;col[k*4]=.07;col[k*4+1]=.055;col[k*4+2]=.035;col[k*4+3]=1;}
  MLP.water=makeMesh({pos,nrm,col,mat,idx:nv<65536?new Uint16Array(I):new Uint32Array(I)});MLP.water.tris=I.length/3;}
/* ---------- the ground under a point, inside the world: the soil's own height and slope, its surface ---------- */
const ML_IN=2,MLG={clay:0,silt:0,peat:0,sand:0,grass:0,wsand:0,loam:0,wl:-99};
function mlGround(x,z,o){
  if(MLS.off)return false;
  const N=MLS.N,C=MLS.C,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5;
  if(fx<ML_IN||fz<ML_IN||fx>N-1-ML_IN||fz>N-1-ML_IN)return false;
  const i=fx|0,j=fz|0,ax=fx-i,az=fz-j,a=mlRut(i,j),b=mlRut(i+1,j),c=mlRut(i,j+1),d=mlRut(i+1,j+1),x2=a-b-c+d;
  /* (the world's own ground, bilinear every 64 cm, and its slope) */
  const M=MLS.NM,gx0=Math.max(0,Math.min(M-1.001,(x-MLS.x0)/MLS.CM-.5)),gz0=Math.max(0,Math.min(M-1.001,(z-MLS.z0)/MLS.CM-.5)),gi=gx0|0,gj=gz0|0,bx=gx0-gi,bz=gz0-gj,k=gj*M+gi,B=MLS.cB;
  const A0=B[k],A1=B[k+1],A2=B[k+M],A3=B[k+M+1],y2=A0-A1-A2+A3;
  const gx=((b-a)+x2*az)/C+((A1-A0)+y2*bz)/MLS.CM,gz=((c-a)+x2*ax)/C+((A2-A0)+y2*bx)/MLS.CM,l=hyp3(gx,1,gz);
  const y=a+(b-a)*ax+(c-a)*az+x2*ax*az+A0+(A1-A0)*bx+(A2-A0)*bz+y2*bx*bz;
  o.y=MLS.h0+y;o.n[0]=-gx/l;o.n[1]=1/l;o.n[2]=-gz/l;
  /* the surface for the engine's grip, sound and dirt: the soil's (soft soils as mud, turned loam as the ruts), deep
     water as water */
  mlWeights(x,z,MLG);const t=MLS.tiles[(j>>6)*MLS.NT+(i>>6)],ch=t?t.ch[((j&63)<<6)|(i&63)]:0,wd=MLG.wl-y;
  o.surf=wd>.2?'water':MLG.silt+MLG.peat+MLG.clay>.5?'mud':MLG.sand+MLG.wsand>.5?'sand':MLG.grass>.5&&ch<130?'grass':ch>130?'ruts':'dirt';
  return true;}
/* ---------- each tyre's footprint, this frame ---------- */
const ML_BK=[],ML_BW=[],ML_BT=[];
function mlStamp(t,w,dt,S,W){
  const C=MLS.C,N=MLS.N,cp=w.cp,now=mlNow();
  let ux=w.f[0],uz=w.f[2];const fl=Math.hypot(ux,uz)||1;ux/=fl;uz/=fl;const rx=-uz,rz=ux;
  const R=w.R,hw=(w.front?t.c.tyreW:t.c.tyreWR)*.5,hl=Math.min(.24,.1+R*.12),bw=.2,ext=hw+bw;
  w.mlFz=w.mlFz===undefined?w.Fz:w.mlFz+(w.Fz-w.mlFz)*Math.min(1,dt/.12);const pn=w.mlFz/(4*hw*hl)/ML_PREF,slip=w.w*R-w.vl,aslip=Math.abs(slip),spin=Math.max(0,aslip-.35);
  const p=t.p,v=t.v,Wv=t.w,ry=cp[1]-p[1],qx=cp[0]-p[0],qz=cp[2]-p[2],vx=v[0]+(Wv[1]*qz-Wv[2]*ry),vz=v[2]+(Wv[0]*ry-Wv[1]*qx),vlat=vx*rx+vz*rz,side=Math.max(0,Math.abs(vlat)-.6)*Math.sign(vlat);
  const Hc=cp[1]-MLS.h0,rad=Math.hypot(hl,ext)+C;
  const i0=Math.max(2,Math.floor((cp[0]-rad-MLS.x0)/C)),i1=Math.min(N-3,Math.ceil((cp[0]+rad-MLS.x0)/C)),j0=Math.max(2,Math.floor((cp[2]-rad-MLS.z0)/C)),j1=Math.min(N-3,Math.ceil((cp[2]+rad-MLS.z0)/C));
  if(i0>i1||j0>j1)return 0;
  let sunk=0,plough=0,dug=0,bwSum=0;ML_BK.length=ML_BW.length=ML_BT.length=0;
  const th2=2*Math.atan2(uz,ux),hc2=Math.round(127.5+127*Math.cos(th2)),hs2=Math.round(127.5+127*Math.sin(th2));
  /* wet sand goes soft as it's churned; the wet tyre's track */
  const sinkK=dt/ML_TAU,dig=S.dig*spin*dt,sl=Math.abs(side),wetT=w.mlWet>.05?now-(1-w.mlWet)*90:-9999,liq=W.wsand,peat=W.peat,touched=new Set();
  for(let j=j0;j<=j1;j++){const pz=MLS.z0+(j+.5)*C-cp[2];
    for(let i=i0;i<=i1;i++){const px=MLS.x0+(i+.5)*C-cp[0],a=px*ux+pz*uz,b=px*rx+pz*rz,ab=Math.abs(b),aa=Math.abs(a);
      if(aa>hl||ab>ext)continue;const T=mlTile(i>>6,j>>6,true),k=((j&63)<<6)|(i&63);
      if(ab>hw){const q=(ab-hw)/bw,wt=(q<.35?q/.35:(1-q)/.65)*(1-aa/hl*.5)*(side?(Math.sign(b)===Math.sign(side)?1+2.5*Math.min(1,sl):Math.max(.15,1-sl)):1);
        ML_BT.push(T);ML_BK.push(k);ML_BW.push(wt);bwSum+=wt;continue;}
      touched.add(T);
      const cur=mlC(MLS.cB,MLS.x0+(i+.5)*C,MLS.z0+(j+.5)*C)+T.r[k],ty=Hc+R-Math.sqrt(R*R-a*a)+Math.max(0,ab-(hw-.045))*.6;let nh=cur;
      const broken=T.fl[k]&1,D=broken?ML_SOUP.D:S.D*(1+4*liq*T.ch[k]/255),mx=broken?ML_SOUP.max:S.max;
      if(nh>ty){const cut=nh-ty;sunk+=cut;T.cp[k]=Math.min(255,T.cp[k]+cut/D*100);nh=ty;}
      const touch=cur-ty>-.015,cm=T.cp[k]*.01;
      let dz=touch?Math.min(.6*dt,Math.max(0,pn-Math.pow(cm,1.6))*D*sinkK):0,dd=touch||cur-ty>-.05?dig*(1-ab/hw*.45)*(broken?1.6:1):0;
      const sc=touch&&sl>0?S.dig*.35*sl*dt:0;
      const floor=-mx;if(T.r[k]+(nh-cur)-dz-dd-sc<floor){const room=Math.max(0,T.r[k]+(nh-cur)-floor),tot=dz+dd+sc||1;dz*=room/tot;dd*=room/tot;}
      nh-=dz+dd+sc;sunk+=dz;dug+=dd;plough+=sc;
      if(dz>0){T.cp[k]=Math.min(255,T.cp[k]+dz/D*100);
        /* (peat: part of it only bends, and comes back once the tyre has gone) */
        if(S.spring>0){if(!T.sp)T.sp=new Float32Array(MLS.T*MLS.T);T.sp[k]+=dz*S.spring;}}
      if(dd>0){T.cp[k]=Math.max(0,T.cp[k]-dd/D*60);T.ch[k]=Math.min(255,T.ch[k]+40+dd*9000);
        /* (peat: spun through, the mat breaks and there's soup under it) */
        if(peat>.45&&T.r[k]+(nh-cur)<-.08)T.fl[k]|=1;}
      else if(touch&&aslip>.15)T.ch[k]=Math.min(255,T.ch[k]+aslip*dt*300);
      if(touch){T.pr[k]=Math.max(T.pr[k],T.ch[k]>120?120:220);if(aslip<1.2){T.dr[k*2]=hc2;T.dr[k*2+1]=hs2;}if(wetT>T.wt[k])T.wt[k]=wetT;}
      T.r[k]+=nh-cur;mlDirtyT(T);
    }}
  /* the berms: what was scraped aside, and the soil's share of what sank */
  const up=plough+sunk*S.berm;
  if(up>0&&bwSum>0){const kk=up/bwSum;for(let q=0;q<ML_BK.length;q++){const T=ML_BT[q],k=ML_BK[q],wt=ML_BW[q];T.r[k]+=kk*wt;T.ch[k]=Math.min(255,T.ch[k]+wt*(10+up*400));mlDirtyT(T);}}
  /* soft soils keep moving after the tyre: slumping silt and sand, springing peat */
  if(S.slump>0||S.spring>0||peat>.3)for(const T of touched)MLS.act.set(T,mlNow()+9);
  MLS.stat.dug+=dug*C*C;return dug*C*C;
}
/* ---------- the soft soils moving on their own: silt and wet sand slump back into their ruts, peat springs back ---------- */
function mlSettle(dt){
  const now=mlNow(),L=[];for(const [T,until] of MLS.act){if(L.length>=5)break;L.push(T);}
  for(const T of L){const until=MLS.act.get(T);MLS.act.delete(T);if(now<until)MLS.act.set(T,until);
    /* (each square settles by the time since it last did: a few squares a frame, round and round) */
    const dd=Math.min(.12,now-(T.st||now-dt));T.st=now;const r=T.r,x0=T.ti*64,z0=T.tj*64,W=MLW;
    mlWeights(MLS.x0+(x0+32)*MLS.C,MLS.z0+(z0+32)*MLS.C,W);const P=mlParams(W),ks=Math.min(.22,dd*P.slump*2);
    if(ks>.001||T.fl.some(f=>f&1)){for(let j=0;j<64;j++)for(let i=0;i<64;i++){const k=(j<<6)|i,gi=x0+i,gj=z0+j;
      const kk=T.fl[k]&1?Math.min(.22,dd*3):ks;if(kk<=.001)continue;
      const nb=(i>0?r[k-1]:mlRut(gi-1,gj))+(i<63?r[k+1]:mlRut(gi+1,gj))+(j>0?r[k-64]:mlRut(gi,gj-1))+(j<63?r[k+64]:mlRut(gi,gj+1));
      r[k]+=(nb*.25-r[k])*kk;}}
    if(T.sp){const kr=1-Math.exp(-dd/.35);for(let k=0;k<4096;k++){const s=T.sp[k];if(s>1e-5){const q=s*kr;r[k]+=q;T.sp[k]-=q;}}}
    mlDirtyT(T);}
}
/* ---------- what each tyre throws ---------- */
function mlThrow(t,w,dt,S,W,wd){
  const R=w.R,cp=w.cp,n=w.n,wr=w.w*R,awr=Math.abs(wr),s=wr>=0?1:-1,slip=wr-w.vl,spin=Math.max(0,Math.abs(slip)-.35),K=LOOK.dust,soil=S.main;
  let ux=w.f[0],uy=w.f[1],uz=w.f[2];const fl=hyp3(ux,uy,uz)||1;ux/=fl;uy/=fl;uz/=fl;const rx=w.r[0],ry=w.r[1],rz=w.r[2];
  const hub=[cp[0]+n[0]*R,cp[1]+n[1]*R,cp[2]+n[2]*R],v=t.v,cap=fxCap(),col=MLS.col[soil]||MLS.col.loam,soupy=soil==='silt'||soil==='peat'&&W.peat>.6;
  const clod=(th,k,dep,kind)=>{if(FX.length>=cap)return;const sn=Math.sin(th),cs=Math.cos(th),sp=Math.min(awr,11)*k;
    const px=hub[0]+R*(-s*ux*sn-n[0]*cs),py=hub[1]+R*(-s*uy*sn-n[1]*cs),pz=hub[2]+R*(-s*uz*sn-n[2]*cs),lat=(Math.random()-.5)*.38*sp;
    const r0=Math.random(),sz=(.012+.05*r0*r0)*S.size,b=.82+Math.random()*.32,c=kind==='water'?MLS.col.water:col;
    FX.push({kind:kind||'mud',x:px,y:py,z:pz,vx:v[0]+sp*(-s*ux*cs+n[0]*sn)+rx*lat+(Math.random()-.5)*.6,vy:v[1]+sp*(-s*uy*cs+n[1]*sn)+ry*lat+Math.random()*.5,vz:v[2]+sp*(-s*uz*cs+n[2]*sn)+rz*lat+(Math.random()-.5)*.6,
      s:kind==='water'?sz*1.4:sz,s0:sz,life:kind==='water'?1.4:3,max:3,r:c[0]*b,g:c[1]*b,b:c[2]*b,yaw:Math.random()*TAU,vol:dep&&kind!=='water'?4.19*sz*sz*sz*.55:0,soil,ml:1});MLS.stat.clods++;};
  /* roost: off the tread just behind the contact, back and up at the tread's speed (soupy soil as splashes) */
  const nr=fxCount(S.roost*spin*K*dt);for(let q=0;q<nr;q++)clod(.15+Math.random()*.8,.5+Math.random()*.5,true,soupy&&Math.random()<.6?'water':'mud');
  /* at speed in wet soil, it peels off the back of the tyre and arcs up */
  if(S.fling&&awr>2){const nf=fxCount(S.fling*Math.min(awr,25)*K*dt);for(let q=0;q<nf;q++)clod(.9+Math.random()*.8,.25+Math.random()*.45,false,soupy?'water':'mud');}
  /* in water: spray off the tyre, sideways and back, more the deeper and the faster */
  if(wd>.015){const sp=Math.abs(w.vl)+spin,ns=fxCount(Math.min(1,wd/.25)*(sp*6+spin*4)*K*dt);
    for(let q=0;q<ns&&FX.length<cap;q++){const sd=(Math.random()<.5?-1:1),k=.25+Math.random()*.5,up=1.2+Math.random()*2.2+sp*.12;
      FX.push({kind:'water',x:cp[0]+rx*sd*.2,y:cp[1]+Math.min(wd,.3),z:cp[2]+rz*sd*.2,vx:v[0]*.6+rx*sd*sp*k-s*ux*spin*.4,vy:up,vz:v[2]*.6+rz*sd*sp*k-s*uz*spin*.4,
        s:.03+Math.random()*.05,s0:.04,life:1.2,max:1.2,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});MLS.stat.splash++;}}
  /* dry soil: dust behind the tyre */
  if(S.dust>.05&&wd<-.05){const sp=Math.hypot(v[0],v[2]),nd=fxCount(S.dust*(Math.max(0,Math.abs(slip)-.8)*1.6+Math.max(0,sp-3)*.3)*K*dt),dc=MLS.col['dust'+soil]||MLS.col.dustloam;
    for(let q=0;q<nd&&FX.length<cap;q++){const back=-s*(.15+Math.random()*.25),k=Math.min(6,Math.abs(slip))*.3;
      FX.push({kind:'dust',x:cp[0]+ux*back+(Math.random()-.5)*.4,y:cp[1]+.12,z:cp[2]+uz*back+(Math.random()-.5)*.4,vx:v[0]*.3-s*ux*k+(Math.random()-.5)*.8,vy:.35+Math.random()*.7,vz:v[2]*.3-s*uz*k+(Math.random()-.5)*.8,
        s:.14+Math.random()*.12,s0:.14+Math.random()*.12,life:1.6+Math.random()*1.2,max:2.8,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}}
}
/* a thrown clod lands: a little more soil where it falls (a soft lump), turned over; true when it's taken in. In water
   it just sinks */
function mlLand(p){
  if(!MLS.ready)return false;const N=MLS.N,C=MLS.C,fi=(p.x-MLS.x0)/C-.5,fj=(p.z-MLS.z0)/C-.5;
  if(fi<3||fj<3||fi>N-4||fj>N-4)return false;
  if(mlC(MLS.cW,p.x,p.z)>mlC(MLS.cB,p.x,p.z)+mlRut(fi|0,fj|0)+.02){MLS.stat.landed++;return true;}
  const r=Math.max(C*1.1,p.s0*1.6),rc=Math.ceil(r/C),ci=Math.round(fi),cj=Math.round(fj);let sw=0;
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2<1)sw+=1-d2;}
  if(sw<=0)return false;const hk=p.vol/(sw*C*C);
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2>=1)continue;const gi=ci+i,gj=cj+j,T=mlTile(gi>>6,gj>>6,true),k=((gj&63)<<6)|(gi&63),wt=1-d2;
    T.r[k]+=hk*wt;T.ch[k]=Math.min(255,T.ch[k]+150*wt+40);T.cp[k]=Math.max(0,T.cp[k]-30*wt);mlDirtyT(T);}
  if(p.soil&&(p.soil==='loam'||p.soil==='sand'||p.soil==='grass')&&p.s0>.02&&FX.length<fxCap()&&Math.random()<.6){const dc=MLS.col['dust'+p.soil]||MLS.col.dustloam,sz=p.s0*3;
    FX.push({kind:'dust',x:p.x,y:p.y+.05,z:p.z,vx:p.vx*.15,vy:.3,vz:p.vz*.15,s:sz,s0:sz,life:.9+Math.random()*.6,max:1.5,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}
  MLS.stat.landed++;return true;}
/* ---------- the water against the truck: drag on the tyres and the body (by how deep and how fast), the bow wave ---------- */
function mlWater(dt,t){
  const p=t.p,b=mlC(MLS.cB,p[0],p[2]),fi=(p[0]-MLS.x0)/MLS.C,fj=(p[2]-MLS.z0)/MLS.C,g=b+mlRut(fi|0,fj|0),wl=mlC(MLS.cW,p[0],p[2]),dw=wl-g;
  MLS.wd=dw;if(dw<=.02)return;
  const M=t.M,fx=M[0],fz=M[6],fl=Math.hypot(fx,fz)||1,f=[fx/fl,fz/fl],v=t.v,vf=v[0]*f[0]+v[2]*f[1],vs=-v[0]*f[1]+v[2]*f[0];
  const imm=Math.max(0,dw-.3),wh=Math.min(dw,.94),Cd=.9,m=t.c.mass||2500;
  /* (forward: the body's front and the four tyres; sideways: the body's side) */
  const Af=1.9*imm+4*t.c.tyreW*wh,As=4.7*imm+2*.9*wh*.5;
  const Ff=-.5*ML_RHO*Cd*Af*Math.abs(vf)*vf,Fs=-.5*ML_RHO*Cd*As*Math.abs(vs)*vs;
  let dvf=Ff/m*dt,dvs=Fs/m*dt;if(Math.abs(dvf)>Math.abs(vf))dvf=-vf;if(Math.abs(dvs)>Math.abs(vs))dvs=-vs;
  v[0]+=f[0]*dvf-f[1]*dvs;v[2]+=f[1]*dvf+f[0]*dvs;
  /* the bow wave: water pushed up and out in front of the truck, and a mist off it */
  const sp=Math.abs(vf);if(sp>1.2&&!reduce){const cap=fxCap(),nb=fxCount(Math.min(1,dw/.35)*sp*sp*1.4*LOOK.dust*dt),fwd=vf>=0?1:-1,L=2.5*fwd;
    for(let q=0;q<nb&&FX.length<cap;q++){const sd=(Math.random()-.5)*2.1,x=p[0]+f[0]*L-f[1]*sd,z=p[2]+f[1]*L+f[0]*sd,out=Math.sign(sd)*(1+Math.random()*1.8)*sp*.22;
      FX.push({kind:'water',x,y:wl+MLS.h0+.05,z,vx:v[0]*.9+f[0]*fwd*sp*.15-f[1]*out,vy:1+Math.random()*1.6+sp*.18,vz:v[2]*.9+f[1]*fwd*sp*.15+f[0]*out,
        s:.04+Math.random()*.06,s0:.05,life:1.3,max:1.3,r:MLS.col.water[0],g:MLS.col.water[1],b:MLS.col.water[2],yaw:0});MLS.stat.splash++;}}
}
/* ---------- each frame, after the physics ---------- */
function mlStep(dt,t){
  if(!WG.mlA||MLS.off)return;if(!MLS.ready)mlInit();if(!MLS.ready||!t||t.rt)return;MLS.clock+=dt;
  /* (the soil's grip, and a clogged tread's, on each tyre: the engine's grip times the soil's) */
  {const P=Object.getPrototypeOf(t);if(!P.__mlg){const o=P._smu;P._smu=function(wh,s){return o.call(this,wh,s)*(wh.mlGrip===undefined?1:wh.mlGrip);};P.__mlg=1;}}
  mlWater(dt,t);
  for(const w of t.wheels){w.mlOn=false;if(w.mlClog===undefined){w.mlClog=0;w.mlWet=0;}
    if(!w.contact){w.mlFz=0;continue;}
    const fi=(w.cp[0]-MLS.x0)/MLS.C,fj=(w.cp[2]-MLS.z0)/MLS.C;if(fi<8||fj<8||fi>MLS.N-8||fj>MLS.N-8){w.mlGrip=1;continue;}
    const W=mlWeights(w.cp[0],w.cp[2],MLW),S=mlParams(W),wd=W.wl-(w.cp[1]-MLS.h0),wR=Math.abs(w.w*w.R);w.mlOn=true;
    /* clay packs into the tread as it rolls; spinning throws it out; other ground wears it off */
    const roll=Math.min(1,Math.abs(w.vl)/3);w.mlClog=Math.max(0,Math.min(1,w.mlClog+dt*(W.clay*.32*roll*(wd<.05?1:.2)-w.mlClog*(Math.max(0,wR-5)*.09+(1-W.clay)*.12+(wd>.1?.3:0)))));
    w.mlGrip=S.grip*(1-.5*w.mlClog)*(wd>.05?.92:1);
    /* tyres come out of water or wet mud wet, and dry as they roll on */
    const wetSoil=Math.max(W.silt,W.peat,W.wsand*.6,W.clay*.4);if(wd>.01||wetSoil>.5)w.mlWet=1;else w.mlWet=Math.max(0,w.mlWet-dt*(.04+.025*Math.abs(w.vl)));
    const dug=mlStamp(t,w,dt,S,W);if(!reduce)mlThrow(t,w,dt,S,W,wd);
    if(W.clay>.4&&roll>.2)GAME.dirt=Math.min(1,GAME.dirt+dt*.012*W.clay);}
  mlSettle(dt);mlWindow();mlUpload();
}
/* ---------- the graphics card's soil: a window of 24 x 24 squares round the truck, wrapping as it moves ---------- */
function mlWindow(){const c=GAME.car;if(!c)return;const cs=MLS.T*MLS.C,ci=Math.floor((c.p[0]-MLS.x0)/cs),cj=Math.floor((c.p[2]-MLS.z0)/cs),H=MLS.NW/MLS.T/2;
  if(ci===MLS.wc[0]&&cj===MLS.wc[1])return;const old=MLS.wc.slice();MLS.wc=[ci,cj];
  for(let tj=cj-H;tj<cj+H;tj++)for(let ti=ci-H;ti<ci+H;ti++){if(ti<0||tj<0||ti>=MLS.NT||tj>=MLS.NT)continue;
    if(Number.isFinite(old[0])&&ti>=old[0]-H&&ti<old[0]+H&&tj>=old[1]-H&&tj<old[1]+H)continue;MLS.up.add(tj*MLS.NT+ti);}}
function mlUpload(){
  const T=MLS.T,n=T*T,H=MLS.NW/T/2,[ci,cj]=MLS.wc,LU=MLS.lut;let up=0;
  for(const q of MLS.up){if(up>=48)break;MLS.up.delete(q);const ti=q%MLS.NT,tj=(q/MLS.NT)|0;
    if(ti<ci-H||ti>=ci+H||tj<cj-H||tj>=cj+H)continue;up++;
    const t=MLS.tiles[q],sx=(((ti*T)%MLS.NW)+MLS.NW)%MLS.NW,sz=(((tj*T)%MLS.NW)+MLS.NW)%MLS.NW;let hb=MLS.zh,db=MLS.zd;
    if(t){hb=MLS.hb;db=MLS.db;for(let k=0;k<n;k++){const o=k*4;hb[o]=mlHalf(t.r[k]);hb[o+1]=LU[t.ch[k]];hb[o+2]=LU[t.pr[k]];hb[o+3]=mlHalf(t.wt[k]);db[k*2]=t.dr[k*2];db[k*2+1]=t.dr[k*2+1];}}
    gl.activeTexture(gl.TEXTURE0+ML_U0);gl.bindTexture(gl.TEXTURE_2D,MLS.w0);gl.texSubImage2D(gl.TEXTURE_2D,0,sx,sz,T,T,gl.RGBA,gl.HALF_FLOAT,hb);
    gl.activeTexture(gl.TEXTURE0+ML_U0+1);gl.bindTexture(gl.TEXTURE_2D,MLS.w1);gl.texSubImage2D(gl.TEXTURE_2D,0,sx,sz,T,T,gl.RG,gl.UNSIGNED_BYTE,db);}
  if(up)gl.activeTexture(gl.TEXTURE0);MLS.stat.up=up;}
/* the soil's four textures sit on four texture units of their own, high up where nothing else binds (27 to 30), held
   there for good: blank ones until the world is laid out (G.finish wrapped once, at the land's programs' making) */
let ML_BLANK=null,ML_U0=27;
function mlBlank(){if(!ML_BLANK){ML_BLANK=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,ML_BLANK);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,1,1,0,gl.RGBA,gl.HALF_FLOAT,new Uint16Array(4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);}return ML_BLANK;}
const ML_SAMP=['uMLt','uMLd','uMLs0','uMLs1'];
function mlBindUnits(){const X=[MLS.w0,MLS.w1,MLS.s0,MLS.s1];for(let q=0;q<4;q++){gl.activeTexture(gl.TEXTURE0+ML_U0+q);gl.bindTexture(gl.TEXTURE_2D,X[q]||mlBlank());}gl.activeTexture(gl.TEXTURE0);}
function mlHookUse(G){if(G._mlu)return;G._mlu=1;ML_U0=Math.min(27,gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)-4);const f0=G.finish;
  G.finish=P=>{const was=P.ready,r=f0(P);
    /* (the program's other samplers back on the units they had before these came along: other code binds to them) */
    if(!was&&P.samplers&&P.samplers.uMLt!==undefined){gl.useProgram(P.p);let n=0;
      for(const k of Object.keys(P.samplers)){const q=ML_SAMP.indexOf(k),u=q>=0?ML_U0+q:n++,l=gl.getUniformLocation(P.p,k);if(l)gl.uniform1i(l,u);P.samplers[k]=u;}mlBindUnits();}
    return r;};}
/* the land's uniforms for the soil (each lit pass): where the world is, the window, the patch, the time */
function mlUniforms(P){
  const G=R.G,on=MLS.ready?1:0;
  if(on&&GAME.car){if(MLP.lvl!==GFX.level)mlPatchBuild();const c=GAME.car,A=WG.mlA,lim=MLS.WS/2+MLP.E;
    MLP.cx=Math.round(c.p[0]*2)/2;MLP.cz=Math.round(c.p[2]*2)/2;MLP.on=Math.abs(MLP.cx-A.x)<lim&&Math.abs(MLP.cz-A.z)<lim;}else MLP.on=false;
  const cs=MLS.T*MLS.C,wx=MLS.x0+(MLS.wc[0]+.5)*cs,wz=MLS.z0+(MLS.wc[1]+.5)*cs,half=(MLS.NW/MLS.T/2-1)*cs;
  G.uni(P,'uMLo',[MLS.x0-RO[0],MLS.z0-RO[2],1/MLS.WS,on]);G.uni(P,'uMLw',[wx-RO[0],wz-RO[2],1/(MLS.NW*MLS.C),Number.isFinite(wx)?half:-1]);
  G.uni(P,'uMLp',[MLP.cx-RO[0],MLP.cz-RO[2],MLP.E,MLP.on?1:0]);G.uni(P,'uMLq',[1/MLS.NW,MLS.C,MLS.h0-RO[1],on?mlNow():0]);G.uni(P,'uMLv',0);mlBindUnits();
}
/* the patch, and the water, after the chunks' ground (the main pass only) */
function mlPatchDraw(u){
  if(!MLS.ready||!MLP.mesh)return 0;let tris=0;
  if(MLP.on){if(u.uMLv)gl.uniform1f(u.uMLv,1);atM(u,MLP.cx,0,MLP.cz);drawMesh(MLP.mesh);if(u.uMLv)gl.uniform1f(u.uMLv,0);tris+=MLP.mesh.tris;}
  if(MLP.water){atM(u,WG.mlA.x,MLS.h0,WG.mlA.z);drawMesh(MLP.water);tris+=MLP.water.tris;}
  return tris;}
/* the world raked smooth again (K on a keyboard; the test tools) */
function mlRake(){if(!MLS.ready)return;for(let q=0;q<MLS.tiles.length;q++)if(MLS.tiles[q]){MLS.tiles[q]=null;MLS.up.add(q);}MLS.ntile=0;MLS.act.clear();}
addEventListener('keydown',e=>{if(e.code==='KeyK'&&GAME.state==='drive'&&!e.repeat){mlRake();if(typeof say==='function')say('The ground raked smooth',1.6);}});
/* for the test tools */
function mlStats(){if(!MLS.ready)return {ready:false};let mn=0,mx=0,ch=0,pr=0,br=0,wet=0;const now=mlNow();
  for(const t of MLS.tiles){if(!t)continue;for(let k=0;k<4096;k++){const r=t.r[k];if(r<mn)mn=r;if(r>mx)mx=r;if(t.ch[k]>60)ch++;if(t.pr[k]>60)pr++;if(t.fl[k]&1)br++;if(now-t.wt[k]<60)wet++;}}
  const a=MLS.C*MLS.C,c=GAME.car;let here=null;if(c){const W=mlWeights(c.p[0],c.p[2],{});here={main:mlParams(W).main,waterCm:+((MLS.wd||0)*100).toFixed(0),clog:c.wheels.map(w=>+(w.mlClog||0).toFixed(2)).join(','),grip:c.wheels.map(w=>+(w.mlGrip||1).toFixed(2)).join(',')};}
  return {ready:true,ms:Math.round(MLS.ms),squares:MLS.ntile,mb:+(MLS.ntile*4096*14/1048576).toFixed(1),deepestCm:+(-mn*100).toFixed(1),bermCm:+(mx*100).toFixed(1),churnedM2:+(ch*a).toFixed(1),pressedM2:+(pr*a).toFixed(1),
    brokenM2:+(br*a).toFixed(1),wetTrackM2:+(wet*a).toFixed(1),dugLitres:+(MLS.stat.dug*1000).toFixed(1),clods:MLS.stat.clods,splash:MLS.stat.splash,fx:FX.length,patch:MLP.mesh?MLP.mesh.tris:0,water:MLP.water?MLP.water.tris:0,settling:MLS.act.size,here};}
window.__ml={MLS,MLP,mlStats,mlRake,mlGround,ML_SOIL,mlWeights,mlParams};
