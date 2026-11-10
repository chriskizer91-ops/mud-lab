"""The stock SUV's baked play model for Mud Lab, from salt-mini-plus's bake of it.
  python3 tools/suv_pack.py SMP/models/suv/suv_baked_data.js SMP/models/suv/suv_baked.glb   (writes base/suv-stock-baked.js)
  (SMP = a checkout of salt-mini-plus, branch beyond-the-last-road)
The source is his own bake (salt-mini-plus branch beyond-the-last-road, models/suv/suv_baked_data.js, made by that
repo's models/tools/bake.py and pack_game.py: Blender casts a ray from every pixel of the game's own stock SUV into
the detailed Studio SUV and writes what it finds as pictures: colour, normals, and occlusion + roughness + metal).
This only repacks it the way Mud Lab's Rock & Mud play model is packed (base/truck-rock-mud-50k.js, window.LR_TRUCK), so
src/ml-truck.js draws both the same way: window.ML_SUVB = {pieces: {body, wheel}, tex: {a, n, o}, tris}.
- body = the bake's body and hood in one mesh (what the hood hides is left out: the hood stays shut here);
- materials: the bake's 32 (baked) becomes 120, Mud Lab's baked material; its lamps (33 tail, 34 head, 35 amber, 36
  reversing) go back to the game's own lamp materials (7, 8, 10, 23), so they light; 2 and 3 stay the game's two
  glasses; 16 stays the dark underside;
- positions, normals and picture coordinates are written out as plain 32-bit numbers (the source packs them small);
- the normals' picture: the data file's is in the car's own axes (how that game's shader reads it); Mud Lab's shader
  reads normals in the surface's own frame (tangent space), as the Rock & Mud's are. The same bake wrote those too,
  into the .glb (skin_tnrm, wheel_tnrm): they are laid into the atlas in the data file's layout (the body's 2048
  square on top, the wheel's 1024 under it at the left)."""
import sys, os, json, base64, re, struct, io
import numpy as np
from PIL import Image
SRC = sys.argv[1]; R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(SRC, encoding='utf-8').read(); d = json.loads(s[s.index('BAKED_CARS.stock=') + len('BAKED_CARS.stock='):].rstrip().rstrip(';'))
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
def part(p):
    n = p['v']; bx = np.array(p['box'], np.float64)
    P = bx[:3] + np.frombuffer(base64.b64decode(p['P']), np.uint16)[:n * 3].reshape(-1, 3) / 65535 * bx[3:]
    N = np.frombuffer(base64.b64decode(p['N']), np.int8)[:n * 3].reshape(-1, 3) / 127
    U = np.frombuffer(base64.b64decode(p['U']), np.uint16)[:n * 2].reshape(-1, 2) / 65535
    M = np.frombuffer(base64.b64decode(p['M']), np.uint8)[:n].copy()
    I = np.frombuffer(base64.b64decode(p['I']), np.uint32 if p['i32'] else np.uint16)[:p['t'] * 3].astype(np.uint32)
    # (the lamps: back to the game's own lamp materials, so they are lit lenses, not dark painted glass)
    for k, g in ((33, 7), (34, 8), (35, 10), (36, 23)): M[M == k] = g
    M[M == 32] = 120
    return P.astype(np.float32), N.astype(np.float32), U.astype(np.float32), M, I
def pack(parts):
    P = np.concatenate([q[0] for q in parts]); N = np.concatenate([q[1] for q in parts]); U = np.concatenate([q[2] for q in parts]); M = np.concatenate([q[3] for q in parts])
    off = np.cumsum([0] + [len(q[0]) for q in parts])[:-1]; I = np.concatenate([q[4] + o for q, o in zip(parts, off)])
    i32 = len(P) > 65535
    return {'pos': b64(P), 'nrm': b64(N), 'uv': b64(U), 'mat': b64(M), 'idx': b64(I.astype(np.uint32 if i32 else np.uint16)), 'i32': bool(i32), 'n': int(len(I))}, int(len(I) // 3), sorted(set(M.tolist()))
body, tb, mb = pack([part(d['parts']['body']), part(d['parts']['hood'])]); wheel, tw, mw = pack([part(d['parts']['wheel'])])
strip = lambda u: u.split('base64,', 1)[1]
def glb_images(path):
    b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); bin0 = 20 + n + 8
    out = {}
    for im in j['images']:
        v = j['bufferViews'][im['bufferView']]; o = bin0 + v.get('byteOffset', 0); out[im['name']] = Image.open(io.BytesIO(b[o:o + v['byteLength']])).convert('RGB')
    return out
G = glb_images(sys.argv[2]); W, H, SK, WH = d['atlas']['w'], d['atlas']['h'], 2048, 1024
tn = Image.new('RGB', (W, H), (128, 128, 255)); tn.paste(G['skin_tnrm'].resize((SK, SK), Image.LANCZOS), (0, 0)); tn.paste(G['wheel_tnrm'].resize((WH, WH), Image.LANCZOS), (0, SK))
_b = io.BytesIO(); tn.save(_b, 'WEBP', quality=92, method=4); TN = base64.b64encode(_b.getvalue()).decode()
print('tangent normals from the .glb:', G['skin_tnrm'].size, G['wheel_tnrm'].size, 'atlas KB', len(TN) // 1024)
out = {'pieces': {'body': body, 'wheel': wheel}, 'tex': {'a': strip(d['atlas']['col']), 'n': TN, 'o': strip(d['atlas']['orm'])}, 'tris': tb + 4 * tw, 'atlas': [d['atlas']['w'], d['atlas']['h']]}
js = ("/* THE STOCK SUV'S PLAY MODEL, packed by tools/suv_pack.py from salt-mini-plus's bake of it (the Studio SUV baked onto the\n"
      "   game's own stock SUV: %d triangles, one %d x %d atlas of colour, normals, and occlusion + roughness + metal).\n"
      "   window.ML_SUVB. */\nwindow.ML_SUVB=%s;\n") % (out['tris'], d['atlas']['w'], d['atlas']['h'], json.dumps(out))
open(os.path.join(R, 'base', 'suv-stock-baked.js'), 'w', encoding='utf-8').write(js)
print('body', tb, 'tris, materials', mb, '| wheel', tw, 'tris x4, materials', mw, '| total', out['tris'], '| file MB', round(len(js) / 1e6, 2))
