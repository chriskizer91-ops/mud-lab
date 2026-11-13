#!/usr/bin/env python3
"""THE HERON'S HUD WITHOUT THE CAR'S LAMPS AND GEAR, for Mud Lab. Ground Truth's two swaps (last-road
src/lr_patch.py, "the plane's HUD: no car lights (TC, ABS, ESC) and no gear"), unchanged. Flying the Heron, the HUD
still showed the truck's TC / ABS / ESC lamps and a gear number in the rev dial; a plane has neither.
It touches only what the HUD draws.
By exact text swaps, each must match once.
usage: python3 -I plane_hud_patch.py <a built Mud Lab page> <out.html>
   or: lift the two swaps into src/build.py."""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def swap(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('PATCH FAILED: expected %d match(es), found %d\n  %r' % (n, c, old[:160]))
    s = s.replace(old, new)
# the row of lamps (TC, ABS, ESC and the damage lamps after them): none of it in the plane
swap("for(const [s,v,col] of C){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}", "for(const [s,v,col] of (t.rt?[]:C)){txt3(s,x,yc,v?col:pack(70,64,86));x+=tw3(s)+5;}")
# the gear in the rev dial: blank in the plane
swap("const g=t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,", "const g=t.rt?'':t.rev?'R':pt.shiftT>0?'-':String(pt.gear);otxt5(g,")
open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,}), 2 swaps')
