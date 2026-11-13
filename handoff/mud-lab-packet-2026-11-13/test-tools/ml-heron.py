"""The Heron's HUD in a Mud Lab page: the truck set down by the plane (where ml-same.py's take-off drive starts), into the
plane, a picture. usage: python3 ml-heron.py <page.html> <shots dir> <tag>"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
URL, SH, TAG = 'file://' + os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]
async def main():
    os.makedirs(SH, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
        pg = await ctx.new_page(); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:300]))
        await pg.goto(URL)
        for i in range(400):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 6: break
        await pg.evaluate("()=>document.getElementById('mlGo').click()")
        for i in range(240):
            await asyncio.sleep(1)
            r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 8: break
        await asyncio.sleep(4)
        r = await pg.evaluate("""()=>{const D=__dyb,A=D.WG.mlA;__game.GAME.hold=true;D.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});
          __game.spawnCar(__mlsv.MLSV.bi['crawler'],A.x-34,A.z+668,-1.571);__mlsv.MLSV.pick='crawler';for(let i=0;i<480;i++)D.step(1/120);
          const ok=__mlv.mlvSwap();D.setTestInput({steer:0,thr:1,brk:0,hb:0,nos:false});for(let i=0;i<360;i++)D.step(1/120);__game.GAME.hold=false;
          return {swapped:ok,plane:!!D.GAME.car.rt,mph:Math.round(Math.hypot(...D.GAME.car.v)*2.237)}}""")
        print(TAG, json.dumps(r), flush=True)
        await asyncio.sleep(6)
        await pg.screenshot(path=os.path.join(SH, TAG + '_heron.png'), timeout=240000)
        print(TAG, 'page errors:', logs[:3] or 'none'); await br.close()
asyncio.run(main())
