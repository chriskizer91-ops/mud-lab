/* =====================================================================================
   MUD LAB: THE SOIL (last-road src/ml-soil.js, put in by src/ml_patch.py just before the boot, after Ground Truth's
   own code). The arena (src/ml-world.js, 96 m square) is kept here as a grid of soil every 6.25 cm, 1536 x 1536:
     base   the field's own height (from mlBaseH; never changes)
     rut    what the tyres have done to it: down in the ruts, up in the berms and where thrown clods land
     churn  how much it's been turned over (spun, dug, thrown): dark, moist, lumpy, less grip
     press  how hard it's been pressed by a rolling tyre: smoother, a little darker
     comp   how packed it is: a tyre sinks until the soil under it bears its pressure, and packed soil bears more
   THE PHYSICS FEELS IT: inside the arena the ground under the wheels (groundInto) is this grid (base + rut), so a
   tyre drops into an old rut, its walls catch the sidewall (the engine's own edge catch), the berm ahead pushes back.
   EACH TYRE, EACH FRAME (mlStep, after the physics):
     sinks: the soil under its footprint yields while the tyre's pressure is more than the soil bears; the bearing
       grows as it packs, so a parked truck settles a few centimetres and stops, a fast one leaves a shallower rut,
       and the back tyres follow the front ones' ruts (already packed) without going much deeper
     packs: soil higher than the tyre (the rut's leading edge, a bump, a berm) is pressed down to it, packed as if it
       had sunk there; a share of all that sinks (more in sand and mud, little in sod) squeezes up beside it as berms
     scrapes: sliding sideways it scrapes soil off toward the slide's leading side
     digs: a spinning tyre digs, deeper the harder it spins, down to the soil's floor, and throws what it digs
     throws: clods leave the tread behind and above the tyre (roost), at the tread's own speed; at speed in mud
       they peel off the back of the tyre; dry soil makes dust. The clods land and stay (a little more soil there)
   THE PICTURE: one texture (RGBA16F: base, rut, churn, press) read by the land's shader: near the truck a fine mesh
   (the patch, 6.25 cm apart under the truck, coarser outward to 30 m) is lifted by it, so ruts and berms are really
   in the ground; everywhere in the arena the shader shades the ruts' slopes, the churned soil and the pressed tracks.
   Soils (by the ground's surface): loam (dirt), mud (the bog), grass (sod), sand.
   ===================================================================================== */
const ML_SOIL={
  /* D: how far it sinks at the reference pressure (m); max: its floor (m); berm: share of the sunk soil pushed up
     beside the tyre; dig: metres dug a second for each m/s of wheelspin; roost: clods a second per m/s of spin;
     fling: clods a second per m/s of speed (wet soil peeling off the tread); dust: dry dust */
  dirt:{D:.05,max:.2,berm:.2,dig:.010,roost:16,fling:0,dust:1},
  mud:{D:.12,max:.42,berm:.45,dig:.022,roost:16,fling:.7,dust:0},
  grass:{D:.022,max:.11,berm:.12,dig:.006,roost:9,fling:0,dust:.35},
  sand:{D:.065,max:.24,berm:.5,dig:.02,roost:22,fling:0,dust:.45}};
const ML_PREF=50000,ML_TAU=.06;
const MLS={ready:false,N:1536,cell:1/16,size:96,x0:0,z0:0,h0:0,NM:192,
  base:null,baseH:null,lut:null,rut:null,churn:null,press:null,comp:null,dir:null,dtex:null,db:null,mcode:null,tex:null,mtex:null,T:24,dirty:null,hb:null,col:{},stat:{dug:0,clods:0,landed:0,up:0}};
const MLP={mesh:null,n:0,E:30,cx:0,cz:0,on:false};
/* half floats for the texture */
const ML_F=new Float32Array(1),ML_U=new Uint32Array(ML_F.buffer);
function mlHalf(v){ML_F[0]=v;const x=ML_U[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-112;const m=x&0x7fffff;
  if(e<=0){if(e<-10)return s;return s|(((m|0x800000)>>>(13-e))+1>>>1);}if(e>=31)return s|0x7c00;const h=s|(e<<10)|(m>>>13);return (m&0x1000)?h+1:h;}
/* lay the field out (the first time the truck drives) */
function mlInit(){
  if(MLS.ready||!WG.mlA)return;const A=WG.mlA,t0=performance.now();
  MLS.h0=WG.mlLevel();MLS.x0=A.x-MLS.size/2;MLS.z0=A.z-MLS.size/2;const N=MLS.N,C=MLS.cell,NN=N*N;
  MLS.base=new Float32Array(NN);MLS.rut=new Float32Array(NN);MLS.churn=new Uint8Array(NN);MLS.press=new Uint8Array(NN);MLS.comp=new Uint8Array(NN);MLS.dir=new Uint8Array(NN*2).fill(128);
  for(let j=0;j<N;j++){const v=MLS.z0+(j+.5)*C-A.z;for(let i=0;i<N;i++)MLS.base[j*N+i]=WG.mlBaseH(MLS.x0+(i+.5)*C-A.x,v);}
  /* what it's made of, every half metre: the surface for the physics, and the colour weights for the patch (as the
     engine's chunks make them: grass or -sand, rock, mud, and the hollows' shade from the curvature over 2 m) */
  const NM=MLS.NM,CM=MLS.size/NM,o={},mw=new Uint16Array(NM*NM*4);MLS.mcode=new Uint8Array(NM*NM);
  for(let j=0;j<NM;j++)for(let i=0;i<NM;i++){const u=MLS.x0+(i+.5)*CM-A.x,v=MLS.z0+(j+.5)*CM-A.z,k=j*NM+i;WG.mlMat(u,v,o);MLS.mcode[k]=o.code;
    const h=WG.mlBaseH(u,v),cv=(WG.mlBaseH(u-2,v)+WG.mlBaseH(u+2,v)+WG.mlBaseH(u,v-2)+WG.mlBaseH(u,v+2))/4-h;
    mw[k*4]=mlHalf(o.sand>.02?-o.sand:o.grass);mw[k*4+1]=mlHalf(0);mw[k*4+2]=mlHalf(o.mud);mw[k*4+3]=mlHalf(Math.max(.55,Math.min(1,1-cv*.35)));}
  const mk=u=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  MLS.mtex=mk(ML_U0+1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,NM,NM,0,gl.RGBA,gl.HALF_FLOAT,mw);
  MLS.tex=mk(ML_U0);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA16F,N,N);
  MLS.dtex=mk(ML_U0+2);gl.texImage2D(gl.TEXTURE_2D,0,gl.RG8,N,N,0,gl.RG,gl.UNSIGNED_BYTE,MLS.dir);
  /* (the field's own height kept as half floats, and 0..255 as half floats, so an upload converts only the ruts) */
  MLS.baseH=new Uint16Array(NN);for(let k=0;k<NN;k++)MLS.baseH[k]=mlHalf(MLS.base[k]);MLS.lut=new Uint16Array(256);for(let q=0;q<256;q++)MLS.lut[q]=mlHalf(q/255);
  {const B=64,buf=new Uint16Array(N*B*4);for(let j0=0;j0<N;j0+=B){for(let j=0;j<B;j++)for(let i=0;i<N;i++){const o4=(j*N+i)*4;buf[o4]=MLS.baseH[(j0+j)*N+i];buf[o4+1]=buf[o4+2]=buf[o4+3]=0;}
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,j0,N,B,gl.RGBA,gl.HALF_FLOAT,buf);}}
  mlBindUnits();
  const TN=N/MLS.T;MLS.dirty=new Uint8Array(TN*TN);MLS.hb=new Uint16Array(MLS.T*MLS.T*4);MLS.db=new Uint8Array(MLS.T*MLS.T*2);
  /* the clods' and the dust's colours: his ground pictures' own means (linear), darker where it's turned and wet */
  const mean=(t,d)=>{const L=typeof TEXPACK!=='undefined'&&TEXPACK.layers.find(l=>l.t===t&&l.has);return L?L.m.slice(0,3):d;};
  const dm=mean('DIRT',[.30,.17,.09]),mm=mean('MUD',[.12,.08,.05]),sm=mean('SAND',[.55,.32,.15]),gm=mean('GRASS',[.15,.15,.06]);
  MLS.col={dirt:dm.map(v=>v*.55),mud:mm.map(v=>v*.75),grass:[dm[0]*.5,dm[1]*.5,dm[2]*.45],sand:sm.map(v=>v*.85),
    dustdirt:dm.map(v=>Math.min(1,v*1.35+.06)),dustsand:sm.map(v=>Math.min(1,v*1.15+.05)),dustgrass:[gm[0]*.6+dm[0]*.6,gm[1]*.6+dm[1]*.6,gm[2]*.6+dm[2]*.6]};
  mlPatchBuild();
  MLS.ready=true;MLS.ms=performance.now()-t0;
}
/* the patch: a grid that follows the truck, a vertex every 6.25 cm under it, spreading out to 30 m (x = a u + b u^3) */
function mlPatchBuild(){
  const n=GFX.level==='mobile'?160:GFX.level==='low'?192:256,h=n/2,E=MLP.E,A=MLS.cell*h,B=E-A,nv=(n+1)*(n+1);
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*4),M=new Float32Array(nv).fill(40),I=[];
  const w=q=>{const u=q/h-1;return A*u+B*u*u*u;};
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const k=j*(n+1)+i;P[k*3]=w(i);P[k*3+1]=0;P[k*3+2]=w(j);N[k*3+1]=1;C[k*4+3]=1;}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=j*(n+1)+i,q=p+1,r=p+n+1,s=r+1;I.push(p,s,q,p,r,s);}
  if(MLP.mesh&&MLP.mesh.vao)gl.deleteVertexArray(MLP.mesh.vao);
  MLP.mesh=makeMesh({pos:P,nrm:N,col:C,mat:M,idx:nv<65536?new Uint16Array(I):new Uint32Array(I)});MLP.mesh.tris=I.length/3;MLP.n=n;MLP.lvl=GFX.level;
}
/* the ground under a point, inside the arena: the soil's own height and slope (bilinear), its surface (false outside) */
const ML_IN=1.5;
function mlGround(x,z,o){
  if(MLS.off)return false;
  const N=MLS.N,C=MLS.cell,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5;
  if(fx<ML_IN||fz<ML_IN||fx>N-1-ML_IN||fz>N-1-ML_IN)return false;
  const i=fx|0,j=fz|0,ax=fx-i,az=fz-j,k=j*N+i,B=MLS.base,R=MLS.rut;
  const a=B[k]+R[k],b=B[k+1]+R[k+1],c=B[k+N]+R[k+N],d=B[k+N+1]+R[k+N+1],x2=a-b-c+d;
  const gx=((b-a)+x2*az)/C,gz=((c-a)+x2*ax)/C,l=hyp3(gx,1,gz);
  o.y=MLS.h0+a+(b-a)*ax+(c-a)*az+x2*ax*az;o.n[0]=-gx/l;o.n[1]=1/l;o.n[2]=-gz/l;
  const s=mlSurfK(k,x,z);o.surf=s;return true;}
/* the surface for the grip: the ground's own, but soil turned over by the tyres grips like the lane's ruts (the bog
   and the sand stay what they are) */
function mlSurfK(k,x,z){const NM=MLS.NM,CM=MLS.size/NM,mi=Math.min(NM-1,Math.max(0,((x-MLS.x0)/CM)|0)),mj=Math.min(NM-1,Math.max(0,((z-MLS.z0)/CM)|0));
  const s=WG.SURF[MLS.mcode[mj*NM+mi]];return (s==='dirt'||s==='grass')&&MLS.churn[k]>130?'ruts':s;}
function mlSoilAt(x,z){const NM=MLS.NM,CM=MLS.size/NM,mi=Math.min(NM-1,Math.max(0,((x-MLS.x0)/CM)|0)),mj=Math.min(NM-1,Math.max(0,((z-MLS.z0)/CM)|0));
  const s=WG.SURF[MLS.mcode[mj*NM+mi]];return ML_SOIL[s]?s:'dirt';}
function mlDirty(i,j){const T=MLS.T,TN=MLS.N/T;MLS.dirty[((j/T)|0)*TN+((i/T)|0)]=1;}
/* ---------- each tyre's footprint, this frame ---------- */
const ML_BK=[],ML_BW=[];
function mlStamp(t,w,dt,S,soil){
  const N=MLS.N,C=MLS.cell,B=MLS.base,RT=MLS.rut,CH=MLS.churn,PR=MLS.press,CP=MLS.comp,cp=w.cp,n=w.n;
  let ux=w.f[0],uz=w.f[2];const fl=Math.hypot(ux,uz)||1;ux/=fl;uz/=fl;const rx=-uz,rz=ux;
  const R=w.R,hw=(w.front?t.c.tyreW:t.c.tyreWR)*.5,hl=Math.min(.24,.1+R*.12),bw=.2,ext=hw+bw;
  w.mlFz=w.mlFz===undefined?w.Fz:w.mlFz+(w.Fz-w.mlFz)*Math.min(1,dt/.12);const pn=w.mlFz/(4*hw*hl)/ML_PREF,slip=w.w*R-w.vl,aslip=Math.abs(slip),spin=Math.max(0,aslip-.35);
  /* the slide: the contact patch's own sideways speed */
  const p=t.p,v=t.v,W=t.w,ry=cp[1]-p[1],qx=cp[0]-p[0],qz=cp[2]-p[2],vx=v[0]+(W[1]*qz-W[2]*ry),vz=v[2]+(W[0]*ry-W[1]*qx),vlat=vx*rx+vz*rz,side=Math.max(0,Math.abs(vlat)-.6)*Math.sign(vlat);
  const Hc=cp[1]-MLS.h0,rad=Math.hypot(hl,ext)+C;
  const i0=Math.max(1,Math.floor((cp[0]-rad-MLS.x0)/C)),i1=Math.min(N-2,Math.ceil((cp[0]+rad-MLS.x0)/C)),j0=Math.max(1,Math.floor((cp[2]-rad-MLS.z0)/C)),j1=Math.min(N-2,Math.ceil((cp[2]+rad-MLS.z0)/C));
  if(i0>i1||j0>j1)return 0;
  let plough=0,sunk=0,dug=0,bwSum=0;ML_BK.length=0;ML_BW.length=0;
  const th2=2*Math.atan2(uz,ux),hc2=Math.round(127.5+127*Math.cos(th2)),hs2=Math.round(127.5+127*Math.sin(th2));
  const sinkK=S.D/ML_TAU*dt,dig=S.dig*spin*dt,sl=Math.abs(side);
  for(let j=j0;j<=j1;j++){const pz=MLS.z0+(j+.5)*C-cp[2];
    for(let i=i0;i<=i1;i++){const px=MLS.x0+(i+.5)*C-cp[0],a=px*ux+pz*uz,b=px*rx+pz*rz,ab=Math.abs(b),aa=Math.abs(a);
      if(aa>hl)continue;const k=j*N+i;
      if(ab>hw){if(ab<ext){const q=(ab-hw)/bw,wt=(q<.35?q/.35:(1-q)/.65)*(1-aa/hl*.5)*(side?(Math.sign(b)===Math.sign(side)?1+2.5*Math.min(1,sl):Math.max(.15,1-sl)):1);
        ML_BK.push(k);ML_BW.push(wt);bwSum+=wt;}continue;}
      const cur=B[k]+RT[k],ty=Hc+R-Math.sqrt(R*R-a*a)+Math.max(0,ab-(hw-.045))*.6;let nh=cur;
      /* soil standing higher than the tyre is pressed down to it (packed, as if it had sunk there) */
      if(nh>ty){const cut=nh-ty;sunk+=cut;CP[k]=Math.min(255,CP[k]+cut/S.D*100);nh=ty;}
      const touch=cur-ty>-.015,cm=CP[k]*.01;
      let dz=touch?Math.min(.6*dt,Math.max(0,pn-Math.pow(cm,1.6))*sinkK):0,dd=touch||cur-ty>-.05?dig*(1-ab/hw*.45):0;
      /* sliding sideways it scrapes the soil off toward the slide's leading side */
      const sc=touch&&sl>0?S.dig*.35*sl*dt:0;
      const floor=B[k]-S.max;if(nh-dz-dd-sc<floor){const room=Math.max(0,nh-floor),tot=dz+dd+sc||1;dz*=room/tot;dd*=room/tot;}
      nh-=dz+dd+sc;sunk+=dz;dug+=dd;plough+=sc;
      if(dz>0)CP[k]=Math.min(255,CP[k]+dz/S.D*100);
      if(dd>0){CP[k]=Math.max(0,CP[k]-dd/S.D*60);CH[k]=Math.min(255,CH[k]+40+dd*9000);}
      else if(touch&&aslip>.15)CH[k]=Math.min(255,CH[k]+aslip*dt*300);
      if(touch){PR[k]=Math.max(PR[k],CH[k]>120?120:220);if(aslip<1.2){MLS.dir[k*2]=hc2;MLS.dir[k*2+1]=hs2;}}
      if(nh!==cur){RT[k]=nh-B[k];mlDirty(i,j);}else if(touch)mlDirty(i,j);
    }}
  /* the berms: what was ploughed, and the soil's share of what sank */
  const up=plough+sunk*S.berm;
  if(up>0&&bwSum>0){const kk=up/bwSum;for(let q=0;q<ML_BK.length;q++){const k=ML_BK[q],wt=ML_BW[q];RT[k]+=kk*wt;CH[k]=Math.min(255,CH[k]+wt*(10+up*400));mlDirty(k%N,(k/N)|0);}}
  MLS.stat.dug+=dug*C*C;
  return dug*C*C;
}
/* ---------- what each tyre throws ---------- */
const ML_UP=[0,1,0];
function mlThrow(t,w,dt,soil,S,dugV){
  const R=w.R,cp=w.cp,n=w.n,wr=w.w*R,awr=Math.abs(wr),s=wr>=0?1:-1,slip=wr-w.vl,spin=Math.max(0,Math.abs(slip)-.35),K=LOOK.dust;
  let ux=w.f[0],uy=w.f[1],uz=w.f[2];const fl=hyp3(ux,uy,uz)||1;ux/=fl;uy/=fl;uz/=fl;const rx=w.r[0],ry=w.r[1],rz=w.r[2];
  const hub=[cp[0]+n[0]*R,cp[1]+n[1]*R,cp[2]+n[2]*R],v=t.v;
  const col=MLS.col[soil]||MLS.col.dirt,cap=fxCap(),wet=soil==='mud';
  const clod=(th,k,dep)=>{if(FX.length>=cap)return;const sn=Math.sin(th),cs=Math.cos(th),sp=Math.min(awr,11)*k;
    const px=hub[0]+R*(-s*ux*sn-n[0]*cs),py=hub[1]+R*(-s*uy*sn-n[1]*cs),pz=hub[2]+R*(-s*uz*sn-n[2]*cs),lat=(Math.random()-.5)*.38*sp;
    const r0=Math.random(),sz=wet?.018+.065*r0*r0:soil==='sand'?.006+.014*r0:.012+.05*r0*r0*r0,b=.82+Math.random()*.32;
    FX.push({kind:'mud',x:px,y:py,z:pz,vx:v[0]+sp*(-s*ux*cs+n[0]*sn)+rx*lat+(Math.random()-.5)*.6,vy:v[1]+sp*(-s*uy*cs+n[1]*sn)+ry*lat+Math.random()*.5,vz:v[2]+sp*(-s*uz*cs+n[2]*sn)+rz*lat+(Math.random()-.5)*.6,
      s:sz,s0:sz,life:3,max:3,r:col[0]*b,g:col[1]*b,b:col[2]*b,yaw:Math.random()*TAU,vol:dep?4.19*sz*sz*sz*.55:0,soil,ml:1});MLS.stat.clods++;};
  /* roost: off the tread just behind the contact, back and up at the tread's speed */
  let nr=fxCount(S.roost*spin*K*dt);for(let q=0;q<nr;q++)clod(.15+Math.random()*.8,.5+Math.random()*.5,true);
  /* at speed in mud, it peels off the back of the tyre and arcs up */
  if(S.fling&&awr>2){const nf=fxCount(S.fling*Math.min(awr,25)*K*dt);for(let q=0;q<nf;q++)clod(.9+Math.random()*.8,.25+Math.random()*.45,false);}
  /* dry soil: dust behind the tyre */
  if(S.dust){const sp=Math.hypot(v[0],v[2]),nd=fxCount(S.dust*(Math.max(0,Math.abs(slip)-.8)*1.6+Math.max(0,sp-3)*.3)*K*dt),dc=MLS.col['dust'+soil]||MLS.col.dustdirt;
    for(let q=0;q<nd&&FX.length<cap;q++){const back=-s*(.15+Math.random()*.25),k=Math.min(6,Math.abs(slip))*.3;
      FX.push({kind:'dust',x:cp[0]+ux*back+(Math.random()-.5)*.4,y:cp[1]+.12,z:cp[2]+uz*back+(Math.random()-.5)*.4,vx:v[0]*.3-s*ux*k+(Math.random()-.5)*.8,vy:.35+Math.random()*.7,vz:v[2]*.3-s*uz*k+(Math.random()-.5)*.8,
        s:.14+Math.random()*.12,s0:.14+Math.random()*.12,life:1.6+Math.random()*1.2,max:2.8,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}}
}
/* a thrown clod lands: a little more soil where it falls (a soft lump), turned over; true when it's taken in */
function mlLand(p){
  if(!MLS.ready)return false;const N=MLS.N,C=MLS.cell,fi=(p.x-MLS.x0)/C-.5,fj=(p.z-MLS.z0)/C-.5;
  if(fi<2||fj<2||fi>N-3||fj>N-3)return false;
  const r=Math.max(C*1.1,p.s0*1.6),rc=Math.ceil(r/C),ci=Math.round(fi),cj=Math.round(fj);let sw=0;
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2<1)sw+=1-d2;}
  if(sw<=0)return false;const hk=p.vol/(sw*C*C);
  for(let j=-rc;j<=rc;j++)for(let i=-rc;i<=rc;i++){const d2=((ci+i-fi)**2+(cj+j-fj)**2)*C*C/(r*r);if(d2>=1)continue;const k=(cj+j)*N+ci+i,wt=1-d2;
    MLS.rut[k]+=hk*wt;MLS.churn[k]=Math.min(255,MLS.churn[k]+150*wt+40);MLS.comp[k]=Math.max(0,MLS.comp[k]-30*wt);mlDirty(ci+i,cj+j);}
  /* dry soil breaks up as it lands: a little puff of dust */
  if(p.soil&&p.soil!=='mud'&&p.s0>.02&&FX.length<fxCap()&&Math.random()<.6){const dc=MLS.col['dust'+p.soil]||MLS.col.dustdirt,sz=p.s0*3;
    FX.push({kind:'dust',x:p.x,y:p.y+.05,z:p.z,vx:p.vx*.15,vy:.3,vz:p.vz*.15,s:sz,s0:sz,life:.9+Math.random()*.6,max:1.5,r:dc[0],g:dc[1],b:dc[2],yaw:Math.random()*TAU});}
  MLS.stat.landed++;return true;}
/* ---------- each frame, after the physics ---------- */
function mlStep(dt,t){
  if(!WG.mlA||MLS.off)return;if(!MLS.ready)mlInit();if(!MLS.ready||!t||t.rt)return;
  for(const w of t.wheels){w.mlOn=false;if(!w.contact){w.mlFz=0;continue;}
    const fi=(w.cp[0]-MLS.x0)/MLS.cell,fj=(w.cp[2]-MLS.z0)/MLS.cell;if(fi<8||fj<8||fi>MLS.N-8||fj>MLS.N-8)continue;
    const soil=mlSoilAt(w.cp[0],w.cp[2]),S=ML_SOIL[soil];w.mlOn=true;
    const dug=mlStamp(t,w,dt,S,soil);if(!reduce)mlThrow(t,w,dt,soil,S,dug);}
  mlUpload();
}
/* the changed squares of the soil (24 x 24 each) up to the graphics card, at most 160 a frame (picking up where the
   last frame stopped, so none waits for ever) */
function mlUpload(){
  const T=MLS.T,TN=MLS.N/T,N=MLS.N,D=MLS.dirty,hb=MLS.hb,BH=MLS.baseH,RT=MLS.rut,LU=MLS.lut,CH=MLS.churn,PR=MLS.press;let up=0,q=MLS.uq||0;
  for(let c=0;c<D.length&&up<160;c++,q=(q+1)%D.length){if(!D[q])continue;D[q]=0;up++;const ti=q%TN,tj=(q/TN)|0,i0=ti*T,j0=tj*T;
    for(let j=0;j<T;j++){let k=(j0+j)*N+i0,o=j*T*4;for(let i=0;i<T;i++,k++,o+=4){hb[o]=BH[k];hb[o+1]=mlHalf(RT[k]);hb[o+2]=LU[CH[k]];hb[o+3]=LU[PR[k]];MLS.db[o>>1]=MLS.dir[k*2];MLS.db[(o>>1)+1]=MLS.dir[k*2+1];}}
    if(up===1){gl.activeTexture(gl.TEXTURE0+ML_U0);gl.bindTexture(gl.TEXTURE_2D,MLS.tex);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);}
    gl.texSubImage2D(gl.TEXTURE_2D,0,i0,j0,T,T,gl.RGBA,gl.HALF_FLOAT,hb);
    gl.activeTexture(gl.TEXTURE0+ML_U0+2);gl.bindTexture(gl.TEXTURE_2D,MLS.dtex);gl.texSubImage2D(gl.TEXTURE_2D,0,i0,j0,T,T,gl.RG,gl.UNSIGNED_BYTE,MLS.db);gl.activeTexture(gl.TEXTURE0+ML_U0);}
  MLS.uq=q;if(up)gl.activeTexture(gl.TEXTURE0);MLS.stat.up=up;}
/* the soil's two textures are read by the land's programs in every pass (the car, the bay, the probe too), so they
   sit on two texture units of their own, high up where nothing else binds (28, 29 and 30: the third is the tracks' heading, for the tread), held there for good: a blank
   one until the field is laid out (G.finish wrapped once, at the land's programs' making, to move them there) */
let ML_BLANK=null,ML_U0=28;
function mlBlank(){if(!ML_BLANK){ML_BLANK=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,ML_BLANK);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,1,1,0,gl.RGBA,gl.HALF_FLOAT,new Uint16Array(4));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);}return ML_BLANK;}
function mlBindUnits(){gl.activeTexture(gl.TEXTURE0+ML_U0);gl.bindTexture(gl.TEXTURE_2D,MLS.tex||mlBlank());gl.activeTexture(gl.TEXTURE0+ML_U0+1);gl.bindTexture(gl.TEXTURE_2D,MLS.mtex||mlBlank());gl.activeTexture(gl.TEXTURE0+ML_U0+2);gl.bindTexture(gl.TEXTURE_2D,MLS.dtex||mlBlank());gl.activeTexture(gl.TEXTURE0);}
function mlHookUse(G){if(G._mlu)return;G._mlu=1;ML_U0=Math.min(28,gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)-3);const f0=G.finish;
  G.finish=P=>{const was=P.ready,r=f0(P);
    /* (the program's other samplers back on the units they had before these two came along: other code binds to them) */
    if(!was&&P.samplers&&P.samplers.uMLt!==undefined){gl.useProgram(P.p);let n=0;
      for(const k of Object.keys(P.samplers)){const u=k==='uMLt'?ML_U0:k==='uMLm'?ML_U0+1:k==='uMLd'?ML_U0+2:n++,l=gl.getUniformLocation(P.p,k);if(l)gl.uniform1i(l,u);P.samplers[k]=u;}mlBindUnits();}
    return r;};}
/* the land's uniforms for the soil (each lit pass): where the arena is, where the patch is, the textures */
function mlUniforms(P){
  const G=R.G,on=MLS.ready?1:0;
  if(on&&GAME.car){if(MLP.lvl!==GFX.level)mlPatchBuild();const c=GAME.car,A=WG.mlA,lim=MLS.size/2+MLP.E;
    MLP.cx=Math.round(c.p[0]*2)/2;MLP.cz=Math.round(c.p[2]*2)/2;MLP.on=Math.abs(MLP.cx-A.x)<lim&&Math.abs(MLP.cz-A.z)<lim;}else MLP.on=false;
  G.uni(P,'uMLo',[MLS.x0-RO[0],MLS.z0-RO[2],1/MLS.size,on]);G.uni(P,'uMLp',[MLP.cx-RO[0],MLP.cz-RO[2],MLP.E,MLP.on?1:0]);
  G.uni(P,'uMLq',[1/MLS.N,MLS.cell,MLS.h0-RO[1],0]);G.uni(P,'uMLv',0);mlBindUnits();
}
/* the patch itself, after the chunks' ground (the main pass only) */
function mlPatchDraw(u){
  if(!MLS.ready||!MLP.on||!MLP.mesh)return 0;
  if(u.uMLv)gl.uniform1f(u.uMLv,1);atM(u,MLP.cx,0,MLP.cz);drawMesh(MLP.mesh);if(u.uMLv)gl.uniform1f(u.uMLv,0);
  return MLP.mesh.tris;}
/* the field raked smooth again (K on a keyboard; the test tools) */
function mlRake(){if(!MLS.ready)return;MLS.rut.fill(0);MLS.dir.fill(128);MLS.churn.fill(0);MLS.press.fill(0);MLS.comp.fill(0);MLS.dirty.fill(1);}
addEventListener('keydown',e=>{if(e.code==='KeyK'&&GAME.state==='drive'&&!e.repeat){mlRake();if(typeof say==='function')say('The field raked smooth',1.6);}});
/* for the test tools: the deepest rut, the highest berm, how much is turned */
function mlStats(){if(!MLS.ready)return {ready:false};let mn=0,mx=0,ch=0,pr=0;const R=MLS.rut;for(let k=0;k<R.length;k++){const r=R[k];if(r<mn)mn=r;if(r>mx)mx=r;if(MLS.churn[k]>60)ch++;if(MLS.press[k]>60)pr++;}
  const a=MLS.cell*MLS.cell;return {ready:true,ms:Math.round(MLS.ms),deepestCm:+(-mn*100).toFixed(1),bermCm:+(mx*100).toFixed(1),churnedM2:+(ch*a).toFixed(1),pressedM2:+(pr*a).toFixed(1),
    dugLitres:+(MLS.stat.dug*1000).toFixed(1),clods:MLS.stat.clods,landed:MLS.stat.landed,fx:FX.length,patch:MLP.mesh?MLP.mesh.tris:0,patchOn:MLP.on};}
window.__ml={MLS,MLP,mlStats,mlRake,mlGround,ML_SOIL};
