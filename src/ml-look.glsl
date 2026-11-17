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
        float n1=vn(wp*.35),n2=vn(wp*17.);mlTf=smoothstep(uMLf.z,uMLf.w,gFP);
        /* the sod and the woods' floor lie in patches, bare soil between them (not a tint over all of it) */
        float cov=min(1.,wg+wwd),pn=.3*n1+.35*vn(wp*1.3+2.)+.35*vn(wp*5.1+4.),cv=smoothstep(pn-.14,pn+.14,cov*1.5-.15);
        /* the soils, each only where there's some of it and it shows: bare, turned up, a berm, a trail */
        vec3 cL=vec3(0.),cC=vec3(0.),cCt=vec3(0.),cS=vec3(0.),cP=vec3(0.),cD=vec3(0.),cSo=vec3(0.);
        if(cv<.996||mlWin&&(w0.g>.003||w0.r>.006||w1.a<-.0005)){
          if(wlm>.004){vec3 dl=mlG2(dirtCol(wp),T_DIRT,T_DIRT2,wp);cL=mix(dl*1.18+vec3(.03,.025,.015),dl*.5,smoothstep(.15,.85,moist));}
          if(wc>.004){float k=smoothstep(.25,.7,moist);vec3 a=vec3(0.),b=vec3(0.);
            if(k<.998)a=mlGr(mix(vec3(.38,.33,.26),vec3(.45,.39,.3),n1),T_PLAYA,wp,1.);if(k>.002)b=mlGr(vec3(.19,.16,.125),T_MUD,wp,.4);cC=mix(a,b,k);cCt=mix(vec3(.46,.4,.31),b*mix(.5,.65,n2),k);}
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
        /* (Mud Lab 22) WET SOIL IS DARK, NOT SHINY. His words, 14 Nov 2026: "the ground's kind of shiny. I know that it's
           like wet and not wet but wet soil is dark not shiny." Until now damp ground was lit as a smooth wet sheet
           (a tight highlight and the sky's grey in it at a low angle), from the first sign of damp. Damp soil's own
           colour already goes dark (above); its surface stays rough. Now no soil is lit as a sheet, wet or dry: it
           is as matt as dry ground. The only shine left on soil is water standing in the deepest of its hollows
           where it is soaked right through (gl: nothing below three quarters wet, all of it at the water's edge:
           the relief, below), a faint smear where a tyre has pressed it, and a wet track while it dries. Open water
           is as it was */
        float gl=smoothstep(.75,1.,moist)*(1.-cv);spec=.03+.05*wq;shin=8.;pud=0.;em=1.-.4*wwd;
        mlSpec=mix(.4,.2,cv);
#ifndef LEAN_D
        /* (the laptop's fine bumps in the grass: the engine's own, at half strength as before) */
        {vec3 dz=vec3(1.);grassDetail(wp,dz);gG*=cv*sat(wg*2.)*.5;}
#endif
        /* (Mud Lab 15) the soil's own relief, worked out below on every tier: rA how lumpy the soil is here (0 to 1:
           many times more where it has been turned or squeezed up), rW how far water stands in its hollows.
           (Mud Lab 22: bare ground that nothing has touched is crumbs too, dry more than wet: nearly three times
           the relief it had, so it reads as grains and not a painted sheet) */
        float rA=(.28-.1*moist)*(1.-cv),rW=gl;
        if(mlWin){float mtx=uMLq.x,mcl=uMLq.y,cd=uMLo.z*1.28;
          /* the fine slopes the meshes don't carry: ruts, berms, the trails' two-track, the edges of the mud holes */
          float f0=textureLod(uMLt,mlW-vec2(mtx,0.),0.).r+textureLod(uMLd,mlW-vec2(mtx,0.),0.).r,f1=textureLod(uMLt,mlW+vec2(mtx,0.),0.).r+textureLod(uMLd,mlW+vec2(mtx,0.),0.).r,
            f2=textureLod(uMLt,mlW-vec2(0.,mtx),0.).r+textureLod(uMLd,mlW-vec2(0.,mtx),0.).r,f3=textureLod(uMLt,mlW+vec2(0.,mtx),0.).r+textureLod(uMLd,mlW+vec2(0.,mtx),0.).r;
          float c0=textureLod(uMLs0,mlUV-vec2(cd,0.),0.).r,c1=textureLod(uMLs0,mlUV+vec2(cd,0.),0.).r,c2=textureLod(uMLs0,mlUV-vec2(0.,cd),0.).r,c3=textureLod(uMLs0,mlUV+vec2(0.,cd),0.).r;
          float maa=1.-smoothstep(mcl*2.,mcl*10.,gFP);gG+=(vec2(f1-f0,f3-f2)/(2.*mcl)-vec2(c1-c0,c3-c2)/2.56)*mix(.3,1.,maa);
          float mrut=max(-w0.r,0.)+max(-w1.a,0.)*.5,mberm=max(w0.r,0.),mch=clamp(w0.g*1.25,0.,1.),mpr=w0.b*(1.-mch*.6);
          /* the trails: the worn two-track bare and packed */
          float tw=smoothstep(.0,.04,-w1.a);alb=mix(alb,cSo*.85,tw*.85);
          /* turned soil: darker, the damp underneath (clay without the cracks of its crust: wet as dark as before, dry
             the pale powder of the broken crust); its lumps and their shine are the relief's, below */
          alb=mix(alb,cL*mix(.42,.7,n2)*wlm+cCt*wc+cS*.7*ws+vec3(.03,.022,.016)*(.8+.4*n2)*wq+cD*.78*wsd,mch);
          /* the tread: where a tyre rolled (not spun), its knobs pressed into the track, along the way it was heading */
          vec2 md2=w1.gb;float mtw=mpr*smoothstep(.45,.85,length(md2))*(1.-smoothstep(.006,.02,gFP))*(1.-mch);
          if(mtw>.01){float mth=atan(md2.y,md2.x)*.5;vec2 mdv=vec2(cos(mth),sin(mth)),mdp=vec2(-mdv.y,mdv.x);float ms=dot(wp,mdv)/.068,mc=dot(wp,mdp)/.085;
            float mk=fract(ms+.5*mod(floor(mc),2.)),mlug=smoothstep(.08,.16,mk)*(1.-smoothstep(.5,.58,mk))*smoothstep(.06,.16,fract(mc))*(1.-smoothstep(.84,.94,fract(mc)));
            alb*=1.-.22*mlug*mtw;gG+=mdv*(smoothstep(.08,.16,mk)-smoothstep(.5,.58,mk))*.9*mtw;}
          alb*=1.-.26*mpr;alb=mix(alb,cL*1.05,smoothstep(.008,.05,mberm)*(1.-mch)*.5*wlm*(1.-moist));
          alb*=1.-.22*smoothstep(.03,.22,mrut)*(1.-mch*.3);em*=1.-.3*smoothstep(.02,.2,mrut);
          spec=mix(spec,.1,mpr*.35);shin=mix(shin,20.,mpr*.35);
          /* wet tracks, drying over a minute and a half */
          float wd=1.-clamp((w0.a<0.&&w0.a>-2.5?0.:uMLq.w-w0.a)/90.,0.,1.);wd*=wd;alb*=1.-.5*wd;spec=mix(spec,.1,wd*.4);shin=mix(shin,20.,wd*.4);
          rA=min(1.,rA+(.9*mch+5.*min(mberm,.12)*(1.-mch))*(1.-.4*moist*ws));rW=max(rW,wd*.5);
          }
        /* (Mud Lab 15) the relief: clods three hand-spans, a hand and a finger across, each only while a pixel is small
           enough to show it; none in sand (its ripples are its picture's). Hollows darker, a dry soil's crests paler
           crumbs. Soaked, water stands in the deepest hollows and they glint. (Mud Lab 22: more of the relief is in the two
           finer sizes, the hand and the finger, and less in the big soft lumps: the grain of it) */
        /* (Mud Lab 22) and wet soil is DARK: bare soil goes deeper and browner as it wets (a wet soil's own colours
           were grey-browns, and under a blue sky they read as grey), a seventh less red, over a quarter less green
           and two fifths less blue when soaked */
        alb*=mix(vec3(1.),vec3(.86,.72,.58),smoothstep(.3,.9,moist)*(1.-cv));
        /* (Mud Lab 22) THE GRAIN. "The like particulate of it": soil is grains, and bare ground was a smooth painted
           sheet between its lumps (sand had no lumps at all: the Track, the jumps' lanes, the bars in the Shallows).
           Now every bare soil is flecked with grains lighter and darker than their neighbours, at two sizes (about
           an inch and a half, and half an inch), each on two grids laid across one another so no rows show, each
           only while a pixel is small enough to hold a grain (further off they would only twinkle). Dry more than
           wet. Four dice per pixel and no picture read: nothing the phone will notice */
        {vec2 wr=mat2(.8,.6,-.6,.8)*wp;alb*=1.+((h12(floor(wp*29.))+h12(floor(wr*37.))-1.)*(1.-smoothstep(.012,.04,gFP))+(h12(floor(wp*83.))+h12(floor(wr*71.))-1.)*(1.-smoothstep(.005,.016,gFP)))*(.2-.08*moist)*(1.-cv);}
        float rk=(1.-smoothstep(.06,.18,gFP))*rA*(1.-wsd);
        if(rk>.004){vec3 a=vnd(wp*2.9+1.7),b=vnd(wp*7.3+4.1),c=vnd(wp*19.+2.3);float k1=1.-smoothstep(.025,.075,gFP),k2=1.-smoothstep(.008,.024,gFP);
          float h=a.x*.3+(b.x*.4-.2)*k1+(c.x*.3-.15)*k2+.35;gG+=(a.yz*.2+b.yz*.55*k1+c.yz*.8*k2)*rk;
          float lk=min(1.,rk*1.4),hol=(1.-smoothstep(.28,.66,h))*lk;
          alb*=(1.-.4*hol)*(1.+.4*smoothstep(.56,.8,h)*lk*(1.-moist));em*=1.-.25*hol;
          float wk=rW*lk*(1.-smoothstep(.2,.42,h));spec=mix(spec,.22,wk);shin=mix(shin,50.,wk);mlSpec=mix(mlSpec,1.,wk);}
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
      /* (Mud Lab 22.3 water) A RUT DUG DOWN TO THE WATER FILLS (src/ml-soil.js mlStand): where the soil's own picture
         says a spot's rut is still filling (-1: no water yet, to -2: full, in place of when it was last wet), the
         water is taken to stand that much lower, up to 30 cm: none at first, then in the deepest of the rut, then
         out to its edges */
      if(vC.a>.5&&mlIn){bool sm=uMLv>1.5;if(sm&&vUV.x<.004)discard;float gy=textureLod(uMLs0,mlUV,0.).r,fl=0.;
        if(mlWin){vec4 gt=textureLod(uMLt,mlW,0.);gy=textureLod(uMLd,mlW,0.).r+gt.r;if(gt.a<0.&&gt.a>-2.5)fl=.3*(2.+gt.a);}
        float dep=vP.y-(uMLq.z+gy)-fl,sh=smoothstep(0.,.14,dep),ed=smoothstep(0.,.035,dep);
        if(dep<-.004&&(fl>0.||!(uMLp.w>.5&&max(abs(vP.x-uMLp.x),abs(vP.z-uMLp.y))<uMLp.z*.985)))discard;
        alb=mix(vec3(.06,.044,.028),mix(vec3(.105,.076,.046),vec3(.135,.096,.054),sh),ed);spec=mix(.1,.2,ed);shin=mix(30.,420.,ed*ed);ssr=ed>.5?.5:0.;
        /* (Mud Lab 22.4 water) THE WATER'S OWN RIPPLES. Until now still water was tipped this way and that by two layers of
           blotchy noise (the engine's creek: gw), a tenth of a slope each way everywhere: seen from low down across a
           pond, half of those tips mirrored the pale sky and half the land under the horizon, and the water read as a
           grey speckled sheet, like concrete. Now:
           - the tips are the SLOPES OF RIPPLES (a noise's own gradient, at two sizes: about half a metre and a hand's
             breadth, each drifting its own way), so they lie as ripples do;
           - they come in PATCHES, as a breeze lays them: strong in some places, nearly glassy in others, the patches
             drifting slowly;
           - they fade where a pixel is wider than a ripple (far off they could only sparkle);
           - and no ripple mirrors what is under the horizon (below: Mud Lab 22.1 did this for the wake only) */
        vec2 rg;{vec3 r1=vnd(wp*2.1+vec2(uTime*.5,uTime*.31)),r2=vnd(wp.yx*5.3-vec2(uTime*.7,uTime*.45));
          float ra=(.2+.9*smoothstep(.42,.72,vn(wp*.06+uTime*.015)))*ed;rg=(r1.yz*.15+r2.zy*.09)*(ra/(1.+gFP*3.5));
          /* (and where there are ripples the water leans toward the eye by about their steepness, seen or too small to
             see: that is the face of each ripple the eye meets. So rippled water mirrors the sky from higher up
             (bluer, darker) and glassy water the pale sky at the horizon: the patches show as they do on a pond) */
          N=normalize(vec3(-rg.x,1.,-rg.y)+vec3(V.x,0.,V.z)*(.08*ra));}
        /* (Mud Lab 22.3 water) WHAT A TRUCK DOES TO THE WATER IS WORKED OUT, NOT DRAWN (src/ml-soil.js mlRipple). Builds
           16 to 22.2 worked a wake out here, a pixel at a time, from 52 places along the paths the tyres and the body
           had taken: a loop of 52 sums for every pixel of water near the truck. That is gone. The ripples are a sheet
           of points now (uMLv 2), each with its own height worked out from its neighbours' many times a second, and
           all that is left to do here is light it: the sheet brings its slope (vC.rg), its foam (vC.b), how far it
           is lifted (vUV.x: under 4 mm it is under the level water and thrown away, above) and its height (vUV.y).
           Crests a little paler and troughs darker; where the water is worked up it is choppier too (more of the
           water's own small ripples) and the sun's glint a broad soft patch (a sharp one showed the sheet's own
           squares as a net of bright lines); foam as Mud Lab 22.1 made it (pale tan froth, matt, laid as a lace that stays where it is on the
           water); and a wave's far side, seen from low down, mirrors the sky just over the horizon, not the land
           under it (22.1) */
        if(sm){float wk=ed,wf=vC.b;
          float wl=min(1.,length(vC.rg)*4.);N=normalize(N-vec3(vC.r,0.,vC.g)*(1.3*wk)-vec3(rg.x,0.,rg.y)*(.6*wl));alb*=1.+.6*vUV.y*wk;shin=mix(shin,90.,wl);
          if(wf>.03){float n=.6*abs(2.*vn(wp*4.)-1.)+.4*vn(wp*15.),c=smoothstep(n-.12,n+.14,wf)*ed*.85;alb=mix(alb,vec3(.4,.34,.26),c);shin=mix(shin,6.,c);}
          }
        /* (water mirrors the sky just over the horizon where a slope would mirror what is under it) */
        {vec3 wr=reflect(-V,N);if(wr.y<0.){wr.y=-wr.y;N=normalize(V+wr);}}}
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
