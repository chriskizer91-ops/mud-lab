"""THE BRIDGE between Salt & Sand Showroom 3 and the plane / Ground Truth (the combined game, step 1).
Salt & Sand's lean Studio 2 car carries its baked shade in the lit shader's vertex slot 4 (vec2 aBk). The plane and
Ground Truth carry the baked models' texture coordinates in the same slot (vec2 aUV). The shade moves to slot 8 (the
page uses 0 to 7; WebGL 2 allows at least 16), and the two shader lines are laid out so the plane's own swaps
(redtail/game/rt_patch.py, unchanged) find the text they expect.
usage: python3 -I gtc_bridge.py <showroom-3.html> <out.html>      Every swap must match exactly once."""
import sys
src, dst = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
def swap(old, new, n=1):
    global s
    c = s.count(old); assert c == n, 'expected %d, found %d: %r' % (n, c, old[:90]); s = s.replace(old, new)
BK = "/* (a Studio 2 car's baked shade, 63_s2lean: uBk is 0 for everything else) */\n"
# the vertex shader: the shade on slot 8, declared before the material's line (the plane's swap wants aMat then iA)
swap("layout(location=3) in float aMat;\n" + BK + "layout(location=4) in vec2 aBk;uniform float uBk;out vec2 vBk;\nlayout(location=5) in vec4 iA;",
     BK + "/* (the combined game: on slot 8; slot 4 is the baked models' texture coordinates, aUV) */\nlayout(location=8) in vec2 aBk;uniform float uBk;out vec2 vBk;\nlayout(location=3) in float aMat;\nlayout(location=5) in vec4 iA;")
# the fragment shader: the shade's input ahead of the others (the plane's swap wants vPrev then oCol)
swap("in vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;in vec2 vBk;\nlayout(location=0) out vec4 oCol;",
     "in vec2 vBk;\nin vec3 vP;in vec3 vN;in vec4 vC;in float vMat;in vec3 vL;in vec4 vCur;in vec4 vPrev;\nlayout(location=0) out vec4 oCol;")
# the lean car's meshes: their shade buffer on slot 8 (made in two places: a piece, and its lighter copies)
swap("gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,2,gl.UNSIGNED_BYTE,true,2,0)", "gl.enableVertexAttribArray(8);gl.vertexAttribPointer(8,2,gl.UNSIGNED_BYTE,true,2,0)", 2)
assert 'location=4' not in s.split("<script>\n(()=>{\n'use strict';", 1)[1].split('THE BOOT:', 1)[0].replace('layout(location=4) in vec4 aCol', ''), 'slot 4 is still claimed somewhere'
open(dst, 'w', encoding='utf-8').write(s)
print('bridge: ok')
