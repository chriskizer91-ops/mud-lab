#!/usr/bin/env python3
"""A PROBE, not a fix: the rollover fix's two tests, counted and not acted on. The page drives exactly as before
(if calling the ground a second time has no side effect) and window.__rg says how often each half of the fix
would have stepped in: n wheel-touches looked at, lo = tilt read past about 52 degrees (the fade would start),
cut = past about 70 (the wheel would let go), min = the smallest reading, bp = touches that began already past
the bump stop (the second half would hold force back)."""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def swap(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('PATCH FAILED: expected %d, found %d\n  %r' % (n, c, old[:160]))
    s = s.replace(old, new)
RG = "(window.__rg||(window.__rg={n:0,lo:0,cut:0,min:1,bp:0}))"
swap("      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}", "      if(got){const gq=this._gq||(this._gq={y:0,n:F3(),surf:''});this.world.ground(hit.p[0],hit.p[2],gq);const gu=gq.n[0]*U[0]+gq.n[1]*U[1]+gq.n[2]*U[2];const rg_="+RG+";rg_.n++;if(gu<.62)rg_.lo++;if(gu<.34)rg_.cut++;if(gu<rg_.min)rg_.min=gu;}\n      if(got){wh.hint=hit.i;comp=s.rest-(hit.t-R);}")
swap("      if(comp<=0){wh.contact=false;wh.Fz=0;wh.comp=0;", "      if(comp<=0){wh.bp0=-1;wh.contact=false;wh.Fz=0;wh.comp=0;")
swap("      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;", "      {const ex=comp-s.travel;wh.bp0=!(wh.bp0>=0)?Math.max(0,ex):Math.min(wh.bp0,Math.max(0,ex));if(wh.bp0>0)"+RG+".bp++;}\n      if(comp>s.travel)Fs+=(comp-s.travel)*wh.k*14+Math.max(0,rate)*wh.cb*2;")
open(out, 'w', encoding='utf-8').write(s); print(out, len(s))
