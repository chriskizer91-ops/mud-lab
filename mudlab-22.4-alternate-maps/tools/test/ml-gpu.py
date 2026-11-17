"""(Mud Lab 18) the graphics card's piece (src/ml-gpu.js), end to end in the test browser: the card's line on the title;
then a drive on High with the page told it is NOT a test browser (the piece leaves test browsers alone, where every
frame is slow): the software graphics here can't hold three frames a second on High, so the page should say so, go
back to Low by itself, and say what happened on the next title.
python3 tools/test/ml-gpu.py BUILD OUTDIR
This is the only way to see the step-down work short of a real card that is struggling. It is not that."""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
async def main():
    src, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'; os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--disable-blink-features=AutomationControlled'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=False)
        pg = await ctx.new_page(); errs = []
        await pg.add_init_script("try{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});}catch(e){}")
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        async def title():
            for i in range(300):
                await asyncio.sleep(1)
                if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
            await asyncio.sleep(3)
            return await pg.evaluate("()=>({webdriver:navigator.webdriver,level:__game.GFX.level,line:(document.getElementById('mlGpu')||{}).innerText||'(no line)'})")
        await pg.goto('file://' + os.path.abspath(src))
        print('title       ', json.dumps(await title()), flush=True)
        try: await pg.screenshot(path=out + 'gpu-title.png', timeout=120000)
        except Exception: print(' no picture')
        await pg.evaluate("()=>document.querySelector('#mlGo').click()"); t0 = time.time(); said = None
        # out driving: wait for the line, then for the page to start again on Low
        for i in range(600):
            await asyncio.sleep(1)
            try: r = await pg.evaluate("()=>{const L=document.getElementById('loading');return {st:__dyb.GAME.state,level:__game.GFX.level,L:L&&!L.hidden?L.textContent:''}}")
            except Exception: continue
            if r['L'] and 'keep up' in r['L'] and not said:
                said = r['L']; print('said         %r after %d s of driving on %s' % (said, time.time() - t0, r['level']), flush=True)
                try: await pg.screenshot(path=out + 'gpu-stepdown.png', timeout=20000)
                except Exception: pass
            if said and r['level'] == 'low' and r['st'] == 'menu': break
        r = await title(); print('next title  ', json.dumps(r), flush=True)
        try: await pg.screenshot(path=out + 'gpu-title-after.png', timeout=120000)
        except Exception: print(' no picture')
        print('errors', errs[:3]); await br.close()
asyncio.run(main())
