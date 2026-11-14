"""(Mud Lab 17) the map's MENU: TUNE and CLEAR ALL RUTS, in a laptop window (1280 x 720, no touch, the game's own loop
running) with real mouse clicks and key presses, then on a phone-size touch screen.
python3 tools/test/ml-tune.py BUILD OUTDIR"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
CAR = "()=>{const t=__game.GAME.car,e=t.pt.e,S=__mlsv;return {kind:t.build.kit||t.build.id,tune:S.mlTuneOf(t.build.kit||t.build.id).name,hp:Math.round(e.peak.hp),axle:e.fd,gears:e.gears.length,low:t.c.diff.lowK,at:[+t.p[0].toFixed(1),+t.p[2].toFixed(1)],mph:+(t.speed*2.237).toFixed(1),map:__game.APP.bigMap,saved:[localStorage.getItem('mudlab:tune:crawler'),localStorage.getItem('mudlab:tune:stock')]}}"
RUTS = "()=>{const s=__ml.mlStats();return {deepestCm:s.deepestCm,churnedM2:s.churnedM2,pressedM2:s.pressedM2,squares:s.squares}}"
ROWS = "()=>[...document.querySelectorAll('#mlMenuP button')].map(b=>b.textContent)"
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
async def menu(pg):
    if not await pg.evaluate("()=>__game.APP.bigMap"):
        await pg.keyboard.press(await pg.evaluate('()=>__mlk.KEYS.map[0]'))
        for i in range(90):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>__game.APP.bigMap"): break
        await asyncio.sleep(4)
    # (the MENU button and its list are shown and filled in from the game's own frame, and the test browser draws one
    # every ten seconds or so: wait for the button, click it, wait for the list)
    for i in range(120):
        if await pg.evaluate("()=>{const b=document.querySelector('#mlMenu');return !!b&&!b.hidden}"): break
        await asyncio.sleep(1)
    if not await pg.evaluate("()=>__mlm.MLM.open"): await click(pg, '#mlMenu')
    for i in range(120):
        if await pg.evaluate("()=>{const p=document.querySelector('#mlMenuP');return !!p&&!p.hidden&&p.querySelectorAll('button').length>0}"): break
        await asyncio.sleep(1)
async def shot(pg, path):
    try: await pg.screenshot(path=path, timeout=120000)
    except Exception as e: print(' no picture', flush=True)
async def main():
    src, out = sys.argv[1], sys.argv[2].rstrip('/') + '/'; os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=False)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:500]))
        await boot(pg, src); print('start       ', json.dumps(await pg.evaluate(CAR)), flush=True)
        # 1. the MENU's rows, the TUNE page
        await menu(pg); print('menu rows   ', await pg.evaluate(ROWS), flush=True); await shot(pg, out + 'menu.png')
        await click(pg, '#mlMenuP button[data-k=tune]'); print('tune rows   ', await pg.evaluate(ROWS), flush=True); await shot(pg, out + 'tune-list.png')
        # 2. each of this SUV's tunes in turn, ending on the first that isn't as it came
        kind = (await pg.evaluate(CAR))['kind']; ids = await pg.evaluate("(k)=>__mlsv.ML_TUNE[k].map(q=>q.id)", kind)
        for i in ids[1:] + ids[:2]:
            await menu(pg)
            if await pg.evaluate("()=>__mlm.MLM.page!=='tune'"): await click(pg, '#mlMenuP button[data-k=tune]')
            await click(pg, '#mlMenuP button[data-k="tn:%s"]' % i); await asyncio.sleep(8)
            print('picked %-6s' % (i or 'first'), json.dumps(await pg.evaluate(CAR)), 'said:', await pg.evaluate("()=>(__game.GAME.msgs||[]).map(m=>m.text||m.t||'').slice(-1)"), flush=True)
        await menu(pg); print('menu now    ', [r for r in await pg.evaluate(ROWS) if r.startswith('TUNE')], flush=True)
        # 3. while rolling: refused (the test browser draws a frame every ten seconds or so, too slow to drive in: the
        #    SUV is given its speed by hand, the click is the real thing)
        await menu(pg); await click(pg, '#mlMenuP button[data-k=tune]'); await pg.evaluate("()=>{const t=__game.GAME.car;t.v[0]=6;t.speed=6;}")
        await pg.evaluate("()=>{const t=__game.GAME.car;t.v[0]=6;t.speed=6;document.querySelector('#mlMenuP button[data-k=\"tn:\"]').click();}"); await asyncio.sleep(1); r1 = await pg.evaluate(CAR)
        print('rolling     ', json.dumps({'tune after': r1['tune'], 'map': r1['map']}), 'said:', await pg.evaluate("()=>(__game.GAME.msgs||[]).map(m=>m.text||m.t||'').slice(-1)"), flush=True)
        await pg.evaluate("()=>{const t=__game.GAME.car;t.v[0]=0;t.v[2]=0;}"); await asyncio.sleep(4)
        # 4. ruts, and CLEAR ALL RUTS (the drive is stepped by hand with the game's loop held, as the picture tool does;
        #    the click is real, and the numbers are read in the same breath, before the standing tyres press new marks)
        await pg.evaluate("()=>{const D=__dyb;__game.GAME.hold=true;D.setTestInput({steer:0,thr:1,brk:0,hb:0,nos:false});for(let i=0;i<360;i++)D.step(1/120);D.setTestInput({steer:0,thr:0,brk:1,hb:0,nos:false});for(let i=0;i<240;i++)D.step(1/120);D.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});}")
        a = await pg.evaluate(RUTS); await pg.evaluate("()=>{__game.GAME.hold=false;}"); await menu(pg)
        for i in range(120):
            if await pg.evaluate("()=>!!document.querySelector('#mlMenuP button[data-k=rake]')"): break
            await asyncio.sleep(1)
        b = await pg.evaluate("()=>{document.querySelector('#mlMenuP button[data-k=rake]').click();const s=__ml.mlStats();return {deepestCm:s.deepestCm,churnedM2:s.churnedM2,pressedM2:s.pressedM2,squares:s.squares,map:__game.APP.bigMap}}")
        print('ruts before ', json.dumps(a), 'after', json.dumps(b), 'said:', await pg.evaluate("()=>(__game.GAME.msgs||[]).map(m=>m.text||m.t||'').slice(-1)"), flush=True)
        # 5. over a reload: the tune picked last (not the one it came with) is still on
        await boot(pg, src); print('reloaded    ', json.dumps(await pg.evaluate(CAR)), flush=True)
        await menu(pg); await click(pg, '#mlMenuP button[data-k=tune]'); await click(pg, '#mlMenuP button[data-k="tn:"]'); await asyncio.sleep(8); print('as it came  ', json.dumps(await pg.evaluate(CAR)), flush=True)
        # 6. a phone (touch): the same rows, and the tune list on its screen
        ctx2 = await br.new_context(viewport={'width': 915, 'height': 412}, device_scale_factor=1, has_touch=True, is_mobile=True)
        pg2 = await ctx2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)[:500])); await boot(pg2, src)
        await pg2.evaluate("()=>{__game.APP.bigMap=true;}"); await asyncio.sleep(6); await pg2.evaluate("()=>document.querySelector('#mlMenu').click()"); await asyncio.sleep(4)
        print('phone rows  ', await pg2.evaluate(ROWS), flush=True); await shot(pg2, out + 'phone-menu.png')
        await pg2.evaluate("()=>document.querySelector('#mlMenuP button[data-k=tune]').click()"); await asyncio.sleep(5); print('phone tune  ', await pg2.evaluate(ROWS), flush=True); await shot(pg2, out + 'phone-tune.png')
        print('errors', errs[:3]); await br.close()
asyncio.run(main())
