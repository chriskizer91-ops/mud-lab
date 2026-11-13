"""A hard turn at speed on the dry field, in a Mud Lab page: does the truck go over, and what happens once it has?
python3 ml-turn.py <page.html> <out.json>
ml-same.py's first drive (the dry field: 3 s at 0.8 throttle, 2 s at half throttle with 0.3 of steering, 1.5 s of
brakes), the same way it does it (a vehicle made new, raked ground, counted dice, the loop held), then hands off for
6 s more. Watched all the way: how far it rolled over in all (degrees), the fastest it turned (degrees a second),
how high its middle rose above where it started (m), the furthest it leaned, how it ended up."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
SEED = "(()=>{let s=1;window.__seed=v=>{s=v>>>0;};Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};})();"
HELP = r"""window.MLT2={turn(level,kind,steer){const D=__dyb,G=__game,A=D.WG.mlA,AP=D.APP||G.APP;if(AP)AP.level=level;
  G.FX.length=0;__ml.mlRake();const S=__ml.MLS.stat;S.dug=S.clods=S.landed=S.splash=0;__ml.MLS.clock=0;if(window.__mlr)__mlr.testClear();
  D.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});__mlsv.mlSuvSet('stock');__mlsv.mlSuvSet('crawler');
  G.spawnCar(__mlsv.MLSV.bi[kind],A.x,A.z+620,1.571);__mlsv.MLSV.pick=kind;G.FX.length=0;__ml.mlRake();__ml.MLS.clock=0;__seed(11);
  const t=D.GAME.car;t.setAssists(level);for(let i=0;i<480;i++)D.step(1/120);
  const roll=()=>Math.atan2(-t.M[5],t.M[4]),rr=()=>t.w[0]*t.M[0]+t.w[1]*t.M[3]+t.w[2]*t.M[6];
  let prev=roll(),tot=0,mx=0,y0=t.p[1]-RANCH_H(t),ymax=0,minUp=1,top=0,over=null,n=0,vIn=0,vOver=0;
  function RANCH_H(t){const o={y:0,n:[0,1,0],surf:''};return D.RANCH.W.heightAt(t.p[0],t.p[2]);}
  for(const [thr,st,brk,secs] of [[.8,0,0,3],[.5,steer,0,2],[0,0,1,1.5],[0,0,0,6]]){D.setTestInput({steer:st,thr,brk,hb:0,nos:false});
    for(let i=0;i<Math.round(secs*120);i++){D.step(1/120);n++;const r=roll();let d=r-prev;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;tot+=d;prev=r;
      mx=Math.max(mx,Math.abs(rr())*57.3);ymax=Math.max(ymax,t.p[1]-RANCH_H(t)-y0);minUp=Math.min(minUp,t.M[4]);top=Math.max(top,t.speed*2.237);
      if(n===360)vIn=Math.round(t.speed*2.237);if(over===null&&t.M[4]<.34){over=+(n/120).toFixed(2);vOver=Math.round(t.speed*2.237);}}}
  const up=t.M[4];return {level:AP?AP.level:'?',kind,steer,mphAtTurnIn:vIn,wentOverAt:over,mphThen:vOver,rolled:Math.round(Math.abs(tot)*57.3),fastest:Math.round(mx),rose:+ymax.toFixed(2),
    furthestLean:Math.round(Math.acos(Math.max(-1,Math.min(1,minUp)))*57.3),ends:up>.8?'on its wheels':up<-.8?'on its roof':Math.abs(up)<.45?'on its side':'leaning'};}};"""
async def main():
    src, out = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        res = []; errs = []
        for level, kind, steer in (('real', 'crawler', .3), ('real', 'crawler', .6), ('real', 'crawler', 1), ('real', 'stock', .3), ('real', 'stock', 1)):
            ctx = await br.new_context(viewport={'width': 360, 'height': 170}, device_scale_factor=1, has_touch=True)
            pg = await ctx.new_page(); await pg.add_init_script(SEED); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await pg.goto('file://' + os.path.abspath(src))
            for i in range(200):
                await asyncio.sleep(1)
                if await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}") == 'menu' and i > 5: break
            await pg.evaluate("()=>document.querySelector('#mlGo').click()")
            for i in range(90):
                await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready})")
                if r['st'] == 'drive' and r['ml'] and i > 8: break
            await pg.evaluate("()=>{__game.GAME.hold=true;}")
            for i in range(60):
                await asyncio.sleep(.5)
                if await pg.evaluate("()=>__game.WORLD.inflight===0&&__game.WORLD.inbox.length===0&&__game.WORLD.pend.size===0") and i > 3: break
            await asyncio.sleep(1); await pg.evaluate(HELP)
            try: r = await pg.evaluate(f"()=>MLT2.turn('{level}','{kind}',{steer})")
            except Exception as e: r = {'FAILED': str(e)[:300]}
            res.append(r); print(json.dumps(r), flush=True); await ctx.close()
        json.dump({'src': src, 'runs': res, 'errs': errs}, open(out, 'w'), indent=1); print('page errors:', errs[:3] or 'none'); await br.close()
asyncio.run(main())
