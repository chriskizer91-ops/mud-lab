"""Mud Lab 9's pictures and numbers: the title, the start with both SUVs, a strap rescue, a winch pull, the map.
  python3 tools/test/ml-rescue.py builds/mud-lab-9.html OUTDIR [scene,scene,...]
At the phone's picture size (as tools/test/ml-views.py: 915 x 412, 1.25 device pixels, render scale 0.75). Each scene
is set up with the physics only (tools/test/ml-drive.js), then drawn: OUTDIR/<scene>.png is the whole page, buttons and
all; numbers.json has what happened (speeds, line tension, how far the bogged SUV moved, triangles)."""
import asyncio, sys, time, json, os, re, base64
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
URL, OUT = sys.argv[1], sys.argv[2].rstrip('/') + '/'
if '://' not in URL: URL = 'file://' + os.path.abspath(URL)
os.makedirs(OUT, exist_ok=True)
HELP = re.search(r'HELP = r"""(.*?)"""', open(os.path.join(HERE, 'ml-views.py')).read(), re.S).group(1)
DRIVE = open(os.path.join(HERE, 'ml-drive.js')).read()
MORE = r"""window.R9={
 /* the camera off to one side of the middle of two points, looking at it */
 side(a,b,off,up,fov){const D=__dyb,mx=(a[0]+b[0])/2,mz=(a[2]+b[2])/2,my=Math.max(a[1],b[1]),dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz)||1;
   D.CAM.over={eye:[mx-dz/l*off,my+up,mz+dx/l*off],at:[mx,my+.3,mz],fov:fov||.8};D.CAM.cut=true;return 1;},
 tris(){return __game.APP.tris;},
 /* a SUV bogged in hole k: in at part throttle, stopped in its middle, then the throttle held until the game says so */
 bog(kind,k,mode){const T=T9;T.sign();const H=T.hole(k),cs=Math.cos(H.r),sn=Math.sin(H.r);__ml.mlRake();
   const t=T.put(kind,H.u-cs*(H.L+25),H.v-sn*(H.L+25),-H.r,mode),A0=__dyb.WG.mlA;let tt=0;
   /* (the other SUV, 40 m back up the trail) */
   T.R().other=__mlr.mlrMake(kind==='stock'?'crawler':'stock',{x:A0.x+H.u-cs*(H.L+40),z:A0.z+H.v-sn*(H.L+40),yaw:-H.r});T.R().made=true;
   while(tt<20&&T.at(t,H).s<-H.L*.1){T.inp({thr:.45,steer:T.steer(t,H,1)});T.steps(12);tt+=.1;}
   for(let i=0;i<40&&t.speed>.15;i++){T.inp({brk:1});T.steps(12);}
   let n=0;while(n<10&&!T.R().stuck){T.go({thr:1},1);n++;}T.go({},.5);const A=__dyb.WG.mlA;return {bogged:T.R().stuck,after:n,at:[T.f(t.p[0]-A.x),T.f(t.p[2]-A.z)],can:T.R().can};}
};"""
async def main():
    want = sys.argv[3].split(',') if len(sys.argv) > 3 else ['title', 'start', 'strap', 'winch', 'bog', 'pull', 'map']
    num = {}
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412}, device_scale_factor=1.25, has_touch=True)
        pg = await ctx.new_page(); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:600]))
        await pg.goto(URL)
        for i in range(300):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        if 'title' in want:
            if 'tyres' in want: await pg.evaluate("()=>{const b=document.querySelector('#mlPick [data-k='+__mlsv.MLSV.pick+']');b.click();}")
            await pg.screenshot(path=OUT + 'title.png')
            if 'tyres' in want: await pg.evaluate("()=>{const b=document.querySelector('#mlPick [data-k='+__mlsv.MLSV.pick+']');b.click();}")
            await pg.evaluate("()=>document.querySelector('#mlPick [data-m=real]').click()"); await pg.screenshot(path=OUT + 'title-real.png')
            await pg.evaluate("()=>document.querySelector('#mlPick [data-m=free]').click()")
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(240):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready,land:__ml.land().cur})")
            if r['st'] == 'drive' and r['ml'] and r['land'] == 'landSoil' and i > 6: break
        await pg.evaluate(HELP); await pg.evaluate(DRIVE); await pg.evaluate(MORE)
        print('ready', await pg.evaluate('()=>MLVW.hold(.75,true)'), flush=True)
        ev = lambda js: pg.evaluate('()=>' + js)
        async def shot(name, frames=6):
            await pg.evaluate('([n])=>MLVW.settle(n,100)', [frames]); await pg.screenshot(path=OUT + name + '.png'); print('shot', name, flush=True)
        if 'start' in want:
            await ev("(MLVW.free(),T9.go({hb:1},1))"); await shot('start'); num['start'] = {'tris': await ev('R9.tris()'), 'state': await ev('T9.st()')}
        if 'strap' in want:
            n = {'bog': await ev("R9.bog('stock',14,'AWD')")}
            n['bring'] = await ev("(__mlr.mlrBring(),T9.go({},1.5))"); n['hook'] = await ev("(__mlr.mlrHookUp(),T9.go({},.5))")
            await ev("(t=>R9.side(t.p,__mlr.MLR.other.p,11,2.6,.85))(__dyb.GAME.car)"); await shot('strap-hooked')
            n['seat'] = await ev("(__mlr.mlrSeat(),T9.go({},1))"); p0 = n['seat']['other']['p']
            pulls = []
            for i in range(6):
                s = await ev("T9.go({thr:.3},1)"); pulls.append([s['mph'], s['other']['mph'], s['strap']['kN'] if s['strap'] else None])
                if i == 2: await ev("(t=>R9.side(t.p,__mlr.MLR.other.p,12,2.8,.85))(__dyb.GAME.car)"); await shot('strap-pull')
            s = await ev("T9.go({brk:1},2)"); n['pulls'] = pulls; n['peak_kN'] = s['strap']['peak'] if s['strap'] else None
            n['moved_m'] = round(((s['other']['p'][0] - p0[0]) ** 2 + (s['other']['p'][1] - p0[1]) ** 2) ** .5, 1)
            n['unhook'] = await ev("(__mlr.mlrHookUp(),T9.go({},1))"); await ev("MLVW.free()"); await shot('strap-out'); num['strap'] = n
        if 'winch' in want:
            # (near its limit the Rock & Mud sometimes drives out of a pit it stopped in: try the next pit)
            for k in (7, 8, 10, 9):
                n = {'pit': k, 'bog': await ev("R9.bog('crawler',%d)" % k)}
                if n['bog']['bogged'] and n['bog']['can'] == 'WINCH': break
            n['trees'] = await ev('T9.trees()')
            n['hook'] = await ev("(__mlr.mlrHookUp(),T9.go({},2))")
            if n['hook']['winch']:
                await ev("MLVW.free()"); await shot('winch')
                # (and from above the bonnet, looking down the line to the tree)
                await ev("MLVW.look(-1.5,3.4,2.6,12,.2,-.6,.95)"); await shot('winch-line')
                p0 = n['hook']['p']; log = []
                for i in range(70):
                    s = await ev("T9.go({thr:0},1)"); log.append([s['mph'], s['winch']['kN'] if s['winch'] else None])
                    if not s['winch']: break
                n['log'] = log[::6]; n['secs'] = len(log); n['end'] = s; n['moved_m'] = round(((s['p'][0] - p0[0]) ** 2 + (s['p'][1] - p0[1]) ** 2) ** .5, 1)
                await ev("MLVW.free()"); await shot('winch-out')
            num['winch'] = n
        if 'tyres' in want:
            # (Mud Lab 11) each SUV a tyre size up, side by side with its standard self parked beyond
            num['tyres'] = await ev("(T9.bigOn=true,[T9.facts('stock'),T9.facts('crawler')])")
            await ev("(T9.put('crawler',-20,612,1.571),T9.bigOn=false,__mlsv.MLSV.big.stock=true,T9.R().other=__mlr.mlrMake('stock',{x:__dyb.WG.mlA.x-14.5,z:__dyb.WG.mlA.z+612,yaw:1.571}),T9.R().made=true,__mlsv.MLSV.big.stock=false,T9.go({hb:1},1),MLVW.look(5,1.5,-9,0,.9,2.6,.75))"); await shot('tyres')
            await ev("(__mlsv.MLSV.big.crawler=false,T9.put('crawler',-20,612,1.571),T9.R().other=__mlr.mlrMake('stock',{x:__dyb.WG.mlA.x-14.5,z:__dyb.WG.mlA.z+612,yaw:1.571}),T9.R().made=true,T9.go({hb:1},1),MLVW.look(5,1.5,-9,0,.9,2.6,.75))"); await shot('tyres-std')
        if 'bank' in want:
            # the pond's bank from its top, the Rock & Mud nosing over
            await ev("(C=>{const dx=C.p0[0]-C.p1[0],dz=C.p0[1]-C.p1[1],l=Math.hypot(dx,dz);T9.put('crawler',C.p1[0]-dx/l*16,C.p1[1]-dz/l*16,Math.atan2(-dz/l,dx/l));T9.go({thr:.25},2.5);T9.go({brk:1,hb:1},1);MLVW.free();})(T9.cliff())"); await shot('bank'); num['bank'] = {'tris': await ev('R9.tris()')}
        if 'heronfar' in want:
            # the Heron on its strip from 130 m off: the triangles in the picture
            await ev("(H=>{const A=__dyb.WG.mlA;T9.put('crawler',H.x-A.x+%s,H.z-A.z-4,3.1416);T9.go({hb:1},.5);MLVW.look(-6,2.2,.6,20,1.2,0,.5);})(__mlv.mlvHome())" % os.environ.get('HERON_M', '130')); await shot('heronfar'); num['heronfar'] = {'tris': await ev('R9.tris()'), 'far': await ev("__mlr.MLF?JSON.stringify(__mlr.MLF):'no far copy'")}
        if 'bog' in want:
            # (Mud Lab 10) the Bog: from its start line, then where a floored run with the Rock & Mud ends
            await ev("(T9.sign(),__ml.mlRake(),__mlb.MLB.cool=false,T9.put('crawler',__dyb.WG.mlBog.u0-13,__dyb.WG.mlBog.v,0),MLVW.free(),1)"); await shot('bog-start')
            num['bog'] = {'tris': await ev('R9.tris()'), 'run': await ev("T9.bogRun('crawler',0,1,'lock')"), 'stock': await ev("T9.bogRun('stock',0,.6,'4 HI')")}
            num['bog']['run2'] = await ev("T9.bogRun('crawler',2,.6,'lock')"); await ev("(T9.go({},.3),MLVW.look(-9,4.2,3.2,4,.4,-.6,.9))"); await shot('bog-mark'); num['bog']['best'] = await ev('__mlb.MLB.best')
        if 'pull' in want:
            # the pull test: tail to the post, the line on, held at 0.7 throttle, lifted off
            await ev("(P=>{const A=__dyb.WG.mlA;T9.put('crawler',P.x-A.x+6.5,P.z-A.z,0);})(__mlb.MLB_POST())"); n = {'can': (await ev("T9.go({},1)"))['can']}
            await ev("__mlr.mlrHookUp()"); await ev("T9.go({thr:.7},4)"); await ev("MLVW.look(3,2.6,7,-3,.5,0,.9)"); n['after'] = (await ev("T9.go({},1)"))['msgs']; n['pulled'] = await ev('__mlb.MLB.pulled'); await shot('pull'); await ev("(__mlr.mlrUnhook(),MLVW.free())"); num['pull'] = n
        if 'climb' in want:
            # (Mud Lab 14) the Hill Climb: from the south, set down at its line from the list, a run up it to a mark, and the list
            await ev("(__mlr.MLR.mode='free',__game.APP.bigMap=false,T9.put('crawler',40,-446,1.571),T9.go({hb:1},.3),MLVW.free(),1)"); await pg.evaluate('([n])=>MLVW.settle(n,100)', [8]); n = {}
            await ev("(__dyb.GAME.msgs.length=0,__mlm.mlmGo(__mlm.mlmDo().find(e=>e.name==='HILL CLIMB')),T9.go({hb:1},.4),MLVW.free(),1)"); await shot('climb-line', 4)
            n['line'] = await ev("__dyb.GAME.msgs.map(m=>m.t)"); n['tris'] = await ev('R9.tris()')
            await ev("(__dyb.GAME.msgs.length=0,(()=>{let q=0;while(q<200&&!__mlhc.MLHC.last){T9.inp({thr:1});T9.steps(12);q++;}T9.go({hb:1},.25);})(),MLVW.free(),1)"); await shot('climb-mark', 4)
            n['mark'] = [await ev("__mlhc.MLHC.last"), await ev("__dyb.GAME.msgs.map(m=>m.t)"), await ev("__mlhc.MLHC.best"), await ev("T9.f(__dyb.GAME.car.speed*2.237)")]; n['trisMark'] = await ev('R9.tris()')
            await ev("(MLVW.free(),__game.APP.bigMap=true,__game.APP.photo=false,T9.go({hb:1},.3),__mlm.MLM.btn.click(),T9.go({hb:1},.2),__mlm.mlmPick('todo'),T9.go({hb:1},.2),1)"); await shot('climb-todo', 3)
            n['todo'] = await ev("__mlm.mlmRows().map(r=>r[1])"); await ev("(__mlm.MLM.open=false,__game.APP.bigMap=false,1)")
            # (and the whole of it from the south, the trees round it drawn by now)
            await ev("(T9.put('crawler',40,-440,1.571),__dyb.GAME.msgs.length=0,T9.go({hb:1},.3),MLVW.look(-9,4.5,0,30,7,0,.95),1)"); await shot('climb-far', 8); n['trisFar'] = await ev('R9.tris()'); num['climb'] = n
        if 'climbtris' in want:
            # (triangles drawn where the Hill Climb is: at its line and part way up, looking north; runs on builds without it too)
            n = {}
            for nm, v in (('line', -481.5), ('up', -505), ('south', -446)):
                await ev("(T9.put('crawler',40,%s,1.571),T9.go({hb:1},.3),MLVW.free(),1)" % v); await pg.evaluate('([n])=>MLVW.settle(n,100)', [8]); n[nm] = await ev('R9.tris()')
            num['climbtris'] = n
        if 'menu' in want:
            # (Mud Lab 13) the map with its menu down, the list of things to do, and the guide arrow on the driving screen
            await ev("(__dyb.placeCar(__dyb.WG.mlA.x+30,__dyb.WG.mlA.z+610,1.571),__game.APP.bigMap=true,__game.APP.photo=false,T9.go({hb:1},.3),__mlm.MLM.btn.click(),T9.go({hb:1},.2),1)"); await shot('menu', 4)
            await ev("(__mlm.mlmPick('todo'),T9.go({hb:1},.2),1)"); await shot('menu-todo', 2)
            await ev("(__mlr.MLR.mode='real',__mlm.mlmGo(__mlm.mlmDo()[0]),T9.go({hb:1},.3),MLVW.free(),1)"); await shot('guide', 4); num['menu'] = await ev("__mlm.MLM.nav.textContent")
            # (a trail picked in Free play: set down at its start, the arrow leading down it, the clock)
            await ev("(__mlr.MLR.mode='free',__mlm.MLM.guide=null,__dyb.GAME.msgs.length=0,__mlm.mlmGo(__mlm.mlmDo()[2]),T9.go({thr:.25},5),T9.go({hb:1},.2),MLVW.free(),1)"); await shot('run', 4)
            num['run'] = await ev("__mlm.MLM.nav.textContent"); num['rows'] = await ev("__mlm.mlmRows().map(r=>r[1])")
            await ev("(__mlm.mlmPick('stop'),1)")
            # (Free play: a place tapped on the map: JUMP, and GUIDE ME THERE over it)
            await ev("(__dyb.placeCar(__dyb.WG.mlA.x+30,__dyb.WG.mlA.z+610,1.571),__game.APP.bigMap=true,T9.go({hb:1},.3),1)"); await pg.evaluate('([n])=>MLVW.settle(n,100)', [3])
            num['tap'] = await ev("__mlv.mlvTapName('THE RIDGE')"); await ev("T9.go({hb:1},.2)"); await shot('map-pick', 3)
            num['pick'] = await ev("[...document.querySelectorAll('#mlJump,#mlGuideB,#mlMenu')].filter(b=>!b.hidden).map(b=>b.textContent)")
            await ev("(__mlm.MLM.gb.click(),T9.go({hb:1},.3),1)"); num['guided'] = await ev("[__game.APP.bigMap,__mlm.MLM.guide&&__mlm.MLM.guide.name,__mlm.MLM.nav.textContent]")
            await ev("(__mlm.mlmPick('stop'),1)")
            # (a run, then a JUMP somewhere else from the map: the run is over)
            await ev("(__mlm.mlmGo(__mlm.mlmDo()[2]),T9.go({thr:.3},2),__game.APP.bigMap=true,T9.go({hb:1},.3),1)"); await pg.evaluate('([n])=>MLVW.settle(n,100)', [3])
            r0 = await ev("!!__mlm.MLM.run"); await ev("__mlv.mlvTapName('THE RIDGE')"); await ev("(document.getElementById('mlJump').click(),T9.go({hb:1},.5),1)")
            num['jumpEndsRun'] = [r0, await ev("!!__mlm.MLM.run"), await ev("!!__mlm.MLM.guide"), await ev("__dyb.GAME.place")]
        if 'map' in want:
            await ev("(__dyb.placeCar(__dyb.WG.mlA.x+30,__dyb.WG.mlA.z+610,1.571),__mlr.MLR.stuck=false,__game.APP.bigMap=true,__game.APP.photo=false,T9.go({hb:1},.3),1)"); await shot('map', 4); num['map'] = await ev("[...document.querySelectorAll('button')].filter(b=>!b.hidden&&/GET IN|BRING|TOW|JUMP|Grip|GRIP|TYRES/.test(b.textContent)).map(b=>b.textContent)")
            await ev("(__game.APP.bigMap=false,1)")
        num['errors'] = logs[:5]
        json.dump(num, open(OUT + 'numbers.json', 'w'), indent=1); print(json.dumps(num)[:3000]); await br.close()
asyncio.run(main())
