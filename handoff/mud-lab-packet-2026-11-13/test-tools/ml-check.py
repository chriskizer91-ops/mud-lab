"""Open a Mud Lab page in the test browser and check the packet's three pieces: the card's line on the title, the Film
camera in the list and picked on a drive, the softer fly-past's pitch against the old one. (The Heron's HUD: ml-heron.py.) usage: python3 ml-check.py <page.html> <shots dir> <tag>"""
import asyncio, json, sys, os, time
from playwright.async_api import async_playwright
URL, SH, TAG = 'file://' + os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3]
async def main():
    os.makedirs(SH, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:200]) if m.type in ('error', 'warning') and 'ReadPixels' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:300]))
        t0 = time.time(); await pg.goto(URL)
        for i in range(400):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 6: break
        print('opened in', round(time.time() - t0), 's', flush=True)
        await asyncio.sleep(2)
        async def js(x, cut=420):
            try: r = await pg.evaluate('async()=>{const r=await (' + x + ');return r===undefined?null:r}'); print('  ', json.dumps(r)[:cut], flush=True); return r
            except Exception as e: print('   FAIL', str(e)[:200].replace('\n', ' '), flush=True)
        await js("({cardLine:(document.getElementById('mlGpu')||{}).innerText||'MISSING', cams:__dyb.CAMS.length, film:__dyb.CAMS.indexOf('Film'), camList:__dyb.CAMS.join(','), FILM:typeof __dyb.FILM, flyPast:{towardsAt67mph:[+__dyb.flyPitch(30,20).toFixed(3),'was',+(343/(343-30)).toFixed(3)],awayAt67mph:[+__dyb.flyPitch(-30,20).toFixed(3),'was',+(343/(343+30)).toFixed(3)]}})", 700)
        await pg.screenshot(path=os.path.join(SH, TAG + '_title.png'), timeout=120000)
        await js("(document.getElementById('mlGo').click(), 1)")
        for i in range(240):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>__dyb.GAME.state==='drive'"): break
        await asyncio.sleep(8)
        await js("(()=>{const i=__dyb.CAMS.indexOf('Film');try{__dyb.camPick(i)}catch(e){return 'camPick: '+e.message};return {picked:i}})()")
        await js("(__dyb.setTestInput({steer:0,thr:1,brk:0,hb:0,nos:false}),(()=>{for(let i=0;i<480;i++)__dyb.step(1/120);return {mph:Math.round(Math.hypot(...__dyb.GAME.car.v)*2.237)}})())")
        await asyncio.sleep(14)
        await js("({state:__dyb.GAME.state, filmShot:(__dyb.FILM&&(__dyb.FILM.cur||__dyb.FILM.shot||__dyb.FILM.name))||null, camMode:(()=>{try{return __dyb.camMode()}catch(e){return 'n/a'}})()})")
        await pg.screenshot(path=os.path.join(SH, TAG + '_film.png'), timeout=240000)
        print('page errors and warnings:', len(logs), logs[:5]); await br.close()
asyncio.run(main())
