import asyncio, sys, os, json, collections
from playwright.async_api import async_playwright
URL='file://'+os.path.abspath(sys.argv[1])
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        ctx=await br.new_context(viewport={'width':360,'height':170},device_scale_factor=1,has_touch=True)
        pg=await ctx.new_page(); await pg.goto(URL)
        for i in range(200):
            await asyncio.sleep(1)
            if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")=='menu' and i>5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(120):
            await asyncio.sleep(1); r=await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready,land:__ml.land().cur})")
            if r['st']=='drive' and r['ml'] and r['land']=='landSoil' and i>8: break
        for where,(dx,dz,yaw) in [('field',(0,600,1.571)),('mudhole',(-150,562,3.1))]:
            await pg.evaluate(f"()=>{{const A=__dyb.WG.mlA;__dyb.placeCar(A.x+{dx},A.z+{dz},{yaw});__dyb.setTestInput({{steer:.1,thr:.6,brk:0,hb:0,nos:false}});}}")
            await asyncio.sleep(3)
            c=await ctx.new_cdp_session(pg); await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval',{'interval':500}); await c.send('Profiler.start')
            f0=await pg.evaluate("()=>__game.GFX.frame"); await asyncio.sleep(12); f1=await pg.evaluate("()=>__game.GFX.frame")
            prof=(await c.send('Profiler.stop'))['profile']; await c.detach()
            self_=collections.Counter(); tot=0
            for n in prof['nodes']:
                fn=n['callFrame']['functionName'] or '(anon:%d)'%n['callFrame']['lineNumber']; h=n.get('hitCount',0); self_[fn]+=h; tot+=h
            print(where,'frames',f1-f0,'samples',tot)
            print('  '+' | '.join(f"{k} {100*v/tot:.1f}%" for k,v in self_.most_common(45)))
        await br.close()
asyncio.run(main())
