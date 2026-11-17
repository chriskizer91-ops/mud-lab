"""Does one build drive exactly like another?  python3 tools/test/ml-same.py builds/mud-lab-7.html builds/mud-lab-8.html
For a build that was only meant to change the picture. Each build gets the same drives with the same dice (the page's
random numbers are replaced by a counted sequence, started afresh before each drive), the game's own loop held still
and only the physics stepped, each drive on a page opened fresh for it with nothing saved from before (the game saves
as it goes, and what one drive leaves behind, in the page or in its saves, is enough to change the last digit of the
next: soft mud multiplies last digits), in a vehicle made new for it, on raked ground with nothing in the air: the
Rock & Mud across the dry field, through the Mud Hole, into the pond's bottoms and across the quarry's sand; the stock
SUV into the Mud Hole and in 4 LO on the clay pan; the Heron's take-off run. (All in the open: the trees you can hit
come with the land as it's drawn, and nothing is drawn here.) After each: where the vehicle is to a tenth of a
millimetre, its speed, each wheel's spin, how deep the ruts are, how much soil was dug and turned, how many clods flew.
Every number has to be the same in both builds; any that isn't is printed. (Give the same build twice to see that the
test itself is steady.)"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
SEED = "(()=>{let s=1;window.__seed=v=>{s=v>>>0;};Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();"
HELP = r"""window.MLS2={
 state(){const t=__dyb.GAME.car,S=__ml.mlStats(),A=__dyb.WG.mlA,f=v=>+v.toFixed(4);
   return {p:[f(t.p[0]-A.x),f(t.p[1]),f(t.p[2]-A.z)],v:[f(t.v[0]),f(t.v[1]),f(t.v[2])],mph:f(t.speed*2.237),spin:t.wheels.map(w=>f(w.w)),sunk:t.wheels.map(w=>f(w.comp||0)),
     deepestCm:S.deepestCm,bermCm:S.bermCm,churnedM2:S.churnedM2,pressedM2:S.pressedM2,dugLitres:S.dugLitres,clods:S.clods,splash:S.splash,squares:S.squares,here:S.here};},
 run(kind,dx,dz,yaw,legs,seed){const D=__dyb,A=D.WG.mlA;__game.FX.length=0;__ml.mlRake();const S=__ml.MLS.stat;S.dug=S.clods=S.landed=S.splash=0;
   /* (the soil's own clock from nought: sums from a different start round differently, and soft mud multiplies the last digit) */
   __ml.MLS.clock=0;
   /* (a vehicle made new, where the drive starts: made anywhere else, it brings the last digits of where it stood) */
   /* (Mud Lab 9: the other SUV isn't part of these drives) */
   if(window.__mlr)__mlr.testClear();
   D.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});__mlsv.mlSuvSet('stock');__mlsv.mlSuvSet('crawler');
   __game.spawnCar(__mlsv.MLSV.bi[kind],A.x+dx,A.z+dz,yaw);__mlsv.MLSV.pick=kind;__game.FX.length=0;__ml.mlRake();__ml.MLS.clock=0;__seed(seed);for(let i=0;i<480;i++)D.step(1/120);
   for(const [thr,steer,brk,secs] of legs){D.setTestInput({steer,thr,brk,hb:0,nos:false});for(let i=0;i<Math.round(secs*120);i++)D.step(1/120);}
   return this.state();}};"""
RUNS = [('Rock & Mud, the dry field', "MLS2.run('crawler',0,620,1.571,[[.8,0,0,3],[.5,.3,0,2],[0,0,1,1.5]],11)"),
        ('Rock & Mud, the Mud Hole', "MLS2.run('crawler',-150,562,3.1,[[1,0,0,5],[0,0,.5,1]],12)"),
        ('Rock & Mud, the pond\'s bottoms', "MLS2.run('crawler',190,130,.45,[[1,0,0,4]],13)"),
        ('Rock & Mud, the quarry\'s sand', "MLS2.run('crawler',440,516,0,[[1,0,0,3]],15)"),
        ('stock SUV, the Mud Hole', "MLS2.run('stock',-150,562,3.1,[[1,0,0,5]],16)"),
        ('stock SUV, 4 LO on the clay pan', "MLS2.run('stock',-470,-300,.6,[[0,0,1,.1]],17)&&(__mlsv.mlLow(__dyb.GAME.car),__mlsv.mlLow(__dyb.GAME.car),__dyb.setTestInput({steer:.3,thr:.8,brk:0,hb:0,nos:false}),[...Array(480)].forEach(()=>__dyb.step(1/120)),Object.assign(MLS2.state(),{mode:__mlsv.mlMode(__dyb.GAME.car)}))"),
        ('the Heron, its take-off run', "MLS2.run('crawler',-34,668,-1.571,[[0,0,1,.1]],18)&&(__mlv.mlvSwap(),__seed(19),(()=>{try{__rt2.RTI.lev=1;}catch(e){}})(),__dyb.setTestInput({steer:0,thr:1,brk:0,hb:0,nos:false}),[...Array(1200)].forEach(()=>__dyb.step(1/120)),Object.assign(MLS2.state(),{plane:!!__dyb.GAME.car.rt}))")]
async def one(p, src):
    br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
    out = []; errs = []
    for name, js in RUNS:
        ctx = await br.new_context(viewport={'width': 360, 'height': 170}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); await pg.add_init_script(SEED)
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('file://' + os.path.abspath(src))
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(90):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 8: break
        await pg.evaluate("()=>{__game.GAME.hold=true;}")
        # (the land still on its way from the background worker has to have landed: the height a vehicle is set down at
        # comes from the land as it's drawn where that has arrived, from the generator where it hasn't)
        for i in range(60):
            await asyncio.sleep(.5)
            if await pg.evaluate("()=>__game.WORLD.inflight===0&&__game.WORLD.inbox.length===0&&__game.WORLD.pend.size===0") and i > 3: break
        await asyncio.sleep(1); await pg.evaluate(HELP)
        try: out.append((name, await pg.evaluate('()=>' + js)))
        except Exception as e: out.append((name, {'FAILED': str(e)[:300]}))
        await ctx.close()
    await br.close(); return out, errs
async def main():
    async with async_playwright() as p:
        a, ea = await one(p, sys.argv[1]); b, eb = await one(p, sys.argv[2]); same = 0
        for (n, x), (_, y) in zip(a, b):
            if json.dumps(x, sort_keys=True) == json.dumps(y, sort_keys=True):
                same += 1; print(f'SAME   {n}: {x.get("mph")} mph at {x.get("p")}, ruts {x.get("deepestCm")} cm, dug {x.get("dugLitres")} l, {x.get("clods")} clods')
            else:
                print(f'DIFFERENT   {n}')
                for k in sorted(set(x) | set(y)):
                    if json.dumps(x.get(k)) != json.dumps(y.get(k)): print('    ', k, ':', json.dumps(x.get(k)), ' / ', json.dumps(y.get(k)))
        print(f'{same} of {len(a)} drives the same.  page errors: {ea[:2] or "none"} / {eb[:2] or "none"}')
asyncio.run(main())
