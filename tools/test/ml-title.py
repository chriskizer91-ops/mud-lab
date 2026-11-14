"""(Mud Lab 20) THE TITLE, AS A PICTURE: does it fit? python3 tools/test/ml-title.py BUILD OUT.png [m|l]
m: a phone held sideways (915 x 412, touch; the default); l: a laptop window (1280 x 720). Prints where START is on the
page and whether all of it is on the screen."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
async def main():
    src, out = sys.argv[1], sys.argv[2]; phone = (sys.argv[3] if len(sys.argv) > 3 else 'm') == 'm'
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if phone else {'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=phone, is_mobile=phone)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('file://' + os.path.abspath(src))
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state==='menu'&&!!document.querySelector('#mlGo')}catch(e){return false}}") and i > 4: break
        await asyncio.sleep(2); await pg.screenshot(path=out, timeout=120000)
        r = await pg.evaluate("()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)];};const g=q('#mlGo');return {screen:[innerWidth,innerHeight],start:g,startAllOnScreen:!!g&&g[0]>=0&&g[1]>=0&&g[2]<=innerWidth&&g[3]<=innerHeight,scrolls:document.documentElement.scrollHeight>innerHeight+1};}")
        print(json.dumps(r)); print('errors', errs[:2]); await br.close()
asyncio.run(main())
