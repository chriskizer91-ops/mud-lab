"""Mud Lab's test run: python3 tools/test/ml-run.py file.html TAG m|l step;step;...
steps: start | wait:s | shot:name | js:<expr> (printed) | drive:thr_steer_brk_secs (physics only, 120 Hz) | live:thr_steer_secs (the page's own loop)
       | stats | cam:Name | look:ex_ey_ez_ax_ay_az_fov (truck frame) | place:dx_dz_yaw (from the arena's middle)"""
import asyncio, sys, time, json, os
from playwright.async_api import async_playwright
URL, TAG, MOBILE = sys.argv[1], sys.argv[2], sys.argv[3] == 'm'
STEPS = sys.argv[4].split(';') if len(sys.argv) > 4 else []
SH = os.environ.get('SHOTS', '/tmp/ml-shots/'); os.makedirs(SH, exist_ok=True)
HELP = r"""window.MLT={
 drive(thr,steer,brk,secs,hb){const D=__dyb,n=Math.round(secs*120);D.setTestInput({steer,thr,brk,hb:hb||0,nos:false});for(let i=0;i<n;i++)D.step(1/120);
   const t=D.GAME.car;return {mph:+(t.speed*2.237).toFixed(1),p:[+(t.p[0]-__dyb.WG.mlA.x).toFixed(1),+t.p[1].toFixed(2),+(t.p[2]-__dyb.WG.mlA.z).toFixed(1)],surf:t.wheels.map(w=>w.surf).join(','),
     slip:t.wheels.map(w=>+(w.w*w.R-w.vl).toFixed(1)).join(','),...__ml.mlStats()};},
 place(dx,dz,yaw){const A=__dyb.WG.mlA;__dyb.placeCar(A.x+dx,A.z+dz,yaw);return this.drive(0,0,0,1.5,1);},
 look(ex,ey,ez,ax,ay,az,fov){const D=__dyb,t=D.GAME.car;const w=(x,y,z)=>[t.p[0]+t.M[0]*x+t.M[1]*y+t.M[2]*z,t.p[1]+t.M[3]*x+t.M[4]*y+t.M[5]*z,t.p[2]+t.M[6]*x+t.M[7]*y+t.M[8]*z];
   D.CAM.over={eye:w(ex,ey,ez),at:w(ax,ay,az),fov:fov||.8};return 1;},
 world(ex,ey,ez,ax,ay,az,fov){const D=__dyb,A=D.WG.mlA,h=__ml.MLS.h0;D.CAM.over={eye:[A.x+ex,h+ey,A.z+ez],at:[A.x+ax,h+ay,A.z+az],fov:fov||.8};return 1;},
 free(){__dyb.CAM.over=null;return 1;}};"""
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if MOBILE else {'width': 1280, 'height': 720}, device_scale_factor=1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        if os.environ.get('INIT'): await pg.add_init_script(path=os.environ['INIT'])
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:600])); pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:800]))
        t0 = time.time(); await pg.goto(URL)
        for i in range(200):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 5: break
        print('loaded', round(time.time() - t0), st, flush=True)
        await pg.evaluate(HELP)
        for t in STEPS:
            try:
                if t == 'start':
                    await pg.evaluate("()=>document.querySelector('#mlGo,#lrGo').click()"); 
                    for i in range(120):
                        await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ready:__dyb.WORLD.ready,ml:__ml.MLS.ready,ch:__dyb.WORLD.chunks.size})")
                        if r['st'] == 'drive' and r['ml'] and i > 8: break
                    print('start', r, round(time.time() - t0), flush=True); continue
                if t.startswith('wait:'): await asyncio.sleep(float(t[5:])); continue
                if t.startswith('shot:'): await pg.screenshot(path=SH + f'{TAG}_{t[5:]}.png'); print('shot', t[5:], flush=True); continue
                if t == 'stats': r = await pg.evaluate("()=>__ml.mlStats()")
                elif t == "dbg": r = await pg.evaluate(open("/tmp/dbg.js").read())
                elif t.startswith("file:"): r = await pg.evaluate(open(t[5:]).read())
                elif t.startswith("js:"): r = await pg.evaluate("()=>" + t[3:])
                elif t.startswith('drive:'): a = [float(x) for x in t[6:].split("_")] + [0]; r = await pg.evaluate(f"()=>MLT.drive({a[0]},{a[1]},{a[2]},{a[3]},{a[4]})")
                elif t.startswith('live:'):
                    a = [float(x) for x in t[5:].split('_')]; await pg.evaluate(f'()=>__dyb.setTestInput({{steer:{a[1]},thr:{a[0]},brk:0,hb:0,nos:false}})'); await asyncio.sleep(a[2]); r = await pg.evaluate("()=>__ml.mlStats()")
                elif t.startswith('place:'): a = [float(x) for x in t[6:].split('_')]; r = await pg.evaluate(f'()=>MLT.place({a[0]},{a[1]},{a[2]})')
                elif t.startswith('look:'): a = t[5:].replace('_', ','); r = await pg.evaluate(f'()=>MLT.look({a})')
                elif t.startswith('world:'): a = t[6:].replace('_', ','); r = await pg.evaluate(f'()=>MLT.world({a})')
                elif t == 'free': r = await pg.evaluate('()=>MLT.free()')
                elif t.startswith('cam:'): r = await pg.evaluate("(n)=>{const D=__dyb,i=D.CAMS.indexOf(n);D.CAM.over=null;D.camPick(i);return i;}", t[4:].replace('-', ' '))
                else: r = 'unknown'
                print(t[:60], json.dumps(r)[:8000], round(time.time() - t0), flush=True)
            except Exception as e: print('FAIL', t[:60], str(e)[:600], flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')] + [l for l in logs if l.startswith('warn')][:3]
        print('--- errors/warnings:'); print('\n'.join(errs[:6]))
        await br.close()
asyncio.run(main())
