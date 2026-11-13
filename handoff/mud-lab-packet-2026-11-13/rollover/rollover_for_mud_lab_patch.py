#!/usr/bin/env python3
"""ROLLOVERS THAT ROLL LIKE A TRUCK, re-pointed for Mud Lab's soil. NOT NEEDED TODAY: see README.md here.
Ground Truth build 26's fix (rollover_patch.py beside this) asks the ground for its slope under each wheel. In Mud
Lab the ground's slope is the soil's, 8 cm sharp, and a rut's wall is steeper than the fix's limit: on an upright
truck in the Pond the fix let go of a wheel 215 times in 9,120 touches. This version asks for the land's own slope
under the ruts (mlBase, the 64 cm ground the soil lies on) wherever the soil is, and the engine's ground elsewhere.
The other three swaps are Ground Truth's, unchanged.
By exact text swaps, each must match once.
usage: python3 -I rollover_for_mud_lab_patch.py <a built Mud Lab page> <out.html>
   or: put mlBroadUp in src/ml-soil.js after mlGround and lift the four swaps into src/build.py."""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read(); n0 = len(s)
def swap(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('PATCH FAILED: expected %d match(es), found %d\n  %r' % (n, c, old[:160]))
    s = s.replace(old, new)

# MUD LAB: the land's own slope against a direction (in src/ml-soil.js, beside mlGround)
A = "const ML_IN=2,MLG={};"
swap(A, A + """
/* the land's own slope under a point, against a direction: the ground the soil lies on, without the ruts, berms and
   clods the soil has at 8 cm (for the wheels' "has the truck rolled onto its side?": read off the soil itself, a
   rut's wall counted as a truck on its side). Not a number outside the soil's square */
const ML_BU=[0,0];
function mlBroadUp(x,z,U){
  if(!MLS.ready||MLS.off)return NaN;
  const N=MLS.N,C=MLS.C,fx=(x-MLS.x0)/C-.5,fz=(z-MLS.z0)/C-.5;
  if(fx<ML_IN||fz<ML_IN||fx>N-1-ML_IN||fz>N-1-ML_IN)return NaN;
  mlBase(x,z,ML_BU);return (U[1]-ML_BU[0]*U[0]-ML_BU[1]*U[2])/Math.hypot(ML_BU[0],1,ML_BU[1]);}""")

# a tyre stands only on ground that's under it. Past about 70 degrees between the truck and the ground (rolled
# onto its side; the ground's own slope there against the truck's up), the suspension's line runs along the ground
# instead of down into it, and the wheel had still been "touching": its spring and its tyre's side force pushed
# along the axle, which then points straight up, and threw a truck that had just rolled onto its side back up into
# the air, spinning the other way (his "flips really hard really fast"). Now the wheel lets go there and the body
# lands on its side.
# MUD LAB: the slope is the land's under the ruts (mlBroadUp) where the soil is, the engine's ground elsewhere
swap("      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}", "      if(got){let gu=typeof mlBroadUp==='function'?mlBroadUp(hit.p[0],hit.p[2],U):NaN;if(!(gu===gu)){const gq=this._gq||(this._gq={y:0,n:F3(),surf:''});this.world.ground(hit.p[0],hit.p[2],gq);gu=gq.n[0]*U[0]+gq.n[1]*U[1]+gq.n[2]*U[2];}if(gu<.34)got=false;wh.fade=gu>=.62?1:sstep(.34,.62,gu);}\n      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}")
# (and between about 50 and 70 degrees it takes the weight gradually: a wheel coming back down onto the ground as the
# truck rolls over is already deep in it, and its spring and bump stop all at once kicked the truck up again)
swap("      wh.Fz=Math.max(0,Fs);wh.cp.set(hit.p);", "      wh.Fz=Math.max(0,Fs)*(wh.fade??1);wh.cp.set(hit.p);")
# (and a wheel that comes down onto the ground already past its bump stop, because the truck rolled it in there
# sideways, doesn't spring that back out: only what it's pushed in further from there hits the bump stop. A
# wheel landing from a jump touches first and compresses, so its bump stop is as it was)
swap("      if(comp<=0){wh.contact=false;wh.Fz=0;wh.comp=0;", "      if(comp<=0){wh.bp0=-1;wh.contact=false;wh.Fz=0;wh.comp=0;")
swap("      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;", "      {const ex=comp-s.travel;wh.bp0=!(wh.bp0>=0)?Math.max(0,ex):Math.min(wh.bp0,Math.max(0,ex));const eb=ex-wh.bp0;if(eb>0)Fs+=eb*wh.k*14+Math.max(0,rate)*wh.cb*2;}")

open(out, 'w', encoding='utf-8').write(s)
print(f'{out}: {len(s):,} chars (was {n0:,}), 5 swaps')
