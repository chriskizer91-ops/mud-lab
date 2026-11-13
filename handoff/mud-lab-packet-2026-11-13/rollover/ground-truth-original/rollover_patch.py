#!/usr/bin/env python3
"""FOR REFERENCE. DO NOT PUT THIS ONE INTO MUD LAB: use ../rollover_for_mud_lab_patch.py (see ../README.md).
Ground Truth build 26's rollover fix (last-road src/lr_patch.py, 8 Nov 2026), its four swaps and their own comments,
unchanged. The four swaps fit Mud Lab 15 as text, but its first one reads the ground's slope under each wheel, and in
Mud Lab that is the soil's own slope, 8 cm sharp: a rut's wall reads as a truck on its side. With these four swaps
in, 5 of Mud Lab's 7 same-drive drives changed, four of them drives where the truck never left its wheels.
It is right as it is for Salt & Sand and Ice & Snow, which have the same fault and no soil.
By exact text swaps, each must match once.
usage: python3 -I rollover_patch.py <a built page> <out.html>"""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def swap(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('PATCH FAILED: expected %d match(es), found %d\n  %r' % (n, c, old[:160]))
    s = s.replace(old, new)

# a tyre stands only on ground that's under it. Past about 70 degrees between the truck and the ground (rolled
# onto its side; the ground's own slope there against the truck's up), the suspension's line runs along the ground
# instead of down into it, and the wheel had still
# been "touching": its spring and its tyre's side force pushed along the axle, which then points straight up, and
# threw a truck that had just rolled onto its side back up into the air, spinning the other way (his "flips
# really hard really fast"). Now the wheel lets go there and the body lands on its side
swap("      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}", "      if(got){const gq=this._gq||(this._gq={y:0,n:F3(),surf:''});this.world.ground(hit.p[0],hit.p[2],gq);const gu=gq.n[0]*U[0]+gq.n[1]*U[1]+gq.n[2]*U[2];if(gu<.34)got=false;wh.fade=gu>=.62?1:sstep(.34,.62,gu);}\n      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}")
# (and between about 50 and 70 degrees it takes the weight gradually: a wheel coming back down onto the ground as the
# truck rolls over is already deep in it, and its spring and bump stop all at once kicked the truck up again)
swap("      wh.Fz=Math.max(0,Fs);wh.cp.set(hit.p);", "      wh.Fz=Math.max(0,Fs)*(wh.fade??1);wh.cp.set(hit.p);")
# (and a wheel that comes down onto the ground already past its bump stop, because the truck rolled it in there
# sideways, doesn't spring that back out: only what it's pushed in further from there hits the bump stop. A
# wheel landing from a jump touches first and compresses, so its bump stop is as it was)
swap("      if(comp<=0){wh.contact=false;wh.Fz=0;wh.comp=0;", "      if(comp<=0){wh.bp0=-1;wh.contact=false;wh.Fz=0;wh.comp=0;")
swap("      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;", "      {const ex=comp-s.travel;wh.bp0=!(wh.bp0>=0)?Math.max(0,ex):Math.min(wh.bp0,Math.max(0,ex));const eb=ex-wh.bp0;if(eb>0)Fs+=eb*wh.k*14+Math.max(0,rate)*wh.cb*2;}")

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,}), 4 swaps')
