"""How big are a build's shaders, and how many texture samplers do they use?
  python3 tools/test/ml-shaders.py builds/mud-lab-8.html [m|l]     (m the phone's tier, l the laptop's)
Two limits live here. The phone's fragment shader can use 16 texture samplers and landSoil uses all 16: one more and
it won't build on the phone (it will here: this browser allows 32). And Windows' shader compiler (Edge) takes long
over the land's shaders, by their size: the count below is the length of each as the browser hands it to the graphics
driver, the nearest thing to that size this machine can measure. Mud Lab 7: landSoil 683,160 on the phone's tier
(700,653 on the laptop's), land 598,866 (616,360). Mud Lab 8: about 500,000 and 390,000. Keep landSoil under Mud
Lab 7's. Also says whether landSoil built and took over from the plain ground, and any errors the page logged."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
URL, MOBILE = 'file://' + os.path.abspath(sys.argv[1]), (sys.argv[2] if len(sys.argv) > 2 else 'm') == 'm'
JS = """()=>{const G=__game.R.G,gl=__game.gl,dbg=gl.getExtension('WEBGL_debug_shaders');
 return G.programs.map(P=>({name:P.name,built:P.ready,defines:Object.keys(P.defs||{}).join(' '),source:P.srcF.length,size:dbg?(dbg.getTranslatedShaderSource(P.fs)||'').length:-1,
   samplers:P.ready?Object.keys(P.samplers).length:-1}));}"""
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 360, 'height': 170} if MOBILE else {'width': 420, 'height': 240}, device_scale_factor=1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:1500]) if m.type in ('error', 'warning') and 'ReadPixels' not in m.text else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:600]))
        await pg.goto(URL)
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(90):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready,land:__ml.land()})")
            if r['st'] == 'drive' and r['ml'] and (r['land']['cur'] == 'landSoil' or r['land']['no']) and i > 6: break
        print('tier:', await pg.evaluate("()=>__game.GFX.level"), '  the ground is drawn with:', r['land']['cur'], '(landSoil built and took over)' if r['land']['cur'] == 'landSoil' else '(landSoil did NOT take over)')
        for x in await pg.evaluate(JS):
            if x['name'].startswith('land') or x['name'] == 'final':
                print(f"  {x['name']:10s} size {x['size']:7d}   samplers {x['samplers']:2d}{'  <- over the phone limit of 16' if x['samplers'] > 16 else ''}   source {x['source']:6d}   {x['defines']}")
        print('errors and warnings:', logs[:6] or 'none')
        await br.close()
asyncio.run(main())
