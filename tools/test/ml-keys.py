"""(Mud Lab 16) the keyboard's keys, in a laptop window (1280 x 720, no touch, the game's own loop running), with real
key presses and mouse clicks: the look-behind key no longer changes the grip; the grip's own key does; MENU > KEYS on
the map changes a key (taking it from the row that had it), keeps it over a reload, and RESET puts everything back.
python3 tools/test/ml-keys.py BUILD OUTDIR"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
ST = "()=>({terra:__ml.MLS.terra,rear:!!__game.CAM.rear,map:__game.APP.bigMap,grip:__mlk.KEYS.grip,rearK:__mlk.KEYS.rear,hook:__mlk.KEYS.hook,cap:__mlk.MLKB.cap,note:__mlk.MLKB.note,ls:localStorage.getItem('mudlab:keys')})"
async def boot(pg, src):
    await pg.goto('file://' + os.path.abspath(src))
    for i in range(300):
        await asyncio.sleep(1)
        if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
    await pg.evaluate("()=>document.querySelector('#mlGo').click()")
    for i in range(240):
        await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
        if r['st'] == 'drive' and r['ml'] and i > 8: break
    await asyncio.sleep(15)
async def click(pg, sel):
    q = await pg.evaluate("(s)=>{const b=document.querySelector(s);if(!b)return null;b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}", sel)
    if not q: print('  no', sel, flush=True); return False
    await pg.mouse.click(q[0], q[1]); await asyncio.sleep(3); return True
async def openmap(pg):
    if not await pg.evaluate("()=>__game.APP.bigMap"):
        await pg.keyboard.press(await pg.evaluate('()=>__mlk.KEYS.map[0]'))
        for i in range(90):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>__game.APP.bigMap"): break
        await asyncio.sleep(4)
async def main():
    src, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'; os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=False)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:500]))
        await boot(pg, src); print('start      ', json.dumps(await pg.evaluate(ST)), flush=True)
        # 1. hold the look-behind key: the camera looks back, the grip stays
        await pg.keyboard.down('KeyG'); await asyncio.sleep(6); a = await pg.evaluate(ST); await pg.keyboard.up('KeyG'); await asyncio.sleep(4); b = await pg.evaluate(ST)
        print('G held     ', json.dumps({'rear': a['rear'], 'terra': a['terra']}), 'released', json.dumps({'rear': b['rear'], 'terra': b['terra']}), flush=True)
        # 2. the grip's own key
        if 'grip' in a and a['grip']:
            await pg.keyboard.press(a['grip'][0]); await asyncio.sleep(3); c = await pg.evaluate(ST); await pg.keyboard.press(a['grip'][0]); await asyncio.sleep(3); d = await pg.evaluate(ST)
            print('grip key   ', a['grip'][0], 'once:', c['terra'], 'twice:', d['terra'], flush=True)
        # 3. the map's MENU > KEYS: give the grip the G key
        await openmap(pg); await click(pg, '#mlMenu'); print('menu rows  ', await pg.evaluate("()=>[...document.querySelectorAll('#mlMenuP button')].map(b=>b.textContent)"), flush=True)
        await click(pg, '#mlMenuP button[data-k=keys]'); rows = await pg.evaluate("()=>[...document.querySelectorAll('#mlMenuP button')].map(b=>b.textContent)"); print('keys rows  ', len(rows), rows, flush=True)
        try: await pg.screenshot(path=out + 'keys-list.png', timeout=120000)
        except Exception as e: print(' no picture', flush=True)
        await click(pg, '#mlMenuP button[data-k="key:grip"]'); e1 = await pg.evaluate(ST); print('waiting    ', json.dumps({'cap': e1['cap'], 'map': e1['map']}), await pg.evaluate("()=>document.querySelector('#mlMenuP button[data-k=\"key:grip\"]').textContent"), flush=True)
        try: await pg.screenshot(path=out + 'keys-wait.png', timeout=120000)
        except Exception as e: print(' no picture', flush=True)
        await pg.keyboard.press('KeyG'); await asyncio.sleep(3); e2 = await pg.evaluate(ST); print('pressed G  ', json.dumps(e2), flush=True)
        # (a key pressed while a row waits is the list's alone: M must not close the map)
        await click(pg, '#mlMenuP button[data-k="key:hook"]'); await pg.keyboard.press('KeyM'); await asyncio.sleep(3); e3 = await pg.evaluate(ST); print('hook to M  ', json.dumps({'hook': e3['hook'], 'map': e3['map'], 'note': e3['note']}), flush=True)
        await click(pg, '#mlMenuP button[data-k="key:hook"]'); await pg.keyboard.press('Escape'); await asyncio.sleep(3); e4 = await pg.evaluate(ST); print('esc        ', json.dumps({'hook': e4['hook'], 'map': e4['map'], 'note': e4['note'], 'state': await pg.evaluate('()=>__game.GAME.state')}), flush=True)
        await click(pg, '#mlMenuP button[data-k="key:hook"]'); await pg.keyboard.press('Digit5'); await asyncio.sleep(3); e5 = await pg.evaluate(ST); print('hook to 5  ', json.dumps({'hook': e5['hook'], 'note': e5['note']}), flush=True)
        try: await pg.screenshot(path=out + 'keys-after.png', timeout=120000)
        except Exception as e: print(' no picture', flush=True)
        # 4. over a reload
        await boot(pg, src); f = await pg.evaluate(ST); print('reloaded   ', json.dumps(f), flush=True)
        await pg.keyboard.press('KeyG'); await asyncio.sleep(3); g = await pg.evaluate(ST); print('G now      ', json.dumps({'terra': g['terra'], 'rear': g['rear']}), 'legend:', (await pg.evaluate("()=>document.querySelector('p.keys').textContent"))[:260], flush=True)
        # 5. reset
        await openmap(pg); await click(pg, '#mlMenu'); await click(pg, '#mlMenuP button[data-k=keys]'); await click(pg, '#mlMenuP button[data-k=kreset]'); h = await pg.evaluate(ST); print('reset      ', json.dumps(h), flush=True)
        # 6. a phone (touch, no keyboard): the MENU has no KEYS row
        ctx2 = await br.new_context(viewport={'width': 915, 'height': 412}, device_scale_factor=1, has_touch=True, is_mobile=True)
        pg2 = await ctx2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)[:500])); await boot(pg2, src)
        await pg2.evaluate("()=>{__game.APP.bigMap=true;}"); await asyncio.sleep(6); await pg2.evaluate("()=>document.querySelector('#mlMenu').click()"); await asyncio.sleep(4)
        print('phone rows ', await pg2.evaluate("()=>[...document.querySelectorAll('#mlMenuP button')].map(b=>b.textContent)"), 'touch', await pg2.evaluate("()=>!!__game.GAME.touch"), flush=True)
        print('errors', errs[:3]); await br.close()
asyncio.run(main())
