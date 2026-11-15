"""MUD LAB's page, from its own frozen copy of the engine (base/engine-salt-and-sand.html: Redline County's Salt & Sand,
the Road Not Found engine, as it was on Nov 7 2026), the Rock & Mud's play model (base/truck-rock-mud-50k.js) and his
ground pictures (base/texpack.js), with this game's own code (src/). Nothing here is shared with Ground Truth: if the
soil proves itself, it goes back into Ground Truth by copying.
Exact text swaps, each must match exactly as many times as said, so a changed engine fails loudly.
usage: python3 src/build.py [out-name]   (from the repo's top; writes builds/<out-name>.html, default mud-lab-19: give the
next build its own name, an older build is never written over)"""
import sys, os, json, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NAME = sys.argv[1] if len(sys.argv) > 1 else 'mud-lab-22'
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
s = rd('base/engine-salt-and-sand.html')
def swap(old, new, n=1):
    global s
    c = s.count(old); assert c == n, f'expected {n} of: {old[:100]!r}, found {c}'; s = s.replace(old, new)
# ---------- ITS OWN NAME, ITS OWN SAVES, ITS FRONT DOOR (src/ml-ui.js) ----------
swap('<title>Redline County: Salt &amp; Sand (Studio 2)</title>', '<title>Mud Lab</title>')
swap("localStorage.getItem('sas:'+k)", "localStorage.getItem('mudlab:'+k)"); swap("localStorage.setItem('sas:'+k,", "localStorage.setItem('mudlab:'+k,"); swap("localStorage.removeItem('sas:'+k)", "localStorage.removeItem('mudlab:'+k)")
swap("const word='REDLINE COUNTY',", "const word='MUD LAB',")
swap("L.hidden=true;openMenu(true);dybStart();sasBoot();", "L.hidden=true;openMenu(true);dybStart();sasBoot();mlTitle();")
# the driving screen, less crowded (his rule): no nitrous or exhaust-bang lights in the HUD's row
swap("if(e.nosKw)C.push(['N2O',pt.nosOn,PAL.cyan]);", "")
swap("}C.push(['BANG',performance.now()-GAME.voice.popT<140,PAL.red]);", "}")
# no stunt scores, no money: Mud Lab is for the ground (the engine's stunts, their pop-ups and the cash line off)
swap("Feats.step(dt,t,ev,RANCH.W);", "")
swap("  otxt5(Feats.fmtMoney(cash()),lx,7+7*sc+18,GR.green,1);\n", "")
# the maps: painted from the world's own ground, all of it there from the start (src/ml-soil.js mlMapFill, mlBigMap)
swap("function mapFill(X0,Y0,n,cx0,cz0,mpp,dark){\n", "function mapFill(X0,Y0,n,cx0,cz0,mpp,dark){\n  if(WG.mlA&&MLS.map)return mlMapFill(X0,Y0,n,cx0,cz0,mpp);\n")
swap("function drawBigMap(){\n", "function drawBigMap(){\n  if(WG.mlA&&MLS.map)return mlBigMap();\n")
# ---------- THE TRUCK (src/ml-truck.js): the SUV is the Rock & Mud, drawn as its 50k play model ----------
swap("const CAR_STOCK={suv:'stock',", "const CAR_STOCK={suv:'crawler',")
swap("if(t===GAME.car&&!far){const S2=s2For(t.bi),k=s2Key(t.bi);", "if(t===GAME.car&&!far&&!ML_PLAY(t)&&!mlIsStock(t)){const S2=s2For(t.bi),k=s2Key(t.bi);")
swap("const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);", "const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);const MLP2=!far&&ML_PLAY(t);if(MLP2)T=mltT(T,t);")
swap("  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);}\n  const fx=D.X(D.uFa)",
     "  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);if(MLP2)mltBind();}\n  const fx=D.X(D.uFa)")
# (Mud Lab 11) a bigger tyre than the garage had, for the Rock & Mud: 40 in mud-terrains (src/ml-suv.js ML_BIG)
swap("T_P('mt37','37x12.5R17 mud-terrain',.47,.318,17,'mt','mud',TY_MT,60,1.15,.15),T_P('slick','310/680R18 slick',.345,.31,18,'slick','slick',TY_SLICK,-10,.95,-1,.05)],",
     "T_P('mt37','37x12.5R17 mud-terrain',.47,.318,17,'mt','mud',TY_MT,60,1.15,.15),T_P('mt40','40x13.5R17 mud-terrain',.508,.343,17,'mt','mud',TY_MT,78,1.18,.15),T_P('slick','310/680R18 slick',.345,.31,18,'slick','slick',TY_SLICK,-10,.95,-1,.05)],")
# its baked pictures in the land's shaders: texture coordinates through the vertex shader, material 120 in the fragment
swap('layout(location=3) in float aMat;\nlayout(location=5) in vec4 iA;', 'layout(location=3) in float aMat;layout(location=4) in vec2 aUV;\nlayout(location=5) in vec4 iA;')
swap('out vec3 vP;out vec3 vN;out vec4 vC;out float vMat;out vec3 vL;out vec4 vCur;out vec4 vPrev;\nvoid main(){\n  vec3 w,pw;',
     'out vec3 vP;out vec3 vN;out vec4 vC;out float vMat;out vec3 vL;out vec4 vCur;out vec4 vPrev;out vec2 vUV;\nvoid main(){\n  vec3 w,pw;vUV=aUV;')
swap('in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;\nlayout(location=0) out vec4 oCol;',
     'in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vUV;\nuniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;\nlayout(location=0) out vec4 oCol;')
swap('  else if(m>=40){\n    vec2 wp=Pw.xz;ground=true;',
     """  /* the Rock & Mud's play model: its colour, roughness and metal from its baked pictures, its surface detail from the
     normal map (the frame from the pixel's own derivatives: no tangents needed) */
  else if(m==120){
    alb=pow(mlTc(uRTa,vUV,mlt1,mlt2).rgb,vec3(2.2));vec3 O=mlTc(uRTo,vUV,mlt1,mlt2).rgb;float rg=clamp(O.g,.05,1.);metal=O.b;
    shin=max(2./(rg*rg)-2.,1.);spec=mix(.5,1.,metal);
    vec3 tn=mlTc(uRTn,vUV,mlt1,mlt2).xyz*2.-1.;tn.y=-tn.y;
    vec3 q1=mlq1,q2=mlq2;vec2 t1=mlt1,t2=mlt2;vec3 q2p=cross(q2,N),q1p=cross(N,q1);
    vec3 Tt=q2p*t1.x+q1p*t2.x,Bt=q2p*t1.y+q1p*t2.y;float im=inversesqrt(max(max(dot(Tt,Tt),dot(Bt,Bt)),1e-20));
    vec3 Nn=mat3(Tt*im,Bt*im,N)*tn;if(dot(Nn,Nn)>1e-8)N=normalize(Nn);}
  else if(m>=40){
    vec2 wp=Pw.xz;ground=true;""")
# ---------- HIS GROUND PICTURES (base/texpack.js) in the engine's texture pack, one per surface; a SAND surface; their
# own colour at 85% ----------
TP = json.loads(rd('base/texpack.js').split('window.LR_TEXPACK=', 1)[1].rstrip().rstrip(';'))
lay = lambda L: '{id:"%s",t:"%s",m:[%s],scale:%s,has:true,src:"%s"}' % (L['id'], L['t'], ', '.join('%.4f' % v for v in L['m']), L['scale'], L['src'])
# (Mud Lab 8: the rock's, the salt's, the gravel's and the planks' pictures aren't laid: nothing in Mud Lab is painted
# with them any more (below), so they aren't carried in the page, decoded at the start or kept on the graphics card)
ML_UNUSED = ('ROCK', 'SALT', 'GRAVEL', 'PLANKS')
for t, L in TP.items():
    if t == 'SAND' or t in ML_UNUSED: continue
    m = re.findall(r'\{id:"[a-z_0-9]+",t:"%s",m:\[[^\]]*\],scale:[0-9.]+,has:false,src:""\}' % t, s)
    assert len(m) == 1, t
    swap(m[0], lay(L))
swap('{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""}\n]};', '{id:"clay_track",t:"CLAYTRACK",m:[0.5, 0.5, 0.5],scale:3,has:false,src:""},\n' + lay(TP['SAND']) + '\n]};')
swap("'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK'];", "'SALT','BRICK','STUCCO','FORECOURT','PAINT','CLAYTRACK','SAND','BOG'];")
def _bog():
    import base64, numpy as np
    from PIL import Image
    p = os.path.join(R, 'base/textures/H08-bog-grass.webp'); a = np.asarray(Image.open(p).convert('RGB'), np.float64) / 255
    m = (np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)).reshape(-1, 3).mean(0)
    return {'id': 'bog_grass', 't': 'BOG', 'm': [round(float(v), 4) for v in m], 'scale': 2.5, 'src': 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode()}
swap(lay(TP['SAND']) + '\n]};', lay(TP['SAND']) + ',\n' + lay(_bog()) + '\n]};')
sm = TP['SAND']['m']
swap("if(dw>.004){vec3 sd=vec3(.80,.77,.70)*(.9+.12*vn(wp*.012)+.05*vn(wp*.37));", "if(dw>.004){vec3 sd=vec3(%.3f,%.3f,%.3f)*(.9+.12*vn(wp*.012)+.05*vn(wp*.37));" % tuple(sm))
swap("alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}", "sd=photoG(sd,T_SAND,wp);alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}")
swap("tex:1,texcol:.5,", "tex:1,texcol:.85,")
# ---------- MUD LAB 14: ROCKING. The engine goes into reverse when the brake has been held half a second at a standstill.
# Rocking a bogged SUV needs it sooner: while Mud Lab says the SUV is being rocked (src/ml-recover.js sets mlRock: the
# throttle was down on soft ground and it was going nowhere, within the last second and a half), a tenth of a second ----------
swap("else if(!this.rev&&Math.abs(vb[0])<.6&&brk>.5&&thr<.05){this.revT+=dt;if(this.revT>.5&&pt.running)", "else if(!this.rev&&Math.abs(vb[0])<.6&&brk>.5&&thr<.05){this.revT+=dt;if(this.revT>(this.mlRock>0?.1:.5)&&pt.running)")
# ---------- THE WORLD (src/ml-world.js) in place of Salt & Sand's dunes: the field and the grassland round it; no
# Highway 40, no billboards, no salt course or slalom, no trees on the field; the start at the field's south edge, facing north ----------
swap("const DUNES=true;", "const DUNES=true,ML=true;")
swap("if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;", "if(ML)return 0;if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;")
# (ML_PITS: for tuning only (tools/test/ml-pits.py): extra trial mud holes put in the open field; never in a numbered build)
_world = rd('src/ml-world.js')
# (ML_CLIMB: for tuning only: trial numbers for the Hill Climb, e.g. ML_CLIMB='{a1:38,X:44}'; never in a numbered build)
if os.environ.get('ML_CLIMB'): _world = 'const ML_CLIMB_ENV=' + os.environ['ML_CLIMB'] + ';\n' + _world
if os.environ.get('ML_PITS'): assert _world.count("ML_HOLES.push({u:-172,") == 1; _world = _world.replace("ML_HOLES.push({u:-172,", os.environ['ML_PITS'] + "ML_HOLES.push({u:-172,")
swap("function core(x,z,ctx,o){\n  if(DUNES)return duneCore(x,z,o);", _world + "\nfunction core(x,z,ctx,o){\n  if(ML)return mlCore(x,z,o);if(DUNES)return duneCore(x,z,o);")
swap("function baseAt(x,z){\n  if(DUNES)return rimAt(x,z);", "function baseAt(x,z){\n  if(ML)return mlCore(x,z,{}).h;if(DUNES)return rimAt(x,z);")
swap("if(DUNES){let bb=[0,1e9,0,CH,-1e9,CH];", "if(DUNES&&!ML){let bb=[0,1e9,0,CH,-1e9,CH];")
# (Mud Lab 6, from the review: the engine's town, off-road park and Outer Loop are not in Mud Lab's world: City Limits
# stood 300 m past the north bank and the loop's marker posts and chevrons ran through the woods; the engine's own trees
# stay as the trees beyond the bank)
swap("if(x1>-EDGE-40&&x0<EDGE+40&&z1>-EDGE-40&&z0<EDGE+40)townStatic(", "if(!ML&&x1>-EDGE-40&&x0<EDGE+40&&z1>-EDGE-40&&z0<EDGE+40)townStatic(")
swap("if(x1>PARK.x0-80&&x0<PARK.x1+80&&z1>PARK.z0-80&&z0<PARK.z1+80||x1>PKW.ROADX-30&&x0<PKW.ROADX+30&&z1>-60&&z0<-20)parkStatic(", "if(!ML&&(x1>PARK.x0-80&&x0<PARK.x1+80&&z1>PARK.z0-80&&z0<PARK.z1+80||x1>PKW.ROADX-30&&x0<PKW.ROADX+30&&z1>-60&&z0<-20))parkStatic(")
swap("if(x1>OL.bb[0]&&x0<OL.bb[2]&&z1>OL.bb[1]&&z0<OL.bb[3])loopStatic(", "if(!ML&&x1>OL.bb[0]&&x0<OL.bb[2]&&z1>OL.bb[1]&&z0<OL.bb[3])loopStatic(")
swap("  townTrees(x0,z0,x1,z1,inC,addTree);\n  {const G=6.2,n=Math.floor(CH/G),cr={};", "  if(!ML)townTrees(x0,z0,x1,z1,inC,addTree);\n  if(!(ML&&Math.abs(x0+CH/2-ML_A.x-ML_A.cu)<ML_A.h+ML_A.m-CH/2&&Math.abs(z0+CH/2-ML_A.z-ML_A.cv)<ML_A.h+ML_A.m-CH/2)){const G=6.2,n=Math.floor(CH/G),cr={};")
swap("return {L,HALF,CH,FT,ROAD_END,", "return {mlA:ML_A,mlE:ML_E,mlLayerRows,mlX:ML_X,mlZone,mlBaseH,mlMat,mlLevel,mlCore,mlPlace,mlPlaces:ML_PLACES,mlTrails:ML_TRAILS,mlStrip:ML_STRIP,mlHoles:ML_HOLES,mlTrees,mlBog:ML_BOG,mlClimb:ML_CLIMB,mlClimbY,mlClimbS,mlHills,L,HALF,CH,FT,ROAD_END,")
swap("if(DYB.dunes)return Math.abs(z)<6?'Highway 40'", "if(WG.mlA)return WG.mlPlace(x-WG.mlA.x,z-WG.mlA.z);if(DYB.dunes)return Math.abs(z)<6?'Highway 40'")
swap("const HOME=[0,1.9,0];", "const HOME=[WG.mlA.x,WG.mlA.z+630,1.571];")
swap("  if(x1>COURSE.x0-60&&z0<60&&z1>-60){\n    const C=COURSE,sign=", "  if(!ML&&x1>COURSE.x0-60&&z0<60&&z1>-60){\n    const C=COURSE,sign=")
swap("{const S=SLALOM;if(x1>S.x-40&&x0<S.x+S.n*S.sp+40", "{const S=SLALOM;if(!ML&&x1>S.x-40&&x0<S.x+S.n*S.sp+40")
swap("function addTree(x,z,v,sc){const y=sample(x,z,CRo).h;", "function addTree(x,z,v,sc,raw){if(!raw&&ML&&Math.abs(x-ML_A.x-ML_A.cu)<ML_A.h+ML_A.m+4&&Math.abs(z-ML_A.z-ML_A.cv)<ML_A.h+ML_A.m+4)return;const y=sample(x,z,CRo).h;")
swap("    cols.push({t:'c',x,z,r:palm?.32*sc:.35*sc+.15,top:y+(palm?8:(pine?1.6:2.4)+(pine?2.2:3.4))*sc});}\n", "    cols.push({t:'c',x,z,r:palm?.32*sc:.35*sc+.15,top:y+(palm?8:(pine?1.6:2.4)+(pine?2.2:3.4))*sc});}\n  if(ML)mlTrees(x0,z0,x1,z1,addTree);\n")
# ---------- THE SOIL (src/ml-soil.js) ----------
# THE PHYSICS: inside the arena the ground is the soil's (src/ml-soil.js mlGround)
swap("function groundInto(x,z,o){\n  const c=chunkAt(x,z);", "function groundInto(x,z,o){\n  if(MLS.ready&&mlGround(x,z,o))return o;const c=chunkAt(x,z);")
# THE PICTURE: the land's shaders read the soil (src/ml-soil.js's four textures: near the truck, wrapping round as it
# moves, (rut, churn, press, wet) and (the ground's own height every 8 cm, the tread's heading, the trails' ruts); and
# the world's own ground every 2.56 m for all of it (height, water, moisture, sod or woods; clay, silt, peat, sand)).
# The vertex shader lifts the patch; the fragment shader hides the chunks' ground under the patch, paints every soil
# by how wet it is, the sod and the woods' floor, the ruts, the turned soil, the pressed and the wet tracks, and the
# water (muddy, the bottom showing through where it's shallow)
UNI = "uniform highp sampler2D uMLt;uniform highp sampler2D uMLd;uniform highp sampler2D uMLs0;uniform sampler2D uMLs1;uniform vec4 uMLo;uniform vec4 uMLw;uniform vec4 uMLp;uniform vec4 uMLq;uniform float uMLv;uniform vec4 uMLf;"
swap("uniform vec3 uCam;uniform vec4 uFarDrop;\nout vec3 vP;", "uniform vec3 uCam;uniform vec4 uFarDrop;" + UNI + "\nout vec3 vP;")
swap("  vP=w;vMat=aMat;gl_Position=uVP*vec4(w,1.);vCur=uVPnj*vec4(w,1.);vPrev=uPrevVP*vec4(pw,1.);}`;",
     "  /* (Mud Lab) the soil's patch: the ground's own height every 8 cm and the ruts (fading out toward its edge); its\n"
     "     slope from the world's ground */\n"
     "  if(uMLv>.5){vec2 mlu=(w.xz-uMLo.xy)*uMLo.z,mlw=fract((w.xz-uMLo.xy)*uMLw.z);bool win=max(abs(w.x-uMLw.x),abs(w.z-uMLw.y))<uMLw.w;\n"
     "    float mle=max(abs(aPos.x),abs(aPos.z)),mlf=1.-smoothstep(uMLp.z*.7,uMLp.z*.95,mle);\n"
     "    float mb=win?textureLod(uMLd,mlw,0.).r:textureLod(uMLs0,mlu,0.).r,mbc=textureLod(uMLs0,mlu,0.).r;\n"
     "    w.y=uMLq.z+mix(mbc,mb,win?1.:0.)+(win?textureLod(uMLt,mlw,0.).r*mlf:0.);pw.y=w.y;float mld=uMLo.z*1.28;\n"
     "    float mlx=textureLod(uMLs0,mlu+vec2(mld,0.),0.).r-textureLod(uMLs0,mlu-vec2(mld,0.),0.).r,mlz=textureLod(uMLs0,mlu+vec2(0.,mld),0.).r-textureLod(uMLs0,mlu-vec2(0.,mld),0.).r;\n"
     "    vN=normalize(vec3(-mlx,2.56,-mlz));vC=vec4(0.,0.,0.,1.);}\n"
     "  vP=w;vMat=aMat;gl_Position=uVP*vec4(w,1.);vCur=uVPnj*vec4(w,1.);vPrev=uPrevVP*vec4(pw,1.);}`;")
swap("uniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;\nlayout(location=0) out vec4 oCol;", "uniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;" + UNI + "uniform vec4 uMLr[52];uniform vec4 uMLb;\nlayout(location=0) out vec4 oCol;")
swap("bool dirty=false,ground=false;vec3 Pw=vP+uOrg;", "bool dirty=false,ground=false;vec3 Pw=vP+uOrg;vec3 mlq1=dPx,mlq2=dPy;vec2 mlt1=dFdx(vUV),mlt2=dFdy(vUV);mlDx=dPx.xz;mlDy=dPy.xz;\n"
     "#ifndef PROBE\n  /* (Mud Lab) inside the world: the patch drawn only there; the chunks' ground not drawn under the patch */\n"
     "  vec2 mlUV=(vP.xz-uMLo.xy)*uMLo.z,mlW=fract((vP.xz-uMLo.xy)*uMLw.z);bool mlIn=(m==40||m==50)&&uMLo.w>.5&&mlUV.x>0.&&mlUV.y>0.&&mlUV.x<1.&&mlUV.y<1.;\n"
     "  bool mlWin=mlIn&&max(abs(vP.x-uMLw.x),abs(vP.z-uMLw.y))<uMLw.w;\n"
     "  if(m==40&&uMLo.w>.5){if(uMLv>.5){if(!mlIn)discard;}else if(mlIn&&uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985)discard;}\n#endif")
SC = '%.3f,%.3f,%.3f' % tuple(TP['SAND']['m'])
# (Mud Lab 8) the soil's painting, the water's, the trunks', the leaves' and the picture's sharpening are in
# src/ml-look.glsl, in pieces (each starts at a line "//@@ name")
GL = {}
for part in re.split(r'^//@@ ', rd('src/ml-look.glsl'), flags=re.M)[1:]:
    nm, body = part.split('\n', 1); GL[nm.strip()] = body
# inside the world the soil paints the ground: the engine's own ground is worked out only outside it (the bank, the
# grassland beyond), and where the soil's program isn't the one in use (the plain ground a laptop shows while landSoil builds)
swap("      /* the ground: weights for grass, rock and mud in the colour (salt as negative mud: they never meet), ambient\n         occlusion in its alpha */\n",
     "      /* the ground: weights for grass, rock and mud in the colour (salt as negative mud: they never meet), ambient\n         occlusion in its alpha */\n" + GL['base0'])
swap("      ao=mix(1.,em,.85);em=0.;\n    }\n    else if(m==41){", "      }\n" + GL['soil'].replace('@@SAND@@', SC) + "      ao=mix(1.,em,.85);em=0.;\n    }\n    else if(m==41){")
# the water: muddy and level, the bottom showing through where it's shallow
swap("      N=normalize(vec3(gw.x,1.,gw.y));alb=vec3(.025,.03,.018);spec=.6;shin=2000.;ssr=1.;ground=false;\n",
     "      N=normalize(vec3(gw.x,1.,gw.y));alb=vec3(.025,.03,.018);spec=.6;shin=2000.;ssr=1.;ground=false;\n" + GL['water'])
# (the soil's textures bound whenever the land's programs are in use: src/ml-soil.js mlHookUse)
swap("P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));", "P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));mlHookUse(G);")
# the patch after the chunks' ground (main pass); the soil's uniforms in every lit pass of the world
swap("drawMesh(g.w);tris+=g.w.tris;if(!probe)gl.enable(gl.CULL_FACE);}}\n  if(!probe)gl.disable(gl.CULL_FACE);",
     "drawMesh(g.w);tris+=g.w.tris;if(!probe)gl.enable(gl.CULL_FACE);}}\n  if(!probe)tris+=mlPatchDraw(u);\n  if(!probe)gl.disable(gl.CULL_FACE);")
swap("G.uni(P,'uCourse',[WG.COURSE.x0-RO[0],WG.COURSE.mi,.11,-RO[2]]);G.uni(P,'uOrg',[0,0,0]);}", "G.uni(P,'uCourse',[WG.COURSE.x0-RO[0],WG.COURSE.mi,.11,-RO[2]]);G.uni(P,'uOrg',[0,0,0]);mlUniforms(P);}")
# EACH FRAME: the soil after the physics (src/ml-soil.js mlStep); the engine's own dust and clods left to the tyres outside
# the arena; a thrown clod that lands in the arena becomes soil there; room for more clods (each is 32 triangles)
swap("fxEmit(dt,t);fxStep(dt);", "mlStep(dt,t);mlvTick();fxEmit(dt,t);fxStep(dt);")
swap("if(!w.contact)continue;const R=w.R,surf=w.surf", "if(!w.contact||w.mlOn)continue;const R=w.R,surf=w.surf")
swap("if(p.y<gy){p.y=gy;p.vx=p.vy=p.vz=0;", "if(p.y<gy){if(p.vol&&mlLand(p)){p.life=0;p.y=gy;continue;}p.y=gy;p.vx=p.vy=p.vz=0;")
swap("const FX_MAX=360,", "const FX_MAX=1200,")
# (Mud Lab 15) the brake lamps' light on the ground: after dark a quarter of what the engine gives it (a little
# over the tail lamps' own), by day a sixteenth. At full strength every wet lump of mud behind a braking SUV caught a red glint: ruts that looked like
# cracks in lava, by day too
swap("col:brake?[5,.12,.06]:[.9,.02,.01],", "col:brake?(SKY.lightsOn?[1.2,.029,.014]:[.3,.007,.004]):[.9,.02,.01],")
swap("fx:220,carLod:1}", "fx:500,carLod:1}")
swap("const FX_CAP={mobile:220,low:300};", "const FX_CAP={mobile:600,low:800};")
# ---------- the code, just before the boot; the truck's data before the game's script ----------
# ---------- THE HERON (src/ml-heron.js): Ground Truth's bush plane, flown for real. Its code is the Redtail's (base/heron/,
# frozen copies of salt-mini-plus redtail/game rt-game.js and rt-fly.js, Nov 7 2026; the shader's material 120 and the
# texture coordinates are already in, above, for the truck), named the Heron; its model (base/heron/heron-data.js,
# made by that repo's glb2js.py from redtail-2.glb) and his Heron paint (base/heron/redtail-2-heron.webp, Ground Truth's)
heron = rd('base/heron/rt-game.js').replace('/*@@FLY@@*/', rd('base/heron/rt-fly.js'))
for a_, b_ in [("if(RT.want)say('THE REDTAIL',2);", "if(RT.want)say('THE HERON',2);"), ("{id:'redtail',name:'Redtail',gov:0,", "{id:'redtail',name:'Heron',gov:0,")]:
    assert heron.count(a_) == 1, a_; heron = heron.replace(a_, b_)
# (Mud Lab 11) each of the Heron's pieces gets a far copy (src/ml-recover.js mlFarMesh)
_a = "ms[nm]=makeMesh(d);ms[nm].pv=e.pv;ms[nm].tris=e.n/3;}"; assert heron.count(_a) == 1
heron = heron.replace(_a, "ms[nm]=makeMesh(d);ms[nm].pv=e.pv;ms[nm].tris=e.n/3;mlFarPiece(ms[nm],d,nm,e.n/3);}")
# ---------- THE STOCK SUV (src/ml-suv.js): his SUV's 4WD mode on the LOW button and key, and its name on the HUD
swap("    if(inp.low)say(setLow(t,!t.low)?(t.low?'Low range':'High range'):'No low range on this car',1.4);", "    if(inp.low)say(mlLow(t),1.4);")
swap("$('tLow').hidden=!c.low;", "$('tLow').hidden=!c.low&&!mlIsStock(GAME.car);")
swap("if(can.low)C.push(['LOW',t.low,PAL.amber]);", "if(mlIsStock(t))C.push([mlMode(t),t.low,PAL.amber]);else if(can.low)C.push(['LOW',t.low,PAL.amber]);")
# ---------- THE SHADER WARM-UP (Mud Lab 6, from the review): the engine waited at most 60 s for the shaders to build
# in the background, then sat in a blocking wait for any not yet built (on Windows, Edge's Direct3D shader compiler
# took far longer than that over the land's shader, and the page hung on "20 / 21"). Now it waits as long as they take,
# and the loading line names what is still building and for how long.
swap("          if (done === list.length || performance.now() - t0 > 6e4) break;", "          if (done === list.length) break;")
swap("          onProgress && onProgress(done, list.length);", "          onProgress && onProgress(done, list.length, list.filter((P) => !gl.getProgramParameter(P.p, par.COMPLETION_STATUS_KHR)).map((P) => P.name).join(', '), Math.round((performance.now() - t0) / 1e3));")
swap("await R.G.warmup((d,n)=>{L.textContent='Warming up the shaders '+d+' / '+n+(built?' · the garage '+built+' / '+park.length:'');});",
     "await R.G.warmup((d,n,w,s)=>{L.textContent='Warming up the shaders '+d+' / '+n+(w?' (building: '+w+', '+s+' s)':'')+(built?' · the garage '+built+' / '+park.length:'');});")
# (the title covers the whole screen: the game holds behind it (src/ml-ui.js GAME.hold), and builds no traffic cars,
# Mud Lab has no traffic; the soil's preparation gets the time)
swap("if(showActive()){renderShow(dt);if(GFX.frame%6===0)trfModelsStep();return;}", "if(showActive()){renderShow(dt);return;}")
# (the land's program the title waits for is built without the soil's painting and water; the full one, landSoil,
# compiles in the background and takes over as soon as the graphics driver has it (src/ml-soil.js mlSoilPromote): the
# page can't hang on the shaders however long Windows' shader compiler takes)
swap("let P_LAND=null,P_LANDP=null,P_DEPTH=null;", "let P_LAND=null,P_LANDP=null,P_DEPTH=null,P_LANDML=null;")
swap("P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));mlHookUse(G);if(!P_DEPTH)", "P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));mlHookUse(G);P_LANDML=G.program('landSoil',S.VS,S.FS,Object.assign({MLSOIL:1},h));P_LANDML.bg=true;if(!P_DEPTH)")
swap("const G=R.G,old=[P_LAND,P_LANDP];P_LAND=P_LANDP=null;", "const G=R.G,old=[P_LAND,P_LANDP,P_LANDML];P_LAND=P_LANDP=P_LANDML=null;")
swap("catch(e){console.warn('land shader rebuild: '+(e&&e.message||e));landDrop([P_LAND,P_LANDP]);P_LAND=old[0];P_LANDP=old[1];", "catch(e){console.warn('land shader rebuild: '+(e&&e.message||e));landDrop([P_LAND,P_LANDP,P_LANDML]);P_LAND=old[0];P_LANDP=old[1];P_LANDML=old[2];")
swap("const par = ext.par, list = G.programs.filter((P) => !P.ready);", "const par = ext.par, list = G.programs.filter((P) => !P.ready && !P.bg);")
swap("perfEnd(dt);APP.fps=lerp(APP.fps,1/Math.max(dt,1e-3),.05);gfxWatch(dt);", "perfEnd(dt);APP.fps=lerp(APP.fps,1/Math.max(dt,1e-3),.05);gfxWatch(dt);mlSoilPromote();")
# (and the program the title waits for leaves out his ground photos too (NOPHOTO, as the reflections' probe program does,
# which his laptop already builds): the photos are the largest part of what Windows' compiler chews on. The full
# picture, photos and soil, is landSoil's)
swap("#ifdef PROBE\nvec3 photoG(vec3 alb,int L,vec2 wp){return alb;}", "#if defined(PROBE)||defined(NOPHOTO)\nvec3 photoG(vec3 alb,int L,vec2 wp){return alb;}")
swap("P_LAND=G.program('land',S.VS,S.FS,Object.assign(DEBUG_VIEW&&DEBUG_VIEW.startsWith('shadow')?{DEBUG_SHADOW:+(DEBUG_VIEW.slice(6)||0)}:{},h));", "P_LAND=G.program('land',S.VS,S.FS,Object.assign({NOPHOTO:1},DEBUG_VIEW&&DEBUG_VIEW.startsWith('shadow')?{DEBUG_SHADOW:+(DEBUG_VIEW.slice(6)||0)}:{},h));")
# (up in the Heron the haze thins, so the whole map shows from the air: src/ml-heron.js mlFogK)
swap("  if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;", "  if(typeof mlFogK==='function')E.fogDen*=mlFogK();\n  if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;")
swap("const carLabel=()=>carName({car:APP.car})", "const carLabel=()=>GAME.car&&GAME.car.rt?'Heron':mlIsStock(GAME.car)?'Stock SUV':carName({car:APP.car})")
# (the one you're not in drawn where it waits, and into the shadows)
swap("let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);", "let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);mlvUI();tris+=mlvDraw(c.eye);")
swap("if(kind!=='hl')one(GAME.car,k>=1);", "if(kind!=='hl')one(GAME.car,k>=1);if(kind!=='hl'&&mlvShadow())one(mlvParked(),true);if(kind!=='hl'){const o9=mlrShadow();if(o9)one(o9,true);}")
swap("/* =====================================================================================\n   THE BOOT: the dots",
     heron + '\n' + rd('src/ml-truck.js') + '\n' + rd('src/ml-ui.js') + '\n' + rd('src/ml-soil.js') + '\n' + rd('src/ml-suv.js') + '\n' + rd('src/ml-heron.js') + '\n' + rd('src/ml-audio.js') + '\n' + rd('src/ml-look.js') + '\n' + rd('src/ml-recover.js') + '\n' + rd('src/ml-bog.js') + '\n' + rd('src/ml-climb.js') + '\n' + rd('src/ml-keys.js') + '\n' + rd('src/ml-menu.js') + '\n' + rd('src/ml-gpu.js') + "\n/* =====================================================================================\n   THE BOOT: the dots")
# ---------- MUD LAB 8: THE LAND'S SHADER CLEANED OUT, AND THE LOOK (src/ml-look.glsl, src/ml-look.js) ----------
# The land's fragment shader is the engine's whole county: the drag strip, the park's tracks, the dry lake, the gravel and
# the public roads, the town's facades and traffic signals, concrete, sheet metal, hay, boulders, the salt flats and
# their course line, rock in the ground. None of it is ever drawn in Mud Lab (checked: tools/test/ml-mats.py goes round
# every place, both SUVs, the Heron and the bay, and lists the materials of every mesh made: 0-27, 40, 46, 48, 50,
# 70-108, 120). Out of all three of the land's programs: less for a phone's graphics chip to carry, and much less for
# Windows' shader compiler to chew through (the laptop's wait).
def cut(a, b):
    global s
    assert s.count(a) == 1, f'cut from, found {s.count(a)}: {a[:80]!r}'; i = s.index(a); j = s.index(b, i + len(a))
    assert s.count(b, i) == 1, f'cut to, found {s.count(b, i)} after: {b[:80]!r}'; n = j - i; s = s[:i] + s[j:]; return n
ML_CUT = 0
# the salt flats and their course line, rock in the ground (the world's ground carries no salt and no rock)
ML_CUT += cut("      /* the salt flats (City Limits'): pale crust and tan clay in big soft patches, cracked into plates in places */\n", "      /* (Salt & Sand) the white gypsum")
ML_CUT += cut("      if(rw>.004){alb=mix(alb,photoTri(rockCol(Pw),T_ROCK,Pw,N),rw);\n", "      spec=.03;shin=8.;\n      if(mw>0.)")
swap("rw=smoothstep(.35,.65,vC.g+(n3-.5)*.3),mw=", "rw=0.,mw=")
swap("      float sw=smoothstep(.05,.75,-vC.b+(n2-.5)*.18);\n", "      const float sw=0.;\n")
# boulders (41), the drag strip (42), the engine's two-tracks (43), the mud track (44), concrete (45), the planks (46: in
# Mud Lab only the trees' trunks, which get bark) and sheet metal (47)
ML_CUT += cut("    else if(m==41){\n", "    else if(m==48){\n")
swap("    else if(m==48){\n", GL['trunk'] + "    else if(m==48){\n")
# hay (49); the painted lines, gravel, asphalt, lanes, the oval, the dry lake, the public roads, the town's walls, the
# traffic signals (52 to 61)
ML_CUT += cut("    else if(m==49){", "    else if(m==50){\n")
ML_CUT += cut("    else if(m==52){alb=vec3(.7,.68,.63);}\n", "    /* rain soaks the porous ground dark")
# the leaves
swap("      /* leaves: light comes through them; the crown is darker underneath and deep inside */\n      alb*=.6+.55*vn3(Pw*2.2);spec=.05;shin=10.;trans=.45;ground=false;\n      ao=.45+.55*sat(N.y*.5+.5)*sat(vL.y/7.+.2);\n", GL['leaves'])
# the pictures' two ways of being looked up (src/ml-look.glsl's first piece), before the engine's picture helpers; the
# engine's own three that the ground still uses, through it; and the phone's tier named to the shader
swap("const MATFN=`\nuniform samplerCube uProbe;uniform float uProbeLod;\n", "const MATFN=`\nuniform samplerCube uProbe;uniform float uProbeLod;\n" + GL['pre'])
swap("  vec3 t=mix(texture(uTex,vec3(uv,float(L))).rgb,texture(uTex,vec3(rot2(uv,2.1)*.73+5.2,float(L))).rgb,n);return photoMix(alb,t,I.rgb);}",
     "  vec2 dx=mlDx/I.w,dy=mlDy/I.w;vec3 t=mix(mlTx(vec3(uv,float(L)),dx,dy).rgb,mlTx(vec3(rot2(uv,2.1)*.73+5.2,float(L)),rot2(dx,2.1)*.73,rot2(dy,2.1)*.73).rgb,n);return photoMix(alb,t,I.rgb);}")
swap("  vec3 t=mix(texture(uTex,vec3(uv,float(L))).rgb,texture(uTex,vec3(rot2(uv,1.3)*1.11+2.4,float(L2))).rgb,n);return photoMix(alb,t,mix(I.rgb,I2.rgb,n));}",
     "  vec2 dx=mlDx/I.w,dy=mlDy/I.w;vec3 t=mix(mlTx(vec3(uv,float(L)),dx,dy).rgb,mlTx(vec3(rot2(uv,1.3)*1.11+2.4,float(L2)),rot2(dx,1.3)*1.11,rot2(dy,1.3)*1.11).rgb,n);return photoMix(alb,t,mix(I.rgb,I2.rgb,n));}")
swap("vec4 I=TEXINFO[L];return photoGrain(alb,texture(uTex,vec3(wp/I.w,float(L))).rgb,I.rgb,k);}", "vec4 I=TEXINFO[L];return photoGrain(alb,mlTx(vec3(wp/I.w,float(L)),mlDx/I.w,mlDy/I.w).rgb,I.rgb,k);}")
swap("function landDefs(){const d={};if(halfOn())d.HALF=1;", "function landDefs(){const d={};if(GFX.level==='mobile')d.MLPHONE=1;if(halfOn())d.HALF=1;")
# how much of the sun's glint the ground gives back (mlSpec: src/ml-look.glsl)
swap("s.ao=ao;s.spec=1.;s.trans=trans;", "s.ao=ao;s.spec=mlSpec;s.trans=trans;")
# the soil's own helpers, before the fragment shader's inputs
swap("in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vUV;\n", GL['fn'] + "in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vUV;\n")
# (the numbers, when they're on (src/ml-ui.js: a tap on the build's name), stand aside while the big map is open: they sat over its west side)
swap("const on=DEVW.hud==='perf'&&GAME.state==='drive';", "const on=DEVW.hud==='perf'&&GAME.state==='drive'&&!APP.bigMap;")
# the finished picture: sharpened (in place of the lens's colour fringe)
swap("  vec2 cq=uv-.5;vec3 c;\n  if(uCA>0.0){vec2 sh=cq*dot(cq,cq)*uCA*.012;c=vec3(texture(uSrc,uv-sh).r,texture(uSrc,uv).g,texture(uSrc,uv+sh).b);}else c=texture(uSrc,uv).rgb;\n",
     "  vec2 cq=uv-.5;\n" + GL['sharpen'])
# (Mud Lab 15) and out of the soil's own program (landSoil) only: the engine's sand and its mud in the ground it paints
# for itself. In that program the engine's ground is only what lies outside the world (the bank and the grassland
# beyond: grass and bare dirt), and for the moment at the start before the soil is laid out. The plain ground a laptop
# shows while landSoil builds (the program "land") keeps both. This pays for the soil's relief (src/ml-look.glsl):
# landSoil is no bigger than it was
swap("      if(dw>.004){vec3 sd=vec3(", "#ifndef MLSOIL\n      if(dw>.004){vec3 sd=vec3(")
swap("sd=photoG(sd,T_SAND,wp);alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}\n", "sd=photoG(sd,T_SAND,wp);alb=mix(alb,sd,dw);gw*=1.-dw;rw*=1.-dw;}\n#endif\n")
swap("      if(mw>0.){vec3 md=mix(vec3(.15,.1,.06),", "#ifndef MLSOIL\n      if(mw>0.){vec3 md=mix(vec3(.15,.1,.06),")
swap("mudCracks(wp,alb,mw*(1.-smoothstep(.55,.85,mw))*.9,spec);}\n", "mudCracks(wp,alb,mw*(1.-smoothstep(.55,.85,mw))*.9,spec);}\n#endif\n")
# (Mud Lab 16) and eight of the cars' own materials that no mesh in Mud Lab is made with, on the phone's tier or the
# laptop's (tools/test/ml-mats.py: 9 the LED bar, 17 carbon, 18 louvres, 29 halo lamps, 30 and 31 City Limits' light
# strip and underglow, 91 and 106 two of the Studio 2 car's surfaces). A mesh with a missing material would be drawn in
# its plain colour, not broken. With the rings in the water (src/ml-look.glsl) landSoil is still no bigger than it was
for _m in ["  else if(m==9){emc=vec3(.85,.92,1.)*(.7+uLamps*2.2);alb=vec3(.3);}\n",
           "  else if(m==17){float w=step(.5,fract((vL.x+vL.z)*55.))*.5+step(.5,fract((vL.x-vL.z)*55.))*.5;alb=vec3(.03+.025*w);spec=.7;shin=90.;clear=.8;clearR=.05;}\n",
           "  else if(m==18){alb=vec3(.01)*(1.+2.*step(.55,fract(vL.x*30.)));spec=.3;}\n",
           "  else if(m==29){emc=vec3(.75,.88,1.)*(.15+uLamps*2.4);alb=vec3(.2);}\n",
           "  else if(m==30){emc=uGlow*(.25+uLamps*1.8);alb=uGlow*.2;spec=.5;shin=60.;}\n",
           "  else if(m==31){emc=uGlow*2.6;alb=uGlow*.3;}\n",
           "    else if(m==91){alb=vec3(.01);spec=1.;shin=2000.;ssr=1.;}\n",
           "    else if(m==106){spec=.4;shin=14.;clear=.8;clearR=.06;}\n"]:
    swap(_m, ""); ML_CUT += len(_m)
print('cut from the land\'s shader:', ML_CUT, 'characters')
# ---------- MUD LAB 18: THE PACKET OF 13 NOV 2026 (four pieces from Salt & Sand, Ground Truth and the combined trial; its
# patches were written against the built page, so they come last, after every swap above) ----------
# 1. THE FILM CAMERA (src/ml-film.js: Salt & Sand's, a 16th camera that picks its own shots) and the softer fly-past
swap("const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside'];",
     "const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside','Film'];")
swap("if(s.cam>=0&&s.cam<15)APP.cam=s.cam|0;", "if(s.cam>=0&&s.cam<16)APP.cam=s.cam|0;")
swap("const CAM_ORDER=[0,1,2,11,12,13,14,3,9,10,8,4,5,6,7];", "const CAM_ORDER=[0,15,1,2,11,12,13,14,3,9,10,8,4,5,6,7];")
swap("const CAM_DEF={on:[0,2,11,12,13,14,3,9,10,8],t:{0:10,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true};",
     "const CAM_DEF={on:[0,15,2,11,12,13,14,3,9,10,8],t:{0:10,15:30,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true,film:1};")
# (a list of cameras saved before the Film camera was there: it joins the cameras that are on, once)
swap("    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;}",
     "    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;\n    if(!s.film&&!o.on.includes(15))o.on.push(15);}")
# (the Film camera picks its shot first, and everything that asks "which camera?" by name is told the shot it is on)
swap("function camUpdate(dt){\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=CAMS[APP.cam],cut=CAM.cut,",
     "function camUpdate(dt){\n  filmStep(GAME.car,dt);\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=camMode(),cut=CAM.cut,")
swap("  {const J=camAuto(t,dt);if(J)return J;}\n",
     "  {const J=camAuto(t,dt);if(J)return J;}\n  if(mode==='Heli'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return heliStep(t,dt,cut);}\n  if(mode==='Park orbit'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return filmParkStep(t,dt,cut);}\n")
swap("const t=GAME.car,M=t.M,F=mcol(M,0),mode=CAMS[APP.cam],D=carD(t);", "const t=GAME.car,M=t.M,F=mcol(M,0),mode=camMode(),D=carD(t);")
swap("  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=CAMS[APP.cam];", "  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=camMode();if(m==='Heli')return FHEL.near;")
_film_at = "/* how close the picture's near edge can come, per camera (the cockpit's cabin is right round you) */"
swap(_film_at, rd('src/ml-film.js') + _film_at)
# (the fly-past: the drop in the engine's note as the truck passes a camera standing by, about half what it was. A
# switch in Settings, Dev)
swap("  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:clamp(343/(343-vr),.65,1.45)};}",
     "  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:flyPitch(vr,d)};}")
swap("const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,", "const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,softFly:1,")
swap("['occ','Shade under the cars','The soft occlusion on the ground under each car.']];",
     "['occ','Shade under the cars','The soft occlusion on the ground under each car.'],\n  ['softFly','Softer fly-past sound','The drop in the engine\\'s note as the truck passes a camera standing by (Cinematic, Roadside, Low drone, the jump cam): about half what it was, a little under what a real microphone hears. Off, as before.']];")
swap("  window.__dyb={CAMS,", "  window.__dyb={FILM,FHEL,camMode,flyPitch,camUpdate,CAMS,")
# 2. THE HERON'S HUD (Ground Truth's two swaps): flying, no TC / ABS / ESC lamps and no gear number: a plane has neither
swap("for(const [s,v,col] of C){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}", "for(const [s,v,col] of (t.rt?[]:C)){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}")
swap("const g=t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,", "const g=t.rt?'':t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,")
# 3. THE GRAPHICS CARD (src/ml-gpu.js, with the other pieces above): the engine's line when the card is reset under the
# page said "the phone" on a laptop too
swap("L.textContent='The phone restarted its graphics. Starting again…';", "L.textContent=mlGpuLost();")
# 4. ROLLOVERS THAT ROLL LIKE A TRUCK (Ground Truth build 26's fix, re-pointed for the soil: src/ml-soil.js mlBroadUp).
# A truck rolled onto its side still had its wheels "touching": the springs and the tyres' side grip pushed along the
# axles, which point straight up by then, and threw it back into the air spinning (his "flips really hard really fast",
# 8 Nov). Past about 70 degrees between the truck's up and the land's (the land under the ruts, not a rut's wall) a
# wheel lets go; between about 52 and 70 it takes the weight gradually
swap("      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}", "      if(got){let gu=mlBroadUp(hit.p[0],hit.p[2],U);if(!(gu===gu)){const gq=this._gq||(this._gq={y:0,n:F3(),surf:''});this.world.ground(hit.p[0],hit.p[2],gq);gu=gq.n[0]*U[0]+gq.n[1]*U[1]+gq.n[2]*U[2];}if(gu<.34)got=false;wh.fade=gu>=.62?1:sstep(.34,.62,gu);}\n      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}")
swap("      wh.Fz=Math.max(0,Fs);wh.cp.set(hit.p);", "      wh.Fz=Math.max(0,Fs)*(wh.fade??1);wh.cp.set(hit.p);")
# (and a wheel that comes down onto the ground already past its bump stop, because the truck rolled it in there
# sideways, doesn't spring that back out: only what it's pushed in further from there hits the bump stop)
swap("      if(comp<=0){wh.contact=false;wh.Fz=0;wh.comp=0;", "      if(comp<=0){wh.bp0=-1;wh.contact=false;wh.Fz=0;wh.comp=0;")
swap("      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;", "      {const ex=comp-s.travel;wh.bp0=!(wh.bp0>=0)?Math.max(0,ex):Math.min(wh.bp0,Math.max(0,ex));const eb=ex-wh.bp0;if(eb>0)Fs+=eb*wh.k*14+Math.max(0,rate)*wh.cb*2;}")
# ---------- MUD LAB 19 ----------
# no camera under the water (src/ml-soil.js mlCamDry): the Lake is deep enough to follow a SUV under
swap("  let cw=camUpdate(dt);\n", "  let cw=mlCamDry(camUpdate(dt));\n")
# a drowned engine can't be started (src/ml-soil.js mlDeep holds it off): the engine's own blinking "TAP GAS TO START"
# said it could
swap("  if(!on){const msg=GAME.touch?'TAP GAS TO START':'PRESS W OR I TO START';", "  if(!on){const msg=GAME.car&&GAME.car.mlDrowned?'ENGINE DROWNED: PULL IT OUT':GAME.touch?'TAP GAS TO START':'PRESS W OR I TO START';")
# WIDE WATER MIRRORED ITSELF. The engine's screen reflections march a ray from each mirror-like pixel and take a hit
# where the ray passes just behind what the screen shows there. Looking low across level water, one row of pixels spans
# metres of it, so from about 20 m out the first steps of every ray "hit" the water beside where they started: the
# water there showed last frame's water in place of the sky, a dull sandy band with a line through it across the Lake
# from about 20 to 140 m out (seen in the first pictures of it; the Pond on the first map has had the same band,
# smaller). A level surface can't mirror a level surface at its own height: such a hit (level ground or water
# at the hit, within what a row of pixels spans at that range of the mirror's own height) is no hit, and the pixel takes
# the reflections' own picture (the probe at the car: the sky, the far shore), as water nearer the eye always did
swap("    vec2 e=smoothstep(0.0,.08,puv)*smoothstep(1.0,.92,puv);float conf=e.x*e.y*(1.0-smoothstep(.35,.5,rough));\n",
     "    vec2 e=smoothstep(0.0,.08,puv)*smoothstep(1.0,.92,puv);float conf=e.x*e.y*(1.0-smoothstep(.35,.5,rough));\n    if(N.y>.9&&abs(Xh.y-P.y)<.12+.012*length(P-uCam)&&octDec(texture(uNrm,huv).xy).y>.9)conf=0.;\n")
# ---------- MUD LAB 20 ----------
# under the water with a camera that is on the SUV (src/ml-soil.js mlCamDry, mlUnderEnv): the frame's environment, as
# the engine has just worked it out, made muddy water when the eye is under a water's surface
swap("  if(DEVW.off.post){E.fogDen=0;E.fogAmb=[0,0,0];}\n", "  if(DEVW.off.post){E.fogDen=0;E.fogAmb=[0,0,0];}\n  mlUnderEnv(E);\n")
import base64
i = s.index("<script>\n(()=>{\n'use strict';")
# (the Heron's paint IS its picture (Mud Lab 6, from the review): his Heron paint goes in place of the original Redtail
# paint in the model's data, so the original is neither carried nor decoded; one paint, no paint switching)
import re as _re
_hd = rd('base/heron/heron-data.js'); _hp = base64.b64encode(open(os.path.join(R, 'base/heron/redtail-2-heron.webp'), 'rb').read()).decode()
assert len(_re.findall(r'"a":"[A-Za-z0-9+/=]+"', _hd)) == 1
_hd = _re.sub(r'"a":"[A-Za-z0-9+/=]+"', lambda m: '"a":"' + _hp + '"', _hd)
s = s[:i] + '<script>' + rd('base/truck-rock-mud-50k.js') + '\n' + rd('base/suv-stock-baked.js') + '\n' + _hd + '\n</script>\n' + s[i:]
os.makedirs(os.path.join(R, 'builds'), exist_ok=True); out = os.path.join(R, 'builds', NAME + '.html')
open(out, 'w', encoding='utf-8').write(re.sub(r"const ML_BUILD='[^']*';", "const ML_BUILD='%s';" % NAME, s, count=1))
print('written', out, len(s))
