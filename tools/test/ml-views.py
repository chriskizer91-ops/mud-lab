"""Mud Lab's fixed views, for before/after pictures and numbers of two builds:
  python3 tools/test/ml-views.py builds/mud-lab-7.html OUTDIR m|l [view,view,...]
Each view is made the same way every time: the game's own loop is held still (GAME.hold), the truck is put in its
place, driven if the view says so (physics only), the camera set, the clock set, and frames are drawn one at a time
until the picture has settled. Then OUTDIR/<view>.png (the canvas alone: no touch buttons) and OUTDIR/numbers.json:
  tris, draws   what the engine counts for that frame
  ms            the test browser's time for a whole frame (software graphics: only good for before/after)
  js            the JavaScript's own share of it
The picture is drawn at the size the device draws it: m = the Pixel 7a held sideways (915 x 412 CSS pixels, 1.25
device pixels each, the render scale held at 0.75: what the Mobile tier does at its best); l = a laptop window (1280 x
720, the High tier, render scale 1). In the environment: UI=1 also saves <view>-ui.png with the page's buttons;
FRAMES=12 times twelve frames a view, not four (the far shadows and the reflections are drawn every few frames: twelve
covers them all evenly); SCALE=.5 draws smaller, for a quick look. The views run in the order given: keep it the same
for the two builds being compared (the stock SUV's and the Heron's views leave a different truck behind them)."""
import asyncio, sys, time, json, os
from playwright.async_api import async_playwright
URL, OUT, MOBILE = sys.argv[1], sys.argv[2].rstrip('/') + '/', sys.argv[3] == 'm'
if '://' not in URL: URL = 'file://' + os.path.abspath(URL)
os.makedirs(OUT, exist_ok=True)
# name: (dx, dz, yaw from the world's middle; what to do; the camera)
#   do: list of ['drive', thr, steer, brake, secs] | ['heron', height m, speed m/s] | ['stock'] | ['js', expr]
#   cam: None (the game's chase camera) | ['look', ex,ey,ez, ax,ay,az, fov] (the truck's frame: x ahead, y up, z right)
#        | ['world', ex,ey,ez, ax,ay,az, fov] (metres from the world's middle, heights over the world's level)
VIEWS = {
    'start':    (0, 630, 1.571, [], None),
    'tracks':   (0, 600, 1.571, [['drive', .45, 0, 0, 2.0], ['drive', .35, .22, 0, 2.0], ['drive', .35, -.22, 0, 2.0], ['drive', 0, 0, .7, 1.5]], ['look', -6.5, 1.5, 3.2, 0, .5, -.6, .85]),
    'woods':    (64, 330, 1.45, [['drive', .5, 0, 0, 2.5], ['drive', 0, 0, 1, 1.2]], None),
    'mudhole':  (-150, 562, 3.1, [['drive', .8, 0, 0, 3.2], ['drive', 0, 0, .6, .8]], ['look', -7.5, 2.2, 3.4, 0, .6, -.4, .85]),
    'ford':     (-10, 172, 2.0, [['drive', .6, 0, 0, 2.6], ['drive', 0, 0, .6, .8]], None),
    'pond':     (176, 150, .45, [], ['look', -8, 2.6, -2.5, 6, .4, 1.5, .9]),
    'claypan':  (-470, -300, .6, [['drive', .5, 0, 0, 2.2], ['drive', 0, 0, .7, 1.4]], ['look', -7, 1.7, -3.2, 0, .6, .5, .85]),
    'quarry':   (392, 470, -.6, [], ['look', -9, 3.4, 2, 8, -1.5, -1, .95]),
    'bottoms':  (300, -120, .3, [['drive', .7, 0, 0, 3], ['drive', 0, 0, .6, .8]], None),
    'ridge':    (220, -610, -1.571, [], ['look', -9, 3.5, 1.5, 10, -.5, -.5, .9]),
    'heron':    (-34, 668, -1.571, [], ['look', -9, 2.4, -4, 9, 1.2, 1.5, .9]),
    'stock':    (0, 630, 1.571, [['stock'], ['drive', .45, .15, 0, 2.5], ['drive', 0, 0, .7, 1.2]], ['look', 6.5, 1.3, 3.0, 0, .6, -.3, .8]),
    'flying':   (40, 520, 1.2, [['heron', 150, 52]], None),
}
HELP = r"""window.MLVW={
 hold(scale,ui){const G=__game;G.GAME.hold=true;G.DEVW.gpuT='hold';G.APP.photo=!ui;if(G.RESO)G.RESO.scale=scale;G.R.resize(G.PIC.w,G.PIC.h,scale);return [G.R.iw,G.R.ih,G.R.W,G.R.H,G.GFX.level];},
 drive(thr,steer,brk,secs){const D=__dyb,n=Math.round(secs*120);D.setTestInput({steer,thr,brk,hb:0,nos:false});for(let i=0;i<n;i++)D.step(1/120);D.setTestInput({steer:0,thr:0,brk:0,hb:0,nos:false});return +(D.GAME.car.speed*2.237).toFixed(1);},
 place(dx,dz,yaw){const A=__dyb.WG.mlA;__dyb.placeCar(A.x+dx,A.z+dz,yaw);__dyb.setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});for(let i=0;i<180;i++)__dyb.step(1/120);return 1;},
 stock(){__mlsv.mlSuvSet('stock');for(let i=0;i<180;i++)__dyb.step(1/120);return __mlsv.mlIsStock(__dyb.GAME.car);},
 rockmud(){if(__dyb.GAME.car.rt)__rt2.rtFly(false);__mlsv.mlSuvSet('crawler');return 1;},
 heron(h,v){__rt2.rtFly(true);const t=__dyb.GAME.car,M=t.M;t.p[1]+=h;t.v[0]=M[0]*v;t.v[1]=0;t.v[2]=M[6]*v;t.air=true;t.airT=1;try{__rt2.RTI.lev=.8;}catch(e){}
   __dyb.setTestInput({steer:0,thr:.8,brk:0,hb:0,nos:false});for(let i=0;i<60;i++)__dyb.step(1/120);return [t.rt,+t.p[1].toFixed(1),+(Math.hypot(t.v[0],t.v[1],t.v[2])).toFixed(1)];},
 look(ex,ey,ez,ax,ay,az,fov){const D=__dyb,t=D.GAME.car;const w=(x,y,z)=>[t.p[0]+t.M[0]*x+t.M[1]*y+t.M[2]*z,t.p[1]+t.M[3]*x+t.M[4]*y+t.M[5]*z,t.p[2]+t.M[6]*x+t.M[7]*y+t.M[8]*z];
   D.CAM.over={eye:w(ex,ey,ez),at:w(ax,ay,az),fov:fov||.8};D.CAM.cut=true;return 1;},
 world(ex,ey,ez,ax,ay,az,fov){const D=__dyb,A=D.WG.mlA,h=__ml.MLS.h0;D.CAM.over={eye:[A.x+ex,h+ey,A.z+ez],at:[A.x+ax,h+ay,A.z+az],fov:fov||.8};D.CAM.cut=true;return 1;},
 free(){__dyb.CAM.over=null;__dyb.CAM.cut=true;return 1;},
 /* frames drawn one at a time, the clock set (the same clouds, the same sway, every run), the world's worker given
    time to hand over the ground */
 async settle(n,t0){const G=__game;for(let i=0;i<n;i++){G.APP.t=t0+i/60;__dyb.render(1/60);await new Promise(r=>setTimeout(r,25));}return G.WORLD.chunks.size;},
 sync(){const gl=__game.gl,r=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),px=new Uint8Array(4);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,r);},
 time(n,t0){const G=__game;this.sync();let js=0;const a=performance.now();for(let i=0;i<n;i++){G.APP.t=t0+i/60;const b=performance.now();__dyb.render(1/60);js+=performance.now()-b;}this.sync();
   __dyb.GLC.n=0;__dyb.render(1/60);return {ms:+((performance.now()-a)/n).toFixed(1),js:+(js/n).toFixed(1),tris:G.APP.tris,draws:__dyb.GLC.n,chunks:G.WORLD.chunks.size,land:__ml.land().cur,fx:G.FX.length};},
 png(){return __game.gl.canvas.toDataURL('image/png');}};"""
async def main():
    want = sys.argv[4].split(',') if len(sys.argv) > 4 else list(VIEWS)
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await br.new_context(viewport={'width': 915, 'height': 412} if MOBILE else {'width': 1280, 'height': 720}, device_scale_factor=1.25 if MOBILE else 1, has_touch=MOBILE)
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:600])); pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:800]))
        t0 = time.time(); await pg.goto(URL + os.environ.get('HASH', ''))
        for i in range(300):
            await asyncio.sleep(1)
            st = await pg.evaluate("()=>{try{return __dyb.GAME.state}catch(e){return 'x'}}")
            if st == 'menu' and i > 5: break
        await pg.evaluate("()=>document.querySelector('#mlGo').click()")
        for i in range(240):
            await asyncio.sleep(1); r = await pg.evaluate("()=>({st:__dyb.GAME.state,ml:__ml.MLS.ready,land:__ml.land().cur})")
            if r['st'] == 'drive' and r['ml'] and (r['land'] == 'landSoil' or os.environ.get('HASH')) and i > 6: break
        await pg.evaluate(HELP)
        size = await pg.evaluate('([s,ui])=>MLVW.hold(s,ui)', [float(os.environ.get('SCALE', .75 if MOBILE else 1)), bool(os.environ.get('UI'))])
        print('ready', round(time.time() - t0), r, size, flush=True)
        # (numbers.json is kept up as each view is done, and a later run for more views adds to it)
        nums = json.load(open(OUT + 'numbers.json')) if os.path.exists(OUT + 'numbers.json') else {}
        nums['_'] = {'url': URL, 'device': 'phone' if MOBILE else 'laptop', 'render': size}
        for name in want:
            dx, dz, yaw, do, cam = VIEWS[name]
            try:
                await pg.evaluate('()=>{MLVW.rockmud();__ml.mlRake();MLVW.free();}')
                await pg.evaluate(f'()=>MLVW.place({dx},{dz},{yaw})')
                for d in do:
                    if d[0] == 'drive': await pg.evaluate(f'()=>MLVW.drive({d[1]},{d[2]},{d[3]},{d[4]})')
                    elif d[0] == 'heron': print(' heron', await pg.evaluate(f'()=>MLVW.heron({d[1]},{d[2]})'))
                    elif d[0] == 'stock': await pg.evaluate('()=>MLVW.stock()')
                    elif d[0] == 'js': await pg.evaluate('()=>' + d[1])
                if cam: await pg.evaluate(f'()=>MLVW.{cam[0]}({",".join(str(v) for v in cam[1:])})')
                # the ground streams in from the worker: settle until the count of squares stops changing, then a few more
                last = -1
                for k in range(16):
                    ch = await pg.evaluate('()=>MLVW.settle(4,100)')
                    if ch == last and k >= 1: break
                    last = ch
                n = await pg.evaluate('(k)=>MLVW.time(k,100.2)', int(os.environ.get('FRAMES', 4)))
                await pg.evaluate('()=>MLVW.settle(3,100.4)')
                import base64
                png = await pg.evaluate('()=>{__game.APP.t=100.5;__dyb.render(1/60);return MLVW.png();}')
                open(OUT + name + '.png', 'wb').write(base64.b64decode(png.split(',', 1)[1]))
                if os.environ.get('UI'): await pg.screenshot(path=OUT + name + '-ui.png')
                nums[name] = n; print(name, json.dumps(n), round(time.time() - t0), flush=True); json.dump(nums, open(OUT + 'numbers.json', 'w'), indent=1)
            except Exception as e: print('FAIL', name, str(e)[:600], flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
        print('--- errors:', len(errs)); print('\n'.join(errs[:8]))
        await br.close()
asyncio.run(main())
