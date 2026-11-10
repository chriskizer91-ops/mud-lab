/* =====================================================================================
   MUD LAB: HOW THE GROUND, THE WATER AND THE TREES ARE PAINTED (Mud Lab 8). Pieces of the land's fragment shader,
   put into the engine's by src/build.py (each piece starts at a line "//@@ name"). The soil's own painting (ruts,
   turned soil, the tread, wet tracks) is as it was in Mud Lab 7; what's new:
   - each soil's colour is worked out only where there is some of that soil and it shows (bare, turned up, or a
     trail): Mud Lab 7 worked out all five, the sod and the woods' floor for every pixel of ground, after the
     engine had already painted its own ground underneath (11 to 17 looks at his ground pictures a pixel; now 2 to 5);
   - off the phone the pictures are looked up with the ground's own gradients, worked out once (textureGrad), so
     nothing in the ground asks Windows' shader compiler for gradients inside a branch (see the first piece);
   - the sod lies in patches (bare soil between, not a tint over everything), straw where it's dry and green where
     it's damp; the woods' floor is leaf litter and moss; big soft patches of lighter and darker ground; past where
     the trees are drawn, the woods show as their canopy;
   - muddy water (the bed showing at its edge, cloudy brown deeper), bark on the trunks, leafier crowns.
   ===================================================================================== */
//@@ pre
/* (Mud Lab 8) his ground pictures and the truck's and the Heron's baked pictures are looked up one of two ways.
   On the phone (MLPHONE: the Mobile tier), the plain way: its graphics chip works the gradients out itself, its
   cheapest look-up, and it really skips a look-up inside a branch that isn't taken. Everywhere else, with gradients
   worked out once at the top of the shader (textureGrad): Windows' shader compiler can then leave the branches as
   branches (a look-up that needs gradients inside a branch makes it work out both sides, for every pixel, and take
   minutes over it: the laptop's wait) */
#ifdef MLPHONE
#define mlTx(P,dx,dy) texture(uTex,P)
#define mlTc(S,uv,dx,dy) texture(S,uv)
#else
#define mlTx(P,dx,dy) textureGrad(uTex,P,dx,dy)
#define mlTc(S,uv,dx,dy) textureGrad(S,uv,dx,dy)
#endif
/* the ground's own gradients (world metres across a pixel), set once at the top of main */
vec2 mlDx=vec2(0.),mlDy=vec2(0.);
/* how much of the sun's glint a surface gives back (1: as the engine lights everything). Dry grass, leaf litter and dry
   soil are far too rough and full of holes to glint: lit as smooth-ish ground they went white looking toward a low sun */
float mlSpec=1.;
//@@ fn
#if !defined(PROBE)&&defined(MLSOIL)
/* how far a picture has faded to its own average colour: far off, where a whole tile of it is only a few dots across,
   all a picture adds is its tiling (a grid over the fields), so there it fades out and isn't looked up at all */
float mlTf=0.;
/* the engine's pictures (photoG: two looks at one picture, the second turned, mixed by a slow noise so the tiling
   doesn't show; photoG2: two pictures; photoGrainG: only its grain), each look made only where it shows */
vec3 mlT(int L,vec2 wp){vec4 I=TEXINFO[L];if(mlTf>.998)return I.rgb;return mix(mlTx(vec3(wp/I.w,float(L)),mlDx/I.w,mlDy/I.w).rgb,I.rgb,mlTf);}
vec3 mlG(vec3 alb,int L,vec2 wp){vec4 I=TEXINFO[L];vec3 t=I.rgb;
  if(mlTf<.998){vec2 uv=wp/I.w,dx=mlDx/I.w,dy=mlDy/I.w;float n=smoothstep(.35,.65,vn(wp*.07)),l=float(L);vec3 a=vec3(0.),b=vec3(0.);
    if(n<.998)a=mlTx(vec3(uv,l),dx,dy).rgb;
    if(n>.002)b=mlTx(vec3(rot2(uv,2.1)*.73+5.2,l),rot2(dx,2.1)*.73,rot2(dy,2.1)*.73).rgb;
    t=mix(mix(a,b,n),t,mlTf);}
  return photoMix(alb,t,I.rgb);}
vec3 mlG2(vec3 alb,int L,int L2,vec2 wp){vec4 I=TEXINFO[L],I2=TEXINFO[L2];float n=smoothstep(.4,.6,fbmS(wp*.045+3.7));vec3 m=mix(I.rgb,I2.rgb,n),t=m;
  if(mlTf<.998){vec2 uv=wp/I.w,dx=mlDx/I.w,dy=mlDy/I.w;vec3 a=vec3(0.),b=vec3(0.);
    if(n<.998)a=mlTx(vec3(uv,float(L)),dx,dy).rgb;
    if(n>.002)b=mlTx(vec3(rot2(uv,1.3)*1.11+2.4,float(L2)),rot2(dx,1.3)*1.11,rot2(dy,1.3)*1.11).rgb;
    t=mix(mix(a,b,n),m,mlTf);}
  return photoMix(alb,t,m);}
vec3 mlGr(vec3 alb,int L,vec2 wp,float k){if(mlTf>.998)return alb;return photoGrain(alb,mlT(L,wp),TEXINFO[L].rgb,k);}
/* the sod: his dry-grass picture where it's dry, the green one where it's damp, in big soft patches (pa: a slow
   noise the ground already has) */
vec3 mlGrass(vec2 wp,float moist,float pa){
  float g=smoothstep(.2,.6,moist+(vn(wp*.043+11.)-.5)*.5+(pa-.5)*.2);vec3 st=vec3(.33,.25,.1),gr=vec3(.145,.17,.032);
  if(g<.998)st=mlG(st,T_GRASS,wp)*vec3(.95,.99,1.08);
  if(g>.002)gr=photoMix(gr,mlT(T_BOG,wp),TEXINFO[T_BOG].rgb)*mix(vec3(.86,1.,.9),vec3(1.08,1.04,.74),smoothstep(.3,.8,vn(wp*.31+5.)));
  return mix(st,gr,g);}
/* the woods' floor: leaf litter (warm brown, darker damp, the mud picture's twigs and bits as its grain), lighter
   dry leaves here and there, moss in soft patches where it's damp. No hard-edged blotches: they read as camouflage */
vec3 mlWoods(vec2 wp,float moist){
  float v=vn(wp*1.7+3.),v2=vn(wp*6.3);vec3 c=mix(vec3(.115,.072,.038),vec3(.062,.043,.026),moist)*(.7+.42*v+.22*v2);
  c=mix(c,vec3(.17,.105,.045),smoothstep(.6,.9,v2)*.3);c=mlGr(c,T_MUD,wp*1.3,.8);
  return mix(c,vec3(.052,.074,.027)*(.8+.4*v2),smoothstep(.5,.8,vn(wp*.45+7.)+.3*(moist-.5))*.55);}
#endif
//@@ base0
      spec=.03;shin=8.;
#if !defined(PROBE)&&defined(MLSOIL)
      /* (Mud Lab 8) inside the world the soil paints the ground (below): the engine's own ground isn't worked out under it */
      if(!mlIn)
#endif
      {
//@@ soil
#if !defined(PROBE)&&defined(MLSOIL)
      /* (Mud Lab) the world's own ground: each soil by how wet it is (loam dusty and pale dry, dark wet; clay cracked and
         pale dry, smooth and dark wet; silt powder to slick; dark peat with moss; sand), sod (straw when dry, greener
         wet), the woods' floor (leaf litter, moss); wetter still where the water lies just under */
      /* (Mud Lab 8: the soil's detail is laid out from the world's own corner. The engine's ground detail starts afresh every
         4,096 m, and one of those lines (x = 0) runs north to south through the middle of this world: every pattern broke along it) */
      else{vec2 wp=vP.xz-uMLo.xy;vec4 s0=textureLod(uMLs0,mlUV,0.),s1=textureLod(uMLs1,mlUV,0.);float wc=s1.r,ws=s1.g,wq=s1.b,wsd=s1.a,tot=wc+ws+wq+wsd;
        if(tot>1.){wc/=tot;ws/=tot;wq/=tot;wsd/=tot;tot=1.;}float wlm=1.-tot,wg=max(s0.a,0.),wwd=max(-s0.a,0.);
        vec4 w0=vec4(0.,0.,0.,-9999.),w1=vec4(s0.r,0.,0.,0.);if(mlWin){w0=textureLod(uMLt,mlW,0.);w1=textureLod(uMLd,mlW,0.);}
        float wtab=s0.g-(w1.r+w0.r),moist=max(s0.b,smoothstep(-.3,-.02,wtab));
        float n1=vn(wp*.35),n2=vn(wp*17.)*.55+vn(wp*41.)*.45;mlTf=smoothstep(uMLf.z,uMLf.w,gFP);
        /* the sod and the woods' floor lie in patches, bare soil between them (not a tint over all of it) */
        float cov=min(1.,wg+wwd),pn=.3*n1+.35*vn(wp*1.3+2.)+.35*vn(wp*5.1+4.),cv=smoothstep(pn-.14,pn+.14,cov*1.5-.15);
        /* the soils, each only where there's some of it and it shows: bare, turned up, a berm, a trail */
        vec3 cL=vec3(0.),cC=vec3(0.),cS=vec3(0.),cP=vec3(0.),cD=vec3(0.),cSo=vec3(0.);
        if(cv<.996||mlWin&&(w0.g>.003||w0.r>.006||w1.a<-.0005)){
          if(wlm>.004){vec3 dl=mlG2(dirtCol(wp),T_DIRT,T_DIRT2,wp);cL=mix(dl*1.18+vec3(.03,.025,.015),dl*.5,smoothstep(.15,.85,moist));}
          if(wc>.004){float k=smoothstep(.25,.7,moist);vec3 a=vec3(0.),b=vec3(0.);
            if(k<.998)a=mlGr(mix(vec3(.38,.33,.26),vec3(.45,.39,.3),n1),T_PLAYA,wp,1.);if(k>.002)b=mlGr(vec3(.19,.16,.125),T_MUD,wp,.4);cC=mix(a,b,k);}
          if(ws>.004){float k=smoothstep(.2,.65,moist);vec3 b=vec3(0.);if(k>.002)b=mlGr(mix(vec3(.11,.095,.072),vec3(.15,.125,.095),n1),T_MUD,wp,.5);cS=mix(vec3(.36,.32,.26)*(.9+.2*n1),b,k);}
          if(wq>.004){float mossy=smoothstep(.35,.62,vn(wp*.6)+.15*(n2-.5));cP=vec3(.05,.037,.026)*(.85+.3*n2);if(mossy>.002)cP=mix(cP,mlG(vec3(.085,.1,.04),T_BOG,wp)*.72,mossy*.8);}
          if(wsd>.004){cD=mlG(vec3(@@SAND@@),T_SAND,wp);cD=mix(cD,cD*.5,smoothstep(.3,.8,moist));}
          cSo=cL*wlm+cC*wc+cS*ws+cP*wq+cD*wsd;}
        vec3 cT=vec3(0.);
        if(cv>.004){vec3 cG=vec3(0.),cW=vec3(0.);if(wg>.004)cG=mlGrass(wp,moist,n1);if(wwd>.004)cW=mlWoods(wp,moist);cT=(cG*wg+cW*wwd)/max(cov,1e-3);}
        alb=mix(cSo,cT,cv);
        /* big soft patches of lighter and darker ground, so a field isn't one flat colour from far off */
        alb*=.83+.2*vn(wp*.027+9.)+.14*vn(wp*.093+2.);
        /* past where the trees are drawn, the woods show as their canopy: from the Heron the woods are woods */
        {float cn=wwd*smoothstep(uMLf.x,uMLf.y,dist);if(cn>.004)alb=mix(alb,vec3(.04,.068,.024)*(.62+.5*vn(wp*.19)+.3*vn(wp*.05+3.)),cn*.92);}
        spec=.03+.22*moist*moist*(wlm*.5+wc+ws)*(1.-.7*cv)+.05*wq;shin=8.+40.*moist*(wc+ws);pud=0.;em=1.-.4*wwd;
        mlSpec=mix(mix(.4,1.,smoothstep(.3,.7,moist)),.2,cv);
#ifndef LEAN_D
        /* (the laptop's fine bumps in the dirt and the grass: the engine's own, at half strength as before) */
        {vec3 dz=vec3(1.);dirtDetail(wp,dz,1.-cv);vec2 g0=gG;gG=vec2(0.);grassDetail(wp,dz);gG=mix(g0,gG,cv*sat(wg*2.))*.5;}
#endif
        if(mlWin){float mtx=uMLq.x,mcl=uMLq.y,cd=uMLo.z*1.28;
          /* the fine slopes the meshes don't carry: ruts, berms, the trails' two-track, the edges of the mud holes */
          float f0=textureLod(uMLt,mlW-vec2(mtx,0.),0.).r+textureLod(uMLd,mlW-vec2(mtx,0.),0.).r,f1=textureLod(uMLt,mlW+vec2(mtx,0.),0.).r+textureLod(uMLd,mlW+vec2(mtx,0.),0.).r,
            f2=textureLod(uMLt,mlW-vec2(0.,mtx),0.).r+textureLod(uMLd,mlW-vec2(0.,mtx),0.).r,f3=textureLod(uMLt,mlW+vec2(0.,mtx),0.).r+textureLod(uMLd,mlW+vec2(0.,mtx),0.).r;
          float c0=textureLod(uMLs0,mlUV-vec2(cd,0.),0.).r,c1=textureLod(uMLs0,mlUV+vec2(cd,0.),0.).r,c2=textureLod(uMLs0,mlUV-vec2(0.,cd),0.).r,c3=textureLod(uMLs0,mlUV+vec2(0.,cd),0.).r;
          float maa=1.-smoothstep(mcl*2.,mcl*10.,gFP);gG+=(vec2(f1-f0,f3-f2)/(2.*mcl)-vec2(c1-c0,c3-c2)/2.56)*mix(.3,1.,maa);
          float mrut=max(-w0.r,0.)+max(-w1.a,0.)*.5,mberm=max(w0.r,0.),mch=clamp(w0.g*1.25,0.,1.),mpr=w0.b*(1.-mch*.6),wetc=max(moist,.0);
          /* the trails: the worn two-track bare and packed */
          float tw=smoothstep(.0,.04,-w1.a);alb=mix(alb,cSo*.85,tw*.85);
          /* turned soil: dark and wet-looking, lumpy loam with dry crumbs, smooth sticky clay with a shine, glossy silt, black peat */
          vec3 tc=cL*mix(.42,.7,n2)*wlm+cC*mix(.5,.65,n2)*wc+cS*.7*ws+vec3(.03,.022,.016)*(.8+.4*n2)*wq+cD*.78*wsd;
          float crumb=smoothstep(.62,.8,vn(wp*23.+7.))*(1.-moist)*wlm;tc=mix(tc,cL*1.05,crumb*.5);alb=mix(alb,tc,mch);
          /* the tread: where a tyre rolled (not spun), its knobs pressed into the track, along the way it was heading */
          vec2 md2=w1.gb;float mtw=mpr*smoothstep(.45,.85,length(md2))*(1.-smoothstep(.006,.02,gFP))*(1.-mch);
          if(mtw>.01){float mth=atan(md2.y,md2.x)*.5;vec2 mdv=vec2(cos(mth),sin(mth)),mdp=vec2(-mdv.y,mdv.x);float ms=dot(wp,mdv)/.068,mc=dot(wp,mdp)/.085;
            float mk=fract(ms+.5*mod(floor(mc),2.)),mlug=smoothstep(.08,.16,mk)*(1.-smoothstep(.5,.58,mk))*smoothstep(.06,.16,fract(mc))*(1.-smoothstep(.84,.94,fract(mc)));
            alb*=1.-.22*mlug*mtw;gG+=mdv*(smoothstep(.08,.16,mk)-smoothstep(.5,.58,mk))*.9*mtw;}
          alb*=1.-.26*mpr;alb=mix(alb,cL*1.05,smoothstep(.008,.05,mberm)*(1.-mch)*.5*wlm*(1.-moist));
          alb*=1.-.22*smoothstep(.03,.22,mrut)*(1.-mch*.3);em*=1.-.3*smoothstep(.02,.2,mrut);
          spec=mix(spec,.22,max(mpr*.3,moist*mch*.85));shin=mix(shin,mix(40.,90.,wc+ws),max(mpr*.5,moist*mch));mlSpec=mix(mlSpec,1.,max(mpr*.5,moist*mch));
          gG+=(vec2(vn(wp*31.),vn(wp*31.+3.1))-.5)*.25*mch*maa*(1.-ws-wq*.5);
          /* wet tracks, drying over a minute and a half */
          float wd=1.-clamp((uMLq.w-w0.a)/90.,0.,1.);wd*=wd;alb*=1.-.42*wd;spec=mix(spec,.28,wd*.6);shin=mix(shin,70.,wd*.6);mlSpec=mix(mlSpec,1.,wd*.6);
          }
        /* water lying in ruts past the patch (the patch's own ruts are under the water's own surface). (Mud Lab 8) And
           everywhere past the patch a water's shore follows the ground's own heights, not the triangles of the land's
           coarser mesh (which made a saw-toothed waterline): ground that the heights say is under a water's level is
           painted as that water, level and muddy, and the water's own surface lets go where they say it's dry land */
        if(!(uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985)){float wsh=smoothstep(0.,.035,wtab);
          if(wsh>0.){alb=mix(alb,mix(vec3(.105,.076,.046),vec3(.135,.096,.054),smoothstep(0.,.14,wtab)),wsh);spec=mix(spec,.2,wsh);shin=mix(shin,420.,wsh*wsh);
            if(wsh>.5)ssr=.5;N=normalize(mix(N,vec3(0.,1.,0.),wsh));gG*=1.-wsh;mlSpec=mix(mlSpec,1.,wsh);}}}
#endif
//@@ water
#if !defined(PROBE)&&defined(MLSOIL)
      /* (Mud Lab 8) muddy water: the wet bed showing at its very edge (no hard line where it meets the ground), cloudy
         brown where it's deeper; the sky in it, more the lower you look */
      if(vC.a>.5&&mlIn){float gy=mlWin?textureLod(uMLd,mlW,0.).r+textureLod(uMLt,mlW,0.).r:textureLod(uMLs0,mlUV,0.).r,dep=vP.y-(uMLq.z+gy),sh=smoothstep(0.,.14,dep),ed=smoothstep(0.,.035,dep);
        if(dep<-.004&&!(uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985))discard;
        alb=mix(vec3(.06,.044,.028),mix(vec3(.105,.076,.046),vec3(.135,.096,.054),sh),ed);spec=mix(.1,.2,ed);shin=mix(30.,420.,ed*ed);ssr=ed>.5?.5:0.;N=normalize(vec3(gw.x*.55*ed,1.,gw.y*.55*ed));}
#endif
//@@ trunk
    /* (Mud Lab 8) the trees' trunks: bark, furrowed up and down the trunk, darker toward the ground (the engine's wood
       was planks, and his planks picture laid round a trunk made a striped post) */
    else if(m==46){vec2 q=vec2(atan(vL.z,vL.x)*1.3,vL.y);float g=vn(q*vec2(3.5,.8))*.55+vn(q*vec2(10.,2.5)+7.)*.45;
      alb=mix(vec3(.05,.037,.027),vec3(.16,.125,.095),g*g)*(.7+.3*sat(vL.y*.5));spec=.03;ground=false;}
//@@ leaves
      /* leaves: light comes through them; the crown is darker underneath and deep inside. (Mud Lab 8) clumps of leaves
         and the gaps between them in the colour, deeper shade under and inside the crown, the odd sunlit yellow-green
         spray: a crown reads as leaves, not as one smooth green shape. The side away from the sun isn't black: some of
         the sun comes through a crown */
      {float lf=vn3(Pw*2.2),lf2=vn3(Pw*7.5);alb*=(.58+.5*lf)*(.72+.56*lf2);alb=mix(alb,alb*vec3(1.3,1.12,.55),smoothstep(.6,.9,lf2)*.4);
        spec=.05;shin=10.;trans=.38;ground=false;ao=(.5+.5*sat(N.y*.5+.5)*sat(vL.y/7.+.2))*(.76+.24*lf);emc=uSunCol*alb*(.014*sat(.7-dot(N,uSunDir)));}
//@@ sharpen
  /* (Mud Lab 8) the picture is drawn smaller than the screen and rebuilt (75% on the phone), which softens it: four
     looks round each pixel put the edges back, never brighter or darker than the pixels round it (no halos). In
     place of the lens's colour fringe, which blurred the corners (two looks) */
  vec3 c=texture(uSrc,uv).rgb;
  {vec2 px=1./uOutRes;vec3 a=texture(uSrc,uv-vec2(px.x,0.)).rgb,b=texture(uSrc,uv+vec2(px.x,0.)).rgb,d=texture(uSrc,uv-vec2(0.,px.y)).rgb,e=texture(uSrc,uv+vec2(0.,px.y)).rgb;
    c=clamp(c+(4.*c-a-b-d-e)*.45,min(c,min(min(a,b),min(d,e))),max(c,max(max(a,b),max(d,e))));}
