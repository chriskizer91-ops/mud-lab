/* =====================================================================================
   MUD LAB: THE TRUCK. The Rock & Mud you drive is Ground Truth's own play model, 49,654 triangles (his pick after
   the look test, Nov 7 2026: the game's own Rock & Mud cut down, the Studio 2 baked onto it, in Station Sand;
   base/truck-rock-mud-50k.js, window.LR_TRUCK). It's drawn by the engine's own car drawing (the wheels rolling and
   steering, the suspension, the shadows), with its three baked pictures (colour, normals, roughness and metal) in
   material 120. Phones load the pictures at 1024, laptops at 2048. The truck's numbers, its physics and its engine
   sound are the engine's own Rock & Mud (game build id crawler): nothing of them is changed here.
   ===================================================================================== */
const MLT_U8=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
const MLT={mesh:null,tex:null,texN:0,T:new WeakMap(),loc:null,locP:null,px:0,cur:null,
  phone:(()=>{try{return matchMedia('(hover: none)').matches||Math.min(screen.width,screen.height)<600;}catch(_){return false;}})()};
/* the play model is yours whenever you're in the Rock & Mud */
function ML_PLAY(t){if(!t||!t.build)return false;const k=t.build.kit||t.build.id;return !!(k==='crawler'&&window.LR_TRUCK||k==='stock'&&window.ML_SUVB);}
function mltTex(b64,cb){const an=gl.getExtension('EXT_texture_filter_anisotropic'),im=new Image();
  im.onload=()=>{let src=im;
    if(MLT.phone){const c=document.createElement('canvas');c.width=im.width>>1;c.height=im.height>>1;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,c.height);src=c;}
    const tx=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);cb(tx,src.width,src.height);};
  im.src='data:image/webp;base64,'+b64;}
function mltBuild(){
  const D=window.LR_TRUCK;if(!D)return false;const ms={};
  for(const [nm,e] of Object.entries(D.pieces)){
    const pos=new Float32Array(MLT_U8(e.pos).buffer),nrm=new Float32Array(MLT_U8(e.nrm).buffer),uv=new Float32Array(MLT_U8(e.uv).buffer),m8=MLT_U8(e.mat),n=pos.length/3;
    const col=new Float32Array(n*4),mat=new Float32Array(n);
    /* (the glass keeps the game's own glass materials; the underside (16 in the bake's numbering) is plain dark colour) */
    for(let k=0;k<n;k++){const m=m8[k];mat[k]=m===16?0:m;const c=m===120?1:m===16?.03:.025;col[k*4]=col[k*4+1]=col[k*4+2]=c;col[k*4+3]=0;}
    const ib=MLT_U8(e.idx),idx=e.i32?new Uint32Array(ib.buffer):new Uint16Array(ib.buffer);
    ms[nm]=makeMesh({pos,nrm,col,mat,idx,uv});ms[nm].tris=e.n/3;
    /* (Mud Lab 11) the same wheel a size up, for the 40 in tyres (37 in as baked: 0.47 m radius; 0.508) */
    if(nm==='wheel'){const k=.508/.47,p2=new Float32Array(pos.length);for(let q=0;q<pos.length;q++)p2[q]=pos[q]*k;ms.wheelBig=makeMesh({pos:p2,nrm,col,mat,idx,uv});ms.wheelBig.tris=e.n/3;}}
  MLT.mesh=ms;MLT.tex={};MLT.px=0;
  for(const k of ['a','n','o'])mltTex(D.tex[k],(tx,w,h)=>{MLT.tex[k]=tx;MLT.texN++;MLT.px=w;});
  return true;}
/* (Mud Lab 12) THE STOCK SUV'S PLAY MODEL, the same way: his own bake of it (salt-mini-plus: the detailed Studio SUV
   baked onto the game's own stock SUV as three pictures), repacked by tools/suv_pack.py into base/suv-stock-baked.js
   (window.ML_SUVB): 51,044 triangles, about what the game's plain built model was (51,586), now wearing the Studio's
   colour, normals, roughness and metal. Its numbers and physics are the engine's stock SUV as before. On the 33 in
   tyres its wheel is drawn a size up (the body is the standard body, riding 5 cm higher) */
const MLT2={mesh:null,tex:null,texN:0,T:new WeakMap(),px:0};
function mlt2Build(){
  const D=window.ML_SUVB;if(!D)return false;const ms={};
  for(const [nm,e] of Object.entries(D.pieces)){
    const pos=new Float32Array(MLT_U8(e.pos).buffer),nrm=new Float32Array(MLT_U8(e.nrm).buffer),uv=new Float32Array(MLT_U8(e.uv).buffer),m8=MLT_U8(e.mat),n=pos.length/3;
    const col=new Float32Array(n*4),mat=new Float32Array(n);
    /* (the lamps are the game's own lamp materials (7 tail, 8 head, 10 amber, 23 reversing), white under them) */
    for(let k=0;k<n;k++){const m=m8[k];mat[k]=m===16?0:m;const c=m===120||m===7||m===8||m===10||m===23?1:m===16?.03:.025;col[k*4]=col[k*4+1]=col[k*4+2]=c;col[k*4+3]=0;}
    const ib=MLT_U8(e.idx),idx=e.i32?new Uint32Array(ib.buffer):new Uint16Array(ib.buffer);
    ms[nm]=makeMesh({pos,nrm,col,mat,idx,uv});ms[nm].tris=e.n/3;
    /* (the wheel for the 33s: 0.42 m radius for 0.378, 0.318 m wide for 0.245; its axle is z) */
    if(nm==='wheel'){const kr=.42/.378,kw=.318/.245,p2=new Float32Array(pos.length);for(let q=0;q<pos.length;q+=3){p2[q]=pos[q]*kr;p2[q+1]=pos[q+1]*kr;p2[q+2]=pos[q+2]*kw;}ms.wheelBig=makeMesh({pos:p2,nrm,col,mat,idx,uv});ms.wheelBig.tris=e.n/3;}}
  MLT2.mesh=ms;MLT2.tex={};
  for(const k of ['a','n','o'])mltTex(D.tex[k],(tx,w,h)=>{MLT2.tex[k]=tx;MLT2.texN++;MLT2.px=w;});
  return true;}
/* the engine's truck for your SUV: its numbers as they are, the play model's meshes in place of its own */
function mltT(T,t){const st=!!(t&&t.build&&(t.build.kit||t.build.id)==='stock'),S=st?MLT2:MLT;MLT.cur=null;
  if(!S.mesh&&!(st?mlt2Build():mltBuild()))return T;if(S.texN<3)return T;MLT.cur=S;
  let C=S.T.get(T);if(!C){const R=t&&t.build&&t.build.look&&t.build.look.tyre?t.build.look.tyre.R:0,W=R>(st?.4:.49)&&S.mesh.wheelBig?S.mesh.wheelBig:S.mesh.wheel;
    C=Object.create(T);Object.assign(C,{body:S.mesh.body,hood:null,hide:null,engineOut:false,bay:null,rider:null,wheel:W,wheelR:W,tris:(st?window.ML_SUVB:window.LR_TRUCK).tris});S.T.set(T,C);}
  return C;}
/* (its three pictures on units 13 to 15: whichever SUV is being drawn) */
function mltBind(){const S=MLT.cur;if(!S||S.texN<3)return;
  if(MLT.locP!==CUR.p){MLT.locP=CUR.p;MLT.loc=['uRTa','uRTn','uRTo'].map(n=>gl.getUniformLocation(CUR.p,n));}
  const U=[[MLT.loc[0],S.tex.a,13],[MLT.loc[1],S.tex.n,14],[MLT.loc[2],S.tex.o,15]];
  for(const [loc,tx,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tx);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);}
/* while you drive the play truck, the Studio 2 isn't made or kept for the road (it's the bay's) */
const MLT_S2F=s2For;
/* (while driving, no Studio 2 car at all (Mud Lab 6): the Rock & Mud is its 50k play model, his stock SUV the game's
   own model (Studio 2's is about 800,000 triangles), and the truck left parked while you fly is one of those too) */
s2For=function(i){mltSand();if(GAME.state==='drive')return null;return MLT_S2F(i);};
/* the bay's Studio 2 truck in Station Sand, weathered (the colour of the play truck's baked paint) */
const MLT_SAND={paint:'#bca081',clad:'#3a3630',dirt:.35};
function mltSand(){for(const b of BUILDS)if(b&&!b.machine&&(b.kit||b.id)==='crawler'&&!b.__mlSand){Object.assign(b,MLT_SAND);b.__mlSand=1;}}
window.__mlt={MLT,MLT2,ML_PLAY};
