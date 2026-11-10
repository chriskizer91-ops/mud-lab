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
    want = sys.argv[3].split(',') if len(sys.argv) > 3 else ['title', 'start', 'strap', 'winch', 'map']
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
            await pg.screenshot(path=OUT + 'title.png')
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
        if 'map' in want:
            await ev("(__dyb.placeCar(__dyb.WG.mlA.x+30,__dyb.WG.mlA.z+610,1.571),__mlr.MLR.stuck=false,__game.APP.bigMap=true,__game.APP.photo=false,T9.go({hb:1},.3),1)"); await shot('map', 4); num['map'] = await ev("[...document.querySelectorAll('button')].filter(b=>!b.hidden&&b.offsetParent&&/GET IN|BRING|TOW|JUMP|Grip|GRIP/.test(b.textContent)).map(b=>b.textContent)")
            await ev("(__game.APP.bigMap=false,1)")
        num['errors'] = logs[:5]
        json.dump(num, open(OUT + 'numbers.json', 'w'), indent=1); print(json.dumps(num)[:3000]); await br.close()
asyncio.run(main())
