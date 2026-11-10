"""Tuning and proving the mud holes and the recovery gear (Mud Lab 9). Opens a build, holds the game's own loop (physics
only: nothing is drawn, so it's quick), loads the test drivers (tools/test/ml-drive.js: window.T9) and runs one
expression per line of a text file, printing each result:
  python3 tools/test/ml-pits.py builds/mud-lab-9.html tools/test/ml-drive.js runs.txt
Lines for runs.txt (hole numbers are from T9.holes()):
  T9.c('stock',14,'cruise',{v:7,run:30,mode:'AWD'})   the stock SUV through hole 14 at a steady 7 m/s, in AWD
  T9.c('stock',14,'stop')                             in, stopped in the middle, then full throttle for 15 s
  T9.c('crawler',7,'mom',{run:10,thr:.5})             the Rock & Mud through pit 7 on half throttle from 10 m back
  T9.trail('stock',4,46,162,{v:9,mode:'4 HI'})        along a trail (4 = the Field Track) from point 46 to 162
  T9.tow('crawler',.4,6)   T9.winch('stock',62,330,1.4,0,12)   T9.scan(2,11,8)   T9.holeTrees()
Trial pits: a build made with extra holes in the open field north of the Field Track, to find a recipe before it goes
on a trail (never a numbered build):
  ML_PITS="ML_HOLES.push({u:110,v:480,L:4,W:4.6,r:1.5708,d:.3,c:.8,lv:null,pit:'E1'});" python3 src/build.py trial
The same drive can come out differently from one sitting to the next when a SUV is down to 1-3 mph in a pit: soft mud
multiplies small differences. Judge a recipe on several drives, not one."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
SEED = "(()=>{let s=1;window.__seed=v=>{s=v>>>0;};Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();"
async def main():
    src, helpers, exprs = sys.argv[1:4]
    w, h = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (360, 170)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); await pg.add_init_script(SEED); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:400]))
        await pg.goto('file://' + os.path.abspath(src))
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        pre = os.environ.get('PRE')
        if pre: await pg.evaluate('()=>{' + pre + '}')
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(90):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 8: break
        await pg.evaluate("()=>{__game.GAME.hold=true;}")
        for i in range(60):
            await asyncio.sleep(.5)
            if await pg.evaluate("()=>__game.WORLD.inflight===0&&__game.WORLD.inbox.length===0&&__game.WORLD.pend.size===0") and i > 3: break
        await asyncio.sleep(1); await pg.evaluate(open(helpers).read())
        for line in open(exprs):
            line = line.strip()
            if not line or line.startswith('#'): continue
            try: r = await pg.evaluate('()=>' + line)
            except Exception as e: r = {'FAILED': str(e)[:500]}
            print(json.dumps(r), flush=True)
        if errs: print('PAGE ERRORS', errs[:3])
        await br.close()
asyncio.run(main())
