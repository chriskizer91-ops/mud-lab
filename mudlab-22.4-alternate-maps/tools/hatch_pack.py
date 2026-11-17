"""A baked car's play model for Mud Lab, from salt-mini-plus's bake of it: tools/suv_pack.py made general (any car's
bake, any global name), first used for the Group B hatch (game build hatchB).
  python3 tools/hatch_pack.py DATA.js BAKED.glb [GLOBAL] [OUT.js] [LABEL]
  e.g. python3 tools/hatch_pack.py SMP/models/hatch-groupb/hatch-groupb_baked_data.js SMP/models/hatch-groupb/hatch-groupb_baked.glb
         ML_HATCHB base/hatch-groupb-baked.js "THE GROUP B HATCH"
  (SMP = a checkout of salt-mini-plus, branch beyond-the-last-road; GLOBAL defaults to ML_HATCHB, OUT.js to
  base/hatch-groupb-baked.js beside this tools folder, LABEL to the car's id in the data file. With the stock SUV's two
  files and ML_SUVB it writes what suv_pack.py writes.)
The source is that repo's own bake (models/tools/bake.py and pack_game.py; baked_glb.py for the .glb): Blender casts a
ray from every pixel of the game's own light car into the detailed Studio car and writes what it finds as pictures:
colour, normals, and occlusion + roughness + metal. The Group B's own bake wasn't in the repo (only its Studio model):
it was made with those same tools and the same settings as the stock SUV's and the stock hatch's (the body's picture
2048 square, the wheel's 1024, 32 occlusion samples).
This only repacks it the way Mud Lab's play models are packed (base/truck-rock-mud-50k.js, window.LR_TRUCK, and
base/suv-stock-baked.js, window.ML_SUVB), so src/ml-truck.js can draw it the same way:
window.<GLOBAL> = {pieces: {body, wheel}, tex: {a, n, o}, tris, atlas: [w, h]}.
- body = the bake's body and hood in one mesh (what the hood hides is left out: the hood stays shut here). Whatever
  the game's own car carries is in it as the bake has it: on the Group B the four spot lamps on the bonnet, the roof
  scoop, the big rear wing and the wide box flares;
- wheel = the bake's one wheel (the game draws it four times; it's the same front and rear), its axle along z, its
  centre at 0, 0, 0;
- each piece: pos, nrm (3 a corner), uv (2), all plain 32-bit numbers (the source packs them small), mat (a byte a
  corner), idx (16-bit, or 32-bit when i32), n (how many indices), all base64;
- materials: the bake's 32 (baked) becomes 120, Mud Lab's baked material; its lamps (33 tail and brake, 34 head,
  35 amber, 36 reversing) go back to the game's own lamp materials (7, 8, 10, 23), so they light: the Group B's spot
  lamps are headlamps to the game (8), so they light with the headlamps; 2 and 3 stay the game's two glasses; 16 stays
  the dark underside;
- the pictures, one atlas (2048 x 3072: the body's 2048 square on top, the wheel's 1024 under it at the left), WebP in
  base64: a = colour, o = occlusion + roughness + metal, both as the data file has them; n = normals. The data file's
  normals are in the car's own axes (how that game's shader reads them); Mud Lab's shader reads normals in the
  surface's own frame (tangent space), as the Rock & Mud's are. The same bake wrote those too, into the .glb
  (skin_tnrm, wheel_tnrm): they are laid into the atlas in the data file's layout."""
import sys, os, json, base64, re, struct, io
import numpy as np
from PIL import Image
if len(sys.argv) < 3: sys.exit(__doc__)
SRC, GLB = sys.argv[1], sys.argv[2]; R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = sys.argv[3] if len(sys.argv) > 3 else 'ML_HATCHB'
OUT = sys.argv[4] if len(sys.argv) > 4 else os.path.join(R, 'base', 'hatch-groupb-baked.js')
if not re.fullmatch(r'[A-Za-z_$][\w$]*', NAME): sys.exit('not a name for a global: ' + NAME)
# (the data file: var BAKED_CARS=...;BAKED_CARS.stock={...}; or BAKED_CARS["hatchB"]={...}; one car a file)
s = open(SRC, encoding='utf-8').read(); m = re.search(r'BAKED_CARS(?:\.([A-Za-z_$][\w$]*)|\[\s*["\']([^"\']+)["\']\s*\])\s*=\s*(?=\{)', s)
if not m: sys.exit('no BAKED_CARS[...]= in ' + SRC)
CAR = m.group(1) or m.group(2); d = json.loads(s[m.end():].rstrip().rstrip(';'))
LABEL = sys.argv[5] if len(sys.argv) > 5 else 'THE BAKED ' + CAR.upper()
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
# (the bake's lamps, back to the game's own lamp materials, so they are lit lenses, not dark painted glass)
LAMPS = ((33, 7), (34, 8), (35, 10), (36, 23)); BAKED, PLAIN = 120, (2, 3, 16)
def part(p):
    n = p['v']; bx = np.array(p['box'], np.float64)
    P = bx[:3] + np.frombuffer(base64.b64decode(p['P']), np.uint16)[:n * 3].reshape(-1, 3) / 65535 * bx[3:]
    N = np.frombuffer(base64.b64decode(p['N']), np.int8)[:n * 3].reshape(-1, 3) / 127
    U = np.frombuffer(base64.b64decode(p['U']), np.uint16)[:n * 2].reshape(-1, 2) / 65535
    M = np.frombuffer(base64.b64decode(p['M']), np.uint8)[:n].copy()
    I = np.frombuffer(base64.b64decode(p['I']), np.uint32 if p['i32'] else np.uint16)[:p['t'] * 3].astype(np.uint32)
    for k, g in LAMPS: M[M == k] = g
    M[M == 32] = BAKED
    return P.astype(np.float32), N.astype(np.float32), U.astype(np.float32), M, I
def pack(parts):
    parts = [q for q in parts if len(q[0])]
    P = np.concatenate([q[0] for q in parts]); N = np.concatenate([q[1] for q in parts]); U = np.concatenate([q[2] for q in parts]); M = np.concatenate([q[3] for q in parts])
    off = np.cumsum([0] + [len(q[0]) for q in parts])[:-1]; I = np.concatenate([q[4] + o for q, o in zip(parts, off)])
    i32 = len(P) > 65535
    return {'pos': b64(P), 'nrm': b64(N), 'uv': b64(U), 'mat': b64(M), 'idx': b64(I.astype(np.uint32 if i32 else np.uint16)), 'i32': bool(i32), 'n': int(len(I))}, int(len(I) // 3), {int(k): int((M[I[::3]] == k).sum()) for k in sorted(set(M.tolist()))}
# (a piece the bake wrote empty, as a car whose hood is part of its body: {'v': 0, 't': 0})
have = lambda k: k in d['parts'] and d['parts'][k].get('v')
body, tb, mb = pack([part(d['parts'][k]) for k in ('body', 'hood') if have(k)]); wheel, tw, mw = pack([part(d['parts']['wheel'])])
odd = sorted((set(mb) | set(mw)) - {BAKED} - set(PLAIN) - {g for _, g in LAMPS})
if odd: sys.exit('materials the drawing code does not know: %s' % odd)
strip = lambda u: u.split('base64,', 1)[1]
def glb_images(path):
    b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + n]); bin0 = 20 + n + 8
    out = {}
    for im in j['images']:
        v = j['bufferViews'][im['bufferView']]; o = bin0 + v.get('byteOffset', 0); out[im['name']] = Image.open(io.BytesIO(b[o:o + v['byteLength']])).convert('RGB')
    return out
G = glb_images(GLB); W, H, SK, WH = d['atlas']['w'], d['atlas']['h'], 2048, 1024
if (W, H) != (SK, SK + WH): sys.exit('the atlas is %d x %d, not the 2048 x 3072 this layout is for' % (W, H))
tn = Image.new('RGB', (W, H), (128, 128, 255)); tn.paste(G['skin_tnrm'].resize((SK, SK), Image.LANCZOS), (0, 0)); tn.paste(G['wheel_tnrm'].resize((WH, WH), Image.LANCZOS), (0, SK))
_b = io.BytesIO(); tn.save(_b, 'WEBP', quality=92, method=4); TN = base64.b64encode(_b.getvalue()).decode()
print('tangent normals from the .glb:', G['skin_tnrm'].size, G['wheel_tnrm'].size, 'atlas KB', len(TN) // 1024)
out = {'pieces': {'body': body, 'wheel': wheel}, 'tex': {'a': strip(d['atlas']['col']), 'n': TN, 'o': strip(d['atlas']['orm'])}, 'tris': tb + 4 * tw, 'atlas': [W, H]}
js = ("/* %s'S PLAY MODEL, packed by tools/hatch_pack.py from salt-mini-plus's bake of it (the Studio car baked onto the\n"
      "   game's own light car, build %s: %d triangles, one %d x %d atlas of colour, normals, and occlusion + roughness + metal).\n"
      "   window.%s. */\nwindow.%s=%s;\n") % (LABEL, CAR, out['tris'], W, H, NAME, NAME, json.dumps(out))
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True); open(OUT, 'w', encoding='utf-8').write(js)
print(CAR, '-> window.' + NAME, '| body', tb, 'tris, materials {material: triangles}', mb, '| wheel', tw, 'tris x4, materials', mw, '| total', out['tris'], '| file MB', round(len(js) / 1e6, 2), '|', OUT)
