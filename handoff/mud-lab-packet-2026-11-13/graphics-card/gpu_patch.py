#!/usr/bin/env python3
"""THE GRAPHICS CARD'S NAME ON THE TITLE, THE STEP DOWN, THE RESET LINE, for Mud Lab (ml-gpu.js has the why).
By exact text swaps, each must match once.
usage: python3 -I gpu_patch.py <a built Mud Lab page> <out.html>
   or: add ml-gpu.js to src/ with the other ml-*.js files and lift the first swap into src/build.py."""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def swap(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('PATCH FAILED: expected %d match(es), found %d\n  %r' % (n, c, old[:160]))
    s = s.replace(old, new)
# the engine's line when the card is reset under the page said "the phone" on a laptop too
swap("L.textContent='The phone restarted its graphics. Starting again…';", "L.textContent=mlGpuLost();")
# the piece itself, just before the boot (build.py puts the ml-*.js files in its own way: do it that way there)
B = "/* =====================================================================================\n   THE BOOT:"
swap(B, open(os.path.join(HERE, 'ml-gpu.js'), encoding='utf-8').read() + '\n' + B)
open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,}), 2 swaps')
