"""MUD LAB's page, from its own frozen copy of the engine (base/engine-salt-and-sand.html: Redline County's Salt & Sand,
the Road Not Found engine, as it was on Nov 7 2026), the Rock & Mud's play model (base/truck-rock-mud-50k.js) and his
ground pictures (base/texpack.js), with this game's own code (src/). Nothing here is shared with Ground Truth: if the
soil proves itself, it goes back into Ground Truth by copying.
Exact text swaps, each must match exactly as many times as said, so a changed engine fails loudly.
usage: python3 src/build.py [out-name]   (from the repo's top; writes builds/<out-name>.html, default mud-lab-5)"""
import sys, os, json, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); NAME = sys.argv[1] if len(sys.argv) > 1 else 'mud-lab-5'
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
swap("if(t===GAME.car&&!far){const S2=s2For(t.bi),k=s2Key(t.bi);", "if(t===GAME.car&&!far&&!ML_PLAY(t)){const S2=s2For(t.bi),k=s2Key(t.bi);")
swap("const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);", "const i=t.bi,b=t.build,u=CUR.u,M0=carMatrix(t);let Mb=M0,T=far?truckFar(i):truck(i);const MLP2=!far&&ML_PLAY(t);if(MLP2)T=mltT(T);")
swap("  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);}\n  const fx=D.X(D.uFa)",
     "  if(!depth){carUniformsW(t,v,dirt);gl.uniform1f(u.uMudLocal,1);gl.uniform1f(u.uMudOff,0);gl.uniform1f(u.uPrevOn,1);if(MLP2)mltBind();}\n  const fx=D.X(D.uFa)")
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
    alb=pow(texture(uRTa,vUV).rgb,vec3(2.2));vec3 O=texture(uRTo,vUV).rgb;float rg=clamp(O.g,.05,1.);metal=O.b;
    shin=max(2./(rg*rg)-2.,1.);spec=mix(.5,1.,metal);
    vec3 tn=texture(uRTn,vUV).xyz*2.-1.;tn.y=-tn.y;
    vec3 q1=dFdx(vP),q2=dFdy(vP);vec2 t1=dFdx(vUV),t2=dFdy(vUV);vec3 q2p=cross(q2,N),q1p=cross(N,q1);
    vec3 Tt=q2p*t1.x+q1p*t2.x,Bt=q2p*t1.y+q1p*t2.y;float im=inversesqrt(max(max(dot(Tt,Tt),dot(Bt,Bt)),1e-20));
    vec3 Nn=mat3(Tt*im,Bt*im,N)*tn;if(dot(Nn,Nn)>1e-8)N=normalize(Nn);}
  else if(m>=40){
    vec2 wp=Pw.xz;ground=true;""")
# ---------- HIS GROUND PICTURES (base/texpack.js) in the engine's texture pack, one per surface; a SAND surface; their
# own colour at 85% ----------
TP = json.loads(rd('base/texpack.js').split('window.LR_TEXPACK=', 1)[1].rstrip().rstrip(';'))
lay = lambda L: '{id:"%s",t:"%s",m:[%s],scale:%s,has:true,src:"%s"}' % (L['id'], L['t'], ', '.join('%.4f' % v for v in L['m']), L['scale'], L['src'])
for t, L in TP.items():
    if t == 'SAND': continue
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
# ---------- THE WORLD (src/ml-world.js) in place of Salt & Sand's dunes: the field and the grassland round it; no
# Highway 40, no billboards, no salt course or slalom, no trees on the field; the start at the field's south edge, facing north ----------
swap("const DUNES=true;", "const DUNES=true,ML=true;")
swap("if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;", "if(ML)return 0;if(DUNES)return j===0&&Math.abs(x)<HALF-800?3:0;")
swap("function core(x,z,ctx,o){\n  if(DUNES)return duneCore(x,z,o);", rd('src/ml-world.js') + "\nfunction core(x,z,ctx,o){\n  if(ML)return mlCore(x,z,o);if(DUNES)return duneCore(x,z,o);")
swap("function baseAt(x,z){\n  if(DUNES)return rimAt(x,z);", "function baseAt(x,z){\n  if(ML)return mlCore(x,z,{}).h;if(DUNES)return rimAt(x,z);")
swap("if(DUNES){let bb=[0,1e9,0,CH,-1e9,CH];", "if(DUNES&&!ML){let bb=[0,1e9,0,CH,-1e9,CH];")
swap("return {L,HALF,CH,FT,ROAD_END,", "return {mlA:ML_A,mlZone,mlBaseH,mlMat,mlLevel,mlCore,mlPlace,mlPlaces:ML_PLACES,mlTrails:ML_TRAILS,mlStrip:ML_STRIP,L,HALF,CH,FT,ROAD_END,")
swap("if(DYB.dunes)return Math.abs(z)<6?'Highway 40'", "if(WG.mlA)return WG.mlPlace(x-WG.mlA.x,z-WG.mlA.z);if(DYB.dunes)return Math.abs(z)<6?'Highway 40'")
swap("const HOME=[0,1.9,0];", "const HOME=[WG.mlA.x,WG.mlA.z+630,1.571];")
swap("  if(x1>COURSE.x0-60&&z0<60&&z1>-60){\n    const C=COURSE,sign=", "  if(!ML&&x1>COURSE.x0-60&&z0<60&&z1>-60){\n    const C=COURSE,sign=")
swap("{const S=SLALOM;if(x1>S.x-40&&x0<S.x+S.n*S.sp+40", "{const S=SLALOM;if(!ML&&x1>S.x-40&&x0<S.x+S.n*S.sp+40")
swap("function addTree(x,z,v,sc){const y=sample(x,z,CRo).h;", "function addTree(x,z,v,sc,raw){if(!raw&&ML&&Math.abs(x-ML_A.x)<ML_A.h+ML_A.m+4&&Math.abs(z-ML_A.z)<ML_A.h+ML_A.m+4)return;const y=sample(x,z,CRo).h;")
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
UNI = "uniform highp sampler2D uMLt;uniform highp sampler2D uMLd;uniform highp sampler2D uMLs0;uniform sampler2D uMLs1;uniform vec4 uMLo;uniform vec4 uMLw;uniform vec4 uMLp;uniform vec4 uMLq;uniform float uMLv;"
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
swap("uniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;\nlayout(location=0) out vec4 oCol;", "uniform sampler2D uRTa;uniform sampler2D uRTn;uniform sampler2D uRTo;" + UNI + "\nlayout(location=0) out vec4 oCol;")
swap("bool dirty=false,ground=false;vec3 Pw=vP+uOrg;", "bool dirty=false,ground=false;vec3 Pw=vP+uOrg;\n"
     "#ifndef PROBE\n  /* (Mud Lab) inside the world: the patch drawn only there; the chunks' ground not drawn under the patch */\n"
     "  vec2 mlUV=(vP.xz-uMLo.xy)*uMLo.z,mlW=fract((vP.xz-uMLo.xy)*uMLw.z);bool mlIn=(m==40||m==50)&&uMLo.w>.5&&mlUV.x>0.&&mlUV.y>0.&&mlUV.x<1.&&mlUV.y<1.;\n"
     "  bool mlWin=mlIn&&max(abs(vP.x-uMLw.x),abs(vP.z-uMLw.y))<uMLw.w;\n"
     "  if(m==40&&uMLo.w>.5){if(uMLv>.5){if(!mlIn)discard;}else if(mlIn&&uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985)discard;}\n#endif")
SC = '%.3f,%.3f,%.3f' % tuple(TP['SAND']['m'])
swap("      ao=mix(1.,em,.85);em=0.;\n    }\n    else if(m==41){",
     "#ifndef PROBE\n"
     "      /* (Mud Lab) the world's own ground: each soil by how wet it is (loam dusty and pale dry, dark wet; clay cracked and\n"
     "         pale dry, smooth and dark wet; silt powder to slick; dark peat with moss; sand), sod (straw when dry, greener\n"
     "         wet), the woods' floor (leaf litter, moss); wetter still where the water lies just under */\n"
     "      if(mlIn){vec4 s0=texture(uMLs0,mlUV),s1=texture(uMLs1,mlUV);float wc=s1.r,ws=s1.g,wq=s1.b,wsd=s1.a,tot=wc+ws+wq+wsd;\n"
     "        if(tot>1.){wc/=tot;ws/=tot;wq/=tot;wsd/=tot;tot=1.;}float wlm=1.-tot,wg=max(s0.a,0.),wwd=max(-s0.a,0.);\n"
     "        vec4 w0=vec4(0.,0.,0.,-9999.),w1=vec4(s0.r,0.,0.,0.);if(mlWin){w0=texture(uMLt,mlW);w1=texture(uMLd,mlW);}\n"
     "        float wtab=s0.g-(w1.r+w0.r),moist=max(s0.b,smoothstep(-.3,-.02,wtab));\n"
     "        float n1=vn(wp*.35),n2=vn(wp*17.)*.55+vn(wp*41.)*.45;vec3 dl=photoG2(dirtCol(wp),T_DIRT,T_DIRT2,wp);\n"
     "        vec3 cL=mix(dl*1.18+vec3(.03,.025,.015),dl*.5,smoothstep(.15,.85,moist));\n"
     "        vec3 cC=mix(photoGrainG(mix(vec3(.38,.33,.26),vec3(.45,.39,.3),n1),T_PLAYA,wp,1.),photoGrainG(vec3(.19,.16,.125),T_MUD,wp,.4),smoothstep(.25,.7,moist));\n"
     "        vec3 cS=mix(vec3(.36,.32,.26)*(.9+.2*n1),photoGrainG(mix(vec3(.11,.095,.072),vec3(.15,.125,.095),n1),T_MUD,wp,.5),smoothstep(.2,.65,moist));\n"
     "        vec3 mos=photoG(vec3(.085,.1,.04),T_BOG,wp);float mossy=smoothstep(.35,.62,vn(wp*.6)+.15*(n2-.5));vec3 cP=mix(vec3(.05,.037,.026)*(.85+.3*n2),mos*.72,mossy*.8);\n"
     "        vec3 cD=photoG(vec3(" + SC + "),T_SAND,wp);cD=mix(cD,cD*.5,smoothstep(.3,.8,moist));\n"
     "        vec3 cG=photoG2(grassCol(wp),T_GRASS,T_GRASS2,wp);cG=mix(cG*vec3(1.25,1.1,.7),cG*vec3(.85,1.,.85),moist);\n"
     "        vec3 cW=mix(vec3(.085,.058,.034),vec3(.05,.036,.022),moist)*(.75+.5*n2);float lf=smoothstep(.55,.7,vn(wp*5.3+1.7));cW=mix(cW,mix(vec3(.2,.1,.035),vec3(.16,.13,.05),vn(wp*2.1)),lf*.6);\n"
     "        cW=mix(cW,mos*.6,smoothstep(.55,.75,vn(wp*.9+3.))*.5);\n"
     "        vec3 cSo=cL*wlm+cC*wc+cS*ws+cP*wq+cD*wsd;float cov=min(1.,wg+wwd);alb=mix(cSo,(cG*wg+cW*wwd)/max(cov,1e-3),cov);\n"
     "        spec=.03+.22*moist*moist*(wlm*.5+wc+ws)+.05*wq;shin=8.+40.*moist*(wc+ws);pud=0.;gG*=.5;em=1.-.4*wwd;\n"
     "        if(mlWin){float mtx=uMLq.x,mcl=uMLq.y,cd=uMLo.z*1.28;\n"
     "          /* the fine slopes the meshes don't carry: ruts, berms, the trails' two-track, the edges of the mud holes */\n"
     "          float f0=texture(uMLt,mlW-vec2(mtx,0.)).r+texture(uMLd,mlW-vec2(mtx,0.)).r,f1=texture(uMLt,mlW+vec2(mtx,0.)).r+texture(uMLd,mlW+vec2(mtx,0.)).r,\n"
     "            f2=texture(uMLt,mlW-vec2(0.,mtx)).r+texture(uMLd,mlW-vec2(0.,mtx)).r,f3=texture(uMLt,mlW+vec2(0.,mtx)).r+texture(uMLd,mlW+vec2(0.,mtx)).r;\n"
     "          float c0=texture(uMLs0,mlUV-vec2(cd,0.)).r,c1=texture(uMLs0,mlUV+vec2(cd,0.)).r,c2=texture(uMLs0,mlUV-vec2(0.,cd)).r,c3=texture(uMLs0,mlUV+vec2(0.,cd)).r;\n"
     "          float maa=1.-smoothstep(mcl*2.,mcl*10.,gFP);gG+=(vec2(f1-f0,f3-f2)/(2.*mcl)-vec2(c1-c0,c3-c2)/2.56)*mix(.3,1.,maa);\n"
     "          float mrut=max(-w0.r,0.)+max(-w1.a,0.)*.5,mberm=max(w0.r,0.),mch=clamp(w0.g*1.25,0.,1.),mpr=w0.b*(1.-mch*.6),wetc=max(moist,.0);\n"
     "          /* the trails: the worn two-track bare and packed */\n"
     "          float tw=smoothstep(.0,.04,-w1.a);alb=mix(alb,cSo*.85,tw*.85);\n"
     "          /* turned soil: dark and wet-looking, lumpy loam with dry crumbs, smooth sticky clay with a shine, glossy silt, black peat */\n"
     "          vec3 tc=cL*mix(.42,.7,n2)*wlm+cC*mix(.5,.65,n2)*wc+cS*.7*ws+vec3(.03,.022,.016)*(.8+.4*n2)*wq+cD*.78*wsd;\n"
     "          float crumb=smoothstep(.62,.8,vn(wp*23.+7.))*(1.-moist)*wlm;tc=mix(tc,cL*1.05,crumb*.5);alb=mix(alb,tc,mch);\n"
     "          /* the tread: where a tyre rolled (not spun), its knobs pressed into the track, along the way it was heading */\n"
     "          vec2 md2=w1.gb;float mtw=mpr*smoothstep(.45,.85,length(md2))*(1.-smoothstep(.006,.02,gFP))*(1.-mch);\n"
     "          if(mtw>.01){float mth=atan(md2.y,md2.x)*.5;vec2 mdv=vec2(cos(mth),sin(mth)),mdp=vec2(-mdv.y,mdv.x);float ms=dot(wp,mdv)/.068,mc=dot(wp,mdp)/.085;\n"
     "            float mk=fract(ms+.5*mod(floor(mc),2.)),mlug=smoothstep(.08,.16,mk)*(1.-smoothstep(.5,.58,mk))*smoothstep(.06,.16,fract(mc))*(1.-smoothstep(.84,.94,fract(mc)));\n"
     "            alb*=1.-.22*mlug*mtw;gG+=mdv*(smoothstep(.08,.16,mk)-smoothstep(.5,.58,mk))*.9*mtw;}\n"
     "          alb*=1.-.26*mpr;alb=mix(alb,cL*1.05,smoothstep(.008,.05,mberm)*(1.-mch)*.5*wlm*(1.-moist));\n"
     "          alb*=1.-.22*smoothstep(.03,.22,mrut)*(1.-mch*.3);em*=1.-.3*smoothstep(.02,.2,mrut);\n"
     "          spec=mix(spec,.22,max(mpr*.3,moist*mch*.85));shin=mix(shin,mix(40.,90.,wc+ws),max(mpr*.5,moist*mch));\n"
     "          gG+=(vec2(vn(wp*31.),vn(wp*31.+3.1))-.5)*.25*mch*maa*(1.-ws-wq*.5);\n"
     "          /* wet tracks, drying over a minute and a half */\n"
     "          float wd=1.-clamp((uMLq.w-w0.a)/90.,0.,1.);wd*=wd;alb*=1.-.42*wd;spec=mix(spec,.28,wd*.6);shin=mix(shin,70.,wd*.6);\n"
     "          /* water lying in ruts past the patch (the patch's own ruts are under the water's own surface) */\n"
     "          if(!(uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985))pud=smoothstep(0.,.01,wtab)*.85;}}\n"
     "#endif\n"
     "      ao=mix(1.,em,.85);em=0.;\n    }\n    else if(m==41){")
# the water: muddy and level, the bottom showing through where it's shallow
swap("      N=normalize(vec3(gw.x,1.,gw.y));alb=vec3(.025,.03,.018);spec=.6;shin=2000.;ssr=1.;ground=false;\n",
     "      N=normalize(vec3(gw.x,1.,gw.y));alb=vec3(.025,.03,.018);spec=.6;shin=2000.;ssr=1.;ground=false;\n"
     "#ifndef PROBE\n"
     "      if(vC.a>.5&&mlIn){float gy=mlWin?texture(uMLd,mlW).r+texture(uMLt,mlW).r:texture(uMLs0,mlUV).r,dep=vP.y-(uMLq.z+gy),sh=smoothstep(0.,.1,dep);\n"
     "        alb=mix(vec3(.05,.036,.022),vec3(.085,.064,.04),sh);spec=mix(.2,.32,sh);shin=mix(180.,700.,sh);ssr=mix(.25,.55,sh);N=normalize(vec3(gw.x*.6,1.,gw.y*.6));}\n"
     "#endif\n")
# (the soil's textures bound whenever the land's programs are in use: src/ml-soil.js mlHookUse)
swap("P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));", "P_LANDP=G.program('landProbe',S.VS,S.FS,Object.assign({PROBE:1},h));mlHookUse(G);")
# the patch after the chunks' ground (main pass); the soil's uniforms in every lit pass of the world
swap("drawMesh(g.w);tris+=g.w.tris;if(!probe)gl.enable(gl.CULL_FACE);}}\n  if(!probe)gl.disable(gl.CULL_FACE);",
     "drawMesh(g.w);tris+=g.w.tris;if(!probe)gl.enable(gl.CULL_FACE);}}\n  if(!probe)tris+=mlPatchDraw(u);\n  if(!probe)gl.disable(gl.CULL_FACE);")
swap("G.uni(P,'uCourse',[WG.COURSE.x0-RO[0],WG.COURSE.mi,.11,-RO[2]]);G.uni(P,'uOrg',[0,0,0]);}", "G.uni(P,'uCourse',[WG.COURSE.x0-RO[0],WG.COURSE.mi,.11,-RO[2]]);G.uni(P,'uOrg',[0,0,0]);mlUniforms(P);}")
# EACH FRAME: the soil after the physics (src/ml-soil.js mlStep); the engine's own dust and clods left to the tyres outside
# the arena; a thrown clod that lands in the arena becomes soil there; room for more clods (each is 32 triangles)
swap("fxEmit(dt,t);fxStep(dt);", "mlStep(dt,t);fxEmit(dt,t);fxStep(dt);")
swap("if(!w.contact)continue;const R=w.R,surf=w.surf", "if(!w.contact||w.mlOn)continue;const R=w.R,surf=w.surf")
swap("if(p.y<gy){p.y=gy;p.vx=p.vy=p.vz=0;", "if(p.y<gy){if(p.vol&&mlLand(p)){p.life=0;p.y=gy;continue;}p.y=gy;p.vx=p.vy=p.vz=0;")
swap("const FX_MAX=360,", "const FX_MAX=1200,")
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
# (up in the Heron the haze thins, so the whole map shows from the air: src/ml-heron.js mlFogK)
swap("  if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;", "  if(typeof mlFogK==='function')E.fogDen*=mlFogK();\n  if(DYB.dunes){const A=DYB.air;E.fogDen*=A.fog;")
swap("const carLabel=()=>carName({car:APP.car})", "const carLabel=()=>GAME.car&&GAME.car.rt?'Heron':carName({car:APP.car})")
# (the one you're not in drawn where it waits, and into the shadows)
swap("let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);", "let tris=drawWorldCar(GAME.car,GAME.voice,GAME.dirt,false,false);mlvUI();tris+=mlvDraw(c.eye);")
swap("if(kind!=='hl')one(GAME.car,k>=1);", "if(kind!=='hl')one(GAME.car,k>=1);if(kind!=='hl'&&mlvParked())one(mlvParked(),true);")
swap("/* =====================================================================================\n   THE BOOT: the dots",
     heron + '\n' + rd('src/ml-truck.js') + '\n' + rd('src/ml-ui.js') + '\n' + rd('src/ml-soil.js') + '\n' + rd('src/ml-heron.js') + "\n/* =====================================================================================\n   THE BOOT: the dots")
import base64
i = s.index("<script>\n(()=>{\n'use strict';")
s = s[:i] + '<script>' + rd('base/truck-rock-mud-50k.js') + '\n' + rd('base/heron/heron-data.js') + 'window.ML_HERON_PAINT=' + repr(base64.b64encode(open(os.path.join(R, 'base/heron/redtail-2-heron.webp'), 'rb').read()).decode()) + ';\n</script>\n' + s[i:]
os.makedirs(os.path.join(R, 'builds'), exist_ok=True); out = os.path.join(R, 'builds', NAME + '.html')
open(out, 'w', encoding='utf-8').write(re.sub(r"const ML_BUILD='[^']*';", "const ML_BUILD='%s';" % NAME, s, count=1))
print('written', out, len(s))
