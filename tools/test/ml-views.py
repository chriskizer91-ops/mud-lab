"""Mud Lab's fixed views, for before/after pictures and numbers of two builds:
  python3 tools/test/ml-views.py builds/mud-lab-7.html OUTDIR m|l [view,view,...]
Each view is made the same way every time: the game's own loop is held still (GAME.hold), the truck is put in its
place, driven if the view says so (physics only), the camera set, the clock set, and frames are drawn one at a time
until the picture has settled. Then OUTDIR/<view>.png (the canvas alone: no touch buttons) and OUTDIR/numbers.json:
  tris, draws   what the engine counts for that frame
  ms            the test browser's time for a whole frame (software graphics: only good for before/after)
  js            the JavaScript's own share of it
The picture is drawn at the size the device draws it: m = the Pixel 7a held sideways (915 x 412 CSS pixels, 1.25
device pixels each, the render scale held at 0.75: what the Mobile tier does at its best); l = a laptop window (1280 x
720, the High tier, render scale 1). In the environment: UI=1 also saves <view>-ui.png with the page's buttons;
FRAMES=12 times twelve frames a view, not four (the far shadows and the reflections are drawn every few frames: twelve
covers them all evenly); SCALE=.5 draws smaller, for a quick look. The views run in the order given: keep it the same
for the two builds being compared (the stock SUV's and the Heron's views leave a different truck behind them)."""
import asyncio, sys, time, json, os
from playwright.async_api import async_playwright
URL, OUT, MOBILE = sys.argv[1], sys.argv[2].rstrip('/') + '/', sys.argv[3] == 'm'
if '://' not in URL: URL = 'file://' + os.path.abspath(URL)
os.makedirs(OUT, exist_ok=True)
# name: (dx, dz, yaw from the world's middle; what to do; the camera)
#   do: list of ['drive', thr, steer, brake, secs] | ['heron', height m, speed m/s] | ['stock'] | ['js', expr]
#   cam: None (the game's chase camera) | ['look', ex,ey,ez, ax,ay,az, fov] (the truck's frame: x ahead, y up, z right)
#        | ['world', ex,ey,ez, ax,ay,az, fov] (metres from the world's middle, heights over the world's level)
VIEWS = {
    'start':    (0, 630, 1.571, [], None),
    'tracks':   (0, 600, 1.571, [['drive', .45, 0, 0, 2.0], ['drive', .35, .22, 0, 2.0], ['drive', .35, -.22, 0, 2.0], ['drive', 0, 0, .7, 1.5]], ['look', -6.5, 1.5, 3.2, 0, .5, -.6, .85]),
    'woods':    (64, 330, 1.45, [['drive', .5, 0, 0, 2.5], ['drive', 0, 0, 1, 1.2]], None),
    'mudhole':  (-150, 562, 3.1, [['drive', .8, 0, 0, 3.2], ['drive', 0, 0, .6, .8]], ['look', -7.5, 2.2, 3.4, 0, .6, -.4, .85]),
    'ford':     (-10, 172, 2.0, [['drive', .6, 0, 0, 2.6], ['drive', 0, 0, .6, .8]], None),
    'pond':     (176, 150, .45, [], ['look', -8, 2.6, -2.5, 6, .4, 1.5, .9]),
    'claypan':  (-470, -300, .6, [['drive', .5, 0, 0, 2.2], ['drive', 0, 0, .7, 1.4]], ['look', -7, 1.7, -3.2, 0, .6, .5, .85]),
    'quarry':   (392, 470, -.6, [], ['look', -9, 3.4, 2, 8, -1.5, -1, .95]),
    'bottoms':  (300, -120, .3, [['drive', .7, 0, 0, 3], ['drive', 0, 0, .6, .8]], None),
    'ridge':    (220, -610, -1.571, [], ['look', -9, 3.5, 1.5, 10, -.5, -.5, .9]),
    'heron':    (-34, 668, -1.571, [], ['look', -9, 2.4, -4, 9, 1.2, 1.5, .9]),
    'stock':    (0, 630, 1.571, [['stock'], ['drive', .45, .15, 0, 2.5], ['drive', 0, 0, .7, 1.2]], ['look', 6.5, 1.3, 3.0, 0, .6, -.3, .8]),
    'flying':   (40, 520, 1.2, [['heron', 150, 52]], None),
    # (Mud Lab 15) the soil from close by, from low behind the Rock & Mud along the tracks it has just left: wheelspin ruts in the field's loam, the Bog's wet
    # clay (and as the chase camera shows it), the quarry's sand, the Clay Pan's dry clay
    'soil-loam': (0, 600, 1.571, [['drive', 1, 0, 0, 2.5], ['drive', 0, 0, 1, 1.2]], ['look', -8.5, 1.0, 1.9, -3, .1, .7, .75]),
    'soil-bog':  (138, 536, 0, [['drive', .6, 0, 0, 6], ['drive', 0, 0, 1, 1]], ['look', -8.5, 1.0, 1.9, -3, .1, .7, .75]),
    'soil-bogc': (138, 536, 0, [['drive', .6, 0, 0, 6], ['drive', 0, 0, 1, 1]], None),
    'soil-sand': (440, 516, 0, [['drive', 1, 0, 0, 3], ['drive', 0, 0, 1, 1]], ['look', -8.5, 1.0, 1.9, -3, .1, .7, .75]),
    'soil-clay': (-470, -300, .6, [['drive', 1, 0, 0, 2.5], ['drive', 0, 0, 1, 1.2]], ['look', -8.5, 1.0, 1.9, -3, .1, .7, .75]),
    # the Bog's first pit and its wet ground, untouched, from just past the bumper. (TOD=night or golden in the
    # environment sets the hour for every view)
    'soil-wet':  (146, 536, 0, [], ['look', 2.6, .7, .6, 9, 0, 0, .8]),
    # (Mud Lab 16) the water: under way across the Mud Hole (the rings off the tyres) from above and behind and as the
    # chase camera shows it; and the Mud Hole 200 seconds after the SUV stopped in it (the churned water settled:
    # set beside 'mudhole', the same drive with no wait)
    'water-wake':  (-150, 562, 3.1, [['drive', .6, 0, 0, 5]], ['look', -7.5, 3.4, 3.2, 1.5, 0, 0, .9]),
    'water-wakec': (-150, 562, 3.1, [['drive', .6, 0, 0, 5]], None),
    'water-settled': (-150, 562, 3.1, [['drive', .8, 0, 0, 4.5], ['drive', 0, 0, 1, 1], ['js', '__ml.MLS.clock+=200']], ['look', -7, 2.6, 1.8, 0, 1, 0, .9]),
    # (Mud Lab 17) the bow wave: into the Mud Hole with a run, still moving when the picture is taken; from above and
    # behind, from the side, and as the chase camera shows it
    'water-bow':  (-112, 562, 3.1, [['drive', 1, 0, 0, 2.3], ['drive', .5, 0, 0, .9]], ['look', -9, 4.5, 3.5, 3, 0, 0, .9]),
    'water-bows': (-112, 562, 3.1, [['drive', 1, 0, 0, 2.3], ['drive', .5, 0, 0, .9]], ['look', 2, 2.2, 9, 0, .3, 0, .9]),
    'water-bowc': (-112, 562, 3.1, [['drive', 1, 0, 0, 2.3], ['drive', .5, 0, 0, .9]], None),
    # (Mud Lab 17) CLEAR ALL RUTS: the Bog's ruts as 'soil-bog' leaves them, then cleared from the list's own function
    # (and half a second of the game after it: the soil's picture is sent to the graphics card from the game's step)
    'ruts-cleared': (138, 536, 0, [['drive', .6, 0, 0, 6], ['drive', 0, 0, 1, 1], ['js', '__mlr.MLR.stuck=false;__mlm.mlmClear();__game.FX.length=0'], ['drive', 0, 0, 1, .5]], ['look', -8.5, 1.0, 1.9, -3, .1, .7, .75]),
}
# (Mud Lab 18) the Film camera on one of its shots (held there: it would cut by itself in a few seconds): its own
# Helicopter and Park orbit, and the wheel cam and the low drone as it uses them; in the Bog under way, bogged in the
# Mud Hole, and with a run through the Mud Hole's water. numbers.json's "film" says which shot the picture is
FILM = lambda shot, scene='dunes': "(()=>{const D=__dyb,F=D.FILM,t=D.GAME.car;__game.APP.cam=D.CAMS.indexOf('Film');F.shot='%s';F.prev='';F.t=0;F.min=F.max=99;F.scene=F.cutScene=F.want='%s';F.stopT=%s;F.slideT=0;F.sp0=t.speed;F.acc=0;D.CAM.cut=true;})()" % (shot, scene, 5 if scene == 'stop' else 0)
VIEWS.update({
    'film-heli':   (138, 536, 0, [['drive', .6, 0, 0, 6], ['js', FILM('Heli')]], None),
    'film-wheel':  (138, 536, 0, [['drive', .6, 0, 0, 6], ['js', FILM('Wheel cam')]], None),
    'film-low':    (138, 536, 0, [['drive', .6, 0, 0, 6], ['js', FILM('Low drone')]], None),
    'film-park':   (-150, 562, 3.1, [['drive', .8, 0, 0, 3.2], ['drive', 0, 0, .6, .8], ['js', FILM('Park orbit', 'stop')]], None),
    'film-heliw':  (-112, 562, 3.1, [['drive', 1, 0, 0, 2.3], ['drive', .5, 0, 0, .9], ['js', FILM('Heli')]], None),
    'film-parkw':  (176, 150, .45, [['drive', .5, 0, 0, 3], ['drive', 0, 0, 1, 1.5], ['js', FILM('Park orbit', 'stop')]], None),
    # (in the Heron the Film camera is the Heron's own chase camera: the same picture as 'flying', run just before it)
    'film-flying': (40, 520, 1.2, [['heron', 150, 52], ['js', "__game.APP.cam=__dyb.CAMS.indexOf('Film')"]], None),
})
# (Mud Lab 19) the new ground (where to stand for each: tools/world/stations.js). 'n-south' and 'n-east': where the
# first map's south and east banks stood. The fords from the River's west bank, facing across; the Track's pieces from
# on it, facing along it; 'n-map': the big map (with UI=1, n-map-ui.png has it)
VIEWS.update({
    'n-south':    (0, 712, -1.571, [], None),
    'n-east':     (700, 0, 0, [], None),
    'n-track':    (-124, 962, .016, [['drive', .5, 0, 0, 4]], None),
    'n-table':    (-81, 959.3, .099, [], None),
    'n-whoops':   (60, 950, -.064, [], None),
    'n-berm':     (-255.5, 1431.8, -1.208, [['drive', .5, 0, 0, 3]], None),
    'n-hairpin':  (-364.3, 1150.1, 2.489, [], None),
    'n-mounds':   (-20, 1180, -1.571, [], None),
    'n-shallows': (1317.2, 565.9, .359, [['drive', .5, 0, 0, 5]], None),
    'n-shallowsh':(1317.2, 565.9, .359, [['drive', .5, 0, 0, 5], ['js', FILM('Heli')]], None),
    'n-fordn1':   (1313.1, 33.2, -.941, [], None),
    'n-fordn2':   (1316.8, -303.3, .979, [], None),
    'n-pooln':    (1512, -139, 3.134, [], None),
    'n-lake':     (846, 1900, 0, [], None),
    'n-lakein':   (846, 1900, 0, [['drive', .6, 0, 0, 9]], None),
    'n-farside':  (1960, 520, -1.571, [], None),
    'n-map':      (0, 630, 1.571, [['js', '__game.APP.bigMap=true;__ml.MLMV.open=false;__ml.MLMV.whole=false']], None),
    'n-mapw':     (0, 630, 1.571, [['js', '__game.APP.bigMap=true;__ml.MLMV.open=false;__ml.MLMV.whole=true']], None),
    'n-mapr':     (1317.2, 565.9, .359, [['js', '__game.APP.bigMap=true;__ml.MLMV.open=false;__ml.MLMV.whole=false']], None),
    # (the Track's pieces from beside them: the SUV standing just short of each, the camera off to its right)
    # (Mud Lab 20) UNDER THE LAKE: the Rock & Mud driven in off the west beach until it has drowned and settled (22 s),
    # then: the chase camera (held over the water, as Build 19), and the three cameras that are on the SUV and now go
    # under with it: the Wheel cam, the Hood, the Cockpit. 'u-winch' is the chase camera with the game's own tick run
    # once more, so the button it offers is on the page (UI=1). 'u-jump': THE LAKE's name on the map, JUMP
    'u-chase':   (846, 1900, 0, [['drive', .6, 0, 0, 22]], None),
    'u-wheel':   (846, 1900, 0, [['drive', .6, 0, 0, 22], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Wheel cam'))"]], None),
    'u-hood':    (846, 1900, 0, [['drive', .6, 0, 0, 22], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Hood'))"]], None),
    'u-cock':    (846, 1900, 0, [['drive', .6, 0, 0, 22], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Cockpit'))"]], None),
    'u-winch':   (846, 1900, 0, [['drive', .6, 0, 0, 22], ['js', "for(let i=0;i<40;i++)__dyb.step(1/60);__mlv.mlvTick()"]], None),
    'u-stock':   (846, 1900, 0, [['stock'], ['drive', .6, 0, 0, 22], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Wheel cam'))"]], None),
    'u-jump':    (0, 630, 1.571, [['js', "__mlv.mlvJump(__mlv.mlvPlaces().find(p=>p.name==='THE LAKE'));for(let i=0;i<600;i++)__dyb.step(1/120)"]], None),
    # the Wheel cam where the water stands at about the camera's own height: the Mud Hole on the first map, and the
    # second ford north of the Shallows (70 cm)
    'u-mudhole': (-150, 562, 3.1, [['drive', .8, 0, 0, 3.2], ['drive', 0, 0, .6, .8], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Wheel cam'))"]], None),
    'u-ford':    (1316.8, -303.3, .979, [['drive', .5, 0, 0, 7], ['drive', 0, 0, .6, 1], ['js', "__dyb.camPick(__dyb.CAMS.indexOf('Wheel cam'))"]], None),
    't-table':    (-41.3, 955.1, .107, [], ['look', 5, 1.4, 17, 0, .5, 0, .9]),
    't-bigtable': (25.4, 1600.1, 2.836, [], ['look', 6, 1.6, 20, 0, .6, 0, .9]),
    't-whoops':   (102.8, 953.5, -.107, [], ['look', 2, 1.3, 16, 4, .2, 0, 1.0]),
    't-kicker':   (249.8, 993.5, -.537, [], ['look', -4, 1.5, 15, -3, .6, 0, .95]),
    't-hairpin':  (-250.3, 1470.4, -2.206, [], ['look', 16, 5, 0, 0, .3, 0, .95]),
    't-hairpin2': (-435, 1247.8, .16, [], ['look', -10, 14, -16, 6, 0, 4, 1.0]),
})
# (Mud Lab 21) the jumps (where to stand: tools/world/jumps.js gives each lane's ends). 'j-creek', 'j-river', 'j-lake',
# 'j-air': on each run-up, facing the ramp, as the chase camera shows it (the same places in an older build: the ground
# as it lay). 'j-riverair', 'j-lakeair': set going on the ramp at the speed the jump wants, and caught in the air.
# 'j-island': on the island, looking back at the shore. 'j-airmarks': from over Big Air's lip, down the strip
GO = lambda sp: "(()=>{const t=__dyb.GAME.car,sp=%s;t.v[0]=t.M[0]*sp;t.v[1]=t.M[3]*sp;t.v[2]=t.M[6]*sp;for(const w of t.wheels)w.w=sp/w.R;})()" % sp
VIEWS.update({
    'j-creek':    (933, -656.25, -1.5708, [], None),
    'j-river':    (1050.3, -490, 0, [], None),
    'j-riverair': (1182.3, -490, 0, [['js', GO(38)], ['drive', 1, 0, 0, 1.35]], ['look', -12, 2.8, 6.5, 10, -1.5, -2, .95]),
    'j-riverside':(1182.3, -490, 0, [['js', GO(38)], ['drive', 1, 0, 0, 1.35]], ['look', 6, 1.0, 34, 4, -1, 0, 1.0]),
    'j-lake':     (684.0, 1985, 0, [], None),
    'j-lakeair':  (816.0, 1985, 0, [['js', GO(32)], ['drive', 1, 0, 0, 1.1]], ['look', -12, 3.2, 6.5, 12, -2, -2, .95]),
    'j-island':   (996, 1985, 3.1416, [], None),
    'j-air':      (1153.6, 1117.2, -1.222, [], None),
    'j-airmarks': (1182.0, 1195.2, -1.222, [], ['look', -12, 5, 0, 30, -2, 0, .9]),
})
# (Mud Lab 22.1 water) the wakes: a hard turn through the Mud Hole; a broadside slide across it (set going sideways at
# 29 mph, 65 degrees off the way it points); a crawl; and deep water, the body's own bow wave: the Mud Hole's deep
# middle, from above and behind, from the side, from ahead, and as the chase camera shows it
SIDE = lambda sp, deg: "(()=>{const t=__dyb.GAME.car,c=%s*Math.cos(%s/57.3),n=%s*Math.sin(%s/57.3);t.v[0]=t.M[0]*c+t.M[2]*n;t.v[2]=t.M[6]*c+t.M[8]*n;})()" % (sp, deg, sp, deg)
VIEWS.update({
    'water-turn':  (-112, 562, 3.1, [['drive', 1, 0, 0, 2.3], ['drive', .6, .6, 0, 1.3]], ['look', -9, 5.5, 3.5, 2, 0, 0, .95]),
    'water-slide': (-112, 562, 3.1, [['drive', 1, 0, 0, 3.2], ['js', SIDE(13, 65)], ['drive', 0, 0, 0, .7]], ['look', -8, 5.5, -7, 0, 0, 1.5, .95]),
    'water-crawl': (-150, 562, 3.1, [['drive', .22, 0, 0, 7]], ['look', -7.5, 3.4, 3.2, 1.5, 0, 0, .9]),
    'water-deep':  (-150, 562, 3.1, [['drive', .8, 0, 0, 3.0]], ['look', -9, 4.5, 3.5, 3, 0, 0, .9]),
    'water-deeps': (-150, 562, 3.1, [['drive', .8, 0, 0, 3.0]], ['look', 3, 1.6, 9, 1, .3, 0, .9]),
    'water-deepf': (-150, 562, 3.1, [['drive', .8, 0, 0, 3.0]], ['look', 9, 3.2, 4, 0, .2, 0, .9]),
    'water-deepc': (-150, 562, 3.1, [['drive', .8, 0, 0, 3.0]], None),
    # ('water-wake' is the Rock & Mud in the Mud Hole's deepest water, over its sills: its body's own wave. The same from ahead and from the side)
    'water-wakef': (-150, 562, 3.1, [['drive', .6, 0, 0, 5]], ['look', 8, 2.6, 4, 0, .3, 0, .9]),
    'water-wakes': (-150, 562, 3.1, [['drive', .6, 0, 0, 5]], ['look', 2, 1.5, 8, 1, .3, 0, .9]),
    # (the stock SUV wading the same water, from ahead: its body is lower, so its own wave starts in shallower water)
    'water-stock': (-150, 562, 3.1, [['stock'], ['drive', .8, 0, 0, 3.0]], ['look', 9, 3.2, 4, 0, .2, 0, .9]),
})
HELP = r"""window.MLVW={
 hold(scale,ui){const G=__game;G.GAME.hold=true;G.DEVW.gpuT='hold';G.APP.photo=!ui;if(G.RESO)G.RESO.scale=scale;G.R.resize(G.PIC.w,G.PIC.h,scale);return [G.R.iw,G.R.ih,G.R.W,G.R.H,G.GFX.level];},
 drive(thr,steer,brk,secs){const D=__dyb,n=Math.round(secs*120);D.setTestInput({steer,thr,brk,hb:0,nos:false});for(let i=0;i<n;i++)D.step(1/120);D.setTestInput({steer:0,thr:0,brk:0,hb:0,nos:false});return +(D.GAME.car.speed*2.237).toFixed(1);},
 place(dx,dz,yaw){const A=__dyb.WG.mlA;__dyb.placeCar(A.x+dx,A.z+dz,yaw);__dyb.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});for(let i=0;i<180;i++)__dyb.step(1/120);return 1;},
 stock(){__mlsv.mlSuvSet('stock');for(let i=0;i<180;i++)__dyb.step(1/120);return __mlsv.mlIsStock(__dyb.GAME.car);},
 rockmud(){if(__dyb.GAME.car.rt)__rt2.rtFly(false);__mlsv.mlSuvSet('crawler');return 1;},
 heron(h,v){__rt2.rtFly(true);const t=__dyb.GAME.car,M=t.M;t.p[1]+=h;t.v[0]=M[0]*v;t.v[1]=0;t.v[2]=M[6]*v;t.air=true;t.airT=1;try{__rt2.RTI.lev=.8;}catch(e){}
   __dyb.setTestInput({steer:0,thr:.8,brk:0,hb:0,nos:false});for(let i=0;i<60;i++)__dyb.step(1/120);return [t.rt,+t.p[1].toFixed(1),+(Math.hypot(t.v[0],t.v[1],t.v[2])).toFixed(1)];},
 look(ex,ey,ez,ax,ay,az,fov){const D=__dyb,t=D.GAME.car;const w=(x,y,z)=>[t.p[0]+t.M[0]*x+t.M[1]*y+t.M[2]*z,t.p[1]+t.M[3]*x+t.M[4]*y+t.M[5]*z,t.p[2]+t.M[6]*x+t.M[7]*y+t.M[8]*z];
   D.CAM.over={eye:w(ex,ey,ez),at:w(ax,ay,az),fov:fov||.8};D.CAM.cut=true;return 1;},
 world(ex,ey,ez,ax,ay,az,fov){const D=__dyb,A=D.WG.mlA,h=__ml.MLS.h0;D.CAM.over={eye:[A.x+ex,h+ey,A.z+ez],at:[A.x+ax,h+ay,A.z+az],fov:fov||.8};D.CAM.cut=true;return 1;},
 free(){__dyb.CAM.over=null;__dyb.CAM.cut=true;__game.APP.cam=0;__game.APP.bigMap=false;if(__ml.MLMV){__ml.MLMV.open=false;__ml.MLMV.whole=false;}return 1;},
 /* frames drawn one at a time, the clock set (the same clouds, the same sway, every run), the world's worker given
    time to hand over the ground */
 async settle(n,t0){const G=__game;for(let i=0;i<n;i++){G.APP.t=t0+i/60;__dyb.render(1/60);await new Promise(r=>setTimeout(r,25));}return G.WORLD.chunks.size;},
 sync(){const gl=__game.gl,r=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),px=new Uint8Array(4);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,r);},
 time(n,t0){const G=__game;this.sync();let js=0;const a=performance.now();for(let i=0;i<n;i++){G.APP.t=t0+i/60;const b=performance.now();__dyb.render(1/60);js+=performance.now()-b;}this.sync();
   __dyb.GLC.n=0;__dyb.render(1/60);return {ms:+((performance.now()-a)/n).toFixed(1),js:+(js/n).toFixed(1),tris:G.APP.tris,draws:__dyb.GLC.n,chunks:G.WORLD.chunks.size,land:__ml.land().cur,fx:G.FX.length,mph:+(__dyb.GAME.car.speed*2.237).toFixed(1),film:__dyb.FILM&&G.APP.cam===__dyb.CAMS.indexOf('Film')?__dyb.FILM.shot:undefined};},
 png(){return __game.gl.canvas.toDataURL('image/png');}};"""
async def main():
    want = sys.argv[4].split(',') if len(sys.argv) > 4 else list(VIEWS)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if MOBILE else {'width': 1280, 'height': 720}, device_scale_factor=1.25 if MOBILE else 1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        # (Mud Lab 15: every view's drive starts on the same dice, as tools/test/ml-same.py's do: the clods a tyre throws are
        # rolled for and where they land changes the ground, so the same view ended a little differently every run)
        await pg.add_init_script("(()=>{let s=1;window.__seed=v=>{s=v>>>0;};Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();")
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:600])); pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:800]))
        t0 = time.time(); await pg.goto(URL + os.environ.get('HASH', ''))
        for i in range(300):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(240):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready,land:__ml.land().cur})")
            if r['st'] == 'drive' and r['ml'] and (r['land'] == 'landSoil' or os.environ.get('HASH')) and i > 6: break
        await pg.evaluate(HELP)
        size = await pg.evaluate('([s,ui])=>MLVW.hold(s,ui)', [float(os.environ.get('SCALE', .75 if MOBILE else 1)), bool(os.environ.get('UI'))])
        if os.environ.get('TOD'): await pg.evaluate(f"()=>__dyb.applyTod('{os.environ['TOD']}')")
        print('ready', round(time.time() - t0), r, size, flush=True)
        # (numbers.json is kept up as each view is done, and a later run for more views adds to it)
        nums = json.load(open(OUT + 'numbers.json')) if os.path.exists(OUT + 'numbers.json') else {}
        nums['_'] = {'url': URL, 'device': 'phone' if MOBILE else 'laptop', 'render': size}
        for name in want:
            dx, dz, yaw, do, cam = VIEWS[name]
            try:
                # (Mud Lab 15) the truck is put there first and the land given time to arrive (the height it is set down at
                # comes from the land as it's drawn where that has arrived, from the generator where it hasn't); then the
                # raking, the dice, the setting down and the whole drive are ONE step of the page's script, so nothing
                # else of the page's (a frame, a timer) can roll the dice or move the soil's clock part way through:
                # the same view of the same build is the same picture every run, and two builds whose physics are the
                # same show the same scene
                await pg.evaluate(f'()=>{{MLVW.rockmud();MLVW.free();MLVW.place({dx},{dz},{yaw});}}')
                for k in range(60):
                    await asyncio.sleep(.5)
                    if await pg.evaluate("()=>__game.WORLD.inflight===0&&__game.WORLD.inbox.length===0&&__game.WORLD.pend.size===0") and k > 3: break
                js = f'__game.FX.length=0;__ml.mlRake();__ml.MLS.clock=0;__seed(4242);MLVW.place({dx},{dz},{yaw});'
                for d in do:
                    if d[0] == 'drive': js += f'MLVW.drive({d[1]},{d[2]},{d[3]},{d[4]});'
                    elif d[0] == 'heron': js += f'MLVW.heron({d[1]},{d[2]});'
                    elif d[0] == 'stock': js += 'MLVW.stock();'
                    elif d[0] == 'js': js += d[1] + ';'
                if cam: js += f'MLVW.{cam[0]}({",".join(str(v) for v in cam[1:])});'
                await pg.evaluate('()=>{' + js + '}')
                # the ground streams in from the worker: settle until the count of squares stops changing, then a few more
                last = -1
                for k in range(16):
                    ch = await pg.evaluate('()=>MLVW.settle(4,100)')
                    if ch == last and k >= 1: break
                    last = ch
                n = await pg.evaluate('(k)=>MLVW.time(k,100.2)', int(os.environ.get('FRAMES', 4)))
                await pg.evaluate('()=>MLVW.settle(3,100.4)')
                import base64
                png = await pg.evaluate('()=>{__game.APP.t=100.5;__dyb.render(1/60);return MLVW.png();}')
                open(OUT + name + '.png', 'wb').write(base64.b64decode(png.split(',', 1)[1]))
                if os.environ.get('UI'): await pg.screenshot(path=OUT + name + '-ui.png')
                nums[name] = n; print(name, json.dumps(n), round(time.time() - t0), flush=True); json.dump(nums, open(OUT + 'numbers.json', 'w'), indent=1)
            except Exception as e: print('FAIL', name, str(e)[:600], flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
        print('--- errors:', len(errs)); print('\n'.join(errs[:8]))
        await br.close()
asyncio.run(main())
