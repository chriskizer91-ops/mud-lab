"""A laptop window (1280 x 720, no touch, the game's own loop running): pick the stock SUV on the title, start, then
switch SUVs back and forth with the map's own button, clicked as a mouse would. python3 lap.py BUILD OUTDIR"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    src, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=False)
        pg = await ctx.new_page(); errs = []
        if os.environ.get('LS'): await pg.add_init_script("try{" + ''.join("localStorage.setItem('%s','%s');" % tuple(kv.split('=')) for kv in os.environ['LS'].split(',')) + "}catch(e){}")
        pg.on('pageerror', lambda e: errs.append(str(e)[:500]))
        await pg.goto('file://' + os.path.abspath(src))
        for i in range(300):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        KIND = "()=>{const G=__dyb.GAME,M=__mlr.MLR,k=v=>v?(v.build.kit||v.build.id)+' (bi '+v.bi+')':'none';return 'in '+k(G.car)+', other '+k(M.other)+', pick '+__mlsv.MLSV.pick+', state '+G.state+', map '+__game.APP.bigMap+', msgs '+JSON.stringify(G.msgs.map(m=>m.t))+', tier '+(__game.APP.tier||__game.APP.q||'?')}"
        for k in ('stock', 'crawler', 'stock'):
            await pg.click('#mlPick [data-k=%s]' % k); await asyncio.sleep(2); print('title pick', k, '->', await pg.evaluate(KIND), flush=True)
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(240):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 8: break
        await asyncio.sleep(20); print('started:', await pg.evaluate(KIND), flush=True)
        BTN = sys.argv[3] if len(sys.argv) > 3 else '#mlSuv'
        for n in range(4):
            await pg.keyboard.press('KeyM')
            for i in range(90):
                await asyncio.sleep(1)
                if await pg.evaluate("()=>__game.APP.bigMap"): break
            await asyncio.sleep(6)
            if BTN == 'menu':
                q = await pg.evaluate("()=>{const r=document.querySelector('#mlMenu').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}"); await pg.mouse.click(q[0], q[1]); await asyncio.sleep(8)
                info = await pg.evaluate("()=>[...document.querySelectorAll('#mlMenuP button')].map(b=>b.textContent)"); print(' menu rows:', info, flush=True)
                sel = '#mlMenuP button[data-k=seat]'
            else: sel = BTN
            info = await pg.evaluate("(s)=>{const b=document.querySelector(s);if(!b)return 'no button';const q=b.getBoundingClientRect(),e=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);return {text:b.textContent,hidden:b.hidden,rect:[Math.round(q.left),Math.round(q.top),Math.round(q.width),Math.round(q.height)],top:e?(e.id||e.tagName):null,shown:[...document.querySelectorAll('button')].filter(x=>!x.hidden&&x.offsetParent!==null&&x.getBoundingClientRect().width>0).map(x=>x.id||x.textContent).slice(0,30)};}", sel)
            print('switch %d: map open %s, button %s' % (n + 1, await pg.evaluate("()=>__game.APP.bigMap"), json.dumps(info)), flush=True)
            if n == 0:
                try: await pg.screenshot(path=out + 'lap-map.png', timeout=90000)
                except Exception as e: print(' no picture', flush=True)
            if isinstance(info, dict): await pg.mouse.click(info['rect'][0] + info['rect'][2] / 2, info['rect'][1] + info['rect'][3] / 2)
            await asyncio.sleep(12); print(' after the click:', await pg.evaluate(KIND), flush=True)
            if await pg.evaluate("()=>__game.APP.bigMap"):
                await pg.keyboard.press('KeyM'); await asyncio.sleep(8)
            pass
        print('errors', errs[:3]); await br.close()
asyncio.run(main())
