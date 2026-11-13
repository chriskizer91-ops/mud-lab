"""One page through Mud Lab's own same-drive test (tools/test/ml-same.py: its seven drives, its counted dice, a fresh
page per drive), the numbers saved to a file so several pages can be held against one run of Mud Lab 15.
usage: python3 -u ml-one.py <mud-lab repo> <page.html> <out.json>"""
import sys, os, json, asyncio
repo, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
code = open(os.path.join(repo, 'tools/test/ml-same.py'), encoding='utf-8').read()
i = code.rindex('asyncio.run(main())'); code = code[:i]
g = {'__name__': 'mlsame'}; exec(compile(code, 'ml-same.py', 'exec'), g)
# PROBE=1: also bring back window.__rg (a probe page's counts), started from nought for each drive
if os.environ.get('PROBE'): g['RUNS'] = [(n, '(()=>{window.__rg={n:0,lo:0,cut:0,min:1,bp:0};const r=(' + js + ');r.__rg=window.__rg;return r;})()') for n, js in g['RUNS']]
async def go():
    async with g['async_playwright']() as p:
        a, ea = await g['one'](p, src)
        json.dump({'src': src, 'runs': a, 'errs': ea}, open(out, 'w'), indent=1)
        for n, x in a: print(n, '|', x.get('mph'), 'mph', x.get('p'), 'ruts', x.get('deepestCm'), 'dug', x.get('dugLitres'), 'clods', x.get('clods'), x.get('__rg') or '', flush=True)
        print('page errors:', ea[:3] or 'none', flush=True)
asyncio.run(go())
