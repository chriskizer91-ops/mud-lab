"""Does a truck sliding sideways roll over like a truck, in a Mud Lab page?  python3 ml-tip.py <page.html> <out.json>
Ground Truth build 26's test (last-road tools/test/lr-test.js, tipTest), put on Mud Lab's clay pan: a vehicle made new,
raked ground, the game's loop held and only the physics stepped; the truck is given a sideways speed and let go, hands
off, for 6 s (or, with KICK=120,180,... in the environment, kicked into a roll at that many degrees a second). For each: how far it rolled over in all (degrees), the fastest it turned (degrees a second), how high it
rose off the ground (m), and how it ended up. On the Realistic level and on Sim."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
HELP = r"""window.MLT={tip(level,kind,mph,secs,kick){kick=kick||0;const D=__dyb,G=__game,A=D.WG.mlA,AP=D.APP||G.APP;if(AP)AP.level=level;
  G.FX.length=0;__ml.mlRake();if(window.__mlr)__mlr.testClear();D.setTestInput({steer:0,thr:0,brk:1,hb:1,nos:false});
  __mlsv.mlSuvSet('stock');__mlsv.mlSuvSet('crawler');G.spawnCar(__mlsv.MLSV.bi[kind],A.x-470,A.z-300,0);__mlsv.MLSV.pick=kind;G.FX.length=0;__ml.mlRake();
  const t=D.GAME.car;t.setAssists(level);for(let i=0;i<480;i++)D.step(1/120);
  const roll=()=>Math.atan2(-t.M[5],t.M[4]),rr=()=>t.w[0]*t.M[0]+t.w[1]*t.M[3]+t.w[2]*t.M[6],R=t.M,s=mph/2.237;
  t.w[0]+=R[0]*kick/57.3;t.w[1]+=R[3]*kick/57.3;t.w[2]+=R[6]*kick/57.3;t.v[0]+=R[2]*s;t.v[1]+=R[5]*s;t.v[2]+=R[8]*s;D.setTestInput({steer:0,thr:0,brk:0,hb:0,nos:false});
  let prev=roll(),tot=0,mx=0,y0=t.p[1],ymax=0,minUp=1;
  for(let i=1;i<=Math.round(secs*120);i++){D.step(1/120);const r=roll();let d=r-prev;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;tot+=d;prev=r;
    mx=Math.max(mx,Math.abs(rr())*57.3);ymax=Math.max(ymax,t.p[1]-y0);minUp=Math.min(minUp,t.M[4]);}
  const up=t.M[4];return {level:AP?AP.level:'?',sim:!!t.sim,kind,mph,kick,rolled:Math.round(Math.abs(tot)*57.3),fastest:Math.round(mx),rose:+ymax.toFixed(2),
    ends:up>.8?'on its wheels':up<-.8?'on its roof':Math.abs(up)<.45?'on its side':'leaning',up:+up.toFixed(2),stillMph:+(t.speed*2.237).toFixed(1)};}};"""
async def main():
    src, out = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 360, 'height': 170}, device_scale_factor=1, has_touch=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
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
        await asyncio.sleep(1); await pg.evaluate(HELP); res = []
        KICK = os.environ.get('KICK')
        for level in ('real', 'sim'):
            for kind in ('crawler', 'stock'):
                for mph in ((0,) if KICK else (11, 13, 18, 22, 27, 31, 40)):
                  for kick in ([int(k) for k in KICK.split(',')] if KICK else [0]):
                    try: r = await pg.evaluate(f"()=>MLT.tip('{level}','{kind}',{mph},6,{kick})")
                    except Exception as e: r = {'FAILED': str(e)[:200]}
                    res.append(r); print(json.dumps(r), flush=True)
        json.dump({'src': src, 'runs': res, 'errs': errs}, open(out, 'w'), indent=1); print('page errors:', errs[:3] or 'none'); await br.close()
asyncio.run(main())
