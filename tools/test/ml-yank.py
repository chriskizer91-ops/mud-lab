"""(Mud Lab 19) THE SKY-YANK IS STILL THERE. Christopher, 13 Nov 2026: with the pull test's line still on the post, get in
the other SUV and "it yanks it across the sky super fast, and it's outrageously fun, and I love it. It might technically be
a bug, but it's a bug that's staying." This opens a build, hooks the Rock & Mud to the post, stands the stock SUV 60 m
away, gets in it (tools/test/ml-drive.js T9.yank) and says how fast and how high it went.
python3 tools/test/ml-yank.py BUILD        exit code 1 if it did not fly (under 60 mph, thrown
less than 30 m, or off the ground for less than a second)"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
SEED = "(()=>{let s=1;window.__seed=v=>{s=v>>>0;};Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();"
async def main():
    src = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 360, 'height': 170}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); await pg.add_init_script(SEED); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:400]))
        await pg.goto('file://' + os.path.abspath(src))
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(120):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 8: break
        await pg.evaluate("()=>{__game.GAME.hold=true;}")
        for i in range(60):
            await asyncio.sleep(.5)
            if await pg.evaluate("()=>__game.WORLD.inflight===0&&__game.WORLD.inbox.length===0&&__game.WORLD.pend.size===0") and i > 3: break
        await asyncio.sleep(1); await pg.evaluate(open(os.path.join(here, 'ml-drive.js'), encoding='utf-8').read())
        r = await pg.evaluate("()=>T9.yank(60)"); print(json.dumps(r)); await br.close()
        flew = r.get('gotInTheOther') and r.get('lineStillOn') and r.get('fastestMph', 0) >= 60 and r.get('flewM', 0) >= 30 and r.get('secsOffTheGround', 0) >= 1
        print('THE SKY-YANK: ' + ('still there: %d mph at its fastest, thrown %.0f m, %.1f s off the ground' % (r['fastestMph'], r['flewM'], r['secsOffTheGround']) if flew else 'GONE. Put it back: src/ml-recover.js mlrSeat must not unhook MLR.pull'))
        if errs: print('PAGE ERRORS', errs[:3])
        sys.exit(0 if flew else 1)
asyncio.run(main())
