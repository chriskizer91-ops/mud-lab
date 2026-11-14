"""(Mud Lab 19) HOW LONG THE WORLD'S GROUND LAYER TAKES TO FILL, and whether it comes out the same every way it can be filled.
The layer (the ground every 2.56 m: height, water, moisture, soils) is made while the title is up: by background workers
from the top and the page's own thread from the bottom (src/ml-soil.js mlPrepStep).
python3 tools/test/ml-prep.py BUILD [noworker] [rush] [shots=DIR]
  noworker  the page's own thread does it all (address ends #noworker)
  rush      press START the moment the title is up, layer finished or not
  shots=DIR at a phone's size, with pictures: DIR/prep-1.png a moment after START, DIR/prep-2.png once the soil is in
Prints one line: when the title came up, when the layer was full, when the soil was ready (seconds from the page's start),
who made how many bands, and a fingerprint of every array in the layer: the same build and world must give the same
fingerprint whichever way it was filled. The test browser is slow (software graphics, 2 cores): compare builds, not clocks."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
WATCH = """(()=>{const T=window.__T={};setInterval(()=>{try{const g=window.__dyb&&__dyb.GAME,m=window.__ml&&__ml.MLS,n=performance.now();
if(g&&g.state==='menu'&&!T.menu)T.menu=n;if(m&&m.cB&&!T.begun)T.begun=n;if(m&&m.prep>=2&&!T.full)T.full=n;if(m&&m.ready&&!T.ready)T.ready=n;}catch(e){}},50);})();"""
PRINT = """()=>{const M=__ml.MLS,o={};const f=a=>{if(!a)return null;const b=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let h=2166136261;for(let i=0;i<b.length;i++){h^=b[i];h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
for(const k of ['cB','cW','cMo','cM','cG','cWd','cTr','S0','S1'])o[k]=f(M[k]);return o;}"""
async def main():
    src = sys.argv[1]; opts = sys.argv[2:]; nw = 'noworker' in opts; rush = 'rush' in opts
    shots = next((o[6:] for o in opts if o.startswith('shots=')), None)
    if shots: os.makedirs(shots, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if shots else {'width': 360, 'height': 170}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); await pg.add_init_script(WATCH); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:400]))
        await pg.goto('file://' + os.path.abspath(src) + ('#noworker' if nw else ''))
        for i in range(400):
            await asyncio.sleep(.25)
            if await pg.evaluate("()=>!!(window.__T&&__T.menu)"): break
        before = None
        if not rush:
            for i in range(1200):
                await asyncio.sleep(.25)
                if await pg.evaluate("()=>!!__T.full"): break
            before = await pg.evaluate(PRINT)
        at = await pg.evaluate("()=>{const n=performance.now(),m=__ml.MLS;document.querySelector('#mlGo').click();return {click:n,fullAtClick:m.prep>=2};}")
        if shots:
            await asyncio.sleep(1.2); await pg.screenshot(path=os.path.join(shots, 'prep-1.png'))
            at['soilAtPicture1'] = await pg.evaluate("()=>({layerFull:__ml.MLS.prep>=2,soil:!!__ml.MLS.ready,state:__dyb.GAME.state})")
        for i in range(1200):
            await asyncio.sleep(.25)
            if await pg.evaluate("()=>!!__T.ready"): break
        await asyncio.sleep(3)
        if shots:
            await asyncio.sleep(6); await pg.screenshot(path=os.path.join(shots, 'prep-2.png'))
        r = await pg.evaluate("()=>{const s=__ml.mlStats(),T=__T,q=x=>x?+(x/1000).toFixed(2):null;return {title:q(T.menu),layerBegun:q(T.begun),layerFull:q(T.full),soilReady:q(T.ready),fillMs:s.prepMs,workers:s.prepWorkers,bandsByThePage:s.prepBandsHere,bands:s.prepBands,initMs:s.ms,state:__dyb.GAME.state,here:s.here&&s.here.place};}")
        r['pressedStart'] = round(at['click'] / 1000, 2); r['layerFullAtStart'] = at['fullAtClick']; r['picture1'] = at.get('soilAtPicture1'); r['how'] = ('no workers' if nw else 'workers') + (', START at once' if rush else ', waited at the title')
        after = await pg.evaluate(PRINT); r['print'] = {k: (before or {}).get(k) or after.get(k) for k in after}
        print(json.dumps(r));
        if errs: print('PAGE ERRORS', errs[:3])
        await br.close()
asyncio.run(main())
