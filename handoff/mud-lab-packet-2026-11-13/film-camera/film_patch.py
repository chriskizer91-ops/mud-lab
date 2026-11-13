#!/usr/bin/env python3
"""THE FILM CAMERA AND THE SOFTER FLY-PAST, for Mud Lab. Cut out of Salt & Sand's second step
(salt-and-sand-showroom's patch2.py, lines 22 to 44, 10 Nov 2026) with nothing of the Showroom in it, and its three
swaps that leaned on Salt & Sand's lean-car step re-pointed at the plain engine's text (marked MUD LAB below).
By exact text swaps, each must match once.
usage: python3 -I film_patch.py <a built Mud Lab page> <out.html>
   or: lift the swaps into src/build.py (they are written against the page, as build.py's own are) and put
       src2/film.js beside the other ml-*.js files.
The piece: src2/film.js (the Film camera: FILM, FHEL the Helicopter, the park orbit, the long lens, flyPitch)."""
import sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
n0 = len(s)
def rd(p): return open(os.path.join(HERE, p), encoding='utf-8').read()
def swap(old, new, why, count=1):
    global s
    c = s.count(old)
    if c != count: raise SystemExit(f'PATCH FAILED ({why}): expected {count} match(es), found {c}\n  {old[:160]!r}')
    s = s.replace(old, new)
def js_str(t): return json.dumps(t).replace('<', '\\u003c')
def line_of(prefix):
    a = s.index('\n' + prefix) + 1; b = s.index('\n', a); return a, b

# ======== the Film camera ========
swap("const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside'];",
     "const CAMS=['Chase','Far','Hood','Cinematic','Drone lead','Drone tail','Drone left','Drone right','Drone orbit','Low drone','Drone follow','Cockpit','Wheel cam','Tracking car','Roadside','Film'];", 'the cameras: Film')
swap("if(s.cam>=0&&s.cam<15)APP.cam=s.cam|0;", "if(s.cam>=0&&s.cam<16)APP.cam=s.cam|0;", 'the save: sixteen cameras')
swap("const CAM_ORDER=[0,1,2,11,12,13,14,3,9,10,8,4,5,6,7];", "const CAM_ORDER=[0,15,1,2,11,12,13,14,3,9,10,8,4,5,6,7];", 'the list: Film after Chase')
swap("const CAM_DEF={on:[0,2,11,12,13,14,3,9,10,8],t:{0:10,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true};",
     "const CAM_DEF={on:[0,15,2,11,12,13,14,3,9,10,8],t:{0:10,15:30,1:10,2:8,11:12,12:8,13:13,14:8,3:14,9:20,10:10,8:16,4:8,5:8,6:8,7:8},dir:false,jump:true,film:1};", 'the list: Film on')
swap("    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;}",
     "    if(s.t)for(const k in s.t)if(CAM_TIMES.includes(+s.t[k]))o.t[k]=+s.t[k];o.dir=!!s.dir;o.jump=s.jump!==false;\n    /* (a list saved before the Film camera was there: it joins the cameras that are on, once) */\n    if(!s.film&&!o.on.includes(15))o.on.push(15);}", 'the list: Film joins a saved list')
swap("function camUpdate(dt){\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=CAMS[APP.cam],cut=CAM.cut,",
     "function camUpdate(dt){\n  /* (the Film camera picks its shot first: sas_film) */\n  filmStep(GAME.car,dt);\n  const t=GAME.car,M=t.M,F=mcol(M,0),U=mcol(M,1),sp=t.speed,mode=camMode(),cut=CAM.cut,", 'camUpdate: the Film camera first')
swap("  {const J=camAuto(t,dt);if(J)return J;}\n",
     "  {const J=camAuto(t,dt);if(J)return J;}\n  if(mode==='Heli'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return heliStep(t,dt,cut);}\n  if(mode==='Park orbit'){CAM.yaw=null;CAM.off=null;CAM.fq=null;return filmParkStep(t,dt,cut);}\n", 'camUpdate: the Film camera\'s own shots')
swap("const t=GAME.car,M=t.M,F=mcol(M,0),mode=CAMS[APP.cam],D=carD(t);", "const t=GAME.car,M=t.M,F=mcol(M,0),mode=camMode(),D=carD(t);", 'soundUpdate: heard as the shot is heard')
swap("  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=CAMS[APP.cam];", "  if(APP.orbit)return .3;if(JUMP.on)return .2;const m=camMode();if(m==='Heli')return FHEL.near;", 'sasNear: the long lens')
anchor = "/* how close the picture's near edge can come, per camera (the cockpit's cabin is right round you) */"
swap(anchor, rd('src2/film.js') + anchor, 'the Film module')
# the fly-past pitch, softer
swap("  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:clamp(343/(343-vr),.65,1.45)};}",
     "  return {geo:{dist:clamp(d*.6,2,60),pan:clamp(-dot2(u,right)*.9,-1,1),rear:clamp(.5-.5*dot2(u,F),0,1)*.6+.4},dop:flyPitch(vr,d)};}", 'cineSound: the softer fly-past pitch')
# MUD LAB: the look's switch (Salt & Sand's anchor had its lean car's two switches in it)
swap("const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,", "const LOOK_DEF={sat:1,con:1,key:1,haze:1,detail:1,shadows:1,occ:1,softFly:1,", 'the look: the fly-past switch')
# MUD LAB: the Dev panel's switch, after the plain engine's last one
swap("['occ','Shade under the cars','The soft occlusion on the ground under each car.']];",
     "['occ','Shade under the cars','The soft occlusion on the ground under each car.'],\n  ['softFly','Softer fly-past sound','The drop in the engine\\'s note as the car passes a camera standing by (Cinematic, Roadside, Low drone, the jump cam): about half what it was, a little under what a real microphone hears. Off, as before.']];", 'the Dev panel: its switch')
# MUD LAB: the tools' handle (Salt & Sand's began with its lean car's S2B)
swap("  window.__dyb={CAMS,", "  window.__dyb={FILM,FHEL,camMode,flyPitch,camUpdate,CAMS,", 'the tools\' handle')

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,}), 14 swaps')
