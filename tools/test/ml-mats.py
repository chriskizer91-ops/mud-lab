"""Which materials does Mud Lab ever draw?  python3 tools/test/ml-mats.py builds/mud-lab-8.html [m|l]
The land's shader has a branch for every material number a mesh can carry (0-31 the cars' own parts, 40 the ground,
46 trunks, 48 leaves, 50 water, 70-108 the Studio 2 car in the bay, 120 the baked truck and the Heron...). Mud Lab 8
took out the branches for materials Mud Lab never makes a mesh with (src/build.py); this lists what IS made, so the
next change can check it hasn't started using one that's gone (a mesh with a missing material is drawn in its plain
colour, not broken).
How: a copy of the build in /tmp with one line added where every mesh goes up to the graphics card, noting its
material numbers; then the bay with each SUV, a drive to every place and corner of the world looking all four ways,
the stock SUV, the Heron on the ground and in the air, and the three times of day."""
import asyncio, json, sys, os, tempfile
from playwright.async_api import async_playwright
SRC, MOBILE = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else 'm') == 'm'
s = open(SRC, encoding='utf-8').read(); a = "function meshUpload(m,d){\n"; assert s.count(a) == 1
s = s.replace(a, a + "  {const X=window.__mats=window.__mats||{};if(d.mat){const seen={};for(let i=0;i<d.mat.length;i++){const k=Math.round(d.mat[i]);if(!seen[k]){seen[k]=1;X[k]=(X[k]||0)+1;}}}}\n")
TMP = os.path.join(tempfile.mkdtemp(), 'mats.html'); open(TMP, 'w', encoding='utf-8').write(s)
PLACES = [(0, 630), (-172, 556), (450, 516), (232, 104), (-340, 300), (380, -110), (-470, -300), (220, -640), (62, -482), (-24, 150), (282, -48), (150, 340), (400, -560), (-540, -400), (600, 80),
          (250, 690), (-700, -700), (700, 700), (-700, 700), (700, -700), (0, 0), (0, -740), (740, 0), (-740, 0), (0, 740)]
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 360, 'height': 170} if MOBILE else {'width': 420, 'height': 240}, device_scale_factor=1, has_touch=MOBILE)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('file://' + TMP)
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlOut').click()"); await asyncio.sleep(6)
        await pg.evaluate("()=>__mlsv.mlSuvSet('stock')"); await asyncio.sleep(8)
        await pg.evaluate("()=>__mlsv.mlSuvSet('crawler')"); await asyncio.sleep(3)
        await pg.evaluate("()=>document.getElementById('sasDrive').click()")
        for i in range(60):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
            if r['st'] == 'drive' and r['ml'] and i > 6: break
        for (u, v) in PLACES:
            for yaw in (0, 1.57, 3.14, -1.57):
                await pg.evaluate(f"()=>{{const A=__dyb.WG.mlA;__dyb.placeCar(A.x+{u},A.z+{v},{yaw});}}"); await asyncio.sleep(1.2)
        await pg.evaluate("()=>__mlsv.mlSuvSet('stock')"); await asyncio.sleep(4)
        await pg.evaluate("()=>{const A=__dyb.WG.mlA;__dyb.placeCar(A.x-20,A.z+676,.5);}"); await asyncio.sleep(3)
        await pg.evaluate("()=>__rt2.rtFly(true)"); await asyncio.sleep(4)
        await pg.evaluate("()=>{__dyb.GAME.car.p[1]+=200;}"); await asyncio.sleep(4)
        for tod in ('golden', 'night', 'day'):
            await pg.evaluate(f"()=>__dyb.applyTod('{tod}')"); await asyncio.sleep(2)
        m = await pg.evaluate("()=>window.__mats")
        print('tier:', await pg.evaluate("()=>__game.GFX.level"), ' materials made (number: meshes):')
        print(json.dumps({int(k): v for k, v in sorted(m.items(), key=lambda kv: int(kv[0]))}))
        gone = [41, 42, 43, 44, 45, 47, 49, 52, 53, 54, 55, 56, 57, 58, 60, 61]
        bad = [k for k in gone if str(k) in m]
        print('materials whose branch Mud Lab 8 took out, now in use:', bad or 'none'); print('page errors:', errs[:3] or 'none')
        await br.close()
asyncio.run(main())
